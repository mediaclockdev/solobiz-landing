"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "@/lib/navigation";
import { BusinessCard } from "@/types/businessCard";
import { loadBusinessCards } from "@/utils/cardStorage";
import { getFullName } from "@/utils/businessCard";
import { ArrowLeft } from "lucide-react";
import { MobileCardLayout } from "./MobileCardLayout";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";

export function CardDisplayContainer() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.cardUrlName as string;
  const searchParams = useSearchParams();
  // const selectedTab=params.selectedTab as string;
  // const selectedTab = searchParams.get("selectedTab");
  const option = searchParams.get("option");

  const selectedView = searchParams.get("view");

  const navigate = useNavigate();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const [cardUrlId, setCardUrlId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("favorites");
  // Add comprehensive debugging

  const getDataBaseCard = async (cardId: string) => {
    try {
      const cardsRef = collection(db, "cards");
      const q = query(cardsRef, where("urlName", "==", cardId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setSelectedTab("favorites");
        const docSnap = querySnapshot.docs[0];
        const userCard: BusinessCard = {
          id: docSnap.id,
          ...(docSnap.data() as Omit<BusinessCard, "id">),
        };
        setCard(userCard);
        setCardUrlId(userCard.metadata.id);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching card:", err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    // Direct localStorage inspection (only on client side)
    if (typeof window !== "undefined") {
      const oldCards = localStorage.getItem("savedCards");
      const newCards = localStorage.getItem("business_cards");
    }
    if (cardId) {
      const localCardsDemo = loadBusinessCards();
      const selectedCardDemo = localCardsDemo.find((c) => c.urlName === cardId);
      console.log("selectedCardDemo", selectedCardDemo, user);
      if (!selectedCardDemo) {
        getDataBaseCard(cardId);
        setSelectedTab("favorites");
      } else {
        setSelectedTab("local");
      }
      if (user && selectedTab !== "local") {
        // console.log("USer", user);
        getDataBaseCard(cardId);
      } else {
        setIsLoading(false);
        // For testing purposes, create a sample card if cardId is 'test-card'
        if (cardId === "test-card") {
          const sampleCard: BusinessCard = {
            urlName: "test-card",
            profilePhoto: "",
            coverImage: "",
            companyLogo: "",
            brandColor: "#4299E1",
            cardLayout: "standard",
            templateType: "modern",
            profile: {
              firstName: "John",
              lastName: "Smith",
              title: "Software Engineer",
              businessCategory: "Technology",
              department: "Engineering",
              education: "B.Tech in Computer Science Engineering",
              company: "Tech Corp",
              accreditations: ["MBA", "PMP"],
              companySlogan: "Innovation at its best",
            },
            business: {
              phone: "+1 234 567 8901",
              email: "john.smith@techcorp.com",
              website: "https://www.techcorp.com",
              address: {
                street: "123 Tech Street",
                city: "San Francisco",
                state: "CA",
                zip: "94105",
                country: "USA",
              },
            },
            social: {
              linkedin: "https://linkedin.com/in/johnsmith",
              twitter: "https://twitter.com/johnsmith",
              facebook: "",
              instagram: "",
              youtube: "",
              tiktok: "",
            },
            about: {
              bio: "Passionate software engineer with 10+ years of experience in building scalable web applications.",
              sectionTitle: "About Me",
              skills: ["JavaScript", "React", "Node.js", "Python"],
            },
            appointments: {
              appointmentType: "booking",
              calendlyUrl: "https://calendly.com/johnsmith",
              ctaLabel: "Schedule Meeting",
              ctaUrl: "https://calendly.com/johnsmith",
            },
            cardView: 0,
            cardShare: 0,
            leadsGenerated: 0,
            linkClick: 0,
            adsView: 0,
            saveContact: 0,
            metadata: {
              cardType: "free",
              id: "test-card",
              createdAt: new Date().toISOString(),
              isPublic: false,
              slug: "test-card",
              favorite: false,
              tags: ["test"],
              lastInteraction: new Date().toISOString(),
            },
          };

          console.log("Using sample test card");
          setCard(sampleCard);
          setIsLoading(false);
          return;
        }

        // Test both storage keys directly (only on client side)
        if (typeof window !== "undefined") {
          const oldStorageCards = localStorage.getItem("savedCards");
          if (oldStorageCards) {
            try {
              const parsedOld = JSON.parse(oldStorageCards);
              console.log(
                "Cards in old storage:",
                parsedOld.map((c) => ({
                  id: c.metadata.id,
                  slug: c.metadata.slug,
                })),
              );
              const foundInOld = parsedOld.find((c) => c.urlName === cardId);
              console.log(
                "Card found in old storage:",
                foundInOld ? "YES" : "NO",
              );
            } catch (e) {
              console.error("Error parsing old storage:", e);
            }
          }

          console.log("Checking new storage key (business_cards)...");
          const newStorageCards = localStorage.getItem("business_cards");
          if (newStorageCards) {
            try {
              const parsedNew = JSON.parse(newStorageCards);
              console.log(
                "Cards in new storage:",
                parsedNew.map((c) => ({
                  id: c.metadata.id,
                  slug: c.metadata.slug,
                })),
              );
              const foundInNew = parsedNew.find((c) => c.urlName === cardId);
              setCard(foundInNew);
              setCardUrlId(foundInNew.metadata.id);
              console.log(
                "Card found in new storage:",
                foundInNew ? "YES" : "NO",
              );
            } catch (e) {
              console.error("Error parsing new storage:", e);
            }
          }
          setIsLoading(false);
        }

        // Now use the standard function
        const cards = loadBusinessCards();
        const foundCard = cards.find((c) => c.urlName === cardId);
        console.log(
          "Card found by loadBusinessCards():",
          foundCard ? "YES" : "NO",
        );

        if (foundCard) {
          setSelectedTab("local");
          setCard(foundCard);
          setCardUrlId(foundCard.metadata.id);
        } else {
          getDataBaseCard(cardId);
          // setError("Card not found");
        }
        setIsLoading(false);
      }
    }
    setIsLoading(false);
  }, [cardId, selectedTab]);
  useEffect(() => {
    if (!card) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [card]);
  // Update document title for SEO
  useEffect(() => {
    if (card) {
      const fullName = getFullName(card);
      document.title = `${fullName}'s Digital Business Card`;
    }
  }, [card]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  if (error || !card) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-card rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Card not found
          </h2>
          <p className="text-muted-foreground mb-6">
            The card you are looking for may have been deleted or is private.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <MobileCardLayout
      card={card}
      cardType={selectedTab}
      cardId={cardUrlId}
      onNavigateBack={() => router.back()}
      option={option ?? ""}
      showBackbtn={true}
    />
  );
}
