"use client";
import {
  cn,
} from "@/lib/utils";
import Image from "next/image";
import React, { useState, useEffect, useDeferredValue } from "react";
import { createPortal } from "react-dom";
import {
  BusinessCard,
} from "@/types/businessCard";
import {
  hasUserInput,
  getFullName,
} from "@/utils/businessCard";
import {
  CONTENT_ICONS,
  getContentIcon,
  getPhoneIcon,
} from "@/components/onboarding/forms/content-form/contentIcons";
import {
  Calendar,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
  ArrowRight,
  Share2,
  ArrowLeft,
  X,
  MessageCircle,
  Pencil,
  FileText,
  Image as ImageIcon,
  Zap,
  Megaphone,
} from "lucide-react";
import { applyBodyScrollLock } from "@/utils/scrollLock";
import {
  FaXTwitter,
  FaTiktok,
  FaPinterest,
  FaVimeoV,
  FaSnapchat,
  FaTwitch,
} from "react-icons/fa6";
import {
  SiCalendly,
  SiGooglecalendar,
} from "react-icons/si";
import {
  Lightbox,
} from "@/components/ui/lightbox";
import {
  useRouter,
} from "next/navigation";
import DOMPurify from "dompurify";
import {
  Button,
} from "../ui/button";
import {
  useAuth,
} from "@/contexts/AuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  db,
} from "@/services/firebase";
import Link from "next/link";
import {
  isColorDark,
} from "@/utils/color";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BASE_URLS,
  CARD_SOCIAL_LABELS,
  SOCIAL_DETAIL_FIELD_MAP,
  TRADITIONAL_SOCIAL_LIMIT,
} from "@/components/onboarding/forms/content-form/config";
import { getActiveAppointmentLabel } from "@/utils/appointments";

interface BusinessCardPreviewProps {
  card: BusinessCard;
  className?: string;
  isEditMode?: boolean;
  refLink?: string;
  isLocal?: boolean;
  isCreateMode?: boolean;
  handleDownloadVCard?: () => void;
  onExchangePress?: () => void;
  handleSharedCard?: () => void;
  handleClaimClick?: () => void;
  showBackbtn?: boolean;
  onNavigateBack?: () => void;
}

