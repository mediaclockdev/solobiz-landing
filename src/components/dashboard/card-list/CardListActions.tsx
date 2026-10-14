"use client";
import React, { useState } from "react";
import { BusinessCard } from "@/types/businessCard";
import { Edit2, Eye, BarChart2, Crown, Smartphone, Trash2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
import { loadBusinessCards } from "@/utils/cardStorage";
interface CardListActionsProps {
  card: BusinessCard;
  onAction: (
    action:
      | "edit"
      | "delete"
      | "share"
      | "view"
      | "analytics"
      | "preview"
      | "sync"
      | "details",
    card: BusinessCard
  ) => void;
  onProFeatureClick: (featureName: string) => void;
  activeTab?: string;
}

export function CardListActions({
  card,
  onAction,
  onProFeatureClick,
  activeTab,
}: CardListActionsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);

  const syncLocalCards = async (cardID: string, card: any) => {
    if (!user) {
      setShowModal(true);
      return;
    }
    try {
      const stored = localStorage.getItem("business_cards");
      if (!stored) {
        return showToast("No local cards found.", "error");
        return;
      }

      let cards = JSON.parse(stored);
      if (!Array.isArray(cards) || cards.length === 0) {
        return showToast("No valid cards to sync.", "error");
        return;
      }

      const cardsRef = collection(db, "cards");
      const q = query(
        cardsRef,
        where("uid", "==", user.uid)
        // where("sync", "==", true)
      );
      const querySnapshot = await getDocs(q);
      const count = querySnapshot.size;

      let syncCardSetting = 2;
      if (count >= syncCardSetting) {
        return showToast("Maximum 2 cards allowed to sync.", "error");
        return;
      } else {
        const localCards = loadBusinessCards();
        const selectedCard = localCards.find((c) => c.metadata.id === cardID);
        if (selectedCard) {
          const cardRef = doc(db, "cards", cardID);
          selectedCard.uid = user.uid;
          selectedCard.sync = true;
          selectedCard.isActive = true;
          await setDoc(cardRef, selectedCard);
          const updatedCards = localCards.filter(
            (c) => c.metadata.id !== selectedCard.metadata.id
          );
          if (updatedCards.length > 0) {
            localStorage.setItem(
              "business_cards",
              JSON.stringify(updatedCards)
            );
          } else {
            localStorage.removeItem("business_cards");
          }
          onAction("sync", card);
          return showToast("Sync Card Successfully.", "success");
        }
      }
    } catch (error) {
      console.error("Error syncing local cards:", error);
    }
  };

  
  return (
    <div className="flex items-center gap-2">
      {/* <button
        onClick={(e) => {
          e.stopPropagation();
          onAction("view", card);
        }}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        title="View Details"
      >
        <Eye size={18} />
      </button> */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAction("preview", card);
        }}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        title="Preview Card"
      >
        <Smartphone size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAction("details", card);
        }}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
      >
        <Edit2 size={18} />
      </button>

      {user && activeTab === "favorites" ? (
        <></>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            syncLocalCards(card.metadata?.id, card);
            //setOpenDropdownId(null);
            console.log("Sync action for card:", card.metadata?.id);
          }}
          className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
        >
          <RefreshCw size={18} />
      
        </button>
      )}

      {/* <button
        onClick={(e) => {
          e.stopPropagation();
          onProFeatureClick("Analytics");
        }}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
      >
        <div className="relative">
          <BarChart2 size={18} />
          <Crown
            size={12}
            className="text-yellow-500 absolute -top-1 -right-1 tooltip-trigger inline-flex"
            data-tooltip="Pro Feature, Upgrade Now!"
          />
        </div>
      </button> */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAction("delete", card);
        }}
        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
