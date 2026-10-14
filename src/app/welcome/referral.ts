"use client";

/**
 * Referral attribution for the campaign funnel.
 *
 * An ad lands on /welcome?ref=CODE, but the code is not needed until the very
 * end of onboarding - three navigations and an account creation later. The URL
 * is long gone by then, so the code is parked the moment the landing page
 * mounts.
 *
 * Both a localStorage entry and a cookie, deliberately: localStorage is what
 * the funnel reads back, and the 30-day cookie survives the storage being
 * cleared and is readable server-side if attribution ever moves there.
 */
export const REF_STORAGE_KEY = "solobiz_ref";
const REF_COOKIE_DAYS = 30;

/**
 * The fallback house code. The main SignUpModal applies the same default when
 * someone signs up with no ?ref=, so a funnel signup is attributed exactly
 * like a direct one rather than becoming an orphan in the referral tree.
 */
export const DEFAULT_REFERRAL_CODE = "ROBPTF2";

export function storeReferralCode(code: string | null | undefined): void {
  const value = (code || "").trim();
  if (!value || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(REF_STORAGE_KEY, value);
  } catch {
    // Private mode, or storage disabled. The cookie below still carries it.
  }

  const expires = new Date(
    Date.now() + REF_COOKIE_DAYS * 24 * 60 * 60 * 1000,
  ).toUTCString();
  document.cookie = `${REF_STORAGE_KEY}=${encodeURIComponent(
    value,
  )}; expires=${expires}; path=/; SameSite=Lax`;
}

/** localStorage first, then the cookie, then the house code. */
export function readReferralCode(): string {
  if (typeof window === "undefined") return DEFAULT_REFERRAL_CODE;

  try {
    const stored = window.localStorage.getItem(REF_STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
  } catch {
    // fall through to the cookie
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${REF_STORAGE_KEY}=([^;]*)`),
  );
  if (match?.[1]) {
    const value = decodeURIComponent(match[1]).trim();
    if (value) return value;
  }

  return DEFAULT_REFERRAL_CODE;
}
