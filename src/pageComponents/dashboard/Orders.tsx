"use client";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import {
  loadInvoices,
  AccessoryInvoice,
  updateOrderTracking,
  TrackingStage,
  AssignmentRow,
} from "@/utils/invoiceGenerator";
import {
  downloadInvoicePDF,
  printInvoicePDF,
} from "@/utils/pdfInvoiceGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  ChevronRight,
  ShoppingBag,
  FileText,
  Download,
  Printer,
  TruckIcon,
  Banknote,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { OrderStatusTimeline } from "@/components/dashboard/OrderStatusTimeline";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
  orderBy,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { getAuth } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { generateQRCodeWithLogo } from "@/utils/qrCodeGenerator";
import html2canvas from "html2canvas";
import { colorSchemes } from "@/utils/cardFilters";

export default function Orders(props) {
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const { isAdmin } = props;
  const [invoices, setInvoices] = useState<AccessoryInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] =
    useState<AccessoryInvoice | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string>("essential");
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userId = currentUser ? currentUser.uid : null;
  const { user } = useAuth();
  const { showToast } = useToast();
  const [qrCodes, setQrCodes] = useState([]);
  const [qrCodesForStickers, setQrCodesForStickers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 2;
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [nfcCards, setNfcCards] = useState<any[]>([]);
  const [orderItemIds, setOrderItemIds] = useState<string[]>([]);
  const [selectedNfcCard, setSelectedNfcCard] = useState("");
  const [selectedOrderItemId, setSelectedOrderItemId] = useState("");
  const [loadingModalData, setLoadingModalData] = useState(false);

  const [setuserId, setOrderUserID] = useState("");

  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        if (!userId && !isAdmin) return; // Only block if non-admin and no userId

        // Build query dynamically
        const ordersCollection = collection(db, "orders");
        const ordersQuery = isAdmin
          ? query(ordersCollection) // Admin: fetch all orders
          : query(ordersCollection, where("userId", "==", userId)); // Non-admin: fetch only their orders

        const querySnapshot = await getDocs(ordersQuery);

        const orders: any[] = [];
        querySnapshot.forEach((doc) => {
          orders.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Sort by date or createdAt
        const sortedInvoices = orders.sort((a, b) => {
          const timeA = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : new Date(a.date).getTime();

          const timeB = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : new Date(b.date).getTime();

          return timeB - timeA; // latest first
        });

        sortedInvoices.forEach((sortedInvoices, index) => {
          setOrderUserID(sortedInvoices.userId);
        });

        setInvoices(sortedInvoices);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    if (invoices?.length <= 0 && !isDetailsOpen) {
      fetchUserOrders();
    }
  }, [user, isAdmin]);

  const getStatusColor = (status: AccessoryInvoice["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-600 hover:bg-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-600 hover:bg-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case "credit-card":
        return "Credit Card";
      case "bank-transfer":
        return "Bank Transfer";
      case "cash":
        return "Cash";
      default:
        return "Not specified";
    }
  };

  const handleViewDetails = async (invoice: AccessoryInvoice) => {
    const cardMap = [];
    invoice?.items?.forEach((c) => {
      cardMap.push(c.orderItemId);
    });

    const orderItemIds = cardMap[0];
    console.log("orderItemIds", orderItemIds);
    const q = query(
      collection(db, "nfc_cards"),
      where("orderItemId", "in", orderItemIds)
    );

    const snapshot = await getDocs(q);

    const cards = snapshot.docs.map((doc) => ({
      orderItemId: doc.data().orderItemId,
      card_id: doc.data().card_id,
      card_number: doc.data().card_number,
      nfc_uid: doc.data().nfc_uid,
    }));

    console.log("cards", cards);
    setSelectedInvoice({
      ...invoice,
      nfc_card: cards,
    });

    setIsDetailsOpen(true);
    console.log("invoice", invoice);
  };

  const handleDownloadPDF = (
    invoice: AccessoryInvoice,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    try {
      downloadInvoicePDF(invoice);
      showToast("Invoice downloaded successfully", "success");
    } catch (error) {
      toast.error("Failed to download invoice");
      console.error("PDF download error:", error);
    }
  };

  const handlePrintPDF = (invoice: AccessoryInvoice) => {
    try {
      printInvoicePDF(invoice);
      showToast("Opening print dialog...", "success");
    } catch (error) {
      showToast("Failed to print invoice", "error");
      toast.error("Failed to print invoice");
      console.error("PDF print error:", error);
    }
  };

  useEffect(() => {
    if (!showProcessingModal || !selectedInvoice) return;

    const loadData = async () => {
      setLoadingModalData(true);

      try {
        const nfcQuery = query(
          collection(db, "nfc_cards"),
          where("status", "==", "unclaimed"),
          where("userId", "==", null)
        );

        const nfcSnap = await getDocs(nfcQuery);

        const cards = nfcSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const sortedCards = cards.sort((a: any, b: any) =>
          b.card_id.localeCompare(a.card_id, undefined, {
            sensitivity: "base", // case-insensitive
          })
        );

        setNfcCards(sortedCards);

        const ids =
          selectedInvoice?.items?.flatMap(
            (item: any) => item.orderItemId || []
          ) || [];

        setOrderItemIds(ids);
      } catch (err) {
        console.error("Failed to load processing data", err);
      } finally {
        setLoadingModalData(false);
      }
    };

    loadData();
  }, [showProcessingModal, selectedInvoice]);

  const handleUpdateTracking = async (
    invoiceNumber: string,
    stage: TrackingStage
  ) => {
    try {
      setUpdatingTracking(true);
      const descriptions: Record<TrackingStage, string> = {
        placed: "Order has been placed successfully",
        processing: "Order is being processed and prepared",
        shipped: "Order has been shipped and is on the way",
        delivered: "Order has been delivered successfully",
      };

      await updateOrderTracking(invoiceNumber, stage, descriptions[stage]);

      const userQuery = doc(db, "users", userId);
      const userSnapshot = await getDoc(userQuery);
      const user_data = userSnapshot.data();
      if (user_data?.notificationPreferences?.orderUpdates) {
        await fetch("/api/order-tracking-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceNumber,
            stage,
            description: descriptions[stage],
          }),
        });
      }

      showToast(`Order status updated to ${stage}`, "success");
      setSelectedInvoice({
        ...selectedInvoice,
        tracking: [
          ...selectedInvoice.tracking, // keep existing stages
          {
            stage,
            description: descriptions[stage],
            timestamp: new Date().toISOString(),
          }, // push new stage info
        ],
      });
      setUpdatingTracking(false);
      // Re-fetch orders after update
      // fetchUserOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update tracking");
    }
  };

  const getNextTrackingStage = (
    invoice: AccessoryInvoice
  ): TrackingStage | null => {
    const stages: TrackingStage[] = [
      "placed",
      "processing",
      "shipped",
      "delivered",
    ];
    const currentStages = invoice?.tracking?.map((t) => t.stage) || [];

    for (const stage of stages) {
      if (!currentStages.includes(stage)) {
        return stage;
      }
    }
    return null;
  };

  const generateQRForItem = async (
    // cardId: string,
    selectedColor: string,
    tapStickerLogo?: string | null
  ) => {
    try {
      const colorHexMap: Record<string, string> = {
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
      // ONLY card ID – NOT user URL
      const scanUrl = `${process.env.NEXT_PUBLIC_API_LIVE_URL}`;

      const qrUrl = await generateQRCodeWithLogo(scanUrl, null, {
        width: 300,
        margin: 1,
        //@ts-ignore
        useDefaultLogo: false,
        color: {
          dark: qrColor,
          light: qrBackground,
        },
      });

      return qrUrl;
    } catch (error) {
      console.error("QR Generate Error:", error);
      return null;
    }
  };

  // const generateQRForItem = async (
  //   assignedDigitalCard: string,
  //   selectedColor: string,
  //   tapStickerLogo?: string | null
  // ) => {
  //   try {
  //     const colorHexMap: Record<string, string> = {
  //       red: "#EF4444",
  //       pink: "#EC4899",
  //       yellow: "#EAB308",
  //       mint: "#10B981",
  //       green: "#059669",
  //       blue: "#3B82F6",
  //       purple: "#8B5CF6",
  //       white: "#FFFFFF",
  //       black: "#000000",
  //     };

  //     const qrColor = colorHexMap[selectedColor] || "#000000";
  //     const qrBackground = selectedColor === "white" ? "#1F2937" : "#FFFFFF";

  //     const qrUrl = await generateQRCodeWithLogo(
  //       `https://dash.solobizcards.com/card/${assignedDigitalCard}?selectedTab=favorites&view=true`,
  //       null,
  //       {
  //         width: 300,
  //         margin: 1,
  //         //@ts-ignore
  //         useDefaultLogo: false,
  //         color: {
  //           dark: qrColor,
  //           light: qrBackground,
  //         },
  //       }
  //     );

  //     return qrUrl;
  //   } catch (error) {
  //     console.error("QR Generate Error:", error);
  //     return null;
  //   }
  // };

  // Convert remote image URL → Base64
  const convertUrlToBase64 = async (imageUrl) => {
    try {
      const res = await fetch(
        `/api/convert-image?imageUrl=${encodeURIComponent(imageUrl)}`
      );

      if (!res.ok) return null;

      return await res.text(); // ← Already Base64 Data URL
    } catch (error) {
      console.error("Base64 convert error:", error);
      return null;
    }
  };

  const base64ToBlob = (base64, mime = "image/png") => {
    const byteString = atob(base64.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
  };

  const generateQRForSticker = async (
    assignedDigitalCard,
    selectedColor,
    tapStickerLogo = null
  ) => {
    try {
      const colorHexMap = {
        red: "#EF4444",
        pink: "#EC4899",
        yellow: "#EAB308",
        mint: "#10B981",
        green: "#059669",
        blue: "#3B82F6",
        purple: "#8B5CF6",
        white: "#FFFFFF",
        black: "#000000",
      };

      const qrColor = colorHexMap[selectedColor] || "#000000";
      const qrBackground = selectedColor === "white" ? "#1F2937" : "#FFFFFF";

      let logoBlob = null;
      if (tapStickerLogo) {
        const logoBase64 = await convertUrlToBase64(tapStickerLogo);
        if (logoBase64) {
          logoBlob = base64ToBlob(logoBase64);
        }
      }

      return await generateQRCodeWithLogo(
        `${process.env.NEXT_PUBLIC_API_LIVE_URL}`,
        logoBlob,
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
    } catch (error) {
      console.error("QR Generate Error:", error);
      return null;
    }
  };

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
  useEffect(() => {
    const loadQRCodes = async () => {
      if (!selectedInvoice?.items) return;
      const codes = await Promise.all(
        selectedInvoice.items.flatMap((item, index) =>
          generateQRForItem(item?.color)
        )
      );
      setQrCodes(codes);
    };

    const loadQRCodesForStickers = async () => {
      if (!selectedInvoice?.items) return;
      const codes = await Promise.all(
        selectedInvoice.items.flatMap((item) =>
          item?.cardDetails?.assignedDigitalCard?.map((ass) => {
            return generateQRForItem(item?.cardDetails?.tapStickerColor);
          }) || []
        )
      );
      setQrCodesForStickers(codes);
    };

    loadQRCodesForStickers();
    loadQRCodes();
  }, [selectedInvoice]);

  const totalPages = Math.ceil(invoices.length / recordsPerPage);

  const paginatedInvoices = invoices.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const frontRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stickerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [downloadingBack, setDownloadingBack] = useState<number | null>(null);

  const downloadCardAsImage = async (
    element: HTMLElement,
    fileName: string
  ) => {
    await document.fonts.ready;

    const canvas = await html2canvas(element, {
      scale: 3, // high quality capture
      useCORS: true,
      backgroundColor: null,
    });

    // 🎯 TARGET SIZE
    const TARGET_WIDTH = element.offsetWidth;
    const TARGET_HEIGHT = element.offsetHeight;

    // Create resized canvas
    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = TARGET_WIDTH;
    resizedCanvas.height = TARGET_HEIGHT;

    const ctx = resizedCanvas.getContext("2d")!;
    ctx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT
    );

    const image = resizedCanvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = image;
    link.download = fileName;
    link.click();
  };

  const downloadCardTransperentAsImage = async (
    element: HTMLElement,
    fileName: string
  ) => {
    await document.fonts.ready;

    // target the inner card div (FIRST CHILD)
    const card = element.firstElementChild as HTMLElement;

    // store & remove background
    const originalBg = card.style.background;
    card.style.background = "transparent";

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });

    // restore background (UI unchanged)
    card.style.background = originalBg;

    // resize (unchanged)
    const TARGET_WIDTH = element.offsetWidth;
    const TARGET_HEIGHT = element.offsetHeight;

    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = TARGET_WIDTH;
    resizedCanvas.height = TARGET_HEIGHT;

    const ctx = resizedCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    ctx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT
    );

    const image = resizedCanvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = image;
    link.download = fileName;
    link.click();
  };

  const downloadMobileCardTransperentAsImage = async (
    element: HTMLElement,
    fileName: string
  ) => {
    await document.fonts.ready;

    // target inner card element
    const card = element.firstElementChild as HTMLElement;

    // save & remove background
    const originalBg = card.style.background;
    card.style.background = "transparent";

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });

    // restore UI background
    card.style.background = originalBg;

    // 100% of element size (REAL PIXELS)
    const TARGET_WIDTH = element.offsetWidth;
    const TARGET_HEIGHT = element.offsetHeight;

    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = TARGET_WIDTH;
    resizedCanvas.height = TARGET_HEIGHT;

    const ctx = resizedCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    ctx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT
    );

    const image = resizedCanvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = image;
    link.download = fileName;
    link.click();
  };

  const downloadMobileCardAsImage = async (
    element: HTMLElement,
    fileName: string
  ) => {
    await document.fonts.ready;

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });

    // 🎯 100% of element size (REAL PIXELS)
    const TARGET_WIDTH = element.offsetWidth;
    const TARGET_HEIGHT = element.offsetHeight;

    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = TARGET_WIDTH;
    resizedCanvas.height = TARGET_HEIGHT;

    const ctx = resizedCanvas.getContext("2d")!;
    ctx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT
    );

    const image = resizedCanvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = image;
    link.download = fileName;
    link.click();
  };

  const handleDownloadFront = async (
    itemIndex: number,
    productVariant: string
  ) => {
    const el = frontRefs.current[itemIndex];
    if (!el) return;

    try {
      setDownloadingIndex(itemIndex);

      await downloadCardAsImage(
        el,
        `${productVariant}-${user?.displayName}-front-color.png`
      );
      await downloadCardTransperentAsImage(
        el,
        `${productVariant}-${user?.displayName}-front-transperent.png`
      );
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleDownloadBack = async (index: number, productVariant: string) => {
    const el = backRefs.current[index];
    if (!el) return;

    try {
      setDownloadingBack(index); // 🔄 start loader

      await downloadCardAsImage(
        el,
        `${productVariant}-${user?.displayName}-back.png`
      );
      await downloadCardTransperentAsImage(
        el,
        `${productVariant}-${user?.displayName}-front-transperent.png`
      );
    } finally {
      setDownloadingBack(null); // ✅ stop loader
    }
  };

  const handleConfirmProcessing = async () => {
    if (isConfirming) return;

    try {
      setIsConfirming(true);
      const batch = writeBatch(db);
      const cards = [];

      assignments.forEach((a) => {
        const nfcRef = doc(db, "nfc_cards", a.nfcCardId);

        batch.update(nfcRef, {
          orderItemId: a.orderItemId,
          invoiceNumber: selectedInvoice.invoiceNumber,
          userId: setuserId,
          updatedAt: serverTimestamp(),
        });

        cards.push({
          orderItemId: a.orderItemId,
          card_id: a.nfcCardId,
        });
      });

      console.log("cards", cards);

      await batch.commit();

      await handleUpdateTracking(selectedInvoice.invoiceNumber, "processing");

      setShowProcessingModal(false);
      setSelectedInvoice((prev) => ({
        ...prev,
        nfc_card: cards,
      }));
    } catch (err) {
      console.error("Processing failed", err);
    } finally {
      setIsConfirming(false);
    }
  };

  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);

  const totalQuantity =
    selectedInvoice?.items?.reduce(
      (sum: number, item: any) => sum + Number(item.quantity || 0),
      0
    ) || 0;

  const quantity = totalQuantity;

  useEffect(() => {
    if (!showProcessingModal || !orderItemIds.length) return;

    const initialAssignments: AssignmentRow[] = orderItemIds.map(
      (orderItemId) => ({
        orderItemId, // fixed per card
        nfcCardId: "",
      })
    );

    setAssignments(initialAssignments);
  }, [showProcessingModal, orderItemIds]);

  const updateAssignment = (
    index: number,
    field: "nfcCardId",
    value: string
  ) => {
    setAssignments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const isValid = assignments.every((a) => a.nfcCardId && a.orderItemId);

  const isConfirmDisabled =
    assignments.length === 0 || assignments.some((a) => !a.nfcCardId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Order History</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            View and track all your accessory orders
          </p>
        </div>
        <Badge variant="outline" className="text-base sm:text-lg px-4 py-2 w-fit">
          {invoices.length} {invoices.length === 1 ? "Order" : "Orders"}
        </Badge>
      </div>

      {invoices.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Once you place an order, it will appear here. Start shopping for
              accessories!
            </p>
            <Button
              className="mt-6"
              onClick={() => (window.location.href = "/dashboard/accessories")}
            >
              Browse Accessories
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paginatedInvoices.map((invoiceDoc: any) =>
            invoiceDoc?.accessory_invoices?.map((invoice) => (
              <Card
                key={invoice.invoiceNumber}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="font-bold text-lg">
                            {invoice.invoiceNumber}
                            {/* {invoiceDoc?.paymentDetails?.paymentIntentId} */}
                          </span>
                        </div>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {invoice.date
                               ? format(new Date(invoice.date), "MMM dd, yyyy")
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>
                            {invoice?.items?.length}{" "}
                            {invoice?.items?.length === 1 ? "item" : "items"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          <span>
                            {getPaymentMethodLabel(invoice.paymentMethod)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Banknote className="h-4 w-4" />
                          <span>
                            {invoiceDoc?.paymentDetails?.paymentIntentId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">
                            {invoice?.customerInfo?.email}
                          </span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                        <div className="text-2xl font-bold">
                          ${invoice?.totals?.total?.toFixed(2)}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleDownloadPDF(invoice, e)}
                            className="gap-2 w-full sm:w-auto justify-center"
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(invoice)}
                            className="gap-2 w-full sm:w-auto justify-center"
                          >
                            View Details
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {invoices.length > 0 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <Button
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
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Invoice Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 shrink-0" />
                <span>Invoice Details</span>
              </DialogTitle>
              {selectedInvoice && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintPDF(selectedInvoice)}
                    className="gap-2 flex-1 sm:flex-initial justify-center"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(selectedInvoice)}
                    className="gap-2 flex-1 sm:flex-initial justify-center whitespace-nowrap"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 py-4">
              {/* Order Status Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TruckIcon className="h-4 w-4" />
                    Order Tracking
                  </h3>

                  {isAdmin &&
                    selectedInvoice.status !== "cancelled" &&
                    getNextTrackingStage(selectedInvoice) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const nextStage =
                            getNextTrackingStage(selectedInvoice);
                          if (nextStage === "processing") {
                            setShowProcessingModal(true);
                          } else if (nextStage) {
                            handleUpdateTracking(
                              selectedInvoice.invoiceNumber,
                              nextStage
                            );
                          }
                        }}
                      >
                        {updatingTracking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>Update to {getNextTrackingStage(selectedInvoice)}</>
                        )}
                      </Button>
                    )}
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <OrderStatusTimeline
                    isAdmin={isAdmin}
                    tracking={selectedInvoice.tracking}
                    currentStatus={selectedInvoice.status}
                    cardStatus={selectedInvoice.nfc_card}
                  />
                </div>
              </div>

              <Separator />
              {/* Front and Back Cards - Inline Layout */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Front Card */}
                <div className="flex-1 space-y-2">
                  {selectedInvoice?.items?.map((item, itemIndex) => {
                    // if (item.cardDetails.assignedDigitalCard) {
                    // return item.cardDetails?.map(
                    //   (ass, assIndex) => {
                    if (item?.productType === "sticker") return null;
                    return (
                      <>
                        <Label className="text-sm font-medium">Front</Label>
                        <div
                          className="w-full max-w-[321px] aspect-[1.6/1]"
                          key={`${itemIndex}`}
                          ref={(el) => {
                            frontRefs.current[itemIndex] = el;
                          }}
                        >
                          <div
                            className="w-full h-full rounded-2xl p-0 flex items-center justify-center shadow-xl"
                            style={{
                              overflow: "hidden",
                              borderRadius: "12px",
                              background:
                                colorSchemes[item?.color]?.bg ||
                                colorSchemes.black.bg,
                            }}
                          >
                            {/* ESSENTIAL */}
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

                            {/* INFINITE */}
                            {(item?.selectedCard === "infinite" ||
                              item?.selectedCard === "personalize") && (
                              <div className="relative w-full h-full flex flex-col p-6">
                                <div className="absolute top-6 right-6 w-12 h-12 rounded-lg flex items-center justify-center">
                                  {item?.cardDetails.useLogoImage &&
                                  item?.cardDetails?.personalizeLogo ? (
                                    <img
                                      src={`/api/image-proxy?url=${encodeURIComponent(
                                        item?.cardDetails?.personalizeLogo
                                      )}`}
                                      // src={}
                                      alt="Logo"
                                      className="max-w-full max-h-full object-contain rounded-lg"
                                    />
                                  ) : !item?.cardDetails.useLogoImage ? (
                                    <div
                                      className="text-xs font-bold text-center"
                                      style={{
                                        color:
                                          colorSchemes[item?.color]?.text ||
                                          colorSchemes.black.text,
                                      }}
                                    >
                                      {item?.cardDetails.logoText}
                                    </div>
                                  ) : null}
                                </div>

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
                                      __html: item?.cardDetails.companyName,
                                    }}
                                  />
                                  <div
                                    className="text-xl font-semibold"
                                    dangerouslySetInnerHTML={{
                                      __html: item?.cardDetails.firstName,
                                    }}
                                  />
                                  <div
                                    className="text-base"
                                    dangerouslySetInnerHTML={{
                                      __html: item?.cardDetails.additionalInfo,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* CUSTOM - IMAGE + TEXT */}
                            {item?.selectedCard === "custom" &&
                              item?.cardDetails.customCardDesignType ===
                                "image-text" && (
                                <div className="relative w-full h-full">
                                  {item?.cardDetails?.customLogo ? (
                                    <img
                                      src={`/api/image-proxy?url=${encodeURIComponent(
                                        item?.cardDetails.customLogo
                                      )}`}
                                      // src={item?.cardDetails.customLogo}
                                      alt="Custom Design"
                                      className="w-full h-full object-contain rounded-xl"
                                    />
                                  ) : (
                                    <div
                                      className="w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center"
                                      style={{
                                        borderColor: "rgba(255,255,255,0.3)",
                                        color:
                                          item?.color === "black"
                                            ? "#FFFFFF"
                                            : colorSchemes[item?.color]?.text,
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

                            {/* CUSTOM - IMAGE + IMAGE */}
                            {item?.selectedCard === "custom" &&
                              item?.cardDetails.customCardDesignType ===
                                "image-image" && (
                                <div className="relative w-full h-full">
                                  {item?.cardDetails?.frontLogo ? (
                                    <img
                                      src={`/api/image-proxy?url=${encodeURIComponent(
                                        item?.cardDetails?.frontLogo
                                      )}`}
                                      //src={item?.cardDetails?.frontLogo}
                                      alt="Custom Design"
                                      className="w-full h-full object-cover rounded-xl"
                                    />
                                  ) : (
                                    <div
                                      className="w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center"
                                      style={{
                                        borderColor: "rgba(255,255,255,0.3)",
                                        color:
                                          item?.color === "black"
                                            ? "#FFFFFF"
                                            : colorSchemes[item?.color]?.text,
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
                        {isAdmin && (
                          <Button
                            onClick={() =>
                              handleDownloadFront(
                                itemIndex,
                                item.productVariant
                              )
                            }
                            disabled={downloadingIndex === itemIndex}
                            className="flex items-center gap-2"
                          >
                            {downloadingIndex === itemIndex ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              "Download Front"
                            )}
                          </Button>
                        )}
                      </>
                    );
                    //   }
                    // );
                    // }
                    // return null;
                  })}
                </div>

                {/* Back Card */}
                <div className="flex-1 space-y-2">
                  {selectedInvoice?.items?.map((item, index) => {
                    if (item.cardDetails.assignedDigitalCard) {
                      // return item.cardDetails.assignedDigitalCard?.map(
                      //   (ass, assIndex) => {
                      const qrCode = qrCodes[index];
                      if (item?.productType != "sticker") {
                        return (
                          <>
                            <Label className="text-sm font-medium">Back</Label>
                            <div
                              className="w-full max-w-[321px] aspect-[1.6/1]"
                              key={`${index}`}
                              ref={(el) => {
                                backRefs.current[index] = el;
                              }}
                            >
                              <div
                                className="w-full h-full rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden"
                                style={{
                                  borderRadius: "12px",
                                  overflow: "hidden",
                                  background:
                                    colorSchemes[item?.color]?.bg ||
                                    colorSchemes.black.bg,
                                  color:
                                    colorSchemes[item?.color]?.text ||
                                    colorSchemes.black.text,
                                }}
                              >
                                {item?.selectedCard === "essential" && (
                                  // Solo Essential
                                  <div className="flex items-center justify-center h-full">
                                    <div className="bg-white p-[0.2rem] rounded-lg">
                                      <img
                                        src={
                                          qrCode ||
                                          "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                        }
                                        alt="QR Code"
                                        className="w-16 h-16"
                                      />
                                    </div>
                                  </div>
                                )}

                                {(item?.selectedCard === "infinite" ||
                                  item?.selectedCard === "personalize") && (
                                  <>
                                    <div className="flex justify-end">
                                      <div className="bg-white p-[0.2rem] rounded-lg">
                                        <img
                                          src={
                                            qrCode ||
                                            "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                          }
                                          alt="QR Code"
                                          className="w-16 h-16"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 justify-start">
                                      {item?.cardDetails?.optionalText ? (
                                        <span className="text-lg font-semibold">
                                          {item?.cardDetails?.optionalText}
                                        </span>
                                      ) : (
                                        <span className="text-lg font-semibold">
                                          Solo
                                        </span>
                                      )}
                                    </div>
                                  </>
                                )}

                                {/* 🔵 CUSTOM BACK – IMAGE + TEXT */}
                                {item?.selectedCard === "custom" &&
                                item?.cardDetails?.customCardDesignType !==
                                  "image-image" ? (
                                  item?.cardDetails?.hideTextOnBack ? (
                                    // If hideTextOnBack is true → show only QR code on blank background
                                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                      <div className="absolute top-2 right-2 bg-white p-[0.2rem] rounded-lg">
                                        <img
                                          src={
                                            qrCode ||
                                            "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                          }
                                          alt="QR Code"
                                          className="w-16 h-16"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    // Else show the full text + QR code layout
                                    <div className="flex justify-between h-full">
                                      <div className="flex flex-col justify-between text-xs h-full">
                                        <div className="space-y-0.5">
                                          <div
                                            className="font-semibold text-sm"
                                            dangerouslySetInnerHTML={{
                                              __html:
                                                item?.cardDetails.firstName,
                                            }}
                                          />
                                          <div
                                            className="font-medium"
                                            dangerouslySetInnerHTML={{
                                              __html:
                                                item?.cardDetails
                                                  .additionalInfo,
                                            }}
                                          />
                                        </div>

                                        <div className="space-y-0.5 text-[10px]">
                                          <div
                                            className="opacity-90"
                                            dangerouslySetInnerHTML={{
                                              __html:
                                                item?.cardDetails.companyName,
                                            }}
                                          />
                                          <div>{item?.cardDetails.phone}</div>
                                          <div>{item?.cardDetails.email}</div>
                                          <div>{item?.cardDetails.website}</div>
                                          <div>
                                            {formatAddress(
                                              item?.cardDetails.address,
                                              item?.cardDetails.city,
                                              item?.cardDetails.state,
                                              item?.cardDetails.zipCode
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-white p-[0.2rem] rounded-lg self-start">
                                        <img
                                          src={
                                            qrCode ||
                                            "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                          }
                                          alt="QR Code"
                                          className="w-16 h-16"
                                        />
                                      </div>
                                    </div>
                                  )
                                ) : null}

                                {item?.selectedCard === "custom" &&
                                item?.cardDetails?.customCardDesignType ===
                                  "image-image" ? (
                                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                    {item?.cardDetails?.backLogo ? (
                                      <img
                                        src={`/api/image-proxy?url=${encodeURIComponent(
                                          item?.cardDetails?.backLogo
                                        )}`}
                                        //src={item?.cardDetails?.backLogo}
                                        alt="Back Card Design"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div
                                        className="w-full h-full border-2 border-dashed flex flex-col items-center justify-center text-center"
                                        style={{
                                          borderColor: "rgba(255,255,255,0.3)",
                                          color:
                                            item?.color === "black"
                                              ? "#FFFFFF"
                                              : colorSchemes[item?.color]?.text,
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
                                    {item?.cardDetails?.showQRCodeOnBack && (
                                      <div
                                        className={`absolute bg-white p-[0.2rem] rounded-lg ${
                                          item?.cardDetails?.qrCodePosition ===
                                          "top-left"
                                            ? "top-6 left-6"
                                            : item?.cardDetails
                                                ?.qrCodePosition === "top-right"
                                            ? "top-6 right-6"
                                            : item?.cardDetails
                                                ?.qrCodePosition ===
                                              "bottom-left"
                                            ? "bottom-6 left-6"
                                            : item?.cardDetails
                                                ?.qrCodePosition ===
                                              "bottom-right"
                                            ? "bottom-6 right-6"
                                            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                        }`}
                                      >
                                        <img
                                          src={
                                            qrCode ||
                                            "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                          }
                                          alt="QR Code"
                                          className="w-16 h-16"
                                        />
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            {isAdmin && (
                              <Button
                                onClick={() =>
                                  handleDownloadBack(index, item.productVariant)
                                }
                                disabled={downloadingBack === index}
                                className="flex items-center gap-2"
                              >
                                {downloadingBack === index ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Downloading...
                                  </>
                                ) : (
                                  "Download Back"
                                )}
                              </Button>
                            )}

                            {/* <Button
                              onClick={async () => {
                                if (frontRefs.current) {
                                  await downloadCardAsImage(
                                    frontRefs.current[index],
                                    "card-front.png"
                                  );
                                }
                                if (backRefs.current) {
                                  await downloadCardAsImage(
                                    backRefs.current[index],
                                    "card-back.png"
                                  );
                                }
                              }}
                            >
                              Download Front + Back
                            </Button> */}
                          </>
                        );
                      }
                      return null;
                    }
                    //   );
                    // }
                    // return null;
                  })}
                </div>
              </div>

              {/* Tap Sticker on Phone Display */}
              <div className="">
                {selectedInvoice?.items?.map((item, index) => {
                  if (item.cardDetails.assignedDigitalCard) {
                    // return item.cardDetails.assignedDigitalCard?.map(
                    //   (ass, assIndex) => {
                    const qrCodes = qrCodesForStickers[index];
                    if (item?.productType == "sticker") {
                      return (
                        <>
                          <div key={`${index}_${index}`}>
                            <div>
                              {/* Bottom Sticker Layout */}
                              <div className="flex flex-col lg:flex-row xl:flex-row gap-6">
                                <div className="justify-start">
                                  <Label className="text-sm font-medium">
                                    Front
                                  </Label>
                                  <div
                                    ref={(el) => {
                                      stickerRefs.current[index] = el;
                                    }}
                                    className="w-[227px] h-[151px] aspect-[3/2]"
                                  >
                                    <div
                                      className="bg-gray-900 rounded-2xl px-3 py-3 shadow-lg flex items-center justify-between h-full w-full gap-3"
                                      style={{
                                        background:
                                          colorSchemes[
                                            item?.cardDetails.tapStickerColor
                                          ]?.bg || colorSchemes.black.bg,
                                        color:
                                          colorSchemes[item?.color]?.text ||
                                          colorSchemes.black.text,
                                      }}
                                    >
                                      {/* Left side - Logo or Text */}
                                      <div className="flex h-full w-full gap-3 justify-center">
                                        <div className="flex-[7] flex items-center justify-center">
                                          {item?.cardDetails.useLogoImage &&
                                          item?.cardDetails.tapStickerLogo ? (
                                            <img
                                              src={`/api/image-proxy?url=${encodeURIComponent(
                                                item?.cardDetails.tapStickerLogo
                                              )}`}
                                              //src={item?.cardDetails.tapStickerLogo}
                                              alt="Logo"
                                              className="object-contain opacity-80 rounded-lg w-[200px] h-[140px]"
                                            />
                                          ) : // ) : item?.cardDetails.useLogoImage &&
                                          //   !item?.cardDetails.tapStickerLogo ? (
                                          //   <>
                                          //     <span className="text-[10px] font-bold text-gray-400 text-center text-lg font-semibold mt-6">
                                          //       SOLO
                                          //     </span>
                                          //   </>
                                          !item?.cardDetails.useLogoImage ? (
                                            <span className="text-[10px] font-bold text-gray-400 text-center text-lg font-semibold w-full">
                                              {item?.cardDetails
                                                .tapStickerText || "SOLO"}
                                            </span>
                                          ) : null}
                                        </div>

                                        {/* Right side - Solo + QR Code */}
                                        <div className="flex flex-col items-center gap-3 justify-center">
                                          {item?.cardDetails.useLogoImage &&
                                            !item?.cardDetails
                                              .tapStickerLogo && (
                                              <span className="text-gray-400 text-sm font-medium tracking-wide">
                                                Solo
                                              </span>
                                            )}
                                          <div className="bg-white p-[0.2rem] rounded-lg">
                                            <img
                                              src={
                                                qrCodes ||
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
                                {/* Sticker Back – Professional Adhesive */}
                                <div className="gap-6" id="essential-card">
                                  <Label className="text-sm font-medium">
                                    Back
                                  </Label>

                                  <div className="w-[227px] h-[151px] rounded-2xl shadow-sm overflow-hidden bg-[#e7c9a3]">
                                    <div
                                      className="w-full h-full rounded-2xl flex items-center justify-center"
                                      style={{
                                        backgroundImage: `repeating-linear-gradient(-25deg,rgba(0, 128, 0, 0.18) 0px,rgba(0, 128, 0, 0.18) 1px,transparent 1px,transparent 44px)`,
                                      }}
                                    >
                                      <div className="w-full h-full grid grid-cols-3 gap-y-6 place-items-center rotate-[-20deg]">
                                        {Array.from({ length: 9 }).map(
                                          (_, i) => (
                                            <span
                                              key={i}
                                              className="text-green-700 text-[11px] font-semibold tracking-widest opacity-45 select-none"
                                            >
                                              ADHESIVE
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div key={index} className="relative hidden">
                                {/* Phone Rear View */}
                                <div className="relative bg-gray-800 rounded-3xl p-2 w-72 h-[580px] shadow-2xl">
                                  {/* Phone Back Body */}
                                  <div className="relative w-full h-full bg-gray-700 rounded-2xl overflow-hidden">
                                    {/* Camera Module */}
                                    <div className="absolute top-4 left-4">
                                      <div className="bg-gray-900 rounded-2xl p-2 w-16 h-20">
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
                                  key={index}
                                  src={
                                    qrCodesForStickers[index]
                                      ? qrCodesForStickers[index]
                                      : "/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png"
                                  }
                                  alt="QR Code"
                                  className="w-20 h-20"
                                /> */}

                                    {/* Condition fixed */}
                                    {/* {!item?.cardDetails.useLogoImage &&
                                  item?.cardDetails.tapStickerText && (
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded px-1.5 py-0.5">
                                      <span className="text-[10px] font-bold text-gray-800">
                                        {item?.cardDetails.tapStickerText}
                                      </span>
                                    </div>
                                  )} */}

                                    {/* Bottom Sticker Layout */}
                                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[85%]">
                                      <div className="bg-gray-900 rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between">
                                        {/* Left side - Logo or Text */}
                                        <div className="w-14 h-14 flex items-center justify-center">
                                          {item?.cardDetails.useLogoImage &&
                                          item?.cardDetails.tapStickerLogo ? (
                                            <img
                                              src={
                                                item?.cardDetails.tapStickerLogo
                                              }
                                              alt="Logo"
                                              className="max-w-full max-h-full object-contain opacity-80 rounded-lg"
                                            />
                                          ) : // ) : item?.cardDetails.useLogoImage &&
                                          //   !item?.cardDetails.tapStickerLogo ? (
                                          //   <>
                                          //     <span className="text-[10px] font-bold text-gray-400 text-center text-lg font-semibold mt-6">
                                          //       SOLO
                                          //     </span>
                                          //   </>
                                          !item?.cardDetails.useLogoImage ? (
                                            <span className="text-[10px] font-bold text-gray-400 text-center text-lg font-semibold w-full">
                                              {item?.cardDetails
                                                .tapStickerText || "SOLO"}
                                            </span>
                                          ) : null}
                                        </div>

                                        {/* Right side - Solo + QR Code */}
                                        <div className="flex flex-col items-center gap-1">
                                          {item?.cardDetails.useLogoImage &&
                                            !item?.cardDetails
                                              .tapStickerLogo && (
                                              <span className="text-gray-400 text-sm font-medium tracking-wide">
                                                Solo
                                              </span>
                                            )}
                                          <div className="bg-gray-700 rounded-lg p-1.5">
                                            <img
                                              src={
                                                qrCodesForStickers[index] ||
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
                          {isAdmin && (
                            <Button
                              className="mt-3"
                              onClick={() => {
                                const el = stickerRefs.current[index];
                                if (el) {
                                  downloadMobileCardAsImage(
                                    el,
                                    `tap-sticker-${user?.displayName}-color.png`
                                  );
                                  downloadMobileCardTransperentAsImage(
                                    el,
                                    `tap-sticker-${user?.displayName}-transperent.png`
                                  );
                                }
                              }}
                            >
                              Download Sticker
                            </Button>
                          )}
                        </>
                      );
                    }
                  }
                  //   );
                  // }
                  return null;
                })}
              </div>

              <Separator />

              {/* Invoice Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Invoice Number
                  </p>
                  <p className="text-xl font-bold">
                    {selectedInvoice.invoiceNumber}
                  </p>
                </div>
                <Badge
                  className={getStatusColor(selectedInvoice.status)}
                  variant="outline"
                >
                  {selectedInvoice.status.charAt(0).toUpperCase() +
                    selectedInvoice.status.slice(1)}
                </Badge>
              </div>

              <Separator />

              {/* Customer Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <p>
                    <strong>Name:</strong> {selectedInvoice.customerInfo.name}
                  </p>
                  {selectedInvoice.customerInfo.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{selectedInvoice.customerInfo.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedInvoice.customerInfo.email}</span>
                  </div>
                  {selectedInvoice.customerInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedInvoice.customerInfo.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="font-semibold">Order Items</h3>
                <div className="space-y-2">
                  {selectedInvoice.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{item.productVariant}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {item.productType}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ${item.subtotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <p>Quantity: {item.quantity}</p>
                        <p>Base Price: ${item.basePrice.toFixed(2)}</p>
                        {item.discountApplied > 0 && (
                          <p className="text-green-600">
                            Discount: {item.discountApplied.toFixed(1)}%
                          </p>
                        )}
                        {Object.values(item.addOnFees).some(
                          (fee) => fee && fee > 0
                        ) && (
                          <p>
                            Add-ons: $
                            {Object.values(item.addOnFees)
                              .reduce((sum, fee) => sum + (fee || 0), 0)
                              .toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold">Order Summary</h3>
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${selectedInvoice.totals.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.totals.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>
                        -${selectedInvoice.totals.discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selectedInvoice.totals.addOnFees > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Add-on Fees</span>
                      <span>
                        ${selectedInvoice.totals.addOnFees.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${selectedInvoice.totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="flex items-center justify-between bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Payment Method</span>
                </div>
                <span>
                  {getPaymentMethodLabel(selectedInvoice.paymentMethod)}
                </span>
              </div>

              <div className="flex items-center justify-between bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Order Date</span>
                </div>
                <span>{format(new Date(selectedInvoice.date), "PPP")}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showProcessingModal}
        onOpenChange={setShowProcessingModal}
      >
        <AlertDialogContent className="max-h-[80vh] w-[calc(100%-2rem)] sm:w-full max-w-lg flex flex-col">
          {/* Header */}
          <AlertDialogHeader>
            <AlertDialogTitle>Assign NFC Card</AlertDialogTitle>
          </AlertDialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loadingModalData ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {assignments.map((row, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-4 bg-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-700">
                      Card {index + 1}
                    </p>

                    {/* NFC Card */}
                    <div className="space-y-2">
                      <Label>NFC Card</Label>
                      <Select
                        value={row.nfcCardId}
                        onValueChange={(val) =>
                          updateAssignment(index, "nfcCardId", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select NFC Card" />
                        </SelectTrigger>
                        <SelectContent>
                          {nfcCards.map((card) => (
                            <SelectItem
                              key={card.id}
                              value={card.card_id}
                              disabled={assignments.some(
                                (a, i) =>
                                  i !== index && a.nfcCardId === card.card_id
                              )}
                            >
                              {card.card_number} | {card.card_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Order Item */}
                    <div className="space-y-2">
                      <Label>Order Item ID</Label>
                      <Input
                        value={row.orderItemId}
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer (Fixed) */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              disabled={isConfirmDisabled || isConfirming}
              onClick={handleConfirmProcessing}
              className="flex items-center gap-2"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm & Update"
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
