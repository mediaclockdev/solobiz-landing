"use client";
import React, { useState, useEffect } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isUrlNameAvailable,
  generateUniqueUrlName,
  generateRandomUrlSuggestions,
} from "@/utils/cardStorage";
import { CheckCircle, XCircle, Lightbulb, Loader2 } from "lucide-react";

export function CardNameSection({
  card,
  onUpdate,
  selectedTab,
  isEditMode,
}: FormComponentProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(card.urlName || "");
  const handleInputChange = (field: string, value: string) => {
    const formattedValue = value.replace(/[^a-zA-Z0-9\s-]/g, "");

    // 2. Split keys for nested object
    const keys = field.split(".");
    const updatedCard: any = { ...card };
    let temp = updatedCard;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        temp[key] = formattedValue; // set final value
      } else {
        temp[key] = { ...temp[key] };
        temp = temp[key];
      }
    });

    onUpdate(updatedCard);
  };

  const handleInputBlur = (field: string) => {
    let formattedValue = card.urlName
      .toLowerCase()
      .replace(/\s+/g, "-") // convert spaces to hyphens
      .replace(/-+/g, "-") // merge consecutive hyphens
      .replace(/^-+|-+$/g, ""); // remove leading/trailing hyphens

    setInputValue(formattedValue);

    const keys = field.split(".");
    const updatedCard = { ...card };

    if (keys.length === 1) {
      (updatedCard as any)[keys[0]] = formattedValue;
    } else if (keys.length === 2) {
      (updatedCard as any)[keys[0]][keys[1]] = formattedValue;
    }
    onUpdate(updatedCard);
  };

  // Check availability
  useEffect(() => {
    let isCancelled = false;

    if (!card.urlName?.trim()) {
      setIsAvailable(null);
      setSuggestions([]);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);

    const timer = setTimeout(async () => {
      try {
        const available = await isUrlNameAvailable(
          card.urlName,
          card.metadata?.id,
        );

        if (isCancelled) return;
        setIsAvailable(available);

        if (!available) {
          const generatedSuggestions = await generateRandomUrlSuggestions(
            card.urlName,
            card.metadata?.id,
            true,
            3,
          );

          if (!isCancelled) {
            setSuggestions(generatedSuggestions);
          }
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Availability check failed:", err);
      } finally {
        if (!isCancelled) {
          setIsChecking(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [card.urlName, card.metadata?.id]);

  // Handle suggestion click
  const handleSuggestionClick = (value: string) => {
    const updatedCard = { ...card, urlName: value };
    onUpdate(updatedCard);
  };

  useEffect(() => {
    const savedUrl = localStorage.getItem("claimCard");
    if (savedUrl && !isEditMode && !card.urlName) {
      const updatedCard = { ...card, urlName: savedUrl };
      onUpdate(updatedCard);
      localStorage.removeItem("claimCard");
    }
  }, [isEditMode]);

  return (
    <div className="space-y-2 mt-4">
      <Label htmlFor="urlName" className="text-[13px] font-bold text-slate-900 dark:text-white">
        Card Name <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <Input
          id="urlName"
          placeholder="e.g., john-smith-business-card"
          value={card.urlName}
          onChange={(e) => handleInputChange("urlName", e.target.value)}
          readOnly={isEditMode}
          onBlur={(e) => handleInputBlur("urlName")}
          className={`w-full pr-10 ${
            !isChecking && isAvailable === false && !isEditMode
              ? "border-destructive"
              : !isChecking && isAvailable === true && !isEditMode
                ? "border-green-500"
                : ""
          }`}
        />
        {card.urlName?.trim() && !isEditMode && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isAvailable === true ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : isAvailable === false ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : null}
          </div>
        )}
      </div>

      {/* Status messages */}
      {isChecking && card.urlName?.trim() && !isEditMode && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Checking availability...
        </p>
      )}

      {!isChecking && isAvailable === true && card.urlName?.trim() && !isEditMode && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          This name is available!
        </p>
      )}

      {!isChecking && isAvailable === false && !isEditMode && (
        <div className="space-y-2">
          <p className="text-sm text-destructive flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            This name is already taken
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 underline"
              >
                <Lightbulb className="h-3 w-3" />
                {suggestion}
              </button>
            ))}
          </div>
          {/* <Lightbulb className="h-3 w-3" />
            Try "{suggestion}" instead
          </button> */}
        </div>
      )}

      <p className="text-sm text-muted-foreground font-semibold">
        A unique identifier for your card's URL
      </p>
    </div>
  );
}
