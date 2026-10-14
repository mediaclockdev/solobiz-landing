"use client";
import React, { useEffect, useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Upload, Lock, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays } from "date-fns";
import UpgradeModal from "@/components/UpgradeModal";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import imageCompression from "browser-image-compression";
import { applyBodyScrollLock } from "@/utils/scrollLock";
import {
  deriveAppointmentType,
  derivePlatform,
} from "@/utils/appointments";

export function AppointmentForm({
  card,
  onUpdate,
  isEditMode,
  selectedTab = "local",
}: FormComponentProps) {
  const [dragActive, setDragActive] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [modelMsg, setModelMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [trialDays, setTrialDays] = useState<number | null>(null);

  const storage = getStorage();

  useEffect(() => applyBodyScrollLock(showWarning), [showWarning]);

  function parseCreatedAt(input: any) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  useEffect(() => {
    if (!user) return;

    const isFree = user?.planType === "free";
    setIsFreePlan(isFree);

    const createdAt = parseCreatedAt(user?.createdAt);
    const trialEnd = new Date(
      createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000,
    );
    const trialActive = new Date() <= trialEnd;
    setIsTrialActive(trialActive);
  }, [user]);
  const isProLocked = selectedTab != "local" && isFreePlan && !isTrialActive;

  /**
   * Call-to-Action, Direct Ads, Calendly and Google Calendar are independent -
   * each appears on the card when it has its own data.
   *
   * `appointmentType` is no longer picked in this form. It is derived from the
   * resulting data so the Marketplace filters (which key on "direct-ads")
   * stay correct and agree with the Content tab. See utils/appointments.ts.
   */
  const commitAppointments = (appointments: (typeof card)["appointments"]) => {
    const updatedCard = { ...card, appointments };
    updatedCard.appointments.appointmentType =
      deriveAppointmentType(updatedCard);
    const platform = derivePlatform(updatedCard);
    if (platform) updatedCard.appointments.platform = platform;
    onUpdate(updatedCard);
  };

  const handleInputChange = (field: string, value: string) => {
    commitAppointments({ ...card.appointments, [field]: value });
  };

  const handleDirectAdsChange = (field: string, value: string) => {
    commitAppointments({
      ...card.appointments,
      directAds: { ...card.appointments.directAds, [field]: value },
    });
  };

  function getDaySuffix(day) {
    if (day >= 11 && day <= 13) return `${day}th`;
    switch (day % 10) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  }

  const now = new Date();
  const year = now.getFullYear(); // 2025
  const month = now.toLocaleString("en-US", { month: "long" }); // Nov
  const day = getDaySuffix(now.getDate());

  /**
   * ✅ Upload Direct Ads image to Firebase Storage
   */
  const uploadDirectAdsImage = async (
    file: File,
    oldUrl?: string | null,
  ): Promise<string> => {
    const filePath = `/cards/${year}/${month}/${day}/${user?.uid}/${
      card.id
    }/directAds/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    if (oldUrl) {
      try {
        const oldRef = ref(storage, oldUrl);
        await deleteObject(oldRef);
      } catch (err) {
        console.warn("Old Direct Ads image could not be deleted:", err);
      }
    }

    return downloadURL;
  };

  /**
   * ✅ Handle Direct Ads Upload
   */
  // const handleImageUpload = async (file: File) => {
  //   if (!user?.uid) {
  //     setModelMsg("You must be logged in to upload Direct Ads images.");
  //     setShowSignIn(true);
  //     return;
  //   }

  //   if (file.size > 5 * 1024 * 1024) {
  //     alert("File must be under 5MB.");
  //     return;
  //   }

  //   try {
  //     setIsUploading(true);

  //     const oldUrl = card.appointments.directAds?.image || null;
  //     const downloadURL = await uploadDirectAdsImage(file, oldUrl);

  //     const updatedCard = {
  //       ...card,
  //       appointments: {
  //         ...card.appointments,
  //         directAds: {
  //           ...card.appointments.directAds,
  //           image: downloadURL,
  //         },
  //       },
  //     };

  //     if (card.id) {
  //       await updateDoc(doc(db, "cards", card.id), updatedCard);
  //     }

  //     onUpdate(updatedCard);
  //   } catch (err) {
  //     console.error("Failed to upload Direct Ads image:", err);
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const updateMarketplaceAdImage = async (
    sourceCardId: string,
    url: string,
  ) => {
    const q = query(
      collection(db, "marketplace_ads"),
      where("sourceCardId", "==", sourceCardId),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn("No marketplace ad found for sourceCardId:", sourceCardId);
      return;
    }

    const adDoc = snapshot.docs[0];
    await updateDoc(doc(db, "marketplace_ads", adDoc.id), {
      image: url,
      updatedAt: new Date(),
    });
  };

  const handleImageUpload = async (file: File) => {
    if (isProLocked && selectedTab != "local") {
      setModelMsg("You must be logged in to upload Direct Ads images.");
      setShowSignIn(true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      const options = {
        maxSizeMB: 0.18,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      let url = "";
      if (user?.uid) {
        const oldUrl = card.appointments.directAds?.image || null;
        const downloadURL = await uploadDirectAdsImage(compressedFile, oldUrl);
        const updatedCard = {
          ...card,
          appointments: {
            ...card.appointments,
            directAds: {
              ...card.appointments.directAds,
              image: downloadURL,
            },
          },
        };

        if (card.id) {
          await updateDoc(doc(db, "cards", card.id), updatedCard);
        }
        onUpdate(updatedCard);
        await updateMarketplaceAdImage(card.metadata.id, downloadURL);
      } else {
        url = await fileToDataURL(compressedFile);
        const updatedCard = {
          ...card,
          appointments: {
            ...card.appointments,
            directAds: {
              ...card.appointments.directAds,
              image: url,
            },
          },
        };
        onUpdate(updatedCard);
        await updateMarketplaceAdImage(card.metadata.id, url);
        localStorage.setItem(`card_${card.id}`, JSON.stringify(updatedCard));
      }
    } catch (err) {
      console.error("Failed to upload Direct Ads image:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith("image/")) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const canShowCustomSection = () => {
    if (selectedTab == "local") {
      return true;
    }
    // Block premium features if user is not logged in
    if (!user) return false;
    if (user?.planType !== "free") return true;
    if (!user?.createdAt) return false;
    if (trialDays === null) return false;

    let createdDate: Date;
    if (typeof user?.createdAt === "string") {
      createdDate = new Date(user?.createdAt);
    } else if ("seconds" in user?.createdAt) {
      //@ts-ignore
      createdDate = new Date(user?.createdAt?.seconds * 1000);
    } else {
      return false;
    }

    const today = new Date();
    const daysSinceCreated = differenceInDays(today, createdDate);
    return daysSinceCreated <= trialDays;
  };

  useEffect(() => {
    const fetchTrialDays = async () => {
      try {
        if (user) {
          const userRef = doc(db, "users", user?.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) throw new Error("User not found");
          const userData = userSnap.data() as any;
          if (userData) {
            const period = Number(userData.freeTrialPeriod);
            setTrialDays(!isNaN(period) ? period : 0);
          }
        } else {
          const settingsRef = doc(db, "settings", "PricingRequirement");
          const snap = await getDoc(settingsRef);
          if (snap.exists()) {
            const data = snap.data();
            const period = Number(data.freeTrialPeriod);
            setTrialDays(!isNaN(period) ? period : 0);
          } else {
            setTrialDays(0); // no trial if missing
          }
        }
      } catch (err) {
        console.error("Failed to fetch trial days:", err);
        setTrialDays(0);
      }
    };

    fetchTrialDays();
  }, [user]);

  /* Premium gate, matching what the removed radio handler enforced:
     isProLocked covers an expired trial, canShowCustomSection covers the
     logged-out and no-trial-data cases. */
  const isPremiumLocked = isProLocked || !canShowCustomSection();

  const premiumBadge = isPremiumLocked ? (
    <button
      type="button"
      onClick={() => setShowWarning(true)}
      className="ml-1 inline-flex items-center gap-1 text-xs text-yellow-600 underline"
    >
      <Lock size={14} className="text-yellow-500" />
      Upgrade
    </button>
  ) : (
    <Crown size={14} className="ml-1 text-yellow-500" />
  );

  return (
    <div className="space-y-4">
      {/* These four used to be radio options - one setting, one winner.
          They are independent now, so there is nothing to choose between. */}
      <div>
        <Label className="text-base font-medium mb-1 block">
          Appointments &amp; Promotions
        </Label>
        <p className="text-gray-500 text-sm">
          Fill in whichever you need. A Call-to-Action, an ad and your booking
          links can all appear on the card at once - each one shows up as soon
          as it has content.
        </p>
        <p className="text-gray-500 mt-1 text-sm">
          You must log in to use Pro Features. Sign-up is Free!
        </p>
      </div>

      {/* Booking links. Calendly and Google Calendar are independent: fill in
          either or both, and each gets its own button on the card. The old
          "Choose Scheduler" radio wrote `appointments.platform`, which holds a
          single value and so hid whichever link it did not name. */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Booking Links</Label>

        <div className="space-y-2">
          <Label htmlFor="calendlyUrl" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendly URL
          </Label>
          <Input
            id="calendlyUrl"
            type="url"
            placeholder="https://calendly.com/john-doe"
            value={card.appointments.calendlyUrl || ""}
            onChange={(e) => handleInputChange("calendlyUrl", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Example: <code>https://calendly.com/john-doe</code>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="googleUrl" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Google Calendar URL
          </Label>
          <Input
            id="googleUrl"
            type="url"
            placeholder="https://calendar.google.com/calendar/u/0/r/eventedit"
            value={card.appointments.googleUrl || ""}
            onChange={(e) => handleInputChange("googleUrl", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Example:{" "}
            <code>
              https://calendar.google.com/calendar/u/0/r/eventedit?someparams
            </code>
          </p>
        </div>
      </div>

      {/* Call-to-Action */}
      <div className="space-y-4">
        <Label className="flex items-center gap-1 text-sm font-medium">
          Call-to-Action
          {premiumBadge}
        </Label>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ctaLabel">
              Custom Button Text <span className="text-red-500"> *</span>
            </Label>
            <Input
              disabled={isPremiumLocked}
              id="ctaLabel"
              placeholder="Schedule Meeting, Get Quote, Contact Me"
              value={card.appointments.ctaLabel || ""}
              onChange={(e) => handleInputChange("ctaLabel", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctaUrl">Custom Button URL</Label>
            <Input
              disabled={isPremiumLocked}
              id="ctaUrl"
              type="url"
              placeholder="https://example.com/contact"
              value={card.appointments.ctaUrl || ""}
              onChange={(e) => handleInputChange("ctaUrl", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Direct Ads */}
      <div className="space-y-4">
        <Label className="flex items-center gap-1 text-sm font-medium">
          Direct Ads
          {premiumBadge}
        </Label>
        <div className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>
              Direct Ads Type<span className="text-red-500"> *</span>
            </Label>
            <Select
              disabled={isPremiumLocked}
              value={card.appointments.directAds?.type || ""}
              onValueChange={(value) => handleDirectAdsChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select One" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Event">Event</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>
              {card.appointments.directAds?.type || "Product"} Image
            </Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {card.appointments.directAds?.image ? (
                <div className="space-y-2">
                  <img
                    src={card.appointments.directAds.image}
                    alt="Uploaded"
                    className="max-w-full h-32 object-contain mx-auto rounded"
                  />
                  <p className="text-sm text-gray-600">
                    {isUploading
                      ? "Uploading..."
                      : "Image uploaded successfully"}
                  </p>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm">
                      Change image
                    </span>
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-gray-600">
                    {isUploading
                      ? "Uploading..."
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-gray-500">
                    JPG, PNG or GIF (max. 5MB)
                  </p>
                  <p className="text-xs text-gray-500">
                    For optimal results, please use dimensions up to 8.5" x 11".
                  </p>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
                      Browse files
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onShowSignUp={() => {
          setShowSignIn(false);
          setIsSignUpOpen(true);
        }}
        message={modelMsg}
      />
      {isSignUpOpen && (
        <SignUpModal
          isOpen={isSignUpOpen}
          onClose={() => setIsSignUpOpen(false)}
          onShowSignIn={() => {
            setIsSignUpOpen(false);
            setShowSignIn(true);
          }}
        />
      )}
      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}
