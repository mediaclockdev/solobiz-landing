"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AccessoryInvoice } from "@/utils/invoiceGenerator";
import { format } from "date-fns";
import { Receipt, Calendar, Package, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PurchaseHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: AccessoryInvoice[];
}

const StatusBadge = ({ status }: { status: AccessoryInvoice['status'] }) => {
  const variants = {
    paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    cancelled: 'bg-muted text-muted-foreground border-border'
  };
  
  const labels = {
    paid: 'Paid',
    pending: 'Pending',
    cancelled: 'Cancelled'
  };
  
  return (
    <Badge variant="outline" className={cn("capitalize", variants[status])}>
      {labels[status]}
    </Badge>
  );
};

const ProductTypeDisplay = (productType: string, productVariant?: string) => {
  const types: Record<string, string> = {
    card: "NFC Business Card",
    sticker: "NFC Tap Sticker"
  };
  
  const base = types[productType] || productType;
  return productVariant ? `${base} (${productVariant})` : base;
};

export function PurchaseHistoryModal({ open, onOpenChange, invoices }: PurchaseHistoryModalProps) {
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  
  // Sort invoices by date (newest first)
  const sortedInvoices = [...invoices].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const toggleExpanded = (invoiceNumber: string) => {
    const newExpanded = new Set(expandedInvoices);
    if (newExpanded.has(invoiceNumber)) {
      newExpanded.delete(invoiceNumber);
    } else {
      newExpanded.add(invoiceNumber);
    }
    setExpandedInvoices(newExpanded);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[calc(100%-2rem)] sm:w-full max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Your Purchase History
            <Badge variant="secondary" className="ml-2">
              {invoices.length} {invoices.length === 1 ? 'Purchase' : 'Purchases'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(80vh-120px)] pr-4">
          {sortedInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
              <p className="text-sm text-muted-foreground">
                Your accessory purchase history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedInvoices.map((invoice) => {
                const isExpanded = expandedInvoices.has(invoice.invoiceNumber);
                
                return (
                  <Card key={invoice.invoiceNumber} className="overflow-hidden">
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpanded(invoice.invoiceNumber)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2 text-sm font-mono">
                              <Receipt className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{invoice.invoiceNumber}</span>
                            </div>
                            <StatusBadge status={invoice.status} />
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{format(new Date(invoice.date), 'MMM dd, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" />
                              <span>{invoice.items.length} {invoice.items.length === 1 ? 'item' : 'items'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              ${invoice.totals.total.toFixed(2)}
                            </div>
                            {invoice.totals.discount > 0 && (
                              <div className="text-xs text-emerald-600">
                                Saved ${invoice.totals.discount.toFixed(2)}
                              </div>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        
                        {/* Items List */}
                        <div className="space-y-3 mb-4">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Items Purchased
                          </h4>
                          <div className="space-y-2">
                            {invoice.items.map((item, index) => (
                              <div 
                                key={index} 
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {ProductTypeDisplay(item.productType, item.productVariant)}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Qty: {item.quantity} × ${item.basePrice.toFixed(2)}
                                    {item.discountApplied > 0 && (
                                      <span className="text-emerald-600 ml-2">
                                        (-${item.discountApplied.toFixed(2)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold">
                                    ${item.subtotal.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Price Breakdown */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Price Breakdown
                          </h4>
                          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span className="font-medium">${invoice.totals.subtotal.toFixed(2)}</span>
                            </div>
                            
                            {invoice.totals.discount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-emerald-600">Discounts Applied</span>
                                <span className="font-medium text-emerald-600">
                                  -${invoice.totals.discount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            
                            {invoice.totals.addOnFees > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Add-on Fees</span>
                                <span className="font-medium">${invoice.totals.addOnFees.toFixed(2)}</span>
                              </div>
                            )}
                            
                            <Separator />
                            
                            <div className="flex justify-between text-base font-bold">
                              <span>Total</span>
                              <span>${invoice.totals.total.toFixed(2)}</span>
                            </div>
                            
                            {invoice.paymentMethod && (
                              <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                                <span>Payment Method</span>
                                <span className="capitalize">{invoice.paymentMethod}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Customer Info */}
                        {invoice.customerInfo && (
                          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-dashed">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                              Order Information
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {invoice.customerInfo.name && (
                                <div>
                                  <span className="text-muted-foreground">Name: </span>
                                  <span>{invoice.customerInfo.name}</span>
                                </div>
                              )}
                              {invoice.customerInfo.email && (
                                <div>
                                  <span className="text-muted-foreground">Email: </span>
                                  <span>{invoice.customerInfo.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
