"use client";
import React, { useEffect, useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";
import { Card } from "@/components/ui/card";

export function CardVisibilitySection({
  card,
  onUpdate,
  selectedTab = "local",
  isEditMode = false,
}: FormComponentProps) {
  const { user } = useAuth();
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  function parseCreatedAt(input: any) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  useEffect(() => {
    if (!user) return;
    const isFree = user?.planType === "free";
    setIsFreePlan(isFree);
    const createdAt = parseCreatedAt(user?.createdAt);
    const trialEnd = new Date(
      createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000,
    );
    const trialActive = new Date() <= trialEnd;
    setIsTrialActive(trialActive);
  }, [user]);

  const isProLocked = selectedTab != "local" && isFreePlan && !isTrialActive;

  const handleVisibilityChange = (isPublic: boolean) => {
    // if (isProLocked) {
    //   setShowWarning(true);
    //   return;
    // }

    const updatedCard = { ...card };
    updatedCard.metadata.isPublic = isPublic;
    onUpdate(updatedCard);
  };

  const isPublicValue = card.metadata.isPublic;
  // If isEditMode is true, we consider the card "Private" if it is not explicitly Public (true).
  // If isEditMode is false, the card starts as unselected (null/undefined) and requires explicit selection.
  const isPrivateSelected = isEditMode
    ? isPublicValue !== true
    : isPublicValue === false;
  const isPublicSelected = isPublicValue === true;
  const isUnselected = !isPrivateSelected && !isPublicSelected;

  return (
    <div className="space-y-3">
      <Label className="text-[13px] font-bold text-slate-900 dark:text-white">
        Card Visibility <span className="text-destructive ml-1">*</span>
        {isProLocked && <Lock size={14} className="ml-1 text-yellow-500" />}
      </Label>
      <Card className="rounded-md shadow-sm border p-4 lg:p-6">
        <div className="flex space-x-3">
          <Button
            type="button"
            variant={isPrivateSelected ? "default" : "outline"}
            size="sm"
            onClick={() => handleVisibilityChange(false)}
            className="px-6 rounded-md"
          >
            Private
          </Button>
          <Button
            type="button"
            variant={isPublicSelected ? "default" : "outline"}
            size="sm"
            onClick={() => handleVisibilityChange(true)}
            className="px-6 rounded-md"
          >
            Public
          </Button>
        </div>
        <p className="text-xs font-bold text-slate-400 mt-4 px-1 leading-relaxed">
          {isPublicSelected
            ? "Your card will be listed in our public members directory"
            : isPrivateSelected
              ? "Only people with the direct link can view your card"
              : "Please select either private or public"}
        </p>
      </Card>

      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}
