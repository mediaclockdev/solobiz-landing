"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stats } from "@/components/dashboard/Stats";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { MemberStatus } from "@/components/dashboard/MemberStatus";
import { ReferralsLevels } from "@/components/dashboard/ReferralsLevels";
import { YourAccessories } from "@/components/dashboard/YourAccessories";
import { YourEarnings } from "@/components/dashboard/YourEarnings";
import { LeadsGenerated } from "@/components/dashboard/LeadsGenerated";
import UpgradeModal from "@/components/UpgradeModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityHeatmap } from "@/components/dashboard/systems/ActivityHeatmap";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { YourParent } from "@/components/dashboard/systems/YourParent";
import { Upload, Users } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessCard } from "@/types/businessCard";

type MarketplaceAd = {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  price?: number | string;
  sellerName?: string;
  sellerCompany?: string;
  sellerPhoto?: string;
  cardUrlName?: string;
  shopNowLink?: string;
  badge?: string;
  location?: string;
  availableDate?: string;
  endDate?: string;
  image?: string;
  directAdType?: "" | "Product" | "Event" | "Service" | "none";
  sourceCardId?: string;
  importedFromDirectAd?: boolean;
  [key: string]: any;
};

type UserCard = BusinessCard & {
  id?: string;
  uid?: string;
  metadata?: {
    id?: string;
    [key: string]: any;
  };
};

