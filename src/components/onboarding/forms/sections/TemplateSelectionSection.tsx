"use client";
import React, { useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { TemplateSelectionModal } from "../../TemplateSelectionModal";

export function TemplateSelectionSection({
  card,
  onUpdate,
  isEditMode,
}: FormComponentProps) {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const isDisabled = !isEditMode;

  return (
    <TooltipProvider>
      {/* Change Template Button */}

      <div className="flex items-center justify-between">
        {isDisabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-3 lg:px-6 rounded-md border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-not-allowed text-xs lg:text-sm"
                onClick={() => !isDisabled && setIsTemplateModalOpen(true)}
              >
                Change Template
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Available when editing a card only.</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            className="h-10 px-3 lg:px-6 rounded-md border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors text-xs lg:text-sm"
            onClick={() => setIsTemplateModalOpen(true)}
          >
            Change Template
          </Button>
        )}
        <span className="text-xs font-bold text-slate-400">
          {card.templateType
            ? `${card.templateType.charAt(0).toUpperCase() + card.templateType.slice(1)}`
            : "Template"}{" "}
          |{" "}
          {card.cardLayout
            ? `${card.cardLayout
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}`
            : "Portrait"}
        </span>
      </div>

      <TemplateSelectionModal
        card={card}
        onUpdate={onUpdate}
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </TooltipProvider>
  );
}