export function BusinessCardPreview({
  refLink,
  card: rawCard,
  className = "",
  isEditMode = false,
  isLocal = false,
  isCreateMode = false,
  handleDownloadVCard,
  onExchangePress,
  handleSharedCard,
  onNavigateBack,
  handleClaimClick,
  showBackbtn,
}: BusinessCardPreviewProps) {
  const card = useDeferredValue(rawCard);
  const dark = isColorDark(card?.brandColor);
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBackButton, setShowBackButton] = useState(showBackbtn);
  const [showTemplate, setShowTemplate] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; name?: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(
    () => applyBodyScrollLock(showDocumentModal || !!selectedPhoto),
    [showDocumentModal, selectedPhoto],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDocumentModal(false);
        setSelectedPhoto(null);
      }
    };
    if (showDocumentModal || selectedPhoto) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [showDocumentModal, selectedPhoto]);
  const fullName = getFullName(card);
  const qrCode = card?.qrCode?.qrCodeUrl ?? "";
  const router = useRouter();
  const hasProfileInfo = fullName || card.profile.title || card.profile.company;
  // Every address renderer prints street/city/state/zip and omits country,
  // so counting country here would render an empty address row (icon +
  // "Address" label with no text) for a country-only entry.
  const hasAddress =
    card.business.address.street ||
    card.business.address.city ||
    card.business.address.state ||
    card.business.address.zip;
  const hasContactInfo =
    card.business.phone ||
    card.business.email ||
    card.business.website ||
    hasAddress;
  const hasSocialLinks =
    card.social.linkedin ||
    card.social.twitter ||
    card.social.facebook ||
    card.social.youtube ||
    card.social.instagram ||
    card.social.tiktok ||
    card.social.pinterest ||
    card.social.vimeo ||
    card.social.snapchat ||
    card.social.twitch ||
    card.social.whatsapp ||
    card.social.discord ||
    card.social.wechat ||
    card.social.telegram ||
    card.social.signal;
  const cardSectionType = card.about.sectionType;
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [sanitizedBio, setSanitizedBio] = useState("");
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const CARD_DOC_ID = "mainCard";
  const [storedImage, setStoredImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [storedOldImage, setStoredOldImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [storedBackupCardImage, setStoredBackupCardImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  // The stored backup URL can 404 (file removed from storage while the
  // Firestore record still points at it). Once it fails, stop trusting it
  // so the header falls through to the initials avatar instead of showing
  // a broken image.
  // Track WHICH url failed, not a boolean: a flag latched on permanently, so a
  // replacement image uploaded afterwards was never retried.
  const [failedBackupUrl, setFailedBackupUrl] = useState<string | null>(null);
  // console.log("carddd==",card.appointments);
  const [key, setKey] = useState(0);

  const handleClose = () => {
    setIsClosing(true);

    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

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

  const fetchImage = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.image) {
          setIsLoading(true);
          setStoredImage(data.image);
          setIsLoading(false);
        } else {
          setStoredImage(null);
        }
      } else {
        setStoredImage(null);
      }
    } catch (err) {
      console.error("Failed to fetch image:", err);
    }
    setIsLoading(false);
  };

  const fetchBackupCardImage = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.backupCard) {
          setIsLoading(true);
          setStoredBackupCardImage(data.backupCard);
          if (data.oldUrl) {
            setStoredOldImage(data.oldUrl);
          }
          setIsLoading(false);
        } else {
          setStoredBackupCardImage(null);
        }
      } else {
        setStoredBackupCardImage(null);
      }
    } catch (err) {
      console.error("Failed to fetch image:", err);
    }
  };

  const formatWebsiteUrl = (url?: string) => {
    if (!url) return "";

    // If already starts with http:// or https://, return as is
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    // Otherwise, add https://
    return `https://${url}`;
  };

  // Usage
  const websiteUrl = formatWebsiteUrl(card?.business?.website);

  const defaultProfileContentOrder = [
    "Phone",
    "Email",
    "Website",
    "Address",
    "LinkedIn",
    "X",
    "Facebook",
    "YouTube",
    "Instagram",
    "TikTok",
    "Pinterest",
    "Vimeo",
    "Snapchat",
    "Twitch",
    "About Me",
  ];

  const getProfileContentOrderPosition = (
    labels: string | string[],
    fallback: number,
  ) => {
    const labelList = Array.isArray(labels) ? labels : [labels];
    const activeOrder = card.profileContentOrder?.length
      ? card.profileContentOrder
      : defaultProfileContentOrder;
    const indices = labelList
      .map((label) => activeOrder.indexOf(label))
      .filter((index) => index >= 0);

    return (indices.length ? Math.min(...indices) : fallback) * 2;
  };

  /* ------------------------------------------------------------------
   * RICH CONTENT (Photos / Document)  --  added for client point 5b
   * ------------------------------------------------------------------
   * Photos and Document are stored by ContentForm in `card.contentLinks`
   * as JSON strings. Parsing mirrors ContentForm's getPhotosData() /
   * getDocumentData() exactly, so the card shows what the editor saved.
   * ------------------------------------------------------------------ */
  const getPhotosData = (): { url: string; name: string }[] => {
    const data = card.contentLinks?.["Photos"];
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getDocumentData = (): { url: string; name: string } | null => {
    const data = card.contentLinks?.["Document"];
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return { url: data, name: "Document" };
    }
  };

  const cardPhotos = getPhotosData();
  const cardDocument = getDocumentData();
  /* ---------------- end RICH CONTENT helpers ---------------- */


  /* ------------------------------------------------------------------
   * CONTENT LINKS
   * ------------------------------------------------------------------
   * Google Drive, Notion, the payment links, the music links and the review
   * links are all saved by ContentForm into card.contentLinks, but the card
   * only ever read that map for Photos and Document - so adding any of the
   * others did nothing at all. They are rendered here, like Website and Email.
   * ------------------------------------------------------------------ */
  /* Icon and colour for every content link come from the shared CONTENT_ICONS
     table, which the Add Content tiles, the detail form header and the Profile
     Content rows read as well - so an item cannot look like one thing in the
     editor and another on the card, which is how Notion ended up a page icon
     in the form and the Notion mark here.

     `address` marks the two entries that are NOT a URL: Location, and every
     extra Address instance ("Address_1712..."), are stored by ContentForm as a
     JSON {street,city,state,zip,country} string - see its handleAddressChange.
     Those rows print the formatted address and open Google Maps, matching the
     primary Address row further down. */
  const ADDRESS_SHAPED = new Set(["Location", "Address"]);

  const CONTENT_LINK_LABELS = [
    "Phone",
    "Email",
    "Website",
    "Location",
    "Address",
    "Google Drive",
    "Notion",
    "Booksy",
    "PayPal",
    "Venmo",
    "CashApp",
    "Zelle",
    "Spotify",
    "Apple Music",
    "SoundCloud",
    "Tidal",
    "iTunes",
    "Bandcamp",
    "Google Reviews",
    "Yelp",
    "Etsy",
    /* Contact Info messengers. They are drawn as contact rows, like Email and
       Website - not as social chips - so they never take a social slot. */
    "WhatsApp",
    "Discord",
    "WeChat",
    "Telegram",
    "Signal",
    /* Social media links for secondary instances */
    "LinkedIn",
    "Instagram",
    "X",
    "Facebook",
    "YouTube",
    "TikTok",
    "Pinterest",
    "Vimeo",
    "Snapchat",
    "Twitch",
  ];

  /**
   * Trim, then add a scheme if there is none.
   *
   * The CTA used to be rejected outright by /^https?:\/\//i tested against the
   * RAW field, so three ordinary inputs produced a configured item that drew
   * nothing and said nothing: "example.com", "www.example.com", and - the easy
   * one to hit - a pasted "https://example.com " with a space on the end.
   *
   * Calendly and Google Calendar had the opposite problem: no check at all, so
   * a bare "calendly.com/me" went into href as-is. A URL with no scheme is a
   * RELATIVE path, so that button navigated to /calendly.com/me inside the app
   * rather than to Calendly.
   *
   * Returns "" when there is nothing usable, which is the one case a button
   * genuinely cannot be drawn for.
   */
  const normalizeUrl = (raw?: string) => {
    const value = (raw || "").trim();
    if (!value) return "";

    // Protocol-relative. Pinned to https rather than left to resolve against
    // the page, so a card opened over http does not silently downgrade.
    if (value.startsWith("//")) return `https:${value}`;

    // Only these schemes are linked as-is.
    if (/^(https?|mailto|tel|sms):/i.test(value)) return value;

    /* Anything else that declares a scheme is refused rather than prefixed.
       This is what stops "javascript:..." - a card is public, so its owner's
       link text reaches every visitor who opens it, and `href="javascript:…"`
       runs in their browser. The old CTA check happened to block it by
       demanding ^https?://; the booking links never checked at all. A host:port
       like "example.com:8080/x" is NOT a scheme and must still be prefixed,
       which is why this looks for the "//" that a real scheme carries, and
       names the script-bearing schemes that do not use one. */
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return "";
    if (/^(javascript|data|vbscript|file|blob|about):/i.test(value)) return "";

    return `https://${value}`;
  };

  const CONTENT_LINK_META: Record<
    string,
    { Icon: any; bg: string; fg?: string; address?: boolean }
  > = Object.fromEntries(
    CONTENT_LINK_LABELS.map((label) => {
      const meta =
        label === "Phone"
          ? getPhoneIcon(card?.business?.phoneAction)
          : getContentIcon(label);
      return [
        label,
        {
          Icon: meta.Icon,
          bg: meta.gradient || meta.bg,
          fg: meta.fg || "#ffffff",
          address: ADDRESS_SHAPED.has(label) || undefined,
        },
      ];
    }),
  );

  const iconShapeClass =
    card.iconStyle === "square" ? "rounded-xl" : "rounded-full";

  const socialIconShapeClass = iconShapeClass;

  const getDefaultIconStyles = (kind: string): React.CSSProperties => {
    const base = (kind || "").split("_")[0];
    const meta = CONTENT_LINK_META[base] || CONTENT_ICONS[base];

    if (!meta) {
      return { backgroundColor: card.brandColor, color: "#ffffff" };
    }

    return {
      background: (meta as any).gradient || meta.bg,
      color: meta.fg || "#ffffff",
    };
  };

  const getSocialIconStyles = (kind: string): React.CSSProperties => {
    if (card.iconVariant === "custom_negative") {
      return {
        color: card.brandColor,
        backgroundColor: "#ffffff",
        border: `1px solid ${card.brandColor}`,
      };
    }

    if (card.iconVariant === "custom") {
      return {
        color: "#ffffff",
        backgroundColor: card.brandColor,
        border: "1px solid transparent",
      };
    }

    return {
      ...getDefaultIconStyles(kind),
      border: "1px solid transparent",
    };
  };

  const rankContentItem = (key: string, base: string) => {
    const activeOrder = card.profileContentOrder?.length
      ? card.profileContentOrder
      : defaultProfileContentOrder;

    let idx = activeOrder.indexOf(key);
    if (idx !== -1) return idx;

    idx = activeOrder.indexOf(base);
    if (idx !== -1) return idx;

    if (
      base === "Twitter" ||
      base === "X" ||
      key === "Twitter" ||
      key === "X"
    ) {
      idx = activeOrder.indexOf("X");
      if (idx !== -1) return idx;
      idx = activeOrder.indexOf("Twitter");
      if (idx !== -1) return idx;
      idx = activeOrder.indexOf("Twitter/X");
      if (idx !== -1) return idx;
    }

    const defIdx = defaultProfileContentOrder.indexOf(base);
    if (defIdx !== -1) return 1000 + defIdx;

    return 2000;
  };

  /** Those links that actually have a value, in the owner's arranged order. */
  const activeContentLinks = (() => {
    /* The messengers live on card.social but belong with the contact rows, so
       they are folded in here under their display label. */
    const MESSENGER_FIELDS: Record<string, string> = {
      WhatsApp: "whatsapp",
      Discord: "discord",
      WeChat: "wechat",
      Telegram: "telegram",
      Signal: "signal",
    };
    const links: Record<string, any> = { ...(card.contentLinks || {}) };
    for (const [label, field] of Object.entries(MESSENGER_FIELDS)) {
      const value = (card.social as any)?.[field];
      if (typeof value === "string" && value.trim()) links[label] = value;
    }

    /* Mirrors ContentForm's getContentValue: a stored address is JSON, but an
       older entry can still be a plain string, so fall back to the raw value
       rather than printing "[object Object]" or a brace-filled blob. */
    const formatAddress = (raw: string) => {
      try {
        const parsed = JSON.parse(raw);
        return [
          parsed.street,
          parsed.city,
          parsed.state,
          parsed.zip,
          parsed.country,
        ]
          .filter(Boolean)
          .join(", ");
      } catch {
        return raw;
      }
    };

    return (
      Object.keys(links)
        // A second instance is saved as "Spotify_1712..."; the base label carries the
        // icon. Photos and Document store objects, not strings - skipped here
        // because they have their own accordions further down the card.
        .map((key) => ({ key, base: key.split("_")[0] }))
        .filter(({ key, base }) => {
          if (!CONTENT_LINK_META[base]) return false;
          const val = links[key];
          if (typeof val !== "string" || !val.trim()) return false;
          // Skip primary phone/email/website if already set on card.business
          if (key === "Phone" && card.business.phone?.trim()) return false;
          if (key === "Email" && card.business.email?.trim()) return false;
          if (key === "Website" && card.business.website?.trim()) return false;
          // Skip primary social links if already set on card.social
          const socialField = SOCIAL_DETAIL_FIELD_MAP[key];
          if (socialField && card.social[socialField as keyof typeof card.social]?.trim()) {
            return false;
          }
          return true;
        })
        .sort((a, b) => rankContentItem(a.key, a.base) - rankContentItem(b.key, b.base))
        .map(({ key, base }) => {
          const meta = CONTENT_LINK_META[base];
          const raw = (links[key] as string).trim();
          const isPhone = base === "Phone";
          const isEmail = base === "Email";
          const text = meta.address
            ? formatAddress(raw)
            : isPhone
              ? formatPhone(raw)
              : raw;
          const url = meta.address
            ? `https://www.google.com/maps?q=${encodeURIComponent(text)}`
            : isPhone
              ? (card?.business?.phoneAction === "text" ? `sms:${raw}` : `tel:${raw}`)
              : isEmail
                ? `mailto:${raw}`
                : normalizeUrl(raw);
          return {
            key,
            base,
            label: card.contentTitles?.[key] || base,
            text,
            url,
            Icon: meta.Icon,
            bg: meta.bg,
            fg: meta.fg || "#ffffff",
          };
        })
        .filter((item) => item.text && item.url)
    );
  })();

  /* The Classic / Traditional contact block holds the content-link and
     messenger rows as well as phone, email, website and address, but it was
     gated on hasContactInfo - which only looks at those four business fields.
     A card carrying only, say, a Spotify link and a WhatsApp number therefore
     dropped the whole block and drew none of them, while Modern (whose
     content-link rows sit outside this gate) drew them all. Measured over all
     12 designs: 8 showed 0 of 16 links without a business contact field.
     Opening the block when there is anything to put in it. */
  const hasContactBlock =
    hasContactInfo ||
    activeContentLinks.length > 0 ||
    (card.templateType === "classic" && hasSocialLinks);

  const linkHoverVars = {
    ["--hover-color" as string]: card.brandColor,
    ["--hover-bg" as string]: `${card.brandColor}26`,
  } as React.CSSProperties;

  /** Classic / Traditional: icon, value, label underneath. */
  const contentLinkClassicRows = () =>
    activeContentLinks.map((item) => (
    <a
      key={`cl-classic-${item.key}`}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => handleSocialLinkClick(e, item.url, item.label)}
      className="relative flex items-center gap-4 text-card-foreground group cursor-pointer"
      style={linkHoverVars}
    >
      <div
        className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: "var(--hover-bg)" }}
      />
      <div
        className={cn("p-3 flex-shrink-0", iconShapeClass)}
        style={getSocialIconStyles(item.base)}
      >
        <item.Icon size={24} />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden relative [mask-image:linear-gradient(90deg,#000_94%,transparent_100%)]">
        <p className="text-base text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors whitespace-nowrap">
          {item.text}
        </p>
        <p className="text-sm text-muted-foreground truncate">{item.label}</p>
      </div>
    </a>
  ));

  /** Modern Standard / Portrait: pill row with the icon hanging off the left. */
  const contentLinkModernRows = () =>
    activeContentLinks.map((item) => (
    <a
      key={`cl-modern-${item.key}`}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => handleSocialLinkClick(e, item.url, item.label)}
      className="flex items-center justify-between rounded-[10px]"
      style={linkHoverVars}
    >
      <div className="relative w-full">
        <div
          className="bg-card text-card-foreground pl-8 pr-4 py-2 rounded-[10px] flex items-center justify-between ml-6"
          style={{ boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px" }}
        >
          <div className="flex-1 min-w-0 overflow-hidden [mask-image:linear-gradient(90deg,#15202b_75%,transparent_85%)]">
            <p className="text-base font-bold">{item.label}</p>
            <p className="text-sm truncate">{item.text}</p>
          </div>
          <ArrowRight className="w-5 h-5 flex-shrink-0" />
        </div>
        <div
          className={cn(
            "absolute -left-0 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center shadow-md",
            iconShapeClass,
          )}
          style={getSocialIconStyles(item.base)}
        >
          <item.Icon size={27} />
        </div>
      </div>
    </a>
  ));

  /* Centered and Fade In share the tile shape but not the label colour:
     Fade In's card is tinted with the brand colour, Centered's body is white. */
  const contentLinkTiles = (labelClass: string) =>
    activeContentLinks.map((item) => (
      <a
        key={`cl-tile-${item.key}`}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => handleSocialLinkClick(e, item.url, item.label)}
        className="flex-1 items-center justify-between rounded-[10px]"
        style={linkHoverVars}
      >
        <div className="flex flex-col items-center gap-0">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center shadow-md",
              socialIconShapeClass,
            )}
            style={getSocialIconStyles(item.base)}
          >
            <item.Icon size={27} />
          </div>
          <p className={labelClass}>{item.label}</p>
        </div>
      </a>
    ));

  /* ------------------------------------------------------------------
   * APPOINTMENT BLOCKS - Call-to-Action, Direct Ads, Calendly / Google
   * ------------------------------------------------------------------
   * These used to be three arms of ONE chained ternary, gated on
   * `appointments.appointmentType`. That field holds a single value, so only
   * one could ever render and enabling one hid the others.
   *
   * They are independent now, each shown when it has its own data. Built once
   * here so the five template branches share them, with a per-design variant
   * because Classic and the Modern designs draw them differently.
   * ------------------------------------------------------------------ */

  /** Bump the card's ad-view counters. Shared by all three block types; the
      card's owner viewing their own card is not counted. */
  const recordAdView = async () => {
    try {
      const cardsSnapshot = await getDocs(
        query(
          collection(db, "cards"),
          where("metadata.id", "==", card.metadata.id),
        ),
      );

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();
        if (user?.uid === cardData?.uid) continue;

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${monthKey}-${String(now.getDate()).padStart(2, "0")}`;

        await updateDoc(cardDoc.ref, {
          adsView: (cardData.adsView || 0) + 1,
          [`cardAdsViewByMonth.${monthKey}`]:
            (cardData.cardAdsViewByMonth?.[monthKey] || 0) + 1,
          [`cardAdsViewByDay.${dayKey}`]:
            (cardData.cardAdsViewByDay?.[dayKey] || 0) + 1,
        });
      }
    } catch (error) {
      console.error("Error updating ad view:", error);
    }
  };

  /** Readable label colour on top of the brand colour. */
  const onBrand = dark ? "#ffffff" : "#111827";

  /* Per-design appearance. Classic draws large solid buttons with a glyph;
     the Modern designs draw small gradient pills with no glyph. Fade In
     additionally flips its label colour against the brand colour, which is
     why it cannot just reuse "modern". */
  const appointmentVariants = {
    classic: {
      /* The label used to be a hardcoded text-white on top of the brand
         colour, which only works when that colour is dark - a light brand gave
         white-on-light at about 1.7:1. onBrand picks the readable one. */
      className:
        "inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-base sm:text-lg font-medium hover:opacity-90",
      style: {
        backgroundColor: card.brandColor,
        color: onBrand,
      } as React.CSSProperties,
      iconSize: 20,
    },
    modern: {
      className:
        "inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-base sm:text-lg font-medium hover:opacity-90",
      style: {
        background: `linear-gradient(to bottom,${card?.brandColor},rgba(0, 0, 0, 0.20))`,
        color: onBrand,
      } as React.CSSProperties,
      iconSize: 20,
    },
    fadein: {
      /* Fade In tints the WHOLE card with the brand colour, so the gradient the
         other Modern designs use - they sit on a white card body - renders
         brand-on-brand here and all but disappears. A white pill matches the
         card's own "Exchange Contact" button and stays legible whatever the
         brand colour is. */
      className:
        "inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-base sm:text-lg font-medium shadow-sm hover:opacity-90",
      style: {
        backgroundColor: "#ffffff",
        color: dark ? card.brandColor : "#111827",
      } as React.CSSProperties,
      iconSize: 20,
    },
  };

  type AppointmentVariant =
    (typeof appointmentVariants)[keyof typeof appointmentVariants];

  /**
   * Calendly and Google Calendar each get their own button when their own URL
   * is filled, so a card can show both.
   *
   * `appointments.platform` is deliberately NOT consulted. It stores a single
   * value, so reading it hid whichever link it did not name - and when it
   * named neither (older cards leave it unset) the old code produced
   * href={undefined}, i.e. a dead button.
   */

  const renderBookingButton = (
    kind: "Calendly" | "Google Calendar",
    url: string,
    v: AppointmentVariant,
  ) => (
    <a
      key={kind}
      href={normalizeUrl(url)}
      onClick={recordAdView}
      target="_blank"
      rel="noopener noreferrer"
      className={v.className}
      style={{ ...v.style, lineHeight: "1", alignItems: "center" }}
    >
      {/* Icon wrapper ensures stable alignment in html2canvas */}
      <span
        className="flex items-center justify-center"
        style={{
          width: `${v.iconSize}px`,
          height: `${v.iconSize + 8}px`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {kind === "Calendly" ? (
          <SiCalendly size={v.iconSize} />
        ) : (
          <SiGooglecalendar size={v.iconSize} />
        )}
      </span>

      {/* Text wrapper with independent vertical centering */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: "1",
        }}
      >
        {card.contentTitles?.[kind] || "Schedule Meeting"}
      </span>
    </a>
  );

  /* A CTA needs somewhere to go; the wording is optional. It used to need both,
     so a URL typed without a label produced a tile badged "1" and no button.
     The label falls back to the same default the booking buttons use. */
  const renderCtaButton = (v: AppointmentVariant) => {
    const href = normalizeUrl(card.appointments?.ctaUrl);
    if (!href) return null;

    return (
      <a
        key="cta"
        href={href}
        onClick={recordAdView}
        target="_blank"
        rel="noopener noreferrer"
        className={v.className}
        style={{ ...v.style, alignItems: "center" }}
      >
        <Zap size={v.iconSize} className="shrink-0" />
        <span>{card.appointments.ctaLabel?.trim() || "Learn More"}</span>
      </a>
    );
  };

  /* An ad needs a type AND an uploaded image: the image is what the lightbox
     opens, and "none" is what deleting an ad leaves behind. */
  const renderDirectAdsButton = (v: AppointmentVariant) => {
    const ad = card?.appointments?.directAds;
    if (!ad?.image || !ad?.type || ad.type === "none") return null;

    return (
      <button
        key="ads"
        onClick={() => {
          setShowLightbox(true);
          void recordAdView();
        }}
        className={v.className}
        style={{ ...v.style, alignItems: "center" }}
      >
        <Megaphone size={v.iconSize} className="shrink-0" />
        <span>
          {ad.title ||
            (ad.type === "Product"
              ? "View Our Product"
              : ad.type === "Event"
                ? "View Our Event"
                : ad.type === "Service"
                  ? "View Our Service"
                  : `View Our ${ad.type}`)}
        </span>
      </button>
    );
  };

  /**
   * Only ONE button from the four (CTA, Direct Ads, Calendly, Google Calendar)
   * can be shown on the preview card at a time.
   */
  const buildAppointmentBlocks = (key: keyof typeof appointmentVariants) => {
    const v = appointmentVariants[key];
    const activeLabel = getActiveAppointmentLabel(card);
    if (!activeLabel) return [];

    let button: React.ReactNode = null;
    if (activeLabel === "Call-to-Action") {
      button = renderCtaButton(v);
    } else if (activeLabel === "Direct Ads") {
      button = renderDirectAdsButton(v);
    } else if (activeLabel === "Calendly") {
      button = card.appointments?.calendlyUrl?.trim()
        ? renderBookingButton("Calendly", card.appointments.calendlyUrl, v)
        : null;
    } else if (activeLabel === "Google Calendar") {
      button = card.appointments?.googleUrl?.trim()
        ? renderBookingButton(
            "Google Calendar",
            card.appointments.googleUrl,
            v,
          )
        : null;
    }

    return button ? [button] : [];
  };

  const classicAppointments = buildAppointmentBlocks("classic");
  const modernAppointments = buildAppointmentBlocks("modern");
  const fadeInAppointments = buildAppointmentBlocks("fadein");

  /* ------------------------------------------------------------------
   * CONTENT DIVIDER
   * ------------------------------------------------------------------
   * ContentForm lets the user add a single "Divider" entry to
   * profileContentOrder (the tile is maxInstances={1}, so there is never
   * more than one and it is never a "Divider_<timestamp>" instance).
   *
   * The rule is drawn ONLY when that entry exists. There is no implicit
   * fallback: the card used to draw a hardcoded rule above About Me in every
   * template branch whether or not the user had asked for one, which meant
   * the Divider content item did nothing and the line could not be removed.
   *
   * The card renders its sections in fixed source order rather than walking
   * profileContentOrder, so the divider is resolved to the first ANCHOR that
   * follows it in the order:
   *
   *   about -> above the About Me section
   *   rich  -> above the Photos / Document dropdowns
   *   end   -> after the rich content, closing out the card body
   *
   * A divider placed after everything falls through to "end", so it is never
   * silently dropped.
  /* Divider stays rigid above the About section whenever present in profileContentOrder */
  const hasDivider = Boolean(
    (card.profileContentOrder || []).some(
      (entry) => entry.split("_")[0] === "Divider",
    ),
  );

  const renderContentDivider = (anchor: "about" | "rich" | "end") =>
    anchor === "about" && hasDivider ? (
      <div className="!mt-4 border-t border-border mb-2" />
    ) : null;
  /* ---------------- end CONTENT DIVIDER ---------------- */

  /* ------------------------------------------------------------------
   * RICH CONTENT DROPDOWNS - Photos & Document   (client point 5b)
   * ------------------------------------------------------------------
   * Rendered BELOW the content area and BELOW About Me, ABOVE the social
   * row - matching the reference card (contact rows -> About -> Photos).
   *
   * Only the TITLE shows initially; content opens on click. Unlike About Me
   * (a dropdown on `modern` only, expanded on traditional/classic), these
   * drop down on EVERY template, per the client note.
   *
   * `type="multiple"` so Document and Photos can be open at the same time,
   * as on the reference card. Defined once here and reused by every template
   * branch below - search "richContentDropdowns" for the render sites.
   * ------------------------------------------------------------------ */
  const richContentDropdowns =
    cardPhotos.length > 0 || cardDocument?.url ? (
      <Accordion type="multiple" className="mt-4 w-full">
        {cardPhotos.length > 0 && (
          <AccordionItem value="photos" className="border-b-0">
            <AccordionTrigger className="text-base font-bold py-2 no-underline hover:no-underline border-b-0">
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    // shadow-md to match the contact/social chips above; the
                    // rich-content chips were the only flat ones on the card.
                    "flex h-12 w-12 shrink-0 items-center justify-center shadow-md",
                    iconShapeClass,
                  )}
                  style={getSocialIconStyles("Photos")}
                >
                  <ImageIcon size={27} />
                </span>
                <span className="text-base font-bold">
                  {card.contentTitles?.["Photos"] || "Photos"}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {/* 1 col on the narrowest cards, 2 from ~380px up */}
              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
                {cardPhotos.map((photo, idx) => (
                  <div
                    key={`${photo.url}-${idx}`}
                    className="relative aspect-square overflow-hidden rounded-xl border border-border cursor-pointer group hover:opacity-95 transition-all hover:shadow-md"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name || `Photo ${idx + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {cardDocument?.url && (
          <AccordionItem value="document" className="border-b-0">
            <AccordionTrigger className="text-base font-bold py-2 no-underline hover:no-underline border-b-0">
              <span className="flex items-center gap-3">
                {/* Filled chip like every contact row, instead of a bare glyph.
                    getSocialIconStyles keeps it honouring the card's icon
                    variant (custom / custom_negative) and brand colour. */}
                <span
                  className={cn(
                    // shadow-md to match the contact/social chips above; the
                    // rich-content chips were the only flat ones on the card.
                    "flex h-12 w-12 shrink-0 items-center justify-center shadow-md",
                    iconShapeClass,
                  )}
                  style={getSocialIconStyles("Document")}
                >
                  <FileText size={27} />
                </span>
                <span className="text-base font-bold">
                  {card.contentTitles?.["Document"] || "Document"}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-1">
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setShowDocumentModal(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowDocumentModal(true);
                  }
                }}
                className="group relative w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#f8faff] dark:bg-slate-900/40 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {/* Document Page Thumbnail Preview */}
                <div className="relative w-full h-44 sm:h-52 flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-[#f8faff] dark:bg-slate-900/30">
                  <div className="relative w-[130px] sm:w-[155px] h-[170px] sm:h-[200px] bg-white dark:bg-slate-800 rounded-md shadow-md border border-slate-200/70 dark:border-slate-700/60 overflow-hidden flex flex-col items-center justify-start pointer-events-none select-none transition-transform duration-300 group-hover:scale-[1.02]">
                    {cardDocument.url.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) ? (
                      <img
                        src={cardDocument.url}
                        alt={cardDocument.name || "Document Preview"}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <iframe
                        src={`${cardDocument.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        title={cardDocument.name || "Document Thumbnail"}
                        className="w-full h-full border-none pointer-events-none select-none bg-white dark:bg-slate-900"
                        tabIndex={-1}
                        loading="lazy"
                      />
                    )}
                    {/* Placeholder lines if loading */}
                    <div className="absolute inset-0 bg-white dark:bg-slate-800 p-3 flex flex-col gap-2 -z-10 pointer-events-none">
                      <div className="h-2 w-12 bg-slate-300 dark:bg-slate-600 rounded" />
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded mt-2" />
                      <div className="h-1.5 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-1.5 w-4/6 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="mt-2 grid grid-cols-2 gap-1 w-full">
                        <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded" />
                        <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar matching Image 1 */}
                <div className="bg-white dark:bg-slate-900 px-4 py-3 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="w-11 h-11 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-5 h-5 text-slate-900 dark:text-white" />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <span className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {card.contentTitles?.["Document"] || "Document"}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal">
                      {cardDocument.name || "Document.pdf"}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-700 dark:text-slate-300 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    ) : null;
  /* ------------- end RICH CONTENT DROPDOWNS definition ------------- */


  const getActiveSocialItems = () => {
    const items: Array<{
      id: string;
      base: string;
      label: string;
      url: string;
      Icon: any;
      onClick: (e: any) => void;
    }> = [];

    // 1. Primary social links from card.social
    for (const label of CARD_SOCIAL_LABELS) {
      const field = SOCIAL_DETAIL_FIELD_MAP[label] as keyof typeof card.social;
      const val = card.social[field]?.trim();
      if (val && val !== BASE_URLS[field]) {
        const meta = getContentIcon(label);
        items.push({
          id: label,
          base: label,
          label: card.contentTitles?.[label] || label,
          url: normalizeUrl(val),
          Icon: meta.Icon,
          onClick: (e) => handleSocialLinkClick(e, val, label),
        });
      }
    }

    // 2. Secondary social links from card.contentLinks
    if (card.contentLinks) {
      for (const [key, val] of Object.entries(card.contentLinks)) {
        if (typeof val === "string" && val.trim()) {
          const base = key.split("_")[0];
          if ((CARD_SOCIAL_LABELS as readonly string[]).includes(base)) {
            const meta = getContentIcon(base);
            items.push({
              id: key,
              base,
              label: card.contentTitles?.[key] || base,
              url: normalizeUrl(val),
              Icon: meta.Icon,
              onClick: (e) =>
                handleSocialLinkClick(
                  e,
                  val,
                  card.contentTitles?.[key] || base,
                ),
            });
          }
        }
      }
    }

    // Sort according to profileContentOrder
    items.sort(
      (a, b) => rankContentItem(a.id, a.base) - rankContentItem(b.id, b.base),
    );

    if (card.templateType === "traditional") {
      return items.slice(0, TRADITIONAL_SOCIAL_LIMIT);
    }

    return items;
  };

  const activeSocialItems = getActiveSocialItems();


  /* Spread onto a chip or a row in place of the onMouseEnter/onMouseLeave pair
     it replaces. The attribute is absent in edit mode, so the CSS rules in
     globals.css simply do not match - the same thing the `if (isEditMode)`
     guard at the top of every one of those handlers did. */
  const chipHoverProps = { "data-chip-hover": "on" };
  const rowHoverProps = { "data-row-hover": "on" };

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [card]);
  useEffect(() => {
    fetchImage();
    fetchBackupCardImage();
    setShowBackButton(showBackbtn);
    // if (typeof window !== "undefined") {
    //   if (window.history.length > 3) {
    //     setShowBackButton(true);
    //   } else {
    //     setShowBackButton(false);
    //   }
    // }
  }, [showBackbtn]);

  const DefaultView = () => (
    <div className="business-card-display">
      {isLoading ? (
        <div className="w-full h-24 flex items-center justify-center bg-muted rounded-lg animate-pulse">
          Loading...
        </div>
      ) : (
        <img
          src={
            storedImage?.url ||
            "/lovable-uploads/74b13cbe-0d2e-4997-8470-12fb69697b68.png"
          }
          alt="Example business card - Jane Doeington"
          className="w-full rounded-lg shadow-xl border"
        />
      )}
    </div>
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSanitizedBio(DOMPurify.sanitize(card.about.bio ?? ""));
    }
  }, [card.about.bio]);
  // console.log("about==>",cardSectionType);

  const showCardPreview = hasUserInput(card);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTemplate(!showCardPreview);
    }, 150);
    return () => clearTimeout(timer);
  }, [showCardPreview]);

  if (!showCardPreview) {
    return <DefaultView />;
  }

  /* Phone Handle Click Event*/
  const handleLinkClick = async (e) => {
    if (isEditMode) return; // Allow natural tel/sms link behavior in preview
    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }
    } catch (error) {
      console.error("Error updating LinkedIn share count:", error);
    }
  };

  /* Email Handle Click Event*/
  const handleEmailClick = async (e) => {
    if (isEditMode) {
      if (card?.business?.email) {
        window.open(`mailto:${card.business.email}`, "_blank");
      }
      return;
    }
    e.preventDefault();

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open the mail client after counting
      window.location.href = `mailto:${card.business.email}`;
    } catch (error) {
      console.error("Error updating email click count:", error);
    }
  };

  /* Website Handle Click Event*/
  const handleWebsiteClick = async (e) => {
    e.preventDefault();
    if (card?.business?.website) {
      window.open(
        formatWebsiteUrl(card.business.website),
        "_blank",
        "noopener,noreferrer",
      );
    }

    if (isEditMode) return;

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open website after counter updates
      window.open(card.business.website, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error updating website click count:", error);
    }
  };

  /* Address Handle Click Event*/
  const handleAddressClick = async (e) => {
    const fullAddress = [
      card.business.address.street,
      card.business.address.city,
      card.business.address.state,
      card.business.address.zip,
    ]
      .filter(Boolean)
      .join(", ");

    const encodedAddress = encodeURIComponent(fullAddress);

    if (isEditMode) {
      if (fullAddress) {
        window.open(`https://www.google.com/maps?q=${encodedAddress}`, "_blank");
      }
      return;
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open Google Maps after counting
      window.open(`https://www.google.com/maps?q=${encodedAddress}`, "_blank");
    } catch (error) {
      console.error("Error updating address click count:", error);
    }
  };

  /* Linkedln Handle Click Event*/
  const handleLinkedlnClick = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      if (card.social.linkedin) {
        window.open(normalizeUrl(card.social.linkedin), "_blank", "noopener,noreferrer");
      }
      return;
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open LinkedIn after updating click count
      window.open(card.social.linkedin, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error updating LinkedIn click count:", error);
    }
  };

  /* Twitter Handle Click Event*/
  const handleTwitterClick = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      if (card.social.twitter) {
        window.open(normalizeUrl(card.social.twitter), "_blank", "noopener,noreferrer");
      }
      return;
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open Twitter after updating Firestore
      window.open(card.social.twitter, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error updating Twitter click count:", error);
    }
  };

  /* Facebook Handle Click Event*/
  const handleFacebookClick = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      if (card.social.facebook) {
        window.open(normalizeUrl(card.social.facebook), "_blank", "noopener,noreferrer");
      }
      return;
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open Facebook link after Firestore update
      window.open(card.social.facebook, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error updating Facebook click count:", error);
    }
  };

  /* Instagram Handle Click Event*/
  const handleInstagramClick = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      if (card.social.instagram) {
        window.open(normalizeUrl(card.social.instagram), "_blank", "noopener,noreferrer");
      }
      return;
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open Instagram after Firestore update
      window.open(card.social.instagram, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error updating Instagram click count:", error);
    }
  };

  /* Youtube Handle Click Event*/
  const handleYoutubeClick = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      if (card.social.youtube) {
        window.open(normalizeUrl(card.social.youtube), "_blank", "noopener,noreferrer");
      }
      return;
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open YouTube after Firestore update
      window.open(normalizeUrl(card.social.youtube), "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error updating YouTube click count:", error);
    }
  };

  /* TikTok Handle Click Event*/
  const handleTiktokClick = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      if (card.social.tiktok) {
        window.open(normalizeUrl(card.social.tiktok), "_blank", "noopener,noreferrer");
      }
      return;
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open TikTok link after Firestore update
      window.open(card.social.tiktok, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error updating TikTok click count:", error);
    }
  };

  /* Pinterest Handle Click Event*/
  /**
   * Link-click tracking for a social link, parameterised by URL.
   *
   * The ten older platforms each have their own ~55-line copy of this
   * (handlePinterestClick, handleVimeoClick, ...) differing only in the URL
   * they open. New platforms use this one instead of adding more copies.
   */
  const handleSocialLinkClick = async (e: any, url?: string, label = "link") => {
    e.preventDefault();
    if (!url) return;
    if (isEditMode) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const cardsSnapshot = await getDocs(
        query(
          collection(db, "cards"),
          where("metadata.id", "==", card.metadata.id),
        ),
      );

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();
        if (user?.uid === cardData?.uid) continue;

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${monthKey}-${String(now.getDate()).padStart(2, "0")}`;

        await updateDoc(cardDoc.ref, {
          linkClick: (cardData.linkClick || 0) + 1,
          [`linkClicksByMonth.${monthKey}`]:
            (cardData.linkClicksByMonth?.[monthKey] || 0) + 1,
          [`linkClicksByDay.${dayKey}`]:
            (cardData.linkClicksByDay?.[dayKey] || 0) + 1,
        });
      }
    } catch (error) {
      console.error(`Error updating ${label} click count:`, error);
    } finally {
      // Opened even if the counter write fails - the visitor's click must work.
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handlePinterestClick = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      if (card.social.pinterest) {
        window.open(normalizeUrl(card.social.pinterest), "_blank", "noopener,noreferrer");
      }
      return;
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open Pinterest link after Firestore update
      window.open(card.social.pinterest, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error updating Pinterest click count:", error);
    }
  };

  /* Vimeo Handle Click Event*/
  const handleVimeoClick = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      if (card.social.vimeo) {
        window.open(normalizeUrl(card.social.vimeo), "_blank", "noopener,noreferrer");
      }
      return;
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open Vimeo link after Firestore update
      window.open(card.social.vimeo, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error updating Vimeo click count:", error);
    }
  };

  /* Snapchat Handle Click Event*/
  const handleSnapchatClick = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      if (card.social.snapchat) {
        window.open(normalizeUrl(card.social.snapchat), "_blank", "noopener,noreferrer");
      }
      return;
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open Snapchat link after Firestore update
      window.open(card.social.snapchat, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error updating Snapchat click count:", error);
    }
  };

  /* Twitch Handle Click Event*/
  const handleTwitchClick = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      if (card.social.twitch) {
        window.open(normalizeUrl(card.social.twitch), "_blank", "noopener,noreferrer");
      }
      return;
    }

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id),
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentClicks = cardData.linkClick || 0;
        const linkClicksByMonth = cardData.linkClicksByMonth || {};
        const linkClicksByDay = cardData.linkClicksByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthClick = (linkClicksByMonth[monthKey] || 0) + 1;
        const updatedDayClick = (linkClicksByDay[dayKey] || 0) + 1;

        // === UPDATE ONLY IF USER IS NOT OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            linkClick: currentClicks + 1,
            [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
          });
        }
      }

      // ✅ Open Twitch link after Firestore update
      window.open(card.social.twitch, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error updating Twitch click count:", error);
    }
  };

  // useEffect(() => {
  //   console.log("Length", showBackbtn);
  //   if (typeof window !== "undefined") {
  //     if (window.history.length > 3) {
  //       setShowBackButton(!showBackbtn || true);
  //     } else {
  //       setShowBackButton(!showBackbtn || false);
  //     }
  //   }
  // }, [window, showBackbtn]);

  // Only use the stored backup image while it is actually loadable.
  const usableBackupUrl =
    storedBackupCardImage?.url && storedBackupCardImage.url !== failedBackupUrl
      ? storedBackupCardImage.url
      : undefined;

  // Avatar spots always need *some* src, otherwise the browser renders a
  // broken-image icon with the alt text visible.
  const avatarFallbackUrl =
    usableBackupUrl || "/lovable-uploads/74b13cbe-0d2e-4997-8470-12fb69697b68.png";

  // Shown when the card has no usable image at all.
  const initialsAvatar = (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl">
        {fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)}
      </div>
    </div>
  );
  /* ------------------------------------------------------------------
   * DYNAMIC MIDDLE CONTENT (Below CTA & Above About Me)
   * ------------------------------------------------------------------
   * Reordered dynamically according to card.profileContentOrder
   * when dragged & dropped in PROFILE CONTENT.
   * ------------------------------------------------------------------ */
  const getBusinessAddressText = () => {
    const addr = card?.business?.address;
    if (!addr) return "";
    if (typeof addr === "string") {
      try {
        const parsed = JSON.parse(addr);
        return [
          parsed.street,
          parsed.city,
          parsed.state,
          parsed.zip,
          parsed.country,
        ]
          .filter(Boolean)
          .join(", ");
      } catch {
        return addr;
      }
    }
    return [
      addr.street,
      addr.city,
      addr.state,
      addr.zip,
      addr.country,
    ]
      .filter(Boolean)
      .join(", ");
  };


  interface MiddleContentItem {
    id: string;
    base: string;
    label: string;
    text: string;
    url: string;
    target?: string;
    Icon: any;
    onClick: (e: any) => void;
    isSocial?: boolean;
    isBusinessAddress?: boolean;
  }

  const getMiddleContentItems = (): MiddleContentItem[] => {
    const items: MiddleContentItem[] = [];

    // 1. Phone
    if (card?.business?.phone?.trim()) {
      const isText = card?.business?.phoneAction === "text";
      items.push({
        id: "Phone",
        base: "Phone",
        label: card.contentTitles?.["Phone"] || (isText ? "Text" : "Phone"),
        text: formatPhone(card.business.phone),
        url: isText
          ? `sms:${card.business.phone}`
          : `tel:${card.business.phone}`,
        target: "_blank",
        Icon: isText ? MessageCircle : Phone,
        onClick: handleLinkClick,
      });
    }

    // 2. Email
    if (card?.business?.email?.trim()) {
      items.push({
        id: "Email",
        base: "Email",
        label: card.contentTitles?.["Email"] || "Email",
        text: card.business.email,
        url: `mailto:${card.business.email}`,
        target: "_self",
        Icon: Mail,
        onClick: handleEmailClick,
      });
    }

    // 3. Website
    if (card?.business?.website?.trim()) {
      items.push({
        id: "Website",
        base: "Website",
        label: card.contentTitles?.["Website"] || "Website",
        text: card.business.website,
        url: websiteUrl,
        target: "_blank",
        Icon: Globe,
        onClick: handleWebsiteClick,
      });
    }

    // 4. Primary Address
    const addressText = getBusinessAddressText();
    if (addressText.trim()) {
      items.push({
        id: "Address",
        base: "Address",
        label: card.contentTitles?.["Address"] || "Address",
        text: addressText,
        url: `https://www.google.com/maps?q=${encodeURIComponent(addressText)}`,
        target: "_blank",
        Icon: MapPin,
        onClick: (e) =>
          handleSocialLinkClick(
            e,
            `https://www.google.com/maps?q=${encodeURIComponent(addressText)}`,
            card.contentTitles?.["Address"] || "Address",
          ),
        isBusinessAddress: true,
      });
    }

    // 5. Social Media links
    if (card.social.linkedin?.trim()) {
      items.push({
        id: "LinkedIn",
        base: "LinkedIn",
        label: card.contentTitles?.["LinkedIn"] || "LinkedIn",
        text: card.social.linkedin,
        url: normalizeUrl(card.social.linkedin),
        target: "_blank",
        Icon: Linkedin,
        onClick: handleLinkedlnClick,
        isSocial: true,
      });
    }
    if (card.social.twitter?.trim()) {
      items.push({
        id: "X",
        base: "X",
        label:
          card.contentTitles?.["Twitter"] ||
          card.contentTitles?.["X"] ||
          "Twitter",
        text: card.social.twitter,
        url: normalizeUrl(card.social.twitter),
        target: "_blank",
        Icon: FaXTwitter,
        onClick: handleTwitterClick,
        isSocial: true,
      });
    }
    if (card.social.facebook?.trim()) {
      items.push({
        id: "Facebook",
        base: "Facebook",
        label: card.contentTitles?.["Facebook"] || "Facebook",
        text: card.social.facebook,
        url: normalizeUrl(card.social.facebook),
        target: "_blank",
        Icon: Facebook,
        onClick: handleFacebookClick,
        isSocial: true,
      });
    }
    if (card.social.youtube?.trim()) {
      items.push({
        id: "YouTube",
        base: "YouTube",
        label: card.contentTitles?.["YouTube"] || "YouTube",
        text: card.social.youtube,
        url: normalizeUrl(card.social.youtube),
        target: "_blank",
        Icon: Youtube,
        onClick: handleYoutubeClick,
        isSocial: true,
      });
    }
    if (card.social.instagram?.trim()) {
      items.push({
        id: "Instagram",
        base: "Instagram",
        label: card.contentTitles?.["Instagram"] || "Instagram",
        text: card.social.instagram,
        url: normalizeUrl(card.social.instagram),
        target: "_blank",
        Icon: Instagram,
        onClick: handleInstagramClick,
        isSocial: true,
      });
    }
    if (card.social.tiktok?.trim()) {
      items.push({
        id: "TikTok",
        base: "TikTok",
        label: card.contentTitles?.["TikTok"] || "TikTok",
        text: card.social.tiktok,
        url: normalizeUrl(card.social.tiktok),
        target: "_blank",
        Icon: FaTiktok,
        onClick: handleTiktokClick,
        isSocial: true,
      });
    }
    if (card.social.pinterest?.trim()) {
      items.push({
        id: "Pinterest",
        base: "Pinterest",
        label: card.contentTitles?.["Pinterest"] || "Pinterest",
        text: card.social.pinterest,
        url: normalizeUrl(card.social.pinterest),
        target: "_blank",
        Icon: FaPinterest,
        onClick: handlePinterestClick,
        isSocial: true,
      });
    }
    if (card.social.snapchat?.trim()) {
      items.push({
        id: "Snapchat",
        base: "Snapchat",
        label: card.contentTitles?.["Snapchat"] || "Snapchat",
        text: card.social.snapchat,
        url: normalizeUrl(card.social.snapchat),
        target: "_blank",
        Icon: FaSnapchat,
        onClick: handleSnapchatClick,
        isSocial: true,
      });
    }
    if (card.social.vimeo?.trim()) {
      items.push({
        id: "Vimeo",
        base: "Vimeo",
        label: card.contentTitles?.["Vimeo"] || "Vimeo",
        text: card.social.vimeo,
        url: normalizeUrl(card.social.vimeo),
        target: "_blank",
        Icon: FaVimeoV,
        onClick: handleVimeoClick,
        isSocial: true,
      });
    }
    if (card.social.twitch?.trim()) {
      items.push({
        id: "Twitch",
        base: "Twitch",
        label: card.contentTitles?.["Twitch"] || "Twitch",
        text: card.social.twitch,
        url: normalizeUrl(card.social.twitch),
        target: "_blank",
        Icon: FaTwitch,
        onClick: handleTwitchClick,
        isSocial: true,
      });
    }

    // 6. Content Links & Messengers
    for (const item of activeContentLinks) {
      items.push({
        id: item.key,
        base: item.base,
        label: item.label,
        text: item.text,
        url: item.url,
        target: "_blank",
        Icon: item.Icon,
        onClick: (e) => handleSocialLinkClick(e, item.url, item.label),
        isSocial: (CARD_SOCIAL_LABELS as readonly string[]).includes(item.base),
      });
    }

    // Sort by profileContentOrder
    items.sort(
      (a, b) => rankContentItem(a.id, a.base) - rankContentItem(b.id, b.base),
    );

    return items;
  };

  /** Modern Standard and Sleek / Portrait pill rows */
  const renderModernPillRows = () => {
    const items = getMiddleContentItems().filter(
      (item) => !item.isBusinessAddress,
    );
    return items.map((item) => (
      <a
        key={`modern-row-${item.id}`}
        href={item.url}
        target={item.target}
        rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
        onClick={item.onClick}
        className="flex items-center justify-between rounded-[10px] cursor-pointer"
        style={{
          ["--hover-color" as string]: card.brandColor,
          ["--hover-bg" as string]: `${card.brandColor}26`,
        }}
      >
        <div className="relative w-full">
          <div
            className="bg-card text-card-foreground pl-8 pr-4 py-2 rounded-[10px] flex items-center justify-between ml-6"
            style={{
              boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
            }}
            {...rowHoverProps}
          >
            <div className="flex-1 min-w-0 overflow-hidden [mask-image:linear-gradient(90deg,#15202b_75%,transparent_85%)]">
              <p className="text-base font-bold">{item.label}</p>
              <p className="text-sm truncate">{item.text}</p>
            </div>
            <ArrowRight className="w-5 h-5 flex-shrink-0" />
          </div>
          <div
            className={cn(
              "absolute -left-0 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center shadow-lg",
              iconShapeClass,
            )}
            style={getSocialIconStyles(item.base)}
          >
            <item.Icon size={27} />
          </div>
        </div>
      </a>
    ));
  };

  /** Centered and Fade In tiles */
  const renderTileRows = (labelClass: string) => {
    const items = getMiddleContentItems().filter(
      (item) => !item.isBusinessAddress,
    );
    return items.map((item) => (
      <a
        key={`tile-${item.id}`}
        href={item.url}
        target={item.target}
        rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
        onClick={item.onClick}
        className="flex-1 items-center justify-between rounded-[10px] cursor-pointer"
        style={{
          ["--hover-color" as string]: card.brandColor,
          ["--hover-bg" as string]: `${card.brandColor}26`,
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center shadow-md",
              socialIconShapeClass,
            )}
            style={getSocialIconStyles(item.base)}
            {...chipHoverProps}
          >
            <item.Icon size={27} />
          </div>
          <p className={labelClass}>{item.label}</p>
        </div>
      </a>
    ));
  };

  /** Classic and Traditional rows */
  const renderClassicRows = () => {
    const items = getMiddleContentItems().filter(
      (item) => card.templateType !== "traditional" || !item.isSocial,
    );
    return items.map((item) => (
      <a
        key={`classic-row-${item.id}`}
        href={item.url}
        target={item.target}
        rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
        onClick={item.onClick}
        className="relative flex items-center gap-4 text-card-foreground group cursor-pointer"
        style={linkHoverVars}
      >
        <div
          className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: "var(--hover-bg)" }}
        />
        <div
          className={cn("p-3 flex-shrink-0", iconShapeClass)}
          style={getSocialIconStyles(item.base)}
        >
          <item.Icon size={24} />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden relative [mask-image:linear-gradient(90deg,#000_94%,transparent_100%)]">
          <p className="text-base text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors whitespace-nowrap">
            {item.text}
          </p>
          <p className="text-sm text-muted-foreground truncate">{item.label}</p>
        </div>
      </a>
    ));
  };

  return (
    /* The hover colours live on the root so every chip and row inherits them.
       The CSS in globals.css reads these; nothing writes to element.style any
       more, which is what used to leave an icon stuck looking disabled. */
    <div
      className={`flex flex-col ${card?.theme === "dark" ? "dark" : ""}`}
      style={
        {
          "--hover-color": card.brandColor,
          "--hover-bg": `${card.brandColor}26`,
          "--chip-hover-shadow": `${card.brandColor}40`,
        } as React.CSSProperties
      }
    >
      {card.templateType !== "modern" ? (
        <div
          key={key}
          className={`business-card-display bg-card rounded-lg shadow-lg overflow-hidden card-preview transition-opacity duration-200 ${
            showTemplate ? "opacity-0" : "opacity-100"
          } ${className}`}
        >
          {/* Header Section - Always show with brand color background */}
          <div
            className={
              (card.cardLayout || "").toLowerCase() === "portrait"
                ? "relative h-[30rem]"
                : "relative h-[270px]"
            }
            key={key}
            style={{ backgroundColor: `${card.brandColor}80` || "#4299e1" }}
          >
            {(card.cardLayout || "").toLowerCase() === "portrait" ? (
              card.profilePhoto &&
              card.profilePhoto !== storedOldImage?.url ? (
                <img
                  loading="lazy"
                  src={card.profilePhoto}
                  alt={fullName}
                  className="w-full h-full object-center NR1 object-cover"
                  key={card.profilePhoto}
                />
              ) : usableBackupUrl ? (
                <img
                  src={usableBackupUrl}
                  alt="Card Preview"
                  onError={(e) => setFailedBackupUrl(e.currentTarget.src)}
                  className="w-full h-full rounded-md object-contain"
                />
              ) : (
                initialsAvatar
              )
            ) : card.coverImage ? (
              <img
                loading="lazy"
                src={card.coverImage}
                alt={fullName}
                //style={{ transform: "scale(1.5)" }}
                className="w-full h-full object-center object-cover NR"
              />
            ) : usableBackupUrl ? (
              <img
                src={usableBackupUrl}
                alt="Card Preview"
                onError={(e) => setFailedBackupUrl(e.currentTarget.src)}
                className="w-full h-full rounded-md object-contain"
              />
            ) : (
              initialsAvatar
            )}
            {[
              "extended",
              "standard",
              "centered",
              "align-right",
              "align-left",
              "slides",
            ].includes((card.cardLayout || "").toLowerCase()) && (
              <div
                className={`absolute rounded-full
       ${
         (card.cardLayout || "").toLowerCase() === "extended"
           ? "bottom-0 right-6 translate-y-1/2"
           : ""
       }
        ${
          (card.cardLayout || "").toLowerCase() === "standard"
            ? "bottom-0 left-6 translate-y-1/2"
            : ""
        }
        ${
          (card.cardLayout || "").toLowerCase() === "centered"
            ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
            : ""
        }
         ${
           (card.cardLayout || "").toLowerCase() === "align-right"
             ? "bottom-0 right-6 translate-y-1/2"
             : ""
         }
        ${
          (card.cardLayout || "").toLowerCase() === "align-left"
            ? "bottom-0 left-6 translate-y-1/2"
            : ""
        }
               ${
                 (card.cardLayout || "").toLowerCase() === "slides"
                   ? "bottom-0 right-6 translate-y-1/2"
                   : ""
               }
     `}
                style={{ backgroundColor: "transparent" }}
              >
                {card.profilePhoto && (
                  <div
                    className={`
                w-32 h-32 rounded-full object-cover
                ${
                  card.templateType !== "traditional"
                    ? "relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:right-0 before:bg-white before:rounded-[100px] before:-z-10"
                    : ""
                }
              `}
                  >
                    <div
                      className={`
                w-32 h-32 rounded-full object-cover
                ${"relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:right-0 before:bg-white before:rounded-[100px] before:-z-10"}
              `}
                    >
                      <img
                        src={
                          card.profilePhoto &&
                          card.profilePhoto != storedOldImage?.url
                            ? card.profilePhoto
                            : avatarFallbackUrl
                        }
                        alt="Profile"
                        onError={(e) => setFailedBackupUrl(e.currentTarget.src)}
                        className="w-32 h-32 rounded-full object-cover"
                        style={
                          card.templateType == "traditional"
                            ? {
                                boxShadow:
                                  "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                                border: `6px solid ${card.brandColor}`,
                                backgroundColor: `${card.brandColor}80`,
                              }
                            : {
                                boxShadow:
                                  "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                                border: `6px solid #FFF`,
                                backgroundColor: `${card.brandColor}80`,
                              }
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {card.companyLogo &&
              [
                "extended",
                "standard",
                "centered",
                "align-right",
                "align-left",
              ].includes((card.cardLayout || "").toLowerCase()) && (
                <div
                  className={`absolute
      ${
        (card.cardLayout || "").toLowerCase() === "extended"
          ? "object-cover top-6 left-6 w-20 h-[60px] rounded-xl"
          : ""
      }
      ${
        (card.cardLayout || "").toLowerCase() === "standard"
          ? "object-cover bottom-0 right-6 translate-y-1/2 w-20 h-[60px] rounded-xl NR"
          : ""
      }
       ${(card.cardLayout || "").toLowerCase() === "centered" ? "left-1/2" : ""}
  
      ${(card.cardLayout || "").toLowerCase() === "align-right" ? "top-4 left-4" : ""}
      ${(card.cardLayout || "").toLowerCase() === "align-left" ? "top-4 right-4" : ""}
    `}
                  style={
                    (card.cardLayout || "").toLowerCase() === "centered"
                      ? { transform: "translate(30%, 30%)" } // X=right, Y=down
                      : {}
                  }
                >
                  <img
                    src={card.companyLogo}
                    alt="Logo"
                    className={`${
                      (card.cardLayout || "").toLowerCase() === "centered"
                        ? "object-cover -bottom-16 left-1/2 translate-x-[0%] w-20 h-[60px] rounded-xl"
                        : "w-20 h-[60px] rounded-lg NR123"
                    }`}
                    style={{ aspectRatio: "4 / 3" }}
                  />
                </div>
              )}
            {isEditMode && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.dispatchEvent(new Event("open-image-edit-dialog"));
                }}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-slate-800 font-bold px-4 py-2 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center gap-2 hover:bg-white transition-colors z-[60]"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {/* Brand Color Banner */}
          {card.templateType == "traditional" ? (
            <div
              className="h-5"
              style={{ backgroundColor: card.brandColor || "#4299e1" }}
            />
          ) : (
            <div className="h-0" />
          )}

          {/* Profile Section */}
          <div
            className={`px-5 sm:px-8 py-5 ${
              card.templateType == "classic" && card.cardLayout === "portrait"
                ? "mt-0"
                : card.cardLayout === "align-left" ||
                    card.cardLayout === "align-right" ||
                    card.cardLayout === "slides"
                  ? "mt-8"
                  : card.templateType == "classic"
                    ? "mt-16"
                    : "mt-0"
            }`}
            style={{}}
          >
            {hasProfileInfo && (
              <div
                className={`${
                  card.templateType == "classic" ? "text-left" : "text-center"
                }`}
              >
                <div
                  className={`${
                    card.templateType == "classic"
                      ? "flex flex-wrap items-baseline justify-start gap-x-2 gap-y-0"
                      : "flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0"
                  }`}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-card-foreground break-words">
                    {fullName ?? ""}
                  </h2>
                  {card.profile.accreditations.length > 0 && (
                    <span className="text-muted-foreground text-base sm:text-lg font-normal whitespace-nowrap leading-none">
                      {card.profile.accreditations.join(", ")}
                    </span>
                  )}
                </div>
                <div className="text-base leading-relaxed text-muted-foreground mt-1 space-y-0.5 break-words whitespace-pre-wrap">
                  <p className="mb-0.5" style={{ color: card.brandColor }}>
                    {card.profile.title}
                    {card.profile.department && (
                      <span className="ml-2 text-muted-foreground break-words whitespace-pre-wrap">
                        • {card.profile.department}
                      </span>
                    )}
                  </p>

                  {/* {card.profile.education && (
                    <p className="text-xs text-muted-foreground mt-1 break-words whitespace-pre-wrap">
                      🎓 {card.profile.education}
                    </p>
                  )} */}

                  <p className="font-bold text-card-foreground">
                    {card.profile.company}
                  </p>
                </div>
                {card.profile.companySlogan && (
                  <p className="text-base text-muted-foreground italic mt-2 break-words">
                    "{card.profile.companySlogan}"
                  </p>
                )}
              </div>
            )}

            {/* Appointment blocks. Each renders on its own now - a user can
                have a Call-to-Action AND an ad AND a booking link. The CTA
                keeps the button slot; the others stack beneath it. */}
            {classicAppointments.length > 0 && (
              <div className="mt-4 flex flex-col items-center gap-1">
                {classicAppointments}
              </div>
            )}

            {/* Contact Information */}
            {hasContactBlock && (
              <div className="mt-3 space-y-3">
                {renderClassicRows()}
              </div>
            )}

            {/* See CONTENT DIVIDER above - drawn only when the user has added
                the Divider content item. */}
            {renderContentDivider("about")}

            {/* About Section */}
            {(!cardSectionType || cardSectionType === "") && card.about.bio && (
              <div className="mt-4">
                <h3 className="text-xl font-bold text-card-foreground mb-1">
                  {card.about.customSectionTitle || "About Me"}
                </h3>
                <p
                  className="text-base text-muted-foreground leading-relaxed break-words whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: sanitizedBio }}
                ></p>
              </div>
            )}

            {cardSectionType && (
              <div className="mt-4">
                <h3 className="text-xl font-bold text-card-foreground mb-1">
                  {cardSectionType === "custom" &&
                  card?.about?.customSectionTitle?.length > 0
                    ? card.about.customSectionTitle
                      ? card.about.customSectionTitle
                      : "About Me"
                    : cardSectionType === "aboutMe" && sanitizedBio?.length > 0
                      ? "About Me"
                      : ""}
                </h3>
                <p
                  className="text-base text-muted-foreground leading-relaxed break-words whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: sanitizedBio }}
                ></p>
              </div>
            )}

            {/* Photos & Document dropdowns - see richContentDropdowns above */}
            {renderContentDivider("rich")}
            {richContentDropdowns}
            {renderContentDivider("end")}

            {/* Social Links */}
            {card.templateType !== "classic" && activeSocialItems.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 sm:gap-5 mt-5">
                {activeSocialItems.map((item) => (
                  <a
                    key={`social-circle-${item.id}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "p-2 transition-all duration-200 hover:scale-105",
                      socialIconShapeClass,
                    )}
                    style={getSocialIconStyles(item.base)}
                    {...chipHoverProps}
                    onClick={item.onClick}
                    title={item.label}
                  >
                    <item.Icon size={24} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {card.templateType === "modern" && (
            <>
              {card.cardLayout == "standard" && (
                <>
                  {!isEditMode &&
                    showBackButton &&
                    card.templateType == "modern" && (
                      <div className="mt-6 flex items-center justify-between business-card-display1">
                        <button
                          onClick={onNavigateBack}
                          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                          <ArrowLeft size={20} />
                          Back
                        </button>
                      </div>
                    )}
                  {!isEditMode && (
                    <div className="text-center py-5 text-base font-medium">
                      <h2>Solo</h2>
                    </div>
                  )}
                  <div
                    className={`rounded-[15px] ${isEditMode ? "" : "sm:mx-auto"}`}
                  >
                    <div className="justify-center px-5 py-5 bg-card rounded-[15px] card-preview">
                      <div
                        className={`w-full rounded-t-[15px] ${
                          isEditMode ? "sm:w-auto" : "sm:w-[460px]"
                        }`}
                      >
                        <div
                          className="overflow-hidden rounded-[15px]"
                          style={{
                            //backgroundColor: "#f9f9f9c7",
                            boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
                          }}
                        >
                          {/* Cover Image */}
                          <div
                            className={`relative h-[134px] sm:h-[190px] w-full ${
                              card.coverImage &&
                              card.coverImage !== storedOldImage?.url
                                ? "bg-cover"
                                : "bg-contain"
                            } bg-center bg-no-repeat`}
                            style={{
                              backgroundColor: `${card.brandColor}80`,
                              backgroundImage:
                                card.coverImage &&
                                card.coverImage !== storedOldImage?.url
                                  ? `url(${card.coverImage})`
                                  : `linear-gradient(
                                180deg,
                                #FFFFFF 0%,
                                ${card.brandColor}99 100%
                              ),
                              url(${storedBackupCardImage?.url})`,
                              borderRadius: "15px",
                              border: `3px solid ${card?.brandColor}`,
                            }}
                          ></div>

                          {/* Profile */}
                          {card.cardLayout == "standard" && (
                            <div className="relative px-6">
                              <div className="absolute -top-[5.0rem] sm:-top-[6.5rem] left-4">
                                <div className="relative w-[90px] h-[90px] sm:w-[122px] sm:h-[122px]">
                                  <img
                                    src={
                                      card.profilePhoto &&
                                      card.profilePhoto != storedOldImage?.url
                                        ? card.profilePhoto
                                        : avatarFallbackUrl
                                    }
                                    alt="Profile"
                                    onError={(e) => setFailedBackupUrl(e.currentTarget.src)}
                                    className="w-[90px] h-[90px] sm:w-[122px] sm:h-[122px] rounded-full object-cover"
                                    style={{
                                      border: `3px solid ${card?.brandColor}`,
                                    }}
                                  />

                                  {/* Logo Overlay */}
                                  {/* left-[190px] */}
                                  {card?.companyLogo && (
                                    <div className="absolute bottom-0 right-0 w-[30px] h-[30px] sm:w-[40px] sm:h-[40px] rounded-lg flex items-center justify-center shadow-md top-[58px] sm:top-[77px]">
                                      <img
                                        src={card?.companyLogo}
                                        alt="Logo"
                                        className="w-[30px] h-[30px] sm:w-[40px] sm:h-[40px] object-cover rounded-lg"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Content */}
                          <div className="pt-4 px-5 pb-3 text-white bg-card">
                            <div className="flex flex-wrap items-baseline justify-start gap-x-2 gap-y-0">
                              {fullName && (
                                <h2
                                  className={`font-bold text-2xl sm:text-3xl text-card-foreground break-words`}
                                >
                                  {fullName ?? ""}
                                </h2>
                              )}
                              {card.profile.accreditations.length > 0 && (
                                <span className="text-muted-foreground text-base sm:text-lg font-normal whitespace-nowrap leading-none">
                                  {card.profile.accreditations.join(", ")}
                                </span>
                              )}
                            </div>

                            {card.profile.companySlogan && (
                              <p className="text-base text-muted-foreground mt-0.5 break-words">
                                "{card.profile.companySlogan}"
                              </p>
                            )}

                            <div
                              className="mt-1.5 border-l-2 border-dashed pl-2 text-base leading-relaxed ml-2 space-y-0.5"
                              style={{ borderLeftColor: card?.brandColor }}
                            >
                              {(card.profile.title ||
                                card.profile.department ||
                                card.profile.company) && (
                                <>
                                  <p className="text-muted-foreground break-words whitespace-pre-wrap">
                                    {card.profile.title}{" "}
                                    {card.profile.title &&
                                    card.profile.department
                                      ? "|"
                                      : ""}{" "}
                                    {card.profile.department}
                                  </p>

                                  {/* {card.profile.education && (
                                    <p className="text-xs text-muted-foreground break-words whitespace-pre-wrap mt-1">
                                      🎓 {card.profile.education}
                                    </p>
                                  )} */}

                                  <p className="text-muted-foreground break-words whitespace-pre-wrap">
                                    {card.profile.company}
                                  </p>
                                </>
                              )}
                              
                              {hasAddress && (
                                <p className="text-muted-foreground break-words whitespace-pre-wrap">
                                  {[
                                    card.business.address.street,
                                    card.business.address.city,
                                    card.business.address.state,
                                    card.business.address.zip,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              )}
                            </div>

                            {/* Appointment blocks - Call-to-Action, Direct Ads, Calendly and
                                Google Calendar are independent, so any combination can show.
                                The CTA keeps the button slot; the rest stack beneath it. */}
                            {modernAppointments.length > 0 && (
                              <div className="mt-4 flex flex-col items-start gap-1">
                                {modernAppointments}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex gap-3 mt-3 px-4">
                            <button
                              onClick={() => onExchangePress?.()}
                              className="flex-1 h-[48px] rounded-md font-bold text-base sm:text-lg text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg"
                              style={{ backgroundColor: card?.brandColor }}
                            >
                              Exchange Contact
                            </button>
                            <button
                              onClick={() => handleSharedCard?.()}
                              className="w-[48px] h-[48px] rounded-md flex items-center justify-center text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg"
                              style={{ backgroundColor: card?.brandColor }}
                            >
                              <Share2 size={20} />
                            </button>

                            <button
                              onClick={() => handleDownloadVCard?.()}
                              className="w-[48px] h-[48px] rounded-md flex items-center justify-center text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg"
                              style={{ backgroundColor: card?.brandColor }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="mt-3 space-y-2">
                            {renderModernPillRows()}
                            {/* See CONTENT DIVIDER above. */}
                            {renderContentDivider("about")}
                            {sanitizedBio?.length > 0 && (
                              /* !mt-2, not mt-2: the contact/social list above
                                 uses space-y-2, so an 8px top margin made the
                                 About block read as one more row in that list
                                 instead of a new section. 24px is a clear
                                 section break against an 8px row rhythm.

                                 The `!` is required. This div is a CHILD of
                                 that space-y-2 container, and space-y compiles
                                 to `.space-y-2 > :not([hidden]) ~ :not([hidden])`
                                 - specificity (0,3,0) against mt-6's (0,1,0) -
                                 so the parent silently forces margin-top back
                                 to 0.5rem. Any plain mt-* value is ignored
                                 here, however large. */
                              <div className="!mt-2">
                                <Accordion
                                  type="single"
                                  collapsible
                                  style={{}}
                                >
                                  {((!cardSectionType ||
                                    cardSectionType === "") &&
                                    card.about.bio) ||
                                  cardSectionType ? (
                                    <AccordionItem
                                      value="about"
                                      className="border-b-0"
                                    >
                                      <AccordionTrigger className="text-xl font-bold py-2 mb-1.5 no-underline hover:no-underline border-b-0">
                                        {(!cardSectionType ||
                                          cardSectionType === "") &&
                                          (card.about.customSectionTitle ||
                                            "About Me")}

                                        {cardSectionType &&
                                          (cardSectionType === "custom" &&
                                          card?.about?.customSectionTitle
                                            ?.length > 0
                                            ? card.about.customSectionTitle
                                            : cardSectionType === "aboutMe" &&
                                                sanitizedBio?.length > 0
                                              ? "About Me"
                                              : "")}
                                      </AccordionTrigger>

                                      <AccordionContent>
                                        <p
                                          className="text-base text-muted-foreground leading-relaxed break-words whitespace-pre-wrap"
                                          dangerouslySetInnerHTML={{
                                            __html: sanitizedBio,
                                          }}
                                        />
                                      </AccordionContent>
                                    </AccordionItem>
                                  ) : null}
                                </Accordion>
                              </div>
                            )}

                            {/* Photos & Document dropdowns - see richContentDropdowns above */}
                            {renderContentDivider("rich")}
                            {richContentDropdowns}
                            {renderContentDivider("end")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {card.cardLayout == "centered" && (
                <>
                  {!isEditMode &&
                    showBackButton &&
                    card.templateType == "modern" && (
                      <div className="mt-6 flex items-center justify-between business-card-display1">
                        <button
                          onClick={onNavigateBack}
                          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                          <ArrowLeft size={20} />
                          Back
                        </button>
                      </div>
                    )}
                  {!isEditMode && (
                    <div className="text-center py-5 text-base font-medium">
                      <h2>Solo</h2>
                    </div>
                  )}
                  <div
                    className={`rounded-[15px] ${isEditMode ? "" : "mx-auto"}`}
                  >
                    <div className="justify-center px-5 py-5 bg-card rounded-[15px] card-preview">
                      <div
                        className={`w-full rounded-t-[15px] ${
                          isEditMode ? "sm:w-auto" : "sm:w-[460px]"
                        }`}
                      >
                        <div
                          className="overflow-hidden rounded-[15px]"
                          style={{
                            //backgroundColor: "#f9f9f9c7",
                            boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
                          }}
                        >
                          {/* Cover Image */}
                          <div
                            className={`relative h-[134px] sm:h-[190px] w-full ${
                              card.coverImage &&
                              card.coverImage !== storedOldImage?.url
                                ? "bg-cover"
                                : "bg-contain"
                            } bg-center bg-no-repeat`}
                            style={{
                              backgroundColor: `${card.brandColor}80`,
                              backgroundImage:
                                card.coverImage &&
                                card.coverImage !== storedOldImage?.url
                                  ? `url(${card.coverImage})`
                                  : `linear-gradient(
                                180deg,
                                #FFFFFF 0%,
                                ${card.brandColor}99 100%
                              ),
                              url(${storedBackupCardImage?.url})`,
                              borderRadius: "15px",
                              border: `3px solid ${card?.brandColor}`,
                            }}
                          ></div>

                          {/* Profile */}
                          {card.cardLayout == "centered" && (
                            <div className="relative px-6">
                              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-[85%]">
                                <div className="relative w-[90px] h-[90px] sm:w-[122px] sm:h-[122px]">
                                  <img
                                    src={
                                      card.profilePhoto &&
                                      card.profilePhoto != storedOldImage?.url
                                        ? card.profilePhoto
                                        : avatarFallbackUrl
                                    }
                                    alt="Profile"
                                    onError={(e) => setFailedBackupUrl(e.currentTarget.src)}
                                    className="w-[90px] h-[90px] sm:w-[122px] sm:h-[122px] rounded-full object-cover"
                                    style={{
                                      border: `3px solid ${card?.brandColor}`,
                                    }}
                                  />

                                  {/* Logo Overlay */}
                                  {/* left-[190px] */}
                                  {card?.companyLogo && (
                                    <div className="absolute bottom-0 right-0 w-[40px] h-[40px] rounded-lg flex items-center justify-center shadow-md top-[58px] sm:top-[77px]">
                                      <img
                                        src={card?.companyLogo}
                                        alt="Logo"
                                        className="w-[30px] h-[30px] sm:w-[40px] sm:h-[40px] object-cover rounded-lg"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Content */}
                          <div className="pt-4 px-5 pb-3 text-white bg-card">
                            <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0">
                              {fullName && (
                                <h2
                                  className={`font-bold text-2xl sm:text-3xl text-card-foreground break-words`}
                                >
                                  {fullName ?? ""}
                                </h2>
                              )}
                              {card.profile.accreditations.length > 0 && (
                                <span className="text-muted-foreground text-base sm:text-lg font-normal whitespace-nowrap leading-none">
                                  {card.profile.accreditations.join(", ")}
                                </span>
                              )}
                            </div>

                            {card.profile.companySlogan && (
                              <p className="text-base text-muted-foreground mt-0.5 break-words text-center">
                                "{card.profile.companySlogan}"
                              </p>
                            )}

                            <div
                              className="mt-1.5 border-l-2 border-dashed pl-2 text-base leading-relaxed ml-2 justify-center !m-auto w-fit space-y-0.5"
                              style={{ borderLeftColor: card?.brandColor }}
                            >
                              {(card.profile.title ||
                                card.profile.department ||
                                card.profile.company) && (
                                <>
                                  <p className="text-muted-foreground break-words whitespace-pre-wrap">
                                    {card.profile.title} |{" "}
                                    {card.profile.department}
                                  </p>

                                  {/* {card.profile.education && (
                                    <p className="text-xs text-muted-foreground break-words whitespace-pre-wrap mt-1">
                                      🎓 {card.profile.education}
                                    </p>
                                  )} */}
                                  <p className="text-muted-foreground break-words whitespace-pre-wrap">
                                    {card.profile.company}
                                  </p>
                                </>
                              )}
                              
                              {hasAddress && (
                                <p className="text-muted-foreground break-words whitespace-pre-wrap">
                                  {[
                                    card.business.address.street,
                                    card.business.address.city,
                                    card.business.address.state,
                                    card.business.address.zip,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              )}
                            </div>

                            {/* Appointment blocks - Call-to-Action, Direct Ads, Calendly and
                                Google Calendar are independent, so any combination can show.
                                The CTA keeps the button slot; the rest stack beneath it. */}
                            {modernAppointments.length > 0 && (
                              <div className="mt-4 flex w-full flex-col items-center gap-1">
                                {modernAppointments}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex gap-3 mt-3 px-4">
                            <button
                              onClick={() => onExchangePress?.()}
                              className="flex-1 h-[48px] rounded-md font-bold text-base sm:text-lg text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg"
                              style={{ backgroundColor: card?.brandColor }}
                            >
                              Exchange Contact
                            </button>
                            <button
                              onClick={() => handleSharedCard?.()}
                              className="w-[48px] h-[48px] rounded-md flex items-center justify-center text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg"
                              style={{ backgroundColor: card?.brandColor }}
                            >
                              <Share2 size={20} />
                            </button>

                            <button
                              onClick={() => handleDownloadVCard?.()}
                              className="w-[48px] h-[48px] rounded-md flex items-center justify-center text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg"
                              style={{ backgroundColor: card?.brandColor }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="mt-6 px-0">
                            <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(72px,1fr))] justify-items-center text-center text-black gap-y-6 gap-x-4">
                              {renderTileRows("text-sm font-medium text-center w-16 mt-2")}
                            </div>
                            {/* See CONTENT DIVIDER above. */}
                            {renderContentDivider("about")}
                            {sanitizedBio?.length > 0 && (
                              /* !mt-2, not mt-2: the contact/social list above
                                 uses space-y-2, so an 8px top margin made the
                                 About block read as one more row in that list
                                 instead of a new section. 24px is a clear
                                 section break against an 8px row rhythm.

                                 The `!` is required. This div is a CHILD of
                                 that space-y-2 container, and space-y compiles
                                 to `.space-y-2 > :not([hidden]) ~ :not([hidden])`
                                 - specificity (0,3,0) against mt-6's (0,1,0) -
                                 so the parent silently forces margin-top back
                                 to 0.5rem. Any plain mt-* value is ignored
                                 here, however large. */
                              <div className="!mt-2">
                                <Accordion
                                  type="single"
                                  collapsible
                                  style={{}}
                                >
                                  {((!cardSectionType ||
                                    cardSectionType === "") &&
                                    card.about.bio) ||
                                  cardSectionType ? (
                                    <AccordionItem
                                      value="about"
                                      className="border-b-0"
                                    >
                                      <AccordionTrigger className="text-xl font-bold py-2 mb-1.5 no-underline hover:no-underline border-b-0">
                                        {(!cardSectionType ||
                                          cardSectionType === "") &&
                                          (card.about.customSectionTitle ||
                                            "About Me")}

                                        {cardSectionType &&
                                          (cardSectionType === "custom" &&
                                          card?.about?.customSectionTitle
                                            ?.length > 0
                                            ? card.about.customSectionTitle
                                            : cardSectionType === "aboutMe" &&
                                                sanitizedBio?.length > 0
                                              ? "About Me"
                                              : "")}
                                      </AccordionTrigger>

                                      <AccordionContent>
                                        <p
                                          className="text-base text-muted-foreground leading-relaxed break-words whitespace-pre-wrap"
                                          dangerouslySetInnerHTML={{
                                            __html: sanitizedBio,
                                          }}
                                        />
                                      </AccordionContent>
                                    </AccordionItem>
                                  ) : null}
                                </Accordion>
                              </div>
                            )}

                            {/* Photos & Document dropdowns - see richContentDropdowns above */}
                            {renderContentDivider("rich")}
                            {richContentDropdowns}
                            {renderContentDivider("end")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {card.cardLayout == "fadein" && (
                <>
                  <div
                    className={`w-auto ${isEditMode ? "sm:w-auto" : "sm:w-[500px] mx-auto"}`}
                  >
                    {!isEditMode &&
                      showBackButton &&
                      card.templateType == "modern" && (
                        <div className="mt-6 flex items-center justify-between">
                          <button
                            onClick={onNavigateBack}
                            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                          >
                            <ArrowLeft size={20} />
                            Back
                          </button>
                        </div>
                      )}
                    {!isEditMode && (
                      <div className="text-center py-5 text-base font-medium">
                        <h2>Solo</h2>
                      </div>
                    )}
                    <div className="justify-center card-preview">
                      <div
                        className="bg-card rounded-lg"
                        style={{
                          borderRadius: "15px",
                          background: `${card.brandColor}`,
                          //background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%,${card.brandColor} 60%)`,
                        }}
                      >
                        <div
                          className={`w-full overflow-hidden rounded-t-[15px] ${
                            isEditMode ? "sm:w-auto" : "sm:w-[500px]"
                          }`}
                        >
                          <div className="overflow-hidden rounded-[15px] relative">
                            {/* Cover Image */}
                            <div
                              className="relative w-full h-[380px] bg-cover bg-no-repeat"
                              style={{
                                backgroundImage: `url(${
                                  card.profilePhoto &&
                                  card.profilePhoto !== storedOldImage?.url
                                    ? card.profilePhoto
                                    : storedBackupCardImage?.url
                                })`,
                              }}
                            >
                              {/* Gradient STARTS from content area */}
                              <div
                                className="absolute inset-x-0 bottom-0 h-[180px]"
                                style={{
                                  background: `linear-gradient(to top, ${card?.brandColor}, rgba(0,0,0,0))`,
                                }}
                              />
                            </div>

                            {/* Profile Image */}
                            <div className="absolute top-[55px] left-1/2 -translate-x-1/2">
                              <div className="relative w-[90px] h-[90px] sm:w-[122px] sm:h-[122px]">
                                {card.companyLogo && !isEditMode && (
                                  <img
                                    src={
                                      card.companyLogo &&
                                      card.companyLogo != storedOldImage?.url
                                        ? card?.companyLogo
                                        : storedBackupCardImage?.url
                                    }
                                    alt="Profile"
                                    onError={(e) => setFailedBackupUrl(e.currentTarget.src)}
                                    className="w-[90px] h-[90px] sm:w-[122px] sm:h-[122px] rounded-full object-cover border-4"
                                    style={{
                                      backgroundColor: `${card.brandColor}80`,
                                      borderColor: card?.brandColor,
                                    }}
                                  />
                                )}

                                {/* {isEditMode && (
                                  <img
                                    src={
                                      card.companyLogo &&
                                      card.companyLogo != storedOldImage?.url
                                        ? card?.companyLogo
                                        : storedBackupCardImage?.url
                                    }
                                    alt="Profile"
                                    onError={(e) => setFailedBackupUrl(e.currentTarget.src)}
                                    className="w-[90px] h-[90px] sm:w-[122px] sm:h-[122px] rounded-full object-cover border-4"
                                    style={{
                                      backgroundColor: `${card.brandColor}80`,
                                      borderColor: card?.brandColor,
                                    }}
                                  />
                                )} */}

                                {/* Logo */}
                                {/* {card?.companyLogo && (
                                  <div className="absolute bottom-0 right-0 w-[40px] h-[40px] rounded-lg shadow-md overflow-hidden">
                                    <img
                                      src={card?.companyLogo}
                                      alt="Logo"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )} */}
                              </div>
                            </div>

                            {/* Content Section */}
                            {/* The name sat at offset 0 of this block, i.e. at the
                                fully transparent end of its own gradient, so it
                                rendered straight onto the cover photo. The scrim is
                                now solid behind the whole text block, and pt-10 adds
                                room above it so the soft top edge feathers over the
                                photo instead of across the name. The block is
                                absolutely positioned to the bottom, so the extra
                                padding grows it upward and the text does not move. */}
                            <div
                              className="absolute bottom-0 w-full px-5 pt-10 pb-4"
                              style={{
                                background: `linear-gradient(to top, ${card?.brandColor} 0%, ${card?.brandColor} 82%, rgba(0,0,0,0) 100%)`,
                              }}
                            >
                              <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0">
                                {fullName && (
                                  <h2
                                    className={`text-2xl sm:text-3xl font-bold text-center break-words ${dark ? "text-white" : "text-black"}`}
                                  >
                                    {fullName ?? ""}
                                  </h2>
                                )}
                                {card.profile.accreditations.length > 0 && (
                                  <span
                                    className={`text-base sm:text-lg font-normal whitespace-nowrap leading-none ${dark ? "text-white" : "text-black"}`}
                                  >
                                    {card.profile.accreditations.join(", ")}
                                  </span>
                                )}
                              </div>
                              <div className="text-base mt-1.5 text-center space-y-0.5 leading-relaxed">
                                {(card.profile.title ||
                                  card.profile.department ||
                                  card.profile.company) && (
                                  <>
                                    <p
                                      className={`break-words whitespace-pre-wrap ${
                                        dark ? "text-white" : "text-black"
                                      }`}
                                    >
                                      {card.profile.title} |{" "}
                                      {card.profile.department}
                                    </p>

                                    {/* {card.profile.education && (
                                      <p
                                        className={`text-xs break-words whitespace-pre-wrap mt-1 ${
                                          dark
                                            ? "text-white/80"
                                            : "text-black/80"
                                        }`}
                                      >
                                        🎓 {card.profile.education}
                                      </p>
                                    )} */}

                                    <p
                                      className={`break-words whitespace-pre-wrap ${
                                        dark ? "text-white" : "text-black"
                                      }`}
                                    >
                                      {card.profile.company}
                                    </p>
                                  </>
                                )}

                                {card.profile.companySlogan && (
                                  <p
                                    className={`text-base mt-0.5 break-words whitespace-pre-wrap ${
                                      dark ? "text-white" : "text-black"
                                    }`}
                                  >
                                    "{card.profile.companySlogan}"
                                  </p>
                                )}

                                {hasAddress && (
                                  <p
                                    className={`break-words whitespace-pre-wrap ${
                                      dark ? "text-white/70" : "text-black/70"
                                    }`}
                                  >
                                    {[
                                      card.business.address.street,
                                      card.business.address.city,
                                      card.business.address.state,
                                      card.business.address.zip,
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                )}
                              </div>

                              {/* <div className="flex items-baseline justify-left gap-2 flex-nowrap justify-center">
                                <h2 className="text-xl font-semibold text-center">
                                  {fullName ?? ""}
                                </h2>
                                {card.profile.accreditations.length > 0 && (
                                  <span className="text-muted-foreground text-base sm:text-lg font-normal whitespace-nowrap leading-none">
                                    {card.profile.accreditations.join(", ")}
                                  </span>
                                )}
                              </div>

                              <div className="text-sm text-gray-300 mt-1 text-center">
                                <p className="text-muted-foreground break-words whitespace-pre-wrap">
                                  {card.profile.title} |{" "}
                                  {card.profile.department}
                                </p>
                                <p className="text-muted-foreground break-words whitespace-pre-wrap">
                                  {card.profile.company}
                                </p>
                                <p className="text-gray-400 text-md mt-0 text-muted-foreground break-words">
                                  "{card.profile.companySlogan}"
                                </p>
                              </div> */}

                              {/* CTA FULL WIDTH */}
                              {/* Appointment blocks - Call-to-Action, Direct Ads, Calendly and
                                  Google Calendar are independent, so any combination can show.
                                  The CTA keeps the button slot; the rest stack beneath it. */}
                              {fadeInAppointments.length > 0 && (
                                <div className="mt-2 flex flex-col items-center gap-1 text-center">
                                  {fadeInAppointments}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="px-5 pb-[20px]">
                            <div className="flex gap-3 px-4">
                              <button
                                onClick={() => onExchangePress?.()}
                                className="flex-1 h-[48px] rounded-md font-bold text-base sm:text-lg text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg bg-white"
                                style={{ color: card?.brandColor }}
                              >
                                Exchange Contact
                              </button>
                              <button
                                onClick={() => handleSharedCard?.()}
                                className="w-[48px] h-[48px] rounded-md flex items-center justify-center text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg bg-white"
                                style={{ color: card?.brandColor }}
                              >
                                <Share2 size={20} />
                              </button>

                              <button
                                onClick={() => handleDownloadVCard?.()}
                                className="w-[48px] h-[48px] rounded-md flex items-center justify-center text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg bg-white"
                                style={{ color: card?.brandColor }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                                  />
                                </svg>
                              </button>
                            </div>

                            <div className="py-8 px-0">
                              <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(72px,1fr))] justify-items-center text-center text-black gap-y-6 gap-x-4">
                                {renderTileRows(`text-sm font-medium text-center w-16 mt-2 ${dark ? "text-white" : "text-black"}`)}
                              </div>
                            </div>
                            {/* See CONTENT DIVIDER above. */}
                            {renderContentDivider("about")}
                            {sanitizedBio?.length > 0 && (
                              /* !mt-2, not mt-2: the contact/social list above
                                 uses space-y-2, so an 8px top margin made the
                                 About block read as one more row in that list
                                 instead of a new section. 24px is a clear
                                 section break against an 8px row rhythm.

                                 The `!` is required. This div is a CHILD of
                                 that space-y-2 container, and space-y compiles
                                 to `.space-y-2 > :not([hidden]) ~ :not([hidden])`
                                 - specificity (0,3,0) against mt-6's (0,1,0) -
                                 so the parent silently forces margin-top back
                                 to 0.5rem. Any plain mt-* value is ignored
                                 here, however large. */
                              <div className="!mt-2">
                                <Accordion
                                  type="single"
                                  collapsible
                                  style={{}}
                                >
                                  {((!cardSectionType ||
                                    cardSectionType === "") &&
                                    card.about.bio) ||
                                  cardSectionType ? (
                                    <AccordionItem
                                      value="about"
                                      className="border-b-0"
                                    >
                                      <AccordionTrigger
                                        className={`text-xl font-bold py-2 mb-1.5 no-underline hover:no-underline border-b-0 ${dark ? "text-white" : "text-black"}`}
                                      >
                                        {(!cardSectionType ||
                                          cardSectionType === "") &&
                                          (card.about.customSectionTitle ||
                                            "About Me")}

                                        {cardSectionType &&
                                          (cardSectionType === "custom" &&
                                          card?.about?.customSectionTitle
                                            ?.length > 0
                                            ? card.about.customSectionTitle
                                            : cardSectionType === "aboutMe" &&
                                                sanitizedBio?.length > 0
                                              ? "About Me"
                                              : "")}
                                      </AccordionTrigger>

                                      <AccordionContent>
                                        <p
                                          className={`text-base leading-relaxed break-words whitespace-pre-wrap ${dark ? "text-white" : "text-black"}`}
                                          dangerouslySetInnerHTML={{
                                            __html: sanitizedBio,
                                          }}
                                        />
                                      </AccordionContent>
                                    </AccordionItem>
                                  ) : null}
                                </Accordion>
                              </div>
                            )}

                            {/* Photos & Document dropdowns - see richContentDropdowns above */}
                            {renderContentDivider("rich")}
                            {richContentDropdowns}
                            {renderContentDivider("end")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {card.cardLayout == "portrait" && (
                <>
                  {!isEditMode &&
                    showBackButton &&
                    card.templateType == "modern" && (
                      <div className="mt-6 flex items-center justify-between business-card-display1">
                        <button
                          onClick={onNavigateBack}
                          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                          <ArrowLeft size={20} />
                          Back
                        </button>
                      </div>
                    )}
                  {!isEditMode && (
                    <div className="text-center py-5 text-base font-medium">
                      <h2>Solo</h2>
                    </div>
                  )}
                  <div
                    className={`rounded-[15px] ${isEditMode ? "" : "sm:mx-auto"}`}
                  >
                    <div className="justify-center px-5 py-5 bg-card rounded-[15px] card-preview">
                      <div
                        className={`w-full rounded-t-[15px] ${
                          isEditMode ? "sm:w-auto" : "sm:w-[460px]"
                        }`}
                      >
                        <div
                          className="overflow-hidden rounded-[15px]"
                          style={{
                            //backgroundColor: "#f9f9f9c7",
                            boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
                          }}
                        >
                          {/* Cover Image */}
                          <div
                            className={`relative h-[368px] sm:h-[492px] w-full ${
                              card.profilePhoto &&
                              card.profilePhoto !== storedOldImage?.url
                                ? "bg-cover"
                                : "bg-contain"
                            } bg-center bg-no-repeat`}
                            style={{
                              backgroundColor: `${card.brandColor}80`,
                              backgroundImage:
                                card.profilePhoto &&
                                card.profilePhoto !== storedOldImage?.url
                                  ? `url(${card.profilePhoto})`
                                  : `linear-gradient(
                                180deg,
                                #FFFFFF 0%,
                                ${card.brandColor}99 100%
                              ),
                              url(${storedBackupCardImage?.url})`,
                              borderRadius: "15px",
                              border: `3px solid ${card?.brandColor}`,
                            }}
                          ></div>

                          {/* Profile */}
                          {/* {card.cardLayout == "portrait" && (
                            <div className="relative px-6">
                              <div className="absolute -top-[6.5rem] left-4">
 
                              </div>
                            </div>
                          )} */}

                          {/* Content */}
                          <div className="pt-4 px-5 pb-3 text-white bg-card">
                            <div className="flex flex-wrap items-baseline justify-start gap-x-2 gap-y-0">
                              {fullName && (
                                <h2
                                  className={`font-bold text-2xl sm:text-3xl text-card-foreground break-words`}
                                >
                                  {fullName ?? ""}
                                </h2>
                              )}
                              {card.profile.accreditations.length > 0 && (
                                <span className="text-muted-foreground text-base sm:text-lg font-normal whitespace-nowrap leading-none">
                                  {card.profile.accreditations.join(", ")}
                                </span>
                              )}
                            </div>

                            {card.profile.companySlogan && (
                              <p className="text-base text-muted-foreground mt-0.5 break-words">
                                "{card.profile.companySlogan}"
                              </p>
                            )}

                            <div
                              className="mt-1.5 border-l-2 border-dashed pl-2 text-base leading-relaxed ml-2 space-y-0.5"
                              style={{ borderLeftColor: card?.brandColor }}
                            >
                              {(card.profile.title ||
                                card.profile.department ||
                                card.profile.company) && (
                                <>
                                  <p className="text-muted-foreground break-words whitespace-pre-wrap">
                                    {card.profile.title} |{" "}
                                    {card.profile.department}
                                  </p>

                                  {/* {card.profile.education && (
                                    <p className="text-xs text-muted-foreground break-words whitespace-pre-wrap mt-1">
                                      🎓 {card.profile.education}
                                    </p>
                                  )} */}

                                  <p className="text-muted-foreground break-words whitespace-pre-wrap">
                                    {card.profile.company}
                                  </p>
                                </>
                              )}

                              {hasAddress && (
                                <p className="text-muted-foreground break-words whitespace-pre-wrap">
                                  {[
                                    card.business.address.street,
                                    card.business.address.city,
                                    card.business.address.state,
                                    card.business.address.zip,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              )}
                            </div>

                            {/* Appointment blocks - Call-to-Action, Direct Ads, Calendly and
                                Google Calendar are independent, so any combination can show.
                                The CTA keeps the button slot; the rest stack beneath it. */}
                            {modernAppointments.length > 0 && (
                              <div className="mt-4 flex flex-col items-start gap-1">
                                {modernAppointments}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex gap-3 mt-3 px-4">
                            <button
                              onClick={() => onExchangePress?.()}
                              className="flex-1 h-[48px] rounded-md font-bold text-base sm:text-lg text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg"
                              style={{ backgroundColor: card?.brandColor }}
                            >
                              Exchange Contact
                            </button>
                            <button
                              onClick={() => handleSharedCard?.()}
                              className="w-[48px] h-[48px] rounded-md flex items-center justify-center text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg"
                              style={{ backgroundColor: card?.brandColor }}
                            >
                              <Share2 size={20} />
                            </button>

                            <button
                              onClick={() => handleDownloadVCard?.()}
                              className="w-[48px] h-[48px] rounded-md flex items-center justify-center text-white justify-center transform transition duration-300 hover:scale-95 hover:shadow-lg"
                              style={{ backgroundColor: card?.brandColor }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="mt-3 space-y-2">
                            {renderModernPillRows()}
                            {/* See CONTENT DIVIDER above. */}
                            {renderContentDivider("about")}
                            {sanitizedBio?.length > 0 && (
                              /* !mt-2, not mt-2: the contact/social list above
                                 uses space-y-2, so an 8px top margin made the
                                 About block read as one more row in that list
                                 instead of a new section. 24px is a clear
                                 section break against an 8px row rhythm.

                                 The `!` is required. This div is a CHILD of
                                 that space-y-2 container, and space-y compiles
                                 to `.space-y-2 > :not([hidden]) ~ :not([hidden])`
                                 - specificity (0,3,0) against mt-6's (0,1,0) -
                                 so the parent silently forces margin-top back
                                 to 0.5rem. Any plain mt-* value is ignored
                                 here, however large. */
                              <div className="!mt-2">
                                <Accordion
                                  type="single"
                                  collapsible
                                  style={{}}
                                >
                                  {((!cardSectionType ||
                                    cardSectionType === "") &&
                                    card.about.bio) ||
                                  cardSectionType ? (
                                    <AccordionItem
                                      value="about"
                                      className="border-b-0"
                                    >
                                      <AccordionTrigger className="text-xl font-bold py-2 mb-1.5 no-underline hover:no-underline border-b-0">
                                        {(!cardSectionType ||
                                          cardSectionType === "") &&
                                          (card.about.customSectionTitle ||
                                            "About Me")}

                                        {cardSectionType &&
                                          (cardSectionType === "custom" &&
                                          card?.about?.customSectionTitle
                                            ?.length > 0
                                            ? card.about.customSectionTitle
                                            : cardSectionType === "aboutMe" &&
                                                sanitizedBio?.length > 0
                                              ? "About Me"
                                              : "")}
                                      </AccordionTrigger>

                                      <AccordionContent>
                                        <p
                                          className="text-base text-muted-foreground leading-relaxed break-words whitespace-pre-wrap"
                                          dangerouslySetInnerHTML={{
                                            __html: sanitizedBio,
                                          }}
                                        />
                                      </AccordionContent>
                                    </AccordionItem>
                                  ) : null}
                                </Accordion>
                              </div>
                            )}

                            {/* Photos & Document dropdowns - see richContentDropdowns above */}
                            {renderContentDivider("rich")}
                            {richContentDropdowns}
                            {renderContentDivider("end")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* user.planType == "free" && */}
              {!isEditMode && user?.planType == "free" ? (
                <>
                  <div className="sm:w-[460px] w-ull mx-auto mt-auto py-5 flex flex-col items-center">
                    <div
                      className="sm:w-[460px] w-full mx-auto mt-4 border-t pb-6"
                      style={{
                        borderTopColor: `${card?.brandColor}33`, // 20% opacity
                      }}
                    />
                    <div
                      className="w-full max-w-3xl rounded-xl py-2 text-center"
                      // style={{ border: `2px solid ${card?.brandColor}` }}
                    >
                      <h1 className="text-xl">
                        <span className="font-serif text-gray-500">
                          Solo Biz Cards
                        </span>
                      </h1>

                      <p className="mt-1 text-xs text-gray-500 uppercase">
                        Networking for Solo Owners
                      </p>
                    </div>

                    <Link href="/pricing">
                      <button className="mt-3 text-sm text-muted-foreground font-medium hover:underline flex items-center gap-2">
                        Remove Branding <ArrowRight className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {!isEditMode && user?.planType == "paid" && (
                    <div className="mb-6" />
                  )}
                </>
              )}

              {!isEditMode && !user && (
                <>
                  <div className="sm:w-[460px] w-full mx-auto mt-auto py-5 flex flex-col items-center relative">
                    {/* Top Border */}
                    <div
                      className="sm:w-[460px] w-full mx-auto mt-4 border-t pb-2"
                      style={{
                        borderTopColor: `${card?.brandColor}33`,
                      }}
                    />

                    {/* Overlapping Claim Banner */}
                    {isVisible && (
                      <div
                        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300
                        ${
                          isClosing
                            ? "translate-y-20 opacity-0"
                            : "translate-y-0 opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 px-5 py-[8px] bg-white text-gray-800 rounded-full shadow-2xl hover:scale-95 transition-transform duration-300 border border-[#a9a9a9ba]">
                          <button
                            onClick={() => handleClaimClick()}
                            className="text-sm font-medium text-gray-800 whitespace-nowrap"
                          >
                            Claim your free Solo.card
                          </button>

                          <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-700 transition bg-[rgb(246,247,248)] p-[11px] rounded-[45%] relative left-[11px] hover:bg-gray-300"
                          >
                            <X size={22} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Title Section */}
                    <div className="w-full max-w-3xl rounded-xl py-2 text-center">
                      <h1 className="text-xl">
                        <span className="font-serif text-gray-500">
                          Solo Biz Cards
                        </span>
                      </h1>

                      <p className="mt-1 text-xs text-gray-500 uppercase">
                        Networking for Solo Owners
                      </p>
                    </div>

                    {/* Join Link - refLink is optional and the onboarding
                        preview does not pass it, so this used to hand
                        next/link an undefined href. That THROWS during server
                        rendering ("The prop `href` expects a `string` or
                        `object`"), which aborted the whole card on the server
                        and made every preview client-only. The link is a
                        referral invite; with no referral there is nothing to
                        link to, so it is simply not drawn. */}
                    {refLink && (
                      <Link
                        href={refLink}
                        className="mt-2 text-sm text-black hover:underline flex items-center gap-1"
                      >
                        Join
                        <span className="font-semibold">
                          {card?.profile?.firstName}
                        </span>{" "}
                        and create your profile
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
      {/* Lightbox for Direct Ads */}
      {card.appointments?.directAds?.image && (
        <Lightbox
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          imageSrc={card.appointments.directAds.image}
          title={card.appointments.directAds.title}
          description={card.appointments.directAds.description}
          price={card.appointments.directAds.price}
          url={card.appointments.directAds.url}
          theme={card.brandColor}
        />
      )}
      {/* Document Preview Bottom Sheet Modal (exact same as Content Document popup) */}
      {isMounted &&
        typeof document !== "undefined" &&
        cardDocument?.url &&
        createPortal(
          <>
            <div
              onClick={() => setShowDocumentModal(false)}
              className={`!mt-0 fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 z-[9999] ${
                showDocumentModal
                  ? "opacity-100 visible pointer-events-auto"
                  : "opacity-0 invisible pointer-events-none"
              }`}
            />
            <div
              className={`z-[9999] fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] sm:max-w-[760px] lg:max-w-[900px] h-[85vh] sm:h-[90vh] overflow-hidden
              bg-[#f8f9fb] dark:bg-slate-950 dark:border dark:border-slate-800 rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)]
              transition-all duration-500 ease-in-out flex flex-col
              ${showDocumentModal ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"}`}
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Document Preview
                </h2>
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(false)}
                  aria-label="Close document preview"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
              <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 overflow-hidden">
                {showDocumentModal && (
                  <iframe
                    src={cardDocument.url}
                    title={cardDocument.name || "Document preview"}
                    className="w-full h-full rounded-xl shadow-sm bg-white dark:bg-slate-800 border-none"
                  />
                )}
              </div>
            </div>
          </>,
          document.body
        )}

      {/* Photo Preview Bottom Sheet Modal */}
      {isMounted &&
        typeof document !== "undefined" &&
        selectedPhoto?.url &&
        createPortal(
          <>
            <div
              onClick={() => setSelectedPhoto(null)}
              className={`!mt-0 fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 z-[9999] ${
                selectedPhoto
                  ? "opacity-100 visible pointer-events-auto"
                  : "opacity-0 invisible pointer-events-none"
              }`}
            />
            <div
              className={`z-[9999] fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] sm:max-w-[760px] lg:max-w-[900px] h-[85vh] sm:h-[90vh] overflow-hidden
              bg-[#f8f9fb] dark:bg-slate-950 dark:border dark:border-slate-800 rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)]
              transition-all duration-500 ease-in-out flex flex-col
              ${selectedPhoto ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"}`}
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Photo Preview
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  aria-label="Close photo preview"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
              <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-900 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
                {selectedPhoto && (
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.name || "Photo preview"}
                    className="max-h-full max-w-full object-contain rounded-xl shadow-sm"
                  />
                )}
              </div>
            </div>
          </>,
          document.body
        )}
      {showPermissionModal && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center px-4",
          )}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Box */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 z-50 w-full max-w-md text-center">
            {/* Icon / Visual cue */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Permission Required
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              You need to{" "}
              <span className="font-medium text-gray-800">sign in</span>
              to access this page. Please log in with your account.
            </p>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPermissionModal(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPermissionModal(false);
                  setTimeout(() => router.replace("/?signIn=true"), 200);
                }}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
