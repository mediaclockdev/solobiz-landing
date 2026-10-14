"use client";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  UserPlus,
  Youtube,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { BusinessCard } from "@/types/businessCard";
import { SignatureLayout } from "./types";
import { getFullName, generateVCard } from "@/utils/businessCard";
import { useAuth } from "@/contexts/AuthContext";
interface SignaturePreviewProps {
  card: BusinessCard;
  selectedLayout: SignatureLayout;
}

export function SignaturePreview({
  card,
  selectedLayout,
}: SignaturePreviewProps) {
  const { profile, business, social } = card;
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const { user } = useAuth();
  // Build location string conditionally
  const locationParts = [business.address.city, business.address.state].filter(
    Boolean,
  );
  const location = locationParts.join(", ");

  // Build title/department string conditionally
  const titleParts = [profile.title, profile.department].filter(Boolean);
  const titleDept = titleParts.join(" - ");

  // Debug logging
  // console.log('SignaturePreview Debug:', {
  //   selectedLayout,
  //   companyLogo: card.companyLogo,
  //   profilePhoto: card.profilePhoto,
  //   hasCompanyLogo: !!card.companyLogo,
  //   hasProfilePhoto: !!card.profilePhoto
  // });

  function svgToBase64(svg: string) {
    return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  }

  const facebookSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${card.brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-facebook w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>`;

  const twitterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${card.brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-twitter w-4 h-4"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>`;

  const linkedinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${card.brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-linkedin w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>`;

  const instagramSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${card.brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>`;

  const youtubeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${card.brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-youtube w-4 h-4" style="color: rgb(175, 82, 222);"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>`;

  const tiktokSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
  viewBox="0 0 24 24" fill="none" stroke="${card.brandColor}"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12.4 2h3.1c.2 1.2.8 2.3 1.7 3.2c.9.9 2 1.5 3.2 1.7v3.1
      c-1.7-.1-3.4-.7-4.8-1.7v7.3c0 3.6-2.9 6.4-6.4 6.4S3.8 19.2 3.8 15.6
      c0-3.5 2.9-6.4 6.4-6.4c.4 0 .7 0 1 .1v3.3c-.3-.1-.6-.1-1-.1
      c-1.7 0-3.1 1.4-3.1 3.1s1.4 3.2 3.1 3.2s3.1-1.4 3.1-3.1V2z"/>
</svg>`;

  const TikTokIcon = ({ color }: { color: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M12.4 2h3.1c.2 1.2.8 2.3 1.7 3.2c.9.9 2 1.5 3.2 1.7v3.1c-1.7-.1-3.4-.7-4.8-1.7v7.3c0 3.6-2.9 6.4-6.4 6.4S3.8 19.2 3.8 15.6c0-3.5 2.9-6.4 6.4-6.4c.4 0 .7 0 1 .1v3.3c-.3-.1-.6-.1-1-.1c-1.7 0-3.1 1.4-3.1 3.1s1.4 3.2 3.1 3.2s3.1-1.4 3.1-3.1V2z" />
    </svg>
  );

  const socialLinks = [
    { url: social.facebook, icon: svgToBase64(facebookSvg), label: "Facebook" },
    { url: social.twitter, icon: svgToBase64(twitterSvg), label: "Twitter" },
    { url: social.linkedin, icon: svgToBase64(linkedinSvg), label: "LinkedIn" },
    { url: social.youtube, icon: svgToBase64(youtubeSvg), label: "Youtube" },
    {
      url: social.instagram,
      icon: svgToBase64(instagramSvg),
      label: "Instagram",
    },
    { url: social.tiktok, icon: svgToBase64(tiktokSvg), label: "Tiktok" },
  ].filter((link) => link.url);

  const handleDownloadVCard = async () => {
    const vCardData = await generateVCard(card);
    const blob = new Blob([vCardData], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.urlName || getFullName(card) || "contact"}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("card", card);
  };

  // const socialLinks = [
  //   { url: social.facebook, icon: Facebook, label: "Facebook" },
  //   { url: social.twitter, icon: Twitter, label: "Twitter" },
  //   { url: social.linkedin, icon: Linkedin, label: "LinkedIn" },
  //   { url: social.instagram, icon: Instagram, label: "Instagram" },
  //   { url: social.youtube, icon: Youtube, label: "Youtube" },
  //   {
  //     url: social.tiktok,
  //     icon: () => <TikTokIcon color={card.brandColor} />,
  //     label: "Tiktok",
  //   },
  // ].filter((link) => link.url);

  const imageUrl =
    selectedLayout === "profile-photo"
      ? card.profilePhoto
      : selectedLayout === "company-logo"
        ? card.companyLogo
        : "";

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Preview</Label>
      <div
        className="border p-4 bg-card overflow-x-auto w-full"
        style={{
          borderColor: card.brandColor || "#000000",
          borderRadius: "10px",
          borderWidth: "1px",
        }}
      >
        <div
          className="border-t-2 border-b-2 py-4 px-4 bg-card text-sm"
          style={{
            borderTopColor: card.brandColor,
            borderBottomColor: card.brandColor,
            fontFamily: "Arial, sans-serif",
          }}
        >
          <div className="mb-3">
            <div
              className="font-bold text-base"
              style={{ color: card.brandColor }}
            >
              <a
                target="_blank"
                href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}${card?.urlName}`}
              >
                {profile.company}
              </a>
            </div>
            {profile.companySlogan && (
              <div className="italic text-gray-600 text-xs">
                "{profile.companySlogan}"
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {selectedLayout === "logo-photo-text" && (
              <>
                {card.companyLogo && (
                  <>
                    <div className="flex-shrink-0">
                      <a
                        target="_blank"
                        href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}${card?.urlName}`}
                      >
                        <img
                          src={card.companyLogo}
                          alt={profile.company}
                          className="w-12 max-w-12 h-auto object-cover rounded"
                        />
                      </a>
                    </div>
                    <div
                      className="w-px h-12 flex-shrink-0"
                      style={{ backgroundColor: card.brandColor || "#000000" }}
                    ></div>
                  </>
                )}
                <div className="flex-shrink-0">
                  <a
                    target="_blank"
                    href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}${card?.urlName}`}
                  >
                    <img
                      style={{ backgroundColor: "#8080805e" }}
                      src={card.profilePhoto}
                      alt={fullName}
                      className="w-12 max-w-12 h-auto object-cover rounded-full"
                    />
                  </a>
                </div>
              </>
            )}
            {selectedLayout !== "logo-photo-text" &&
              selectedLayout !== "text-only" &&
              ((selectedLayout === "company-logo" && card.companyLogo) ||
                (selectedLayout === "profile-photo" && card.profilePhoto)) && (
                <div className="flex-shrink-0">
                  <a
                    target="_blank"
                    href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}${card?.urlName}`}
                  >
                    <img
                      style={{ backgroundColor: "#8080805e" }}
                      src={
                        selectedLayout === "profile-photo"
                          ? card.profilePhoto
                          : card.companyLogo
                      }
                      alt={
                        selectedLayout === "profile-photo"
                          ? fullName
                          : profile.company
                      }
                      className={`w-12 max-w-12 h-auto object-cover ${
                        selectedLayout === "profile-photo"
                          ? "rounded-full"
                          : "rounded"
                      }`}
                    />
                  </a>
                </div>
              )}
            <div className="flex-1">
              <div
                className="font-bold mb-1 text-lg flex items-baseline justify-left gap-2 flex-nowrap"
                style={{ color: card.brandColor }}
              >
                <a
                  target="_blank"
                  href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}${card?.urlName}`}
                >
                  {fullName}
                </a>

                {card.profile.accreditations.length > 0 && (
                  <span className="text-muted-foreground text-base sm:text-sm font-normal whitespace-nowrap leading-none">
                    {card.profile.accreditations.join(", ")}
                  </span>
                )}
              </div>
              {(titleDept || location) && (
                <div className="text-gray-800 mb-1 text-xs">
                  {[titleDept, location].filter(Boolean).join(" - ")}
                </div>
              )}
              <div className="mb-2 text-gray-600 text-xs break-all">
                {[business.phone, business.email, business.website]
                  .filter(Boolean)
                  .join(" | ")}
              </div>
              {(socialLinks.length > 0 || true) && (
                <div className="flex gap-2 items-center">
                  {socialLinks.map((link, index) => {
                    const IconComponent = link.icon;
                    return (
                      <img key={index} src={link.icon} height="16px" width="16px"></img>
                      // <IconComponent
                      //   key={index}
                      //   className="w-4 h-4"
                      //   style={{ color: card.brandColor }}
                      // />
                    );
                  })}
                  {/* Save Contact Button */}
                  <a
                    onClick={handleDownloadVCard}
                    // href={`${window.location.origin}/card/${
                    //   card.urlName || card.metadata.id
                    // }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ml-2 cursor-pointer"
                    style={{
                      color: card.brandColor,
                      backgroundColor: "#f3f4f6",
                      textDecoration: "none",
                    }}
                  >
                    <UserPlus className="w-3 h-3" />
                    Save Contact
                  </a>
                  <div className="italic text-gray-600 text-xs">
                    Powered by:{" "}
                    <a
                      href={`${window.location.origin}?ref=${user?.referralCode}`}
                    >
                      Solo Biz Cards
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
