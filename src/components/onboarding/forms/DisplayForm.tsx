"use client";
import React from "react";
import { FormComponentProps } from "@/types/businessCard";
import {
  CardNameSection,
  ImageUploadSection,
  CardVisibilitySection,
  BrandColorSection,
} from "./sections";

/**
 * Deliberately a single column at every width.
 *
 * A two-column layout was tried here and removed: the client requires all four
 * card-design layouts to be visible side by side on desktop, and those need
 * roughly 960px. Splitting this form in two halves the width the design
 * section gets (~520px even at 1920px), which makes that impossible. The width
 * belongs to CardDesignSelection, which expands into it on its own.
 */
export function DisplayForm({
  card,
  onUpdate,
  isEditMode,
  selectedTab,
}: FormComponentProps) {
  return (
    <div className="space-y-8">
      <CardNameSection
        card={card}
        onUpdate={onUpdate}
        selectedTab={selectedTab}
        isEditMode={isEditMode}
      />
      <ImageUploadSection
        card={card}
        onUpdate={onUpdate}
        isEditMode={isEditMode}
      />
      <CardVisibilitySection
        card={card}
        onUpdate={onUpdate}
        selectedTab={selectedTab}
        isEditMode={isEditMode}
      />
      <BrandColorSection card={card} onUpdate={onUpdate} />
    </div>
  );
}
