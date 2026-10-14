"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Check, Plus, XIcon } from "lucide-react";

export function UpgradePopup({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-[500px] p-0 border-none bg-[#E7E9FF] dark:bg-slate-900 rounded-t-[30px] overflow-hidden shadow-2xl [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Upgrade to solo.Pro+</SheetTitle>
        <div className="relative p-6 pb-4">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
          >
            <XIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>

          <div className="space-y-1 pr-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Upgrade to solo.Pro+
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
              7 days free to try the advanced networking tool kit
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              onClick={() => setBilling("monthly")}
              className={cn(
                "relative flex flex-col items-start p-4 rounded-[20px] border-2 transition-all text-left",
                billing === "monthly"
                  ? "bg-white dark:bg-slate-800 border-indigo-500 shadow-md"
                  : "bg-white/40 dark:bg-slate-800/40 border-transparent",
              )}
            >
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Monthly
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                $12.25/month
              </span>
              <span className="text-[12px] text-slate-400 mt-1">
                Billed monthly
              </span>
              <div
                className={cn(
                  "absolute bottom-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  billing === "monthly"
                    ? "bg-indigo-500 border-indigo-500"
                    : "border-slate-200 dark:border-slate-700",
                )}
              >
                {billing === "monthly" && (
                  <Check className="w-3 h-3 text-white stroke-[3px]" />
                )}
              </div>
            </button>

            <button
              onClick={() => setBilling("annual")}
              className={cn(
                "relative flex flex-col items-start p-4 rounded-[20px] border-2 transition-all text-left",
                billing === "annual"
                  ? "bg-white dark:bg-slate-800 border-indigo-500 shadow-md"
                  : "bg-white/40 dark:bg-slate-800/40 border-transparent",
              )}
            >
              <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-sm">
                SAVE 20%
              </div>
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Annual
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                $9.80/month
              </span>
              <span className="text-[12px] text-slate-400 mt-1">
                <del>$147</del> $117.60/year
              </span>
              <div
                className={cn(
                  "absolute bottom-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  billing === "annual"
                    ? "bg-indigo-500 border-indigo-500"
                    : "border-slate-200 dark:border-slate-700",
                )}
              >
                {billing === "annual" && (
                  <Check className="w-3 h-3 text-white stroke-[3px]" />
                )}
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-t-[30px] p-6 pt-8 space-y-3">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Checkbox id="dont-ask" className="rounded-sm border-slate-200" />
              <label
                htmlFor="dont-ask"
                className="text-sm font-bold text-slate-400"
              >
                Don't ask me again
              </label>
            </div>

            <Button onClick={() => window.location.href = "/pricing"} className="w-full h-14 rounded-[20px] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 group transition-transform active:scale-95">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Plus className="w-4 h-4 text-white stroke-[4px]" />
              </div>
              Start Free Trial
            </Button>

            <div className="text-center space-y-1">
              <p className="text-[12px] font-bold text-slate-400">
                Subscribe for {billing === "annual" ? <><del>$147</del> $117.60/year</> : "$12.25/month"}
              </p>
              <p className="text-[12px] text-slate-400">
                Cancel anytime, plan renews automatically
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
