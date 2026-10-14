"use client";
import { BusinessCard } from "@/types/businessCard";
import { getFullName } from "./businessCard";
import { loadBusinessCards, loadDBBusinessCards } from "./cardStorage";

export type SortOption = "newest" | "oldest" | "name" | "company";

export const searchCards = (
  cards: BusinessCard[],
  query: string
): BusinessCard[] => {
  if (!query.trim()) return cards;

  const searchTerm = query.toLowerCase();
  return cards.filter(
    (card) =>
      getFullName(card).toLowerCase().includes(searchTerm) ||
      card.profile.title.toLowerCase().includes(searchTerm) ||
      card.profile.company.toLowerCase().includes(searchTerm) ||
      card.business.email.toLowerCase().includes(searchTerm) ||
      card.metadata.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
  );
};

export const sortCards = (
  cards: BusinessCard[],
  sortBy: SortOption
): BusinessCard[] => {
  const sorted = [...cards];

  switch (sortBy) {
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.metadata.createdAt).getTime() -
          new Date(a.metadata.createdAt).getTime()
      );
    case "oldest":
      return sorted.sort(
        (a, b) =>
          new Date(a.metadata.createdAt).getTime() -
          new Date(b.metadata.createdAt).getTime()
      );
    case "name":
      return sorted.sort((a, b) =>
        getFullName(a).localeCompare(getFullName(b))
      );
    case "company":
      return sorted.sort((a, b) =>
        a.profile.company.localeCompare(b.profile.company)
      );
    default:
      return sorted;
  }
};

export const filterFavorites = (cards: BusinessCard[]): BusinessCard[] => {
  return cards.filter((card) => card.metadata.favorite);
};

export const filterPublicCards = (cards: BusinessCard[]): BusinessCard[] => {
  return cards.filter((card) => card.metadata.isPublic);
};

export const memberDirectoryPublicCards = async (): Promise<BusinessCard[]> => {
  const localCards = await loadDBBusinessCards();
  const publicLocalCards = filterPublicCards(localCards) ?? [];

  // Merge and remove duplicates (based on metadata.id)
  const allCardsMap = new Map<string, BusinessCard>();
  publicLocalCards.forEach((card) => {
    allCardsMap.set(card.metadata?.id || card.id, card);
  });

  const allCards = Array.from(allCardsMap.values());
  return allCards;
};
  export const colorSchemes = {
    red: {
      bg: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      text: "#7F1D1D",
      lightText: "#FCA5A5",
    },
    pink: {
      bg: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
      text: "#831843",
      lightText: "#F9A8D4",
    },
    yellow: {
      bg: "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)",
      text: "#713F12",
      lightText: "#FDE047",
    },
    gray: {
      bg: "linear-gradient(135deg, #4f4e4f 0%, #303030 100%)",
      text: "#FFFFFF",
      lightText: "#4f4e4f",
    },
    green: {
      bg: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      text: "#064E3B",
      lightText: "#6EE7B7",
    },
    blue: {
      bg: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
      text: "#1E3A8A",
      lightText: "#93C5FD",
    },
    purple: {
      bg: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
      text: "#4C1D95",
      lightText: "#C4B5FD",
    },
    white: {
      bg: "linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)",
      text: "#1F2937",
      lightText: "#6B7280",
    },
    black: {
      bg: "linear-gradient(135deg, #000000 0%, #1F2937 100%)",
      text: "#D1D5DB",
      lightText: "#F9FAFB",
    },
  };