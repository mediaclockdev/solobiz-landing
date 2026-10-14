"use client";
import React, { useState } from "react";
import { BusinessCard } from "@/types/businessCard";
import { ProFeatureModal } from "../ProFeatureModal";
import { CardListItem } from "./CardListItem";
import { AddCardButton } from "./AddCardButton";

interface CardListProps {
  cards: BusinessCard[];
  onAction: (
    action: "edit" | "delete" | "share" | "view" | "analytics" | "preview",
    card: BusinessCard
  ) => void;
  onToggleFavorite: (cardId: string) => void;
  showViewOnly?: boolean;
  onCreateCard?: () => void;
  defaultAction?: "view" | "preview";
  activeTab?: string;
}

export function CardList({
  cards,
  onAction,
  onToggleFavorite,
  showViewOnly,
  onCreateCard,
  defaultAction = "preview",
  activeTab,
}: CardListProps) {
  const [showProFeatureModal, setShowProFeatureModal] = useState(false);
  const [proFeatureName, setProFeatureName] = useState("");

  const handleProFeatureClick = (featureName: string) => {
    setProFeatureName(featureName);
    setShowProFeatureModal(true);
  };

  return (
    <>
      <div className="space-y-4">
        {cards.map((card) => (
          <CardListItem
            key={card.metadata?.id}
            card={card}
            onAction={onAction}
            onToggleFavorite={onToggleFavorite}
            showViewOnly={showViewOnly}
            onProFeatureClick={handleProFeatureClick}
            defaultAction={defaultAction}
            activeTab={activeTab}
          />
        ))}

        {/* Add Card Button */}
        {onCreateCard && <AddCardButton onCreateCard={onCreateCard} />}
      </div>

      {/* Pro Feature Modal */}
      <ProFeatureModal
        isOpen={showProFeatureModal}
        onClose={() => setShowProFeatureModal(false)}
        featureName={proFeatureName}
      />
    </>
  );
}
