"use client";
import React, { useContext, useEffect, useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardDataContext } from "@/contexts/CardContext";
import { useAuth } from "@/contexts/AuthContext";
import { Crown, Lock, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import { differenceInDays } from "date-fns";
import UpgradeModal from "@/components/UpgradeModal";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

import dynamic from "next/dynamic";
import ClassicEditorBuild from "@ckeditor/ckeditor5-build-classic";
import { applyBodyScrollLock } from "@/utils/scrollLock";

const CKEditor = dynamic<{
  data: string;
  onChange: (event: any, editor: any) => void;
}>(
  async () => {
    const { CKEditor } = await import("@ckeditor/ckeditor5-react");
    const ClassicEditor = (await import("@ckeditor/ckeditor5-build-classic"))
      .default;
    //@ts-ignore
    return (props) => <CKEditor {...props} editor={ClassicEditor} />;
  },
  { ssr: false },
);

export function AboutForm({
  card,
  onUpdate,
  selectedTab = "local",
  onEditingChange,
}: FormComponentProps) {
  const { cardData, setCardData } = useContext(CardDataContext);
  const { isAuthenticated, user } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempCard, setTempCard] = useState(card);
  const [data, setData] = useState(card.about.bio || "");
  const { sectionType = "aboutMe", customSectionTitle = "" } =
    tempCard.about || {};

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

  useEffect(() => applyBodyScrollLock(showWarning), [showWarning]);

  useEffect(() => {
    if (isProLocked) {
      handleSectionTypeChange("aboutMe");
    }
  }, [isProLocked]);

  const handleInputChange = (field: string, value: string) => {
    setTempCard((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        [field]: value,
      },
    }));
  };

  const handleSectionTypeChange = (newType) => {
    if (newType === "custom" && isProLocked && selectedTab != "local") {
      setShowWarning(true);
      return;
    }
    setTempCard((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        sectionType: newType,
      },
    }));
  };

  const handleCustomTitleChange = (e) => {
    setTempCard((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        customSectionTitle: e.target.value,
      },
    }));
  };

  const handleAboutChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.slice(0, 250);
    setTempCard((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        bio: text,
      },
    }));
  };

  const [trialDays, setTrialDays] = useState<number | null>(null);

  const canShowCustomSection = () => {
    if (!user) return false;
    if (user?.planType !== "free") return true;
    if (!user?.createdAt) return false;
    if (trialDays === null) return false; // ⏳ still loading

    let createdDate: Date;
    if (typeof user?.createdAt === "string") {
      createdDate = new Date(user?.createdAt);
    } else if ("seconds" in user?.createdAt) {
      //@ts-ignore
      createdDate = new Date(user?.createdAt?.seconds * 1000);
    } else {
      return false;
    }

    const today = new Date();
    const daysSinceCreated = differenceInDays(today, createdDate);
    return daysSinceCreated <= trialDays;
  };

  const charCount = card?.about?.bio?.length ?? 0;

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const fetchTrialDays = async () => {
      try {
        if (user) {
          const userRef = doc(db, "users", user?.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) throw new Error("User not found");
          const userData = userSnap.data() as any;
          if (userData) {
            const period = Number(userData.freeTrialPeriod);
            setTrialDays(!isNaN(period) ? period : 0);
          }
        } else {
          const settingsRef = doc(db, "settings", "PricingRequirement");
          const snap = await getDoc(settingsRef);
          if (snap.exists()) {
            const data = snap.data();
            const period = Number(data.freeTrialPeriod);
            setTrialDays(!isNaN(period) ? period : 0);
          } else {
            setTrialDays(0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch trial days:", err);
        setTrialDays(0);
      }
    };

    fetchTrialDays();

    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, [user]);

  function htmlToText(html: string): string {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  }

  const openEdit = () => {
    setTempCard(card);
    setData(card.about.bio || "");
    setIsEditing(true);
    if (onEditingChange) onEditingChange(true);
  };

  const handleSave = () => {
    onUpdate(tempCard);
    setCardData((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        sectionType: tempCard.about.sectionType,
        customSectionTitle: tempCard.about.customSectionTitle,
      },
    }));
    setIsEditing(false);
    if (onEditingChange) onEditingChange(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (onEditingChange) onEditingChange(false);
  };
  return (
    <div className="space-y-6">
      {/* SUMMARY VIEW */}
      <div className="relative bg-white rounded-[30px] p-6 shadow-sm border">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            {card.profilePhoto ? (
              <img
                src={card.profilePhoto}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                IMG
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              {card.profile.firstName || "First"}{" "}
              {card.profile.lastName || "Last"}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {card.profile.title || "Job Title"}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 min-h-[100px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            BIO
          </span>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {htmlToText(card.about.bio) || "No bio added yet."}
          </p>
        </div>

        {/* Floating Edit Button */}
        <button
          onClick={openEdit}
          className="absolute -bottom-4 -right-2 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-transform active:scale-95 z-10"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </div>

      {/* OVERLAY */}
      {isEditing && (
        <div
          className="fixed inset-0 bg-black/40 z-[9998] transition-opacity"
          onClick={handleCancel}
        />
      )}

      {/* SLIDE-UP DRAWER (EDIT FORM) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[9999] bg-white rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out flex flex-col h-[85vh] h-[85dvh]",
          isEditing ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Edit Bio</h2>
          <button
            onClick={handleCancel}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* First & Last Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">
                First Name
              </Label>
              <Input
                value={tempCard.profile.firstName}
                onChange={(e) =>
                  setTempCard({
                    ...tempCard,
                    profile: { ...tempCard.profile, firstName: e.target.value },
                  })
                }
                placeholder="First Name"
                className="rounded-md bg-slate-50 border-transparent focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">
                Last Name
              </Label>
              <Input
                value={tempCard.profile.lastName}
                onChange={(e) =>
                  setTempCard({
                    ...tempCard,
                    profile: { ...tempCard.profile, lastName: e.target.value },
                  })
                }
                placeholder="Last Name"
                className="rounded-md bg-slate-50 border-transparent focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            {/* Section Type */}
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">
                Section Type
              </label>
              <div className="flex flex-wrap items-center gap-4">
                {/* About Me Radio */}
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="sectionType"
                    className="mr-1"
                    checked={sectionType === "aboutMe"}
                    onChange={() => handleSectionTypeChange("aboutMe")}
                  />
                  <span className="text-sm text-gray-700">About Me</span>
                </label>

                {/* Custom Section Title Radio */}

                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="sectionType"
                    className="mr-1"
                    checked={sectionType === "custom"}
                    onChange={() => handleSectionTypeChange("custom")}
                  />
                  <span className="text-sm text-gray-700">
                    Custom Section Title
                  </span>
                  {isProLocked && selectedTab != "local" ? (
                    <Lock size={14} className="ml-1 text-yellow-500" />
                  ) : (
                    <>
                      <Crown size={14} className="ml-1 text-yellow-500" />
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* If custom section title is selected, show the text input */}
          {sectionType === "custom" && (
            <div>
              <input
                disabled={isProLocked}
                type="text"
                placeholder="Enter custom section title"
                value={tempCard.about.customSectionTitle}
                onChange={handleCustomTitleChange}
                className="w-full p-3 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm text-gray-700 font-medium mb-3">
              Short Bio, Company Description, Education, etc.{" "}
              <span className="text-gray-600">{charCount}/250</span>
            </label>
            {sectionType !== "custom" && (
              <textarea
                rows={5}
                value={htmlToText(tempCard.about.bio)}
                onChange={(e) => handleAboutChange(e)}
                maxLength={250}
                placeholder="Share your professional background, expertise, or company mission. What makes you or your business unique?"
                className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none bg-card"
              />
            )}

            {sectionType === "custom" && isClient && (
              <CKEditor
                //@ts-ignore
                disabled={isProLocked}
                data={data}
                onChange={(event, editor) => {
                  const html = editor.getData();
                  setData(html);
                  setTempCard((prev) => ({
                    ...prev,
                    about: { ...prev.about, bio: html },
                  }));
                }}
              />
            )}
            <p className="text-xs text-slate-500">
              This will appear on your business card to help people understand
              what you do.
            </p>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="border-t bg-slate-100 p-4 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-full text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2.5 rounded-full text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-transform active:scale-95"
          >
            Save
          </button>
        </div>
      </div>
      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onShowSignUp={() => {
          setShowSignIn(false);
          setIsSignUpOpen(true);
        }}
        message="This is a premium feature. Please log in to access Custom Section Title."
      />

      {/* Sign Up Modal */}
      {isSignUpOpen && (
        <SignUpModal
          isOpen={isSignUpOpen}
          onClose={() => setIsSignUpOpen(false)}
          onShowSignIn={() => {
            setIsSignUpOpen(false);
            setShowSignIn(true);
          }}
        />
      )}
      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}
