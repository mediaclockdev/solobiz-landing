"use client";
//@ts-ignore
import jsPDF from "jspdf";
import { AccessoryInvoice } from "./invoiceGenerator";
import { format } from "date-fns";

//@ts-ignore
export const generateInvoicePDF = (invoice: AccessoryInvoice): jsPDF => {
  //@ts-ignore
  const doc = new jsPDF();

  // Set font
  doc.setFont("helvetica");

  // Header
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.text("INVOICE", 105, 20, { align: "center" });

  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 35);
  doc.text(`Date: ${format(new Date(invoice.date), "MMM dd, yyyy")}`, 20, 42);
  doc.text(`Status: ${invoice?.status?.toUpperCase()}`, 20, 49);

  // Customer Information
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Bill To:", 20, 65);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(invoice.customerInfo.name, 20, 72);
  doc.text(invoice.customerInfo.email, 20, 79);
  if (invoice.customerInfo.phone) {
    doc.text(invoice.customerInfo.phone, 20, 86);
  }
  if (invoice.customerInfo.address) {
    const addressLines = doc.splitTextToSize(invoice.customerInfo.address, 80);
    doc.text(addressLines, 20, invoice.customerInfo.phone ? 93 : 86);
  }

  // Items table header
  const tableTop = 115;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, tableTop, 170, 8, "F");

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Item", 22, tableTop + 5);
  doc.text("Qty", 110, tableTop + 5);
  doc.text("Price", 135, tableTop + 5);
  doc.text("Total", 170, tableTop + 5, { align: "right" });

  // Items
  let yPos = tableTop + 15;
  doc.setTextColor(60, 60, 60);

  invoice?.items?.forEach((item, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(10);
    doc.text(item.productVariant, 22, yPos);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(item.productType, 22, yPos + 5);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(item.quantity.toString(), 110, yPos);
    doc.text(`$${item.basePrice.toFixed(2)}`, 135, yPos);
    doc.text(`$${item.subtotal.toFixed(2)}`, 188, yPos, { align: "right" });

    yPos += 12;

    // Add separator line
    if (index < invoice.items.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
    }
  });

  // Totals
  yPos += 10;
  doc.setDrawColor(0, 0, 0);
  doc.line(110, yPos, 190, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Subtotal:", 135, yPos);
  doc.text(`$${invoice.totals.subtotal.toFixed(2)}`, 188, yPos, {
    align: "right",
  });

  if (invoice.totals.discount > 0) {
    yPos += 7;
    doc.setTextColor(0, 150, 0);
    doc.text("Discount:", 135, yPos);
    doc.text(`-$${invoice.totals.discount.toFixed(2)}`, 188, yPos, {
      align: "right",
    });
  }

  if (invoice.totals.addOnFees > 0) {
    yPos += 7;
    doc.setTextColor(60, 60, 60);
    doc.text("Add-on Fees:", 135, yPos);
    doc.text(`$${invoice.totals.addOnFees.toFixed(2)}`, 188, yPos, {
      align: "right",
    });
  }

  yPos += 7;
  doc.setDrawColor(0, 0, 0);
  doc.line(110, yPos, 190, yPos);
  yPos += 8;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Total:", 135, yPos);
  doc.text(`$${invoice.totals.total.toFixed(2)}`, 188, yPos, {
    align: "right",
  });

  // Payment method
  if (invoice.paymentMethod) {
    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const paymentLabel =
      invoice.paymentMethod === "credit-card"
        ? "Credit Card"
        : invoice.paymentMethod === "bank-transfer"
        ? "Bank Transfer"
        : invoice.paymentMethod === "cash"
        ? "Cash"
        : invoice.paymentMethod;
    doc.text(`Payment Method: ${paymentLabel}`, 20, yPos);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for your business!", 105, 280, { align: "center" });

  return doc;
};

export const downloadInvoicePDF = (invoice: AccessoryInvoice) => {
  const doc = generateInvoicePDF(invoice);
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
};

export const printInvoicePDF = (invoice: AccessoryInvoice) => {
  const doc = generateInvoicePDF(invoice);
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
};
