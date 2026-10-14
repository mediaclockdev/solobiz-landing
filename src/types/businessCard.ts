"use client";
export interface BusinessCard {
  id?: string;
  uid?: string;
  qrCode?: any;
  localQRCode?: any;
  sync?: boolean;
  isActive?: boolean;
  urlName: string;
  badgeLevel?: string | number;
  profilePhoto: string;
  coverImage: string;
  companyLogo: string;
  cardImage?: string;
  brandColor: string;
  iconStyle?: "round" | "square";
  iconVariant?: "standard" | "custom" | "custom_negative";
  cardLayout?:
    | "standard"
    | "extended"
    | "centered"
    | "fadein"
    | "portrait"
    | "align-right"
    | "align-left"
    | "slides";
  templateType?: "classic" | "modern" | "traditional";
  theme?: "light" | "dark";
  profile: {
    firstName: string;
    lastName: string;
    title: string;
    businessCategory?: string;
    department: string;
    company: string;
    education: string;
    accreditations: string[];
    companySlogan: string;
    userEmail?: string;
  };
  business: {
    phone: string;
    phoneAction?: "text" | "call";
    email: string;
    website: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  social: {
    linkedin: string;
    twitter: string;
    facebook: string;
    instagram: string;
    youtube?: string;
    tiktok?: string;
    telegram?: string;
    whatsapp?: string;
    discord?: string;
    wechat?: string;
    signal?: string;
    vimeo?: string;
    snapchat?: string;
    twitch?: string;
    pinterest?: string;
  };
  profileContentOrder?: string[];
  contentTitles?: Record<string, string>;
  contentLinks?: Record<string, string>;
  about: {
    bio: string;
    sectionTitle: string;
    skills: string[];
    customSectionTitle?: string;
    sectionType?: string;
  };
  appointments: {
    appointmentType:
      | "booking"
      | "call-to-action"
      | "direct-ads"
      | "lead-capture";
    calendlyUrl?: string;
    googleUrl?: string;
    ctaLabel: string;
    ctaUrl: string;
    platform?: "calendly" | "google";
    directAds?: {
      type: "Product" | "Event" | "Service" | "none";
      image: string;
      title?: string;
      description?: string;
      price?: string;
      url?: string;
    };
  };
  cardView: 0;
  cardShare: 0;
  leadsGenerated: 0;
  linkClick: 0;
  adsView: 0;
  saveContact: 0;
  metadata: {
    cardType: string;
    id: string;
    createdAt: string;
    isPublic: boolean;
    slug: string;
    favorite: boolean;
    tags: string[];
    lastInteraction?: string;
    tracking?: string;
  };
}

export type FormSection = "display" | "business" | "social" | "about" | "cta";

export interface BusinessCardFormProps {
  card: BusinessCard;
  onUpdate: (card: BusinessCard) => void;
  isEditMode: boolean;
  currentSection: FormSection;
  onSectionChange: (section: FormSection) => void;
  getFullName: (card: BusinessCard) => string;
  hasUnsavedChanges: boolean;
  selectedTab?: string;
  onHandleSave?: () => void;
}

export interface FormComponentProps {
  card: BusinessCard;
  onUpdate: (card: BusinessCard) => void;
  isEditMode?: boolean;
  selectedTab?: string;
  onEditingChange?: (isEditing: boolean) => void;
}
