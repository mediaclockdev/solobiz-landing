export const BASE_URLS: Record<string, string> = {
  discord: "https://discordapp.com/users/",
  linkedin: "https://linkedin.com/in/",
  facebook: "https://facebook.com/",
  instagram: "https://instagram.com/",
  signal: "https://signal.me/#p/",
  telegram: "https://t.me/",
  twitter: "https://x.com/",
  wechat: "https://wechat.com/",
  whatsapp: "https://wa.me/",
  youtube: "https://youtube.com/channel/",
  tiktok: "https://tiktok.com/@",
  vimeo: "https://vimeo.com/",
  snapchat: "https://snapchat.com/add/",
  twitch: "https://twitch.tv/",
  pinterest: "https://pinterest.com/",
};

export const PREMIUM_ITEMS = [
  "Direct Ads",
  "Call-to-Action",
  "Photos",
  "Custom Title",
  "Document",
] as const;

export const PHONE_LENGTH_RULES: Record<string, number> = {
  au: 9,
  ca: 10,
  gb: 10,
  in: 10,
  us: 10,
};

export const SOCIAL_DETAIL_FIELD_MAP: Record<string, string> = {
  Facebook: "facebook",
  Discord: "discord",
  Instagram: "instagram",
  LinkedIn: "linkedin",
  Signal: "signal",
  Telegram: "telegram",
  TikTok: "tiktok",
  WeChat: "wechat",
  WhatsApp: "whatsapp",
  X: "twitter",
  YouTube: "youtube",
  Vimeo: "vimeo",
  Snapchat: "snapchat",
  Twitch: "twitch",
  Pinterest: "pinterest",
};

/**
 * Every label that can exist as a content tile / profile-content row.
 *
 * profileContentOrder is what drives both the "Profile Content" list and the
 * count badge on each Add Content tile. It is saved on the card, but nothing
 * guarantees it stays in step with the card's actual data - another form can
 * write a value (SocialForm writes card.social.* directly), and older saves
 * predate labels that were added later. Reconciling the saved order against
 * this list on load means an item that HAS a value always shows up and always
 * gets its badge, whatever wrote it.
 *
 * "Divider" is deliberately absent: it carries no value, so it can only ever be
 * added by hand and must never be re-derived from card data.
 */
export const CONTENT_LABELS = [
  // Contact info
  "Phone",
  "Email",
  "Website",
  "Address",
  "Location",
  "WhatsApp",
  "Discord",
  "WeChat",
  "Telegram",
  "Signal",
  // About & CTA
  "About Me",
  "Custom Title",
  "Call-to-Action",
  "Direct Ads",
  // Social links
  "LinkedIn",
  "Instagram",
  "X",
  "Facebook",
  "YouTube",
  "TikTok",
  "Pinterest",
  "Snapchat",
  "Vimeo",
  "Twitch",
  // Scheduling & files
  "Calendly",
  "Google Calendar",
  "Google Drive",
  "Document",
  "Photos",
  "Notion",
  // Payment links
  "PayPal",
  "Venmo",
  "CashApp",
  "Zelle",
  // Music links
  "Spotify",
  "Apple Music",
  "SoundCloud",
  "Tidal",
  "iTunes",
  "Bandcamp",
  // Business & reviews
  "Google Reviews",
  "Yelp",
  "Etsy",
  "Booksy",
] as const;

/**
 * The platforms the CARD actually renders in its social row.
 *
 * BusinessCardPreview's getActiveSocials() builds its socialMap from exactly
 * this list and slices it to TRADITIONAL_SOCIAL_LIMIT, so this is what the
 * traditional template's "max 4" is really counting.
 *
 * WhatsApp, Discord, WeChat, Telegram and Signal are NOT here. They live in
 * the Contact Info group, and the card draws them as contact rows (icon,
 * value, label) next to Email and Website - not as social chips. Listing them
 * here would let a messenger consume one of the template's four social slots.
 */
export const CARD_SOCIAL_LABELS = [
  "LinkedIn",
  "X",
  "Facebook",
  "YouTube",
  "Instagram",
  "TikTok",
  "Pinterest",
  "Vimeo",
  "Snapchat",
  "Twitch",
] as const;

/** Social rows the traditional template shows before it stops. */
export const TRADITIONAL_SOCIAL_LIMIT = 4;

/**
 * The card.social FIELD names behind CARD_SOCIAL_LABELS ("X" -> "twitter").
 *
 * The social cap has to be applied in two shapes: by label, for the Add
 * Content tiles, and by field, for the link input's own lock. Deriving both
 * from one list keeps them in agreement - counting by Object.keys(BASE_URLS)
 * instead pulled in the five messengers and locked the input over platforms
 * that never reach the card's social row.
 */
export const CARD_SOCIAL_FIELDS: string[] = CARD_SOCIAL_LABELS.map(
  (label) => SOCIAL_DETAIL_FIELD_MAP[label],
);

/**
 * Fixed top items (CTA & Appointments). Rigidly ordered and not draggable.
 */
export const TOP_FIXED_LABELS = [
  "Call-to-Action",
  "Direct Ads",
  "Calendly",
  "Google Calendar",
] as const;

/**
 * Fixed bottom items (Divider, About Me, Rich Content). Rigidly ordered and not draggable.
 */
export const BOTTOM_FIXED_LABELS = [
  "Divider",
  "About Me",
  "Custom Title",
  "Photos",
  "Document",
] as const;

/**
 * Normalizes profile content order so that:
 * 1. Top items (CTA/Appointments) are always sorted in TOP_FIXED_LABELS order at the top.
 * 2. Bottom items (Divider, About Me, Custom Title, Photos, Document) are always sorted in BOTTOM_FIXED_LABELS order at the bottom.
 * 3. Middle items (Phone, Email, socials, messengers, custom links) maintain their relative draggable order between top and bottom.
 */
export const normalizeProfileContentOrder = (order: string[]): string[] => {
  const topItems: string[] = [];
  const middleItems: string[] = [];
  const bottomItems: string[] = [];

  for (const item of order) {
    if (!item) continue;
    const base = item.split("_")[0];
    if ((TOP_FIXED_LABELS as readonly string[]).includes(base)) {
      if (!topItems.includes(item)) {
        topItems.push(item);
      }
    } else if ((BOTTOM_FIXED_LABELS as readonly string[]).includes(base)) {
      if (!bottomItems.includes(item)) {
        bottomItems.push(item);
      }
    } else {
      if (!middleItems.includes(item)) {
        middleItems.push(item);
      }
    }
  }

  topItems.sort((a, b) => {
    const baseA = a.split("_")[0];
    const baseB = b.split("_")[0];
    return (
      (TOP_FIXED_LABELS as readonly string[]).indexOf(baseA) -
      (TOP_FIXED_LABELS as readonly string[]).indexOf(baseB)
    );
  });

  bottomItems.sort((a, b) => {
    const baseA = a.split("_")[0];
    const baseB = b.split("_")[0];
    return (
      (BOTTOM_FIXED_LABELS as readonly string[]).indexOf(baseA) -
      (BOTTOM_FIXED_LABELS as readonly string[]).indexOf(baseB)
    );
  });

  return [...topItems, ...middleItems, ...bottomItems];
};

