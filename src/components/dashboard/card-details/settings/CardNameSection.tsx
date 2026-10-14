"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BusinessCard } from "@/types/businessCard";
import {
  saveBusinessCard,
  isUrlNameAvailable,
  generateUniqueUrlName,
} from "@/utils/cardStorage";
import { CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";

interface CardNameSectionProps {
  card: BusinessCard;
  onUpdate?: (updatedCard: BusinessCard) => void;
}

export function CardNameSection({ card, onUpdate }: CardNameSectionProps) {
  const [urlName, setUrlName] = useState(card.urlName);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestion, setSuggestion] = useState<string>("");
  const { showToast } = useToast();
  const { user } = useAuth();

  // Check availability when urlName changes
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      if (urlName?.trim() && urlName !== card.urlName) {
        const available = await isUrlNameAvailable(urlName, card.metadata.id);

        if (!isCancelled) {
          setIsAvailable(available);

          if (!available) {
            const uniqueName = await generateUniqueUrlName(urlName, card.metadata.id);
            if (!isCancelled) setSuggestion(uniqueName);
          } else {
            setSuggestion("");
          }
        }
      } else {
        if (!isCancelled) {
          setIsAvailable(null);
          setSuggestion("");
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [urlName, card.urlName, card.metadata.id]);

  const handleSave = async () => {
    if (!urlName?.trim()) {
      return showToast("Card Name is required", "error");
      return;
    }

    // See the note in CardEditForm: `await !fn()` negates the promise, not
    // the result, so this check never fired.
    if (!(await isUrlNameAvailable(urlName, card.metadata.id))) {
      const newSuggestion = await generateUniqueUrlName(urlName);

      return showToast("Card Name Already Exists", "error");

      return;
    }

    const updatedCard = { ...card, urlName };
    if (user) {
      const q = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id)
      );
      getDocs(q)
        .then((querySnapshot) => {
          if (querySnapshot.empty) {
            showToast("Card not found", "error");
            return;
          }

          querySnapshot.forEach((docSnap) => {
            updateDoc(docSnap.ref, {
              urlName: urlName,
            });
          });

          showToast("Card updated successfully!", "success");
          return;
        })
        .catch((error) => {
          console.error("Error saving card:", error);
          showToast("Failed to save card", "error");
        });
    } else {
      saveBusinessCard(updatedCard);
      return showToast("Card name updated succesfully", "success");
      return;
    }

    if (onUpdate) {
      onUpdate(updatedCard);
    }
  };

  const handleSuggestionClick = () => {
    if (suggestion) {
      setUrlName(suggestion);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Card Name</h3>
          <div className="space-y-3">
            <div className="relative">
              <Input
                readOnly
                type="text"
                value={urlName}
                onChange={(e) => setUrlName(e.target.value)}
                placeholder="Enter card name"
                className={`pr-10 ${
                  isAvailable === false
                    ? "border-destructive"
                    : isAvailable === true
                    ? "border-green-500"
                    : ""
                }`}
              />
              {isAvailable !== null &&
                urlName?.trim() &&
                urlName !== card.urlName && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isAvailable ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
            </div>

            {/* Status messages */}
            {isAvailable === true &&
              urlName?.trim() &&
              urlName !== card.urlName && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  This name is available!
                </p>
              )}

            {isAvailable === false && suggestion && (
              <div className="space-y-2">
                <p className="text-sm text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  This name is already taken
                </p>
                <button
                  type="button"
                  onClick={handleSuggestionClick}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 underline"
                >
                  <Lightbulb className="h-3 w-3" />
                  Try "{suggestion}" instead
                </button>
              </div>
            )}

            {/* <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!urlName?.trim() || isAvailable === false}
            >
              Save
            </Button> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
