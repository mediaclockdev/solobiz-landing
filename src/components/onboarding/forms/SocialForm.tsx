"use client";
import React, { useEffect, useState } from "react";
import {
  FormComponentProps,
} from "@/types/businessCard";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import {
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react";
import {
  getContentIcon,
} from "@/components/onboarding/forms/content-form/contentIcons";
import {
  useAuth,
} from "@/contexts/AuthContext";
import UpgradeModal from "@/components/UpgradeModal";
export function SocialForm({ card, onUpdate }: FormComponentProps) {
  const [warning, setWarning] = useState("");
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { user } = useAuth();
  const baseUrls: Record<string, string> = {
    linkedin: "https://linkedin.com/in/",
    twitter: "https://twitter.com/",
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    youtube: "https://youtube.com/channel/",
    tiktok: "https://tiktok.com/",
    pinterest: "https://pinterest.com/",
    vimeo: "https://vimeo.com/",
    snapchat: "https://snapchat.com/add/",
    twitch: "https://twitch.tv/",
  };

  function parseCreatedAt(input: any) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  const countActive = () =>
    Object.keys(baseUrls).reduce((count, key) => {
      const value = card.social[key as keyof typeof card.social];
      const prefix = baseUrls[key];
      return value && value.trim() !== "" && value !== prefix
        ? count + 1
        : count;
    }, 0);

  const isLocked = (platform: string) => {
    const activeCount = countActive();
    const value = card.social[platform as keyof typeof card.social] || "";
    const prefix = baseUrls[platform];
    const isFieldActive = value && value !== prefix;
    return activeCount >= 4 && !isFieldActive;
  };

  const handleInputChange = (field: string, value: string) => {
    if (isLocked(field)) {
      setWarning("Maximum of 4 social media links allowed");
      return;
    }
    setWarning("");
    const prefix = baseUrls[field];
    let fullUrl = prefix ?? "";
    // return;
    const defaultValue = value + "/";
    if (value.length > 0) {
      if (defaultValue !== prefix) {
        // if(value.includes(prefix))
        let cleanValue = value.replace(prefix, "");
        console.log("ccc", cleanValue);
        if (cleanValue?.includes(field)) {
          fullUrl = cleanValue ? cleanValue : "";
          console.log("fff=", fullUrl);
        } else {
          fullUrl = cleanValue ? prefix + cleanValue : "";
        }
      }
    }

    const updatedCard = {
      ...card,
      social: {
        ...card.social,
        [field]: fullUrl,
      },
    };
    onUpdate(updatedCard);
  };

  const handleFocus = (field: string) => {
    const prefix = baseUrls[field];
    const currentValue = card.social[field as keyof typeof card.social] || "";

    if (isLocked(field)) {
      setWarning("Maximum of 4 social media links allowed");
      return;
    } else {
      setWarning("");
    }

    if (!currentValue) {
      onUpdate({
        ...card,
        social: {
          ...card.social,
          [field]: prefix,
        },
      });
    }
  };

  const handleBlur = (field: string) => {
    const prefix = baseUrls[field];
    const currentValue = card.social[field as keyof typeof card.social] || "";
    if (currentValue === prefix) {
      onUpdate({
        ...card,
        social: {
          ...card.social,
          [field]: "",
        },
      });
    }
  };

  /* Key, label and placeholder only - the icon comes from the shared
     CONTENT_ICONS table, the same one the Add Content tiles, the Profile
     Content rows and the card read. This list held its own icons and had
     drifted furthest of all: Twitter/X still showed the retired bird. */
  const socialPlatforms = [
    {
      key: "linkedin",
      label: "LinkedIn",
      placeholder: "https://linkedin.com/in/your-profile",
    },
    {
      key: "twitter",
      label: "Twitter/X",
      placeholder: "https://twitter.com/your-profile",
    },
    {
      key: "facebook",
      label: "Facebook",
      placeholder: "https://facebook.com/your-profile",
    },
    {
      key: "instagram",
      label: "Instagram",
      placeholder: "https://instagram.com/your-profile",
    },
    {
      key: "youtube",
      label: "YouTube",
      placeholder: "https://youtube.com/channel/your-channel-id",
    },
    {
      key: "tiktok",
      label: "TikTok",
      placeholder: "https://tiktok.com/@your-username",
    },
    {
      key: "pinterest",
      label: "Pinterest",
      placeholder: "https://pinterest.com/your-profile",
    },
    {
      key: "vimeo",
      label: "Vimeo",
      placeholder: "https://vimeo.com/your-profile",
    },
    {
      key: "snapchat",
      label: "Snapchat",
      placeholder: "https://snapchat.com/add/your-username",
    },
    {
      key: "twitch",
      label: "Twitch",
      placeholder: "https://twitch.tv/your-channel",
    },
  ];

  useEffect(() => {
    if (!user) return;

    const isFree = user?.planType === "free";
    setIsFreePlan(isFree);

    const createdAt = parseCreatedAt(user?.createdAt);
    const trialEnd = new Date(
      createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000
    );
    const trialActive = new Date() <= trialEnd;
    setIsTrialActive(trialActive);
  }, [user]);
  const isProLocked = isFreePlan && !isTrialActive;
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <p className="text-sm text-muted-foreground">
          Add your social media profiles to help people connect with you.
        </p>
        <div className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap w-fit ${countActive() >= 4 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-secondary text-secondary-foreground"}`}>
          {countActive()} / 4 Selected
        </div>
      </div>

      <div className="space-y-4">
        {warning && (
          <div className="p-3 bg-red-100 text-red-700 rounded">{warning}</div>
        )}

        {socialPlatforms.map(({ key, label, placeholder }) => {
          // "Twitter/X" is this list's own spelling of the card's "X".
          const { Icon } = getContentIcon(label === "Twitter/X" ? "X" : label);
          return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Label>

            <Input
              id={key}
              type="text"
              placeholder={placeholder}
              value={card.social[key as keyof typeof card.social] || ""}
              onFocus={() => handleFocus(key)}
              onBlur={() => handleBlur(key)}
              onChange={(e) => handleInputChange(key, e.target.value)}
              disabled={isLocked(key)}
              title={isLocked(key) ? "Maximum of 4 social media links allowed" : ""}
            />
          </div>
          );
        })}
      </div>
      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}
