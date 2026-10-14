// src/components/dashboard/card-details/settings/email-signature/SignatureGenerator.ts

import { BusinessCard } from "@/types/businessCard";
import { SignatureLayout } from "./types";

// Converts SVG string to PNG data URL (browser-side)
async function svgStringToPngDataUrl(
  svgString: string,
  width = 24,
  height = 24
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Cannot get canvas context");

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const pngDataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(pngDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG into image"));
    };

    img.src = url;
  });
}

export async function generateSignatureHTML(
  card: BusinessCard,
  layout: SignatureLayout,
  referralCode?: string
): Promise<string> {
  const { profile, business, social } = card;
  const brandColor = card.brandColor || "#000000";

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const location = `${business.address.city}, ${business.address.state}`;
  const titleDept = `${profile.title}${
    profile.department ? ` - ${profile.department}` : ""
  }`;
  const liveUrl = process.env.NEXT_PUBLIC_API_LIVE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const baseUrl = liveUrl.endsWith("/") ? liveUrl : `${liveUrl}/`;
  const referralUrl = referralCode
    ? `${baseUrl}?ref=${referralCode}`
    : baseUrl;
  const cardUrl = `${baseUrl}${card.urlName || ""}`;
  const vcfUrl = `${baseUrl}api/vcard/${card.urlName}`;


  // Social SVG templates
  const svgTemplates: Record<string, (color: string) => string> = {
    facebook: (color) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
    twitter: (color) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>`,
    linkedin: (color) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`,
    instagram: (color) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`,
    youtube: (color) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>`,
    tiktok: (color) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.4 2h3.1c.2 1.2.8 2.3 1.7 3.2c.9.9 2 1.5 3.2 1.7v3.1c-1.7-.1-3.4-.7-4.8-1.7v7.3c0 3.6-2.9 6.4-6.4 6.4S3.8 19.2 3.8 15.6c0-3.5 2.9-6.4 6.4-6.4c.4 0 .7 0 1 .1v3.3c-.3-.1-.6-.1-1-.1c-1.7 0-3.1 1.4-3.1 3.1s1.4 3.2 3.1 3.2s3.1-1.4 3.1-3.1V2z"/></svg>`,
  };

  // Save Contact Icon
  const userPlusSvg = (color: string) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" x2="19" y1="8" y2="14"/>
        <line x1="22" x2="16" y1="11" y2="11"/>
      </svg>`;

  // Save Contact PNG conversion
  let saveContactIconPng = "";
  try {
    saveContactIconPng = await svgStringToPngDataUrl(
      userPlusSvg(brandColor),
      24,
      24
    );
  } catch (e) {
    console.warn("Failed to convert Save Contact icon", e);
  }

  // Generate PNG icons for social links
  const socialLinks: { url: string; icon: string; label: string }[] = [];
  for (const key of Object.keys(svgTemplates)) {
    const linkUrl = (social as any)[key];
    if (!linkUrl) continue;
    try {
      const png = await svgStringToPngDataUrl(
        svgTemplates[key](brandColor),
        24,
        24
      );
      socialLinks.push({ url: linkUrl, icon: png, label: key });
    } catch (err) {
      console.warn(`Failed to convert ${key} SVG to PNG`, err);
    }
  }

  const imageUrl =
    layout === "profile-photo"
      ? card.profilePhoto
      : layout === "company-logo"
      ? card.companyLogo
      : "";

  const isLogoPhotoLayout = layout === "logo-photo-text";

  const socialIconsHtml = socialLinks
    .map(
      (link) =>
        `<a href="${link.url}" style="text-decoration:none;margin-right:8px;"><img src="${link.icon}" width="16" height="16" style="vertical-align:middle;"></a>`
    )
    .join("");

  return `
<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.4;border-top:2px solid ${brandColor};border-bottom:2px solid ${brandColor};padding:15px 0;">
<tr><td>
  <div style="margin-bottom:10px;">
    <div style="font-weight:bold;font-size:16px;color:${brandColor};"><a href="${cardUrl}" target="_blank" style="color:${brandColor};text-decoration:none;">${
    profile.company
  }</a></div>
    ${
      profile.companySlogan
        ? `<div style="font-style:italic;color:#666;font-size:12px;">"${profile.companySlogan}"</div>`
        : ""
    }
  </div>
  <table cellpadding="0" cellspacing="0"><tr>
  ${
    isLogoPhotoLayout
      ? `<td style="padding-right:15px;"><a href="${cardUrl}" target="_blank"><img src="${card.companyLogo}" style="width:50px;height:auto;border-radius:4px;object-fit:cover;border:0;"></a></td>
         <td style="padding-right:15px;"><div style="width:1px;height:50px;background-color:${brandColor};margin:0 8px;"></div></td>
         <td style="padding-right:15px;"><a href="${cardUrl}" target="_blank"><img src="${card.profilePhoto}" style="width:50px;height:auto;border-radius:50%;object-fit:cover;border:0;"></a></td>`
      : imageUrl
      ? `<td style="padding-right:15px;"><a href="${cardUrl}" target="_blank"><img src="${imageUrl}" style="width:50px;height:auto;border-radius:${
          layout === "profile-photo" ? "50%" : "4px"
        };object-fit:cover;border:0;"></a></td>`
      : ""
  }
    <td>
      <div style="font-weight:bold;color:${brandColor};margin-bottom:2px;">
        <a href="${cardUrl}" target="_blank" style="color:${brandColor};text-decoration:none;">${fullName}</a>
        ${
          profile.accreditations && profile.accreditations.length > 0
            ? `<span style="color:#6b7280;font-size:12px;font-weight:normal;margin-left:8px;vertical-align:baseline;white-space:nowrap;">${profile.accreditations.join(
                ", "
              )}</span>`
            : ""
        }
      </div>
      <div style="color:#333;margin-bottom:2px;">${titleDept} - ${location}</div>
      <div style="margin-bottom:5px;">
        <span style="color:#666;">${business.phone}</span> |
        <a href="mailto:${
          business.email
        }" style="color:${brandColor};text-decoration:none;">${
    business.email
  }</a> |
        <a href="${
          business.website
        }" style="color:${brandColor};text-decoration:none;">${
    business.website
  }</a>
      </div>
       <div style="margin-top:8px;display:flex;align-items:center;gap:6px;">
      ${socialIconsHtml}

      <a href="${vcfUrl}"
         style="display:inline-flex;align-items:center;text-decoration:none;
                background:#f3f4f6;padding:3px 6px;border-radius:4px;
                font-size:12px;color:${brandColor};font-weight:600;">
        <img src="${saveContactIconPng}" width="14" height="14" 
             style="margin-right:4px;vertical-align:middle;" />
        Save Contact
      </a>

      <span style="font-style:italic;color:#666;font-size:12px;margin-left:8px;vertical-align:middle;">
        Powered by: <a href="${referralUrl}" target="_blank" style="color:${brandColor};text-decoration:underline;">Solo Biz Cards</a>
      </span>
   </div>
    </td>
  </tr></table>
</td></tr>
</table>`.trim();
}
