"use client";
import React, { useEffect, useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Button } from "@/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { XIcon } from "lucide-react";
import { applyBodyScrollLock } from "@/utils/scrollLock";

interface TemplateSelectionModalProps extends FormComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

type TemplateType = "classic" | "modern" | "traditional";

export function TemplateSelectionModal({
  card,
  onUpdate,
  isOpen,
  onClose,
}: TemplateSelectionModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(
    card.templateType || "classic",
  );
  const [storedClassicTemplateImage, setStoredclassicTemplateImage] =
    useState<string>();

  const [storedTraditionalTemplateImage, setStoredTraditionalTemplateImage] =
    useState<string | null>(null);

  const [storedModernTemplateImage, setStoredModernTemplateImage] = useState<
    string | null
  >(null);

  const templates = [
    {
      id: "traditional" as TemplateType,
      name: "Traditional",
      description: "Clean and professional design",
    },
    {
      id: "classic" as TemplateType,
      name: "Classic",
      description: "Timeless and elegant layout",
    },
    {
      id: "modern" as TemplateType,
      name: "Modern",
      description: "Timeless and elegant layout",
    },
  ];

  const handleApply = () => {
    // Reset card layout to default when template changes
    const defaultLayout =
      selectedTemplate === "classic" ? "standard" : "portrait";
    onUpdate({
      ...card,
      templateType: selectedTemplate,
      cardLayout: defaultLayout,
    });
    onClose();
  };

  const CARD_DOC_ID = "mainCard";

  const fetchImage = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Fetch classic template URL
        if (data.classicTemplate) {
          setStoredclassicTemplateImage(data?.classicTemplate?.url);
        }

        // Fetch traditional template URL
        if (data.traditionalTemplate) {
          setStoredTraditionalTemplateImage(data?.traditionalTemplate?.url);
        }

        if (data.modernTemplate) {
          setStoredModernTemplateImage(data?.modernTemplate?.url);
        }
      } else {
        setStoredclassicTemplateImage(null);
        setStoredTraditionalTemplateImage(null);
        setStoredModernTemplateImage(null);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
  };

  useEffect(() => {
    fetchImage();
  }, []);

  const templateImages = {
    classic:
      storedClassicTemplateImage ||
      "/lovable-uploads/74b13cbe-0d2e-4997-8470-12fb69697b68.png",
    modern: storedModernTemplateImage || "/lovable-uploads/modern-tube.png",
    traditional:
      storedTraditionalTemplateImage ||
      "/lovable-uploads/4d306865-6c0d-4bd6-a6a0-042a7bdae383.png",
  };

  useEffect(() => applyBodyScrollLock(isOpen), [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`!mt-0 fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 z-[100] ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Bottom Sheet */}
      <div
        className={`z-[100] fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
        bg-[#f8f9fb] dark:bg-transparent dark:border dark:border-slate-800 rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]
        transition-all duration-500 ease-in-out
        ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Choose Template
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <XIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-start">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`rounded-2xl border-2 transition-all text-center flex flex-col items-center h-full overflow-hidden bg-white dark:bg-slate-900 shadow-sm ${
                  selectedTemplate === template.id
                    ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10"
                    : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                }`}
              >
                <div className="w-full relative pt-[150%] bg-slate-50 dark:bg-slate-800 p-2">
                  <img
                    src={templateImages[template.id]}
                    alt={`${template.name} template preview`}
                    className="absolute inset-0 w-full h-full object-contain object-top p-2"
                  />
                </div>

                <div className="p-2 sm:p-4 w-full border-t border-slate-50 dark:border-slate-800">
                  <h3 className="font-semibold text-[10px] sm:text-sm text-slate-800 dark:text-slate-200 truncate">{template.name}</h3>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white dark:bg-transparent font-semibold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
