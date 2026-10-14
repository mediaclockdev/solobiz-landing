import type { ComponentType } from "react";
import {
  Calendar,
  FileText,
  Globe,
  Heading,
  Image as ImageIcon,
  Linkedin,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Minus,
  Navigation,
  Phone,
  User,
  Zap,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
/* fa6, not fa. Several of these names exist in BOTH packs as different
   drawings - react-icons/fa's FaSnapchat is the ghost inside a filled disc,
   fa6's is the bare ghost - and the card draws the fa6 set. Importing the
   same names from the other pack is exactly how a glyph drifts while the
   colour next to it stays identical. */
import {
  FaPinterest,
  FaSnapchat,
  FaTiktok,
  FaTwitch,
  FaVimeoV,
  FaXTwitter,
} from "react-icons/fa6";
import {
  SiApplemusic,
  SiBandcamp,
  SiCalendly,
  SiCashapp,
  SiDiscord,
  SiEtsy,
  SiGoogle,
  SiGooglecalendar,
  SiGoogledrive,
  SiItunes,
  SiNotion,
  SiPaypal,
  SiSignal,
  SiSoundcloud,
  SiSpotify,
  SiTelegram,
  SiTidal,
  SiVenmo,
  SiWechat,
  SiWhatsapp,
  SiYelp,
  SiZelle,
} from "react-icons/si";

/**
 * ONE definition of what each content item looks like.
 *
 * The same item is drawn in four places - the Add Content tile grid, the
 * detail form's header chip, the Profile Content row, and the card itself -
 * and each of those used to carry its own hand-written icon and colour. They
 * drifted, exactly as duplicated constants do: Notion was a generic page icon
 * in the form and the real Notion mark on the card, Google Drive was a white
 * chip in the form and a green one on the card, Telegram was #0088cc in the
 * form and #26A5E4 on the card, and Snapchat's white ghost sat on Snapchat
 * yellow in the form, which is very nearly invisible.
 *
 * Everything reads from here now, so an item can only look one way. Where the
 * two sides disagreed the card's choice won, because that is what a card's
 * recipient sees; the exception is Signal, which was a generic speech bubble
 * on both sides and now carries its own mark.
 */
export interface ContentIconMeta {
  Icon: ComponentType<any>;
  /** Chip fill. Ignored when `gradient` is set. */
  bg: string;
  /** Glyph colour. White unless the fill is too light for it. */
  fg?: string;
  /** Full CSS background, for the one item whose brand is a gradient. */
  gradient?: string;
}

export const CONTENT_ICONS: Record<string, ContentIconMeta> = {
  /* ---- Contact ---- */
  Phone: { Icon: Phone, bg: "#22c55e" },
  Email: { Icon: Mail, bg: "#60a5fa" },
  Website: { Icon: Globe, bg: "#2563eb" },
  // Address is the card's one primary address; Location is an extra pin. The
  // different glyph is the only thing telling them apart in the list.
  Address: { Icon: MapPin, bg: "#ef4444" },
  Location: { Icon: Navigation, bg: "#ef4444" },

  /* ---- Messengers (drawn as contact rows, not social chips) ---- */
  WhatsApp: { Icon: SiWhatsapp, bg: "#25D366" },
  Discord: { Icon: SiDiscord, bg: "#5865F2" },
  WeChat: { Icon: SiWechat, bg: "#07C160" },
  Telegram: { Icon: SiTelegram, bg: "#26A5E4" },
  Signal: { Icon: SiSignal, bg: "#3A76F0" },

  /* ---- Social ---- */
  LinkedIn: { Icon: Linkedin, bg: "#2563eb" },
  Instagram: {
    Icon: Instagram,
    bg: "#ec4899",
    gradient:
      "linear-gradient(135deg, rgb(250 204 21), rgb(236 72 153), rgb(147 51 234))",
  },
  X: { Icon: FaXTwitter, bg: "#000000" },
  Facebook: { Icon: Facebook, bg: "#1877F2" },
  YouTube: { Icon: Youtube, bg: "#FF0000" },
  TikTok: { Icon: FaTiktok, bg: "#111827" },
  Pinterest: { Icon: FaPinterest, bg: "#E60023" },
  Vimeo: { Icon: FaVimeoV, bg: "#1AB7EA" },
  // Snapchat yellow takes a black glyph. A white ghost on it is unreadable,
  // which is what the form showed until this table existed.
  Snapchat: { Icon: FaSnapchat, bg: "#FFFC00", fg: "#000000" },
  Twitch: { Icon: FaTwitch, bg: "#9146FF" },

  /* ---- About & CTA ---- */
  "About Me": { Icon: User, bg: "#1e293b" },
  "Custom Title": { Icon: Heading, bg: "#475569" },
  "Call-to-Action": { Icon: Zap, bg: "#f59e0b" },
  "Direct Ads": { Icon: Megaphone, bg: "#dc2626" },
  Calendly: { Icon: SiCalendly, bg: "#006BFF" },
  "Google Calendar": { Icon: SiGooglecalendar, bg: "#4285F4" },

  /* ---- Rich content ---- */
  Divider: { Icon: Minus, bg: "#64748b" },
  Document: { Icon: FileText, bg: "#2563eb" },
  Photos: { Icon: ImageIcon, bg: "#8b5cf6" },

  /* ---- Productivity ---- */
  Notion: { Icon: SiNotion, bg: "#000000" },
  "Google Drive": { Icon: SiGoogledrive, bg: "#0F9D58" },
  // No Booksy mark ships with react-icons, so a calendar on Booksy teal is
  // the same deliberate stand-in on every surface rather than four guesses.
  Booksy: { Icon: Calendar, bg: "#00D7D7" },

  /* ---- Business & reviews ---- */
  "Google Reviews": { Icon: SiGoogle, bg: "#4285F4" },
  Yelp: { Icon: SiYelp, bg: "#FF1A1A" },
  Etsy: { Icon: SiEtsy, bg: "#F1641E" },

  /* ---- Payment ---- */
  Venmo: { Icon: SiVenmo, bg: "#008CFF" },
  CashApp: { Icon: SiCashapp, bg: "#00D64B" },
  Zelle: { Icon: SiZelle, bg: "#6D1ED4" },
  PayPal: { Icon: SiPaypal, bg: "#003087" },

  /* ---- Music ---- */
  Spotify: { Icon: SiSpotify, bg: "#1ED760" },
  SoundCloud: { Icon: SiSoundcloud, bg: "#FF5500" },
  "Apple Music": { Icon: SiApplemusic, bg: "#FA243C" },
  iTunes: { Icon: SiItunes, bg: "#EA4CC0" },
  Tidal: { Icon: SiTidal, bg: "#000000" },
  Bandcamp: { Icon: SiBandcamp, bg: "#629AA9" },
};

/** Anything not in the table: a neutral link chip rather than a blank square. */
export const FALLBACK_CONTENT_ICON: ContentIconMeta = {
  Icon: Globe,
  bg: "#818cf8",
};

/**
 * Resolve by label. A second instance is saved as "Spotify_1712..." and must
 * look like the first, so the suffix is stripped.
 */
export const getContentIcon = (label: string): ContentIconMeta =>
  CONTENT_ICONS[(label || "").split("_")[0]] || FALLBACK_CONTENT_ICON;

/** The chip's inline style, so the one table drives colour everywhere. */
export const contentIconStyle = (meta: ContentIconMeta) => ({
  background: meta.gradient || meta.bg,
  color: meta.fg || "#ffffff",
});

/**
 * Phone is the one item whose icon depends on card data: a number set to text
 * rather than call shows a message bubble. Kept beside the table so the
 * special case cannot be forgotten on one surface.
 */
export const getPhoneIcon = (phoneAction?: string): ContentIconMeta =>
  phoneAction === "text"
    ? { ...CONTENT_ICONS.Phone, Icon: MessageCircle }
    : CONTENT_ICONS.Phone;
