"use client";
import { useEffect, useState } from "react";
import { CardDataContext } from "./CardContext";
import { useToast } from "./ToastContext";

export const initialCardData = {
  visibility: "private",
  theme: "#4299E1",
  profile: {
    cardName: "",
    profilePic: null,
  },
  business: {
    first: "",
    last: "",
    accreditations: "",
    name: "",
    jobTitle: "",
    department: "",
    slogan: "",
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
    youtube: "",
    instagram: "",
    tiktok: "",
  },
  about: {
    aboutMe: "",
  },
  cta: {
    type: "booking",
    link: "",
    label: "",
    adsType: "product",
    adsImg: null,
  },
};

export function CardDataProvider({ children }) {
  const { showToast } = useToast();
  const [cardData, setCardData] = useState(initialCardData);

  // Load from localStorage only on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cardData");
      if (saved) {
        try {
          setCardData(JSON.parse(saved));
        } catch (error) {
          console.error("Error parsing cardData:", error);
        }
      }
    }
  }, []);

  // Save to localStorage when cardData changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cardData", JSON.stringify(cardData));
      } catch (error) {
        console.error(error);
        showToast("Image too large.", "error");
      }
    }
  }, [cardData, showToast]);

  const value = { cardData, setCardData };

  return (
    <CardDataContext.Provider value={value}>
      {children}
    </CardDataContext.Provider>
  );
}
