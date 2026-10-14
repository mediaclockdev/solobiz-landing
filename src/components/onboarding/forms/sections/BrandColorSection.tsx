"use client";
import React, { useEffect, useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultBrandColors } from "@/utils/businessCard";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Instagram, Lock, ArrowRight, Sparkles } from "lucide-react";
import { UpgradePopup } from "../content-form/UpgradePopup";
import { useNavigate } from "@/lib/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BrandColorSection({ card, onUpdate }: FormComponentProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isTrialActive, setIsTrialActive] = useState<boolean>(false);
  const [isFreePlan, setIsFreePlan] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState(false);
  const handleInputChange = (field: string, value: string) => {
    const keys = field.split(".");
    const updatedCard = { ...card };

    if (keys.length === 1) {
      (updatedCard as any)[keys[0]] = value;
    } else if (keys.length === 2) {
      (updatedCard as any)[keys[0]][keys[1]] = value;
    }

    onUpdate(updatedCard);
  };
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">(
    card.theme || "light",
  );
  const [iconStyle, setIconStyle] = useState(card.iconStyle || "round"); // shape
  const [iconVariant, setIconVariant] = useState(
    card.iconVariant || "standard",
  ); // style

  const colorMap: Record<string, string> = {
    "#f95f5f": "Red",
    "#ff8a4c": "Orange",
    "#ffd93d": "Yellow",
    "#b87d4b": "Brown",
    "#4cd964": "Green",
    "#4ecdc4": "Teal",
    "#4299e1": "Blue",
    "#5856d6": "Indigo",
    "#af52de": "Purple",
    "#ff2d55": "Pink",
    "#2c3e50": "Dark Blue",
    "#8e8e93": "Gray",
  };

  function parseCreatedAt(input) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  const handleIconVariantChange = (
    value: "standard" | "custom" | "custom_negative",
  ) => {
    setIconVariant(value);
    onUpdate({
      ...card,
      iconVariant: value,
    });
  };

  const handleIconStyleChange = (value: "round" | "square") => {
    setIconStyle(value);
    onUpdate({
      ...card,
      iconStyle: value,
    });
  };

  const handleThemeChange = (value: "light" | "dark") => {
    setSelectedTheme(value);
    // Light/Dark applies to THIS CARD only. It must not touch the app's own
    // theme - the preview scopes it via `card.theme`, and the dashboard's
    // light/dark stays under the user's control in the header toggle.
    onUpdate({
      ...card,
      theme: value,
    });
  };

  useEffect(() => {
    setIconStyle(card.iconStyle || "round");
    setIconVariant(card.iconVariant || "standard");
    
    // Reflect the card's own theme, not the app's global one.
    setSelectedTheme(card.theme || "light");
  }, [card.iconStyle, card.iconVariant, card.theme]);

  useEffect(() => {
    if (user) {
      const isFreePlan = user?.planType === "free";
      setIsFreePlan(isFreePlan);
      const createdAt = parseCreatedAt(user?.createdAt);
      const trialEnd = new Date(
        createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000,
      );
      const isTrialActive = new Date() <= trialEnd;
      setIsTrialActive(isTrialActive);
    } else {
      setIsFreePlan(true);
    }
  }, [user]);

  return (
    <div className="space-y-3 [container-type:inline-size]">
      <div className="px-4">
        <Label className="text-[13px] font-bold text-slate-900 dark:text-white">
          Style
        </Label>
      </div>
      <Card className="rounded-md shadow-sm border p-4 lg:p-8 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-1 text-xs sm:text-sm">
            <Label className="text-[13px] font-bold text-slate-900 dark:text-white">Color</Label>
          </div>

          <div className="flex items-center gap-1 justify-between">
            {/* Color Picker + Hex Input */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={card.brandColor}
                onChange={(e) =>
                  handleInputChange("brandColor", e.target.value)
                }
                className="w-8 h-8 p-0 rounded border-none cursor-pointer"
              />
              <Input
                type="text"
                value={card.brandColor}
                onChange={(e) =>
                  handleInputChange("brandColor", e.target.value)
                }
                className="w-20 text-xs sm:text-sm p-1 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-xs font-bold text-slate-900">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: card.brandColor }}
              />
              {colorMap[card.brandColor.toLowerCase()] || card.brandColor}
            </div>
          </div>
          {/* Color Presets */}
          <div className="px-2 flex flex-wrap gap-4 pt-[5px] pb-2">
            {defaultBrandColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleInputChange("brandColor", color)}
                className="w-7 h-7 shrink-0 rounded-full border border-gray-300 cursor-pointer hover:scale-[1.09]"
                style={
                  card.brandColor.toLowerCase() === color.toLowerCase()
                    ? {
                        backgroundColor: color,
                        boxShadow: `0 0 0 1.5px white, 0 0 0 3.5px ${color}`,
                      }
                    : { backgroundColor: color }
                }
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-[13px] font-bold text-slate-900 dark:text-white">Theme</Label>

          <div className="grid grid-cols-2 [@container(min-width:480px)]:grid-cols-3 gap-3">
            {[
              { id: "light", label: "Light" },
              { id: "dark", label: "Dark" },
            ].map((t) => {
              const isActive = selectedTheme === t.id;

              return (
                <Button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id as any)}
                  className={cn(
                    "h-12 rounded-md text-xs font-bold flex items-center justify-center px-4 transition-all hover:bg-transperent",
                    isActive
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-400 border border-slate-200 hover:border-slate-300",
                  )}
                >
                  {/* Right Circle Check */}
                  <div
                    className={cn(
                      "w-[14px] h-[14px] rounded-full flex items-center justify-center transition-all",
                      !isActive && "border border-slate-300",
                    )}
                    style={
                      isActive ? { backgroundColor: card?.brandColor } : {}
                    }
                  >
                    {isActive && (
                      <Check className="!w-[20px] !h-[10px] text-white" />
                    )}
                  </div>
                  {/* Left content */}
                  <div className="flex items-center">{t.label}</div>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 px-1 flex-wrap">
          {/* Card Icon Style */}
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-slate-900 dark:text-white block">
              Card Icon Style
            </Label>
            <div className="flex items-center gap-3">
              {/* Standard */}
              <div
                onClick={() => handleIconVariantChange("standard")}
                className={`p-1 cursor-pointer ${iconVariant === "standard" ? "border-2" : ""} ${iconStyle === "round" ? "rounded-full" : "rounded-xl"}`}
                style={
                  iconVariant === "standard"
                    ? { borderColor: card.brandColor }
                    : {}
                }
              >
                <div
                  className={`w-10 h-10 flex items-center justify-center text-white ${iconStyle === "round" ? "rounded-full" : "rounded-xl"} bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600`}
                >
                  <Instagram className="h-5 w-5" />
                </div>
              </div>

              {/* Custom */}
              <div
                onClick={() => handleIconVariantChange("custom")}
                className={`p-1 cursor-pointer ${
                  iconVariant === "custom" ? "border-2" : ""
                } ${iconStyle === "round" ? "rounded-full" : "rounded-xl"}`}
                style={
                  iconVariant === "custom"
                    ? { borderColor: card.brandColor }
                    : {}
                }
              >
                <div
                  className={`w-10 h-10 flex items-center justify-center text-white ${
                    iconStyle === "round" ? "rounded-full" : "rounded-xl"
                  }`}
                  style={{ background: card.brandColor }}
                >
                  <Instagram className="h-5 w-5" />
                </div>
              </div>

              {/* Custom Negative */}
              <div
                onClick={() => handleIconVariantChange("custom_negative")}
                className={`p-1 cursor-pointer ${
                  iconVariant === "custom_negative" ? "border-2" : ""
                } ${iconStyle === "round" ? "rounded-full" : "rounded-xl"}`}
                style={
                  iconVariant === "custom_negative"
                    ? { borderColor: card.brandColor }
                    : {}
                }
              >
                <div
                  className={`w-10 h-10 flex items-center justify-center bg-white ${
                    iconStyle === "round" ? "rounded-full" : "rounded-xl"
                  }`}
                  style={{
                    border: `1px solid ${card.brandColor}`,
                    color: card.brandColor,
                  }}
                >
                  <Instagram className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Card Icon Type */}
          <div className="space-y-2">
            <Label className="text-[13px] font-bold text-slate-900 dark:text-white block">
              Card Icon Type
            </Label>
            <div className="flex items-center gap-3">
              {/* Circle */}
              <div
                onClick={() => handleIconStyleChange("round")}
                className={`cursor-pointer p-1 ${
                  iconStyle === "round" ? "border-2 rounded-full" : ""
                }`}
                style={
                  iconStyle === "round" ? { borderColor: card.brandColor } : {}
                }
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ background: card.brandColor, opacity: 0.9 }}
                >
                  <Instagram className="h-5 w-5" />
                </div>
              </div>

              {/* Square */}
              <div
                onClick={() => handleIconStyleChange("square")}
                className={`cursor-pointer p-1 ${
                  iconStyle === "square" ? "border-2 rounded-xl" : ""
                }`}
                style={
                  iconStyle === "square" ? { borderColor: card.brandColor } : {}
                }
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ background: card.brandColor, opacity: 0.9 }}
                >
                  <Instagram className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Branding Section */}
      {isFreePlan && (
        <div className="pt-4 space-y-3">
          <div className="px-4">
            <Label className="text-[13px] font-bold text-slate-900 dark:text-white">
              Branding
            </Label>
          </div>
          <button
            onClick={() => setShowWarning(true)}
            className="w-full bg-white dark:bg-slate-900/50 rounded-md shadow-sm border dark:border-slate-800 p-4 flex items-center justify-between hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Upgrade to solo.Pro+</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hide solo. branding from your solo.Pro.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors" />
          </button>
        </div>
      )}

      <UpgradePopup
        open={showWarning}
        onOpenChange={setShowWarning}
      />
    </div>
  );
}
