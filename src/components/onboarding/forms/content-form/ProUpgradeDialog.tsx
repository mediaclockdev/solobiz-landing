"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

/**
 * Centred "Upgrade to Pro" confirm dialog that rises from the bottom.
 *
 * Built straight on the Radix primitive rather than on @/components/ui/dialog:
 * that DialogContent is a true bottom sheet (`bottom-0`, rounded-t only) and
 * always renders its own close button, none of which this design wants.
 *
 * Centred with `inset-0` + `m-auto` rather than the usual
 * `left-1/2 top-1/2 -translate-1/2`, because tailwindcss-animate's enter/exit
 * keyframes SET `transform: translate3d(...)` and would overwrite a centring
 * translate mid-animation. Margin-auto centring leaves `transform` free, so
 * `slide-in-from-bottom-*` is a plain upward glide into the middle of the
 * screen with nothing to compensate for.
 *
 * Dismissal is Cancel, Escape, or a click outside - there is no X, matching
 * the design.
 */
export function ProUpgradeDialog({
  open,
  onOpenChange,
  featureName,
  onUpgrade,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Named in the body copy when given: "Direct Ads is a Pro feature." */
  featureName?: string;
  /** Defaults to sending the user to /pricing. */
  onUpgrade?: () => void;
}) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }
    window.location.href = "/pricing";
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            // inset-0 + m-auto + h-fit centres on both axes without a transform.
            "fixed inset-0 z-50 m-auto h-fit",
            // Never wider than the screen less a 16px gutter, never taller than
            // the viewport; scrolls internally if the copy ever grows.
            "w-[calc(100%-2rem)] max-w-[440px] max-h-[calc(100vh-2rem)] overflow-y-auto",
            "rounded-[20px] bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl",
            "border border-slate-100 dark:border-slate-800 focus:outline-none",
            // Rises into place, drops back out. `!` because `animate-in` also
            // declares animation-duration and is emitted after `duration-*`,
            // so without it the plugin's 150ms default wins and the rise is
            // too quick to read as motion.
            "!duration-300",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-8",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-8",
          )}
        >
          <DialogPrimitive.Title className="text-center text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Upgrade to Pro
          </DialogPrimitive.Title>

          <DialogPrimitive.Description className="mt-3 sm:mt-4 text-center text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">
              {featureName ? `${featureName} is a Pro feature` : "Pro feature"}
            </span>
            . Upgrade your plan to unlock unlimited customization.
          </DialogPrimitive.Description>

          {/* Stacked on a narrow phone, side by side from 400px up. Buttons go
              full width when stacked so neither looks like the odd one out. */}
          <div className="mt-6 sm:mt-8 flex flex-col-reverse min-[400px]:flex-row items-stretch min-[400px]:items-center min-[400px]:justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={cn(
                "h-12 rounded-xl px-6 text-base font-semibold transition-colors",
                "min-[400px]:min-w-[120px]",
                "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpgrade}
              className={cn(
                "h-12 rounded-xl px-6 text-base font-semibold text-white transition-transform",
                "min-[400px]:min-w-[160px]",
                "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200",
                "dark:shadow-none",
              )}
            >
              Upgrade Now
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
