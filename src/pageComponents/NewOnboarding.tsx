"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BusinessCard, FormSection } from "@/types/businessCard";
import { BusinessCardForm } from "@/components/onboarding/BusinessCardForm";
import { BusinessCardPreview } from "@/components/onboarding/BusinessCardPreview";
import { getFullName, createInitialCard } from "@/utils/businessCard";

export default function CreateCard() {
  const [card, setCard] = useState<BusinessCard>(createInitialCard());
  const [currentSection, setCurrentSection] = useState<FormSection>("display");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const editMode = searchParams.get("editMode") === "true";
  const cardId = searchParams.get("cardId");

  // Initialize card state for editing
  useEffect(() => {
    if (editMode && cardId) {
      const savedCards: BusinessCard[] = JSON.parse(
        localStorage.getItem("savedCards") || "[]"
      );
      const cardToEdit = savedCards.find(
        (c: BusinessCard) => c.metadata?.id === cardId
      );

      if (cardToEdit) {
        setCard(cardToEdit);
      } else {
        // Card not found, redirect to cards page
        router.push("/dashboard/cards");
      }
    }
  }, [editMode, cardId, router]);

  const handleCardUpdate = (updatedCard: BusinessCard) => {
    setCard(updatedCard);
    setHasUnsavedChanges(true);
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor: `${card.brandColor}15` }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Form Section */}
          <div className="lg:sticky lg:top-6 lg:self-start lg:h-[calc(100vh-3rem)] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] z-50">
            <BusinessCardForm
              card={card}
              onUpdate={handleCardUpdate}
              currentSection={currentSection}
              onSectionChange={setCurrentSection}
              isEditMode={editMode}
              getFullName={getFullName}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </div>

          {/* Preview Section */}
          <div className="hidden lg:block lg:sticky lg:top-6 mt-8 lg:mt-0 lg:self-start">
            <BusinessCardPreview card={card} />
          </div>
        </div>
      </div>
    </div>
  );
}
