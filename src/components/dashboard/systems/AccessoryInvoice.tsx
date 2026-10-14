"use client";

import { useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AccessoryInvoice as InvoiceType } from "@/utils/invoiceGenerator";
import { Download, Printer } from "lucide-react";
import html2pdf from "html2pdf.js";

interface AccessoryInvoiceProps {
  invoice: InvoiceType;
}

export function AccessoryInvoice({ invoice }: AccessoryInvoiceProps) {
  const pdfRef = useRef<HTMLDivElement>(null);

  // PRINT
  const handlePrint = () => {
    const element = pdfRef.current;
    if (!element) return;

    const options = {
      margin: 10,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      //@ts-ignore
      .set(options)
      .from(element)
      .toPdf()
      .get("pdf")
      .then((pdf: any) => {
        pdf.autoPrint(); // 🔥 Trigger print dialog
        const pdfUrl = pdf.output("bloburl"); // Create PDF blob URL
        window.open(pdfUrl, "_blank"); // Open PDF in new tab → auto print
      });
  };

  // PDF DOWNLOAD
  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    if (!element) return;

    const pdfOptions = {
      margin: 10,
      filename: `invoice-${invoice.invoiceNumber}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    //@ts-ignore
    html2pdf().set(pdfOptions).from(element).save();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: InvoiceType["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  console.log("Invoice", invoice);

  return (
    <Card className="max-w-4xl mx-auto print:shadow-none">
      {/* Buttons (Hidden in PDF & Print) */}
      <div className="flex justify-end gap-2 p-4 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
          <Download className="h-4 w-4 mr-1" /> Download PDF
        </Button>
      </div>

      {/* Content to convert to PDF */}
      <div ref={pdfRef} id="invoice-pdf" className="p-4">
        <CardHeader className="print:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Invoice</h1>
              <p className="text-sm text-muted-foreground mt-1">
                #{invoice.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-start mt-4">
            <div>
              <p className="text-sm font-semibold">Solo Cards</p>
              <p className="text-xs text-muted-foreground">
                Digital Business Solutions
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">Invoice Date</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(invoice.date)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 print:p-6">
          {/* Customer Section */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Bill To</h3>
            <div className="text-sm">
              <p className="font-medium">{invoice.customerInfo.name}</p>
              <p className="text-muted-foreground">
                {invoice.customerInfo.email}
              </p>
              {invoice.customerInfo.phone && (
                <p className="text-muted-foreground">
                  {invoice.customerInfo.phone}
                </p>
              )}
              {invoice.customerInfo.address && (
                <p className="text-muted-foreground">
                  {invoice.customerInfo.address}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Items</h3>
              <Badge className={getStatusColor(invoice?.status)}>
                {invoice?.status?.toUpperCase()}
              </Badge>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left text-xs">
                    <th className="p-3 font-semibold">Product</th>
                    <th className="p-3 font-semibold text-center">Qty</th>
                    <th className="p-3 font-semibold text-right">Unit Price</th>
                    <th className="p-3 font-semibold text-right">Discount</th>
                    <th className="p-3 font-semibold text-right">Add-ons</th>
                    <th className="p-3 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice?.rawOrder.items?.map((item, index) => (
                    <tr key={index} className="border-t text-sm">
                      <td className="p-3">
                        <div className="font-medium capitalize">
                          {invoice.rawOrder?.items?.[index]?.name ||
                            item.productVariant}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Qty:{" "}
                          {invoice.rawOrder?.items?.[index]?.quantity ??
                            item.quantity}
                        </p>
                      </td>

                      <td className="p-3 text-center">{item.quantity}</td>

                      <td className="p-3 text-right">
                        {" "}
                        -
                        {/* ${invoice.rawOrder?.items?.[index]?.unitPrice?.toFixed(2)} */}
                      </td>

                      <td className="p-3 text-right text-green-600">
                        -
                        {/* {item.discountApplied > 0
                          ? `-${item.discountApplied}%`
                          : "-"} */}
                      </td>

                      {/* <td className="p-3 text-right">
                        {Object.values(item?.addOnFees).reduce(
                          (sum, fee) => sum + (fee || 0),
                          0
                        ) > 0 ? (
                          <span>
                            +
                            {Object.values(item.addOnFees)
                              .reduce((sum, fee) => sum + (fee || 0), 0)
                              .toFixed(2)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td> */}

                      <td className="p-3 text-right">
                        {/* ${item?.subtotal?.toFixed(2)} */}-
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${invoice.totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">
                  -${invoice.totals.discount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Add-on Fees</span>
                <span>+${invoice.totals.addOnFees.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>${invoice.totals.total.toFixed(2)}</span>
              </div>

              {invoice.paymentMethod && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Payment Method</span>
                  <span className="capitalize">{invoice.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="text-center text-xs text-muted-foreground">
            <p>Thank you for your business!</p>
            <p className="mt-1">For questions, contact support@solocards.com</p>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
