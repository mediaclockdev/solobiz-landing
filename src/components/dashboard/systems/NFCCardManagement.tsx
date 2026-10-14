"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import html2canvas from "html2canvas";
import { generateQRCodeWithLogo } from "@/utils/qrCodeGenerator";
import { Separator } from "@/components/ui/separator";
import { OrderStatusTimeline } from "@/components/dashboard/OrderStatusTimeline";
import { toast } from "sonner";
import {
  downloadInvoicePDF,
  printInvoicePDF,
} from "@/utils/pdfInvoiceGenerator";
import {
  loadInvoices,
  AccessoryInvoice,
  updateOrderTracking,
  TrackingStage,
  AssignmentRow,
} from "@/utils/invoiceGenerator";
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
  Pencil,
  Trash,
  Plus,
  X,
  Search,
  Loader2,
  Eye,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  getDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { colorSchemes } from "@/utils/cardFilters";
import { User } from "firebase/auth";

const RECORDS_PER_PAGE = 5;

export default function NFCCardManagement() {
  const [selectedInvoice, setSelectedInvoice] =
    useState<AccessoryInvoice | null>(null);
  const [orderStatus, setOrderStatus] = useState<TrackingStage | "">("");
  const [loadingModalData, setLoadingModalData] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [qrCodesForStickers, setQrCodesForStickers] = useState([]);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [newCardId, setNewCardId] = useState("");
  const [newBatchId, setNewBatchId] = useState("");

  const [csvLoading, setCsvLoading] = useState(false);
  const [isCSVOpen, setIsCSVOpen] = useState(false);
  const [isLoading, setIsLoding] = useState(false);

  const [isCSVLoading, setIsCSVLoding] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [userEmailMap, setUserEmailMap] = useState<Record<string, string>>({});

  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [editData, setEditData] = useState<any>({
    status: "disabled",
    card_url: "",
    userId: "",
    nfc_uid: "",
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [downloadingBack, setDownloadingBack] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [nfcCards, setNfcCards] = useState<any[]>([]);

  const [setuserId, setOrderUserID] = useState("");
  const [user, setUser] = useState<User>(null);
  const [orderItemIds, setOrderItemIds] = useState<string[]>([]);
  const { showToast } = useToast();

  const frontRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stickerRefs = useRef<(HTMLDivElement | null)[]>([]);
  type SortKey =
    | "card_id"
    | "nfc_uid"
    | "status"
    | "view_count"
    | "userId"
    | "created_at"
    | "activated_at";

  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ---------------- FETCH ----------------
  const fetchCards = async () => {
    // Fetch NFC cards
    const cardsQuery = query(
      collection(db, "nfc_cards"),
      orderBy("created_at", "desc")
    );
    const cardSnap = await getDocs(cardsQuery);
    const cardsData = cardSnap.docs.map((d) => d.data());

    // Fetch users
    const usersSnap = await getDocs(collection(db, "users"));
    const emailReminder: Record<string, string> = {};

    usersSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data?.email) {
        emailReminder[doc.id] = data.email;
      }
    });
    const ordersCollection = collection(db, "orders");
    const ordersQuery = query(ordersCollection); // Non-admin: fetch only their orders

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

    const updatedCardsData = cardsData.map((nfc) => {
      let matchedItem = null;
      let trackingInfo = null;
      let invoiceDetails = null;
      let orderUserId = null;

      sortedInvoices.forEach((invoice) => {
        (invoice.accessory_invoices ?? []).forEach((accInvoice) => {
          const foundItem = (accInvoice.items ?? []).find((item) =>
            Array.isArray(item.orderItemId)
              ? item.orderItemId.includes(nfc.orderItemId)
              : item.orderItemId === nfc.orderItemId
          );

          if (foundItem) {
            matchedItem = foundItem;
            trackingInfo =
              accInvoice.tracking[accInvoice?.tracking?.length - 1] ?? null;
            invoiceDetails = accInvoice;
            orderUserId = invoice.userId;
          }
        });
      });

      return {
        ...nfc,
        itemInfo: matchedItem,
        tracking: trackingInfo,
        invoice: invoiceDetails,
        orderUserId: orderUserId,
      };
    });

    setUserEmailMap(emailReminder);
    setCards(updatedCardsData);
  };

  useEffect(() => {
    fetchCards();
  }, []);
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
  const handleConfirmProcessing = async () => {
    if (isConfirming) return;

    try {
      setIsConfirming(true);
      const batch = writeBatch(db);

      assignments.forEach((a) => {
        const nfcRef = doc(db, "nfc_cards", a.nfcCardId);
        batch.update(nfcRef, {
          orderItemId: a.orderItemId,
          invoiceNumber: selectedInvoice.invoiceNumber,
          userId: setuserId,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      await handleUpdateTracking(selectedInvoice.invoiceNumber, "processing");

      setShowProcessingModal(false);
    } catch (err) {
      console.error("Processing failed", err);
    } finally {
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    if (!showProcessingModal || !selectedInvoice) return;

    const loadData = async () => {
      setLoadingModalData(true);

      try {
        /** 🔹 NFC Cards (unclaimed only) */
        const nfcQuery = query(
          collection(db, "nfc_cards"),
          where("status", "==", "unclaimed"),
          where("userId", "==", null)
        );
        const nfcSnap = await getDocs(nfcQuery);
        setNfcCards(
          nfcSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );

        const ids =
          selectedInvoice?.items?.flatMap(
            (item: any) => item.orderItemId || []
          ) || [];

        console.log("ids", ids);
        setOrderItemIds(ids);
      } catch (err) {
        console.error("Failed to load processing data", err);
      } finally {
        setLoadingModalData(false);
      }
    };

    loadData();
  }, [showProcessingModal, selectedInvoice]);
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

  const isConfirmDisabled =
    assignments.length === 0 || assignments.some((a) => !a.nfcCardId);

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
    const TARGET_WIDTH = 343;
    const TARGET_HEIGHT = 215;

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
    const TARGET_WIDTH = 343;
    const TARGET_HEIGHT = 215;

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
  // ---------------- ADD CARD ----------------
  const handleAdd = async () => {
    const trimmedId = newCardId.trim();
    const trimmedBatchId = newBatchId.trim();

    if (!trimmedId) {
      showToast("Card ID is required", "error");
      return;
    }

    try {
      const cardRef = doc(db, "nfc_cards", trimmedId);
      const existingSnap = await getDoc(cardRef);

      // Card already exists
      if (existingSnap.exists()) {
        showToast("This NFC Card ID already exists.", "error");
        return;
      }

      // Safe to create
      await setDoc(cardRef, {
        card_id: trimmedId,
        card_number: trimmedBatchId || null,
        status: "unclaimed",
        business_card_url: "",
        userId: null,
        created_at: serverTimestamp(),
        nfc_uid: "",
        card_url: `${process.env.NEXT_PUBLIC_API_LIVE_URL}c/${trimmedId}`,
      });

      showToast("NFC Card added successfully", "success");
      setNewCardId("");
      fetchCards();
    } catch (error) {
      console.error(error);
      showToast("Failed to add NFC card", "error");
    }
  };

  // ---------------- EDIT ----------------
  const handleEdit = (card: any) => {
    setSelectedCard(card);
    setEditData({
      status: card.status,
      card_url: card.card_url,
      userId: card.userId ?? "",
      nfc_uid: card.nfc_uid || "",
    });
    setOrderStatus(card?.tracking?.stage || "");
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "nfc_cards", selectedCard.card_id), {
        ...editData,
        userId: editData.userId || null,
      });

      // Update order tracking IF changed
      if (
        orderStatus &&
        selectedCard?.invoice?.invoiceNumber &&
        selectedCard?.tracking?.stage !== orderStatus
      ) {
        await handleUpdateTracking(
          selectedCard.invoice.invoiceNumber,
          orderStatus
        );
      }

      showToast("NFC Card updated", "success");
      setIsEditOpen(false);
      fetchCards();
    } catch {
      showToast("Update failed", "error");
    }
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (card_id: string) => {
    if (!confirm("Are you sure you want to delete this NFC card?")) return;

    try {
      await deleteDoc(doc(db, "nfc_cards", card_id));
      showToast("NFC Card deleted", "success");
      fetchCards();
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const handleCSVImport = async (file: File) => {
    if (!file) return;

    setCsvLoading(true);

    try {
      const text = await file.text();
      const rows = text
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      // Remove header
      rows.shift();

      let added = 0;
      let updated = 0;
      let skipped = 0;
      const clean = (value?: string) => value?.trim().replace(/^"(.*)"$/, "$1");
      for (const row of rows) {
        const [card_number, card_id, full_url, nfc_uid] = row
          .split(",")
          .map(clean);

        if (!card_number || !card_id || !full_url) {
          skipped++;
          continue;
        }

        const cardRef = doc(db, "nfc_cards", card_id);
        const existing = await getDoc(cardRef);

        /** -------------------------
         * 1 Card does NOT exist → create
         * ------------------------- */
        if (!existing.exists()) {
          await setDoc(cardRef, {
            card_number,
            card_id,
            card_url: full_url,
            status: "unclaimed",
            nfc_uid: nfc_uid || null,
            business_card_url: "",
            userId: null,
            created_at: serverTimestamp(),
          });

          added++;
          continue;
        }

        /** -------------------------
         * 2 Card exists + nfc_sid provided → update only nfc_sid
         * ------------------------- */
        if (existing.exists() && nfc_uid) {
          await setDoc(
            cardRef,
            {
              nfc_uid,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          updated++;
          continue;
        }

        /** -------------------------
         * 3️ Exists but nothing to update
         * ------------------------- */
        skipped++;
      }

      showToast(
        `CSV Import completed. Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`,
        "success"
      );
      setIsCSVLoding(false);
      fetchCards();
    } catch (err) {
      console.error(err);
      showToast("CSV import failed", "error");
    } finally {
      setCsvLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // ---------------- FILTER + PAGINATION ----------------
  // const filtered = cards.filter((c) =>
  //   c.cardId.toLowerCase().includes(search.toLowerCase())
  // );

  const filtered = cards.filter((c) =>
    c.card_id.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";

    // Firestore Timestamp support
    if (aVal?.toDate && bVal?.toDate) {
      return sortOrder === "asc"
        ? aVal.toDate() - bVal.toDate()
        : bVal.toDate() - aVal.toDate();
    }

    // Number sorting
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }

    // String sorting
    return sortOrder === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const totalPages = Math.ceil(sorted.length / RECORDS_PER_PAGE);
  const start = (currentPage - 1) * RECORDS_PER_PAGE;
  const currentCards = sorted.slice(start, start + RECORDS_PER_PAGE);

  const formatDate = (d: any) =>
    d?.toDate ? d.toDate().toLocaleString() : "-";

  const statusCounts = cards.reduce(
    (acc, card) => {
      acc.total += 1;

      if (card.status === "active") acc.active += 1;
      else if (card.status === "disabled") acc.disabled += 1;
      else if (card.status === "unclaimed") acc.unclaimed += 1;

      return acc;
    },
    { total: 0, active: 0, disabled: 0, unclaimed: 0 }
  );

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <span className="ml-1">↕</span>;
    return <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  const handleViewDetails = async (
    invoice: AccessoryInvoice,
    orderUserId: string
  ) => {
    setSelectedInvoice(invoice);
    setOrderUserID(orderUserId);
    if (!orderUserId) {
      showToast("NFC Card is not active for any user.", "error");
      return;
    }
    const userRef = doc(db, "users", orderUserId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      setUser(userData as User);
    }
    (invoice.accessory_invoices ?? []).forEach((accInvoice) => {
      const foundItem = (accInvoice.items ?? []).find((item) =>
        Array.isArray(item.orderItemId) ? item.orderItemId : item.orderItemId
      );

      if (foundItem) {
        setOrderItemIds(foundItem.orderItemId);
      }
    });

    setIsDetailsOpen(true);
    console.log("invoice", invoice);
  };
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

      const userQuery = doc(db, "users", setuserId);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-lg font-semibold">
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-lg leading-none">
              NFC Cards [{statusCounts.total}]
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-sm">
              <Badge variant="secondary">Active ({statusCounts.active})</Badge>

              <Badge variant="outline">
                Disabled ({statusCounts.disabled})
              </Badge>

              <Badge variant="destructive">
                Unclaimed ({statusCounts.unclaimed})
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsAddOpen(true)} className="flex-1 sm:flex-initial">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>

          <Button
            onClick={() => {
              setIsLoding(true);
              setTimeout(() => {
                setIsLoding(false);
                setIsCSVOpen(true);
              }, 300);
            }}
            className="flex-1 sm:flex-initial"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import CSV"
            )}
          </Button>

          <div className="relative flex-1 w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10 w-full"
              placeholder="Search Card ID"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="p-4 overflow-x-auto">
        {isCSVLoading ? (
          <div className="flex justify-center py-4">
            {" "}
            <div className="flex justify-center items-center py-6">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : currentCards.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-sm font-medium">No cards found</p>
          </div>
        ) : (
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2 text-left">List #</th>
                <th className="border p-2 text-left">Batch #</th>
                <th
                  className="border p-2 text-left"
                  onClick={() => handleSort("card_id")}
                >
                  Card ID <SortIcon column="card_id" />
                </th>
                <th
                  className="border p-2 text-left"
                  onClick={() => handleSort("nfc_uid")}
                >
                  NFC UID <SortIcon column="nfc_uid" />
                </th>
                <th
                  className="border p-2 text-center"
                  onClick={() => handleSort("status")}
                >
                  Status <SortIcon column="status" />
                </th>
                <th
                  className="border p-2 text-center"
                  onClick={() => handleSort("view_count")}
                >
                  View Count <SortIcon column="view_count" />
                </th>
                {/* <th className="border p-2">User ID</th> */}
                {/* <th className="border p-2">Email</th> */}
                <th className="border p-2">Card URL</th>
                <th className="border p-2">Order</th>
                {/* <th className="border p-2">Last Tap</th> */}

                <th
                  className="border p-2"
                  onClick={() => handleSort("activated_at")}
                >
                  Activated At <SortIcon column="activated_at" />
                </th>
                <th
                  className="border p-2"
                  onClick={() => handleSort("created_at")}
                >
                  Created At <SortIcon column="created_at" />
                </th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCards.map((card, index) => (
                <tr key={card.card_id} className="hover:bg-gray-50">
                  <td className="border p-2 font-mono">
                    {(currentPage - 1) * RECORDS_PER_PAGE + index + 1}
                  </td>
                  <td className="border p-2 font-mono">{card.card_number}</td>
                  <td className="border p-2 font-mono">{card.card_id}</td>
                  <td className="border p-2 font-mono">
                    {card.nfc_uid ? card.nfc_uid ?? "-" : "-"}
                  </td>
                  <td className="border p-2 text-center capitalize">
                    <Badge
                      variant={
                        card.status === "active"
                          ? "secondary"
                          : card.status === "blocked"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {card.status}
                    </Badge>
                  </td>
                  <td className="border p-2 font-mono">
                    {card?.view_count ? card?.view_count ?? "-" : "-"}
                  </td>
                  {/* <td className="border p-2">{card.userId ?? "-"}</td> */}
                  {/* <td className="border p-2">
                    {card?.userId ? userEmailMap[card?.userId] ?? "-" : "-"}
                  </td> */}
                  <td className="border p-2 truncate max-w-xs">
                    {card?.card_url ? (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={card.card_url}
                        className="text-blue-600 hover:underline"
                      >
                        View Card
                      </a>
                    ) : (
                      <span className="text-gray-400">No Card</span>
                    )}
                  </td>
                  <td className="border p-2 truncate max-w-xs capitalize">
                    {card?.tracking?.stage ?? ""}
                    {card?.tracking?.stage ? "/" : "-"}
                    {card?.tracking?.timestamp
                      ? format(
                          new Date(card?.tracking?.timestamp),
                          "MMM dd, HH:mm"
                        )
                      : ""}
                  </td>
                  {/* <td className="border p-2">
                    {formatDate(card.lastTappedAt)}
                  </td> */}
                  <td className="border p-2">
                    {formatDate(card.activated_at)}
                  </td>
                  <td className="border p-2">{formatDate(card.created_at)}</td>

                  <td className="border p-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleViewDetails(card?.invoice, card?.orderUserId)
                        }
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(card)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(card.card_id)}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === i + 1}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(i + 1);
                  }}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Edit Modal */}
      <AlertDialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <AlertDialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
          <AlertDialogCancel className="absolute right-4 top-4">
            <X />
          </AlertDialogCancel>

          <AlertDialogHeader>
            <AlertDialogTitle>Edit NFC Card</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <Label>NFC UID</Label>
              <Input
                className="mt-2"
                value={editData.nfc_uid}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    nfc_uid: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={editData.status}
                onValueChange={(v) => setEditData({ ...editData, status: v })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="unclaimed">Unclaimed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* 
            <div>
              <Label>User ID</Label>
              <Input
                className="mt-2"
                value={editData.userId}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    userId: e.target.value,
                  })
                }
              />
            </div> */}
            <div>
              <Label>Order Status</Label>
              <Select
                value={orderStatus}
                onValueChange={(val) => setOrderStatus(val as TrackingStage)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select Order Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placed">Placed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Card URL</Label>
              <Input
                className="mt-2"
                value={editData.card_url}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    card_url: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save</Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Import Modal */}
      <AlertDialog open={isCSVOpen} onOpenChange={setIsCSVOpen}>
        <AlertDialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
          <AlertDialogCancel className="absolute right-4 top-4">
            <X />
          </AlertDialogCancel>

          <AlertDialogHeader>
            <AlertDialogTitle>Import NFC Cards (CSV)</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Upload CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                className="mt-2"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setIsCSVLoding(true);
                    handleCSVImport(file);
                    setIsCSVOpen(false);
                  }
                  e.target.value = "";
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                CSV must contain: <b>card_id,status,nfc_uid</b>
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCSVOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add NFC Card Modal */}
      <AlertDialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <AlertDialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
          <AlertDialogCancel className="absolute right-4 top-4">
            <X />
          </AlertDialogCancel>

          <AlertDialogHeader>
            <AlertDialogTitle>Add NFC Card</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Card ID</Label>
              <Input
                className="mt-2"
                placeholder="NFC-000123"
                value={newCardId}
                onChange={(e) => setNewCardId(e.target.value)}
              />
            </div>

            <div>
              <Label>Batch ID</Label>
              <Input
                className="mt-2"
                placeholder="1"
                value={newBatchId}
                onChange={(e) => setNewBatchId(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await handleAdd();
                  setIsAddOpen(false);
                }}
              >
                Add Card
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TruckIcon className="h-4 w-4" />
                    Order Tracking
                  </h3>

                  {selectedInvoice.status !== "cancelled" &&
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
                        className="w-full sm:w-auto justify-center"
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
                    isAdmin={true}
                    tracking={selectedInvoice.tracking}
                    currentStatus={selectedInvoice.status}
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
                        <div key={`${itemIndex}`}>
                          {/* <Label className="text-sm font-medium">Front</Label> */}
                          <div
                            style={{
                              borderRadius: "12px",
                            }}
                            ref={(el) => {
                              frontRefs.current[itemIndex] = el;
                            }}
                          >
                            <div
                              className="rounded-2xl p-0 aspect-[1.6/1] flex items-center justify-center shadow-xl"
                              style={{
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
                              {item?.selectedCard === "infinite" && (
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
                                        __html:
                                          item?.cardDetails.additionalInfo,
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
                        </div>

                        <Button
                          onClick={() =>
                            handleDownloadFront(itemIndex, item.productVariant)
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
                            <div key={`${index}`}>
                              {/* <Label className="text-sm font-medium">
                                      Back
                                    </Label> */}
                              <div
                                style={{
                                  borderRadius: "12px",
                                }}
                                ref={(el) => {
                                  backRefs.current[index] = el;
                                }}
                              >
                                <div
                                  key={index}
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

                                  {item?.selectedCard === "infinite" && (
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
                                            <div>
                                              {item?.cardDetails.website}
                                            </div>
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
                                      {item?.cardDetails?.showQRCodeOnBack && (
                                        <div
                                          className={`absolute bg-white p-[0.2rem] rounded-lg ${
                                            item?.cardDetails
                                              ?.qrCodePosition === "top-left"
                                              ? "top-6 left-6"
                                              : item?.cardDetails
                                                  ?.qrCodePosition ===
                                                "top-right"
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
                            </div>

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
                              <div
                                ref={(el) => {
                                  stickerRefs.current[index] = el;
                                }}
                                className="w-auto md:w-auto lg:w-[40%] xl:w-[40%] mb-6"
                              >
                                <div
                                  className="bg-gray-900 rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between h-[200px]"
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
                                  <div className="flex items-center justify-center">
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
                                        {item?.cardDetails.tapStickerText ||
                                          "SOLO"}
                                      </span>
                                    ) : null}
                                  </div>

                                  {/* Right side - Solo + QR Code */}
                                  <div className="flex flex-col items-center gap-3">
                                    {item?.cardDetails.useLogoImage &&
                                      !item?.cardDetails.tapStickerLogo && (
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
                                        className="w-20 h-20 opacity-80"
                                      />
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
                          <Button
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
                  {selectedInvoice.customerInfo.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{selectedInvoice.customerInfo.address}</span>
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
                              {card.card_id}
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
