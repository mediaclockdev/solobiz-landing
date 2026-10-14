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
import { cn } from "@/lib/utils";
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
import { useSearchParams, useRouter } from "next/navigation";
import { useNavigate } from "@/lib/navigation";

interface Props {
  id: string;
}

const Marketplace = () => {
  const router = useRouter();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const navigate = useNavigate();
  const searchParams = useSearchParams();
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
  const featuredFilteredProducts = filteredProducts.filter(
  (product) =>
    product.featured &&
    (!product.endDate || new Date(product.endDate) >= new Date())
);

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
    return `${window.location.origin}/marketplace?ad=${productId}`;
  };

  useEffect(() => {
    if (!products.length) return;

    const params = new URLSearchParams(window.location.search);
    const adId = params.get("ad");

    if (!adId) return;

    const product = products.find((p) => p.id === adId);
    if (!product) return;

    setSelectedProduct(product);

    // window.history.replaceState({}, "", "/marketplace");
  }, [products]);

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

  return (
    <Layout>
      {loading && (
        <div className="flex justify-center items-center py-6">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-4xl font-bold mb-3 text-solo-blue">
                Marketplace
              </h1>
              <p className="text-xl text-solo-gray-dark max-w-3xl">
                Discover exclusive products and services from our community
                members
              </p>
            </div>
            {/* {user?.role == "admin" && ( */}
            <Button
              className="flex items-center gap-2"
              onClick={() => {
                if (user?.planType === "paid") {
                  setShowPostAdDialog(true);
                } else {
                  setShowPermissionModal(true);
                }
              }}
            >
              <Plus className="h-4 w-4" />
              Post Your Ad
            </Button>
            {/* )} */}
          </div>

          {/* Post Your Ad Dialog */}
          <Dialog open={showPostAdDialog} onOpenChange={setShowPostAdDialog}>
            <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl w-[calc(100%-2rem)] sm:w-full h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Post Your Ad
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Seller Profile Header - shown when imported */}
                {adFormData.sellerPhoto && adFormData.sellerName && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                    <Avatar className="h-12 w-12">
                      <img
                        src={adFormData.sellerPhoto}
                        alt={adFormData.sellerName}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {adFormData.sellerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        {adFormData.sellerName}
                      </p>
                      {adFormData.sellerCompany && (
                        <p className="text-sm text-muted-foreground">
                          {adFormData.sellerCompany}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Import from Existing Direct Ads */}
                {existingDirectAds.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      Import from Existing Direct Ad
                    </h3>
                    <div>
                      <Label>
                        Select an existing Direct Ad from your cards *
                      </Label>
                      <Select
                        value={selectedExistingAd}
                        onValueChange={handleSelectExistingAd}
                      >
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue placeholder="Choose an existing Direct Ad (optional)" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="none">
                            -- Start Fresh --
                          </SelectItem>
                          {existingDirectAds.map((ad) => (
                            <SelectItem key={ad.cardId} value={ad.cardId}>
                              {ad.cardName} - {ad.directAds.type}{" "}
                              {ad.directAds.title
                                ? `(${ad.directAds.title})`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        This will import the Direct Ad type, image, and profile
                        info from your card
                      </p>
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b pb-2">
                    Basic Information
                  </h3>

                  {/* Direct Ad Type Badge - shown if imported */}
                  {adFormData.directAdType && (
                    <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                      <Badge variant="secondary">
                        {adFormData.directAdType}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Category auto-set to:{" "}
                        {adFormData.category === "digital"
                          ? "Digital Product"
                          : "Service"}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter your product/service title"
                        value={adFormData.title}
                        onChange={(e) =>
                          setAdFormData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="sellerName">Your Name *</Label>
                      <Input
                        id="sellerName"
                        placeholder="Enter your name"
                        value={adFormData.sellerName}
                        onChange={(e) =>
                          setAdFormData((prev) => ({
                            ...prev,
                            sellerName: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={adFormData.category}
                        onValueChange={(value) =>
                          setAdFormData((prev) => ({
                            ...prev,
                            category: value,
                          }))
                        }
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Event">Event</SelectItem>
                          <SelectItem value="CTA">CTA</SelectItem>
                          <SelectItem value="Booking">Booking</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b pb-2">
                    Description
                  </h3>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter your product/service description"
                      rows={4}
                      value={adFormData.description}
                      onChange={(e) =>
                        setAdFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Description Preview */}
                  {adFormData.description && (
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Preview
                      </Label>
                      <p className="text-sm text-foreground">
                        {adFormData.description.length > 100 ? (
                          <>
                            {adFormData.description.slice(0, 100)}...
                            <button
                              type="button"
                              className="text-primary font-medium ml-1 hover:underline"
                              onClick={() =>
                                toast.info(adFormData.description, {
                                  duration: 10000,
                                })
                              }
                            >
                              more &gt;&gt;
                            </button>
                          </>
                        ) : (
                          adFormData.description
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Product Image Upload */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b pb-2">
                    Product Image
                  </h3>

                  {adFormData.imagePreview ? (
                    <div className="space-y-3 text-center">
                      <img
                        src={adFormData.imagePreview}
                        alt="Uploaded"
                        className="w-full h-48 object-cover"
                      />

                      <label
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm cursor-pointer transition
                        ${
                          adFormData.sourceCardId
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }
                      `}
                      >
                        <Upload className="h-4 w-4" />
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={!adFormData.sourceCardId}
                        />
                      </label>
                      <p className="text-gray-600">
                        {isUploading
                          ? "Uploading..."
                          : "Click to upload or drag and drop"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-gray-600">No image uploaded</p>

                      <label
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm cursor-pointer transition
          ${
            adFormData.sourceCardId
              ? "border border-dashed border-gray-400 hover:border-blue-500 hover:text-blue-600"
              : "border border-dashed border-gray-300 text-gray-400 cursor-not-allowed"
          }
        `}
                      >
                        <Upload className="h-4 w-4" />
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={!adFormData.sourceCardId}
                        />
                      </label>

                      {!adFormData.sourceCardId && (
                        <p className="text-xs text-muted-foreground">
                          Select a Direct Ad first to upload an image
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Pricing & Badge */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        value={adFormData.price}
                        onChange={(e) =>
                          setAdFormData((prev) => ({
                            ...prev,
                            price: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* <div>
                      <Label htmlFor="badge">Badge</Label>
                      <Select
                        value={adFormData.badge}
                        onValueChange={(value) =>
                          setAdFormData((prev) => ({ ...prev, badge: value }))
                        }
                      >
                        <SelectTrigger id="badge">
                          <SelectValue placeholder="Select badge" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Featured">Featured</SelectItem>
                        </SelectContent>
                      </Select>
                    </div> */}
                  </div>
                </div>

                {/* <div>
                  <Label htmlFor="rating">Rating (Max 5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min={0}
                    max={5}
                    step={0.5}
                    value={adFormData.rating}
                    onChange={(e) => {
                      const value = Number(e.target.value);

                      setAdFormData((prev) => ({
                        ...prev,
                        rating: Math.min(5, Math.max(0, value)),
                      }));
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Rating must be between 0 and 5
                  </p>
                </div> */}

                {/* Additional Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b pb-2">
                    Additional Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="availableDate">Start Date</Label>
                      <Input
                        id="availableDate"
                        type="datetime-local"
                        value={adFormData.availableDate}
                        onChange={(e) =>
                          setAdFormData((prev) => ({
                            ...prev,
                            availableDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={adFormData.endDate}
                        onChange={(e) =>
                          setAdFormData((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="shopNowLink">Shop Now Link</Label>
                      <Input
                        id="shopNowLink"
                        placeholder="https://your-shop-link.com"
                        value={adFormData.shopNowLink}
                        onChange={(e) =>
                          setAdFormData((prev) => ({
                            ...prev,
                            shopNowLink: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="Enter your location (city, country)"
                        value={adFormData.location}
                        onChange={(e) =>
                          setAdFormData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowPostAdDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handlePostAd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Post Ad
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <div className="mb-8 bg-card rounded-lg border p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products or services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="md:col-span-1">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Events">Event</SelectItem>
                    <SelectItem value="CTA">CTA</SelectItem>
                    <SelectItem value="Booking">Booking</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="md:col-span-1">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured First</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                    {/* <SelectItem value="rating">Highest Rated</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "result" : "results"}
              </span>
              {(searchQuery || categoryFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                  }}
                  className="h-7 text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Featured Listing */}
          {featuredFilteredProducts.length > 0 && (
            <div className="mb-10">
              <div className="flex justify-between gap-2 mt-4">
                <h2 className="text-xl font-semibold mb-4">Featured Listing</h2>
                <div className="flex">
                  <Button
                    size="sm"
                    variant={viewMode === "grid" ? "default" : "outline"}
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "list" ? "default" : "outline"}
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredFilteredProducts
                    .slice(
                      (currentPage - 1) * ITEMS_PER_PAGE,
                      currentPage * ITEMS_PER_PAGE,
                    )
                    .map((product) => {
                      return (
                        <Card
                          key={product.id}
                          className="overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
                        >
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                            {/* <div className="absolute top-2 left-2">
                              <Badge className="bg-primary text-primary-foreground">
                                {product.badge}
                              </Badge>
                            </div> */}
                            {/* <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 px-2 py-1 rounded text-yellow-500">
                              <Star className="h-3 w-3 fill-current" />
                              <span className="text-xs font-medium text-foreground">
                                {product.rating}
                              </span>
                            </div> */}
                          </div>
                          <CardHeader className="pb-3 pt-3">
                            <CardTitle className="text-lg line-clamp-2">
                              {product.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {product.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-3 flex-grow">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <Users className="h-4 w-4" />
                              <span>
                                {product.sellerName} | {product.sellerCompany}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {product.category}
                            </Badge>
                          </CardContent>
                          <CardFooter className="pt-3 border-t flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-5 w-5 text-primary" />
                              <span className="text-2xl font-bold text-primary">
                                {product.price}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={async () => {
                                await incrementViews(product.id);

                                // Optimistic UI update
                                setSelectedProduct({
                                  ...product,
                                  views: (product.views || 0) + 1,
                                });

                                setProducts((prev) =>
                                  prev.map((p) =>
                                    p.id === product.id
                                      ? { ...p, views: (p.views || 0) + 1 }
                                      : p,
                                  ),
                                );
                                const url = new URL(window.location.href);
                                url.searchParams.set("ad", product.id);
                                navigate(`/marketplace/${product.id}`);
                                // window.history.replaceState(
                                //   {},
                                //   "",
                                //   url.toString(),
                                // );
                              }}
                            >
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                </div>
              )}

              {viewMode === "list" && (
                <div className="space-y-4">
                  {featuredFilteredProducts
                    .slice(
                      (currentPage - 1) * ITEMS_PER_PAGE,
                      currentPage * ITEMS_PER_PAGE,
                    )
                    .map((product) => (
                      <Card
                        key={product.id}
                        className="flex flex-col md:flex-row gap-4 p-4 hover:shadow-md transition"
                      >
                        {/* Image */}
                        <div className="w-full md:w-40 h-40 flex-shrink-0 rounded-lg overflow-hidden border">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            {/* Title + Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-lg font-semibold text-foreground">
                                {product.title}
                              </h3>

                              {/* {product.badge && (
                                <Badge className="bg-primary text-primary-foreground">
                                  {product.badge}
                                </Badge>
                              )} */}
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {product.description}
                            </p>

                            {/* Meta */}
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{product.sellerName}</span>
                              </div>

                              {/* <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="text-foreground font-medium">
                                  {product.rating}
                                </span>
                              </div> */}

                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {product.category}
                              </Badge>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-5 w-5 text-primary" />
                              <span className="text-xl font-bold text-primary">
                                {product.price}
                              </span>
                            </div>

                            <Button
                              size="sm"
                              onClick={async () => {
                                await incrementViews(product.id);

                                setSelectedProduct({
                                  ...product,
                                  views: (product.views || 0) + 1,
                                });

                                setProducts((prev) =>
                                  prev.map((p) =>
                                    p.id === product.id
                                      ? { ...p, views: (p.views || 0) + 1 }
                                      : p,
                                  ),
                                );
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of{" "}
                  {Math.ceil(
                    filteredProducts.filter((p) => p.featured).length /
                      ITEMS_PER_PAGE,
                  )}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    currentPage >=
                    Math.ceil(
                      filteredProducts.filter((p) => p.featured).length /
                        ITEMS_PER_PAGE,
                    )
                  }
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Ad Listing */}
          {/* {filteredProducts.filter((p) => !p.featured).length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Ads Listing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts
                  .filter((p) => !p.featured)
                  .map((product) => (
                    <Card
                      key={product.id}
                      className="overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          {product.badge && (
                            <Badge className="bg-primary text-primary-foreground">
                              {product.badge}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-yellow-500 ml-auto">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm font-medium text-foreground">
                              {product.rating}
                            </span>
                          </div>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">
                          {product.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {product.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3 flex-grow">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Users className="h-4 w-4" />
                          <span>{product.seller}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {product.category === "services"
                            ? "Service"
                            : "Digital Product"}
                        </Badge>
                      </CardContent>
                      <CardFooter className="pt-3 border-t">
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => setViewAdImage(product.image)}
                        >
                          View Ad
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </div>
          )} */}

          {/* Product Detail Dialog */}
          <Dialog
            open={false}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedProduct(null);
                window.history.replaceState({}, "", "/marketplace");
              }
            }}
          >
            <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-5xl h-[90vh] overflow-y-auto">
              {selectedProduct && (
                <div className="grid md:grid-cols-3 gap-0">
                  {/* Left Column - Main Content */}
                  <div className="md:col-span-2 p-6 border-r">
                    {/* Seller Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-10 w-10">
                        {selectedProduct?.sellerPhoto ? (
                          <AvatarImage
                            style={{ backgroundColor: "#8080805e" }}
                            src={selectedProduct.sellerPhoto}
                            alt={selectedProduct.sellerName}
                          />
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
                        <p className="font-semibold text-foreground">
                          {selectedProduct.sellerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date().toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          · {selectedProduct.category}
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
                        Shop Now &gt;&gt;
                      </Button>
                    </div>

                    {/* Product Image */}
                    <div className="relative rounded-lg overflow-hidden mb-4">
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.title}
                        className="w-full sm:h-[400px] h-auto object-contain"
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
                        {selectedProduct.description}
                      </p>

                      {/* Toggle Button */}
                      <button
                        onClick={() =>
                          setShowFullDescription(!showFullDescription)
                        }
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
                          {selectedProduct.views || 0} views
                        </span>
                      </div>
                      {/* <div className="flex items-center gap-2 text-muted-foreground">
                        <MousePointerClick className="h-4 w-4" />
                        <span className="text-sm"># of clicks</span>
                      </div> */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm">
                          {selectedProduct.totalShares || 0} Shares
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
                        onClick={() => setSelectedProduct(null)}
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
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        {/* <Calendar className="h-4 w-4" /> */}
                        Date & Time
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(selectedProduct.availableDate)}{" "}
                        <span className="font-medium">to</span>{" "}
                        {formatDateTime(selectedProduct.endDate)}
                      </p>
                    </div>

                    {/* Map Location */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
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
                            selectedProduct.location,
                          )}&output=embed`}
                        />
                      </div>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          selectedProduct.location,
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
                      <h3 className="font-semibold text-foreground mb-2">
                        Presented By
                      </h3>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {selectedProduct?.sellerPhoto ? (
                            <AvatarImage
                              style={{ backgroundColor: "#8080805e" }}
                              src={selectedProduct.sellerPhoto}
                              alt={selectedProduct.sellerName}
                            />
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
                          <p className="font-medium text-foreground text-sm">
                            {selectedProduct.sellerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedProduct.sellerCompany}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Spread The Word */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-foreground mb-3">
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
                                    window.open(
                                      getFacebookShare(shareUrl),
                                      "_blank",
                                    );
                                  }}
                                >
                                  <Facebook className="h-4 w-4 text-white" />
                                </Button>

                                <Button
                                  size="icon"
                                  className="rounded-full bg-[#1DA1F2]"
                                  onClick={async () => {
                                    await incrementShare(
                                      selectedProduct.id,
                                      "twitter",
                                    );
                                    window.open(
                                      getTwitterShare(
                                        shareUrl,
                                        selectedProduct.title,
                                      ),
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
                                    window.open(
                                      getLinkedInShare(shareUrl),
                                      "_blank",
                                    );
                                  }}
                                >
                                  <Linkedin className="h-4 w-4 text-white" />
                                </Button>

                                <Button
                                  size="icon"
                                  className="rounded-full bg-[#25D366]"
                                  onClick={async () => {
                                    await incrementShare(
                                      selectedProduct.id,
                                      "sms",
                                    );
                                    window.location.href =
                                      getSMSShare(shareUrl);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 text-white" />
                                </Button>

                                <Button
                                  size="icon"
                                  className="rounded-full bg-[#EA4335]"
                                  onClick={async () => {
                                    await incrementShare(
                                      selectedProduct.id,
                                      "email",
                                    );
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
                      <h3 className="font-semibold text-foreground mb-2">
                        LINK COUNT
                      </h3>
                      <div className="p-3 border rounded-lg bg-background">
                        <p className="text-sm font-medium">Shop Now</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedProduct.shopClicks || 0} Shop Now Clicks
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">
                        Price
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        ${selectedProduct.price}
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
              )}
            </DialogContent>
          </Dialog>

          {/* Empty State */}
          {products.length > 0 && featuredFilteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No Featured Listing found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters to find what you're looking
                for
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setSortBy("featured");
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}

          {/* Ad Listing */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Ads Listing</h2>
            <YourAllParent />
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-r from-solo-blue/10 to-solo-blue-light/10 rounded-lg p-8 border border-solo-blue/20">
            <div className="flex items-start gap-4">
              <ShoppingBag className="h-12 w-12 text-solo-blue flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-bold text-solo-blue-dark mb-2">
                  List Your Products & Services
                </h3>
                <p className="text-gray-700 mb-4">
                  Pro members get free marketplace listings! Share your
                  offerings with our growing community and expand your business
                  reach. From digital products to professional services, connect
                  with potential customers who are already in your network.
                </p>
                <Button
                  variant="outline"
                  className="border-solo-blue text-solo-blue hover:bg-solo-blue hover:text-white"
                >
                  Start Selling
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Ad Image Lightbox */}
        <Lightbox
          isOpen={!!viewAdImage}
          onClose={() => setViewAdImage(null)}
          imageSrc={viewAdImage || ""}
        />

        {showPermissionModal && (
          <div
            style={{ margin: 0 }}
            className={cn(
              "fixed inset-0 z-50 flex items-center justify-center",
            )}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Modal Box */}
            <div className="relative z-50 w-full max-w-sm mx-4 rounded-lg bg-white p-6 text-center shadow-xl">
              <h1 className="mb-4 text-xl font-bold">Pro Feature</h1>

              <p className="mb-6 text-gray-600">
                This feature is available only for{" "}
                <span className="font-semibold text-primary">Pro users</span>.
                Please purchase a Pro plan to continue.
              </p>

              <div className="flex justify-center gap-3 text-sm text-muted-foreground">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermissionModal(false)}
                >
                  Cancel
                </Button>

                <Button
                  onClick={() => {
                    setShowPermissionModal(false);
                    setTimeout(() => router.replace("/pricing"), 100);
                  }}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Marketplace;
