import type { BusinessCard } from "@/types/businessCard";

/**
 * Call-to-Action, Direct Ads, Calendly and Google Calendar used to be four
 * modes of ONE field - `appointments.appointmentType` - so only one could be
 * live at a time. Enabling one silently switched off whichever was active.
 *
 * They are now independent: each is "active" when it has its own data, exactly
 * like every other content item (Phone shows when a phone number exists). That
 * needs no new fields and no migration - the data already says what exists.
 *
 * `appointmentType` is still written, by deriveAppointmentType below, because
 * the Marketplace keys off it. See that function for why.
 */

type Appointments = BusinessCard["appointments"];

export const hasCallToAction = (card: BusinessCard): boolean =>
  Boolean(card?.appointments?.ctaUrl?.trim());

export const hasCalendly = (card: BusinessCard): boolean =>
  Boolean(card?.appointments?.calendlyUrl?.trim());

export const hasGoogleCalendar = (card: BusinessCard): boolean =>
  Boolean(card?.appointments?.googleUrl?.trim());

export const hasDirectAds = (card: BusinessCard): boolean => {
  const ad = card?.appointments?.directAds;
  return (
    Boolean(ad?.type) &&
    ad?.type !== "none" &&
    Boolean(ad?.image?.trim())
  );
};

/**
 * The single value still stored on `appointments.appointmentType`.
 *
 * Nothing on the card reads it any more, but four places outside the card
 * filter the Marketplace on `appointmentType === "direct-ads"`:
 *   Marketplace.tsx, MarketplaceDetails.tsx (x2), Cards.tsx,
 *   MarketplaceAdsManager.tsx
 */
export const CTA_APPOINTMENT_LABELS = [
  "Call-to-Action",
  "Direct Ads",
  "Calendly",
  "Google Calendar",
] as const;

export type CtaAppointmentLabel = typeof CTA_APPOINTMENT_LABELS[number];

/**
 * Returns which ONE of the 4 appointment/CTA buttons is active on the card,
 * or null if none is configured.
 */
export function getActiveAppointmentLabel(
  card: BusinessCard,
): CtaAppointmentLabel | null {
  if (!card?.appointments) return null;

  // 1. Check profileContentOrder (first matching entry that has valid data)
  for (const item of card.profileContentOrder ?? []) {
    if (item === "Call-to-Action" && hasCallToAction(card)) return "Call-to-Action";
    if (item === "Direct Ads" && hasDirectAds(card)) return "Direct Ads";
    if (item === "Calendly" && hasCalendly(card)) return "Calendly";
    if (item === "Google Calendar" && hasGoogleCalendar(card)) return "Google Calendar";
  }

  // 2. Check explicit appointmentType
  const type = card.appointments.appointmentType;
  if (type === "call-to-action" && hasCallToAction(card)) {
    return "Call-to-Action";
  }
  if (type === "direct-ads" && hasDirectAds(card)) {
    return "Direct Ads";
  }
  if (type === "booking") {
    if (card.appointments.platform === "google" && hasGoogleCalendar(card)) {
      return "Google Calendar";
    }
    if (card.appointments.platform === "calendly" && hasCalendly(card)) {
      return "Calendly";
    }
    if (hasCalendly(card)) {
      return "Calendly";
    }
    if (hasGoogleCalendar(card)) {
      return "Google Calendar";
    }
  }

  // 3. Fallback: first with valid data
  if (hasCallToAction(card)) return "Call-to-Action";
  if (hasDirectAds(card)) return "Direct Ads";
  if (hasCalendly(card)) return "Calendly";
  if (hasGoogleCalendar(card)) return "Google Calendar";

  return null;
}

export function deriveAppointmentType(
  card: BusinessCard,
): Appointments["appointmentType"] {
  const active = getActiveAppointmentLabel(card);
  if (active === "Direct Ads") return "direct-ads";
  if (active === "Call-to-Action") return "call-to-action";
  return "booking";
}

export function derivePlatform(
  card: BusinessCard,
): Appointments["platform"] | undefined {
  const active = getActiveAppointmentLabel(card);
  if (active === "Google Calendar") return "google";
  if (active === "Calendly") return "calendly";
  if (hasCalendly(card)) return "calendly";
  if (hasGoogleCalendar(card)) return "google";
  return card?.appointments?.platform;
}
