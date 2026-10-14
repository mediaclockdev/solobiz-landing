"use client";
import { BusinessCard } from "@/types/businessCard";

export const getFullName = (card: BusinessCard): string => {
  const { firstName, lastName } = card.profile;
  return [firstName, lastName].filter(Boolean).join(" ");
};

export const generateSlug = async (card: BusinessCard): Promise<string> => {
  const baseName = card.urlName || getFullName(card) || "card";
  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

/**
 * Whether the card has anything on it yet. False swaps the preview for the
 * "Jane Doeington" sample image, so every field a user can fill has to be
 * counted here - otherwise they add content, the preview stays a stock photo,
 * and it reads as the content having been dropped.
 *
 * contentLinks (Location, Notion, Google Drive, the review, payment and music
 * links, Photos, Document) and the appointment fields (Calendly, Google
 * Calendar, Call-to-Action, Direct Ads) were missing, so a card whose first
 * entry was any one of them showed the sample.
 */
export const hasUserInput = (card: BusinessCard): boolean => {
  return !!(
    card.profile.firstName ||
    card.profile.lastName ||
    card.profile.title ||
    card.profile.company ||
    card.business.email ||
    card.business.phone ||
    card.business.website ||
    card.about.bio ||
    card.about?.customSectionTitle ||
    card.profilePhoto ||
    card.appointments?.calendlyUrl?.trim() ||
    card.appointments?.googleUrl?.trim() ||
    card.appointments?.ctaUrl?.trim() ||
    card.appointments?.directAds?.image?.trim() ||
    Object.values(card.social).some((value) => value?.trim()) ||
    Object.values(card.contentLinks || {}).some(
      (value) => typeof value === "string" && value.trim(),
    )
  );
};

export const generateVCard = async (card: BusinessCard): Promise<string> => {
  const vCardLines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${getFullName(card)}`,
    `N:${card.profile.lastName};${card.profile.firstName};;;`,
  ];

  if (card.profile.title) {
    vCardLines.push(`TITLE:${card.profile.title}`);
  }

  if (card.profile.company) {
    vCardLines.push(`ORG:${card.profile.company}`);
  }

  if (card.business.phone) {
    vCardLines.push(`TEL:${card.business.phone}`);
  }

  if (card.business.email) {
    vCardLines.push(`EMAIL:${card.business.email}`);
  }

  if (card.business.website) {
    vCardLines.push(`URL:${card.business.website}`);
  }

  const address = card.business.address;
  if (address.street || address.city || address.state || address.zip) {
    const adr = `;;${address.street || ""};${address.city || ""};${
      address.state || ""
    };${address.zip || ""};${address.country || ""}`;
    vCardLines.push(`ADR:${adr}`);
  }

  if (card.about.bio) {
    vCardLines.push(`NOTE:${card.about.bio}`);
  }

  if (card?.profilePhoto && typeof card.profilePhoto === "string" && card.profilePhoto.trim()) {
    try {
      const photo = card.profilePhoto.trim();
      if (photo.startsWith("data:")) {
        const commaIdx = photo.indexOf(",");
        if (commaIdx !== -1) {
          const mimeMatch = photo.match(/^data:image\/([a-zA-Z0-9]+);/);
          const ext = (mimeMatch?.[1] || "JPEG").toUpperCase();
          const type = ext === "JPG" ? "JPEG" : ext;
          const base64 = photo.slice(commaIdx + 1);
          if (base64) {
            vCardLines.push(`PHOTO;ENCODING=b;TYPE=${type}:${base64}`);
          }
        }
      } else {
        const fetchUrl =
          photo.startsWith("http://") || photo.startsWith("https://")
            ? `/api/proxy-image?url=${encodeURIComponent(photo)}`
            : photo;

        const response = await fetch(fetchUrl);
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              resolve(res ? res.split(",")[1] : "");
            };
            reader.onerror = () => reject(new Error("Failed to read image blob"));
            reader.readAsDataURL(blob);
          });

          if (base64) {
            const mimeType = blob.type || "image/jpeg";
            const type = mimeType.includes("png") ? "PNG" : "JPEG";
            vCardLines.push(`PHOTO;ENCODING=b;TYPE=${type}:${base64}`);
          }
        }
      }
    } catch (error) {
      console.warn("Could not load profile photo for vCard:", error);
    }
  }

  vCardLines.push("END:VCARD");

  return vCardLines.join("\r\n");
};

export const defaultBrandColors = [
  // '#4299e1', // Blue
  // '#48bb78', // Green
  // '#ed8936', // Orange
  // '#9f7aea', // Purple
  // '#38b2ac', // Teal
  // '#ec4899', // Pink
  // '#ecc94b', // Yellow
  // '#f56565', // Red

  "#F95F5F",
  "#FF8A4C",
  "#FFD93D",
  "#B87D4B",
  "#4CD964",
  "#4ECDC4",
  "#4299E1",
  "#5856D6",
  "#AF52DE",
  "#FF2D55",
  "#2C3E50",
  "#8E8E93",
];

export const createInitialCard = (): BusinessCard => ({
  urlName: "",
  profilePhoto: "",
  coverImage: "",
  companyLogo: "",
  cardImage: undefined,
  brandColor: "#4299E1",
  templateType: "traditional",
  cardLayout: "portrait",
  profile: {
    firstName: "",
    lastName: "",
    title: "",
    businessCategory: "",
    department: "",
    education: "",
    company: "",
    accreditations: [],
    companySlogan: "",
  },
  business: {
    phone: "",
    email: "",
    website: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  },
  social: {
    linkedin: "",
    twitter: "",
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    telegram: "",
    whatsapp: "",
    discord: "",
    wechat: "",
    signal: "",
  },
  about: {
    bio: "",
    sectionTitle: "About Me",
    skills: [],
    customSectionTitle: "",
    sectionType: "",
  },
  appointments: {
    appointmentType: "booking",
    calendlyUrl: "",
    ctaLabel: "",
    ctaUrl: "",
  },
  cardView: 0,
  cardShare: 0,
  leadsGenerated: 0,
  linkClick: 0,
  adsView: 0,
  saveContact: 0,
  metadata: {
    cardType: "",
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    isPublic: null,
    slug: "",
    favorite: false,
    tags: [],
  },
});
