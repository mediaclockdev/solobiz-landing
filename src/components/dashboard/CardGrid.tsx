"use client";
import React, { useState } from "react";
import { BusinessCard } from "@/types/businessCard";
import {
  Edit2,
  Eye,
  MoreVertical,
  Share2,
  Star,
  Trash2,
  Save,
  BarChart2,
  Crown,
  Plus,
  Smartphone,
  Calendar,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { ProFeatureModal } from "./ProFeatureModal";
import { getFullName } from "@/utils/businessCard";
import { format } from "date-fns";
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
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface CardGridProps {
  cards: BusinessCard[];
  onAction: (
    action:
      | "edit"
      | "delete"
      | "share"
      | "view"
      | "analytics"
      | "preview"
      | "details"
      | "sync",
    card: BusinessCard
  ) => void;
  onToggleFavorite: (cardId: string) => void;
  showSaveButton?: boolean;
  onSaveCard?: (card: BusinessCard) => void;
  showViewOnly?: boolean;
  onCreateCard?: () => void;
  defaultAction?: "view" | "preview";
  activeTab?: string;
}

export function CardGrid({
  cards,
  onAction,
  onToggleFavorite,
  showSaveButton,
  onSaveCard,
  showViewOnly,
  onCreateCard,
  defaultAction = "preview",
  activeTab,
}: CardGridProps) {
  const [showProFeatureModal, setShowProFeatureModal] = useState(false);
  const [proFeatureName, setProFeatureName] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [showLocalModal, setShowLocalModal] = useState(false);

  const syncLocalCards = async (cardID: string, card: any, urlName: string) => {
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
        const q = query(
          collection(db, "cards"),
          where("urlName", "==", card.urlName)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          //    console.log("dfbfbf");
          showToast("Card name already exists", "error");
          return;
        }

        //  console.log("bfdbdfb",card.urlNam);
        // return;

        if (selectedCard) {
          const cardRef = doc(db, "cards", urlName);
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

  const levelImages = {
    1: "/badges/1-Starter.png",
    2: "/badges/2-LevelUp.png",
    3: "/badges/3-BronzeEarner.png",
    4: "/badges/4-SilverEarner.png",
    5: "/badges/5-GoldEarner.png",
    6: "/badges/6-PlatinumEarner.png",
  };

  return (
    <>
      <div className={cn(showModal ? "blur-sm pointer-events-none" : "")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {(cards || [])
            .filter((card) => card?.profile)
            .map((card) => (
              <div
                key={card.metadata?.id}
                className={`bg-card rounded-lg shadow-sm border border-border p-2 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer`}
                onClick={() => onAction(defaultAction, card)}
              >
                {/* Header with Image - Always show with brand color background */}
                <div
                  className="relative h-32"
                  style={{ backgroundColor: card.brandColor }}
                >
                  {card.profilePhoto ? (
                    <img
                      src={card.profilePhoto}
                      alt={getFullName(card)}
                      className="w-full h-full w-full object-contain object-cover"
                      style={{ minHeight: "128px" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                        {getFullName(card)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                    </div>
                  )}
                  {/* Brand Color Bar */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: card.brandColor }}
                  />

                  {/* Quick Actions - only show when not in view-only mode */}
                  {!showViewOnly && (
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      {/* Public/Private Label */}
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          card.metadata?.isPublic
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {card.metadata?.isPublic ? "Public" : "Private"}
                      </span>
                      <div className="relative">
                        {activeTab !== "favorites" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(
                                openDropdownId === card.metadata?.id
                                  ? null
                                  : card.metadata?.id || null
                              );
                            }}
                            className="p-1.5 rounded-full bg-background/90 text-muted-foreground hover:bg-background transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                        )}
                        <div
                          className={`absolute right-0 mt-1 w-36 bg-popover rounded-lg shadow-lg border border-border py-1 z-20 ${
                            openDropdownId === card.metadata?.id
                              ? "visible"
                              : "invisible"
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAction(
                                activeTab === "local" ? "view" : "details",
                                card
                              );
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
                          >
                            {activeTab === "local" ? (
                              <>
                                <Edit2
                                  size={14}
                                  className="inline-block mr-1"
                                />{" "}
                                Edit
                              </>
                            ) : (
                              <>
                                <Edit2
                                  size={14}
                                  className="inline-block mr-1"
                                />{" "}
                                Edit
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAction("preview", card);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
                          >
                            <Smartphone size={14} />
                            Preview
                          </button>

                          {user && activeTab === "favorites" ? (
                            <></>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                syncLocalCards(
                                  card.metadata?.id,
                                  card,
                                  card?.urlName
                                );
                                setOpenDropdownId(null);
                                console.log(
                                  "Sync action for card:",
                                  card.metadata?.id
                                );
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
                            >
                              <RefreshCw size={14} />
                              Sync
                            </button>
                          )}

                          {showSaveButton && onSaveCard && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSaveCard(card);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-accent flex items-center gap-2"
                              role="menuitem"
                            >
                              <Save size={14} />
                              Save to Local
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAction("delete", card);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Brand Color Banner */}
                <div
                  className="h-1"
                  style={{ backgroundColor: card.brandColor }}
                />

                {/* Content */}
                <div className="p-2">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {getFullName(card)}
                    </h3>
                    {card?.badgeLevel && (
                      <img
                        src={levelImages[card?.badgeLevel]}
                        alt={`${card?.badgeLevel} Earner`}
                        className="w-8 h-8"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm mt-1">
                      <span style={{ color: card.brandColor }}>
                        {card.profile?.title}
                      </span>
                      {card.profile.company && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="font-medium">
                            {card.profile?.company}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-2 text-sm">
                    {card.business?.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail size={14} style={{ color: card.brandColor }} />
                        <span className="truncate">{card.business?.email}</span>
                      </div>
                    )}
                    {card.business?.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone size={14} style={{ color: card.brandColor }} />
                        <span>{card.business?.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {card.metadata?.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {card.metadata.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">
                        {card.urlName || "Untitled Card"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>
                          {format(
                            new Date(card.metadata?.createdAt || ""),
                            "MMM d, yyyy"
                          ).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {card.metadata?.lastInteraction && (
                      <span className="block mt-1">
                        Last interaction:{" "}
                        {new Date(
                          card.metadata.lastInteraction
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* Add Card Button */}
          {onCreateCard && (
            <div
              onClick={() => {
                if (!user && activeTab === "favorites") {
                  setShowLocalModal(true);
                } else {
                  onCreateCard();
                }
              }}
              className="bg-card rounded-lg shadow-sm border border-border border-dashed p-6 hover:shadow-md transition-shadow group cursor-pointer hover:border-primary/30"
            >
              <div className="flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Add Card</h3>
                <p className="text-sm text-muted-foreground">
                  Click here to add new card
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pro Feature Modal */}
        <ProFeatureModal
          isOpen={showProFeatureModal}
          onClose={() => setShowProFeatureModal(false)}
          featureName={proFeatureName}
        />
      </div>
      {showModal && (
        <div
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center",
            "left-0" // matches sidebar width
          )}
        >
          {/* Dark overlay (only covers content area) */}
          <div className="absolute inset-0 bg-black/30" />
          {/* Modal Box */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 z-50 w-full max-w-sm mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Permission Required
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              You need to{" "}
              <span className="font-medium text-gray-800">sign in</span>
              to access this page. Please log in with your account.
            </p>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  setTimeout(() => router.replace("/?signIn=true"), 100);
                }}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}

      {showLocalModal && (
        <div
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center",
            "left-0"
          )}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-lg shadow-xl p-6 z-50 w-full max-w-sm mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Permission Required
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              You need to{" "}
              <span className="font-medium text-gray-800">sign in</span>
              to access this page. Please log in with your account.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLocalModal(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={() => {
                  setShowLocalModal(false);
                  setTimeout(() => router.replace("/?signIn=true"), 200);
                }}
                className="px-6 py-2 rounded-lg"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
