"use client";

import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";

export interface AccessoryInvoiceItem {
  productType: "card" | "sticker";
  selectedCard: string;
  assignedDigitalCard?: string;
  color?: string;
  productVariant: string;
  quantity: number;
  basePrice: number;
  discountApplied: number;
  addOnFees: {
    logoRemoval?: number;
    customLogo?: number;
  };
  subtotal: number;
  showLogoMobileOnBack?:any;
  cardDetails?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    additionalInfo?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    logo?: any;
    logoText?: string;
    useLogoImage?: boolean;
    assignedDigitalCard?: any;
    optionalText: any;
    personalizeLogo?:any;
    customLogo?:any;
    frontLogo?: any;
    backLogo?: any;
    customCardDesignType?: any;
    showQRCodeOnBack?:any;
    qrCodePosition?:any;
    hideTextOnBack?:any;
    tapStickerLogo?:any;
    tapStickerText?:any;
    tapStickerColor?:any;
    cardType?:any;
  };
  orderItemId?:any;
}

export type OrderStatus = "pending" | "paid" | "cancelled";
export type TrackingStage = "placed" | "processing" | "shipped" | "delivered";

export interface TrackingInfo {
  stage: TrackingStage;
  timestamp: string;
  description?: string;
}

export  type AssignmentRow = {
    nfcCardId: string;
    orderItemId: string;
  };
export interface AccessoryInvoice {
  selectedColor:
    | "black"
    | "red"
    | "pink"
    | "yellow"
    | "gray"
    | "green"
    | "blue"
    | "purple"
    | "white";
  invoiceNumber: string;
  rawOrder?:any;
  date: string;
  color?: string;
  selectedCard?: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  nfc_card?:any;
  items: AccessoryInvoiceItem[];
  totals: {
    subtotal: number;
    discount: number;
    addOnFees: number;
    total: number;
  };
  accessory_invoices?:any[];
  status: OrderStatus;
  paymentMethod?: string;
  tracking?: TrackingInfo[];
}

const INVOICE_STORAGE_KEY = "accessory_invoices";
const INVOICE_COUNTER_KEY = "accessory_invoice_counter";

export function generateInvoiceNumber(): string {
  try {
    const counter =
      parseInt(localStorage.getItem(INVOICE_COUNTER_KEY) || "0") + 1;
    localStorage.setItem(INVOICE_COUNTER_KEY, counter.toString());

    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");

    return `ACC-${year}${month}-${counter.toString().padStart(4, "0")}-${random}`;
  } catch (error) {
    return `ACC-${Date.now()}`;
  }
}

export function createInvoice(
  items: AccessoryInvoiceItem[],
  customerInfo: AccessoryInvoice["customerInfo"]
): AccessoryInvoice {
  const subtotal = items.reduce(
    (sum, item) => sum + item.basePrice * item.quantity,
    0
  );
  const discount = items.reduce(
    (sum, item) =>
      sum + (item.basePrice * item.quantity * item.discountApplied) / 100,
    0
  );
  const addOnFees = items.reduce((sum, item) => {
    const fees = Object.values(item.addOnFees).reduce(
      (feeSum, fee) => feeSum + (fee || 0),
      0
    );
    return sum + fees;
  }, 0);
  const total = subtotal - discount + addOnFees;

  const invoice: AccessoryInvoice = {
    invoiceNumber: generateInvoiceNumber(),
    date: new Date().toISOString(),
    customerInfo,
    items,
    totals: {
      subtotal,
      discount,
      addOnFees,
      total,
    },
    status: "pending",
    tracking: [
      {
        stage: "placed",
        timestamp: new Date().toISOString(),
        description: "Order has been placed successfully",
      },
    ],
    selectedColor: "black",
  };

  saveInvoice(invoice);
  return invoice;
}

export function saveInvoice(invoice: AccessoryInvoice): void {
  try {
    const invoices = loadInvoices();
    invoices.push(invoice);
    localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
  } catch (error) {
    console.error("Failed to save invoice:", error);
    throw error;
  }
}

export function loadInvoices(): AccessoryInvoice[] {
  try {
    const stored = localStorage.getItem(INVOICE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load invoices:", error);
  }
  return [];
}

export function getInvoiceById(invoiceNumber: string): AccessoryInvoice | null {
  const invoices = loadInvoices();
  return invoices.find((inv) => inv.invoiceNumber === invoiceNumber) || null;
}

export function updateInvoiceStatus(
  invoiceNumber: string,
  status: OrderStatus,
  paymentMethod?: string
): void {
  try {
    const invoices = loadInvoices();
    const index = invoices.findIndex(
      (inv) => inv.invoiceNumber === invoiceNumber
    );

    if (index !== -1) {
      invoices[index].status = status;
      if (paymentMethod) {
        invoices[index].paymentMethod = paymentMethod;
      }
      localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
    }
  } catch (error) {
    console.error("Failed to update invoice status:", error);
    throw error;
  }
}

// export function updateOrderTracking(
//   invoiceNumber: string,
//   stage: TrackingStage,
//   description?: string
// ): void {
//   try {
//     const invoices = loadInvoices();
//     const index = invoices.findIndex(inv => inv.invoiceNumber === invoiceNumber);

//     if (index !== -1) {
//       const tracking = invoices[index].tracking || [];

//       // Check if this stage already exists
//       const existingStageIndex = tracking.findIndex(t => t.stage === stage);

//       if (existingStageIndex === -1) {
//         // Add new tracking stage
//         tracking.push({
//           stage,
//           timestamp: new Date().toISOString(),
//           description
//         });
//         invoices[index].tracking = tracking;
//         localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
//       }
//     }
//   } catch (error) {
//     console.error('Failed to update order tracking:', error);
//     throw error;
//   }
// }

export const updateOrderTracking = async (
  invoiceNumber: string,
  stage: TrackingStage,
  description: string
) => {
  try {
    const ordersRef = collection(db, "orders");
    const snap = await getDocs(ordersRef);

    let targetDoc = null;
    let targetData = null;

    // Find document that has this invoiceNumber
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const found = data.accessory_invoices?.find(
        (inv: any) => inv.invoiceNumber === invoiceNumber
      );
      if (found) {
        targetDoc = docSnap.id;
        targetData = data;
      }
    });

    if (!targetDoc) {
      console.error("Invoice not found");
      return;
    }

    // Update accessory invoice tracking
    const updatedInvoices = targetData.accessory_invoices.map((inv: any) => {
      if (inv.invoiceNumber !== invoiceNumber) return inv;

      const tracking = inv.tracking || [];
      const exists = tracking.find((t: any) => t.stage === stage);

      if (!exists) {
        tracking.push({
          stage,
          timestamp: new Date().toISOString(),
          description,
        });
      }

      return {
        ...inv,
        tracking,
      };
    });

    await updateDoc(doc(db, "orders", targetDoc), {
      accessory_invoices: updatedInvoices,
    });

    return true;
  } catch (error) {
    console.error("Tracking update failed:", error);
    throw error;
  }
};

export function deleteInvoice(invoiceNumber: string): void {
  try {
    const invoices = loadInvoices();
    const filtered = invoices.filter(
      (inv) => inv.invoiceNumber !== invoiceNumber
    );
    localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    throw error;
  }
}
