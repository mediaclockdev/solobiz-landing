"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import {
  Grid3X3,
  List,
  User,
  Briefcase,
  ShoppingBag,
  Plus,
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
  Upload,
  X,
  FileImage,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BusinessCard } from "@/types/businessCard";
import { CardGrid } from "@/components/dashboard/CardGrid";
import { CardList } from "@/components/dashboard/card-list";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Label } from "@/components/ui/label";
import {
  loadDBBusinessCards,
  loadBusinessCards,
  deleteBusinessCard,
  toggleCardFavorite,
  deleteDatabaseBusinessCard,
  checkLocalCardExist,
  saveBusinessCard,
} from "@/utils/cardStorage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filterFavorites,
  filterPublicCards,
  memberDirectoryPublicCards,
} from "@/utils/cardFilters";
import { hasUserAccount, loadUserData } from "@/utils/userStorage";
import { CreateCardPromptModal } from "@/components/dashboard/CreateCardPromptModal";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useToast } from "@/contexts/ToastContext";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Margin } from "@mui/icons-material";
import { generateQRCodeWithLogo } from "@/utils/qrCodeGenerator";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Cards() {
  const [hasSyncedQrCodes, setHasSyncedQrCodes] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [myCards, setMyCards] = useState<BusinessCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<BusinessCard[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState(user ? "favorites" : "local");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<BusinessCard | null>(null);
  const { showToast } = useToast();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showPostAdDialog, setShowPostAdDialog] = useState(false);
  const [memberDirectoryCount, setMemberDirectoryCount] = useState(0);

  const [showAddonsPermissionModal, setShowAddonsPermissionModal] =
    useState(false);

  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeFirstName, setWelcomeFirstName] = useState("");
  const [isAccessControlChecked, setIsAccessControlChecked] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [totalMyCardCounts, setTotalMyCardCounts] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get("selectedTab") ?? activeTab;

  const getDataBaseCards = async () => {
    const directoryCount = await memberDirectoryPublicCards();
    setMemberDirectoryCount(directoryCount.length ?? 0);
    if (!user?.uid) return;
    // setMyCards([]);
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
    setMyCards(userCards);
  };

  const myCardCounts = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user?.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const planType = userData.planType || "free"; // default to free
        const createdAt = parseCreatedAt(user?.createdAt);
        const trialEnd = new Date(
          createdAt.getTime() + (user?.freeTrialPeriod || 0) * 24 * 60 * 60 * 1000
        );
        const isTrialActive = new Date() <= trialEnd;

        if (planType === "paid" || (planType === "free" && isTrialActive)) {
          const addOnPlans = userData.addons || [];
          let extraCards = 0;
          addOnPlans.forEach((addon: any) => {
            if (
              addon.name === "Add 1 Pro Card" ||
              addon.name?.includes("1 Pro")
            ) {
              extraCards += 1;
            } else if (
              addon.name === "Add 5 Pro Cards" ||
              addon.name?.includes("5 Pro")
            ) {
              extraCards += 5;
            }
          });
          setTotalMyCardCounts(2 + extraCards);
        } else {
          setTotalMyCardCounts(2);
        }
      } catch (error) {
        console.error("Error fetch card count:", error);
      }
      return;
    }
  };
  // Load cards on component mount
  useEffect(() => {
    if (user) {
      setIsLoading(false);
      getDataBaseCards();
    }
    getDataBaseCards();

    setIsLoading(false);
    const loadedCards = loadBusinessCards();
    setCards(loadedCards);
  }, [authLoading, activeTab]);
  useEffect(() => {
    if (user && totalMyCardCounts == 0) {
      myCardCounts();
    }
  }, [user, totalMyCardCounts]);

  // Access control logic
  useEffect(() => {
    const checkAccess = () => {
      const loadedCards = loadBusinessCards();
      const userHasAccount = hasUserAccount();

      // Scenario A: No business cards + No user data
      if (loadedCards.length === 0 && !userHasAccount) {
        setShowCreateCardModal(false);
        //setIsAccessControlChecked(false);
        return;
      }

      // Scenario B: Business cards exist + No user data
      if (loadedCards.length > 0 && !userHasAccount) {
        // Get the first name from the first card for the welcome modal
        const firstName = loadedCards[0]?.profile?.firstName || "User";
        setWelcomeFirstName(firstName);
        //setShowWelcomeModal(true);
        //   setIsAccessControlChecked(true);
        return;
      }

      // Scenario C: Both exist - allow normal access
      // setIsAccessControlChecked(true);
    };

    checkAccess();
    if (user) {
      setActiveTab(selectedTab ?? "favorites");
    } else {
      setActiveTab(selectedTab ?? "local");
    }
  }, []);

  // Filter cards when dependencies change
  useEffect(() => {
    setIsLoading(false);
    let filtered = cards;

    // Apply tab filter
    if (activeTab === "favorites") {
      filtered = myCards;
    }

    setFilteredCards(filtered);
  }, [cards, myCards, activeTab]);

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

  const generatePreviewQRCode = useCallback(async (card, action) => {
    try {
      if (typeof window !== "undefined") {
        const cardUrl = `${window.location.origin}/${card.urlName}`;
        const logoPreviewUrl =
          "/lovable-uploads/6e79eba6-9505-44d3-9af1-e8b13b7c46d0.png";
        const response = await fetch(
          "/lovable-uploads/6e79eba6-9505-44d3-9af1-e8b13b7c46d0.png",
        );
        const blob = await response.blob();
        const defaultLogo = new File([blob], "logo.png", { type: blob.type });

        const qrDataUrl = await generateQRCodeWithLogo(cardUrl, defaultLogo, {
          width: 200,
          margin: 2,
          color: { dark: card.brandColor, light: "#FFFFFF" },
        });

        const res = await fetch(qrDataUrl);
        const qrBlob = await res.blob();

        if (activeTab === "local") {
          const localQRDataUrl = await generateQRCodeWithLogo(
            process.env.NEXT_PUBLIC_API_LIVE_URL,
            defaultLogo,
            {
              width: 200,
              margin: 2,
              color: { dark: card.brandColor, light: "#FFFFFF" },
            },
          );
          const cards = loadBusinessCards();
          const newcard = cards.find((c) => c.metadata.id === card.metadata.id);
          if (newcard) {
            const updatedCard = {
              ...newcard,
              qrCode: {
                colorSource: "brand",
                selectedColor: card.brandColor,
                qrCodeUrl: qrDataUrl,
                qrLogoUrl: logoPreviewUrl || "",
                targetUrl: cardUrl,
              },

              localQRCode: {
                colorSource: "brand",
                selectedColor: card.brandColor,
                qrCodeUrl: localQRDataUrl,
                qrLogoUrl: logoPreviewUrl || "",
              },
            };
            saveBusinessCard(updatedCard);
            // setTimeout(() => {
            //   navigate(`/dashboard/cards/${card.metadata.id}?option=edit`);
            // }, 200);
            if (action === "details" || action === "view") {
              console.log("csacsa");
              navigate(`/dashboard/cards/${card.metadata.id}?option=edit`);
            } else if (action === "preview") {
              navigate(`/${card.urlName}`);
            } else {
              navigate(`/dashboard/cards/${card.metadata.id}`);
            }
          }
        } else {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.toLocaleString("en-US", { month: "long" });
          const day = getDaySuffix(now.getDate());

          const storage = getStorage();
          const qrRef = ref(
            storage,
            `cards/${year}/${month}/${day}/${user?.uid}/${card.id}/QRCode/qr_${card.metadata.id}.png`,
          );

          await uploadBytes(qrRef, qrBlob);
          const qrDownloadUrl = await getDownloadURL(qrRef);
          const updatedCard = {
            ...card,
            qrCode: {
              colorSource: "brand",
              selectedColor: card.brandColor,
              qrCodeUrl: qrDownloadUrl,
              qrLogoUrl: logoPreviewUrl || "",
              targetUrl: cardUrl,
            },
          };
          const q = query(
            collection(db, "cards"),
            where("metadata.id", "==", card.metadata.id),
          );

          let unsubscribe: (() => void) | undefined;

          getDocs(q).then(async (snapshot) => {
            if (!snapshot.empty) {
              const ref = snapshot.docs[0].ref;
              await updateDoc(ref, updatedCard);
              if (action === "details") {
                navigate(`/dashboard/cards/${card.metadata.id}?option=edit`);
              } else if (action === "preview") {
                navigate(`/${card.urlName}`);
              } else {
                navigate(`/dashboard/cards/${card.metadata.id}`);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to generate QR preview:", error);
      showToast("Failed to generate QR preview", "error");
    } finally {
    }
  }, []);

  const syncExistingQrCodes = useCallback(async () => {
    if (
      hasSyncedQrCodes ||
      !user?.uid ||
      typeof window === "undefined" ||
      myCards.length === 0
    ) {
      return;
    }

    setHasSyncedQrCodes(true);

    try {
      const defaultLogoResponse = await fetch(
        "/lovable-uploads/6e79eba6-9505-44d3-9af1-e8b13b7c46d0.png",
      );
      const defaultLogoBlob = await defaultLogoResponse.blob();

      for (const card of myCards) {
        try {
          const targetUrl = `${window.location.origin}/${card.urlName}`;
          const currentTargetUrl = card.qrCode?.targetUrl;

          if (!card.urlName || currentTargetUrl === targetUrl) {
            continue;
          }

          let logoFile: File | null = new File([defaultLogoBlob], "logo.png", {
            type: defaultLogoBlob.type,
          });

          if (card.qrCode?.qrLogoUrl) {
            try {
              const logoResponse = await fetch(card.qrCode.qrLogoUrl);
              const logoBlob = await logoResponse.blob();
              logoFile = new File([logoBlob], "logo.png", {
                type: logoBlob.type,
              });
            } catch (logoError) {
              console.error(
                `Failed to load custom QR logo for ${card.urlName}, using default logo instead.`,
                logoError,
              );
            }
          }

          const selectedColor =
            card.qrCode?.colorSource === "custom"
              ? card.qrCode?.selectedColor || "#000000"
              : card.brandColor;

          const qrDataUrl = await generateQRCodeWithLogo(targetUrl, logoFile, {
            width: 200,
            margin: 2,
            color: { dark: selectedColor, light: "#FFFFFF" },
          });

          const qrResponse = await fetch(qrDataUrl);
          const qrBlob = await qrResponse.blob();

          const now = new Date();
          const year = now.getFullYear();
          const month = now.toLocaleString("en-US", { month: "long" });
          const day = getDaySuffix(now.getDate());

          const storage = getStorage();
          const qrRef = ref(
            storage,
            `cards/${year}/${month}/${day}/${user.uid}/${card.id}/QRCode/qr_${card.metadata.id}.png`,
          );

          await uploadBytes(qrRef, qrBlob);
          const qrDownloadUrl = await getDownloadURL(qrRef);

          await updateDoc(doc(db, "cards", card.id || card.urlName), {
            qrCode: {
              ...(card.qrCode || {}),
              colorSource: card.qrCode?.colorSource || "brand",
              selectedColor: card.qrCode?.selectedColor || card.brandColor,
              qrCodeUrl: qrDownloadUrl,
              qrLogoUrl: card.qrCode?.qrLogoUrl || "",
              targetUrl,
            },
          });
        } catch (cardError) {
          console.error(`Failed to sync QR for card ${card.urlName}`, cardError);
        }
      }

      await getDataBaseCards();
    } catch (error) {
      console.error("Failed to sync existing QR codes:", error);
      setHasSyncedQrCodes(false);
    }
  }, [getDataBaseCards, hasSyncedQrCodes, myCards, user?.uid]);

  useEffect(() => {
    syncExistingQrCodes();
  }, [syncExistingQrCodes]);

  const handleCardAction = (
    action:
      | "edit"
      | "delete"
      | "share"
      | "view"
      | "analytics"
      | "preview"
      | "sync"
      | "details",
    card: BusinessCard,
  ) => {
    switch (action) {
      case "edit":
        // Store the card data for editing and navigate to onboarding
        localStorage.setItem("edit_card_data", JSON.stringify(card));
        navigate("/onboarding");
        break;
      case "delete":
        setCardToDelete(card);
        setShowDeleteDialog(true);
        break;
      case "view":
        if (card.qrCode && card.qrCode?.qrCodeUrl) {
          if (activeTab === "local")
            navigate(`/dashboard/cards/${card.metadata.id}?option=edit`);
          else {
            navigate(`/dashboard/cards/${card.metadata.id}`);
          }
        } else {
          generatePreviewQRCode(card, action);
        }
        // Navigate to card details view

        break;
      case "details":
        if (card?.qrCode && card.qrCode?.qrCodeUrl) {
          navigate(`/dashboard/cards/${card.metadata.id}?option=edit`);
        } else {
          generatePreviewQRCode(card, action);
          console.log("details==", card);
        }
        // Navigate to card details view
        break;
      case "preview":
        if (card.qrCode && card.qrCode?.qrCodeUrl) {
          // Navigate to local card preview
          navigate(`/${card.urlName}`);
        } else {
          generatePreviewQRCode(card, action);
          console.log("preview");
        }
        break;
      case "share":
        // Implement share functionality
        console.log("Share card:", card);
        break;
      case "analytics":
        // Handle analytics (pro feature)
        console.log("Analytics for card:", card);
        break;
      case "sync":
        getDataBaseCards();
        setCards(loadBusinessCards());
        // Handle analytics (pro feature)
        console.log("Analytics for card:", card);
        break;
    }
  };

  const handleToggleFavorite = (cardId: string) => {
    toggleCardFavorite(cardId);
    setCards(loadBusinessCards());
  };

  const handleCreateCard = () => {
    localStorage.removeItem("edit_card_data");
    navigate(`/?selectedTab=${activeTab}`);
  };

  function parseCreatedAt(input) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  const handleFavoriteCreateCard = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user?.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const planType = userData?.planType || "free"; // default to free
        const createdAt = parseCreatedAt(user?.createdAt);
        const trialEnd = new Date(
          createdAt.getTime() + (user?.freeTrialPeriod || 0) * 24 * 60 * 60 * 1000
        );
        const isTrialActive = new Date() <= trialEnd;

        const q = query(
          collection(db, "cards"),
          where("uid", "==", user?.uid)
        );
        const snapshot = await getDocs(q);

        if (planType === "free" && !isTrialActive) {
          if (snapshot.size >= 2) {
            setShowPermissionModal(true);
            return;
          } else {
            handleCreateCard();
            return;
          }
        } else if (
          planType === "paid" ||
          (planType === "free" && isTrialActive)
        ) {
          const addOnPlans = userData.addons || [];
          let extraCards = 0;
          addOnPlans.forEach((addon: any) => {
            if (
              addon.name === "Add 1 Pro Card" ||
              addon.name?.includes("1 Pro")
            ) {
              extraCards += 1;
            } else if (
              addon.name === "Add 5 Pro Cards" ||
              addon.name?.includes("5 Pro")
            ) {
              extraCards += 5;
            }
          });

          const maxAllowed = 2 + extraCards;

          if (snapshot.size >= maxAllowed) {
            setShowAddonsPermissionModal(true);
            return;
          } else {
            handleCreateCard();
            return;
          }
        } else {
          handleCreateCard();
          return;
        }
      } catch (error) {
        console.error("Error saving card:", error);
        showToast("Failed to save card", "error");
      }
      return;
    }
    handleCreateCard();
  };

  const handleConfirmDelete = () => {
    if (cardToDelete) {
      if (user && activeTab === "favorites") {
        setIsLoading(true);
        setShowDeleteDialog(false);
        deleteDatabaseBusinessCard(cardToDelete.metadata.id).then((res) => {
          getDataBaseCards();
          setCardToDelete(null);
          setIsLoading(false);
        });
      } else {
        setIsLoading(true);
        deleteBusinessCard(cardToDelete.metadata.id);
        setCards(loadBusinessCards());
        setIsLoading(false);
      }
      setIsLoading(false);
    }
    setIsLoading(false);
    setShowDeleteDialog(false);
    setCardToDelete(null);
  };
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

  // Don't render main content until access control is checked
  if (!isAccessControlChecked) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>

        {/* Access Control Modals */}
        <CreateCardPromptModal
          isOpen={showCreateCardModal}
          onClose={() => setShowCreateCardModal(false)}
        />

        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          firstName={welcomeFirstName}
        />
      </>
    );
  }

  // Show EmptyState only if access control passed and no cards exist
  // if (cards.length === 0 && !showCreateCardModal && !showWelcomeModal) {
  //   return <EmptyState onCreateCard={handleCreateCard} />;
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="local">
                Local Cards ({cards.length})
              </TabsTrigger>
              <TabsTrigger value="favorites">
                My Cards ({myCards?.length ?? 0}/{totalMyCardCounts})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            onClick={() => navigate("/members")}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Members Directory ({memberDirectoryCount})
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/opportunities")}
            className="flex items-center gap-2"
          >
            <Briefcase className="h-4 w-4" />
            Opportunities
          </Button>
          <Button onClick={() => navigate("/marketplace")} variant="outline">
            <ShoppingBag className="h-4 w-4" />
            Marketplace
          </Button>

          <Button
            onClick={() => {
              if (user?.planType === "paid") {
                setShowPostAdDialog(true);
              } else {
                setShowPermissionModal(true);
              }
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Post Your Ad
          </Button>
        </div>

        <div className="flex border border-border rounded-lg">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="local" className="mt-6">
          {viewMode === "grid" ? (
            <CardGrid
              cards={filteredCards}
              onAction={handleCardAction}
              onToggleFavorite={handleToggleFavorite}
              onCreateCard={handleCreateCard}
              defaultAction="view"
              activeTab={activeTab}
            />
          ) : (
            <CardList
              cards={filteredCards}
              onAction={handleCardAction}
              onToggleFavorite={handleToggleFavorite}
              onCreateCard={handleCreateCard}
              defaultAction="view"
              activeTab={activeTab}
            />
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {viewMode === "grid" ? (
            <CardGrid
              cards={filteredCards}
              onAction={handleCardAction}
              onToggleFavorite={handleToggleFavorite}
              onCreateCard={handleFavoriteCreateCard}
              defaultAction="view"
              activeTab={activeTab}
            />
          ) : (
            <CardList
              cards={filteredCards}
              onAction={handleCardAction}
              onToggleFavorite={handleToggleFavorite}
              onCreateCard={handleFavoriteCreateCard}
              defaultAction="view"
              activeTab={activeTab}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {cardToDelete
                ? `${cardToDelete.profile.firstName} ${cardToDelete.profile.lastName}`
                : "this card"}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Access Control Modals */}
      <CreateCardPromptModal
        isOpen={showCreateCardModal}
        onClose={() => setShowCreateCardModal(false)}
      />

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        firstName={welcomeFirstName}
      />

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
                  <Label>Select an existing Direct Ad from your cards *</Label>
                  <Select
                    value={selectedExistingAd}
                    onValueChange={handleSelectExistingAd}
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Choose an existing Direct Ad (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">-- Start Fresh --</SelectItem>
                      {existingDirectAds.map((ad) => (
                        <SelectItem key={ad.cardId} value={ad.cardId}>
                          {ad.cardName} - {ad.directAds.type}{" "}
                          {ad.directAds.title ? `(${ad.directAds.title})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will import the Direct Ad type, image, and profile info
                    from your card
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
                  <Badge variant="secondary">{adFormData.directAdType}</Badge>
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
                      <SelectItem value="services">Service</SelectItem>
                      <SelectItem value="Products">Product</SelectItem>
                      <SelectItem value="Events">Event</SelectItem>
                      <SelectItem value="CTA">CTA</SelectItem>
                      <SelectItem value="Booking">Booking</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
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

      {showPermissionModal && (
        <div
          style={{ margin: 0 }}
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center",
            "left-0",
          )}
        >
          {/* Dark overlay (only covers content area) */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal Box */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 z-50 w-full max-w-sm mx-4 text-center">
            <h1 className="text-xl font-bold mb-4">Pro Feature</h1>
            <p className="text-gray-600 mb-6">
              This feature is available only for{" "}
              <span className="font-semibold text-primary">Pro users</span>.
              Please purchase pro plan to continue.
            </p>

            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setShowPermissionModal(false);
                }}
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

      {showAddonsPermissionModal && (
        <div
          style={{ margin: 0 }}
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center",
            "left-0",
          )}
        >
          {/* Dark overlay (only covers content area) */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Modal Box */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 z-50 w-full max-w-sm mx-4 text-center">
            <h1 className="text-xl font-bold mb-4">Add More Pro Cards</h1>
            <p className="text-gray-600 mb-6">
              You can add 1 or 5 additional cards. To proceed to the pricing
              page, click continue
            </p>

            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setShowAddonsPermissionModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowAddonsPermissionModal(false);
                  setTimeout(() => router.replace("/pricing"), 100);
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
