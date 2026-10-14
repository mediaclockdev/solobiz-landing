"use client";
import React, { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Share2,
  Copy,
  Mail,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { BusinessCard } from "@/types/businessCard";
import { getFullName } from "@/utils/businessCard";
import { useToast } from "@/contexts/ToastContext";
interface CardShareProps {
  card: BusinessCard;
  cardId: string;
  qrCodeUrl: string;
}
import { loadBusinessCards } from "@/utils/cardStorage";
const STORAGE_KEY = "business_cards";

export function CardShare({ card, cardId, qrCodeUrl }: CardShareProps) {
  const { showToast } = useToast();
  // const handleCopyLink = () => {
  //   if (typeof window !== "undefined") {
  //     const shareUrl = `${window.location.origin}/card/${cardId}`;
  //     navigator.clipboard.writeText(shareUrl).then(() => {
  //      showToast("The card link has been copied to your clipboard.", "success");
  //     });
  //   }
  // };

  const localCardsDemo = loadBusinessCards();
  const selectedCardDemo = localCardsDemo.find((c) => c.metadata.id === cardId);
  const selectedTabDemo = selectedCardDemo ? "local" : "favorites";

  const externalLink = useMemo(() => {
    if (typeof window !== "undefined") {
      let selectedTab = "favorites";
      const localCards = loadBusinessCards();
      const selectedCard = localCards.find((c) => c.metadata.id === cardId);
      if (selectedCard) {
        selectedTab = "local";
      } else {
        selectedTab = "favorites";
      }
      return `${window.location.origin}/${card.urlName}`;
    }
    return "";
  }, [cardId]);

  const handleViewClick = useCallback(() => {
    if (externalLink) {
      localStorage.removeItem("currentPath");
      navigator.clipboard.writeText(externalLink).then(() => {
        showToast(
          "The card link has been copied to your clipboard.",
          "success",
        );
      });

      //window.open(externalLink, "_blank");
    }
  }, [externalLink]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      try {
        const storedCards = localStorage.getItem(STORAGE_KEY);
        const parsedCards = JSON.parse(storedCards) || [];
        const isLocalCard = parsedCards.some(
          (card) => card.metadata?.id === cardId,
        );

        if (isLocalCard) {
          showToast(
            "This card is stored locally on your device and cannot be shared with others",
            "error",
          );
          return;
        }

        const shareUrl = `${window.location.origin}/card/${cardId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast(
            "The card link has been copied to your clipboard.",
            "success",
          );
        });
      } catch (error) {
        console.error("Error handling copy link:", error);
      }
    }
  };

  const handleDownloadQR = async () => {
    if (!qrCodeUrl) return;

    try {
      const fileName = `${getFullName(card)}-qr-code.png`;
      const apiUrl = `/api/download-qr?url=${encodeURIComponent(
        qrCodeUrl,
      )}&name=${encodeURIComponent(fileName)}`;

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Failed to download QR code");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("The QR code has been saved to your device.", "success");
    } catch (error) {
      console.error("Error downloading QR code:", error);
      showToast("Failed to download QR code", "error");
    }
  };

  const handleDownloadImage = async () => {
    const previewElement = document.querySelector(
      ".card-preview",
    ) as HTMLElement;

    if (!previewElement) {
      showToast("Unable to find card preview", "error");
      return;
    }

    try {
      await document.fonts.ready;

      // Wait for existing images
      await Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              }),
          ),
      );

      const clone = previewElement.cloneNode(true) as HTMLElement;

      // Disable animations
      clone.querySelectorAll("*").forEach((el) => {
        const element = el as HTMLElement;

        if (!element.style) return;

        const bg = element.style.backgroundImage;

        if (bg && bg.includes("firebasestorage.googleapis.com")) {
          const match = bg.match(/url\(["']?(.*?)["']?\)/);

          if (match && match[1]) {
            const bust = Date.now();
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(
              match[1],
            )}&t=${bust}`;

            element.style.backgroundImage = `url("${proxyUrl}")`;
          }
        }
      });

      // Replace Firebase <img> with proxy
      const images = clone.querySelectorAll("img");

      images.forEach((img) => {
        img.crossOrigin = "anonymous";

        if (img.src.startsWith("https://firebasestorage.googleapis.com")) {
          const bust = Date.now();
          img.src = `/api/proxy-image?url=${encodeURIComponent(img.src)}&t=${bust}`;
        }
      });

      // Convert background-images → <img>
      const elementsWithBg = clone.querySelectorAll("*");

      elementsWithBg.forEach((el) => {
        const div = el as HTMLElement;
        const style = getComputedStyle(div);

        if (!style.backgroundImage || style.backgroundImage === "none") return;

        const match = style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);

        if (match && match[1]) {
          let imageUrl = match[1];

          if (imageUrl.startsWith("https://firebasestorage.googleapis.com")) {
            const bust = Date.now();
            imageUrl = `/api/proxy-image?url=${encodeURIComponent(
              imageUrl,
            )}&t=${bust}`;
          }

          const img = document.createElement("img");
          img.crossOrigin = "anonymous";
          img.src = imageUrl;

          img.style.position = "absolute";
          img.style.top = "0";
          img.style.left = "0";
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "cover";
          img.style.pointerEvents = "none";

          div.style.backgroundImage = "none";

          if (getComputedStyle(div).position === "static") {
            div.style.position = "relative";
          }

          div.appendChild(img);
        }
      });

      // ✅ Wait for all images inside clone to load (IMPORTANT FIX)
      await Promise.all(
        Array.from(clone.querySelectorAll("img")).map((img) => {
          if (img.complete) return Promise.resolve();

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }),
      );

      // Create offscreen container
      const container = document.createElement("div");

      container.style.position = "fixed";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      container.style.width = "0";
      container.style.height = "0";
      container.style.overflow = "hidden";
      container.style.opacity = "0";
      container.style.pointerEvents = "none";
      container.style.zIndex = "-9999";

      clone.style.position = "relative";
      clone.style.width = `${previewElement.scrollWidth}px`;
      clone.style.height = `${previewElement.scrollHeight}px`;
      clone.style.background = "#ffffff";
      clone.style.transform = "none";
      clone.style.scale = "1";
      clone.style.opacity = "1";
      clone.style.overflow = "hidden";

      container.appendChild(clone);
      document.body.appendChild(container);

      await new Promise((r) => requestAnimationFrame(r));

      const htmlToImage = await import("html-to-image");

      const dataUrl = await htmlToImage.toPng(clone, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        quality: 1,
        imagePlaceholder:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
        style: {
          width: `${previewElement.scrollWidth}px`,
          height: `${previewElement.scrollHeight}px`,
          transform: "none",
          overflow: "visible",
        },
      });

      container.remove();

      // Load generated image
      const img = new Image();
      img.src = dataUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d");

      const footerHeight = 40;
      const borderRadius = 20;

      finalCanvas.width = img.width;
      finalCanvas.height = img.height + footerHeight;

      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(borderRadius, 0);
        ctx.lineTo(finalCanvas.width - borderRadius, 0);
        ctx.quadraticCurveTo(
          finalCanvas.width,
          0,
          finalCanvas.width,
          borderRadius,
        );
        ctx.lineTo(finalCanvas.width, finalCanvas.height - borderRadius);
        ctx.quadraticCurveTo(
          finalCanvas.width,
          finalCanvas.height,
          finalCanvas.width - borderRadius,
          finalCanvas.height,
        );
        ctx.lineTo(borderRadius, finalCanvas.height);
        ctx.quadraticCurveTo(
          0,
          finalCanvas.height,
          0,
          finalCanvas.height - borderRadius,
        );
        ctx.lineTo(0, borderRadius);
        ctx.quadraticCurveTo(0, 0, borderRadius, 0);
        ctx.closePath();
        ctx.clip();

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        ctx.drawImage(img, 0, 0, img.width, img.height);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, img.height, finalCanvas.width, footerHeight);

        ctx.fillStyle = "rgba(102, 102, 102, 0.7)";
        ctx.font = "italic 22px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
          "Created free by: https://solobizcards.com",
          finalCanvas.width / 2,
          img.height + footerHeight / 2,
        );
      }

      const link = document.createElement("a");

      link.download = `${card.profile.firstName || "business"}-${
        card.profile.lastName || "card"
      }.png`;

      link.href = finalCanvas.toDataURL("image/png");
      link.click();

      showToast("Business card image downloaded successfully", "success");
    } catch (error) {
      console.error("Error generating image:", error);
      showToast("Failed to generate image", "error");
    }
  };

  const handleSocialShare = (platform: string) => {
    if (typeof window !== "undefined") {
      const storedCards = localStorage.getItem(STORAGE_KEY);
      const parsedCards = JSON.parse(storedCards) || [];
      const isLocalCard = parsedCards.some(
        (card) => card.metadata?.id === cardId,
      );

      if (isLocalCard) {
        showToast(
          "This card is stored locally on your device and cannot be shared with others",
          "error",
        );
        return;
      }

      const shareUrl = `${window.location.origin}/${card?.urlName}`;
      const text = `Check out ${getFullName(card)}'s business card`;

      console.log("shareUrl", shareUrl);

      let url = "";
      switch (platform) {
        case "facebook":
          url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl,
          )}`;
          break;
        case "instagram":
          navigator.clipboard
            .writeText(`${shareUrl} ${process.env.NEXT_PUBLIC_API_LIVE_URL}`)
            .then(() => {
              alert(
                "Text copied to clipboard! You can now paste it in your Instagram post or story.",
              );
            });
          break;
        case "twitter":
          url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            shareUrl,
          )}&text=${encodeURIComponent(text)}`;
          break;
        case "linkedin":
          url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            shareUrl,
          )}`;
          break;
        case "whatsapp":
          url = `https://wa.me/?text=${encodeURIComponent(
            text + " " + shareUrl,
          )}`;
          break;
        case "email":
          url = `mailto:?subject=${encodeURIComponent(
            text,
          )}&body=${encodeURIComponent(shareUrl)}`;
          break;
        case "text":
          // For text/SMS sharing - using SMS protocol
          url = `sms:?body=${encodeURIComponent(text + " " + shareUrl)}`;
          break;
      }

      if (url) {
        window.open(url, "_blank");
      }
    }
  };

  return (
    <Card className="lg:col-span-4 border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="text-lg">Share Your Cards</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* QR Code Section */}
          <div className="border border-gray-200 rounded-lg p-6 flex flex-col h-full [container-type:inline-size]">
            {qrCodeUrl && (
              <div className="text-center space-y-4 flex flex-col h-full">
                <p className="text-sm text-muted-foreground">Scan to share:</p>
                <div className="inline-block p-4 bg-card rounded-lg border border-gray-100 flex-grow flex items-center justify-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                </div>
                {/* Side by side only when THIS PANEL can fit both labels,
                    not at a viewport width. The panel is the left half of a
                    lg:grid-cols-2 inside the card-details column, so it stays
                    around 280px however wide the window is - and `2xl:flex-row`
                    put two w-full, whitespace-nowrap buttons (~330px together)
                    in that space, pushing "Download Image" out of the card. */}
                <div className="flex flex-col gap-3 [@container(min-width:360px)]:flex-row">
                  <Button
                    variant="outline"
                    className="w-full mt-auto"
                    style={{ backgroundColor: card.brandColor, color: "white" }}
                    onClick={handleDownloadQR}
                  >
                    Download QR Code
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full mt-auto"
                    style={{ backgroundColor: card.brandColor, color: "white" }}
                    onClick={handleDownloadImage}
                  >
                    Download Image
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Social Links Section */}
          <div className="border border-gray-200 rounded-lg p-6 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Copy the link below to share your card:
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleViewClick}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>

              <Button
                variant="outline"
                className="flex-[2]"
                onClick={() => {
                  localStorage.removeItem("currentPath");
                  window.open(
                    `${window.location.origin}/${card.urlName}`,
                    "_blank",
                  );
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View
              </Button>
            </div>
            <Separator />

            <p className="text-sm text-muted-foreground text-center">
              Or share via
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare("email")}
                className="flex items-center justify-start gap-2 p-3"
              >
                <Mail className="h-4 w-4" />
                <span className="text-xs">Email</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare("text")}
                className="flex items-center justify-start gap-2 p-3"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">Text</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare("facebook")}
                className="flex items-center justify-start gap-2 p-3"
              >
                <Facebook className="h-4 w-4" />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare("instagram")}
                className="flex items-center justify-start gap-2 p-3"
              >
                <Instagram className="h-4 w-4" />
                <span className="text-xs">Instagram</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare("linkedin")}
                className="flex items-center justify-start gap-2 p-3"
              >
                <Linkedin className="h-4 w-4" />
                <span className="text-xs">LinkedIn</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialShare("twitter")}
                className="flex items-center justify-start gap-2 p-3"
              >
                <Twitter className="h-4 w-4" />
                <span className="text-xs">Twitter/X</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
