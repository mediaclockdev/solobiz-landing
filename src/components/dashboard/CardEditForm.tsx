"use client";

import React, { useState, useEffect } from "react";
import { BusinessCard, FormSection } from "@/types/businessCard";
import { Button } from "@/components/ui/button";
import { DisplayForm } from "@/components/onboarding/forms/DisplayForm";
import { BusinessForm } from "@/components/onboarding/forms/BusinessForm";
import { SocialForm } from "@/components/onboarding/forms/SocialForm";
import { AboutForm } from "@/components/onboarding/forms/AboutForm";
import { AppointmentForm } from "@/components/onboarding/forms/AppointmentForm";
import { generateQRCodeWithLogo } from "@/utils/qrCodeGenerator";
import {
  saveBusinessCard,
  isUrlNameAvailable,
  generateUniqueUrlName,
} from "@/utils/cardStorage";
import { Save, Link as LinkIcon, Code, Instagram, ArrowRight, Plus } from "lucide-react";
import { TopActionButtons } from "@/components/TopActionButtons";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ContentForm } from "@/components/onboarding/forms/ContentForm";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// const sections = ["profile", "business", "social", "about", "cta"] as const;

interface CardEditFormProps {
  card: BusinessCard;
  onUpdate: (card: BusinessCard) => void;
}

