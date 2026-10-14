import React from "react";
import { Link as LinkIcon, ArrowRight, Instagram, Plus } from "lucide-react";

interface TopActionButtonsProps {
  urlName: string;
  cardId?: string;
  accessoriesCount: number;
}

export function TopActionButtons({ urlName, cardId, accessoriesCount }: TopActionButtonsProps) {
  return (
    <div className="flex flex-col space-y-3 mb-6">
      <a 
        suppressHydrationWarning
        href={`/${urlName}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border dark:border-slate-700 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-full">
            <LinkIcon size={16} className="text-slate-600 dark:text-slate-300" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-white text-sm">solo.link</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <ArrowRight size={16} className="text-slate-400" />
        </div>
      </a>

      <a 
        href="/dashboard/accessories" 
        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border dark:border-slate-700 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-full">
            <Instagram size={16} className="text-slate-600 dark:text-slate-300" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-white text-sm">solo.accessories</span>
        </div>
        <div className="flex items-center gap-2">
          {accessoriesCount > 0 ? (
            <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-slate-700 dark:text-slate-200">
              {accessoriesCount}
            </span>
          ) : (
            <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Plus size={12} /> Add
            </span>
          )}
        </div>
      </a>
    </div>
  );
}
