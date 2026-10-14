"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Grid3X3, List, Search } from "lucide-react";
import { BusinessCard } from "@/types/businessCard";
import { CardGrid } from "@/components/dashboard/CardGrid";
import { CardList } from "@/components/dashboard/card-list";
import { loadBusinessCards } from "@/utils/cardStorage";
import {
  filterPublicCards,
  searchCards,
  sortCards,
  SortOption,
} from "@/utils/cardFilters";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { usePathname } from "next/navigation";

export default function MembersDirectory() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<BusinessCard[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isLoading, setIsLoading] = useState(true); // 👈 Added loading state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const pathname = usePathname();

  // Fetch all public cards from Firestore
  const getDatabaseCards = async (): Promise<BusinessCard[]> => {
    try {
      const cardsRef = collection(db, "cards");
      const q = query(
        cardsRef,
        where("metadata.isPublic", "==", true),
        // where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(q);
      const cards = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<BusinessCard, "id">),
      }));

      // Get all userIds from the cards
      const userIds = cards.map((card) => card.uid).filter(Boolean);

      //  Fetch corresponding referral data
      const referralsRef = collection(db, "referrals");
      const referralsSnapshot = await getDocs(referralsRef);

      // Create a map of userId → badgeLevel
      const referralMap: Record<string, string> = {};
      referralsSnapshot.forEach((refDoc) => {
        const data = refDoc.data();
        if (data.uid && data.badgeLevel) {
          referralMap[data.uid] = data.badgeLevel;
        }
      });

      // Merge badgeLevel into cards
      const cardsWithBadge = cards.map((card) => ({
        ...card,
        badgeLevel: referralMap[card.uid] || 1,
      }));

      return cardsWithBadge;
    } catch (error) {
      console.error("Error fetching cards from Firestore:", error);
      return [];
    }
  };

  // Load and merge cards on mount
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setIsLoading(true); // 👈 Start loading

        const localCards = loadBusinessCards();
        const publicLocalCards = filterPublicCards(localCards) ?? [];

        const dbCards = await getDatabaseCards();

        // Merge and remove duplicates (based on metadata.id)
        const allCardsMap = new Map<string, BusinessCard>();
        [...publicLocalCards, ...dbCards].forEach((card) => {
          allCardsMap.set(card.metadata?.id || card.id, card);
        });

        const allCards = Array.from(allCardsMap.values());
        setCards(allCards);

        console.log("Fetched total cards:", allCards.length);
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setIsLoading(false); // 👈 Stop loading
      }
    };

    fetchCards();
  }, []);

  // Filter and sort cards
  useEffect(() => {
    let updated = cards;

    if (searchQuery.trim()) {
      updated = searchCards(updated, searchQuery);
    }

    updated = sortCards(updated, sortBy);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    setFilteredCards(updated.slice(startIndex, endIndex));
  }, [cards, searchQuery, sortBy, currentPage]);

  const handleCardAction = (action: "view" | "preview", card: BusinessCard) => {
    if (action === "view") {
      navigate(`/dashboard/${card.urlName}`,
      );
    } else if (action === "preview") {
       
      localStorage.setItem("currentPath", pathname);
      navigate(`${card.urlName}`);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  // 👇 Show loading screen while fetching
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-lg">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button> */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Members Directory
            </h1>
            <p className="text-muted-foreground mt-1">
              {cards.length} public business cards
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-sm text-muted-foreground">
            {filteredCards.length} of {cards.length} cards
          </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {/* Sort Dropdown */}
            <div className="flex-1 sm:flex-initial">
              <Select
                value={sortBy}
                onValueChange={(value: SortOption) => setSortBy(value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="company">Company A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <div className="flex border border-border rounded-lg shrink-0">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Cards Display */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "No cards found" : "No public cards available"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search terms or filters."
                  : "There are currently no public business cards to display."}
              </p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <CardGrid
            cards={filteredCards}
            onAction={handleCardAction}
            onToggleFavorite={() => {}}
            showViewOnly={true}
            defaultAction="preview"
          />
        ) : (
          <CardList
            cards={filteredCards}
            onAction={handleCardAction}
            onToggleFavorite={() => {}}
            showViewOnly={true}
            defaultAction="preview"
          />
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {Math.ceil(cards.length / ITEMS_PER_PAGE)}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= Math.ceil(cards.length / ITEMS_PER_PAGE)}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
