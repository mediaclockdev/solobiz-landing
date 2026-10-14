"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import { BusinessCardFormProps, FormSection } from "@/types/businessCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DisplayForm } from "./forms/DisplayForm";
import { BusinessForm } from "./forms/BusinessForm";
import { SocialForm } from "./forms/SocialForm";
import { AboutForm } from "./forms/AboutForm";
import { AppointmentForm } from "./forms/AppointmentForm";
import { WelcomeModal } from "./WelcomeModal";
import { BusinessCardPreview } from "./BusinessCardPreview";
import { TopActionButtons } from "../TopActionButtons";
import { generateVCard } from "@/utils/businessCard";
import * as htmlToImage from "html-to-image";

import {
  saveBusinessCard,
  isUrlNameAvailable,
  generateUniqueUrlName,
  saveSessionBusinessCard,
  SESSION_STORAGE_KEY,
  loadSessionBusinessCards,
} from "@/utils/cardStorage";
import { hasUserAccount } from "@/utils/userStorage";
import {
  Image as ImageIcon,
  Contact2,
  Save,
  LayoutGrid,
  Download,
  Eye,
  Link as LinkIcon,
  Code,
  Instagram,
  ArrowRight,
  Plus,
  Settings,
} from "lucide-react";

import { useToast } from "@/contexts/ToastContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
// import { metadata } from "@/app/layout";

