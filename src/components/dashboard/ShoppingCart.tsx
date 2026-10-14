"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SaleBanner } from "@/components/dashboard/SaleBanner";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart as ShoppingCartIcon,
  Plus,
  Minus,
  Trash2,
  Star,
  Info,
  ShoppingBasket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckoutModal } from "./CheckoutModal";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  AccessoryPricingConfig,
  loadPricingConfig,
} from "@/utils/accessoryPricing";
import { generateQRCodeWithLogo } from "@/utils/qrCodeGenerator";

export function ShoppingCart(props) {
  const { selectedColor } = props;
  const { selectedCard } = props;
  const { cardDetails } = props;
  const { selectedProduct } = props;

  const [tapStickerQRCode, setTapStickerQRCode] = useState<string>("");
  const [assignedDigitalCard, setAssignedDigitalCard] = useState<string>("");
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getTotalSavings,
  } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const totalSavings = getTotalSavings();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [addCustomLogoToSticker, setAddCustomLogoToSticker] = useState(false);
  const [showMaterialComingSoon, setShowMaterialComingSoon] = useState(false);
  const [assignedDigitalCards, setAssignedDigitalCards] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);
  const [pricingConfig, setPricingConfig] = useState<AccessoryPricingConfig>();

  const colorSchemes = {
    red: {
      bg: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      text: "#7F1D1D",
      lightText: "#FCA5A5",
    },
    pink: {
      bg: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
      text: "#831843",
      lightText: "#F9A8D4",
    },
    yellow: {
      bg: "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)",
      text: "#713F12",
      lightText: "#FDE047",
    },
    gray: {
      bg: "linear-gradient(135deg, #4f4e4f 0%, #303030 100%)",
      text: "#FFFFFF",
      lightText: "#4f4e4f",
    },
    green: {
      bg: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      text: "#064E3B",
      lightText: "#6EE7B7",
    },
    blue: {
      bg: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
      text: "#1E3A8A",
      lightText: "#93C5FD",
    },
    purple: {
      bg: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
      text: "#4C1D95",
      lightText: "#C4B5FD",
    },
    white: {
      bg: "linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)",
      text: "#1F2937",
      lightText: "#6B7280",
    },
    black: {
      bg: "linear-gradient(135deg, #000000 0%, #1F2937 100%)",
      text: "#D1D5DB",
      lightText: "#F9FAFB",
    },
  };
  const [optionalText, setOptionalText] = useState("");
  const [customCardDesignType, setCustomCardDesignType] = useState<
    "image-text" | "image-image"
  >("image-text");
  const [showQRCodeOnBack, setShowQRCodeOnBack] = useState(true);
  const [qrCodePosition, setQRCodePosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  >("top-right");
  const [hideTextOnBack, setHideTextOnBack] = useState(false);
  const [tapStickerTextAbbr, setTapStickerTextAbbr] = useState("SOLO");
  const [cardQRCode, setCardQRCode] = useState<string>("");
  const [removeBlingLogo, setRemoveBlingLogo] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState<
    "single" | "double" | "pack"
  >("single");
  const [selectedMaterial, setSelectedMaterial] = useState<
    "classic" | "wood" | "metal"
  >("classic");

  const formatAddress = (
    address: string,
    city: string,
    state: string,
    zipCode: string
  ): string => {
    const parts: string[] = [];

    if (address?.trim()) {
      parts.push(address.trim());
    }

    if (city?.trim()) {
      parts.push(city.trim());
    }

    const stateZip = [state?.trim(), zipCode?.trim()].filter(Boolean).join(" ");

    if (stateZip) {
      parts.push(stateZip);
    }

    return parts.join(", ");
  };
  const [tapStickerLogo, setTapStickerLogo] = useState<File | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      try {
        // Map selected color to hex values
        const colorHexMap: { [key: string]: string } = {
          red: "#EF4444",
          pink: "#EC4899",
          yellow: "#EAB308",
          green: "#059669",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          white: "#FFFFFF",
          black: "#000000",
          gray: "#4f4e4f",
        };

        let qrColor = colorHexMap[selectedColor] || "#000000";

        if (selectedColor === "white") {
          qrColor = "#000000";
        }

        // Use dark background for white QR code, white background for all others
        const qrBackground = selectedColor === "white" ? "#FFFFFF" : "#FFFFFF";

        // If using text abbreviation mode, don't add any logo to the QR code
        if (!cardDetails.useLogoImage || !tapStickerLogo) {
          const qrUrl = await generateQRCodeWithLogo(
            `${process.env.NEXT_PUBLIC_API_LIVE_URL}`,
            null,
            {
              width: 300,
              margin: 1,
              //@ts-ignore
              useDefaultLogo: false,
              color: {
                dark: qrColor,
                light: qrBackground,
              },
            }
          );

          setTapStickerQRCode(qrUrl);
          setCardQRCode(qrUrl);
        } else {
          // Using logo mode
          const qrUrl = await generateQRCodeWithLogo(
            `${process.env.NEXT_PUBLIC_API_LIVE_URL}`,
            tapStickerLogo,
            {
              width: 300,
              margin: 1,
              //@ts-ignore
              useDefaultLogo: !addCustomLogoToSticker && !tapStickerLogo,
              color: {
                dark: qrColor,
                light: qrBackground,
              },
            }
          );

          setTapStickerQRCode(qrUrl);
          setCardQRCode(qrUrl);
        }
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      }
    };

    generateQR();
  }, [
    tapStickerLogo,
    cardDetails.useLogoImage,
    selectedColor,
    addCustomLogoToSticker,
    assignedDigitalCard,
  ]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCartIcon className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Shopping Cart ({totalItems})</span>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingCartIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground">
              Add accessories to get started
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 -mx-6 px-6 my-6">
              <div>
                {items.map((item) => {
                  return (
                    <>
                      <div className="rounded-lg border bg-card px-4 py-4 mt-4">
                        {item?.type === "nfc-card" /* NFC Cards Display */ ? (
                          <div key={item.id} className="flex flex-col gap-6">
                            {/* Front and Back Cards - Inline Layout */}
                            <div className="gap-4">
                              {/* FRONT CARD */}
                              <div className="flex-1 space-y-2">
                                <Label className="text-sm font-medium">
                                  Front
                                </Label>

                                <div
                                  className="w-[321px] h-[204px] rounded-2xl p-0 aspect-[1.6/1] flex items-center justify-center shadow-xl"
                                  style={{
                                    background:
                                      colorSchemes[item?.color]?.bg ||
                                      colorSchemes.black.bg,
                                  }}
                                >
                                  {/* Essential Card */}
                                  {item?.selectedCard === "essential" && (
                                    <div className="flex items-center justify-center">
                                      <div
                                        className="text-3xl font-bold"
                                        style={{
                                          color:
                                            colorSchemes[item?.color]?.text ||
                                            colorSchemes.black.text,
                                        }}
                                      >
                                        Solo
                                      </div>
                                    </div>
                                  )}

                                  {/* Infinite Card */}
                                  {item?.selectedCard === "infinite" && (
                                    <div className="relative w-full h-full flex flex-col p-6">
                                      {/* Logo at top-right */}
                                      <div className="absolute top-6 right-6 w-12 h-12 rounded-lg flex items-center justify-center">
                                        {cardDetails.useLogoImage &&
                                        cardDetails.personalizeLogo ? (
                                          <img
                                            src={cardDetails.personalizeLogo}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain rounded-lg"
                                          />
                                        ) : !cardDetails.useLogoImage ? (
                                          <div
                                            className="text-xs font-bold text-center"
                                            style={{
                                              color:
                                                colorSchemes[item?.color]
                                                  ?.text ||
                                                colorSchemes.black.text,
                                            }}
                                          >
                                            {cardDetails.logoText}
                                          </div>
                                        ) : null}
                                      </div>

                                      {/* Text bottom-left */}
                                      <div
                                        className="absolute bottom-6 left-6 flex flex-col"
                                        style={{
                                          color:
                                            colorSchemes[item?.color]?.text ||
                                            colorSchemes.black.text,
                                        }}
                                      >
                                        <div
                                          className="text-base font-medium"
                                          dangerouslySetInnerHTML={{
                                            __html: cardDetails.companyName,
                                          }}
                                        />
                                        <div
                                          className="text-xl font-semibold"
                                          dangerouslySetInnerHTML={{
                                            __html: cardDetails.firstName,
                                          }}
                                        />
                                        <div
                                          className="text-base"
                                          dangerouslySetInnerHTML={{
                                            __html: cardDetails.additionalInfo,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Custom Front */}
                                  {item?.selectedCard === "custom" &&
                                    item?.cardDetails?.customCardDesignType ===
                                      "image-text" && (
                                      <div className="relative w-full h-full">
                                        {cardDetails?.customLogo ? (
                                          <img
                                            src={cardDetails?.customLogo}
                                            alt="Custom Design"
                                            className="w-full h-full object-contain rounded-xl"
                                          />
                                        ) : (
                                          <div
                                            className="w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center"
                                            style={{
                                              borderColor:
                                                "rgba(255,255,255,0.3)",
                                              color:
                                                item?.color === "black"
                                                  ? "#FFFFFF"
                                                  : colorSchemes[item?.color]
                                                      ?.text,
                                            }}
                                          >
                                            <div className="text-xl font-bold mb-2">
                                              CUSTOM
                                            </div>
                                            <div className="text-sm mb-3">
                                              Upload your design here
                                            </div>
                                            <div className="text-xs opacity-70">
                                              Aspect ratio 1.6:1
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                  {item?.selectedCard === "custom" &&
                                    item?.cardDetails?.customCardDesignType ===
                                      "image-image" && (
                                      <div className="relative w-full h-full">
                                        {item?.cardDetails.frontLogo ? (
                                          <img
                                            src={item?.cardDetails.frontLogo}
                                            alt="Custom Design"
                                            className="w-full h-full object-cover rounded-xl"
                                          />
                                        ) : (
                                          <div
                                            className="w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center"
                                            style={{
                                              borderColor:
                                                "rgba(255,255,255,0.3)",
                                              color:
                                                item?.color === "black"
                                                  ? "#FFFFFF"
                                                  : colorSchemes[item?.color]
                                                      ?.text,
                                            }}
                                          >
                                            <div className="text-xl font-bold mb-2">
                                              CUSTOM
                                            </div>
                                            <div className="text-sm mb-3">
                                              Upload your design here
                                            </div>
                                            <div className="text-xs opacity-70">
                                              Aspect ratio 1.6:1
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>

                              {/* BACK CARD */}
                              <div className="flex-1 space-y-2 mt-4">
                                <Label className="text-sm font-medium">
                                  Back
                                </Label>

                                <div className="w-[321px] h-[204px]">
                                  <div
                                    className="rounded-2xl p-6 aspect-[1.6/1] flex flex-col justify-between shadow-xl relative overflow-hidden"
                                    style={{
                                      background:
                                        colorSchemes[item?.color]?.bg ||
                                        colorSchemes.black.bg,
                                      color:
                                        colorSchemes[item?.color]?.text ||
                                        colorSchemes.black.text,
                                    }}
                                  >
                                    {/* 🔵 CUSTOM BACK - IMAGE + IMAGE */}
                                    {item?.selectedCard === "custom" &&
                                    item?.cardDetails?.customCardDesignType ===
                                      "image-image" ? (
                                      <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                        {item?.cardDetails.backLogo ? (
                                          <img
                                            src={item?.cardDetails.backLogo}
                                            alt="Back Card Design"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div
                                            className="w-full h-full border-2 border-dashed flex flex-col items-center justify-center text-center"
                                            style={{
                                              borderColor:
                                                "rgba(255,255,255,0.3)",
                                              color:
                                                item?.color === "black"
                                                  ? "#FFFFFF"
                                                  : colorSchemes[item?.color]
                                                      ?.text,
                                            }}
                                          >
                                            <div className="text-xl font-bold mb-2">
                                              BACK
                                            </div>
                                            <div className="text-sm mb-3">
                                              Upload back design
                                            </div>
                                            <div className="text-xs opacity-70">
                                              Aspect ratio 1.6:1
                                            </div>
                                          </div>
                                        )}

                                        {/* QR Positioning */}
                                        {showQRCodeOnBack && (
                                          <div
                                            className={`absolute bg-white p-[0.2rem] rounded-lg ${
                                              qrCodePosition === "top-left"
                                                ? "top-6 left-6"
                                                : qrCodePosition === "top-right"
                                                ? "top-6 right-6"
                                                : qrCodePosition ===
                                                  "bottom-left"
                                                ? "bottom-6 left-6"
                                                : qrCodePosition ===
                                                  "bottom-right"
                                                ? "bottom-6 right-6"
                                                : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                            }`}
                                          >
                                            <img
                                              src={
                                                cardQRCode ||
                                                "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                              }
                                              alt="QR Code"
                                              className="w-16 h-16"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ) : null}

                                    {/* 🔵 CUSTOM BACK – IMAGE + TEXT */}
                                    {item?.selectedCard === "custom" &&
                                    item?.cardDetails?.customCardDesignType !==
                                      "image-image" ? (
                                      hideTextOnBack ? (
                                        // Hide text: Only QR Code
                                        <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                          <div className="absolute top-6 right-6 bg-white p-[0.2rem] rounded-lg">
                                            <img
                                              src={
                                                cardQRCode ||
                                                "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                              }
                                              alt="QR Code"
                                              className="w-16 h-16"
                                            />
                                          </div>
                                        </div>
                                      ) : (
                                        // Show full text + QR Code
                                        <div className="flex justify-between h-full">
                                          <div className="flex flex-col justify-between text-xs h-full">
                                            <div className="space-y-0.5">
                                              <div
                                                className="font-semibold text-sm"
                                                dangerouslySetInnerHTML={{
                                                  __html:
                                                    cardDetails?.firstName,
                                                }}
                                              />
                                              <div
                                                className="font-medium"
                                                dangerouslySetInnerHTML={{
                                                  __html:
                                                    cardDetails?.additionalInfo,
                                                }}
                                              />
                                            </div>

                                            <div className="space-y-0.5 text-[10px]">
                                              <div
                                                className="opacity-90"
                                                dangerouslySetInnerHTML={{
                                                  __html:
                                                    cardDetails?.companyName,
                                                }}
                                              />
                                              <div>{cardDetails?.phone}</div>
                                              <div>{cardDetails?.email}</div>
                                              <div>{cardDetails?.website}</div>
                                              <div>
                                                {formatAddress(
                                                  cardDetails?.address,
                                                  cardDetails?.city,
                                                  cardDetails?.state,
                                                  cardDetails?.zipCode
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="bg-white p-[0.2rem] rounded-lg self-start">
                                            <img
                                              src={
                                                cardQRCode ||
                                                "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                              }
                                              alt="QR Code"
                                              className="w-16 h-16"
                                            />
                                          </div>
                                        </div>
                                      )
                                    ) : null}

                                    {/* 🔵 ESSENTIAL CARD BACK */}
                                    {item?.selectedCard === "essential" && (
                                      <div className="flex items-center justify-center h-full">
                                        <div className="bg-white p-[0.2rem] rounded-lg">
                                          <img
                                            src={
                                              cardQRCode ||
                                              "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                            }
                                            alt="QR Code"
                                            className="w-16 h-16"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* 🔵 PERSONALIZE BACK (Default Solo or optional text) */}
                                    {item?.selectedCard !== "custom" &&
                                      item?.selectedCard !== "essential" && (
                                        <>
                                          <div className="flex justify-end">
                                            <div className="bg-white p-[0.2rem] rounded-lg">
                                              <img
                                                src={
                                                  cardQRCode ||
                                                  "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                                }
                                                alt="QR Code"
                                                className="w-16 h-16"
                                              />
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 justify-start">
                                            {!removeBlingLogo ? (
                                              <span className="text-lg font-semibold">
                                                Solo
                                              </span>
                                            ) : optionalText ? (
                                              <span className="text-lg font-semibold">
                                                {optionalText}
                                              </span>
                                            ) : null}
                                          </div>
                                        </>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Phone Display */
                          <div className="flex flex-col gap-6">
                            {/* Sale Banner */}
                            {(() => {
                              //@ts-ignore
                              const isActive =
                                pricingConfig?.specialSale.isActive;
                              //@ts-ignore
                              const endDate = new Date(
                                pricingConfig?.specialSale.endDate
                              );
                              const now = new Date();
                              const isNotExpired = endDate > now;

                              return isActive && isNotExpired ? (
                                <SaleBanner
                                  //@ts-ignore
                                  saleName={pricingConfig?.specialSale.saleName}
                                  //@ts-ignore
                                  percentage={
                                    pricingConfig?.specialSale.percentage
                                  }
                                  //@ts-ignore
                                  endDate={pricingConfig?.specialSale.endDate}
                                />
                              ) : null;
                            })()}

                            {/* Tap Sticker on Phone Display */}
                            {/* <Label className="text-sm font-medium">Front</Label> */}
                            <div className="flex justify-start">
                              {/* Bottom Sticker Layout */}
                              <div className="w-[227px] h-[151px] aspect-[3/2]">
                                <div
                                  className="bg-gray-900 rounded-2xl px-3 py-3 shadow-lg flex items-center justify-between h-full w-full gap-3"
                                  style={{
                                    background:
                                      colorSchemes[
                                        item?.cardDetails?.tapStickerColor
                                      ]?.bg || colorSchemes.black.bg,
                                    color:
                                      colorSchemes[
                                        item?.cardDetails?.tapStickerColor
                                      ]?.text || colorSchemes.black.text,
                                  }}
                                >
                                  {/* Left side - Logo or Text */}
                                  <div className="flex h-full w-full gap-3 justify-center">
                                    <div className="flex-[7] flex items-center justify-center">
                                      {item?.cardDetails.useLogoImage &&
                                      item?.cardDetails.tapStickerLogo ? (
                                        <img
                                          src={item?.cardDetails.tapStickerLogo}
                                          alt="Logo"
                                          className="object-contain opacity-80 rounded-lg w-[200px] h-[140px]"
                                        />
                                      ) : !item?.cardDetails.useLogoImage ? (
                                        <span className="text-[10px] font-bold text-gray-400 text-center text-lg font-semibold w-full">
                                          {tapStickerTextAbbr || "SOLO"}
                                        </span>
                                      ) : null}
                                    </div>

                                    {/* Right side - Solo + QR Code */}
                                    <div className="flex flex-col items-center gap-3 justify-center">
                                      {item?.cardDetails.useLogoImage &&
                                        !item?.cardDetails.tapStickerLogo && (
                                          <span className="text-gray-400 text-xl font-medium tracking-wide">
                                            Solo
                                          </span>
                                        )}

                                      <div className="bg-white p-[0.2rem] rounded-lg">
                                        <img
                                          src={
                                            tapStickerQRCode ||
                                            "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                          }
                                          alt="QR Code"
                                          className="w-12 h-12 opacity-80"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="relative hidden">
                                {/* Phone Rear View */}
                                <div className="relative bg-gray-800 rounded-3xl p-2 w-72 h-[580px] shadow-2xl">
                                  {/* Phone Back Body */}
                                  <div className="relative w-full h-full bg-gray-700 rounded-2xl overflow-hidden">
                                    {/* Camera Module */}
                                    <div className="absolute top-4 left-4">
                                      <div className="bg-gray-900 rounded-2xl p-2 w-16 h-20">
                                        {/* Main Cameras */}
                                        <div className="space-y-2">
                                          <div className="w-12 h-12 bg-black rounded-full border-2 border-gray-600 flex items-center justify-center">
                                            <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                                          </div>
                                          <div className="w-12 h-12 bg-black rounded-full border-2 border-gray-600 flex items-center justify-center">
                                            <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Apple Logo */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center opacity-30">
                                        <div className="w-8 h-8 bg-gray-500 rounded-full"></div>
                                      </div>
                                    </div>

                                    {/* QR Code Sticker */}
                                    {/* <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
                                      <div className="bg-white rounded-lg p-2 shadow-lg border border-gray-300 relative">
                                        <img
                                          src={
                                            tapStickerQRCode ||
                                            "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                          }
                                          alt="QR Code"
                                          className="w-20 h-20"
                                        />
                                        
                                        {!cardDetails.useLogoImage && tapStickerTextAbbr && (
                                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded px-1.5 py-0.5">
                                            <span className="text-[10px] font-bold text-gray-800">
                                              {tapStickerTextAbbr}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div> */}

                                    {/* Bottom Sticker Layout */}
                                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[85%]">
                                      <div className="bg-gray-900 rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between">
                                        {/* Left side - Logo or Text */}
                                        <div className="w-14 h-14 flex items-center justify-center">
                                          {cardDetails.useLogoImage &&
                                          cardDetails.tapStickerLogo ? (
                                            <img
                                              src={cardDetails.tapStickerLogo}
                                              alt="Logo"
                                              className="max-w-full max-h-full object-contain opacity-80 rounded-lg"
                                            />
                                          ) : // ) : cardDetails.useLogoImage &&
                                          //   !cardDetails.tapStickerLogo ? (
                                          //   <>
                                          //     <span className="text-[10px] font-bold text-gray-400 text-center text-lg font-semibold mt-6">
                                          //       SOLO
                                          //     </span>
                                          //   </>
                                          !cardDetails.useLogoImage ? (
                                            <span className="text-[10px] font-bold text-gray-400 text-center text-lg font-semibold w-full">
                                              {tapStickerTextAbbr || "SOLO"}
                                            </span>
                                          ) : null}
                                        </div>

                                        {/* Right side - Solo + QR Code */}
                                        <div className="flex flex-col items-center gap-3">
                                          {cardDetails.useLogoImage &&
                                            !cardDetails.tapStickerLogo && (
                                              <span className="text-gray-400 text-sm font-medium tracking-wide">
                                                Solo
                                              </span>
                                            )}

                                          <div className="bg-white p-[0.2rem] rounded-lg">
                                            <img
                                              src={
                                                tapStickerQRCode ||
                                                "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                              }
                                              alt="QR Code"
                                              className="w-10 h-10 opacity-80"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div key={item.id} className="flex gap-4 p-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm mb-1 truncate">
                                {item.name}
                                {/* {item.color}
                        {item.material} */}
                              </h4>

                              {item.options &&
                                Object.keys(item.options).length > 0 && (
                                  <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                                    {item.options.customLogo && (
                                      <div>• Custom Logo</div>
                                    )}
                                    {item.options.keychain && (
                                      <div>• Keychain Attachment</div>
                                    )}
                                    {item.options.nfcEnabled && (
                                      <div>• NFC Enabled</div>
                                    )}
                                    {item.options.engraving && (
                                      <div>
                                        • Engraving: {item.options.engraving}
                                      </div>
                                    )}
                                  </div>
                                )}

                              <div className="flex items-center gap-2 mb-2">
                                {item.originalPrice && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    ${item.originalPrice?.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-sm font-bold">
                                  ${item.unitPrice?.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1)
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-bold">
                                ${(item.unitPrice * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 pb-8 space-y-4">
              {totalSavings > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Savings</span>
                  <span className="font-semibold text-emerald-600">
                    -${totalSavings.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setOpen(false);
                  if (!user) {
                    props?.handleProccedCheckout();
                    return;
                  }
                  setShowCheckout(true);
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </SheetContent>

      <CheckoutModal open={showCheckout} onOpenChange={setShowCheckout} />
    </Sheet>
  );
}