export default function DashboardHome() {
  const ITEMS_PER_PAGE = 2;

  const [showWarning, setShowWarning] = useState(false);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ads, setAds] = useState<MarketplaceAd[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAd, setSelectedAd] = useState<MarketplaceAd | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

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
    sourceCardId: "",
    importedFromDirectAd: false,
  });

  const userId = user?.uid;

  const onLockClick = () => {
    setShowWarning(true);
  };

  const fetchMarketplaceAds = async () => {
    try {
      const adsQuery = query(
        collection(db, "marketplace_ads"),
        orderBy("createdAt", "desc"),
      );

      const adsSnapshot = await getDocs(adsQuery);
      const allAds: MarketplaceAd[] = adsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as MarketplaceAd[];

      if (!allAds.length) {
        setAds([]);
        return;
      }

      const cardsSnapshot = await getDocs(collection(db, "cards"));
      const cardsMap: Record<string, any> = {};

      const cardsData = cardsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      cardsData.forEach((card: any) => {
        if (card?.metadata?.id) {
          cardsMap[card.metadata.id] = card;
        }
      });

      const filteredAds = allAds.filter((ad) => {
        const card = cardsMap[ad.sourceCardId || ""];
        return card && card.uid === userId;
      });

      setAds(filteredAds);
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMarketplaceAds();
    }
  }, [userId]);

  const paginatedAds = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return ads.slice(start, end);
  }, [ads, currentPage]);

  const totalPages = Math.max(1, Math.ceil(ads.length / ITEMS_PER_PAGE));

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;

    try {
      await deleteDoc(doc(db, "marketplace_ads", id));
      setAds((prev) => prev.filter((a) => a.id !== id));
      setSelectedAd(null);
    } catch (error) {
      console.error("Error deleting ad:", error);
    }
  };

  const handleEditAd = (ad: MarketplaceAd) => {
    setIsEditMode(true);
    setEditingAdId(ad.id);

    setAdFormData({
      title: ad.title || "",
      description: ad.description || "",
      fullDescription: "",
      category: ad.category || "",
      price: String(ad.price || ""),
      sellerName: ad.sellerName || "",
      cardUrlName: ad.cardUrlName || "",
      shopNowLink: ad.shopNowLink || "",
      badge: ad.badge || "featured",
      location: ad.location || "",
      availableDate: ad.availableDate || "",
      endDate: ad.endDate || "",
      image: null,
      imagePreview: ad.image || "",
      directAdType: ad.directAdType || "",
      sellerPhoto: ad.sellerPhoto || "",
      sellerCompany: ad.sellerCompany || "",
      sourceCardId: ad.sourceCardId || "",
      importedFromDirectAd: ad.importedFromDirectAd || false,
    });

    setSelectedAd(null);
    setShowEditDialog(true);
  };

  const handleUpdateAd = async () => {
    if (!editingAdId) return;

    try {
      await updateDoc(doc(db, "marketplace_ads", editingAdId), {
        title: adFormData.title,
        description: adFormData.description,
        category: adFormData.category,
        price: Number(adFormData.price),
        sellerName: adFormData.sellerName,
        sellerCompany: adFormData.sellerCompany,
        sellerPhoto: adFormData.sellerPhoto,
        badge: adFormData.badge || null,
        image: adFormData.imagePreview || "",
        shopNowLink: adFormData.shopNowLink,
        location: adFormData.location,
        availableDate: adFormData.availableDate,
        endDate: adFormData.endDate,
        directAdType: adFormData.directAdType,
        sourceCardId: adFormData.sourceCardId,
        cardUrlName: adFormData.cardUrlName,
        importedFromDirectAd: adFormData.importedFromDirectAd,
      });

      setShowEditDialog(false);
      setEditingAdId(null);
      setIsEditMode(false);

      fetchMarketplaceAds();
    } catch (error) {
      console.error("Error updating ad:", error);
    }
  };

  const handleMarketplaceImageUpload = async (file: File) => {
    if (!editingAdId) return;

    try {
      const storage = getStorage();
      const fileRef = ref(
        storage,
        `marketplace_ads/${Date.now()}-${file.name}`,
      );

      await uploadBytes(fileRef, file);
      const imageUrl = await getDownloadURL(fileRef);

      await updateDoc(doc(db, "marketplace_ads", editingAdId), {
        image: imageUrl,
      });

      setAdFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: imageUrl,
      }));

      fetchMarketplaceAds();
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleMarketplaceImageUpload(file);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const fetchCards = async () => {
      try {
        const cardsRef = collection(db, "cards");
        const q = query(cardsRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const userCards = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as UserCard[];

        setCards(userCards);
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [user]);

  return (
    <div className="space-y-4">
      <Stats />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        <div className="sm:col-span-2 lg:col-span-1 flex flex-col h-full">
          <YourParent className="h-full" />
        </div>
        <div className="sm:col-span-2 lg:col-span-2 flex flex-col h-full">
          <ActivityHeatmap cardCount={cards?.length} user={user} className="h-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <RevenueChart onLockClick={onLockClick} />
        </div>
        <div className="sm:col-span-1 lg:col-span-1">
          <MemberStatus />

          <div className="grid gap-6 md:grid-cols-1 mt-5">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Summary of Marketplace Ads
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {paginatedAds.length > 0 ? (
                    paginatedAds.map((ad) => (
                      <div
                        key={ad.id}
                        onClick={() => setSelectedAd(ad)}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={ad.image || ""}
                            alt={ad.title || "ad-image"}
                            className="w-12 h-12 object-cover rounded"
                          />

                          <div>
                            <p className="font-medium">{ad.title}</p>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          ${ad.price}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No marketplace ads found.
                    </p>
                  )}
                </div>

                {ads.length > 0 && (
                  <div className="flex justify-center gap-3 mt-6 items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>

                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
        <div className="sm:col-span-1 lg:col-span-2">
          <ReferralsLevels />
        </div>

        <div className="sm:col-span-1 lg:col-span-1 space-y-4">
          <YourAccessories />
          <YourEarnings />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <LeadsGenerated onLockClick={onLockClick} />
        </div>
      </div>

      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />

      <Dialog open={!!selectedAd} onOpenChange={() => setSelectedAd(null)}>
        <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl overflow-y-auto">
          {selectedAd && (
            <div className="space-y-4">
              <div className="relative w-40 h-40 overflow-hidden">
                <img
                  src={selectedAd.image || ""}
                  alt={selectedAd.title || "selected-ad"}
                  className="w-40 h-full object-cover rounded"
                />
              </div>

              <h2 className="text-xl font-semibold">{selectedAd.title}</h2>

              <p className="text-muted-foreground">{selectedAd.description}</p>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Users className="h-4 w-4" />
                <span>
                  {selectedAd.sellerName} | {selectedAd.sellerCompany}
                </span>
              </div>

              <Badge variant="outline" className="text-xs capitalize">
                {selectedAd.category}
              </Badge>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/marketplace/${selectedAd.id}`)}
                >
                  View Details
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => handleEditAd(selectedAd)}
                >
                  ✏️ Edit
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAd(selectedAd.id)}
                >
                  🗑 Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEditMode ? "Edit Ad" : "Post Your Ad"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {adFormData.sellerPhoto && adFormData.sellerName && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <Avatar className="h-10 w-10">
                  {adFormData.sellerPhoto ? (
                    <AvatarImage
                      src={adFormData.sellerPhoto}
                      alt={adFormData.sellerName}
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {adFormData.sellerName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  )}
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

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">
                Basic Information
              </h3>

              {adFormData.directAdType && (
                <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                  <Badge variant="secondary">{adFormData.directAdType}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Current category: {adFormData.category}
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
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">
                Product Image
              </h3>

              {adFormData.imagePreview ? (
                <div className="space-y-3 text-center">
                  <img
                    src={adFormData.imagePreview}
                    alt="Uploaded"
                    className="w-full h-48 object-cover rounded"
                  />

                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm cursor-pointer transition bg-blue-600 text-white hover:bg-blue-700">
                    <Upload className="h-4 w-4" />
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-3 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-gray-600">No image uploaded</p>

                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm cursor-pointer transition border border-dashed border-gray-400 hover:border-blue-500 hover:text-blue-600">
                    <Upload className="h-4 w-4" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">
                Pricing
              </h3>

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
              </div>
            </div>

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

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingAdId(null);
                  setIsEditMode(false);
                }}
              >
                Cancel
              </Button>

              <Button onClick={handleUpdateAd}>Update Ad</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
