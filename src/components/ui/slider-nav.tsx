"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Shared navigation for the card-design and card-image sliders.
 *
 * Dots alone are poor UX in both directions: on desktop there is no swipe, so
 * the only target is an 8px dot; on touch the natural swipe does nothing. This
 * adds arrows, swipe and keyboard to whichever slider uses it, so both behave
 * the same way.
 */
export function useSliderNav(
  count: number,
  index: number,
  setIndex: (i: number) => void,
) {
  const startX = React.useRef<number | null>(null);

  const goTo = React.useCallback(
    (i: number) => {
      if (i < 0 || i > count - 1) return;
      setIndex(i);
    },
    [count, setIndex],
  );

  const goPrev = React.useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = React.useCallback(() => goTo(index + 1), [goTo, index]);

  // Swipe. A 40px threshold ignores the small drifts of a tap.
  const handlers = {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0]?.clientX ?? null;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (startX.current === null) return;
      const delta = (e.changedTouches[0]?.clientX ?? 0) - startX.current;
      startX.current = null;
      if (Math.abs(delta) < 40) return;
      if (delta < 0) goNext();
      else goPrev();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    },
    tabIndex: 0,
    role: "group" as const,
  };

  return {
    handlers,
    goPrev,
    goNext,
    canPrev: index > 0,
    canNext: index < count - 1,
  };
}

export function SliderArrows({
  onPrev,
  onNext,
  canPrev,
  canNext,
  label = "slide",
}: {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  label?: string;
}) {
  const base =
    "absolute top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/90 dark:bg-slate-800/90 " +
    "shadow-md backdrop-blur-sm flex items-center justify-center transition-all " +
    "hover:bg-white dark:hover:bg-slate-800 active:scale-95 " +
    "disabled:opacity-0 disabled:pointer-events-none";

  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={`Previous ${label}`}
        className={`${base} left-2`}
      >
        <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label={`Next ${label}`}
        className={`${base} right-2`}
      >
        <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-200" />
      </button>
    </>
  );
}
