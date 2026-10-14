"use client";
import { BusinessCard } from "@/types/businessCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardTab } from "./tabs/CardTab";
import { EditTab } from "./tabs/EditTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { ViewTab } from "./tabs/ViewTab";
import { useMemo, useCallback } from "react";
import { loadBusinessCards } from "@/utils/cardStorage";

interface CardDetailsTabsProps {
  card: BusinessCard;
  cardId: string;
  qrCodeUrl: string;
  selectedTab?: string;
  onCardUpdate: (updatedCard: BusinessCard) => void;
  onUpgrade: () => void;
  onLogoChange?: (logoFile: File | null) => void;
  onQRCodeUpdate?: (newQRCodeUrl: string) => void;
}

export function CardDetailsTabs({
  card,
  cardId,
  qrCodeUrl,
  selectedTab = "card",
  onCardUpdate,
  onUpgrade,
  onLogoChange,
  onQRCodeUpdate,
}: CardDetailsTabsProps) {
  const externalLink = useMemo(() => {
    if (typeof window !== "undefined") {
      let selectedTab = "favorites";
      const localCards = loadBusinessCards();
      const selectedCard = localCards.find((c) => c.metadata.id === cardId);
      if (selectedCard) {
        selectedTab = "local";
      } else {
        selectedTab = "favorites";
      }
      return `${window.location.origin}/card/${cardId}?selectedTab=${selectedTab}`;
    }
    return "";
  }, [cardId]);

  const handleViewClick = useCallback(() => {
    if (externalLink) {
      window.open(externalLink, "_blank");
    }
  }, [externalLink]);

  return (
    <Tabs defaultValue={selectedTab ?? "card"} className="flex-1 w-full">
      <div className="flex justify-start mb-6">
        <TabsList className="grid w-full max-w-sm grid-cols-3 bg-slate-100 dark:bg-slate-800/50 h-auto p-1 rounded-full">
          <TabsTrigger 
            value="card" 
            className="h-10 rounded-full hover:border-0 data-[state=active]:border-none data-[state=active]:bg-indigo-600 dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider transition-all"
          >
            Card
          </TabsTrigger>
          <TabsTrigger 
            value="edit" 
            className="h-10 rounded-full hover:border-0 data-[state=active]:border-none data-[state=active]:bg-indigo-600 dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider transition-all"
          >
            Edit
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="h-10 rounded-full hover:border-0 data-[state=active]:border-none data-[state=active]:bg-indigo-600 dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider transition-all"
          >
            Settings
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="card">
        <CardTab
          card={card}
          cardId={cardId}
          qrCodeUrl={qrCodeUrl}
          onUpgrade={onUpgrade}
          selectedTab={selectedTab}
        />
      </TabsContent>

      <TabsContent value="edit">
        <EditTab card={card} onUpdate={onCardUpdate} />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsTab
          card={card}
          cardId={cardId}
          qrCodeUrl={qrCodeUrl}
          onLogoChange={onLogoChange}
          onQRCodeUpdate={onQRCodeUpdate}
        />
      </TabsContent>

      <TabsContent value="view">
        <ViewTab cardId={cardId} />
      </TabsContent>
    </Tabs>
  );
}
