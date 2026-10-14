// accessoryPricing.ts
"use client";
import { db } from "@/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface AccessoryPricingConfig {
  cards: {
    essential: { single: number };
    infinite: { single: number };
    custom: { single: number };
  };
  stickers: {
    essential: { single: number };
    infinite: { single: number };
  };
  discounts: {
    double: number;
    pack: number;
  };
  addOns: {
    logoRemovalFee: number;
    customLogoFee: number;
  };
  specialSale: {
    isActive: boolean;
    percentage: number;
    saleName: string;
    endDate: string;
  };
  outOfStock?: {
    essential?: boolean;
    personalize?: boolean;
    custom?: boolean;
    sticker?: boolean;
  };
  outOfStockColors?: {
    red?: boolean;
    pink?: boolean;
    yellow?: boolean;
    gray?: boolean;
    green?: boolean;
    blue?: boolean;
    purple?: boolean;
    white?: boolean;
    black?: boolean;
  };
}

// ---------------- DEFAULT CONFIG ----------------

export const DEFAULT_CONFIG: AccessoryPricingConfig = {
  cards: {
    essential: { single: 5 },
    infinite: { single: 7 },
    custom: { single: 10 }
  },
  stickers: {
    essential: { single: 3 },
    infinite: { single: 5 }
  },
  discounts: {
    double: 5,
    pack: 15
  },
  addOns: {
    logoRemovalFee: 2,
    customLogoFee: 3
  },
  specialSale: {
    isActive: false,
    percentage: 0,
    saleName: "",
    endDate: new Date().toISOString()
  },
  outOfStock: {
    essential: false,
    personalize: false,
    custom: false,
    sticker: false
  },
  outOfStockColors: {
    red: false,
    pink: false,
    yellow: false,
    gray: false,
    green: false,
    blue: false,
    purple: false,
    white: false,
    black: false
  }
};

// Firestore Document Path
const ACCESSORY_DOC = doc(db, "accessories", "pricingConfig");

// ---------------- LOAD ----------------

export async function loadPricingConfig(): Promise<AccessoryPricingConfig> {
  const snap = await getDoc(ACCESSORY_DOC);

  if (!snap.exists()) {
    await setDoc(ACCESSORY_DOC, DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  const data = snap.data();
  return {
    ...DEFAULT_CONFIG,
    ...data,
    cards: { ...DEFAULT_CONFIG.cards, ...data.cards },
    stickers: { ...DEFAULT_CONFIG.stickers, ...data.stickers },
    discounts: { ...DEFAULT_CONFIG.discounts, ...data.discounts },
    addOns: { ...DEFAULT_CONFIG.addOns, ...data.addOns },
    specialSale: { ...DEFAULT_CONFIG.specialSale, ...data.specialSale },
    outOfStock: { ...DEFAULT_CONFIG.outOfStock, ...data.outOfStock },
    outOfStockColors: { ...DEFAULT_CONFIG.outOfStockColors, ...data.outOfStockColors }
  } as AccessoryPricingConfig;
}

// ---------------- SAVE ----------------

export async function savePricingConfig(config: AccessoryPricingConfig) {
  await setDoc(ACCESSORY_DOC, config, { merge: true });
}

// ---------------- RESET ----------------

export async function resetPricingConfig(): Promise<AccessoryPricingConfig> {
  await setDoc(ACCESSORY_DOC, DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}
