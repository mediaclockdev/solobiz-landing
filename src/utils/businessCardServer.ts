// utils/businessCardServer.ts
import { BusinessCard } from "@/types/businessCard";

/**
 * Server-safe vCard generator.
 * Returns a string in vCard 3.0 format.
 */
export function generateVCardServer(card: BusinessCard): string {
  const fullName = `${card.profile.firstName} ${card.profile.lastName}`;
  const email = card.business.email || "";
  const phone = card.business.phone || "";
  const company = card.profile.company || "";
  const title = card.profile.title || "";
  const website = card.business.website || "";
  const address = card.business.address
    ? `${card.business.address.street || ""}, ${card.business.address.city || ""}, ${card.business.address.state || ""}`
    : "";

  // Basic vCard 3.0 format
  return `BEGIN:VCARD
VERSION:3.0
FN:${fullName}
ORG:${company}
TITLE:${title}
EMAIL;TYPE=INTERNET:${email}
TEL;TYPE=CELL:${phone}
ADR;TYPE=WORK:;;${address}
URL:${website}
END:VCARD`;
}