import { useAuth } from "@/contexts/AuthContext";
import {
  getBlob,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import SignUpModal from "../SignUpModal";
import SignInModal from "../SignInModal";
import ForgotPasswordModal from "../ForgotPasswordModal";
import UpgradeModal from "../UpgradeModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { ContentForm } from "./forms/ContentForm";
import { Logo } from "@/components/ui/Logo";

const sections = ["display", "business", "social", "about", "cta"] as const;

export function BusinessCardForm({
  card,
  onUpdate,
  isEditMode,
  currentSection,
  onSectionChange,
  getFullName,
  hasUnsavedChanges,
  selectedTab = null,
  onHandleSave,
}: BusinessCardFormProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isForgotOpen, setForgotOpen] = useState(false);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false); // closed by default
  const [setupTab, setSetupTab] = useState<
    "all" | "display" | "bio" | "content"
  >("display");
  const [isContentEditing, setIsContentEditing] = useState(false);
  /**
   * Which Content sub-screen is open. isContentEditing collapses "add" and
   * "detail" into one boolean, which is why the page footer disappeared on
   * Add Content as well as on an item's form. Only the item form pins a
   * footer of its own ("Add"/"Save"), so only that one needs the page
   * footer out of the way.
   */
  const [contentScreen, setContentScreen] = useState<
    "root" | "add" | "detail"
  >("root");
  const [isBioEditing, setIsBioEditing] = useState(false);
  const [accessoriesCount, setAccessoriesCount] = useState(0);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // The preview toggle only applies below lg: on desktop the form is always
  // shown (`hidden md:flex`), so a stale `true` here would leave the footer
  // button reading "Setup" while setup is plainly visible.
  useEffect(() => {
    const syncToBreakpoint = () => {
      if (window.innerWidth >= 768) setShowMobilePreview(false);
    };
    syncToBreakpoint();
    window.addEventListener("resize", syncToBreakpoint);
    return () => window.removeEventListener("resize", syncToBreakpoint);
  }, []);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;
    const fetchAccessoriesCount = async () => {
      try {
        const q = query(
          collection(db, "nfc_cards"),
          where("userId", "==", user.uid),
          where("status", "in", ["active", "disabled"]),
        );
        const snap = await getDocs(q);
        setAccessoriesCount(snap.docs.length);
      } catch (error) {
        console.error("Failed to fetch accessories count", error);
      }
    };
    fetchAccessoriesCount();
  }, [user?.uid]);

  const [storedImage, setStoredImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);

  const CARD_DOC_ID = "mainCard";
  const fetchImage = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.backupCard) {
          setStoredImage(data.backupCard);
        } else {
          setStoredImage(null);
        }
      } else {
        setStoredImage(null);
      }
    } catch (err) {
      console.error("Failed to fetch image:", err);
    }
  };

  useEffect(() => {
    fetchImage();
  }, []);

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
    //const destPath = `cards/${userId}/${cardId}/${imageType}_copy_${Date.now()}.jpg`;
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
    if (card.urlName === "" || !card.urlName?.trim()) {
      showToast("Card Name is required.", "error");
      onSectionChange("display");
      return;
    }

    if (
      !isEditMode &&
      (card.metadata.isPublic === undefined || card.metadata.isPublic === null)
    ) {
      showToast("Card Visibility selection is required", "error");
      onSectionChange("display");
      return;
    }

    // See the note in CardEditForm: `await !fn()` negates the promise, not
    // the result, so this check never fired.
    if (
      !(await isUrlNameAvailable(
        card.urlName,
        isEditMode ? card.metadata.id : undefined,
      ))
    ) {
      const suggestion = await generateUniqueUrlName(card.urlName);
      showToast(
        `"${card.urlName}" is already taken. Try "${suggestion}" instead.`,
        "error",
      );
      onSectionChange("display");
      return;
    }

    if (!card.profile.firstName?.trim()) {
      showToast("First name is required", "error");
      onSectionChange("business");
      return;
    }

    if (!card.profile.lastName?.trim()) {
      showToast("Last name is required", "error");
      onSectionChange("business");
      return;
    }

    // Validate Direct Ads selection
    if (
      card?.appointments?.appointmentType === "direct-ads" &&
      !card?.appointments?.directAds?.type
    ) {
      showToast("Direct ad type is required.", "error");
      onSectionChange("cta"); // or whichever section contains this field
      return;
    }

    // Apply default profile image if none selected
    const cardToSave = { ...card };
    if (!cardToSave.profilePhoto?.trim()) {
      cardToSave.profilePhoto = storedImage?.url;
    }

    if (!user) {
      setIsSignUpOpen(true);
      return;
    } else if ((user && selectedTab == null) || selectedTab !== "local") {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        const q = query(
          collection(db, "cards"),
          where("urlName", "==", card.urlName),
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          showToast("Card name already exists", "error");
          return;
        }

        const planType = userData.planType || "free";

        if (planType === "free" && !isEditMode) {
          const q = query(
            collection(db, "cards"),
            where("uid", "==", user.uid),
          );
          const snapshot = await getDocs(q);
          if (snapshot.size >= 2) {
            setShowWarning(true);
            // showToast(
            //   "Free plan allows only 2 cards. Upgrade to create unlimited cards.",
            //   "error"
            // );
            return;
          }
        }

        let newURL = card.profilePhoto;

        if (!card.profilePhoto || card.profilePhoto == "") {
          newURL = await copyImageServerSide(
            storedImage.url,
            user.uid,
            card.urlName,
            "profile",
          );
        }

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

        await setDoc(doc(db, "cards", card.urlName), {
          profilePhoto: newURL,
          uid: user.uid,
          isActive: false,
          urlName: card.urlName,
          brandColor: card.brandColor,
          templateType: card.templateType,
          cardLayout: card.cardLayout,
          profile: {
            firstName: card.profile.firstName || "",
            lastName: card.profile.lastName || "",
            title: card.profile.title || "",
            businessCategory: card.profile.businessCategory || "",
            department: card.profile.department || "",
            company: card.profile.company || "",
            accreditations: card.profile.accreditations || [],
            companySlogan: card.profile.companySlogan || "",
          },
          business: {
            phone: formatPhone(card.business.phone) || "",
            email: card.business.email || "",
            website: card.business.website || "",
            address: {
              street: card.business.address.street || "",
              city: card.business.address.city || "",
              state: card.business.address.state || "",
              zip: card.business.address.zip || "",
              country: card.business.address.country || "",
            },
          },
          social: {
            linkedin: card.social.linkedin || "",
            twitter: card.social.twitter || "",
            facebook: card.social.facebook || "",
            instagram: card.social.instagram || "",
            youtube: card.social.youtube || "",
            tiktok: card.social.tiktok || "",
            pinterest: card.social.pinterest || "",
            vimeo: card.social.vimeo || "",
            snapchat: card.social.snapchat || "",
            twitch: card.social.twitch || "",
            whatsapp: card.social.whatsapp || "",
            discord: card.social.discord || "",
            wechat: card.social.wechat || "",
            telegram: card.social.telegram || "",
            signal: card.social.signal || "",
          },
          about: {
            bio: card.about.bio ?? "",
            sectionTitle:
              card?.about?.sectionTitle ??
              card?.about?.customSectionTitle ??
              "",
            skills: card?.about?.skills ?? [],
            sectionType: card?.about?.sectionType ?? "",
          },
          appointments: {
            appointmentType: card.appointments.appointmentType || "",
            calendlyUrl: card.appointments.calendlyUrl || "",
            ctaLabel: card.appointments.ctaLabel || "",
            ctaUrl: card.appointments.ctaUrl || "",
            platform: card.appointments.platform || "calendly",
            googleUrl: card.appointments.googleUrl || "",
            directAds: {
              type: card?.appointments?.directAds?.type ?? "",
              image: card?.appointments?.directAds?.image || "",
              title: card?.appointments?.directAds?.title || "",
              description: card?.appointments?.directAds?.description || "",
              price: card?.appointments?.directAds?.price || "",
              url: card?.appointments?.directAds?.url || "",
            },
          },
          /* setDoc replaces the whole document, so any field left out of
             this payload is wiped from the card. The Content tab lives
             entirely in these three, and the design settings in the rest. */
          profileContentOrder: card?.profileContentOrder || [],
          contentLinks: card?.contentLinks || {},
          contentTitles: card?.contentTitles || {},
          iconStyle: card?.iconStyle || "round",
          iconVariant: card?.iconVariant || "standard",
          theme: card?.theme || "light",
          // cardView: 0,
          // cardShare: 0,
          // leadsGenerated: 0,
          // linkClick: 0,
          // adsView: 0,
          // saveContact: 0,
          cardView: card?.cardView || 0,
          cardShare: card?.cardShare || 0,
          leadsGenerated: card?.leadsGenerated || 0,
          linkClick: card?.linkClick || 0,
          adsView: card?.adsView || 0,
          saveContact: card?.saveContact || 0,
          metadata: {
            id: card.metadata.id || "",
            favorite: card.metadata.favorite || "",
            isPublic: card.metadata.isPublic,
            createdAt: card.metadata.createdAt || "",
            slug: card.metadata.slug || "",
            tags: card.metadata.tags || [],
            cardType: userData.planType,
          },
        });
      } catch (error) {
        console.error("Error saving card:", error);
        showToast("Failed to save card", "error");
      }
    } else {
      saveBusinessCard(cardToSave);
    }

    showToast(
      isEditMode ? "Card updated successfully" : "Card saved successfully",
      "success",
    );
    if (isEditMode) {
      navigate("/dashboard/cards");
    } else {
      const userAlreadyExists = hasUserAccount();
      if (userAlreadyExists) {
        navigate(`/dashboard/cards?selectedTab=${selectedTab ?? "favorites"}`);
      } else {
        if (selectedTab == "local") {
          navigate(`/dashboard/cards?selectedTab=${selectedTab}`);
          setTimeout(() => {
            window.location.href = `/dashboard/cards?selectedTab=${selectedTab}`;
          }, 300);
        } else {
          navigate(
            `/dashboard/cards?selectedTab=${selectedTab ?? "favorites"}`,
          );
        }
      }
    }
  };

  const handleDownloadImage = async () => {
    const previewElement = document.querySelector(
      ".card-preview",
    ) as HTMLElement;

    if (!previewElement) {
      showToast("Unable to find card preview", "error");
      return;
    }

    try {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => (img.onload = img.onerror = resolve)),
          ),
      );

      const clone = previewElement.cloneNode(true) as HTMLElement;

      // Disable transitions/animations
      clone.querySelectorAll("*").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.transition = "none";
        elem.style.animation = "none";
      });

      // Replace Firebase images with proxy URLs
      const images = clone.querySelectorAll("img");
      images.forEach((img) => {
        if (img.src.startsWith("https://firebasestorage.googleapis.com")) {
          const bust = Date.now(); // unique timestamp each call
          img.src = `/api/proxy-image?url=${encodeURIComponent(
            img.src,
          )}&t=${bust}`;
        }
      });

      // Offscreen container
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      container.style.width = "0";
      container.style.height = "0";
      container.style.overflow = "hidden";
      container.style.opacity = "0";
      container.style.pointerEvents = "none";
      container.style.zIndex = "-9999";

      clone.style.position = "relative";
      clone.style.width = `${previewElement.scrollWidth}px`;
      clone.style.height = `${previewElement.scrollHeight}px`;
      clone.style.overflow = "visible";
      clone.style.background = "#ffffff";
      clone.style.transform = "none";
      clone.style.scale = "1";
      clone.style.opacity = "1";
      // clone.style.borderRadius = "20px";
      clone.style.overflow = "hidden";

      container.appendChild(clone);
      document.body.appendChild(container);
      await new Promise((r) => requestAnimationFrame(r));

      const htmlToImage = await import("html-to-image");
      const dataUrl = await htmlToImage.toPng(clone, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        quality: 1,
        style: {
          width: `${previewElement.scrollWidth}px`,
          height: `${previewElement.scrollHeight}px`,
          transform: "none",
          overflow: "visible",
          // borderRadius: "60px",
        },
      });

      container.remove();

      // Add footer
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d");
      const footerHeight = 40;
      const borderRadius = 20;

      finalCanvas.width = img.width;
      finalCanvas.height = img.height + footerHeight;

      if (ctx) {
        // Create rounded path for entire card (image + footer)
        ctx.beginPath();
        ctx.moveTo(borderRadius, 0);
        ctx.lineTo(finalCanvas.width - borderRadius, 0);
        ctx.quadraticCurveTo(
          finalCanvas.width,
          0,
          finalCanvas.width,
          borderRadius,
        );
        ctx.lineTo(finalCanvas.width, finalCanvas.height - borderRadius);
        ctx.quadraticCurveTo(
          finalCanvas.width,
          finalCanvas.height,
          finalCanvas.width - borderRadius,
          finalCanvas.height,
        );
        ctx.lineTo(borderRadius, finalCanvas.height);
        ctx.quadraticCurveTo(
          0,
          finalCanvas.height,
          0,
          finalCanvas.height - borderRadius,
        );
        ctx.lineTo(0, borderRadius);
        ctx.quadraticCurveTo(0, 0, borderRadius, 0);
        ctx.closePath();
        ctx.clip();

        // White background fills *within* rounded area only
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        // Draw the main image
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Footer background (still inside the same clip)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, img.height, finalCanvas.width, footerHeight);

        // Footer text
        ctx.fillStyle = "rgba(102, 102, 102, 0.7)";
        ctx.font = "italic 22px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "Created free by: https://solobizcards.com",
          finalCanvas.width / 2,
          img.height + footerHeight / 2,
        );
      }

      const link = document.createElement("a");
      link.download = `${card.profile.firstName || "business"}-${
        card.profile.lastName || "card"
      }.png`;
      link.href = finalCanvas.toDataURL("image/png");
      link.click();

      showToast("Business card image downloaded successfully", "success");
    } catch (error) {
      console.error("Error generating image:", error);
      showToast("Failed to generate image", "error");
    }
  };

  const handleDownloadVCard = async () => {
    if (!card.profile.firstName?.trim()) {
      showToast("First name is required", "error");
      onSectionChange("business");
      return;
    }

    if (!card.profile.lastName?.trim()) {
      showToast("Last name is required", "error");
      onSectionChange("business");
      return;
    }

    const vCardData = await generateVCard(card);
    const blob = new Blob([vCardData], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.urlName || getFullName(card) || "contact"}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("vCard downloaded", "success");
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const expiresAt = Number(localStorage.getItem("signupTimerExpiresAt"));
      if (!expiresAt) return;

      const remainingTime = expiresAt - Date.now();

      if (remainingTime <= 0) {
        localStorage.removeItem("signupTimerExpiresAt");
        const cards = await loadSessionBusinessCards();
        if (!cards?.length) return;
        await saveBusinessCard(cards[0]);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        clearInterval(interval); // optional: stop interval after expiry
      }
    }, 5000); // runs every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="relative flex min-h-[calc(100dvh-5rem)] md:min-h-full w-full max-w-[550px] flex-col justify-between rounded-xl mx-auto bg-[#f8f9fb] dark:bg-transparent dark:border dark:border-slate-800">
        <div
          className={`grow flex-col text-foreground ${showMobilePreview ? "hidden md:flex" : "flex"}`}
        >
          <main
            className={`p-4 ${
              // A Content sub-screen (Add Content, or an Add <Type> form)
              // owns the whole panel and pins its own footer, so <main>
              // has to hand it the remaining height. Left as a plain
              // block otherwise, so the tabbed view is untouched.
              // pb-0: the sub-screen's footer bar is rounded-b-none, i.e.
              // meant to meet the panel's bottom edge, not float above it.
              isContentEditing ? "flex grow flex-col pb-0" : ""
            }`}
          >
            {!isContentEditing && (
              <div className="pt-2">
                {!isEditMode && (
                  <div className="flex items-start justify-between gap-3 mb-4 px-1">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Create Your Business Card
                      </h1>
                      <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
                        Free digital business card — create, download, share in seconds.
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5 md:hidden">
                      <Logo size="sm" />
                    </div>
                  </div>
                )}

                {/* Top action buttons */}
                {isEditMode && (
                  <TopActionButtons
                    urlName={card.urlName}
                    cardId={card.metadata.id}
                    accessoriesCount={accessoriesCount}
                  />
                )}

                <Tabs
                  defaultValue="display"
                  value={setupTab}
                  className="w-full"
                  onValueChange={(val) => setSetupTab(val as any)}
                >
                  <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 h-auto p-1 rounded-full">
                    <TabsTrigger
                      value="display"
                      className="h-10 rounded-full hover:border-0 data-[state=active]:border-none data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-600 dark:text-white dark:data-[state=active]:text-white font-bold text-[11px] uppercase tracking-wider"
                    >
                      Display
                    </TabsTrigger>
                    <TabsTrigger
                      value="bio"
                      className="h-10 rounded-full hover:border-0 data-[state=active]:border-none data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-600 dark:text-white dark:data-[state=active]:text-white font-bold text-[11px] uppercase tracking-wider"
                    >
                      Bio
                    </TabsTrigger>
                    <TabsTrigger
                      value="content"
                      className="h-10 rounded-full hover:border-0 data-[state=active]:border-none data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-600 dark:text-white dark:data-[state=active]:text-white font-bold text-[11px] uppercase tracking-wider"
                    >
                      Content
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {(setupTab === "all" || setupTab === "display") && (
              <div className="px-2 space-y-2">
                <DisplayForm
                  card={card}
                  onUpdate={onUpdate}
                  isEditMode={isEditMode}
                  selectedTab={selectedTab}
                />
              </div>
            )}

            {(setupTab === "all" || setupTab === "bio") && (
              <BusinessForm
                card={card}
                onUpdate={onUpdate}
                onEditingChange={setIsBioEditing}
              />
            )}

            {(setupTab === "all" || setupTab === "content") && (
              <>
                <ContentForm
                  card={card}
                  onUpdate={onUpdate}
                  onEditStateChange={setIsContentEditing}
                  onScreenChange={setContentScreen}
                />
                {/* <AboutForm
                  card={card}
                  onUpdate={onUpdate}
                  selectedTab={selectedTab}
                />
                <AppointmentForm
                  card={card}
                  onUpdate={onUpdate}
                  isEditMode={isEditMode}
                  selectedTab={selectedTab}
                /> */}
              </>
            )}
          </main>
        </div>

        {/* Preview view (Mobile Only) */}
        {showMobilePreview && (
          <div className="block md:hidden my-auto py-4 px-4 w-full">
            <BusinessCardPreview card={card} isCreateMode={!isEditMode} />
          </div>
        )}

        {contentScreen !== "detail" && !isBioEditing && (
          <div className="sticky bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#f8f9fb] dark:from-background via-[#f8f9fb]/95 dark:via-background/95 to-transparent px-4 ">
            <TooltipProvider>
              <div className="flex items-center gap-3 rounded-lg rounded-b-none border border-slate-100 bg-white/90 dark:bg-slate-800 dark:border-slate-600 p-4 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-md flex-wrap">
                <div className="flex-1">
                  <Button
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setShowMobilePreview(!showMobilePreview);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } else {
                        const previewEl =
                          document.querySelector(".card-preview");
                        if (previewEl) {
                          previewEl.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }
                    }}
                    className="w-full h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900 flex items-center justify-center gap-3 transition-transform active:scale-95 px-4"
                  >
                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                      {showMobilePreview ? (
                        <Settings className="h-6 w-6" />
                      ) : (
                        <Eye className="h-6 w-6" />
                      )}
                    </div>
                    <span className="font-bold text-sm whitespace-nowrap">
                      {showMobilePreview ? "Setup" : "Preview"}
                    </span>
                  </Button>
                </div>

                <div className="flex-1 flex justify-between items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleSave}
                        variant="outline"
                        className="h-10 w-12 lg:w-auto lg:px-5 rounded-full bg-slate-50 border-none shadow-sm hover:bg-slate-100 transition-transform active:scale-95 shrink-0 flex items-center justify-center gap-2 p-0"
                      >
                        <Save className="h-8 w-8 lg:h-5 lg:w-5 text-indigo-500" />
                        <span className="hidden lg:inline text-sm font-bold text-slate-900 dark:text-white">
                          {isEditMode ? "Update" : "Save"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isEditMode ? "Update Card" : "Save Card"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleDownloadImage}
                        variant="outline"
                        className="h-10 w-12 lg:w-auto lg:px-5 rounded-full bg-slate-50 border-none shadow-sm hover:bg-slate-100 transition-transform active:scale-95 shrink-0 flex items-center justify-center gap-2 p-0"
                      >
                        <Download className="h-8 w-8 lg:h-5 lg:w-5 text-indigo-500" />
                        <span className="hidden lg:inline text-sm font-bold text-slate-900 dark:text-white">
                          Download
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download Image</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => navigate("/dashboard/cards")}
                        variant="outline"
                        className="h-10 w-12 lg:w-auto lg:px-5 rounded-full bg-slate-50 border-none shadow-sm hover:bg-slate-100 transition-transform active:scale-95 shrink-0 flex items-center justify-center gap-2 p-0"
                      >
                        <LayoutGrid className="h-8 w-8 lg:h-5 lg:w-5 text-indigo-500" />
                        <span className="hidden lg:inline text-sm font-bold text-slate-900 dark:text-white">
                          Dashboard
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Dashboard</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </TooltipProvider>
          </div>
        )}
      </div>

      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={async () => {
          setIsSignUpOpen(false);
          if (!user) {
            const cardToSave = { ...card };
            if (!cardToSave.profilePhoto?.trim()) {
              cardToSave.profilePhoto = storedImage?.url;
            }
            saveBusinessCard(cardToSave);
          }

          showToast(
            isEditMode
              ? "Card updated successfully"
              : "Card saved successfully",
            "success",
          );
          if (isEditMode) {
            navigate("/dashboard/cards");
          } else {
            const userAlreadyExists = hasUserAccount();
            if (userAlreadyExists) {
              navigate(`/dashboard/cards?selectedTab=${selectedTab}`);
            } else {
              if (selectedTab == null || selectedTab == "local") {
                navigate(
                  `/dashboard/cards?selectedTab=${selectedTab ?? "local"}`,
                );
                setTimeout(() => {
                  window.location.href = `/dashboard/cards?selectedTab=${
                    selectedTab ?? "local"
                  }`;
                }, 300);
              } else {
                navigate(`/dashboard/cards?selectedTab=${selectedTab}`);
              }
            }
          }
        }}
        onShowSignIn={() => {
          setIsSignUpOpen(false);
          setIsSignInOpen(true);
        }}
        onSubmit={(userEmail: string) => {
          const oneHour = 60 * 60 * 1000; // 1 hour in ms
          const expiresAt = Date.now() + oneHour;
          localStorage.setItem("signupTimerExpiresAt", expiresAt.toString());

          if (!user) {
            const cardToSave = { ...card };
            if (!cardToSave.profilePhoto?.trim()) {
              cardToSave.profilePhoto = storedImage?.url;
              cardToSave.profile.userEmail = userEmail;
            }
            saveSessionBusinessCard(cardToSave);
          }
        }}
      />
      <SignInModal
        isOpen={isSignInOpen}
        onClose={async () => {
          setIsSignInOpen(false);
          if (!user) {
            const cardToSave = { ...card };
            if (!cardToSave.profilePhoto?.trim()) {
              cardToSave.profilePhoto = storedImage?.url;
            }
            saveBusinessCard(cardToSave);
          } else if ((user && selectedTab == null) || selectedTab !== "local") {
            try {
              const userDoc = await getDoc(doc(db, "users", user.uid));
              const userData = userDoc.exists() ? userDoc.data() : {};

              const q = query(
                collection(db, "cards"),
                where("urlName", "==", card.urlName),
              );
              const querySnapshot = await getDocs(q);

              if (!querySnapshot.empty) {
                showToast("Card name already exists", "error");
                return;
              }

              const planType = userData.planType || "free";

              if (planType === "free" && !isEditMode) {
                const q = query(
                  collection(db, "cards"),
                  where("uid", "==", user.uid),
                );
                const snapshot = await getDocs(q);
                if (snapshot.size >= 2) {
                  showToast(
                    "Free plan allows only 2 cards. Upgrade to create unlimited cards.",
                    "error",
                  );
                  return;
                }
              }

              let newURL = card.profilePhoto;

              if (!card.profilePhoto || card.profilePhoto == "") {
                newURL = await copyImageServerSide(
                  storedImage.url,
                  user.uid,
                  card.urlName,
                  "profile",
                );
              }

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
                return `${countryCode} ${number.replace(
                  /(\d{3})(?=\d)/g,
                  "$1 ",
                )}`;
              };

              await setDoc(doc(db, "cards", card.urlName), {
                profilePhoto: newURL,
                uid: user.uid,
                isActive: false,
                urlName: card.urlName,
                brandColor: card.brandColor,
                templateType: card.templateType,
                cardLayout: card.cardLayout,
                profile: {
                  firstName: card.profile.firstName || "",
                  lastName: card.profile.lastName || "",
                  title: card.profile.title || "",
                  businessCategory: card.profile.businessCategory || "",
                  department: card.profile.department || "",
                  company: card.profile.company || "",
                  accreditations: card.profile.accreditations || [],
                  education: card.profile.education || "",
                  companySlogan: card.profile.companySlogan || "",
                },
                business: {
                  phone: formatPhone(card.business.phone) || "",
                  email: card.business.email || "",
                  website: card.business.website || "",
                  address: {
                    street: card.business.address.street || "",
                    city: card.business.address.city || "",
                    state: card.business.address.state || "",
                    zip: card.business.address.zip || "",
                    country: card.business.address.country || "",
                  },
                },
                social: {
                  linkedin: card.social.linkedin || "",
                  twitter: card.social.twitter || "",
                  facebook: card.social.facebook || "",
                  instagram: card.social.instagram || "",
                  youtube: card.social.youtube || "",
                  tiktok: card.social.tiktok || "",
                  pinterest: card.social.pinterest || "",
                  vimeo: card.social.vimeo || "",
                  snapchat: card.social.snapchat || "",
                  twitch: card.social.twitch || "",
                  whatsapp: card.social.whatsapp || "",
                  discord: card.social.discord || "",
                  wechat: card.social.wechat || "",
                  telegram: card.social.telegram || "",
                  signal: card.social.signal || "",
                },
                about: {
                  bio: card.about.bio ?? "",
                  sectionTitle:
                    card?.about?.sectionTitle ??
                    card?.about?.customSectionTitle ??
                    "",
                  skills: card?.about?.skills ?? [],
                  sectionType: card?.about?.sectionType ?? "",
                },
                appointments: {
                  appointmentType: card.appointments.appointmentType || "",
                  calendlyUrl: card.appointments.calendlyUrl || "",
                  ctaLabel: card.appointments.ctaLabel || "",
                  ctaUrl: card.appointments.ctaUrl || "",
                  platform: card.appointments.platform || "calendly",
                  googleUrl: card.appointments.googleUrl || "",
                  directAds: {
                    type: card?.appointments?.directAds?.type ?? "",
                    image: card?.appointments?.directAds?.image || "",
                    title: card?.appointments?.directAds?.title || "",
                    description: card?.appointments?.directAds?.description || "",
                    price: card?.appointments?.directAds?.price || "",
                    url: card?.appointments?.directAds?.url || "",
                  },
                },
                /* setDoc replaces the whole document, so any field left out of
                   this payload is wiped from the card. The Content tab lives
                   entirely in these three, and the design settings in the rest. */
                profileContentOrder: card?.profileContentOrder || [],
                contentLinks: card?.contentLinks || {},
                contentTitles: card?.contentTitles || {},
                iconStyle: card?.iconStyle || "round",
                iconVariant: card?.iconVariant || "standard",
                theme: card?.theme || "light",
                // cardView: 0,
                // cardShare: 0,
                // leadsGenerated: 0,
                // linkClick: 0,
                // adsView: 0,
                // saveContact: 0,
                cardView: card?.cardView || 0,
                cardShare: card?.cardShare || 0,
                leadsGenerated: card?.leadsGenerated || 0,
                linkClick: card?.linkClick || 0,
                adsView: card?.adsView || 0,
                saveContact: card?.saveContact || 0,
                metadata: {
                  id: card.metadata.id || "",
                  favorite: card.metadata.favorite || "",
                  isPublic: card.metadata.isPublic,
                  createdAt: card.metadata.createdAt || "",
                  slug: card.metadata.slug || "",
                  tags: card.metadata.tags || [],
                  cardType: userData.planType,
                },
              });
            } catch (error) {
              console.error("Error saving card:", error);
              showToast("Failed to save card", "error");
            }
          }

          showToast(
            isEditMode
              ? "Card updated successfully"
              : "Card saved successfully",
            "success",
          );
          if (isEditMode) {
            navigate("/dashboard/cards");
          } else {
            const userAlreadyExists = hasUserAccount();
            if (userAlreadyExists) {
              navigate(
                `/dashboard/cards?selectedTab=${selectedTab ?? "favorites"}`,
              );
            } else {
              if (selectedTab == null || selectedTab == "local") {
                navigate(
                  `/dashboard/cards?selectedTab=${selectedTab ?? "local"}`,
                );
                setTimeout(() => {
                  window.location.href = `/dashboard/cards?selectedTab=${
                    selectedTab ?? "local"
                  }`;
                }, 300);
              } else {
                navigate(
                  `/dashboard/cards?selectedTab=${selectedTab ?? "favorites"}`,
                );
              }
            }
          }
        }}
        onShowSignUp={() => {
          setIsSignInOpen(false);
          setIsSignUpOpen(true);
        }}
        onShowForgotPassword={() => {
          setIsSignInOpen(false);
          setForgotOpen(true);
        }}
      />

      {/* ✅ Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotOpen} // ✅ Correct state
        onClose={() => setForgotOpen(false)}
      />
      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        firstName={card.profile.firstName || ""}
      />
      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </>
  );
}