export function CardEditForm({ card, onUpdate }: CardEditFormProps) {
  // const [currentSection, setCurrentSection] = useState<FormSection>("profile");
  const [currentSection, setCurrentSection] = useState<
    "display" | "bio" | "content"
  >("display");
  const [isContentEditing, setIsContentEditing] = useState(false);
  // "add" still counts as editing for layout, but the Add Content grid holds no
  // unsaved state of its own and has no footer bar of its own either, so Save
  // belongs there - being three screens deep with no Save in sight reads as a
  // bug. Only an item's detail form, which pins its own footer, hides it.
  const [contentScreen, setContentScreen] = useState<"root" | "add" | "detail">(
    "root",
  );
  // The Bio form has its own Save/Cancel while open, so the surrounding
  // chrome hides - same as the home page does via BusinessCardForm.
  const [isBioEditing, setIsBioEditing] = useState(false);
  const [accessoriesCount, setAccessoriesCount] = useState(0);
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;
    const fetchAccessoriesCount = async () => {
      try {
        const q = query(
          collection(db, "nfc_cards"),
          where("userId", "==", user.uid),
          where("status", "in", ["active", "disabled"])
        );
        const snap = await getDocs(q);
        setAccessoriesCount(snap.docs.length);
      } catch (error) {
        console.error("Failed to fetch accessories count", error);
      }
    };
    fetchAccessoriesCount();
  }, [user?.uid]);

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

  const copyImageServerSide = async (
    sourcePath: string,
    userId: string,
    cardId: string,
    imageType: string,
  ) => {
    const destPath = `cards/${year}/${month}/${day}/${userId}/${cardId}/${imageType}_copy_${Date.now()}.jpg`;
    try {
      const response = await fetch("/api/firebase-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingPath: sourcePath,
          userId,
          cardId,
          imageType,
        }),
      });

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.log("error", error);
    }
  };

  const handleSave = async () => {
    const formattedUrlName = (card.urlName || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    card.urlName = formattedUrlName;

    if (!card.urlName) {
      showToast("Card Name is required", "error");
      setCurrentSection("display");
      return;
    }

    // Check URL name uniqueness (excluding current card)
    // `await !fn()` negates the PROMISE, which is always truthy, so this
    // always evaluated to `await false` and the duplicate-name check never
    // ran. The await has to wrap the call before the result is negated.
    if (!(await isUrlNameAvailable(card.urlName, card.metadata.id))) {
      const suggestion = await generateUniqueUrlName(card.urlName);
      showToast(
        `"${card.urlName}" is already taken. Try "${suggestion}" instead.`,
        "error",
      );
      setCurrentSection("display");
      return;
    }

    if (!card.profile.firstName?.trim() || !card.profile.lastName?.trim()) {
      showToast("First name and last name are required", "error");
      setCurrentSection("bio");
      return;
    }

    // Validate Direct Ads selection
    if (
      card?.appointments?.appointmentType === "direct-ads" &&
      !card?.appointments?.directAds?.type
    ) {
      showToast("Direct ad type is required.", "error");
      setCurrentSection("content");
      return;
    }

    if (
      card?.appointments?.appointmentType === "call-to-action" &&
      !card?.appointments?.ctaLabel
    ) {
      showToast("Custom Button Text is required.", "error");
      setCurrentSection("content");

      return;
    }

    if (user) {
      let storedImage = null;
      let oldURl = null;
      const CARD_DOC_ID = "mainCard";
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.backupCard) {
          storedImage = data?.backupCard?.url;
          oldURl = data?.oldUrl?.url;
        } else {
          storedImage = null;
        }
      } else {
        storedImage = null;
      }

      let newURL = card.profilePhoto;
      if (!card.profilePhoto || card.profilePhoto == oldURl) {
        newURL = await copyImageServerSide(
          storedImage,
          user.uid,
          card.urlName,
          "profile",
        );
      }

      // QR CODE REGENERATION BLOCK
      let updatedQRCode = card.qrCode;
      try {
        const cardUrl = `${window.location.origin}/${card.urlName}`;

        // Use existing logo or fallback
        let logoFile: File | null = null;
        if (card.qrCode?.qrLogoUrl) {
          const res = await fetch(card.qrCode.qrLogoUrl);
          const blob = await res.blob();
          logoFile = new File([blob], "logo.png", { type: blob.type });
        } else {
          // fallback logo if none selected
          const res = await fetch(
            "/lovable-uploads/6e79eba6-9505-44d3-9af1-e8b13b7c46d0.png",
          );
          const blob = await res.blob();
          logoFile = new File([blob], "default-logo.png", { type: blob.type });
        }

        // Generate QR Code with updated brand color
        const qrDataUrl = await generateQRCodeWithLogo(cardUrl, logoFile, {
          width: 200,
          margin: 2,
          color: { dark: card.brandColor, light: "#FFFFFF" },
        });

        // Convert to blob for upload
        const qrBlob = await (await fetch(qrDataUrl)).blob();

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

        // Upload to Firebase Storage
        const storage = getStorage();
        const qrRef = ref(
          storage,
          `cards/${year}/${month}/${day}/${user.uid}/${card.id}/QRCode/qr_${card.metadata.id}.png`,
        );

        await uploadBytes(qrRef, qrBlob);
        const qrDownloadUrl = await getDownloadURL(qrRef);

        updatedQRCode = {
          colorSource: "brand",
          selectedColor: card.brandColor,
          qrCodeUrl: qrDownloadUrl,
          qrLogoUrl: card.qrCode?.qrLogoUrl || "",
          targetUrl: cardUrl,
        };
      } catch (qrError) {
        console.error("Failed to regenerate QR Code:", qrError);
      }

      const q = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );

      const formatPhone = (phone: string) => {
        if (!phone) return "";

        // If already formatted like phone intent → return as-is
        const pattern = /^\+\d{1,3}\s?\(\d{3}\)\s?\d{3}-\d{4}$/;
        if (pattern.test(phone)) return phone;

        // Clean digits but keep leading +
        const cleaned = phone.replace(/(?!^\+)\D/g, "");

        // Extract country code (1–3 digits)
        const match = cleaned.match(/^\+(\d{1,3})/);

        if (!match) return phone;

        const countryCode = match[0]; // "+1"
        const codeDigits = match[1]; // "1"
        const number = cleaned.slice(countryCode.length); // remaining digits

        // USA / Canada
        if (codeDigits === "1" && number.length === 10) {
          return `${countryCode} (${number.slice(0, 3)}) ${number.slice(
            3,
            6,
          )}-${number.slice(6)}`;
        }

        // Default fallback → group 3-3-3-...
        return `${countryCode} ${number.replace(/(\d{3})(?=\d)/g, "$1 ")}`;
      };

      getDocs(q)
        .then((querySnapshot) => {
          if (querySnapshot.empty) {
            saveBusinessCard(card);
            showToast("Card updated successfully", "success");
            return;
          }

          querySnapshot.forEach((docSnap) => {
            updateDoc(docSnap.ref, {
              urlName: card?.urlName,
              brandColor: card?.brandColor,
              // qrCode: card?.qrCode || "",
              qrCode: updatedQRCode,
              templateType: card?.templateType,
              cardLayout: card?.cardLayout,
              profilePhoto: newURL,
              coverImage: card?.coverImage || "",
              companyLogo: card?.companyLogo || "",
              profile: {
                firstName: card?.profile?.firstName || "",
                lastName: card?.profile?.lastName || "",
                title: card?.profile?.title || "",
                businessCategory: card?.profile?.businessCategory || "",
                department: card?.profile?.department || "",
                company: card?.profile?.company || "",
                accreditations: card?.profile?.accreditations || [],
                companySlogan: card?.profile?.companySlogan || "",
              },
              business: {
                phone: formatPhone(card?.business?.phone) || "",
                email: card?.business?.email || "",
                website: card?.business?.website || "",
                address: {
                  street: card?.business?.address?.street || "",
                  city: card?.business?.address?.city || "",
                  state: card?.business?.address?.state || "",
                  zip: card?.business?.address?.zip || "",
                  country: card?.business?.address?.country || "",
                },
              },
              social: {
                linkedin: card?.social?.linkedin || "",
                twitter: card?.social?.twitter || "",
                facebook: card?.social?.facebook || "",
                instagram: card?.social?.instagram || "",
                youtube: card?.social?.youtube || "",
                tiktok: card?.social?.tiktok || "",
                // These nine were absent, so any link saved to them was wiped
                // on every save while the UI reported success.
                pinterest: card?.social?.pinterest || "",
                vimeo: card?.social?.vimeo || "",
                snapchat: card?.social?.snapchat || "",
                twitch: card?.social?.twitch || "",
                whatsapp: card?.social?.whatsapp || "",
                discord: card?.social?.discord || "",
                wechat: card?.social?.wechat || "",
                telegram: card?.social?.telegram || "",
                signal: card?.social?.signal || "",
              },
              about: {
                bio: card?.about?.bio || "",
                sectionTitle: card?.about?.sectionTitle || "",
                customSectionTitle: card?.about?.customSectionTitle || "",
                skills: card?.about?.skills || [],
              },
              appointments: {
                appointmentType: card?.appointments?.appointmentType || "",
                calendlyUrl: card?.appointments?.calendlyUrl || "",
                ctaLabel: card?.appointments?.ctaLabel || "",
                ctaUrl: card?.appointments?.ctaUrl || "",
                platform: card?.appointments?.platform || "",
                googleUrl: card?.appointments?.googleUrl || "",
                directAds: {
                  type: card?.appointments?.directAds?.type ?? "",
                  image: card?.appointments?.directAds?.image || "",
                  /* updateDoc writes only the keys it is given, so anything
                     missing here is dropped on save. These four are not
                     editable yet, but the card already reads `title`. */
                  title: card?.appointments?.directAds?.title || "",
                  description: card?.appointments?.directAds?.description || "",
                  price: card?.appointments?.directAds?.price || "",
                  url: card?.appointments?.directAds?.url || "",
                },
              },
              /* The Content tab lives entirely in these three fields, and none
                 of them were in this payload - so adding a Document, a payment
                 or music link, a custom title, or reordering the list was
                 discarded on save while the toast still said "updated
                 successfully". updateDoc only writes the keys it is given; it
                 does not merge the rest of the object. */
              profileContentOrder: card?.profileContentOrder || [],
              contentLinks: card?.contentLinks || {},
              contentTitles: card?.contentTitles || {},
              // Display-tab settings, also previously dropped.
              iconStyle: card?.iconStyle || "round",
              iconVariant: card?.iconVariant || "standard",
              theme: card?.theme || "light",
              metadata: {
                id: card?.metadata?.id || "",
                favorite: card?.metadata?.favorite || "",
                isPublic: card?.metadata?.isPublic ?? false,
                createdAt: card?.metadata?.createdAt || "",
                updatedAt: new Date() || "",
                slug: card?.metadata?.slug || "",
                tags: card?.metadata?.tags || [],
                cardType: user?.planType,
              },
            });
          });

          showToast("Card updated successfully!", "success");
          setTimeout(() => {
            window.location.href = window.location.href;
          }, 2000);
        })
        .catch((error) => {
          console.error("Error saving card:", error);
          showToast("Failed to save card", "error");
        });
    } else {
      saveBusinessCard(card);
      showToast("Card updated successfully", "success");
    }
  };

  return (
    <div className="space-y-6 bg-background p-6 rounded-lg border shadow-sm">
      {/* Section Navigation */}
      {/* <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <Button
            key={section}
            variant={currentSection === section ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentSection(section)}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0"
          >
            {section === "cta"
              ? "CTA"
              : section.charAt(0).toUpperCase() + section.slice(1)}
          </Button>
        ))}
      </div> */}

      {/* Top action buttons */}
      {!isContentEditing && !isBioEditing && (
        <TopActionButtons
          urlName={card.urlName}
          cardId={card.metadata.id}
          accessoriesCount={accessoriesCount}
        />
      )}

      {/* Section Navigation */}
      {!isContentEditing && !isBioEditing && (
        <Tabs
          defaultValue="display"
          value={currentSection}
          className="w-full"
          onValueChange={(val) => setCurrentSection(val as any)}
        >
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800/50 h-auto p-1 rounded-full">
            <TabsTrigger
              value="display"
              className="h-10 rounded-full hover:border-0 data-[state=active]:border-none data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider"
            >
              Display
            </TabsTrigger>
            <TabsTrigger
              value="bio"
              className="h-10 rounded-full hover:border-0 data-[state=active]:border-none data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider"
            >
              Bio
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="h-10 rounded-full hover:border-0 data-[state=active]:border-none data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider"
            >
              Content
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Form Sections */}
      {/* <div className="space-y-4">
        {currentSection === "profile" && (
          <DisplayForm card={card} onUpdate={onUpdate} isEditMode={true} />
        )}
        {currentSection === "business" && (
          <BusinessForm card={card} onUpdate={onUpdate} isEditMode={true} />
        )}
        {currentSection === "social" && (
          <SocialForm card={card} onUpdate={onUpdate} isEditMode={true} />
        )}
        {currentSection === "about" && (
          <AboutForm card={card} onUpdate={onUpdate} isEditMode={true} />
        )}
        {currentSection === "cta" && (
          <AppointmentForm card={card} onUpdate={onUpdate} isEditMode={true} />
        )}
      </div> */}

      {/* Form Sections */}
      <div className="space-y-4">
        {currentSection === "display" && (
          <DisplayForm card={card} onUpdate={onUpdate} isEditMode={true} />
        )}
        {currentSection === "bio" && (
          <BusinessForm
            card={card}
            onUpdate={onUpdate}
            isEditMode={true}
            onEditingChange={setIsBioEditing}
          />
        )}
        {currentSection === "content" && (
          <ContentForm
            card={card}
            onUpdate={onUpdate}
            onEditStateChange={setIsContentEditing}
            onScreenChange={setContentScreen}
            isEditMode={true}
          />
        )}
      </div>

      {contentScreen !== "detail" && !isBioEditing && (
        /* pt-4, not pt-6: the parent is space-y-6, so this block already sits
           24px below whatever precedes it. Its own padding stacks on top of
           that - together with the sub-screen's own trailing padding it left a
           ~96px band under the last "Show more". */
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button 
            onClick={handleSave} 
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <Save size={18} />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
