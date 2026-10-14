/**
 * Ref-counted body scroll lock.
 *
 * Several overlays (permission modal, image editor, template picker, pro
 * warnings) lock page scroll while they are open. Doing that ad-hoc caused two
 * bugs:
 *
 *   1. A component that unmounted while still "open" never removed the lock,
 *      leaving `overflow-hidden` on <body> so the page could not be scrolled
 *      at all until a full reload.
 *   2. Some overlays used `document.body.style.overflow` while others used the
 *      `overflow-hidden` class. An inline style always beats a class, so an
 *      overlay closing would clear a lock another overlay still needed - and
 *      merely mounting one of the inline-style overlays wrote `overflow: auto`
 *      onto <body>, silently unlocking scroll.
 *
 * Counting the locks means the last overlay to close is the one that restores
 * scrolling, and everyone uses the same mechanism.
 */
let lockCount = 0;

export function lockBodyScroll(): void {
  if (typeof document === "undefined") return;
  lockCount += 1;
  document.body.classList.add("overflow-hidden");
}

export function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.classList.remove("overflow-hidden");
    // Clear any inline lock left behind by the older approach.
    if (document.body.style.overflow) {
      document.body.style.removeProperty("overflow");
    }
  }
}

/**
 * Drop-in for `useEffect`: locks while `active`, always releases on cleanup.
 */
export function applyBodyScrollLock(active: boolean): () => void {
  if (!active) return () => {};
  lockBodyScroll();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    unlockBodyScroll();
  };
}
