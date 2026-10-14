import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/contexts/ToastContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ShoppingBag,
  Star,
  TrendingUp,
  Package,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  Users,
  Eye,
  MousePointerClick,
  Share2,
  MessageCircle,
  Calendar,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  ArrowLeft,
  ExternalLink,
  Plus,
  Upload,
  X,
  FileImage,
  Grid3X3,
  List,
} from "lucide-react";
import { Lightbox } from "@/components/ui/lightbox";
import { toast } from "sonner";
import { loadBusinessCards, loadDBBusinessCards } from "@/utils/cardStorage";
import { BusinessCard } from "@/types/businessCard";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";

import { db } from "@/services/firebase";
import { YourAllParent } from "@/components/dashboard/systems/YourAllParent";
import { doc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useParams, useNavigate } from "@/lib/navigation";
type Props = {
  params: Promise<{ cardUrlName: string }>;
};

const MarketplaceDetails = () => {
  const pathname = usePathname();
  const navigate = useNavigate();
  const params = useParams();
  const router = useRouter();
  const adId = params.id as string;
  const { showToast } = useToast();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedProduct, setSelectedProduct] = useState<
    (typeof featuredProducts)[0] | null
  >(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [viewAdImage, setViewAdImage] = useState<string | null>(null);
  const [showPostAdDialog, setShowPostAdDialog] = useState(false);
  const [existingDirectAds, setExistingDirectAds] = useState<
    Array<{
      cardId: string;
      cardName: string;
      directAds: NonNullable<BusinessCard["appointments"]["directAds"]>;
      sellerName: string;
      sellerPhoto: string;
      sellerCompany: string;
      cardUrlName: string;
    }>
  >([]);
  const [selectedExistingAd, setSelectedExistingAd] = useState("");
  const [adFormData, setAdFormData] = useState({
    title: "",
    description: "",
    fullDescription: "",
    category: "",
    price: "",
    sellerName: "",
    cardUrlName: "",
    shopNowLink: "",
    badge: "featured",
    location: "",
    availableDate: "",
    endDate: "",
    image: null as File | null,
    imagePreview: "",
    directAdType: "" as "" | "Product" | "Event" | "Service" | "none",
    sellerPhoto: "",
    sellerCompany: "",

    // NEW
    sourceCardId: "",
    importedFromDirectAd: false,
  });

  const [products, setProducts] = useState<any[]>([]);

  // Load existing direct ads from business cards
  useEffect(() => {
    const loadAdsFromCards = async () => {
      if (!user?.uid) return; // 👈 prevent undefined query
      if (user?.role === "admin") {
        const cards: BusinessCard[] = await loadDBBusinessCards();

        const adsFromCards = cards
          .filter(
            (card) =>
              card?.appointments?.appointmentType === "direct-ads" &&
              !!card?.appointments?.directAds,
          )
          .map((card) => {
            const firstName = card?.profile?.firstName ?? "";
            const lastName = card?.profile?.lastName ?? "";

            return {
              cardId: card?.metadata?.id ?? "",
              cardName: `${firstName} ${lastName}`.trim() || "Unnamed Card",
              directAds: card.appointments!.directAds!, // safe after filter
              sellerName: `${firstName} ${lastName}`.trim() || "Unknown",
              cardUrlName: card.urlName,
              sellerPhoto: card?.profilePhoto ?? "",
              sellerCompany: card?.profile?.company ?? "",
              sellerCardView: card?.cardView ?? "",
            };
          });

        setExistingDirectAds(adsFromCards);
      } else {
        const cardsRef = collection(db, "cards");
        const q = query(
          cardsRef,
          where("uid", "==", user?.uid),
          // where("isActive", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const userCards: BusinessCard[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<BusinessCard, "id">),
        }));
        const adsFromCards = userCards
          .filter(
            (card) =>
              card?.appointments?.appointmentType === "direct-ads" &&
              !!card?.appointments?.directAds,
          )
          .map((card) => {
            const firstName = card?.profile?.firstName ?? "";
            const lastName = card?.profile?.lastName ?? "";

            return {
              cardId: card?.metadata?.id ?? "",
              cardName: `${firstName} ${lastName}`.trim() || "Unnamed Card",
              directAds: card.appointments!.directAds!, // safe after filter
              sellerName: `${firstName} ${lastName}`.trim() || "Unknown",
              cardUrlName: card.urlName,
              sellerPhoto: card?.profilePhoto ?? "",
              sellerCompany: card?.profile?.company ?? "",
              sellerCardView: card?.cardView ?? "",
            };
          });
        setExistingDirectAds(adsFromCards);
      }
    };

    loadAdsFromCards();
  }, [showPostAdDialog]);

  // Map direct ad type to marketplace category
  const mapDirectAdTypeToCategory = (type: string): string => {
    switch (type) {
      case "Product":
        return "digital";
      case "Service":
        return "services";
      case "Event":
        return "services";
      default:
        return "";
    }
  };

  function getDaySuffix(day) {
    if (day >= 11 && day <= 13) return `${day}th`;
    switch (day % 10) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  }

  const now = new Date();
  const year = now.getFullYear(); // 2025
  const month = now.toLocaleString("en-US", { month: "long" }); // Nov
  const day = getDaySuffix(now.getDate());
  const storage = getStorage();

  /**
   * ✅ Upload Direct Ads image to Firebase Storage
   */
  const uploadDirectAdsImage = async (
    file: File,
    oldUrl?: string | null,
  ): Promise<string> => {
    const filePath = `/cards/${year}/${month}/${day}/${user?.uid}/${adFormData.cardUrlName}/${"directAds"}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    console.log("oldurl", oldUrl);
    console.log("filePath", filePath);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    if (oldUrl) {
      try {
        const oldRef = ref(storage, oldUrl);
        await deleteObject(oldRef);
      } catch (err) {
        console.warn("Old Direct Ads image could not be deleted:", err);
      }
    }

    return downloadURL;
  };
  const handleMarketplaceImageUpload = async (file: File) => {
    setIsUploading(true);
    if (!adFormData.sourceCardId || !user?.uid) {
      showToast("Select a Direct Ad first", "error");
      return;
    }

    const oldUrl = adFormData.imagePreview || null;
    console.log("oldUrl", adFormData);

    try {
      //@ts-ignore
      const imageUrl = await uploadDirectAdsImage(file, oldUrl);

      // Update CARD (source of truth)
      await updateDoc(doc(db, "cards", adFormData.cardUrlName), {
        "appointments.directAds.image": imageUrl,
      });

      // Update Marketplace UI
      setAdFormData((prev) => ({
        ...prev,
        imagePreview: imageUrl,
      }));

      showToast("Image updated successfully", "success");
      setIsUploading(false);
    } catch (error) {
      console.error(error);
      showToast("Failed to upload image", "error");
    }
  };

  const handleSelectExistingAd = (cardId: string) => {
    setSelectedExistingAd(cardId);

    if (cardId && cardId !== "none") {
      const selectedAd = existingDirectAds.find((ad) => ad.cardId === cardId);

      if (selectedAd) {
        const mappedCategory = mapDirectAdTypeToCategory(
          selectedAd.directAds.type,
        );

        setAdFormData((prev) => ({
          ...prev,
          directAdType: selectedAd.directAds.type,
          category: mappedCategory || prev.category,
          imagePreview: selectedAd.directAds.image || "",
          title: selectedAd.directAds.title || prev.title,
          description: selectedAd.directAds.description || prev.description,
          price: selectedAd.directAds.price || prev.price,
          shopNowLink: selectedAd.directAds.url || prev.shopNowLink,
          sellerName: selectedAd.sellerName || prev.sellerName,
          sellerPhoto: selectedAd.sellerPhoto || "",
          sellerCompany: selectedAd.sellerCompany || "",
          cardUrlName: selectedAd.cardUrlName || "",
          // APPENDED DATA
          sourceCardId: selectedAd.cardId,
          importedFromDirectAd: true,
        }));
        showToast("Direct Ad imported successfully!", "success");
      }
    } else {
      setAdFormData((prev) => ({
        ...prev,
        directAdType: "",
        category: "",
        imagePreview: "",
        sellerPhoto: "",
        sellerCompany: "",
        sourceCardId: "",
        importedFromDirectAd: false,
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleMarketplaceImageUpload(file);
  };

  const handlePostAd = async () => {
    if (
      !adFormData.importedFromDirectAd ||
      !adFormData.title ||
      !adFormData.description ||
      !adFormData.category ||
      !adFormData.price ||
      !adFormData.sellerName ||
      !adFormData.shopNowLink
    ) {
      showToast("Please fill in all required fields", "error");
      //toast.error("Please fill in all required fields");
      return;
    }

    try {
      await addDoc(collection(db, "marketplace_ads"), {
        title: adFormData.title,
        description: adFormData.description,
        category: adFormData.category,
        price: Number(adFormData.price),
        sellerName: adFormData.sellerName,
        sellerCompany: adFormData.sellerCompany,
        sellerPhoto: adFormData.sellerPhoto,
        badge: adFormData.badge || null,
        featured: "featured",
        image: adFormData.imagePreview || "",
        shopNowLink: adFormData.shopNowLink,
        location: adFormData.location,
        availableDate: adFormData.availableDate,
        endDate: adFormData.endDate,

        views: 0,
        shares: {
          facebook: 0,
          twitter: 0,
          linkedin: 0,
          sms: 0,
          email: 0,
        },
        totalShares: 0,
        shopClicks: 0,
        directAdType: adFormData.directAdType,
        sourceCardId: adFormData.sourceCardId,
        cardUrlName: adFormData.cardUrlName,
        importedFromDirectAd: adFormData.importedFromDirectAd,

        createdAt: serverTimestamp(),
      });

      //toast.success("Your ad has been posted successfully!");
      showToast("Your ad has been posted successfully!", "success");
      setShowPostAdDialog(false);
    } catch (error) {
      showToast("Failed to post ad", "error");
      //toast.error("Failed to post ad");
      console.error(error);
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let results = [...products];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sellerName?.toLowerCase().includes(q),
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      results = results.filter((p) => p.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        results.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return results;
  }, [products, searchQuery, categoryFilter, sortBy]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, sortBy]);

  const featuredProducts = filteredProducts.filter((p) => p.featured);
  const featuredFilteredProducts = featuredProducts;

  // const normalProducts = filteredProducts.filter((p) => !p.featured);

  useEffect(() => {
    const fetchAds = async () => {
      const q = query(
        collection(db, "marketplace_ads"),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      const ads = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProducts(ads);
    };

    fetchAds();
  }, []);

  const incrementViews = async (productId: string) => {
    try {
      const ref = doc(db, "marketplace_ads", productId);
      await updateDoc(ref, {
        views: increment(1),
      });
    } catch (err) {
      console.error("Failed to increment views", err);
    }
  };

  const getShareUrl = (productId: string) => {
    return `${window.location.origin}/marketplace/${productId}`;
  };

  useEffect(() => {
    if (!products.length) return;

    // const params = new URLSearchParams(window.location.search);
    // const adId = params.get("ad");

    // if (!adId) return;

    const product = products.find((p) => p.id === adId);
    if (!product) return;

    setSelectedProduct(product);

    // window.history.replaceState({}, "", "/marketplace");
  }, [products, adId]);

  const getFacebookShare = (url: string) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const getTwitterShare = (url: string, title: string) =>
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  const getLinkedInShare = (url: string) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const getSMSShare = (url: string) => `sms:?body=${encodeURIComponent(url)}`;

  const getEmailShare = (url: string, title: string) =>
    `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;

  const incrementShare = async (id: string, platform: string) => {
    await updateDoc(doc(db, "marketplace_ads", id), {
      [`shares.${platform}`]: increment(1),
      totalShares: increment(1),
    });
  };

  const incrementShopClick = async (id: string) => {
    await updateDoc(doc(db, "marketplace_ads", id), {
      shopClicks: increment(1),
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleClick = () => {
    localStorage.setItem("currentPath", pathname);
    navigate(`/${selectedProduct?.cardUrlName}`);
  };

  return (
    <>
      <div className="max-w-5xl mx-auto min-h-screen w-auto">
        <div className="grid md:grid-cols-3 gap-0">
          {/* Left Column - Main Content */}
          <div className="md:col-span-2 p-6 border-r">
            {/* Seller Header */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                {selectedProduct?.sellerPhoto ? (
                  <div className="cursor-pointer" onClick={handleClick}>
                    <AvatarImage
                      style={{ backgroundColor: "#8080805e" }}
                      src={selectedProduct?.sellerPhoto}
                      alt={selectedProduct?.sellerName}
                    />
                  </div>
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedProduct?.sellerName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p
                  className="font-semibold text-foreground cursor-pointer"
                  onClick={handleClick}
                >
                  {selectedProduct?.sellerName}
                </p>
                <p className="text-sm text-muted-foreground font-semibold">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  | {selectedProduct?.category} |{" "}
                  <span>{selectedProduct?.sellerCompany}</span>
                </p>
              </div>
            </div>

            {/* Title with Shop Now */}
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-xl font-bold text-foreground">
                {selectedProduct?.title}
              </h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto no-underline hover:no-underline"
                onClick={async () => {
                  await incrementShopClick(selectedProduct?.id);

                  // Optional: optimistic UI update
                  setSelectedProduct((prev) =>
                    prev
                      ? {
                          ...prev,
                          shopClicks: (prev.shopClicks || 0) + 1,
                        }
                      : prev,
                  );

                  window.open(selectedProduct.shopNowLink, "_blank");
                }}
              >
                Shop Now &gt;&gt;
              </Button>
            </div>

            {/* Product Image */}
            <div className="relative rounded-lg overflow-hidden mb-4">
              <img
                onClick={async () => {
                  await incrementShopClick(selectedProduct?.id);

                  // Optional: optimistic UI update
                  setSelectedProduct((prev) =>
                    prev
                      ? {
                          ...prev,
                          shopClicks: (prev.shopClicks || 0) + 1,
                        }
                      : prev,
                  );

                  window.open(selectedProduct.shopNowLink, "_blank");
                }}
                src={selectedProduct?.image}
                alt={selectedProduct?.title}
                className="w-full h-auto object-contain cursor-pointer"
              />
              {/* {selectedProduct.badge && (
                        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                          {selectedProduct.badge}
                        </Badge>
                      )} */}
            </div>

            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                {selectedProduct?.title}
              </h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto no-underline hover:no-underline"
                onClick={async () => {
                  await incrementShopClick(selectedProduct.id);

                  // Optional: optimistic UI update
                  setSelectedProduct((prev) =>
                    prev
                      ? {
                          ...prev,
                          shopClicks: (prev.shopClicks || 0) + 1,
                        }
                      : prev,
                  );

                  window.open(selectedProduct.shopNowLink, "_blank");
                }}
              >
                Learn More &gt;&gt;
              </Button>
            </div>

            {/* Summary Section */}
            <div className="mb-4">
              <p
                className={`text-foreground transition-all duration-300 ${
                  showFullDescription ? "" : "line-clamp-1"
                }`}
              >
                {selectedProduct?.description}
              </p>

              {/* Toggle Button */}
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-primary mt-1 hover:underline text-sm font-medium"
              >
                {showFullDescription ? "<< less" : "more >>"}
              </button>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-6 py-4 border-t border-b mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-sm">
                  {selectedProduct?.views || 0} views
                </span>
              </div>
              {/* <div className="flex items-center gap-2 text-muted-foreground">
                        <MousePointerClick className="h-4 w-4" />
                        <span className="text-sm"># of clicks</span>
                      </div> */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Share2 className="h-4 w-4" />
                <span className="text-sm">
                  {selectedProduct?.totalShares || 0} Shares
                </span>
              </div>
              {/* <div className="flex items-center gap-2 text-muted-foreground ml-auto">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">2 Comments</span>
                      </div> */}
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-end gap-4">
              <div className="flex items-center gap-4">
                {/* <Button variant="ghost" size="sm" className="gap-2">
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Comment
                        </Button> */}
              </div>
              <div
                onClick={() => {
                  navigate("/marketplace");
                }}
                className="flex items-center gap-2 cursor-pointer text-xs font-medium hover:opacity-80 text-primary"
              >
                <span> &lt;&lt; Back</span>
              </div>
              <span className="text-xs">Powered by :</span>

              <Link href="/" target="_blank" rel="noopener noreferrer">
                <img
                  src="/lovable-uploads/logo_color_correct.png"
                  alt="Logo"
                  className="h-6 w-auto cursor-pointer rounded-md"
                />
              </Link>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="p-6 bg-muted/30">
            {/* Date & Time */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 border-b border-gray-200">
                {/* <Calendar className="h-4 w-4" /> */}
                Date & Time
              </h3>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(selectedProduct?.availableDate)}{" "}
                <span className="font-medium">to</span>{" "}
                {formatDateTime(selectedProduct?.endDate)}
              </p>
            </div>

            {/* Map Location */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 border-b border-gray-200">
                {/* <MapPin className="h-4 w-4" /> */}
                Map Location
              </h3>

              <div className="rounded-lg overflow-hidden border bg-muted h-40">
                <iframe
                  title="map"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    selectedProduct?.location,
                  )}&output=embed`}
                />
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selectedProduct?.location,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-1 block"
              >
                View larger map
              </a>
            </div>

            {/* Presented By */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-2 border-b border-gray-200">
                Presented By
              </h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {selectedProduct?.sellerPhoto ? (
                    <div className="cursor-pointer" onClick={handleClick}>
                      <AvatarImage
                        style={{ backgroundColor: "#8080805e" }}
                        src={selectedProduct?.sellerPhoto}
                        alt={selectedProduct?.sellerName}
                      />
                    </div>
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedProduct?.sellerName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div>
                  <p
                    className="font-medium text-foreground text-sm cursor-pointer"
                    onClick={handleClick}
                  >
                    {selectedProduct?.sellerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProduct?.sellerCompany}
                  </p>
                </div>
              </div>
            </div>

            {/* Spread The Word */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3 border-b border-gray-200">
                Spread The Word
              </h3>
              {selectedProduct && (
                <>
                  {(() => {
                    const shareUrl = getShareUrl(selectedProduct.id);

                    return (
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          className="rounded-full bg-[#1877F2]"
                          onClick={async () => {
                            await incrementShare(
                              selectedProduct.id,
                              "facebook",
                            );
                            window.open(getFacebookShare(shareUrl), "_blank");
                          }}
                        >
                          <Facebook className="h-4 w-4 text-white" />
                        </Button>

                        <Button
                          size="icon"
                          className="rounded-full bg-[#1DA1F2]"
                          onClick={async () => {
                            await incrementShare(selectedProduct.id, "twitter");
                            window.open(
                              getTwitterShare(shareUrl, selectedProduct.title),
                              "_blank",
                            );
                          }}
                        >
                          <Twitter className="h-4 w-4 text-white" />
                        </Button>

                        <Button
                          size="icon"
                          className="rounded-full bg-[#0A66C2]"
                          onClick={async () => {
                            await incrementShare(
                              selectedProduct.id,
                              "linkedin",
                            );
                            window.open(getLinkedInShare(shareUrl), "_blank");
                          }}
                        >
                          <Linkedin className="h-4 w-4 text-white" />
                        </Button>

                        <Button
                          size="icon"
                          className="rounded-full bg-[#25D366]"
                          onClick={async () => {
                            await incrementShare(selectedProduct.id, "sms");
                            window.location.href = getSMSShare(shareUrl);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 text-white" />
                        </Button>

                        <Button
                          size="icon"
                          className="rounded-full bg-[#EA4335]"
                          onClick={async () => {
                            await incrementShare(selectedProduct.id, "email");
                            window.location.href = getEmailShare(
                              shareUrl,
                              selectedProduct.title,
                            );
                          }}
                        >
                          <Mail className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Link Count */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-2 border-b border-gray-200">
                LINK COUNT
              </h3>
              <div className="p-3 rounded-lg bg-background">
                <p className="text-sm font-medium">Shop Now 22</p>
                <p className="text-xs text-muted-foreground">
                  {selectedProduct?.shopClicks || 0} Shop Now Clicks
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Price</p>
              <p className="text-3xl font-bold text-primary">
                ${selectedProduct?.price}
              </p>
              {/* <div className="flex items-center gap-1 mt-2 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">
                          {selectedProduct.rating} Rating
                        </span>
                      </div> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarketplaceDetails;
