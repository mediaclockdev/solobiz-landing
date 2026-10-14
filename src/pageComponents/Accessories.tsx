"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Star,
  Zap,
  CreditCard,
  Smartphone,
  Tag,
  ChevronDown,
  ArrowLeft,
  Building2,
  User,
  Info,
  Image,
  X,
  Phone,
  Mail,
  Globe,
  MapPin,
  ShoppingBasket,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
//@ts-ignore
import "react-image-crop/dist/ReactCrop.css";
import {
  loadBusinessCards,
  loadDBBusinessCards,
  loadDBBusinessCardsAccessories,
} from "@/utils/cardStorage";
import { BusinessCard } from "@/types/businessCard";
import { useState, useEffect, useRef } from "react";
import {
  AccessoryPricingConfig,
  loadPricingConfig,
} from "@/utils/accessoryPricing";
import { SaleBanner } from "@/components/dashboard/SaleBanner";
import nfcCards1 from "@/assets/nfc-cards-1.jpg";
import nfcCards2 from "@/assets/nfc-cards-2.jpg";
import nfcAccessories from "@/assets/nfc-accessories-1.jpg";
import nfcStickers from "@/assets/nfc-stickers.jpg";
import soloLogo from "@/assets/solo-logo.png";
import qrCode from "@/assets/qr-code.png";
import cardBackground from "@/assets/card-background.png";
import { generateQRCodeWithLogo } from "@/utils/qrCodeGenerator";
import { loadInvoices } from "@/utils/invoiceGenerator";
import { PurchaseHistoryModal } from "@/components/dashboard/PurchaseHistoryModal";
import { ShoppingCart } from "@/components/dashboard/ShoppingCart";
import { useCart } from "@/hooks/use-cart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
//@ts-ignore
import { useNavigate, useLocation } from "@/lib/navigation";
import Orders from "@/pageComponents/dashboard/Orders";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Accessories() {
  const essentialRef = useRef<HTMLDivElement | null>(null);
  const essentialRefMobile = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState("cards");
  const [nfcCardsCount, setNfcCardsCount] = useState(0);
  const router = useRouter();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [customCardDesignType, setCustomCardDesignType] = useState<
    "image-text" | "image-image"
  >("image-text");
  const [customCardFrontImage, setCustomCardFrontImage] = useState<File | null>(
    null,
  );
  const [customCardBackImage, setCustomCardBackImage] = useState<File | null>(
    null,
  );
  const [showQRCodeOnBack, setShowQRCodeOnBack] = useState(true);

  const [qrCodePosition, setQRCodePosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  >("top-right");
  const [hideTextOnBack, setHideTextOnBack] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<AccessoryPricingConfig>();
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showCardWarningModal, setShowCardWarningModal] = useState(false);
  const [businessCards, setBusinessCards] = useState<BusinessCard[]>([]);
  const storage = getStorage();
  // Listen for pricing config changes
  useEffect(() => {
    const handleStorageChange = async () => {
      const accessories = await loadPricingConfig();
      setPricingConfig(accessories);
    };

    handleStorageChange();
    // Listen for storage events from other tabs/windows
    window.addEventListener("storage", handleStorageChange);

    // Custom event for same-tab updates
    window.addEventListener("pricingConfigUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pricingConfigUpdated", handleStorageChange);
    };
  }, []);
  const [assignedDigitalCard, setAssignedDigitalCard] = useState<string>("");
  const [selectedCard, setSelectedCard] = useState<string>("essential");
  const [optionalText, setOptionalText] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<
    "cards" | "tapsticker"
  >("cards");

  const [customCardImage, setCustomCardImage] = useState<File | null>(null);
  const [removeBlingLogo, setRemoveBlingLogo] = useState(false);

  const [tapStickerLogo, setTapStickerLogo] = useState<File | null>(null);
  const [tapStickerTextAbbr, setTapStickerTextAbbr] = useState("SOLO");
  const [tapStickerQRCode, setTapStickerQRCode] = useState<string>("");
  const [cardQRCode, setCardQRCode] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState("gray");
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  // Auto-select first available color if current selected color is out of stock
  useEffect(() => {
    if (pricingConfig?.outOfStockColors) {
      const currentIsOOS =
        !!pricingConfig.outOfStockColors[selectedColor.toLowerCase()];
      if (currentIsOOS) {
        const colors = [
          "red",
          "pink",
          "yellow",
          "green",
          "blue",
          "purple",
          "white",
          "black",
          "gray",
        ];
        const availableColor = colors.find(
          (c) => !pricingConfig.outOfStockColors?.[c],
        );
        if (availableColor) {
          setSelectedColor(availableColor);
        }
      }
    }
  }, [pricingConfig, selectedColor]);

  const isCurrentCardOOS = () => {
    if (selectedProduct === "tapsticker") {
      return !!pricingConfig?.outOfStock?.sticker;
    }
    if (selectedCard === "essential") {
      return !!pricingConfig?.outOfStock?.essential;
    }
    if (selectedCard === "infinite" || selectedCard === "personalize") {
      return !!pricingConfig?.outOfStock?.personalize;
    }
    if (selectedCard === "custom") {
      return !!pricingConfig?.outOfStock?.custom;
    }
    return false;
  };

  const isCurrentColorOOS = () => {
    return !!pricingConfig?.outOfStockColors?.[selectedColor.toLowerCase()];
  };

  const isSelectionOOS = isCurrentCardOOS() || isCurrentColorOOS();
  const [selectedMaterial, setSelectedMaterial] = useState<any>("classic");
  const [selectedQuantity, setSelectedQuantity] = useState<
    "single" | "double" | "pack"
  >("single");
  const [addCustomLogoToSticker, setAddCustomLogoToSticker] = useState(false);
  const [showMaterialComingSoon, setShowMaterialComingSoon] = useState(false);
  const [assignedDigitalCards, setAssignedDigitalCards] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);

  const [cardDetails, setCardDetails] = useState({
    firstName: "John",
    lastName: "Doeington",
    companyName: "Acme Corporation",
    additionalInfo: "CEO",
    phone: "+1 (555) 123-4567",
    email: "john@acme.com",
    website: "www.acme.com",
    address: "123 Business St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    logo: null,
    customLogo: null,
    personalizeLogo: null,
    frontLogo: null,
    backLogo: null,
    logoText: "LOGO",
    useLogoImage: true,
    assignedDigitalCard: assignedDigitalCards ?? null,
    optionalText: optionalText ?? null,
    customCardDesignType: customCardDesignType ?? null,
    showQRCodeOnBack: showQRCodeOnBack ?? null,
    qrCodePosition: qrCodePosition ?? null,
    hideTextOnBack: hideTextOnBack ?? null,
    tapStickerLogo: null,
    tapStickerText: tapStickerTextAbbr,
    tapStickerColor: selectedColor ?? null,
    cardType: "",
  });

  // Color schemes for monochrome card design
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

  const { user } = useAuth();
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageImageSide, setImageImageSide] = useState("front");
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 60,
    height: 37.5,
    x: 20,
    y: 31.25,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Helper function to format address without extra commas for blank fields
  const formatAddress = (
    address: string,
    city: string,
    state: string,
    zipCode: string,
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

  useEffect(() => {
    if (!user?.uid) return;
    const fetchCards = async () => {
      const cards = await loadDBBusinessCardsAccessories(user?.uid);
      setBusinessCards(cards);
    };
    fetchCards();
  }, [user?.uid]);

  // Generate QR code with logo or without (for text display)
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
            },
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
            },
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

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImg = (
    image: HTMLImageElement,
    crop: PixelCrop,
  ): Promise<File> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY,
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], "cropped-image.png", {
              type: "image/png",
            });
            resolve(file);
          }
        },
        "image/png",
        1,
      );
    });
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      setCustomCardImage(croppedFile);
      const url = await uploadLogoToFirebase(croppedFile, user?.uid);
      if (selectedCard == "custom") {
        if (customCardDesignType == "image-text") {
          setCardDetails((prev) => ({
            ...prev,
            customLogo: url,
          }));
        }
        if (customCardDesignType == "image-image") {
          if (imageImageSide === "front") {
            setCardDetails((prev) => ({
              ...prev,
              frontLogo: url,
            }));
          } else {
            setCardDetails((prev) => ({
              ...prev,
              backLogo: url,
            }));
          }
        }
      } else if (selectedCard == "infinite") {
        setCardDetails((prev) => ({
          ...prev,
          personalizeLogo: url,
        }));
      } else {
        setCardDetails((prev) => ({
          ...prev,
          tapStickerLogo: url,
        }));
      }
      setShowCropModal(false);
      setCropImage(null);
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  const uploadLogoToFirebase = async (file: File, userId: string) => {
    setIsLoading(true);
    const now = new Date();
    const path = `accessories/${userId}/${now.getTime()}.jpg`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    setIsLoading(false);
    return getDownloadURL(storageRef);
  };

  const products = [
    {
      id: 1,
      name: "Premium NFC Business Cards",
      description: "Professional black NFC cards with instant contact sharing",
      price: "$29.99",
      originalPrice: "$39.99",
      image: nfcCards1,
      badge: "Best Seller",
      rating: 4.8,
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      id: 2,
      name: "Smart NFC Cards - Premium",
      description: "High-quality NFC cards with advanced chip technology",
      price: "$34.99",
      originalPrice: "$44.99",
      image: nfcCards2,
      badge: "Premium",
      rating: 4.9,
      icon: <Zap className="h-5 w-5" />,
    },
    {
      id: 3,
      name: "NFC Accessories Bundle",
      description: "Smart rings and bracelets for contactless sharing",
      price: "$49.99",
      originalPrice: "$69.99",
      image: nfcAccessories,
      badge: "Bundle Deal",
      rating: 4.7,
      icon: <Smartphone className="h-5 w-5" />,
    },
    {
      id: 4,
      name: "NFC Stickers & Tags",
      description: "Adhesive NFC tags for phones and devices",
      price: "$19.99",
      originalPrice: "$24.99",
      image: nfcStickers,
      badge: "Starter Pack",
      rating: 4.6,
      icon: <Tag className="h-5 w-5" />,
    },
  ];

  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const invoices = loadInvoices();
  const paidInvoicesCount = invoices.filter(
    (inv) => inv.status === "paid",
  ).length;

  const { addItem } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const isOrdersView = location.pathname === "/dashboard/accessories/orders";
  const [orders, setOrders] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0); // total orders
  const [totalItems, setTotalItems] = useState(0); // total items (items[] + accessory items[])
  const [totalAmount, setTotalAmount] = useState(0); // total amount
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!user?.uid) return;

    const loadAllOrders = async () => {
      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("userId", "==", user?.uid),
        );

        const snapshot = await getDocs(ordersQuery);

        const orderList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const totalOrders = orderList.length;

        // ✅ SUM OF QUANTITY FROM ALL ORDERS
        const totalQuantity = orderList.reduce((sum, order: any) => {
          const items = order?.items || [];
          const qtySum = items.reduce(
            (q: number, item: any) => q + (item.quantity || 0),
            0,
          );
          return sum + qtySum;
        }, 0);

        // ✅ SUM OF TOTAL AMOUNTS OF ALL ORDERS
        const totalAmount = orderList.reduce(
          (sum, order: any) => sum + (Number(order.total) || 0),
          0,
        );

        // ✅ (OPTIONAL) SUM OF ACCESSORY INVOICE TOTALS
        const accessoryTotal = orderList.reduce((sum, order: any) => {
          const invoices = order.accessory_invoices || [];
          const invoiceTotal = invoices.reduce(
            (invSum: number, inv: any) => invSum + (inv?.totals?.total || 0),
            0,
          );
          return sum + invoiceTotal;
        }, 0);

        setOrders(orderList);
        setTotalRecords(totalOrders);
        setTotalItems(totalQuantity);
        setTotalAmount(totalAmount);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    loadAllOrders();
  }, [user?.uid]);

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchNfcCards = async () => {
      const q = query(
        collection(db, "nfc_cards"),
        where("userId", "==", user?.uid),
        where("userId", "==", user?.uid),
        where("status", "in", ["active", "disabled"]),
      );

      const snap = await getDocs(q);

      const result = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNfcCardsCount(result.length);
    };

    fetchNfcCards();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchAccessoriesCount = async () => {
      try {
        setLoading(true);

        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          where("status", "==", "active"),
        );

        const snapshot = await getDocs(q);

        let totalQuantity = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();

          if (Array.isArray(data.items)) {
            data.items.forEach((item: any) => {
              totalQuantity += Number(item.quantity || 0);
            });
          }
        });

        setCount(totalQuantity);
      } catch (error) {
        console.error("Failed to fetch accessories quantity", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccessoriesCount();
  }, [user?.uid]);

  // If on orders view, just render the Orders component
  if (isOrdersView) {
    return <Orders />;
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  const isTapSticker = selectedProduct === "tapsticker";
  const isCards = selectedProduct === "cards";
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex flex-row sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs value="accessories" className="w-auto">
              <TabsList>
                <TabsTrigger
                  value="accessories"
                  onClick={() => {
                    if (user) {
                      navigate("/dashboard/settings?tab=my-accessories");
                    }
                  }}
                >
                  My Accessory ({nfcCardsCount})
                </TabsTrigger>

                <TabsTrigger
                  value="orders"
                  onClick={() => {
                    if (user) {
                      navigate("/dashboard/accessories/orders");
                    }
                  }}
                >
                  My Orders ({totalRecords})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <ShoppingCart
              cardDetails={cardDetails}
              selectedColor={selectedColor}
              selectedCard={selectedCard}
              selectedProduct={selectedProduct}
              handleProccedCheckout={() => setShowPermissionModal(true)}
            />
          </div>

          <PurchaseHistoryModal
            open={showPurchaseHistory}
            onOpenChange={setShowPurchaseHistory}
            invoices={invoices}
          />

          {/* NFC Card Layout Section */}
          <div className="w-auto lg:w-[800px] xl:w-[800px] mx-auto grid grid-cols-1 lg:grid-cols-1 gap-6 items-start">
            {/* Card Display */}

            {/* <h2
          className="lg:hidden inline-flex items-center justify-center w-full
             text-base font-semibold
             px-4 py-2.5 rounded-lg
             bg-primary text-primary-foreground
             shadow-sm active:scale-95
             transition-all cursor-pointer"
          onClick={() => {
            if (window.innerWidth <= 1023) {
              setMobileOpen(true);
              setMobileStep("cards");
            }
          }}
        >
          Choose your card
        </h2> */}

            <div>
              {selectedProduct /* NFC Cards Display */ ? (
                <div className="flex flex-col gap-6">
                  {/* Sale Banner */}
                  {(() => {
                    //@ts-ignore
                    const isActive = pricingConfig?.specialSale?.isActive;
                    //@ts-ignore
                    const endDate = new Date(
                      pricingConfig?.specialSale?.endDate,
                    );
                    const now = new Date();
                    const isNotExpired = endDate > now;

                    return isActive && isNotExpired ? (
                      <SaleBanner
                        //@ts-ignore
                        saleName={pricingConfig?.specialSale.saleName}
                        //@ts-ignore
                        percentage={pricingConfig?.specialSale.percentage}
                        //@ts-ignore
                        endDate={pricingConfig?.specialSale.endDate}
                      />
                    ) : null;
                  })()}

                  {/* Front and Back Cards - Inline Layout */}
                  {isTapSticker && !mobileOpen ? (
                    <div className="flex flex-col sm:flex-row md:flex-row lg:flex-row xl:flex-row gap-6">
                      {/* Sticker Front */}
                      <div
                        className="gap-6"
                        ref={essentialRefMobile}
                        id="essential-card"
                      >
                        {/* Tap Sticker on Phone Display */}
                        <Label className="text-sm font-medium">Front</Label>
                        <div className="flex justify-start">
                          {/* Bottom Sticker Layout */}
                          <div className="w-[227px] h-[151px] aspect-[3/2]">
                            <div
                              className="bg-gray-900 rounded-2xl px-3 py-3 shadow-lg flex items-center justify-between h-full w-full gap-3"
                              style={{
                                background:
                                  colorSchemes[selectedColor]?.bg ||
                                  colorSchemes.black.bg,
                                color:
                                  colorSchemes[selectedColor]?.text ||
                                  colorSchemes.black.text,
                              }}
                            >
                              {/* Inner Container */}
                              <div className="flex h-full w-full gap-3 justify-center">
                                {/* LEFT – 70% */}
                                <div className="flex-[7] flex items-center justify-center">
                                  {cardDetails.useLogoImage &&
                                  cardDetails.tapStickerLogo ? (
                                    <img
                                      src={cardDetails.tapStickerLogo}
                                      alt="Logo"
                                      className="object-contain opacity-80 rounded-lg w-[200px] h-[140px]"
                                    />
                                  ) : !cardDetails.useLogoImage ? (
                                    <span className="text-[10px] font-bold text-gray-400 text-center text-lg font-semibold w-full">
                                      {tapStickerTextAbbr || "SOLO"}
                                    </span>
                                  ) : null}
                                </div>

                                {/* Right side - Solo + QR Codes */}
                                <div className="flex flex-col items-center gap-3 justify-center">
                                  {cardDetails.useLogoImage &&
                                    !cardDetails.tapStickerLogo && (
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
                        </div>
                      </div>

                      {/* Sticker Back – Professional Adhesive */}
                      <div
                        className="gap-6"
                        ref={essentialRefMobile}
                        id="essential-card"
                      >
                        <Label className="text-sm font-medium">Back</Label>

                        <div className="w-[227px] h-[151px] rounded-2xl shadow-sm overflow-hidden bg-[#e7c9a3]">
                          <div
                            className="w-full h-full rounded-2xl flex items-center justify-center"
                            style={{
                              backgroundImage: `repeating-linear-gradient(-25deg,rgba(0, 128, 0, 0.18) 0px,rgba(0, 128, 0, 0.18) 1px,transparent 1px,transparent 44px)`,
                            }}
                          >
                            <div className="w-full h-full grid grid-cols-3 gap-y-6 place-items-center rotate-[-20deg]">
                              {Array.from({ length: 9 }).map((_, i) => (
                                <span
                                  key={i}
                                  className="text-green-700 text-[11px] font-semibold tracking-widest opacity-45 select-none"
                                >
                                  ADHESIVE
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row md:flex-row lg:flex-row xl:flex-row gap-4 preview-NR">
                      {/* FRONT CARD */}
                      <div className="flex-1 space-y-2">
                        <Label className="text-sm font-medium">Front</Label>

                        <div
                          className="rounded-2xl p-0 aspect-[1.6/1] flex items-center justify-center shadow-xl"
                          style={{
                            background:
                              colorSchemes[selectedColor]?.bg ||
                              colorSchemes.black.bg,
                          }}
                        >
                          {/* Essential Card */}
                          {selectedCard === "essential" && (
                            <div className="flex items-center justify-center">
                              <div
                                className="text-3xl font-bold"
                                style={{
                                  color:
                                    colorSchemes[selectedColor]?.text ||
                                    colorSchemes.black.text,
                                }}
                              >
                                Solo
                              </div>
                            </div>
                          )}

                          {/* Infinite Card */}
                          {selectedCard === "infinite" && (
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
                                        colorSchemes[selectedColor]?.text ||
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
                                    colorSchemes[selectedColor]?.text ||
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
                          {selectedCard === "custom" &&
                            customCardDesignType === "image-text" && (
                              <div className="relative w-full h-full">
                                {cardDetails.customLogo ? (
                                  <img
                                    src={cardDetails.customLogo}
                                    alt="Custom Design"
                                    className="w-full h-full object-contain rounded-xl"
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center"
                                    style={{
                                      borderColor: "rgba(255,255,255,0.3)",
                                      color:
                                        selectedColor === "black"
                                          ? "#FFFFFF"
                                          : colorSchemes[selectedColor]?.text,
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

                          {selectedCard === "custom" &&
                            customCardDesignType === "image-image" && (
                              <div className="relative w-full h-full">
                                {cardDetails.frontLogo ? (
                                  <img
                                    src={cardDetails.frontLogo}
                                    alt="Custom Design"
                                    className="w-full h-full object-cover rounded-xl"
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center"
                                    style={{
                                      borderColor: "rgba(255,255,255,0.3)",
                                      color:
                                        selectedColor === "black"
                                          ? "#FFFFFF"
                                          : colorSchemes[selectedColor]?.text,
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
                      <div className="flex-1 space-y-2">
                        <Label className="text-sm font-medium">Back</Label>

                        <div
                          className="rounded-2xl p-6 aspect-[1.6/1] flex flex-col justify-between shadow-xl relative overflow-hidden"
                          style={{
                            background:
                              colorSchemes[selectedColor]?.bg ||
                              colorSchemes.black.bg,
                            color:
                              colorSchemes[selectedColor]?.text ||
                              colorSchemes.black.text,
                          }}
                        >
                          {/* 🔵 CUSTOM BACK - IMAGE + IMAGE */}
                          {selectedCard === "custom" &&
                          customCardDesignType === "image-image" ? (
                            <div className="absolute inset-0 rounded-2xl overflow-hidden">
                              {cardDetails.backLogo ? (
                                <img
                                  src={cardDetails.backLogo}
                                  alt="Back Card Design"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-full h-full border-2 border-dashed flex flex-col items-center justify-center text-center"
                                  style={{
                                    borderColor: "rgba(255,255,255,0.3)",
                                    color:
                                      selectedColor === "black"
                                        ? "#FFFFFF"
                                        : colorSchemes[selectedColor]?.text,
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
                                        : qrCodePosition === "bottom-left"
                                          ? "bottom-6 left-6"
                                          : qrCodePosition === "bottom-right"
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
                          {selectedCard === "custom" &&
                          customCardDesignType !== "image-image" ? (
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
                                        __html: cardDetails.firstName,
                                      }}
                                    />
                                    <div
                                      className="font-medium"
                                      dangerouslySetInnerHTML={{
                                        __html: cardDetails.additionalInfo,
                                      }}
                                    />
                                  </div>

                                  <div className="space-y-0.5 text-[10px]">
                                    <div
                                      className="opacity-90"
                                      dangerouslySetInnerHTML={{
                                        __html: cardDetails.companyName,
                                      }}
                                    />
                                    <div>{cardDetails.phone}</div>
                                    <div>{cardDetails.email}</div>
                                    <div>{cardDetails.website}</div>
                                    <div>
                                      {formatAddress(
                                        cardDetails.address,
                                        cardDetails.city,
                                        cardDetails.state,
                                        cardDetails.zipCode,
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
                          {selectedCard === "essential" && (
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
                          {selectedCard !== "custom" &&
                            selectedCard !== "essential" && (
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
                  )}

                  {isTapSticker && !mobileOpen ? (
                    <>
                      {" "}
                      <div
                        ref={essentialRef}
                        id="essential-card"
                        className="space-y-4 p-3 lg:p-6 xl:p-6 pt-3 lg:px-3 xl:px-12 rounded-lg border text-card-foreground bg-card shadow-lg card-NR bg-primary/5"
                      >
                        <div
                          className="flex items-center gap-3 mb-4"
                          ref={essentialRefMobile}
                          id="essential-card"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct("cards");
                              setSelectedCard("essential");
                            }}
                            className="p-2 bg-blue-500 hover:bg-blue-600"
                          >
                            <ArrowLeft className="h-4 w-4 text-white" />
                            <span className="text-white">Back</span>
                          </Button>
                          <h2 className="text-base lg:text-xl xl:text-xl font-semibold">
                            Customize your Tap Sticker
                          </h2>
                        </div>

                        {/* Product Info Section for Tap Sticker */}
                        <div className="space-y-4">
                          <div className="space-y-6">
                            {/* Top Right Display Toggle */}
                            <div className="space-y-3 border rounded-lg p-4 hidden">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                  Top Right Display
                                </Label>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-muted-foreground">
                                    Text Abbr.
                                  </span>
                                  <Switch
                                    checked={cardDetails.useLogoImage}
                                    onCheckedChange={(checked) =>
                                      setCardDetails({
                                        ...cardDetails,
                                        useLogoImage: checked,
                                      })
                                    }
                                  />
                                  <span className="text-sm font-medium">
                                    Logo
                                  </span>
                                </div>
                              </div>

                              {/* Text Abbreviation Input - Show when Text Abbr. is selected */}
                              {!cardDetails.useLogoImage && (
                                <div className="mt-3">
                                  <Input
                                    type="text"
                                    value={tapStickerTextAbbr}
                                    onChange={(e) => {
                                      setTapStickerTextAbbr(
                                        e.target.value.toUpperCase(),
                                      );
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        tapStickerText:
                                          e.target.value.toUpperCase(),
                                      }));
                                    }}
                                    maxLength={10}
                                    placeholder="Enter text"
                                    className="w-full"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Logo Upload - Only show when Logo mode is selected */}
                            {cardDetails.useLogoImage &&
                              addCustomLogoToSticker && (
                                <div className="space-y-3">
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    {cardDetails?.tapStickerLogo ? (
                                      <div className="relative">
                                        <img
                                          src={cardDetails?.tapStickerLogo}
                                          alt="Logo Preview"
                                          className="w-full h-32 object-contain rounded-lg mb-2"
                                        />

                                        <button
                                          //onClick={() => setTapStickerLogo(null)}
                                          onClick={() =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              tapStickerLogo: null,
                                            }))
                                          }
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                        <div className="text-sm text-gray-600">
                                          {cardDetails?.tapStickerLogo.name}
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <input
                                          type="file"
                                          accept="image/jpeg,image/jpg,image/png"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              // setTapStickerLogo(file);
                                              // const url = await uploadLogoToFirebase(
                                              //   file,
                                              //   user?.uid
                                              // );
                                              // setCardDetails((prev) => ({
                                              //   ...prev,
                                              //   tapStickerLogo: url,
                                              // }));
                                              handleImageUpload(file);
                                            }
                                          }}
                                          className="hidden"
                                          id="tap-sticker-logo-upload"
                                        />
                                        <label
                                          htmlFor="tap-sticker-logo-upload"
                                          className="cursor-pointer"
                                        >
                                          <div className="text-gray-500 mb-2">
                                            Drop your image here, or{" "}
                                            <span className="text-primary">
                                              browse
                                            </span>
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            Supports JPG, JPEG, and PNG
                                          </div>
                                        </label>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Add Logo Question - Only show when Logo mode is selected */}
                            {cardDetails.useLogoImage && (
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">
                                  Do you want to add your logo?
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                  <Button
                                    variant={
                                      !addCustomLogoToSticker
                                        ? "default"
                                        : "outline"
                                    }
                                    className="w-full"
                                    onClick={() => {
                                      setAddCustomLogoToSticker(false);
                                      setTapStickerLogo(null);
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        tapStickerLogo: null,
                                      }));
                                    }}
                                  >
                                    No
                                  </Button>
                                  <Button
                                    variant={
                                      addCustomLogoToSticker
                                        ? "default"
                                        : "outline"
                                    }
                                    className="w-full"
                                    onClick={() =>
                                      setAddCustomLogoToSticker(true)
                                    }
                                  >
                                    Yes + ${pricingConfig?.addOns.customLogoFee}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Crop Modal */}
                        {showCropModal && cropImage && (
                          <div
                            key={selectedCard}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0"
                          >
                            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">
                                  Crop Image (1.6:1 Aspect Ratio)
                                </h3>
                                <button
                                  onClick={() => {
                                    setShowCropModal(false);
                                    setCropImage(null);
                                  }}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>

                              <div className="mb-4">
                                <ReactCrop
                                  crop={crop}
                                  onChange={(c) => setCrop(c)}
                                  onComplete={(c) => setCompletedCrop(c)}
                                  aspect={1.6}
                                  minWidth={80}
                                  minHeight={50}
                                  keepSelection
                                  locked={false}
                                >
                                  <img
                                    ref={imgRef}
                                    src={cropImage}
                                    alt="Crop preview"
                                    style={{
                                      maxWidth: "100%",
                                      maxHeight: "60vh",
                                    }}
                                  />
                                </ReactCrop>
                              </div>

                              <div className="flex gap-3 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowCropModal(false);
                                    setCropImage(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleCropComplete}>
                                  Apply Crop
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Card className="bg-card shadow-lg">
                        <CardContent className="space-y-4 p-3 lg:p-6 xl:p-6 pt-3 lg:px-3 xl:px-12">
                          <div className="space-y-4">
                            {selectedProduct === "tapsticker" ? (
                              <>
                                {/* Product Info Section for Tap Sticker */}
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="text-2xl font-semibold">
                                      Solo
                                      <span className="text-outlined-card">
                                        .tap
                                      </span>{" "}
                                      <span className="italic">Sticker</span>
                                    </h3>
                                    <div className="flex items-end justify-between">
                                      <div className="flex items-end gap-2">
                                        <span className="text-xl font-bold text-foreground leading-none">
                                          4.9
                                        </span>
                                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        <span className="text-gray-400 leading-none">
                                          |
                                        </span>
                                        <span className="text-sm text-muted-foreground leading-none">
                                          1,000+ reviews
                                        </span>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        {(() => {
                                          //@ts-ignore
                                          let basePrice =
                                            pricingConfig?.stickers.essential
                                              .single;

                                          // Check if special sale is active and not expired
                                          //@ts-ignore
                                          const isSaleActive =
                                            //@ts-ignore
                                            pricingConfig?.specialSale
                                              .isActive &&
                                            //@ts-ignore
                                            new Date(
                                              pricingConfig?.specialSale
                                                .endDate,
                                            ) > new Date();

                                          // Store the true original price (before any sale)
                                          const trueOriginalPrice = basePrice;

                                          // Apply special sale discount to base price if active
                                          if (isSaleActive) {
                                            //@ts-ignore
                                            basePrice =
                                              basePrice *
                                              //@ts-ignore
                                              (1 -
                                                pricingConfig?.specialSale
                                                  .percentage /
                                                  100);
                                          }

                                          const quantities = {
                                            single: 1,
                                            double: 2,
                                            pack: 5,
                                          };
                                          const quantity =
                                            quantities[selectedQuantity];

                                          // Calculate prices
                                          const originalPriceTotal =
                                            trueOriginalPrice * quantity;
                                          const saleAdjustedPrice =
                                            basePrice * quantity;

                                          const discountPercent =
                                            selectedQuantity === "single"
                                              ? 0
                                              : //@ts-ignore
                                                selectedQuantity === "double"
                                                ? //@ts-ignore
                                                  pricingConfig?.discounts
                                                    .double
                                                : //@ts-ignore
                                                  pricingConfig?.discounts.pack;
                                          const discountedPrice =
                                            saleAdjustedPrice *
                                            (1 - discountPercent / 100);

                                          // Add custom logo fee AFTER discount (no discount applied to this fee)

                                          const logoFee = addCustomLogoToSticker
                                            ? //@ts-ignore
                                              pricingConfig?.addOns
                                                .customLogoFee * quantity
                                            : 0;
                                          const totalPrice =
                                            discountedPrice + logoFee;

                                          const discountedPricePerSticker =
                                            discountedPrice / quantity;

                                          // Show strikethrough if sale is active OR quantity discount applies
                                          const showStrikethrough =
                                            isSaleActive ||
                                            selectedQuantity !== "single";

                                          // Calculate total savings
                                          const totalSavings =
                                            originalPriceTotal -
                                            (totalPrice - logoFee);

                                          return (
                                            <>
                                              {selectedQuantity !==
                                                "single" && (
                                                <span className="text-sm text-muted-foreground">
                                                  $
                                                  {discountedPricePerSticker.toFixed(
                                                    2,
                                                  )}
                                                  /each
                                                </span>
                                              )}
                                              <div className="flex items-center gap-2">
                                                {showStrikethrough && (
                                                  <span className="text-sm font-semibold text-muted-foreground line-through">
                                                    $
                                                    {originalPriceTotal.toFixed(
                                                      2,
                                                    )}
                                                  </span>
                                                )}
                                                {addCustomLogoToSticker &&
                                                  pricingConfig?.addOns
                                                    ?.customLogoFee != null && (
                                                    <span className="text-sm font-semibold text-muted-foreground">
                                                      [$
                                                      {Number(discountedPrice)}
                                                      {" + $"}
                                                      {pricingConfig.addOns
                                                        .customLogoFee *
                                                        quantity}
                                                      ]
                                                    </span>
                                                  )}
                                                <span className="text-xl font-bold text-foreground leading-none">
                                                  ${totalPrice.toFixed(2)}
                                                </span>
                                              </div>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                  <Separator />

                                  {/* Color Selection for Tap Sticker */}
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <label className="text-sm font-medium">
                                        Color
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{
                                            backgroundColor:
                                              {
                                                red: "#EF4444",
                                                pink: "#EC4899",
                                                yellow: "#EAB308",
                                                green: "#059669",
                                                blue: "#3B82F6",
                                                purple: "#8B5CF6",
                                                white: "#FFFFFF",
                                                black: "#000000",
                                                gray: "#4f4e4f",
                                              }[selectedColor] || "#000000",
                                          }}
                                        />
                                        <span
                                          className={cn(
                                            "text-sm font-medium uppercase",
                                            (hoveredColor &&
                                              pricingConfig?.outOfStockColors?.[
                                                hoveredColor
                                              ]) ||
                                              (!hoveredColor &&
                                                pricingConfig
                                                  ?.outOfStockColors?.[
                                                  selectedColor
                                                ])
                                              ? "text-red-500 font-semibold"
                                              : "",
                                          )}
                                        >
                                          {hoveredColor
                                            ? `${hoveredColor}${pricingConfig?.outOfStockColors?.[hoveredColor] ? " - out of stock" : ""}`
                                            : `${selectedColor}${pricingConfig?.outOfStockColors?.[selectedColor] ? " - out of stock" : ""}`}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {[
                                        { name: "Red", hex: "#EF4444" },
                                        { name: "Pink", hex: "#EC4899" },
                                        { name: "Yellow", hex: "#EAB308" },
                                        { name: "Green", hex: "#059669" },
                                        { name: "Blue", hex: "#3B82F6" },
                                        { name: "Purple", hex: "#8B5CF6" },
                                        { name: "White", hex: "#FFFFFF" },
                                        { name: "Black", hex: "#000000" },
                                        { name: "Gray", hex: "#4f4e4f" },
                                      ].map((colorOption) => {
                                        const isColorOOS =
                                          !!pricingConfig?.outOfStockColors?.[
                                            colorOption.name.toLowerCase()
                                          ];
                                        return (
                                          <button
                                            key={colorOption.name}
                                            onMouseEnter={() =>
                                              setHoveredColor(
                                                colorOption.name.toLowerCase(),
                                              )
                                            }
                                            onMouseLeave={() =>
                                              setHoveredColor(null)
                                            }
                                            onClick={() => {
                                              if (isColorOOS) return;
                                              setSelectedColor(
                                                colorOption.name.toLowerCase(),
                                              );
                                              setCardDetails((prev) => ({
                                                ...prev,
                                                tapStickerColor:
                                                  colorOption.name.toLowerCase(),
                                              }));
                                            }}
                                            className={`w-6 h-6 rounded-full border-2 transition-all relative ${
                                              selectedColor ===
                                              colorOption.name.toLowerCase()
                                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                                : "border-gray-300 hover:border-gray-400"
                                            } ${
                                              isColorOOS
                                                ? "opacity-35 cursor-not-allowed"
                                                : "hover:scale-110 transition-transform cursor-pointer"
                                            }`}
                                            style={{
                                              backgroundColor: colorOption.hex,
                                            }}
                                            title={
                                              isColorOOS
                                                ? `${colorOption.name} - out of stock`
                                                : colorOption.name
                                            }
                                          >
                                            {isColorOOS && (
                                              <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-full h-[2px] bg-red-500 rotate-45" />
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Quantity Selection for Tap Sticker */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <label className="text-sm font-medium">
                                        Quantity
                                      </label>
                                      <Info className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                                      <button
                                        onClick={() =>
                                          setSelectedQuantity("single")
                                        }
                                        className={`p-2 lg:p-4 xl:p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                                          selectedQuantity === "single"
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                        }`}
                                      >
                                        <div className="text-center">
                                          <div className="font-semibold">
                                            Single
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            1 sticker
                                          </div>
                                        </div>
                                      </button>
                                      <button
                                        onClick={() =>
                                          setSelectedQuantity("double")
                                        }
                                        className={`p-2 lg:p-4 xl:p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                                          selectedQuantity === "double"
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                        }`}
                                      >
                                        <div className="text-center space-y-1">
                                          <div className="font-semibold">
                                            Double
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            2 stickers
                                          </div>
                                          <div className="text-[10px] lg:text-xs xl:text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                            SAVE 5%
                                          </div>
                                          <div className="text-[10px] lg:text-xs xl:text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                            FREE SHIPPING
                                          </div>
                                        </div>
                                      </button>
                                      <button
                                        onClick={() =>
                                          setSelectedQuantity("pack")
                                        }
                                        className={`p-2 lg:p-4 xl:p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                                          selectedQuantity === "pack"
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                        }`}
                                      >
                                        <div className="text-center space-y-1">
                                          <div className="font-semibold">
                                            Pack
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            5 stickers
                                          </div>
                                          <div className="text-[10px] lg:text-xs xl:text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                                            SAVE 20%
                                          </div>
                                          <div className="text-[10px] lg:text-xs xl:text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                            FREE SHIPPING
                                          </div>
                                        </div>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Digital Card Assignment */}
                                {/* <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Assign to Digital Business Card
                  {selectedQuantity !== "single" ? "s" : ""}
                </Label>
                {Array.from({
                  length:
                    selectedQuantity === "single"
                      ? 1
                      : selectedQuantity === "double"
                      ? 2
                      : 5,
                }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {selectedQuantity !== "single" && (
                      <span className="text-xs text-muted-foreground w-20">
                        Sticker {index + 1}:
                      </span>
                    )}
                    <Select
                      value={assignedDigitalCards[index]}
                      onValueChange={(value) => {
                        const newCards = [...assignedDigitalCards];
                        newCards[index] = value;

                        // Remove empty strings
                        const cleanedCards = newCards.filter(
                          (item) => item !== ""
                        );

                        setAssignedDigitalCards(cleanedCards);

                        setCardDetails((prev) => ({
                          ...prev,
                          assignedDigitalCard: cleanedCards,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a digital card" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {businessCards.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No cards available - Create one first
                          </SelectItem>
                        ) : (
                          businessCards.map((card) => (
                            <SelectItem
                              key={card.metadata.id}
                              value={card.metadata.id}
                            >
                              {card.profile.firstName} {card.profile.lastName}{" "}
                              {card.profile.title
                                ? `- ${card.profile.title}`
                                : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div> */}

                                {/* Add to Cart Button for Tap Stickers */}
                                <Button
                                  size="lg"
                                  className="w-full mt-6 h-14 text-lg font-semibold bg-gray-900 hover:bg-gray-800 text-white"
                                  disabled={isSelectionOOS}
                                  onClick={() => {
                                    // const requiredCount =
                                    //   selectedQuantity === "single"
                                    //     ? 1
                                    //     : selectedQuantity === "double"
                                    //     ? 2
                                    //     : 5;
                                    // const assignedCount = assignedDigitalCards
                                    //   .slice(0, requiredCount)
                                    //   .filter((c) => c && c !== "").length;
                                    // if (assignedCount < requiredCount) {
                                    //   setShowCardWarningModal(true);
                                    //   return;
                                    // }

                                    //@ts-ignore
                                    let basePrice =
                                      pricingConfig?.stickers.essential.single;

                                    //@ts-ignore
                                    const isSaleActive =
                                      //@ts-ignore
                                      pricingConfig?.specialSale.isActive &&
                                      //@ts-ignore
                                      new Date(
                                        pricingConfig?.specialSale.endDate,
                                      ) > new Date();

                                    const trueOriginalPrice = basePrice;
                                    if (isSaleActive) {
                                      //@ts-ignore
                                      basePrice =
                                        basePrice *
                                        //@ts-ignore
                                        (1 -
                                          pricingConfig?.specialSale
                                            .percentage /
                                            100);
                                    }

                                    const quantities = {
                                      single: 1,
                                      double: 2,
                                      pack: 5,
                                    };
                                    const quantity =
                                      quantities[selectedQuantity];

                                    const originalPriceTotal =
                                      trueOriginalPrice * quantity;
                                    const saleAdjustedPrice =
                                      basePrice * quantity;

                                    const discountPercent =
                                      selectedQuantity === "single"
                                        ? 0
                                        : //@ts-ignore
                                          selectedQuantity === "double"
                                          ? //@ts-ignore
                                            pricingConfig?.discounts.double
                                          : //@ts-ignore
                                            pricingConfig?.discounts.pack;
                                    const discountedPrice =
                                      saleAdjustedPrice *
                                      (1 - discountPercent / 100);

                                    const logoFee = addCustomLogoToSticker
                                      ? //@ts-ignore
                                        pricingConfig?.addOns.customLogoFee *
                                        quantity
                                      : 0;
                                    const totalPrice =
                                      discountedPrice + logoFee;

                                    addItem({
                                      type: "tap-sticker",
                                      name: `Solo Tap Sticker (${quantity}x)`,
                                      quantity: quantity,
                                      unitPrice: totalPrice / quantity,
                                      originalPrice:
                                        originalPriceTotal / quantity,
                                      options: {
                                        customLogo: addCustomLogoToSticker,
                                      },
                                      //@ts-ignore
                                      image: nfcStickers,
                                      selectedCard: "sticker",
                                      cardDetails: {
                                        firstName: cardDetails.firstName,
                                        lastName: cardDetails.lastName,
                                        companyName: cardDetails.companyName,
                                        additionalInfo:
                                          cardDetails.additionalInfo,
                                        phone: cardDetails.phone,
                                        email: cardDetails.email,
                                        website: cardDetails.website,
                                        address: cardDetails.address,
                                        city: cardDetails.city,
                                        state: cardDetails.state,
                                        zipCode: cardDetails.zipCode,
                                        logo: cardDetails.logo,
                                        customLogo: cardDetails.customLogo,
                                        personalizeLogo:
                                          cardDetails.personalizeLogo,
                                        logoText: cardDetails.logoText,
                                        frontLogo: cardDetails.frontLogo,
                                        backLogo: cardDetails.backLogo,
                                        useLogoImage: cardDetails.useLogoImage,
                                        assignedDigitalCard:
                                          cardDetails.assignedDigitalCard,
                                        optionalText: optionalText,
                                        customCardDesignType:
                                          customCardDesignType,
                                        showQRCodeOnBack:
                                          cardDetails.showQRCodeOnBack,
                                        qrCodePosition:
                                          cardDetails.qrCodePosition,
                                        hideTextOnBack:
                                          cardDetails.hideTextOnBack,
                                        tapStickerLogo:
                                          cardDetails.tapStickerLogo,
                                        tapStickerText:
                                          cardDetails.tapStickerText,
                                        tapStickerColor:
                                          cardDetails.tapStickerColor,
                                        cardType: "Stickers",
                                      },
                                    });
                                  }}
                                >
                                  <ShoppingBasket className="h-5 w-5" />
                                  {isSelectionOOS
                                    ? "Out of Stock"
                                    : "Add to Cart"}
                                </Button>

                                {/* Assignment Info */}
                                <p className="text-center text-muted-foreground text-sm mt-4">
                                  {/* All orders must be assigned to an existing digital business
                card. */}
                                  After placing your order, create a Free! card
                                  profile if you do not already have one.
                                  <br />
                                  <a
                                    href="/"
                                    className="text-primary hover:underline"
                                  >
                                    Create your free digital card here
                                  </a>
                                </p>

                                {/* Crop Modal */}
                                {showCropModal && cropImage && (
                                  <div
                                    key={selectedCard}
                                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0"
                                  >
                                    <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                                      <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">
                                          Crop Image (1.6:1 Aspect Ratio)
                                        </h3>
                                        <button
                                          onClick={() => {
                                            setShowCropModal(false);
                                            setCropImage(null);
                                          }}
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          <X className="h-5 w-5" />
                                        </button>
                                      </div>

                                      <div className="mb-4">
                                        <ReactCrop
                                          crop={crop}
                                          onChange={(c) => setCrop(c)}
                                          onComplete={(c) =>
                                            setCompletedCrop(c)
                                          }
                                          aspect={1.6}
                                          minWidth={80}
                                          minHeight={50}
                                          keepSelection
                                          locked={false}
                                        >
                                          <img
                                            ref={imgRef}
                                            src={cropImage}
                                            alt="Crop preview"
                                            style={{
                                              maxWidth: "100%",
                                              maxHeight: "60vh",
                                            }}
                                          />
                                        </ReactCrop>
                                      </div>

                                      <div className="flex gap-3 justify-end">
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setShowCropModal(false);
                                            setCropImage(null);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button onClick={handleCropComplete}>
                                          Apply Crop
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : selectedCard === "custom" ? (
                              <>
                                <div className="flex items-center gap-3 mb-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedCard("essential")}
                                    className="p-2 bg-blue-500 hover:bg-blue-600"
                                  >
                                    <ArrowLeft className="h-4 w-4 text-white" />
                                    <span className="text-white">Back</span>
                                  </Button>
                                  <h2 className="text-base lg:text-xl xl:text-xl font-semibold">
                                    Customize your card
                                  </h2>
                                </div>
                                <div className="space-y-4">
                                  {/* Card Design Type Selection */}
                                  <div className="space-y-3">
                                    <label className="font-medium">
                                      Select Card Design Type
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <Button
                                        variant={
                                          customCardDesignType === "image-text"
                                            ? "default"
                                            : "outline"
                                        }
                                        onClick={() =>
                                          setCustomCardDesignType("image-text")
                                        }
                                        className="h-auto flex-col py-4"
                                      >
                                        <span className="font-semibold">
                                          Image + Text
                                        </span>
                                        <span className="text-xs mt-1 opacity-80">
                                          Front: Image, Back: Text
                                        </span>
                                      </Button>
                                      <Button
                                        variant={
                                          customCardDesignType === "image-image"
                                            ? "default"
                                            : "outline"
                                        }
                                        onClick={() =>
                                          setCustomCardDesignType("image-image")
                                        }
                                        className="h-auto flex-col py-4"
                                      >
                                        <span className="font-semibold">
                                          Image + Image
                                        </span>
                                        <span className="text-xs mt-1 opacity-80">
                                          Front: Image, Back: Image
                                        </span>
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Hide Text toggle for Image + Text design */}
                                  {customCardDesignType === "image-text" && (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id="hideTextOnBack"
                                        checked={hideTextOnBack}
                                        onChange={(e) => {
                                          const value = e.target.checked;

                                          setHideTextOnBack(value);
                                          setCardDetails((prev) => ({
                                            ...prev,
                                            hideTextOnBack: value,
                                          }));
                                        }}
                                        //onChange={(e) => setHideTextOnBack(e.target.checked)}
                                        className="rounded"
                                      />
                                      <label
                                        htmlFor="hideTextOnBack"
                                        className="text-sm font-medium"
                                      >
                                        Hide text on back
                                      </label>
                                    </div>
                                  )}

                                  {customCardDesignType === "image-text" ? (
                                    <>
                                      {/* Top Card Design Upload */}
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <Image className="h-4 w-4 text-gray-600" />
                                          <label className="font-medium">
                                            Top Card Design
                                          </label>
                                        </div>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                          {cardDetails.customLogo ? (
                                            <div className="relative">
                                              <img
                                                src={cardDetails.customLogo}
                                                alt="Preview"
                                                className="w-full h-32 object-contain rounded-lg mb-2"
                                              />
                                              <button
                                                //onClick={() => setCustomCardImage(null)}
                                                onClick={() =>
                                                  setCardDetails((prev) => ({
                                                    ...prev,
                                                    customLogo: null,
                                                  }))
                                                }
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                              <div className="text-sm text-gray-600">
                                                {cardDetails?.customLogo?.name}
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                  const file =
                                                    e.target.files?.[0];
                                                  if (file) {
                                                    handleImageUpload(file);
                                                  }
                                                }}
                                                className="hidden"
                                                id="custom-card-upload"
                                              />
                                              <label
                                                htmlFor="custom-card-upload"
                                                className="cursor-pointer"
                                              >
                                                <div className="text-gray-500">
                                                  Upload your full card design
                                                  or{" "}
                                                  <span className="text-red-500">
                                                    browse
                                                  </span>
                                                </div>
                                                <div className="text-sm text-gray-400 mt-1">
                                                  Covers entire front card area
                                                  • JPG, JPEG, PNG
                                                </div>
                                              </label>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {/* Front Image Upload */}
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <Image className="h-4 w-4 text-gray-600" />
                                          <label className="font-medium">
                                            Front Card Image
                                          </label>
                                        </div>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                          {cardDetails.frontLogo ? (
                                            <div className="relative">
                                              <img
                                                src={cardDetails.frontLogo}
                                                alt="Front Preview"
                                                className="w-full h-32 object-contain rounded-lg mb-2"
                                              />
                                              <button
                                                //onClick={() => setCustomCardFrontImage(null)}
                                                onClick={() =>
                                                  setCardDetails((prev) => ({
                                                    ...prev,
                                                    frontLogo: null,
                                                  }))
                                                }
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                              <div className="text-sm text-gray-600">
                                                {cardDetails.frontLogo.name}
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                  const file =
                                                    e.target.files?.[0];
                                                  setImageImageSide("front");
                                                  if (file) {
                                                    handleImageUpload(file);
                                                    // setCustomCardFrontImage(file);
                                                    // const url = await uploadLogoToFirebase(
                                                    //   file,
                                                    //   user?.uid
                                                    // );
                                                    // setCardDetails((prev) => ({
                                                    //   ...prev,
                                                    //   frontLogo: url,
                                                    // }));
                                                  }
                                                }}
                                                className="hidden"
                                                id="custom-card-front-upload"
                                              />
                                              <label
                                                htmlFor="custom-card-front-upload"
                                                className="cursor-pointer"
                                              >
                                                <div className="text-gray-500">
                                                  Upload front card image or{" "}
                                                  <span className="text-red-500">
                                                    browse
                                                  </span>
                                                </div>
                                                <div className="text-sm text-gray-400 mt-1">
                                                  JPG, JPEG, PNG
                                                </div>
                                              </label>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Back Image Upload */}
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <Image className="h-4 w-4 text-gray-600" />
                                          <label className="font-medium">
                                            Back Card Image
                                          </label>
                                        </div>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                          {cardDetails.backLogo ? (
                                            <div className="relative">
                                              <img
                                                src={cardDetails.backLogo}
                                                alt="Back Preview"
                                                className="w-full h-32 object-contain rounded-lg mb-2"
                                              />
                                              <button
                                                //onClick={() => setCustomCardBackImage(null)}
                                                onClick={() =>
                                                  setCardDetails((prev) => ({
                                                    ...prev,
                                                    backLogo: null,
                                                  }))
                                                }
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                              <div className="text-sm text-gray-600">
                                                {cardDetails.backLogo.name}
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                  const file =
                                                    e.target.files?.[0];
                                                  setImageImageSide("back");
                                                  if (file) {
                                                    handleImageUpload(file);
                                                    // setCustomCardBackImage(file);
                                                    // const url = await uploadLogoToFirebase(
                                                    //   file,
                                                    //   user?.uid
                                                    // );
                                                    // setCardDetails((prev) => ({
                                                    //   ...prev,
                                                    //   backLogo: url,
                                                    // }));
                                                  }
                                                }}
                                                className="hidden"
                                                id="custom-card-back-upload"
                                              />
                                              <label
                                                htmlFor="custom-card-back-upload"
                                                className="cursor-pointer"
                                              >
                                                <div className="text-gray-500">
                                                  Upload back card image or{" "}
                                                  <span className="text-red-500">
                                                    browse
                                                  </span>
                                                </div>
                                                <div className="text-sm text-gray-400 mt-1">
                                                  JPG, JPEG, PNG
                                                </div>
                                              </label>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* QR Code Options */}
                                      <div className="space-y-3"></div>
                                    </>
                                  )}

                                  {/* Crop Modal */}
                                  {showCropModal && cropImage && (
                                    <div
                                      key={selectedCard}
                                      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0"
                                    >
                                      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                                        <div className="flex justify-between items-center mb-4">
                                          <h3 className="text-lg font-semibold">
                                            Crop Image (1.6:1 Aspect Ratio)
                                          </h3>
                                          <button
                                            onClick={() => {
                                              setShowCropModal(false);
                                              setCropImage(null);
                                            }}
                                            className="text-gray-500 hover:text-gray-700"
                                          >
                                            <X className="h-5 w-5" />
                                          </button>
                                        </div>

                                        <div className="mb-4">
                                          <ReactCrop
                                            crop={crop}
                                            onChange={(c) => setCrop(c)}
                                            onComplete={(c) =>
                                              setCompletedCrop(c)
                                            }
                                            aspect={1.6}
                                            minWidth={80}
                                            minHeight={50}
                                            keepSelection
                                            locked={false}
                                          >
                                            <img
                                              ref={imgRef}
                                              src={cropImage}
                                              alt="Crop preview"
                                              style={{
                                                maxWidth: "100%",
                                                maxHeight: "60vh",
                                              }}
                                            />
                                          </ReactCrop>
                                        </div>

                                        <div className="flex gap-3 justify-end">
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setShowCropModal(false);
                                              setCropImage(null);
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                          <Button onClick={handleCropComplete}>
                                            Apply Crop
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Form Grid - Only for image-text design */}
                                  {customCardDesignType === "image-text" &&
                                    !hideTextOnBack && (
                                      <>
                                        {/* Form Grid - 2 columns on desktop */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* Company Name Field */}
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Building2 className="h-4 w-4 text-gray-600" />
                                              <label className="font-medium text-sm">
                                                Company name
                                              </label>
                                            </div>
                                            <Input
                                              placeholder="Company name"
                                              value={cardDetails.companyName}
                                              onChange={(e) =>
                                                setCardDetails((prev) => ({
                                                  ...prev,
                                                  companyName: e.target.value,
                                                }))
                                              }
                                            />
                                          </div>

                                          {/* Name Field */}
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <User className="h-4 w-4 text-gray-600" />
                                              <label className="font-medium text-sm">
                                                Name
                                              </label>
                                            </div>
                                            <Input
                                              placeholder="First name"
                                              value={cardDetails.firstName}
                                              onChange={(e) =>
                                                setCardDetails((prev) => ({
                                                  ...prev,
                                                  firstName: e.target.value,
                                                }))
                                              }
                                            />
                                          </div>

                                          {/* Additional Information */}
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Info className="h-4 w-4 text-gray-600" />
                                              <label className="font-medium text-sm">
                                                Additional information
                                              </label>
                                            </div>
                                            <Input
                                              placeholder="Position or title"
                                              value={cardDetails.additionalInfo}
                                              onChange={(e) =>
                                                setCardDetails((prev) => ({
                                                  ...prev,
                                                  additionalInfo:
                                                    e.target.value,
                                                }))
                                              }
                                            />
                                          </div>

                                          {/* Phone Field */}
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Phone className="h-4 w-4 text-gray-600" />
                                              <label className="font-medium text-sm">
                                                Phone number
                                              </label>
                                            </div>
                                            <Input
                                              placeholder="Phone number"
                                              value={cardDetails.phone}
                                              onChange={(e) =>
                                                setCardDetails((prev) => ({
                                                  ...prev,
                                                  phone: e.target.value,
                                                }))
                                              }
                                            />
                                          </div>

                                          {/* Email Field */}
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Mail className="h-4 w-4 text-gray-600" />
                                              <label className="font-medium text-sm">
                                                Email address
                                              </label>
                                            </div>
                                            <Input
                                              placeholder="Email address"
                                              value={cardDetails.email}
                                              onChange={(e) =>
                                                setCardDetails((prev) => ({
                                                  ...prev,
                                                  email: e.target.value,
                                                }))
                                              }
                                            />
                                          </div>

                                          {/* Website Field */}
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Globe className="h-4 w-4 text-gray-600" />
                                              <label className="font-medium text-sm">
                                                Website
                                              </label>
                                            </div>
                                            <Input
                                              placeholder="Website URL"
                                              value={cardDetails.website}
                                              onChange={(e) =>
                                                setCardDetails((prev) => ({
                                                  ...prev,
                                                  website: e.target.value,
                                                }))
                                              }
                                            />
                                          </div>
                                        </div>

                                        {/* Address Fields - Full width */}
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-600" />
                                            <label className="font-medium text-sm">
                                              Address
                                            </label>
                                          </div>
                                          <Input
                                            placeholder="Street address"
                                            value={cardDetails.address}
                                            onChange={(e) =>
                                              setCardDetails((prev) => ({
                                                ...prev,
                                                address: e.target.value,
                                              }))
                                            }
                                          />
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <Input
                                              placeholder="City"
                                              value={cardDetails.city}
                                              onChange={(e) =>
                                                setCardDetails((prev) => ({
                                                  ...prev,
                                                  city: e.target.value,
                                                }))
                                              }
                                            />
                                            <Input
                                              placeholder="State"
                                              value={cardDetails.state}
                                              onChange={(e) =>
                                                setCardDetails((prev) => ({
                                                  ...prev,
                                                  state: e.target.value,
                                                }))
                                              }
                                            />
                                            <Input
                                              placeholder="ZIP Code"
                                              value={cardDetails.zipCode}
                                              onChange={(e) =>
                                                setCardDetails((prev) => ({
                                                  ...prev,
                                                  zipCode: e.target.value,
                                                }))
                                              }
                                            />
                                          </div>
                                        </div>
                                      </>
                                    )}
                                </div>
                              </>
                            ) : selectedCard === "infinite" ? (
                              <>
                                <div className="flex items-center gap-3 mb-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedCard("essential")}
                                    className="p-2 bg-blue-500 hover:bg-blue-600"
                                  >
                                    <ArrowLeft className="h-4 w-4 text-white" />
                                    <span className="text-white">Back</span>
                                  </Button>
                                  <h2 className="text-xl font-semibold">
                                    Personalize your card
                                  </h2>
                                </div>
                                <div className="space-y-4">
                                  {/* Form Grid - 2 columns on desktop */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Company Name Field */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-gray-600" />
                                        <label className="font-medium text-sm">
                                          Company name
                                        </label>
                                      </div>
                                      <Input
                                        placeholder="Company name"
                                        value={cardDetails.companyName}
                                        onChange={(e) =>
                                          setCardDetails((prev) => ({
                                            ...prev,
                                            companyName: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>

                                    {/* Name Fields */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-600" />
                                        <label className="font-medium text-sm">
                                          Name
                                        </label>
                                      </div>
                                      <Input
                                        placeholder="First name"
                                        value={cardDetails.firstName}
                                        onChange={(e) =>
                                          setCardDetails((prev) => ({
                                            ...prev,
                                            firstName: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>

                                    {/* Additional Information - spans both columns on desktop */}
                                    <div className="space-y-2 md:col-span-2">
                                      <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-gray-600" />
                                        <label className="font-medium text-sm">
                                          Additional information
                                        </label>
                                      </div>
                                      <Input
                                        placeholder="Position or title"
                                        value={cardDetails.additionalInfo}
                                        onChange={(e) =>
                                          setCardDetails((prev) => ({
                                            ...prev,
                                            additionalInfo: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>
                                  </div>

                                  {/* Logo/Text Toggle */}
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Image className="h-4 w-4 text-gray-600" />
                                        <label className="font-medium">
                                          Top Right Display
                                        </label>
                                      </div>

                                      <div className="flex items-center gap-2 text-sm">
                                        <span
                                          className={
                                            !cardDetails.useLogoImage
                                              ? "font-medium"
                                              : "text-muted-foreground"
                                          }
                                        >
                                          Text Abbr.
                                        </span>

                                        <Switch
                                          checked={cardDetails.useLogoImage}
                                          onCheckedChange={(checked) =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              useLogoImage: checked,
                                            }))
                                          }
                                        />

                                        <span
                                          className={
                                            cardDetails.useLogoImage
                                              ? "font-medium"
                                              : "text-muted-foreground"
                                          }
                                        >
                                          Logo
                                        </span>
                                      </div>
                                    </div>

                                    {cardDetails.useLogoImage ? (
                                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                        {cardDetails.personalizeLogo ? (
                                          <div className="relative">
                                            <img
                                              src={cardDetails.personalizeLogo}
                                              alt="Logo Preview"
                                              className="w-full h-32 object-contain rounded-lg mb-2"
                                            />

                                            {/* Close Icon */}
                                            <button
                                              onClick={() =>
                                                setCardDetails((prev) => ({
                                                  ...prev,
                                                  personalizeLogo: null,
                                                }))
                                              }
                                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>

                                            {/* File Name */}
                                            <div className="text-sm text-gray-600">
                                              {
                                                cardDetails?.personalizeLogo
                                                  ?.name
                                              }
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={async (e) => {
                                                const file =
                                                  e.target.files?.[0];
                                                if (file) {
                                                  handleImageUpload(file);
                                                  // const url = await uploadLogoToFirebase(
                                                  //   file,
                                                  //   user?.uid
                                                  // );

                                                  // setCardDetails((prev) => ({
                                                  //   ...prev,
                                                  //   logo: url,
                                                  // }));
                                                }
                                              }}
                                              className="hidden"
                                              id="logo-upload"
                                            />

                                            <label
                                              htmlFor="logo-upload"
                                              className="cursor-pointer"
                                            >
                                              <div className="text-gray-500">
                                                Drop your image here, or{" "}
                                                <span className="text-red-500">
                                                  browse
                                                </span>
                                              </div>
                                              <div className="text-sm text-gray-400 mt-1">
                                                Supports JPG, JPEG, and PNG
                                              </div>
                                            </label>
                                          </>
                                        )}
                                      </div>
                                    ) : (
                                      <Input
                                        placeholder="Company name abbreviation here"
                                        value={cardDetails.logoText}
                                        onChange={(e) =>
                                          setCardDetails((prev) => ({
                                            ...prev,
                                            logoText: e.target.value,
                                          }))
                                        }
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Crop Modal */}
                                {showCropModal && cropImage && (
                                  <div
                                    key={selectedCard}
                                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                                  >
                                    <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                                      <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">
                                          Crop Image (1.6:1 Aspect Ratio)
                                        </h3>
                                        <button
                                          onClick={() => {
                                            setShowCropModal(false);
                                            setCropImage(null);
                                          }}
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          <X className="h-5 w-5" />
                                        </button>
                                      </div>

                                      <div className="mb-4">
                                        <ReactCrop
                                          crop={crop}
                                          onChange={(c) => setCrop(c)}
                                          onComplete={(c) =>
                                            setCompletedCrop(c)
                                          }
                                          aspect={1.6}
                                          minWidth={80}
                                          minHeight={50}
                                          keepSelection
                                          locked={false}
                                        >
                                          <img
                                            ref={imgRef}
                                            src={cropImage}
                                            alt="Crop preview"
                                            style={{
                                              maxWidth: "100%",
                                              maxHeight: "60vh",
                                            }}
                                          />
                                        </ReactCrop>
                                      </div>

                                      <div className="flex gap-3 justify-end">
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setShowCropModal(false);
                                            setCropImage(null);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button onClick={handleCropComplete}>
                                          Apply Crop
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <h2 className="text-xl font-semibold mb-4">
                                  Choose your card
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Essential Card */}
                                  <div
                                    className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                      selectedCard === "essential" &&
                                      selectedProduct === "cards"
                                        ? "border-primary/30 bg-primary/5"
                                        : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                    } ${pricingConfig?.outOfStock?.essential ? "opacity-60" : ""}`}
                                    style={{
                                      backgroundImage: `url(/lovable-uploads/essential-card-product.png)`,
                                      backgroundPosition: "right center",
                                      backgroundSize: "35% auto",
                                      backgroundRepeat: "no-repeat",
                                      backgroundBlendMode: "soft-light",
                                    }}
                                    onClick={() => {
                                      if (
                                        pricingConfig?.outOfStock?.essential
                                      ) {
                                        alert(
                                          "Essential Out Of Stock Card/color coming Soon!",
                                        );
                                        return;
                                      }
                                      setSelectedColor("gray");
                                      setSelectedCard("essential");
                                      setSelectedProduct("cards");
                                    }}
                                  >
                                    <div>
                                      <div className="flex justify-between items-start mr-[35%]">
                                        <h3 className="font-semibold text-lg">
                                          Solo
                                          <span className="text-outlined-card">
                                            .card
                                          </span>{" "}
                                          <span className="italic">
                                            Essential
                                          </span>
                                        </h3>
                                        {pricingConfig?.outOfStock
                                          ?.essential && (
                                          <Badge
                                            variant="destructive"
                                            className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                          >
                                            Out of Stock
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                        The last business card you'll ever need.
                                        It comes pre-designed with your
                                        information loaded on the card and the
                                        QR code.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Infinite Card */}
                                  <div
                                    className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                      selectedCard === "infinite" &&
                                      selectedProduct === "cards"
                                        ? "border-primary/30 bg-primary/5"
                                        : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                    }`}
                                    style={{
                                      backgroundImage: `url(/lovable-uploads/Personalize.png)`,
                                      backgroundPosition: "right center",
                                      backgroundSize: "35% auto",
                                      backgroundRepeat: "no-repeat",
                                      backgroundBlendMode: "soft-light",
                                    }}
                                    onClick={() => {
                                      if (
                                        pricingConfig?.outOfStock?.personalize
                                      ) {
                                        alert(
                                          "Personal Out Of Stock Card/color coming Soon!",
                                        );
                                        return;
                                      }
                                      setSelectedColor("gray");
                                      setSelectedCard("infinite");
                                      setSelectedProduct("cards");
                                    }}
                                  >
                                    <div>
                                      <div className="flex justify-between items-start mr-[35%]">
                                        <h3 className="font-semibold text-lg">
                                          Solo
                                          <span className="text-outlined-card">
                                            .card
                                          </span>{" "}
                                          <span className="italic">
                                            Personalize
                                          </span>
                                        </h3>
                                        {pricingConfig?.outOfStock
                                          ?.personalize && (
                                          <Badge
                                            variant="destructive"
                                            className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                          >
                                            Out of Stock
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                        Personalize your card and make an
                                        impression. Submit your company and
                                        contact information, including your logo
                                        if required.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Custom Card */}
                                  <div
                                    className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                      selectedCard === "custom" &&
                                      selectedProduct === "cards"
                                        ? "border-primary/30 bg-primary/5"
                                        : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                    }`}
                                    style={{
                                      backgroundImage: `url(/lovable-uploads/custom-card-product.png)`,
                                      backgroundPosition: "right center",
                                      backgroundSize: "35% auto",
                                      backgroundRepeat: "no-repeat",
                                      backgroundBlendMode: "soft-light",
                                    }}
                                    onClick={() => {
                                      if (pricingConfig?.outOfStock?.custom) {
                                        alert(
                                          "Custom Out Of Stock Card/color coming Soon!",
                                        );
                                        return;
                                      }
                                      setSelectedColor("gray");
                                      setSelectedCard("custom");
                                      setSelectedProduct("cards");
                                    }}
                                  >
                                    <div>
                                      <div className="flex justify-between items-start mr-[35%]">
                                        <h3 className="font-semibold text-lg">
                                          Solo
                                          <span className="text-outlined-card">
                                            .card
                                          </span>{" "}
                                          <span className="italic">Custom</span>
                                        </h3>
                                        {pricingConfig?.outOfStock?.custom && (
                                          <Badge
                                            variant="destructive"
                                            className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                          >
                                            Out of Stock
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                        Your branding, no limits. Just upload an
                                        image with your design. For best custom
                                        results, use a monotone color design.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Tap Sticker */}
                                  <div
                                    className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                      selectedProduct === "tapsticker"
                                        ? "border-primary/30 bg-primary/5"
                                        : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                    } ${pricingConfig?.outOfStock?.sticker ? "opacity-60" : ""}`}
                                    style={{
                                      backgroundImage: `url(/lovable-uploads/tap-sticker-product.png)`,
                                      backgroundPosition: "right center",
                                      backgroundSize: "35% auto",
                                      backgroundRepeat: "no-repeat",
                                      backgroundBlendMode: "soft-light",
                                    }}
                                    onClick={() => {
                                      if (pricingConfig?.outOfStock?.sticker) {
                                        alert(
                                          "Sticker Out Of Stock Card/color coming Soon!",
                                        );
                                        return;
                                      }
                                      setSelectedColor("gray");
                                      setSelectedProduct("tapsticker");
                                      setSelectedCard("essential");
                                    }}
                                  >
                                    <div>
                                      <div className="flex justify-between items-start mr-[35%]">
                                        <h3 className="font-semibold text-lg">
                                          Solo
                                          <span className="text-outlined-card">
                                            .tap
                                          </span>{" "}
                                          <span className="italic">
                                            Sticker
                                          </span>
                                        </h3>
                                        {pricingConfig?.outOfStock?.sticker && (
                                          <Badge
                                            variant="destructive"
                                            className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                          >
                                            Out of Stock
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                        With a Tap Sticker, you can easily share
                                        your contact information and more. Just
                                        one scan or tap away from a new
                                        connection.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : selectedCard === "custom" && !mobileOpen ? (
                    <div
                      ref={essentialRef}
                      id="essential-card"
                      className="space-y-4 p-3 lg:p-6 xl:p-6 pt-3 lg:px-3 xl:px-12 rounded-lg border text-card-foreground bg-card shadow-lg card-NR bg-primary/5"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCard("essential")}
                          className="p-2 bg-blue-500 hover:bg-blue-600"
                        >
                          <ArrowLeft className="h-4 w-4 text-white" />
                          <span className="text-white">Back</span>
                        </Button>
                        <h2 className="text-xl font-semibold">
                          Customize your card
                        </h2>
                      </div>
                      <div className="space-y-4">
                        {/* Card Design Type Selection */}
                        <div className="space-y-3">
                          <label className="font-medium">
                            Select Card Design Type
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button
                              variant={
                                customCardDesignType === "image-text"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                setCustomCardDesignType("image-text")
                              }
                              className="h-auto flex-col py-4"
                            >
                              <span className="font-semibold">
                                Image + Text
                              </span>
                              <span className="text-xs mt-1 opacity-80">
                                Front: Image, Back: Text
                              </span>
                            </Button>
                            <Button
                              variant={
                                customCardDesignType === "image-image"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                setCustomCardDesignType("image-image")
                              }
                              className="h-auto flex-col py-4"
                            >
                              <span className="font-semibold">
                                Image + Image
                              </span>
                              <span className="text-xs mt-1 opacity-80">
                                Front: Image, Back: Image
                              </span>
                            </Button>
                          </div>
                        </div>

                        {/* Hide Text toggle for Image + Text design */}
                        {customCardDesignType === "image-text" && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="hideTextOnBack"
                              checked={hideTextOnBack}
                              onChange={(e) => {
                                const value = e.target.checked;

                                setHideTextOnBack(value);
                                setCardDetails((prev) => ({
                                  ...prev,
                                  hideTextOnBack: value,
                                }));
                              }}
                              //onChange={(e) => setHideTextOnBack(e.target.checked)}
                              className="rounded"
                            />
                            <label
                              htmlFor="hideTextOnBack"
                              className="text-sm font-medium"
                            >
                              Hide text on back
                            </label>
                          </div>
                        )}

                        {customCardDesignType === "image-text" ? (
                          <>
                            {/* Top Card Design Upload */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Image className="h-4 w-4 text-gray-600" />
                                <label className="font-medium">
                                  Top Card Design
                                </label>
                              </div>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                {cardDetails.customLogo ? (
                                  <div className="relative">
                                    <img
                                      src={cardDetails.customLogo}
                                      alt="Preview"
                                      className="w-full h-32 object-contain rounded-lg mb-2"
                                    />
                                    <button
                                      //onClick={() => setCustomCardImage(null)}
                                      onClick={() =>
                                        setCardDetails((prev) => ({
                                          ...prev,
                                          customLogo: null,
                                        }))
                                      }
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                    <div className="text-sm text-gray-600">
                                      {cardDetails?.customLogo?.name}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleImageUpload(file);
                                        }
                                      }}
                                      className="hidden"
                                      id="custom-card-upload"
                                    />
                                    <label
                                      htmlFor="custom-card-upload"
                                      className="cursor-pointer"
                                    >
                                      <div className="text-gray-500">
                                        Upload your full card design or{" "}
                                        <span className="text-red-500">
                                          browse
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-400 mt-1">
                                        Covers entire front card area • JPG,
                                        JPEG, PNG
                                      </div>
                                    </label>
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Front Image Upload */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Image className="h-4 w-4 text-gray-600" />
                                <label className="font-medium">
                                  Front Card Image
                                </label>
                              </div>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                {cardDetails.frontLogo ? (
                                  <div className="relative">
                                    <img
                                      src={cardDetails.frontLogo}
                                      alt="Front Preview"
                                      className="w-full h-32 object-contain rounded-lg mb-2"
                                    />
                                    <button
                                      //onClick={() => setCustomCardFrontImage(null)}
                                      onClick={() =>
                                        setCardDetails((prev) => ({
                                          ...prev,
                                          frontLogo: null,
                                        }))
                                      }
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                    <div className="text-sm text-gray-600">
                                      {cardDetails.frontLogo.name}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        setImageImageSide("front");
                                        if (file) {
                                          handleImageUpload(file);
                                          // setCustomCardFrontImage(file);
                                          // const url = await uploadLogoToFirebase(
                                          //   file,
                                          //   user?.uid
                                          // );
                                          // setCardDetails((prev) => ({
                                          //   ...prev,
                                          //   frontLogo: url,
                                          // }));
                                        }
                                      }}
                                      className="hidden"
                                      id="custom-card-front-upload"
                                    />
                                    <label
                                      htmlFor="custom-card-front-upload"
                                      className="cursor-pointer"
                                    >
                                      <div className="text-gray-500">
                                        Upload front card image or{" "}
                                        <span className="text-red-500">
                                          browse
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-400 mt-1">
                                        JPG, JPEG, PNG
                                      </div>
                                    </label>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Back Image Upload */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Image className="h-4 w-4 text-gray-600" />
                                <label className="font-medium">
                                  Back Card Image
                                </label>
                              </div>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                {cardDetails.backLogo ? (
                                  <div className="relative">
                                    <img
                                      src={cardDetails.backLogo}
                                      alt="Back Preview"
                                      className="w-full h-32 object-contain rounded-lg mb-2"
                                    />
                                    <button
                                      //onClick={() => setCustomCardBackImage(null)}
                                      onClick={() =>
                                        setCardDetails((prev) => ({
                                          ...prev,
                                          backLogo: null,
                                        }))
                                      }
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                    <div className="text-sm text-gray-600">
                                      {cardDetails.backLogo.name}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        setImageImageSide("back");
                                        if (file) {
                                          handleImageUpload(file);
                                          // setCustomCardBackImage(file);
                                          // const url = await uploadLogoToFirebase(
                                          //   file,
                                          //   user?.uid
                                          // );
                                          // setCardDetails((prev) => ({
                                          //   ...prev,
                                          //   backLogo: url,
                                          // }));
                                        }
                                      }}
                                      className="hidden"
                                      id="custom-card-back-upload"
                                    />
                                    <label
                                      htmlFor="custom-card-back-upload"
                                      className="cursor-pointer"
                                    >
                                      <div className="text-gray-500">
                                        Upload back card image or{" "}
                                        <span className="text-red-500">
                                          browse
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-400 mt-1">
                                        JPG, JPEG, PNG
                                      </div>
                                    </label>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* QR Code Options */}
                            <div className="space-y-3"></div>
                          </>
                        )}

                        {/* Crop Modal */}
                        {showCropModal && cropImage && (
                          <div
                            key={selectedCard}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0"
                          >
                            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">
                                  Crop Image (1.6:1 Aspect Ratio)
                                </h3>
                                <button
                                  onClick={() => {
                                    setShowCropModal(false);
                                    setCropImage(null);
                                  }}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>

                              <div className="mb-4">
                                <ReactCrop
                                  crop={crop}
                                  onChange={(c) => setCrop(c)}
                                  onComplete={(c) => setCompletedCrop(c)}
                                  aspect={1.6}
                                  minWidth={80}
                                  minHeight={50}
                                  keepSelection
                                  locked={false}
                                >
                                  <img
                                    ref={imgRef}
                                    src={cropImage}
                                    alt="Crop preview"
                                    style={{
                                      maxWidth: "100%",
                                      maxHeight: "60vh",
                                    }}
                                  />
                                </ReactCrop>
                              </div>

                              <div className="flex gap-3 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowCropModal(false);
                                    setCropImage(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleCropComplete}>
                                  Apply Crop
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Form Grid - Only for image-text design */}
                        {customCardDesignType === "image-text" &&
                          !hideTextOnBack && (
                            <>
                              {/* Form Grid - 2 columns on desktop */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Company Name Field */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-600" />
                                    <label className="font-medium text-sm">
                                      Company name
                                    </label>
                                  </div>
                                  <Input
                                    placeholder="Company name"
                                    value={cardDetails.companyName}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        companyName: e.target.value,
                                      }))
                                    }
                                  />
                                </div>

                                {/* Name Field */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-600" />
                                    <label className="font-medium text-sm">
                                      Name
                                    </label>
                                  </div>
                                  <Input
                                    placeholder="First name"
                                    value={cardDetails.firstName}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        firstName: e.target.value,
                                      }))
                                    }
                                  />
                                </div>

                                {/* Additional Information */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-gray-600" />
                                    <label className="font-medium text-sm">
                                      Additional information
                                    </label>
                                  </div>
                                  <Input
                                    placeholder="Position or title"
                                    value={cardDetails.additionalInfo}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        additionalInfo: e.target.value,
                                      }))
                                    }
                                  />
                                </div>

                                {/* Phone Field */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-600" />
                                    <label className="font-medium text-sm">
                                      Phone number
                                    </label>
                                  </div>
                                  <Input
                                    placeholder="Phone number"
                                    value={cardDetails.phone}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        phone: e.target.value,
                                      }))
                                    }
                                  />
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-600" />
                                    <label className="font-medium text-sm">
                                      Email address
                                    </label>
                                  </div>
                                  <Input
                                    placeholder="Email address"
                                    value={cardDetails.email}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        email: e.target.value,
                                      }))
                                    }
                                  />
                                </div>

                                {/* Website Field */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-gray-600" />
                                    <label className="font-medium text-sm">
                                      Website
                                    </label>
                                  </div>
                                  <Input
                                    placeholder="Website URL"
                                    value={cardDetails.website}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        website: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>

                              {/* Address Fields - Full width */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-600" />
                                  <label className="font-medium text-sm">
                                    Address
                                  </label>
                                </div>
                                <Input
                                  placeholder="Street address"
                                  value={cardDetails.address}
                                  onChange={(e) =>
                                    setCardDetails((prev) => ({
                                      ...prev,
                                      address: e.target.value,
                                    }))
                                  }
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <Input
                                    placeholder="City"
                                    value={cardDetails.city}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        city: e.target.value,
                                      }))
                                    }
                                  />
                                  <Input
                                    placeholder="State"
                                    value={cardDetails.state}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        state: e.target.value,
                                      }))
                                    }
                                  />
                                  <Input
                                    placeholder="ZIP Code"
                                    value={cardDetails.zipCode}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        zipCode: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                            </>
                          )}
                      </div>
                    </div>
                  ) : selectedCard === "infinite" && !mobileOpen ? (
                    <div
                      ref={essentialRef}
                      id="essential-card"
                      className="space-y-4 p-3 lg:p-6 xl:p-6 pt-3 lg:px-3 xl:px-12 rounded-lg border text-card-foreground bg-card shadow-lg card-NR bg-primary/5"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCard("essential")}
                          className="p-2 bg-blue-500 hover:bg-blue-600"
                        >
                          <ArrowLeft className="h-4 w-4 text-white" />
                          <span className="text-white">Back</span>
                        </Button>
                        <h2 className="text-base lg:text-xl xl:text-xl font-semibold">
                          Personalize your card
                        </h2>
                      </div>
                      <div className="space-y-4">
                        {/* Form Grid - 2 columns on desktop */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Company Name Field */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-600" />
                              <label className="font-medium text-sm">
                                Company name
                              </label>
                            </div>
                            <Input
                              placeholder="Company name"
                              value={cardDetails.companyName}
                              onChange={(e) =>
                                setCardDetails((prev) => ({
                                  ...prev,
                                  companyName: e.target.value,
                                }))
                              }
                            />
                          </div>

                          {/* Name Fields */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-600" />
                              <label className="font-medium text-sm">
                                Name
                              </label>
                            </div>
                            <Input
                              placeholder="First name"
                              value={cardDetails.firstName}
                              onChange={(e) =>
                                setCardDetails((prev) => ({
                                  ...prev,
                                  firstName: e.target.value,
                                }))
                              }
                            />
                          </div>

                          {/* Additional Information - spans both columns on desktop */}
                          <div className="space-y-2 md:col-span-2">
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-gray-600" />
                              <label className="font-medium text-sm">
                                Additional information
                              </label>
                            </div>
                            <Input
                              placeholder="Position or title"
                              value={cardDetails.additionalInfo}
                              onChange={(e) =>
                                setCardDetails((prev) => ({
                                  ...prev,
                                  additionalInfo: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        {/* Logo/Text Toggle */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4 text-gray-600" />
                              <label className="font-medium">
                                Top Right Display
                              </label>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <span
                                className={
                                  !cardDetails.useLogoImage
                                    ? "font-medium"
                                    : "text-muted-foreground"
                                }
                              >
                                Text Abbr.
                              </span>

                              <Switch
                                checked={cardDetails.useLogoImage}
                                onCheckedChange={(checked) =>
                                  setCardDetails((prev) => ({
                                    ...prev,
                                    useLogoImage: checked,
                                  }))
                                }
                              />

                              <span
                                className={
                                  cardDetails.useLogoImage
                                    ? "font-medium"
                                    : "text-muted-foreground"
                                }
                              >
                                Logo
                              </span>
                            </div>
                          </div>

                          {cardDetails.useLogoImage ? (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                              {cardDetails.personalizeLogo ? (
                                <div className="relative">
                                  <img
                                    src={cardDetails.personalizeLogo}
                                    alt="Logo Preview"
                                    className="w-full h-32 object-contain rounded-lg mb-2"
                                  />

                                  {/* Close Icon */}
                                  <button
                                    onClick={() =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        personalizeLogo: null,
                                      }))
                                    }
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>

                                  {/* File Name */}
                                  <div className="text-sm text-gray-600">
                                    {cardDetails?.personalizeLogo?.name}
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleImageUpload(file);
                                        // const url = await uploadLogoToFirebase(
                                        //   file,
                                        //   user?.uid
                                        // );

                                        // setCardDetails((prev) => ({
                                        //   ...prev,
                                        //   logo: url,
                                        // }));
                                      }
                                    }}
                                    className="hidden"
                                    id="logo-upload"
                                  />

                                  <label
                                    htmlFor="logo-upload"
                                    className="cursor-pointer"
                                  >
                                    <div className="text-gray-500">
                                      Drop your image here, or{" "}
                                      <span className="text-red-500">
                                        browse
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">
                                      Supports JPG, JPEG, and PNG
                                    </div>
                                  </label>
                                </>
                              )}
                            </div>
                          ) : (
                            <Input
                              placeholder="Company name abbreviation here"
                              value={cardDetails.logoText}
                              onChange={(e) =>
                                setCardDetails((prev) => ({
                                  ...prev,
                                  logoText: e.target.value,
                                }))
                              }
                            />
                          )}
                        </div>
                      </div>

                      {/* Crop Modal */}
                      {showCropModal && cropImage && (
                        <div
                          key={selectedCard}
                          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        >
                          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-semibold">
                                Crop Image (1.6:1 Aspect Ratio)
                              </h3>
                              <button
                                onClick={() => {
                                  setShowCropModal(false);
                                  setCropImage(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>

                            <div className="mb-4">
                              <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={1.6}
                                minWidth={80}
                                minHeight={50}
                                keepSelection
                                locked={false}
                              >
                                <img
                                  ref={imgRef}
                                  src={cropImage}
                                  alt="Crop preview"
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: "60vh",
                                  }}
                                />
                              </ReactCrop>
                            </div>

                            <div className="flex gap-3 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowCropModal(false);
                                  setCropImage(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleCropComplete}>
                                Apply Crop
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold mb-4 cursor-pointer lg:cursor-default hidden lg:block">
                        Choose your card
                      </h2>
                      {/* MOBILE ONLY SLIDE PANEL */}
                      <div
                        className={`hidden !mt-0 fixed inset-y-0 right-0 z-50 bg-white shadow-xl w-[90vw] transition-transform duration-300 lg:hidden ${
                          mobileOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                          <h3 className="text-lg font-semibold">
                            {mobileStep === "cards"
                              ? "Choose Your Card"
                              : "Card Details"}
                          </h3>
                          <button
                            onClick={() => setMobileOpen(false)}
                            className="text-xl font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 overflow-y-auto h-full">
                          {mobileStep === "cards" && (
                            <div className="grid grid-cols-1 gap-4">
                              {/* Essential Card */}
                              <div
                                className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                  selectedCard === "essential" &&
                                  selectedProduct === "cards"
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                } ${pricingConfig?.outOfStock?.essential ? "opacity-60" : ""}`}
                                style={{
                                  backgroundImage: `url(/lovable-uploads/essential-card-product.png)`,
                                  backgroundPosition: "right center",
                                  backgroundSize: "35% auto",
                                  backgroundRepeat: "no-repeat",
                                  backgroundBlendMode: "soft-light",
                                }}
                                onClick={() => {
                                  if (pricingConfig?.outOfStock?.essential) {
                                    alert(
                                      "Essential Out Of Stock Card/color coming Soon!",
                                    );
                                    return;
                                  }
                                  setMobileStep("cards");
                                  setMobileOpen(false);
                                  setSelectedColor("gray");
                                  setSelectedCard("essential");
                                  setSelectedProduct("cards");
                                  setTimeout(() => {
                                    essentialRef.current?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "end",
                                    });
                                  }, 200); // small delay ensures layout is ready
                                }}
                              >
                                <div>
                                  <div className="flex justify-between items-start mr-[35%]">
                                    <h3 className="font-semibold text-lg">
                                      Solo
                                      <span className="text-outlined-card">
                                        .card
                                      </span>{" "}
                                      <span className="italic">Essential</span>
                                    </h3>
                                    {pricingConfig?.outOfStock?.essential && (
                                      <Badge
                                        variant="destructive"
                                        className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                      >
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                    The last business card you'll ever need. It
                                    comes pre-designed with your information
                                    loaded on the card and the QR code.
                                  </p>
                                </div>
                              </div>

                              <div
                                className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                  selectedCard === "infinite" &&
                                  selectedProduct === "cards"
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                } ${pricingConfig?.outOfStock?.personalize ? "opacity-60" : ""}`}
                                style={{
                                  backgroundImage: `url(/lovable-uploads/Personalize.png)`,
                                  backgroundPosition: "right center",
                                  backgroundSize: "35% auto",
                                  backgroundRepeat: "no-repeat",
                                  backgroundBlendMode: "soft-light",
                                }}
                                onClick={() => {
                                  if (pricingConfig?.outOfStock?.personalize) {
                                    alert(
                                      "Personal Out Of Stock Card/color coming Soon!",
                                    );
                                    return;
                                  }
                                  setMobileStep("cards");
                                  setMobileOpen(false);
                                  setSelectedColor("gray");
                                  setSelectedCard("infinite");
                                  setSelectedProduct("cards");
                                  setTimeout(() => {
                                    essentialRef.current?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "end",
                                    });
                                    console.log("dsvdsv");
                                  }, 200); // small delay ensures layout is ready
                                }}
                              >
                                <div>
                                  <div className="flex justify-between items-start mr-[35%]">
                                    <h3 className="font-semibold text-lg">
                                      Solo
                                      <span className="text-outlined-card">
                                        .card
                                      </span>{" "}
                                      <span className="italic">
                                        Personalize
                                      </span>
                                    </h3>
                                    {pricingConfig?.outOfStock?.personalize && (
                                      <Badge
                                        variant="destructive"
                                        className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                      >
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                    Personalize your card and make an
                                    impression. Submit your company and contact
                                    information, including your logo if
                                    required.
                                  </p>
                                </div>
                              </div>

                              {/* Custom Card */}
                              <div
                                className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                  selectedCard === "custom" &&
                                  selectedProduct === "cards"
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                } ${pricingConfig?.outOfStock?.custom ? "opacity-60" : ""}`}
                                style={{
                                  backgroundImage: `url(/lovable-uploads/custom-card-product.png)`,
                                  backgroundPosition: "right center",
                                  backgroundSize: "35% auto",
                                  backgroundRepeat: "no-repeat",
                                  backgroundBlendMode: "soft-light",
                                }}
                                onClick={() => {
                                  if (pricingConfig?.outOfStock?.custom) {
                                    alert(
                                      "Custom Out Of Stock Card/color coming Soon!",
                                    );
                                    return;
                                  }
                                  setMobileStep("cards");
                                  setMobileOpen(false);
                                  setSelectedColor("gray");
                                  setSelectedCard("custom");
                                  setSelectedProduct("cards");
                                  setTimeout(() => {
                                    essentialRef.current?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "start",
                                    });
                                  }, 200); // small delay ensures layout is ready
                                }}
                              >
                                <div>
                                  <div className="flex justify-between items-start mr-[35%]">
                                    <h3 className="font-semibold text-lg">
                                      Solo
                                      <span className="text-outlined-card">
                                        .card
                                      </span>{" "}
                                      <span className="italic">Custom</span>
                                    </h3>
                                    {pricingConfig?.outOfStock?.custom && (
                                      <Badge
                                        variant="destructive"
                                        className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                      >
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                    Your branding, no limits. Just upload an
                                    image with your design. For best custom
                                    results, use a monotone color design.
                                  </p>
                                </div>
                              </div>

                              {/* Tap Sticker */}
                              <div
                                className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                  selectedProduct === "tapsticker"
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                } ${pricingConfig?.outOfStock?.sticker ? "opacity-60" : ""}`}
                                style={{
                                  backgroundImage: `url(/lovable-uploads/tap-sticker-product.png)`,
                                  backgroundPosition: "right center",
                                  backgroundSize: "35% auto",
                                  backgroundRepeat: "no-repeat",
                                  backgroundBlendMode: "soft-light",
                                }}
                                onClick={() => {
                                  if (pricingConfig?.outOfStock?.sticker) {
                                    alert(
                                      "Sticker Out Of Stock Card/color coming Soon!",
                                    );
                                    return;
                                  }
                                  setMobileOpen(false);

                                  setSelectedColor("gray");
                                  setSelectedProduct("tapsticker");
                                  setSelectedCard("essential");
                                  setTimeout(() => {
                                    essentialRefMobile.current?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "end",
                                    });
                                  }, 200); // small delay ensures layout is ready
                                }}
                              >
                                <div>
                                  <div className="flex justify-between items-start mr-[35%]">
                                    <h3 className="font-semibold text-lg">
                                      Solo
                                      <span className="text-outlined-card">
                                        .tap
                                      </span>{" "}
                                      <span className="italic">Sticker</span>
                                    </h3>
                                    {pricingConfig?.outOfStock?.sticker && (
                                      <Badge
                                        variant="destructive"
                                        className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                      >
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                    With a Tap Sticker, you can easily share
                                    your contact information and more. Just one
                                    scan or tap away from a new connection.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* {mobileStep === "form" && (
                    <div className="animate-slide-in">
                     
                      <p className="text-sm text-muted-foreground">
                        Form for selected card
                      </p>
                    </div>
                  )} */}
                        </div>
                      </div>

                      <div className="block lg:block xl:block">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                          {/* Essential Card */}
                          <div
                            className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                              selectedCard === "essential" &&
                              selectedProduct === "cards"
                                ? "border-primary/30 bg-primary/5"
                                : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                            }`}
                            style={{
                              backgroundImage: `url(/lovable-uploads/essential-card-product.png)`,
                              backgroundPosition: "right center",
                              backgroundSize: "35% auto",
                              backgroundRepeat: "no-repeat",
                              backgroundBlendMode: "soft-light",
                            }}
                            onClick={() => {
                              setSelectedColor("gray");
                              setSelectedCard("essential");
                              setSelectedProduct("cards");
                            }}
                          >
                            <div>
                              <h3 className="font-semibold text-lg">
                                Solo
                                <span className="text-outlined-card">
                                  .card
                                </span>{" "}
                                <span className="italic">Essential</span>
                              </h3>
                              <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                The last business card you'll ever need. It
                                comes pre-designed with your information loaded
                                on the card and the QR code.
                              </p>
                            </div>
                          </div>

                          {/* Infinite Card */}
                          <div
                            className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                              selectedCard === "infinite" &&
                              selectedProduct === "cards"
                                ? "border-primary/30 bg-primary/5"
                                : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                            }`}
                            style={{
                              backgroundImage: `url(/lovable-uploads/Personalize.png)`,
                              backgroundPosition: "right center",
                              backgroundSize: "35% auto",
                              backgroundRepeat: "no-repeat",
                              backgroundBlendMode: "soft-light",
                            }}
                            onClick={() => {
                              setSelectedColor("gray");
                              setSelectedCard("infinite");
                              setSelectedProduct("cards");
                              // setTimeout(() => {
                              //   essentialRef.current?.scrollIntoView({
                              //     behavior: "smooth",
                              //     block: "end",
                              //   });
                              //   console.log("dsvdsv");
                              // }, 200); // small delay ensures layout is ready
                            }}
                          >
                            <div>
                              <h3 className="font-semibold text-lg">
                                Solo
                                <span className="text-outlined-card">
                                  .card
                                </span>{" "}
                                <span className="italic">Personalize</span>
                              </h3>
                              <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                Personalize your card and make an impression.
                                Submit your company and contact information,
                                including your logo if required.
                              </p>
                            </div>
                          </div>

                          {/* Custom Card */}
                          <div
                            className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                              selectedCard === "custom" &&
                              selectedProduct === "cards"
                                ? "border-primary/30 bg-primary/5"
                                : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                            }`}
                            style={{
                              backgroundImage: `url(/lovable-uploads/custom-card-product.png)`,
                              backgroundPosition: "right center",
                              backgroundSize: "35% auto",
                              backgroundRepeat: "no-repeat",
                              backgroundBlendMode: "soft-light",
                            }}
                            onClick={() => {
                              setSelectedColor("gray");
                              setSelectedCard("custom");
                              setSelectedProduct("cards");
                              // setTimeout(() => {
                              //   essentialRef.current?.scrollIntoView({
                              //     behavior: "smooth",
                              //     block: "start",
                              //   });
                              // }, 200); // small delay ensures layout is ready
                            }}
                          >
                            <div>
                              <h3 className="font-semibold text-lg">
                                Solo
                                <span className="text-outlined-card">
                                  .card
                                </span>{" "}
                                <span className="italic">Custom</span>
                              </h3>
                              <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                Your branding, no limits. Just upload an image
                                with your design. For best custom results, use a
                                monotone color design.
                              </p>
                            </div>
                          </div>

                          {/* Tap Sticker */}
                          <div
                            className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden border-gray-200 hover:border-primary/30 hover:bg-primary/5`}
                            style={{
                              backgroundImage: `url(/lovable-uploads/tap-sticker-product.png)`,
                              backgroundPosition: "right center",
                              backgroundSize: "35% auto",
                              backgroundRepeat: "no-repeat",
                              backgroundBlendMode: "soft-light",
                            }}
                            onClick={() => {
                              setSelectedColor("gray");
                              setSelectedProduct("tapsticker");
                              setSelectedCard("essential");
                              // setTimeout(() => {
                              //   essentialRefMobile.current?.scrollIntoView({
                              //     behavior: "smooth",
                              //     block: "center",
                              //   });
                              // }, 200); // small delay ensures layout is ready
                            }}
                          >
                            <div>
                              <h3 className="font-semibold text-lg">
                                Solo
                                <span className="text-outlined-card">
                                  .tap
                                </span>{" "}
                                <span className="italic">Sticker</span>
                              </h3>
                              <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                With a Tap Sticker, you can easily share your
                                contact information and more. Just one scan or
                                tap away from a new connection.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Product Info Section */}
                  {selectedProduct === "cards" && (
                    <Card className="bg-card shadow-lg">
                      <CardContent className="space-y-4 p-3 lg:p-6 xl:p-6 pt-3 lg:px-3 xl:px-12">
                        <div>
                          <h3 className="text-2xl font-semibold text-foreground">
                            {selectedCard === "essential" && (
                              <>
                                Solo
                                <span className="text-outlined-card">
                                  .card
                                </span>{" "}
                                <span className="italic">Essential</span>
                              </>
                            )}
                            {selectedCard === "infinite" && (
                              <>
                                Solo
                                <span className="text-outlined-card">
                                  .card
                                </span>{" "}
                                <span className="italic">Personalize</span>
                              </>
                            )}
                            {selectedCard === "custom" && (
                              <>
                                Solo
                                <span className="text-outlined-card">
                                  .card
                                </span>{" "}
                                <span className="italic">Custom</span>
                              </>
                            )}
                          </h3>
                          <div className="flex items-end justify-between">
                            {/* Left side: Rating + Star + Reviews */}
                            <div className="flex items-end gap-2">
                              <span className="text-xl font-bold text-foreground leading-none">
                                4.8
                              </span>
                              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                              <span className="text-gray-400 leading-none">
                                |
                              </span>
                              <span className="text-sm text-muted-foreground leading-none">
                                1,000+ reviews
                              </span>
                            </div>

                            {/* Right side: Price */}
                            <div className="flex flex-col items-end gap-1">
                              {(() => {
                                const cardType =
                                  selectedCard === "essential"
                                    ? "essential"
                                    : selectedCard === "infinite"
                                      ? "infinite"
                                      : "custom";
                                //@ts-ignore
                                let basePrice =
                                  //@ts-ignore
                                  pricingConfig?.cards[
                                    //@ts-ignore
                                    cardType as keyof typeof pricingConfig.cards
                                  ].single;

                                // Check if special sale is active and not expired
                                //@ts-ignore
                                const isSaleActive =
                                  //@ts-ignore
                                  pricingConfig?.specialSale.isActive &&
                                  //@ts-ignore
                                  new Date(pricingConfig?.specialSale.endDate) >
                                    new Date();

                                // Store the true original price (before any sale)
                                const trueOriginalPrice = basePrice;

                                // Apply special sale discount to base price if active
                                if (isSaleActive) {
                                  //@ts-ignore
                                  basePrice =
                                    basePrice *
                                    (1 -
                                      //@ts-ignore
                                      pricingConfig?.specialSale.percentage /
                                        100);
                                }

                                const quantities = {
                                  single: 1,
                                  double: 2,
                                  pack: 5,
                                };
                                const quantity = quantities[selectedQuantity];

                                // Calculate prices
                                const originalPriceTotal =
                                  trueOriginalPrice * quantity;
                                const saleAdjustedPrice = basePrice * quantity;

                                const discountPercent =
                                  selectedQuantity === "single"
                                    ? 0
                                    : //@ts-ignore
                                      selectedQuantity === "double"
                                      ? //@ts-ignore
                                        pricingConfig?.discounts.double
                                      : //@ts-ignore
                                        pricingConfig?.discounts.pack;
                                const discountedPrice =
                                  saleAdjustedPrice *
                                  (1 - discountPercent / 100);

                                // Add logo removal fee AFTER discount (no discount applied to this fee)
                                const logoRemovalFee =
                                  selectedCard === "infinite" && removeBlingLogo
                                    ? //@ts-ignore
                                      pricingConfig?.addOns.logoRemovalFee *
                                      quantity
                                    : 0;
                                const totalPrice =
                                  discountedPrice + logoRemovalFee;

                                const discountedPricePerCard =
                                  discountedPrice / quantity;

                                // Show strikethrough if sale is active OR quantity discount applies
                                const showStrikethrough =
                                  isSaleActive || selectedQuantity !== "single";

                                // Calculate total savings
                                const totalSavings =
                                  originalPriceTotal -
                                  (totalPrice - logoRemovalFee);

                                return (
                                  <>
                                    {selectedQuantity !== "single" && (
                                      <span className="text-sm text-muted-foreground">
                                        ${discountedPricePerCard.toFixed(2)}
                                        /each
                                      </span>
                                    )}
                                    <div className="flex items-center gap-2">
                                      {showStrikethrough && (
                                        <span className="text-sm font-semibold text-muted-foreground line-through">
                                          ${originalPriceTotal.toFixed(2)}
                                        </span>
                                      )}
                                      <span className="text-xl font-bold text-foreground leading-none">
                                        ${totalPrice.toFixed(2)}
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        <Separator />

                        {/* Color & Material Selection */}
                        <div className="space-y-6">
                          {/* Color Selection */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium text-foreground">
                                Color
                              </Label>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      {
                                        red: "#EF4444",
                                        pink: "#EC4899",
                                        yellow: "#EAB308",
                                        green: "#10B981",
                                        blue: "#3B82F6",
                                        purple: "#8B5CF6",
                                        white: "#FFFFFF",
                                        black: "#000000",
                                        gray: "#4f4e4f",
                                      }[hoveredColor || selectedColor] ||
                                      "#000000",
                                  }}
                                />
                                <span
                                  className={cn(
                                    "text-sm font-medium uppercase text-foreground",
                                    (hoveredColor &&
                                      pricingConfig?.outOfStockColors?.[
                                        hoveredColor
                                      ]) ||
                                      (!hoveredColor &&
                                        pricingConfig?.outOfStockColors?.[
                                          selectedColor
                                        ])
                                      ? "text-red-500 font-semibold"
                                      : "",
                                  )}
                                >
                                  {hoveredColor
                                    ? `${hoveredColor}${pricingConfig?.outOfStockColors?.[hoveredColor] ? " - out of stock" : ""}`
                                    : `${selectedColor}${pricingConfig?.outOfStockColors?.[selectedColor] ? " - out of stock" : ""}`}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {[
                                { name: "Red", hex: "#EF4444" },
                                { name: "Pink", hex: "#EC4899" },
                                { name: "Yellow", hex: "#EAB308" },
                                { name: "Green", hex: "#059669" },
                                { name: "Blue", hex: "#3B82F6" },
                                { name: "Purple", hex: "#8B5CF6" },
                                { name: "White", hex: "#FFFFFF" },
                                { name: "Black", hex: "#000000" },
                                { name: "Gray", hex: "#4f4e4f" },
                              ].map((color) => {
                                const isColorOOS =
                                  !!pricingConfig?.outOfStockColors?.[
                                    color.name.toLowerCase()
                                  ];
                                return (
                                  <button
                                    key={color.name}
                                    onMouseEnter={() =>
                                      setHoveredColor(color.name.toLowerCase())
                                    }
                                    onMouseLeave={() => setHoveredColor(null)}
                                    onClick={() => {
                                      if (isColorOOS) return;
                                      setSelectedColor(
                                        color.name.toLowerCase(),
                                      );
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 transition-all relative ${
                                      selectedColor === color.name.toLowerCase()
                                        ? "border-primary ring-2 ring-primary ring-offset-2"
                                        : "border-gray-300 hover:border-gray-400"
                                    } ${
                                      isColorOOS
                                        ? "opacity-35 cursor-not-allowed"
                                        : "hover:scale-110 transition-transform cursor-pointer"
                                    }`}
                                    style={{ backgroundColor: color.hex }}
                                    title={
                                      isColorOOS
                                        ? `${color.name} - out of stock`
                                        : color.name
                                    }
                                  >
                                    {isColorOOS && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-[2px] bg-red-500 rotate-45" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Card Material Selection */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-foreground">
                              Card material:
                            </Label>
                            <div className="flex gap-2">
                              {[
                                { value: "classic", label: "Standard" },
                                { value: "wood", label: "Wood" },
                                { value: "metal", label: "Metal" },
                              ]
                                .filter(
                                  (material) =>
                                    selectedCard !== "essential" ||
                                    material.value === "classic",
                                )
                                .map((material) => (
                                  <button
                                    key={material.value}
                                    onClick={() => {
                                      if (
                                        material.value === "wood" ||
                                        material.value === "metal"
                                      ) {
                                        setShowMaterialComingSoon(true);
                                      } else {
                                        setSelectedMaterial(material?.value);
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                      selectedMaterial === material.value
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/80 text-foreground"
                                    }`}
                                  >
                                    {material.label}
                                  </button>
                                ))}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Selection */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-foreground">
                              Quantity
                            </Label>
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                            {/* Single Card Option */}
                            <button
                              onClick={() => setSelectedQuantity("single")}
                              className={`p-2 lg:p-4 xl:p-4 rounded-lg border-2 transition-all text-center flex flex-col items-center ${
                                selectedQuantity === "single"
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              <div className="font-semibold text-foreground">
                                Single
                              </div>
                              <div className="text-sm text-muted-foreground">
                                1 card
                              </div>
                            </button>

                            {/* Double Card Option */}
                            <button
                              onClick={() => setSelectedQuantity("double")}
                              className={`p-2 lg:p-4 xl:p-4 rounded-lg border-2 transition-all text-center flex flex-col items-center ${
                                selectedQuantity === "double"
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              <div className="font-semibold text-foreground">
                                Double
                              </div>
                              <div className="text-sm text-muted-foreground">
                                2 cards
                              </div>
                              <div className="flex flex-col gap-1 mt-2">
                                <span className="text-[10px] lg:text-xs xl:text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                  SAVE {pricingConfig?.discounts?.double}%
                                </span>
                                <span className="text-[10px] lg:text-xs xl:text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                  FREE SHIPPING
                                </span>
                              </div>
                            </button>

                            {/* Pack Option */}
                            <button
                              onClick={() => setSelectedQuantity("pack")}
                              className={`p-2 lg:p-4 xl:p-4 rounded-lg border-2 transition-all text-center flex flex-col items-center ${
                                selectedQuantity === "pack"
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              <div className="font-semibold text-foreground">
                                Pack
                              </div>
                              <div className="text-sm text-muted-foreground">
                                5 cards
                              </div>
                              <div className="flex flex-col gap-1 mt-2">
                                <span className="text-[10px] lg:text-xs xl:text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                                  SAVE {pricingConfig?.discounts?.pack}%
                                </span>
                                <span className="text-[10px] lg:text-xs xl:text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                  FREE SHIPPING
                                </span>
                              </div>
                            </button>
                          </div>

                          {/* Assign to Digital Card */}
                          {/* <div className="mt-6 space-y-3">
                        <Label className="text-sm font-medium mb-2 block">
                          Assign to existing digital card
                          {selectedQuantity !== "single" ? "s" : ""}
                        </Label>
                        {Array.from({
                          length:
                            selectedQuantity === "single"
                              ? 1
                              : selectedQuantity === "double"
                              ? 2
                              : 5,
                        }).map((_, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {selectedQuantity !== "single" && (
                              <span className="text-xs text-muted-foreground w-16">
                                Card {index + 1}:
                              </span>
                            )}
                            <Select
                              value={assignedDigitalCards[index]}
                              onValueChange={(value) => {
                                const newCards = [...assignedDigitalCards];
                                newCards[index] = value;

                                // Remove empty strings
                                const cleanedCards = newCards.filter(
                                  (item) => item !== ""
                                );

                                setAssignedDigitalCards(cleanedCards);

                                setCardDetails((prev) => ({
                                  ...prev,
                                  assignedDigitalCard: cleanedCards,
                                }));
                              }}
                            >
                              <SelectTrigger className="w-full bg-background">
                                <SelectValue placeholder="Search by name or card title" />
                              </SelectTrigger>
                              <SelectContent className="bg-background z-50">
                                {businessCards.length === 0 ? (
                                  <SelectItem value="none" disabled>
                                    No cards available
                                  </SelectItem>
                                ) : (
                                  businessCards.map((card) => (
                                    <SelectItem
                                      key={card.metadata.id}
                                      value={card.metadata.id}
                                    >
                                      {card.profile.firstName}{" "}
                                      {card.profile.lastName}{" "}
                                      {card.profile.title
                                        ? `- ${card.profile.title}`
                                        : ""}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div> */}

                          {/* Add to Cart Button */}
                          <Button
                            size="lg"
                            className="w-full mt-6 h-14 text-lg font-semibold bg-gray-900 hover:bg-gray-800 text-white"
                            disabled={isSelectionOOS}
                            onClick={() => {
                              // const requiredCount =
                              //   selectedQuantity === "single"
                              //     ? 1
                              //     : selectedQuantity === "double"
                              //     ? 2
                              //     : 5;
                              // const assignedCount = assignedDigitalCards
                              //   .slice(0, requiredCount)
                              //   .filter((c) => c && c !== "").length;
                              // if (assignedCount < requiredCount) {
                              //   setShowCardWarningModal(true);
                              //   return;
                              // }

                              const cardType =
                                selectedCard === "essential"
                                  ? "essential"
                                  : selectedCard === "infinite"
                                    ? "infinite"
                                    : "custom";

                              let basePrice =
                                pricingConfig &&
                                pricingConfig.cards &&
                                pricingConfig?.cards[
                                  cardType as keyof typeof pricingConfig.cards
                                ].single;

                              const isSaleActive =
                                pricingConfig?.specialSale?.isActive &&
                                new Date(pricingConfig?.specialSale?.endDate) >
                                  new Date();

                              const trueOriginalPrice = basePrice;
                              if (isSaleActive) {
                                basePrice =
                                  basePrice *
                                  (1 -
                                    pricingConfig?.specialSale?.percentage /
                                      100);
                              }

                              const quantities = {
                                single: 1,
                                double: 2,
                                pack: 5,
                              };
                              const quantity = quantities[selectedQuantity];

                              const originalPriceTotal =
                                trueOriginalPrice * quantity;
                              const saleAdjustedPrice = basePrice * quantity;

                              const discountPercent =
                                selectedQuantity === "single"
                                  ? 0
                                  : //@ts-ignore
                                    selectedQuantity === "double"
                                    ? //@ts-ignore
                                      pricingConfig?.discounts.double
                                    : //@ts-ignore
                                      pricingConfig?.discounts.pack;
                              const discountedPrice =
                                saleAdjustedPrice * (1 - discountPercent / 100);

                              const logoRemovalFee =
                                selectedCard === "infinite" && removeBlingLogo
                                  ? //@ts-ignore
                                    pricingConfig?.addOns.logoRemovalFee *
                                    quantity
                                  : 0;
                              const totalPrice =
                                discountedPrice + logoRemovalFee;

                              let name =
                                cardType.charAt(0).toUpperCase() +
                                cardType.slice(1);
                              if (name?.toLowerCase().includes("infinite")) {
                                name = "Personalize";
                              }

                              addItem({
                                type: "nfc-card",
                                name: `${name} NFC Card (${quantity}x)`,
                                quantity: quantity,
                                unitPrice: totalPrice / quantity,
                                originalPrice: originalPriceTotal / quantity,
                                options: {
                                  customLogo:
                                    selectedCard === "personalize" &&
                                    removeBlingLogo,
                                },
                                //@ts-ignore
                                image: nfcCards1,
                                color: selectedColor,
                                selectedCard: selectedCard,
                                assignedDigitalCard: assignedDigitalCard,
                                material: selectedMaterial,
                                cardDetails: {
                                  firstName: cardDetails.firstName,
                                  lastName: cardDetails.lastName,
                                  companyName: cardDetails.companyName,
                                  additionalInfo: cardDetails.additionalInfo,
                                  phone: cardDetails.phone,
                                  email: cardDetails.email,
                                  website: cardDetails.website,
                                  address: cardDetails.address,
                                  city: cardDetails.city,
                                  state: cardDetails.state,
                                  zipCode: cardDetails.zipCode,
                                  logo: cardDetails.logo,
                                  customLogo: cardDetails.customLogo,
                                  personalizeLogo: cardDetails.personalizeLogo,
                                  logoText: cardDetails.logoText,
                                  frontLogo: cardDetails.frontLogo,
                                  backLogo: cardDetails.backLogo,
                                  useLogoImage: cardDetails.useLogoImage,
                                  assignedDigitalCard:
                                    cardDetails.assignedDigitalCard,
                                  optionalText: optionalText,
                                  customCardDesignType: customCardDesignType,
                                  showQRCodeOnBack:
                                    cardDetails.showQRCodeOnBack,
                                  qrCodePosition: cardDetails.qrCodePosition,
                                  hideTextOnBack: cardDetails.hideTextOnBack,
                                  tapStickerLogo: cardDetails.tapStickerLogo,
                                  tapStickerText: cardDetails.tapStickerText,
                                  tapStickerColor: cardDetails.tapStickerColor,
                                  cardType: "nfc-card",
                                },
                              });
                            }}
                          >
                            <ShoppingBasket className="h-5 w-5" />
                            {isSelectionOOS ? "Out of Stock" : "Add to Cart"}
                          </Button>

                          {/* Assignment Info */}
                          <p className="text-center text-muted-foreground text-sm mt-4">
                            {/* All orders must be assigned to an existing digital
                        business card. */}
                            After placing your order, create a Free! card
                            profile if you do not already have one.
                            <br />
                            <a
                              href="/"
                              className="text-primary hover:underline"
                            >
                              Create your free digital card here
                            </a>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div> /* Phone Display */
              ) : (
                <div
                  className="flex flex-col gap-6"
                  ref={essentialRef}
                  id="essential-card"
                >
                  {/* Sale Banner */}
                  {(() => {
                    //@ts-ignore
                    const isActive = pricingConfig?.specialSale.isActive;
                    //@ts-ignore
                    const endDate = new Date(
                      pricingConfig?.specialSale.endDate,
                    );
                    const now = new Date();
                    const isNotExpired = endDate > now;

                    return isActive && isNotExpired ? (
                      <SaleBanner
                        //@ts-ignore
                        saleName={pricingConfig?.specialSale.saleName}
                        //@ts-ignore
                        percentage={pricingConfig?.specialSale.percentage}
                        //@ts-ignore
                        endDate={pricingConfig?.specialSale.endDate}
                      />
                    ) : null;
                  })()}

                  {/* Tap Sticker on Phone Display */}
                  <div className="justify-start">
                    {/* Bottom Sticker Layout */}
                    <div className="w-auto md:w-auto lg:w-[40%] xl:w-[40%]">
                      <div
                        className="bg-gray-900 rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between h-[200px]"
                        style={{
                          background:
                            colorSchemes[selectedColor]?.bg ||
                            colorSchemes.black.bg,
                          color:
                            colorSchemes[selectedColor]?.text ||
                            colorSchemes.black.text,
                        }}
                      >
                        {/* Left side - Logo or Text */}
                        <div className="flex items-center justify-center">
                          {cardDetails.useLogoImage &&
                          cardDetails.tapStickerLogo ? (
                            <img
                              src={cardDetails.tapStickerLogo}
                              alt="Logo"
                              className="object-contain opacity-80 rounded-lg w-[200px] h-[140px] px-4 py-3"
                            />
                          ) : !cardDetails.useLogoImage ? (
                            <span className="text-[10px] font-bold text-gray-400 text-center text-lg font-semibold w-full">
                              {tapStickerTextAbbr || "SOLO"}
                            </span>
                          ) : null}
                        </div>

                        {/* Right side - Solo + QR Code */}
                        <div className="flex flex-col items-center gap-3">
                          {cardDetails.useLogoImage &&
                            !cardDetails.tapStickerLogo && (
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
                              className="w-20 h-20 opacity-80"
                            />
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
                  <Card className="bg-card shadow-lg">
                    <CardContent className="space-y-4 p-3 lg:p-6 xl:p-6 pt-3 lg:px-3 xl:px-12">
                      <div className="space-y-4">
                        {selectedProduct === "tapsticker" ? (
                          <>
                            {/* Product Info Section for Tap Sticker */}
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-2xl font-semibold">
                                  Solo
                                  <span className="text-outlined-card">
                                    .tap
                                  </span>{" "}
                                  <span className="italic">Sticker</span>
                                </h3>
                                <div className="flex items-end justify-between">
                                  <div className="flex items-end gap-2">
                                    <span className="text-xl font-bold text-foreground leading-none">
                                      4.9
                                    </span>
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="text-gray-400 leading-none">
                                      |
                                    </span>
                                    <span className="text-sm text-muted-foreground leading-none">
                                      1,000+ reviews
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    {(() => {
                                      //@ts-ignore
                                      let basePrice =
                                        pricingConfig?.stickers.essential
                                          .single;

                                      // Check if special sale is active and not expired
                                      //@ts-ignore
                                      const isSaleActive =
                                        //@ts-ignore
                                        pricingConfig?.specialSale.isActive &&
                                        //@ts-ignore
                                        new Date(
                                          pricingConfig?.specialSale.endDate,
                                        ) > new Date();

                                      // Store the true original price (before any sale)
                                      const trueOriginalPrice = basePrice;

                                      // Apply special sale discount to base price if active
                                      if (isSaleActive) {
                                        //@ts-ignore
                                        basePrice =
                                          basePrice *
                                          //@ts-ignore
                                          (1 -
                                            pricingConfig?.specialSale
                                              .percentage /
                                              100);
                                      }

                                      const quantities = {
                                        single: 1,
                                        double: 2,
                                        pack: 5,
                                      };
                                      const quantity =
                                        quantities[selectedQuantity];

                                      // Calculate prices
                                      const originalPriceTotal =
                                        trueOriginalPrice * quantity;
                                      const saleAdjustedPrice =
                                        basePrice * quantity;

                                      const discountPercent =
                                        selectedQuantity === "single"
                                          ? 0
                                          : //@ts-ignore
                                            selectedQuantity === "double"
                                            ? //@ts-ignore
                                              pricingConfig?.discounts.double
                                            : //@ts-ignore
                                              pricingConfig?.discounts.pack;
                                      const discountedPrice =
                                        saleAdjustedPrice *
                                        (1 - discountPercent / 100);

                                      // Add custom logo fee AFTER discount (no discount applied to this fee)

                                      const logoFee = addCustomLogoToSticker
                                        ? //@ts-ignore
                                          pricingConfig?.addOns.customLogoFee *
                                          quantity
                                        : 0;
                                      const totalPrice =
                                        discountedPrice + logoFee;

                                      const discountedPricePerSticker =
                                        discountedPrice / quantity;

                                      // Show strikethrough if sale is active OR quantity discount applies
                                      const showStrikethrough =
                                        isSaleActive ||
                                        selectedQuantity !== "single";

                                      // Calculate total savings
                                      const totalSavings =
                                        originalPriceTotal -
                                        (totalPrice - logoFee);

                                      return (
                                        <>
                                          {selectedQuantity !== "single" && (
                                            <span className="text-sm text-muted-foreground">
                                              $
                                              {discountedPricePerSticker.toFixed(
                                                2,
                                              )}
                                              /each
                                            </span>
                                          )}
                                          <div className="flex items-center gap-2">
                                            {showStrikethrough && (
                                              <span className="text-sm font-semibold text-muted-foreground line-through">
                                                ${originalPriceTotal.toFixed(2)}
                                              </span>
                                            )}
                                            <span className="text-xl font-bold text-foreground leading-none">
                                              ${totalPrice.toFixed(2)}
                                            </span>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <Separator />

                              {/* Color Selection for Tap Sticker */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium">
                                    Color
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor:
                                          {
                                            red: "#EF4444",
                                            pink: "#EC4899",
                                            yellow: "#EAB308",
                                            green: "#059669",
                                            blue: "#3B82F6",
                                            purple: "#8B5CF6",
                                            white: "#FFFFFF",
                                            black: "#000000",
                                            gray: "#4f4e4f",
                                          }[selectedColor] || "#000000",
                                      }}
                                    />
                                    <span
                                      className={cn(
                                        "text-sm font-medium uppercase",
                                        (hoveredColor &&
                                          pricingConfig?.outOfStockColors?.[
                                            hoveredColor
                                          ]) ||
                                          (!hoveredColor &&
                                            pricingConfig?.outOfStockColors?.[
                                              selectedColor
                                            ])
                                          ? "text-red-500 font-semibold"
                                          : "",
                                      )}
                                    >
                                      {hoveredColor
                                        ? `${hoveredColor}${pricingConfig?.outOfStockColors?.[hoveredColor] ? " - out of stock" : ""}`
                                        : `${selectedColor}${pricingConfig?.outOfStockColors?.[selectedColor] ? " - out of stock" : ""}`}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {[
                                    { name: "Red", hex: "#EF4444" },
                                    { name: "Pink", hex: "#EC4899" },
                                    { name: "Yellow", hex: "#EAB308" },
                                    { name: "Green", hex: "#059669" },
                                    { name: "Blue", hex: "#3B82F6" },
                                    { name: "Purple", hex: "#8B5CF6" },
                                    { name: "White", hex: "#FFFFFF" },
                                    { name: "Black", hex: "#000000" },
                                    { name: "Gray", hex: "#4f4e4f" },
                                  ].map((colorOption) => {
                                    const isColorOOS =
                                      !!pricingConfig?.outOfStockColors?.[
                                        colorOption.name.toLowerCase()
                                      ];
                                    return (
                                      <button
                                        key={colorOption.name}
                                        onMouseEnter={() =>
                                          setHoveredColor(
                                            colorOption.name.toLowerCase(),
                                          )
                                        }
                                        onMouseLeave={() =>
                                          setHoveredColor(null)
                                        }
                                        onClick={() => {
                                          if (isColorOOS) return;
                                          setSelectedColor(
                                            colorOption.name.toLowerCase(),
                                          );
                                          setCardDetails((prev) => ({
                                            ...prev,
                                            tapStickerColor:
                                              colorOption.name.toLowerCase(),
                                          }));
                                        }}
                                        className={`w-6 h-6 rounded-full border-2 transition-all relative ${
                                          selectedColor ===
                                          colorOption.name.toLowerCase()
                                            ? "border-primary ring-2 ring-primary ring-offset-2"
                                            : "border-gray-300 hover:border-gray-400"
                                        } ${
                                          isColorOOS
                                            ? "opacity-35 cursor-not-allowed"
                                            : "hover:scale-110 transition-transform cursor-pointer"
                                        }`}
                                        style={{
                                          backgroundColor: colorOption.hex,
                                        }}
                                        title={
                                          isColorOOS
                                            ? `${colorOption.name} - out of stock`
                                            : colorOption.name
                                        }
                                      >
                                        {isColorOOS && (
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-full h-[2px] bg-red-500 rotate-45" />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Quantity Selection for Tap Sticker */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm font-medium">
                                    Quantity
                                  </label>
                                  <Info className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                                  <button
                                    onClick={() =>
                                      setSelectedQuantity("single")
                                    }
                                    className={`p-2 lg:p-4 xl:p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                                      selectedQuantity === "single"
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    }`}
                                  >
                                    <div className="text-center">
                                      <div className="font-semibold">
                                        Single
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        1 sticker
                                      </div>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSelectedQuantity("double")
                                    }
                                    className={`p-2 lg:p-4 xl:p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                                      selectedQuantity === "double"
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    }`}
                                  >
                                    <div className="text-center space-y-1">
                                      <div className="font-semibold">
                                        Double
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        2 stickers
                                      </div>
                                      <div className="text-[10px] lg:text-xs xl:text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                        SAVE 5%
                                      </div>
                                      <div className="text-[10px] lg:text-xs xl:text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                        FREE SHIPPING
                                      </div>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => setSelectedQuantity("pack")}
                                    className={`p-2 lg:p-4 xl:p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                                      selectedQuantity === "pack"
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    }`}
                                  >
                                    <div className="text-center space-y-1">
                                      <div className="font-semibold">Pack</div>
                                      <div className="text-sm text-muted-foreground">
                                        5 stickers
                                      </div>
                                      <div className="text-[10px] lg:text-xs xl:text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                                        SAVE 20%
                                      </div>
                                      <div className="text-[10px] lg:text-xs xl:text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                        FREE SHIPPING
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Digital Card Assignment */}
                            {/* <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Assign to Digital Business Card
                  {selectedQuantity !== "single" ? "s" : ""}
                </Label>
                {Array.from({
                  length:
                    selectedQuantity === "single"
                      ? 1
                      : selectedQuantity === "double"
                      ? 2
                      : 5,
                }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {selectedQuantity !== "single" && (
                      <span className="text-xs text-muted-foreground w-20">
                        Sticker {index + 1}:
                      </span>
                    )}
                    <Select
                      value={assignedDigitalCards[index]}
                      onValueChange={(value) => {
                        const newCards = [...assignedDigitalCards];
                        newCards[index] = value;

                        // Remove empty strings
                        const cleanedCards = newCards.filter(
                          (item) => item !== ""
                        );

                        setAssignedDigitalCards(cleanedCards);

                        setCardDetails((prev) => ({
                          ...prev,
                          assignedDigitalCard: cleanedCards,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a digital card" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {businessCards.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No cards available - Create one first
                          </SelectItem>
                        ) : (
                          businessCards.map((card) => (
                            <SelectItem
                              key={card.metadata.id}
                              value={card.metadata.id}
                            >
                              {card.profile.firstName} {card.profile.lastName}{" "}
                              {card.profile.title
                                ? `- ${card.profile.title}`
                                : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div> */}

                            {/* Add to Cart Button for Tap Stickers */}
                            <Button
                              size="lg"
                              className="w-full mt-6 h-14 text-lg font-semibold bg-gray-900 hover:bg-gray-800 text-white"
                              onClick={() => {
                                // const requiredCount =
                                //   selectedQuantity === "single"
                                //     ? 1
                                //     : selectedQuantity === "double"
                                //     ? 2
                                //     : 5;
                                // const assignedCount = assignedDigitalCards
                                //   .slice(0, requiredCount)
                                //   .filter((c) => c && c !== "").length;
                                // if (assignedCount < requiredCount) {
                                //   setShowCardWarningModal(true);
                                //   return;
                                // }

                                //@ts-ignore
                                let basePrice =
                                  pricingConfig?.stickers.essential.single;

                                //@ts-ignore
                                const isSaleActive =
                                  //@ts-ignore
                                  pricingConfig?.specialSale.isActive &&
                                  //@ts-ignore
                                  new Date(pricingConfig?.specialSale.endDate) >
                                    new Date();

                                const trueOriginalPrice = basePrice;
                                if (isSaleActive) {
                                  //@ts-ignore
                                  basePrice =
                                    basePrice *
                                    //@ts-ignore
                                    (1 -
                                      pricingConfig?.specialSale.percentage /
                                        100);
                                }

                                const quantities = {
                                  single: 1,
                                  double: 2,
                                  pack: 5,
                                };
                                const quantity = quantities[selectedQuantity];

                                const originalPriceTotal =
                                  trueOriginalPrice * quantity;
                                const saleAdjustedPrice = basePrice * quantity;

                                const discountPercent =
                                  selectedQuantity === "single"
                                    ? 0
                                    : //@ts-ignore
                                      selectedQuantity === "double"
                                      ? //@ts-ignore
                                        pricingConfig?.discounts.double
                                      : //@ts-ignore
                                        pricingConfig?.discounts.pack;
                                const discountedPrice =
                                  saleAdjustedPrice *
                                  (1 - discountPercent / 100);

                                const logoFee = addCustomLogoToSticker
                                  ? //@ts-ignore
                                    pricingConfig?.addOns.customLogoFee *
                                    quantity
                                  : 0;
                                const totalPrice = discountedPrice + logoFee;

                                addItem({
                                  type: "tap-sticker",
                                  name: `Solo Tap Sticker (${quantity}x)`,
                                  quantity: quantity,
                                  unitPrice: totalPrice / quantity,
                                  originalPrice: originalPriceTotal / quantity,
                                  options: {
                                    customLogo: addCustomLogoToSticker,
                                  },
                                  //@ts-ignore
                                  image: nfcStickers,
                                  selectedCard: "sticker",
                                  cardDetails: {
                                    firstName: cardDetails.firstName,
                                    lastName: cardDetails.lastName,
                                    companyName: cardDetails.companyName,
                                    additionalInfo: cardDetails.additionalInfo,
                                    phone: cardDetails.phone,
                                    email: cardDetails.email,
                                    website: cardDetails.website,
                                    address: cardDetails.address,
                                    city: cardDetails.city,
                                    state: cardDetails.state,
                                    zipCode: cardDetails.zipCode,
                                    logo: cardDetails.logo,
                                    customLogo: cardDetails.customLogo,
                                    personalizeLogo:
                                      cardDetails.personalizeLogo,
                                    logoText: cardDetails.logoText,
                                    frontLogo: cardDetails.frontLogo,
                                    backLogo: cardDetails.backLogo,
                                    useLogoImage: cardDetails.useLogoImage,
                                    assignedDigitalCard:
                                      cardDetails.assignedDigitalCard,
                                    optionalText: optionalText,
                                    customCardDesignType: customCardDesignType,
                                    showQRCodeOnBack:
                                      cardDetails.showQRCodeOnBack,
                                    qrCodePosition: cardDetails.qrCodePosition,
                                    hideTextOnBack: cardDetails.hideTextOnBack,
                                    tapStickerLogo: cardDetails.tapStickerLogo,
                                    tapStickerText: cardDetails.tapStickerText,
                                    tapStickerColor:
                                      cardDetails.tapStickerColor,
                                    cardType: "Stickers",
                                  },
                                });
                              }}
                            >
                              <ShoppingBasket className="h-5 w-5" />
                              Add to Cart
                            </Button>

                            {/* Assignment Info */}
                            <p className="text-center text-muted-foreground text-sm mt-4">
                              {/* All orders must be assigned to an existing digital business
                card. */}
                              After placing your order, create a Free! card
                              profile if you do not already have one.
                              <br />
                              <a
                                href="/"
                                className="text-primary hover:underline"
                              >
                                Create your free digital card here
                              </a>
                            </p>

                            {/* Crop Modal */}
                            {showCropModal && cropImage && (
                              <div
                                key={selectedCard}
                                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0"
                              >
                                <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                                  <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">
                                      Crop Image (1.6:1 Aspect Ratio)
                                    </h3>
                                    <button
                                      onClick={() => {
                                        setShowCropModal(false);
                                        setCropImage(null);
                                      }}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      <X className="h-5 w-5" />
                                    </button>
                                  </div>

                                  <div className="mb-4">
                                    <ReactCrop
                                      crop={crop}
                                      onChange={(c) => setCrop(c)}
                                      onComplete={(c) => setCompletedCrop(c)}
                                      aspect={1.6}
                                      minWidth={80}
                                      minHeight={50}
                                      keepSelection
                                      locked={false}
                                    >
                                      <img
                                        ref={imgRef}
                                        src={cropImage}
                                        alt="Crop preview"
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: "60vh",
                                        }}
                                      />
                                    </ReactCrop>
                                  </div>

                                  <div className="flex gap-3 justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setShowCropModal(false);
                                        setCropImage(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button onClick={handleCropComplete}>
                                      Apply Crop
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : selectedCard === "custom" ? (
                          <>
                            <div className="flex items-center gap-3 mb-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCard("essential")}
                                className="p-2 bg-blue-500 hover:bg-blue-600"
                              >
                                <ArrowLeft className="h-4 w-4 text-white" />
                                <span className="text-white">Back</span>
                              </Button>
                              <h2 className="text-base lg:text-xl xl:text-xl font-semibold">
                                Customize your card
                              </h2>
                            </div>
                            <div className="space-y-4">
                              {/* Card Design Type Selection */}
                              <div className="space-y-3">
                                <label className="font-medium">
                                  Select Card Design Type
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Button
                                    variant={
                                      customCardDesignType === "image-text"
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() =>
                                      setCustomCardDesignType("image-text")
                                    }
                                    className="h-auto flex-col py-4"
                                  >
                                    <span className="font-semibold">
                                      Image + Text
                                    </span>
                                    <span className="text-xs mt-1 opacity-80">
                                      Front: Image, Back: Text
                                    </span>
                                  </Button>
                                  <Button
                                    variant={
                                      customCardDesignType === "image-image"
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() =>
                                      setCustomCardDesignType("image-image")
                                    }
                                    className="h-auto flex-col py-4"
                                  >
                                    <span className="font-semibold">
                                      Image + Image
                                    </span>
                                    <span className="text-xs mt-1 opacity-80">
                                      Front: Image, Back: Image
                                    </span>
                                  </Button>
                                </div>
                              </div>

                              {/* Hide Text toggle for Image + Text design */}
                              {customCardDesignType === "image-text" && (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="hideTextOnBack"
                                    checked={hideTextOnBack}
                                    onChange={(e) => {
                                      const value = e.target.checked;

                                      setHideTextOnBack(value);
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        hideTextOnBack: value,
                                      }));
                                    }}
                                    //onChange={(e) => setHideTextOnBack(e.target.checked)}
                                    className="rounded"
                                  />
                                  <label
                                    htmlFor="hideTextOnBack"
                                    className="text-sm font-medium"
                                  >
                                    Hide text on back
                                  </label>
                                </div>
                              )}

                              {customCardDesignType === "image-text" ? (
                                <>
                                  {/* Top Card Design Upload */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Image className="h-4 w-4 text-gray-600" />
                                      <label className="font-medium">
                                        Top Card Design
                                      </label>
                                    </div>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                      {cardDetails.customLogo ? (
                                        <div className="relative">
                                          <img
                                            src={cardDetails.customLogo}
                                            alt="Preview"
                                            className="w-full h-32 object-contain rounded-lg mb-2"
                                          />
                                          <button
                                            //onClick={() => setCustomCardImage(null)}
                                            onClick={() =>
                                              setCardDetails((prev) => ({
                                                ...prev,
                                                customLogo: null,
                                              }))
                                            }
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                          <div className="text-sm text-gray-600">
                                            {cardDetails?.customLogo?.name}
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                handleImageUpload(file);
                                              }
                                            }}
                                            className="hidden"
                                            id="custom-card-upload"
                                          />
                                          <label
                                            htmlFor="custom-card-upload"
                                            className="cursor-pointer"
                                          >
                                            <div className="text-gray-500">
                                              Upload your full card design or{" "}
                                              <span className="text-red-500">
                                                browse
                                              </span>
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">
                                              Covers entire front card area •
                                              JPG, JPEG, PNG
                                            </div>
                                          </label>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Front Image Upload */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Image className="h-4 w-4 text-gray-600" />
                                      <label className="font-medium">
                                        Front Card Image
                                      </label>
                                    </div>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                      {cardDetails.frontLogo ? (
                                        <div className="relative">
                                          <img
                                            src={cardDetails.frontLogo}
                                            alt="Front Preview"
                                            className="w-full h-32 object-contain rounded-lg mb-2"
                                          />
                                          <button
                                            //onClick={() => setCustomCardFrontImage(null)}
                                            onClick={() =>
                                              setCardDetails((prev) => ({
                                                ...prev,
                                                frontLogo: null,
                                              }))
                                            }
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                          <div className="text-sm text-gray-600">
                                            {cardDetails.frontLogo.name}
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              setImageImageSide("front");
                                              if (file) {
                                                handleImageUpload(file);
                                                // setCustomCardFrontImage(file);
                                                // const url = await uploadLogoToFirebase(
                                                //   file,
                                                //   user?.uid
                                                // );
                                                // setCardDetails((prev) => ({
                                                //   ...prev,
                                                //   frontLogo: url,
                                                // }));
                                              }
                                            }}
                                            className="hidden"
                                            id="custom-card-front-upload"
                                          />
                                          <label
                                            htmlFor="custom-card-front-upload"
                                            className="cursor-pointer"
                                          >
                                            <div className="text-gray-500">
                                              Upload front card image or{" "}
                                              <span className="text-red-500">
                                                browse
                                              </span>
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">
                                              JPG, JPEG, PNG
                                            </div>
                                          </label>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Back Image Upload */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Image className="h-4 w-4 text-gray-600" />
                                      <label className="font-medium">
                                        Back Card Image
                                      </label>
                                    </div>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                      {cardDetails.backLogo ? (
                                        <div className="relative">
                                          <img
                                            src={cardDetails.backLogo}
                                            alt="Back Preview"
                                            className="w-full h-32 object-contain rounded-lg mb-2"
                                          />
                                          <button
                                            //onClick={() => setCustomCardBackImage(null)}
                                            onClick={() =>
                                              setCardDetails((prev) => ({
                                                ...prev,
                                                backLogo: null,
                                              }))
                                            }
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                          <div className="text-sm text-gray-600">
                                            {cardDetails.backLogo.name}
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              setImageImageSide("back");
                                              if (file) {
                                                handleImageUpload(file);
                                                // setCustomCardBackImage(file);
                                                // const url = await uploadLogoToFirebase(
                                                //   file,
                                                //   user?.uid
                                                // );
                                                // setCardDetails((prev) => ({
                                                //   ...prev,
                                                //   backLogo: url,
                                                // }));
                                              }
                                            }}
                                            className="hidden"
                                            id="custom-card-back-upload"
                                          />
                                          <label
                                            htmlFor="custom-card-back-upload"
                                            className="cursor-pointer"
                                          >
                                            <div className="text-gray-500">
                                              Upload back card image or{" "}
                                              <span className="text-red-500">
                                                browse
                                              </span>
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">
                                              JPG, JPEG, PNG
                                            </div>
                                          </label>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* QR Code Options */}
                                  <div className="space-y-3"></div>
                                </>
                              )}

                              {/* Crop Modal */}
                              {showCropModal && cropImage && (
                                <div
                                  key={selectedCard}
                                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0"
                                >
                                  <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                                    <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-lg font-semibold">
                                        Crop Image (1.6:1 Aspect Ratio)
                                      </h3>
                                      <button
                                        onClick={() => {
                                          setShowCropModal(false);
                                          setCropImage(null);
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        <X className="h-5 w-5" />
                                      </button>
                                    </div>

                                    <div className="mb-4">
                                      <ReactCrop
                                        crop={crop}
                                        onChange={(c) => setCrop(c)}
                                        onComplete={(c) => setCompletedCrop(c)}
                                        aspect={1.6}
                                        minWidth={80}
                                        minHeight={50}
                                        keepSelection
                                        locked={false}
                                      >
                                        <img
                                          ref={imgRef}
                                          src={cropImage}
                                          alt="Crop preview"
                                          style={{
                                            maxWidth: "100%",
                                            maxHeight: "60vh",
                                          }}
                                        />
                                      </ReactCrop>
                                    </div>

                                    <div className="flex gap-3 justify-end">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setShowCropModal(false);
                                          setCropImage(null);
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button onClick={handleCropComplete}>
                                        Apply Crop
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Form Grid - Only for image-text design */}
                              {customCardDesignType === "image-text" &&
                                !hideTextOnBack && (
                                  <>
                                    {/* Form Grid - 2 columns on desktop */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Company Name Field */}
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-4 w-4 text-gray-600" />
                                          <label className="font-medium text-sm">
                                            Company name
                                          </label>
                                        </div>
                                        <Input
                                          placeholder="Company name"
                                          value={cardDetails.companyName}
                                          onChange={(e) =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              companyName: e.target.value,
                                            }))
                                          }
                                        />
                                      </div>

                                      {/* Name Field */}
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-gray-600" />
                                          <label className="font-medium text-sm">
                                            Name
                                          </label>
                                        </div>
                                        <Input
                                          placeholder="First name"
                                          value={cardDetails.firstName}
                                          onChange={(e) =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              firstName: e.target.value,
                                            }))
                                          }
                                        />
                                      </div>

                                      {/* Additional Information */}
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Info className="h-4 w-4 text-gray-600" />
                                          <label className="font-medium text-sm">
                                            Additional information
                                          </label>
                                        </div>
                                        <Input
                                          placeholder="Position or title"
                                          value={cardDetails.additionalInfo}
                                          onChange={(e) =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              additionalInfo: e.target.value,
                                            }))
                                          }
                                        />
                                      </div>

                                      {/* Phone Field */}
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-gray-600" />
                                          <label className="font-medium text-sm">
                                            Phone number
                                          </label>
                                        </div>
                                        <Input
                                          placeholder="Phone number"
                                          value={cardDetails.phone}
                                          onChange={(e) =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              phone: e.target.value,
                                            }))
                                          }
                                        />
                                      </div>

                                      {/* Email Field */}
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-4 w-4 text-gray-600" />
                                          <label className="font-medium text-sm">
                                            Email address
                                          </label>
                                        </div>
                                        <Input
                                          placeholder="Email address"
                                          value={cardDetails.email}
                                          onChange={(e) =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              email: e.target.value,
                                            }))
                                          }
                                        />
                                      </div>

                                      {/* Website Field */}
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Globe className="h-4 w-4 text-gray-600" />
                                          <label className="font-medium text-sm">
                                            Website
                                          </label>
                                        </div>
                                        <Input
                                          placeholder="Website URL"
                                          value={cardDetails.website}
                                          onChange={(e) =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              website: e.target.value,
                                            }))
                                          }
                                        />
                                      </div>
                                    </div>

                                    {/* Address Fields - Full width */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-600" />
                                        <label className="font-medium text-sm">
                                          Address
                                        </label>
                                      </div>
                                      <Input
                                        placeholder="Street address"
                                        value={cardDetails.address}
                                        onChange={(e) =>
                                          setCardDetails((prev) => ({
                                            ...prev,
                                            address: e.target.value,
                                          }))
                                        }
                                      />
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <Input
                                          placeholder="City"
                                          value={cardDetails.city}
                                          onChange={(e) =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              city: e.target.value,
                                            }))
                                          }
                                        />
                                        <Input
                                          placeholder="State"
                                          value={cardDetails.state}
                                          onChange={(e) =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              state: e.target.value,
                                            }))
                                          }
                                        />
                                        <Input
                                          placeholder="ZIP Code"
                                          value={cardDetails.zipCode}
                                          onChange={(e) =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              zipCode: e.target.value,
                                            }))
                                          }
                                        />
                                      </div>
                                    </div>
                                  </>
                                )}
                            </div>
                          </>
                        ) : selectedCard === "infinite" ? (
                          <>
                            <div className="flex items-center gap-3 mb-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCard("essential")}
                                className="p-2 bg-blue-500 hover:bg-blue-600"
                              >
                                <ArrowLeft className="h-4 w-4 text-white" />
                                <span className="text-white">Back</span>
                              </Button>
                              <h2 className="text-xl font-semibold">
                                Personalize your card
                              </h2>
                            </div>
                            <div className="space-y-4">
                              {/* Form Grid - 2 columns on desktop */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Company Name Field */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-600" />
                                    <label className="font-medium text-sm">
                                      Company name
                                    </label>
                                  </div>
                                  <Input
                                    placeholder="Company name"
                                    value={cardDetails.companyName}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        companyName: e.target.value,
                                      }))
                                    }
                                  />
                                </div>

                                {/* Name Fields */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-600" />
                                    <label className="font-medium text-sm">
                                      Name
                                    </label>
                                  </div>
                                  <Input
                                    placeholder="First name"
                                    value={cardDetails.firstName}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        firstName: e.target.value,
                                      }))
                                    }
                                  />
                                </div>

                                {/* Additional Information - spans both columns on desktop */}
                                <div className="space-y-2 md:col-span-2">
                                  <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-gray-600" />
                                    <label className="font-medium text-sm">
                                      Additional information
                                    </label>
                                  </div>
                                  <Input
                                    placeholder="Position or title"
                                    value={cardDetails.additionalInfo}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        additionalInfo: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>

                              {/* Logo/Text Toggle */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Image className="h-4 w-4 text-gray-600" />
                                    <label className="font-medium">
                                      Top Right Display
                                    </label>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm">
                                    <span
                                      className={
                                        !cardDetails.useLogoImage
                                          ? "font-medium"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      Text Abbr.
                                    </span>

                                    <Switch
                                      checked={cardDetails.useLogoImage}
                                      onCheckedChange={(checked) =>
                                        setCardDetails((prev) => ({
                                          ...prev,
                                          useLogoImage: checked,
                                        }))
                                      }
                                    />

                                    <span
                                      className={
                                        cardDetails.useLogoImage
                                          ? "font-medium"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      Logo
                                    </span>
                                  </div>
                                </div>

                                {cardDetails.useLogoImage ? (
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    {cardDetails.personalizeLogo ? (
                                      <div className="relative">
                                        <img
                                          src={cardDetails.personalizeLogo}
                                          alt="Logo Preview"
                                          className="w-full h-32 object-contain rounded-lg mb-2"
                                        />

                                        {/* Close Icon */}
                                        <button
                                          onClick={() =>
                                            setCardDetails((prev) => ({
                                              ...prev,
                                              personalizeLogo: null,
                                            }))
                                          }
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>

                                        {/* File Name */}
                                        <div className="text-sm text-gray-600">
                                          {cardDetails?.personalizeLogo?.name}
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              handleImageUpload(file);
                                              // const url = await uploadLogoToFirebase(
                                              //   file,
                                              //   user?.uid
                                              // );

                                              // setCardDetails((prev) => ({
                                              //   ...prev,
                                              //   logo: url,
                                              // }));
                                            }
                                          }}
                                          className="hidden"
                                          id="logo-upload"
                                        />

                                        <label
                                          htmlFor="logo-upload"
                                          className="cursor-pointer"
                                        >
                                          <div className="text-gray-500">
                                            Drop your image here, or{" "}
                                            <span className="text-red-500">
                                              browse
                                            </span>
                                          </div>
                                          <div className="text-sm text-gray-400 mt-1">
                                            Supports JPG, JPEG, and PNG
                                          </div>
                                        </label>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <Input
                                    placeholder="Company name abbreviation here"
                                    value={cardDetails.logoText}
                                    onChange={(e) =>
                                      setCardDetails((prev) => ({
                                        ...prev,
                                        logoText: e.target.value,
                                      }))
                                    }
                                  />
                                )}
                              </div>
                            </div>

                            {/* Crop Modal */}
                            {showCropModal && cropImage && (
                              <div
                                key={selectedCard}
                                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                              >
                                <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                                  <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">
                                      Crop Image (1.6:1 Aspect Ratio)
                                    </h3>
                                    <button
                                      onClick={() => {
                                        setShowCropModal(false);
                                        setCropImage(null);
                                      }}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      <X className="h-5 w-5" />
                                    </button>
                                  </div>

                                  <div className="mb-4">
                                    <ReactCrop
                                      crop={crop}
                                      onChange={(c) => setCrop(c)}
                                      onComplete={(c) => setCompletedCrop(c)}
                                      aspect={1.6}
                                      minWidth={80}
                                      minHeight={50}
                                      keepSelection
                                      locked={false}
                                    >
                                      <img
                                        ref={imgRef}
                                        src={cropImage}
                                        alt="Crop preview"
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: "60vh",
                                        }}
                                      />
                                    </ReactCrop>
                                  </div>

                                  <div className="flex gap-3 justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setShowCropModal(false);
                                        setCropImage(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button onClick={handleCropComplete}>
                                      Apply Crop
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <h2 className="text-xl font-semibold mb-4">
                              Choose your card
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Essential Card */}
                              <div
                                className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                  selectedCard === "essential" &&
                                  selectedProduct === "cards"
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                } ${pricingConfig?.outOfStock?.essential ? "opacity-60" : ""}`}
                                style={{
                                  backgroundImage: `url(/lovable-uploads/essential-card-product.png)`,
                                  backgroundPosition: "right center",
                                  backgroundSize: "35% auto",
                                  backgroundRepeat: "no-repeat",
                                  backgroundBlendMode: "soft-light",
                                }}
                                onClick={() => {
                                  if (pricingConfig?.outOfStock?.essential) {
                                    alert(
                                      "Essential Out Of Stock Card/color coming Soon!",
                                    );
                                    return;
                                  }
                                  setSelectedColor("gray");
                                  setSelectedCard("essential");
                                  setSelectedProduct("cards");
                                }}
                              >
                                <div>
                                  <div className="flex justify-between items-start mr-[35%]">
                                    <h3 className="font-semibold text-lg">
                                      Solo
                                      <span className="text-outlined-card">
                                        .card
                                      </span>{" "}
                                      <span className="italic">Essential</span>
                                    </h3>
                                    {pricingConfig?.outOfStock?.essential && (
                                      <Badge
                                        variant="destructive"
                                        className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                      >
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                    The last business card you'll ever need. It
                                    comes pre-designed with your information
                                    loaded on the card and the QR code.
                                  </p>
                                </div>
                              </div>

                              {/* Infinite Card */}
                              <div
                                className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                  selectedCard === "infinite" &&
                                  selectedProduct === "cards"
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                } ${pricingConfig?.outOfStock?.personalize ? "opacity-60" : ""}`}
                                style={{
                                  backgroundImage: `url(/lovable-uploads/Personalize.png)`,
                                  backgroundPosition: "right center",
                                  backgroundSize: "35% auto",
                                  backgroundRepeat: "no-repeat",
                                  backgroundBlendMode: "soft-light",
                                }}
                                onClick={() => {
                                  if (pricingConfig?.outOfStock?.personalize) {
                                    alert(
                                      "Personal Out Of Stock Card/color coming Soon!",
                                    );
                                    return;
                                  }
                                  setSelectedColor("gray");
                                  setSelectedCard("infinite");
                                  setSelectedProduct("cards");
                                }}
                              >
                                <div>
                                  <div className="flex justify-between items-start mr-[35%]">
                                    <h3 className="font-semibold text-lg">
                                      Solo
                                      <span className="text-outlined-card">
                                        .card
                                      </span>{" "}
                                      <span className="italic">
                                        Personalize
                                      </span>
                                    </h3>
                                    {pricingConfig?.outOfStock?.personalize && (
                                      <Badge
                                        variant="destructive"
                                        className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                      >
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                    Personalize your card and make an
                                    impression. Submit your company and contact
                                    information, including your logo if
                                    required.
                                  </p>
                                </div>
                              </div>

                              {/* Custom Card */}
                              <div
                                className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                  selectedCard === "custom" &&
                                  selectedProduct === "cards"
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                } ${pricingConfig?.outOfStock?.custom ? "opacity-60" : ""}`}
                                style={{
                                  backgroundImage: `url(/lovable-uploads/custom-card-product.png)`,
                                  backgroundPosition: "right center",
                                  backgroundSize: "35% auto",
                                  backgroundRepeat: "no-repeat",
                                  backgroundBlendMode: "soft-light",
                                }}
                                onClick={() => {
                                  if (pricingConfig?.outOfStock?.custom) {
                                    alert(
                                      "Custom Out Of Stock Card/color coming Soon!",
                                    );
                                    return;
                                  }
                                  setSelectedColor("gray");
                                  setSelectedCard("custom");
                                  setSelectedProduct("cards");
                                }}
                              >
                                <div>
                                  <div className="flex justify-between items-start mr-[35%]">
                                    <h3 className="font-semibold text-lg">
                                      Solo
                                      <span className="text-outlined-card">
                                        .card
                                      </span>{" "}
                                      <span className="italic">Custom</span>
                                    </h3>
                                    {pricingConfig?.outOfStock?.custom && (
                                      <Badge
                                        variant="destructive"
                                        className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                      >
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                    Your branding, no limits. Just upload an
                                    image with your design. For best custom
                                    results, use a monotone color design.
                                  </p>
                                </div>
                              </div>

                              {/* Tap Sticker */}
                              <div
                                className={`group border rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden ${
                                  (selectedProduct as string) === "tapsticker"
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                                } ${pricingConfig?.outOfStock?.sticker ? "opacity-60" : ""}`}
                                style={{
                                  backgroundImage: `url(/lovable-uploads/tap-sticker-product.png)`,
                                  backgroundPosition: "right center",
                                  backgroundSize: "35% auto",
                                  backgroundRepeat: "no-repeat",
                                  backgroundBlendMode: "soft-light",
                                }}
                                onClick={() => {
                                  if (pricingConfig?.outOfStock?.sticker) {
                                    alert(
                                      "Sticker Out Of Stock Card/color coming Soon!",
                                    );
                                    return;
                                  }
                                  setSelectedColor("gray");
                                  setSelectedProduct("tapsticker");
                                  setSelectedCard("essential");
                                }}
                              >
                                <div>
                                  <div className="flex justify-between items-start mr-[35%]">
                                    <h3 className="font-semibold text-lg">
                                      Solo
                                      <span className="text-outlined-card">
                                        .tap
                                      </span>{" "}
                                      <span className="italic">Sticker</span>
                                    </h3>
                                    {pricingConfig?.outOfStock?.sticker && (
                                      <Badge
                                        variant="destructive"
                                        className="bg-red-600 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5"
                                      >
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-sm opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:max-h-20 group-hover:mt-2">
                                    With a Tap Sticker, you can easily share
                                    your contact information and more. Just one
                                    scan or tap away from a new connection.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Pricing Options or Customization */}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Why Choose Our NFC Products?</CardTitle>
              <CardDescription>
                Premium quality accessories for seamless digital networking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Instant Sharing</h4>
                    <p className="text-sm text-muted-foreground">
                      Share your contact info with just a tap
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Premium Materials</h4>
                    <p className="text-sm text-muted-foreground">
                      High-quality, durable construction
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">
                      Universal Compatibility
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Works with all NFC-enabled devices
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon Modal */}
          {showComingSoonModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0">
              <div className="bg-orange-50 rounded-lg p-8 max-w-md mx-4 relative">
                <button
                  onClick={() => setShowComingSoonModal(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-semibold text-orange-900 mb-4">
                  Custom NFC Cards coming soon!
                </h2>
                <p className="text-orange-800">
                  We're working on bringing you custom NFC card options. Stay
                  tuned!
                </p>
              </div>
            </div>
          )}

          {/* Card Warning Modal */}
          {showCardWarningModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0">
              <div className="bg-orange-50 rounded-lg p-8 max-w-md mx-4">
                <h2 className="text-xl font-semibold text-orange-900 mb-4">
                  Important Notice
                </h2>
                <p className="text-orange-800 mb-6">
                  Kindly select a digital card before continuing to the
                  add-to-cart step.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => setShowCardWarningModal(false)}
                    variant="outline"
                    className="bg-white hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setShowCardWarningModal(false)}
                    className="bg-orange-700 hover:bg-orange-800 text-white"
                  >
                    Understood
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Material Coming Soon Dialog */}
          <AlertDialog
            open={showMaterialComingSoon}
            onOpenChange={setShowMaterialComingSoon}
          >
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogCancel className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </AlertDialogCancel>
                <AlertDialogTitle className="text-xl">
                  This material is coming soon!
                </AlertDialogTitle>
              </AlertDialogHeader>
              <p className="text-muted-foreground">
                We're working on bringing you custom NFC card options. Stay
                tuned!
              </p>
            </AlertDialogContent>
          </AlertDialog>

          {showPermissionModal && (
            <div
              className={cn(
                "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center left-64 !mt-0",
              )}
            >
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

              {/* Modal Box */}
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 z-50 w-full max-w-md mx-4 text-center">
                {/* Icon / Visual cue */}
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-7 h-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Permission Required
                </h2>

                {/* Message */}
                <p className="text-gray-600 mb-8 leading-relaxed">
                  You need to{" "}
                  <span className="font-medium text-gray-800">sign in</span>
                  to access this page. Please log in with your account.
                </p>

                {/* Actions */}
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPermissionModal(false)}
                    className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPermissionModal(false);
                      setTimeout(() => router.replace("/?signIn=true"), 200);
                    }}
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
