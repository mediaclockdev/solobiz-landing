"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/use-cart";
import {
  createInvoice,
  AccessoryInvoiceItem,
  loadInvoices,
  updateOrderTracking,
} from "@/utils/invoiceGenerator";
import { useToast } from "@/contexts/ToastContext";
import {
  CreditCard,
  Building2,
  DollarSign,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";

import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function CheckoutModal({ open, onOpenChange }: CheckoutModalProps) {
  const { showToast } = useToast();
  const { items, clearCart, getTotalPrice, getTotalSavings } = useCart();
  const [isSuccess, setIsSuccess] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    shippingAddress: "",
    city: "",
    state: "",
    zipCode: "",
    paymentMethod: "credit-card" as "credit-card" | "cash",
  });

  const totalPrice = getTotalPrice();
  const totalSavings = getTotalSavings();
  const { user } = useAuth();
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.customerName.trim()) errors.push("Name is required");
    // if (!formData.email.trim()) errors.push("Email is required");
    // if (!formData.email.includes("@")) errors.push("Valid email is required");
    if (!formData.phone.trim()) errors.push("Phone is required");
    if (!formData.shippingAddress.trim())
      errors.push("Shipping address is required");
    if (!formData.city.trim()) errors.push("City is required");
    if (!formData.state.trim()) errors.push("State is required");
    if (!formData.zipCode.trim()) errors.push("Zip code is required");
    return errors;
  };

  const handleClose = () => {
    setIsSuccess(false);
    setFormData({
      customerName: "",
      email: "",
      phone: "",
      shippingAddress: "",
      city: "",
      state: "",
      zipCode: "",
      paymentMethod: "credit-card",
    });
    onOpenChange(false);
    router.refresh();
  };

  const handleNonStripeCheckout = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      showToast("Fill all the required fields", "error");
      return;
    }
    try {
      setIsProcessing(true);

      // Get logged-in Firebase user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const userId = currentUser ? currentUser.uid : null;

      // Convert cart items to invoice items
      const invoiceItems: AccessoryInvoiceItem[] = items.map((item) => {
        const basePrice = item.originalPrice || item.unitPrice;
        const discountPercent = item.originalPrice
          ? ((item.originalPrice - item.unitPrice) / item.originalPrice) * 100
          : 0;

        return {
          productType: item.type === "nfc-card" ? "card" : "sticker",
          productVariant: item.name,
          selectedCard: item.selectedCard,
          assignedDigitalCard: item?.assignedDigitalCard,
          showLogoMobileOnBack: item?.showLogoMobileOnBack,
          cardDetails: item?.cardDetails,
          color: item.color,
          quantity: item.quantity,
          basePrice: basePrice,
          discountApplied: discountPercent,

          addOnFees: {
            logoRemoval: item.options?.customLogo ? 5 : undefined,
            customLogo: item.options?.customLogo ? 5 : undefined,
          },
          subtotal: item.unitPrice * item.quantity,
        };
      });

      // Create invoice
      const invoice = createInvoice(invoiceItems, {
        name: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        address: `${formData.shippingAddress}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
      });

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update invoice status based on payment method
      const updatedInvoice = {
        ...invoice,
        status:
          formData.paymentMethod === "credit-card"
            ? ("paid" as const)
            : ("pending" as const),
        paymentMethod: formData.paymentMethod,
      };

      // Save the updated invoice
      const existingInvoices = loadInvoices();
      const filteredInvoices = existingInvoices.filter(
        (inv) => inv.invoiceNumber !== invoice.invoiceNumber
      );

      const accessoryInvoices = JSON.parse(
        JSON.stringify([updatedInvoice, ...filteredInvoices])
      );

      setInvoiceNumber(invoice.invoiceNumber);

      const orderRef = doc(db, "orders", Date.now().toString());

      await setDoc(orderRef, {
        items,
        total: totalPrice,
        customer: formData,
        userId: userId,
        paymentMethod: formData.paymentMethod,
        status: "pending",
        accessory_invoices: accessoryInvoices,
        createdAt: serverTimestamp(),
      });

      localStorage.removeItem("accessory_invoices");
      localStorage.removeItem("accessory_invoice_counter");

      //setInvoiceNumber(orderRef.id);
      setIsSuccess(true);
      clearCart();
      showToast("Order placed successfully!", "success");
      setIsProcessing(false);
    } catch (err) {
      console.error(err);
      showToast("Error placing order", "error");
    }
  };

  if (isSuccess) {
    return (
      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Order Placed!</h3>
            <p className="text-muted-foreground mb-4">
              Your order has been successfully placed.
            </p>
            <div className="bg-muted rounded-lg p-4 mb-6 w-full">
              <p className="text-sm text-muted-foreground mb-1">
                Invoice Number
              </p>
              <p className="text-xl font-bold">{invoiceNumber}</p>
            </div>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = "/dashboard/accessories/orders")
                }
                className="flex-1"
              >
                View Orders
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Continue Shopping
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogCancel className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </AlertDialogCancel>
          <AlertDialogTitle>Checkout</AlertDialogTitle>
        </AlertDialogHeader>

        {/* Scrollable form content */}
        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Order Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold">Order Summary</h3>
              <div className="border rounded-lg p-4 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} ({item.quantity}x)
                    </span>
                    <span className="font-medium">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Separator />
                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Savings</span>
                    <span className="font-medium text-green-600">
                      -${totalSavings.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) =>
                      handleInputChange("customerName", e.target.value)
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email}
                    //onChange={(e) => handleInputChange("email", user?.email)}
                    placeholder="john@example.com"
                    readOnly
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-3">
              <h3 className="font-semibold">Shipping Address</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Street Address *</Label>
                  <Input
                    id="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={(e) =>
                      handleInputChange("shippingAddress", e.target.value)
                    }
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                      placeholder="NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) =>
                        handleInputChange("zipCode", e.target.value)
                      }
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <h3 className="font-semibold">Payment Method</h3>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  handleInputChange("paymentMethod", value)
                }
              >
                <div className="flex items-center space-x-3 border rounded-lg p-4">
                  <RadioGroupItem value="credit-card" id="credit-card" />
                  <Label
                    htmlFor="credit-card"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Credit Card</div>
                      <div className="text-xs text-muted-foreground">
                        Pay now with card
                      </div>
                    </div>
                  </Label>
                </div>

                {/* <div className="flex items-center space-x-3 border rounded-lg p-4">
                  <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                  <Label
                    htmlFor="bank-transfer"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Building2 className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-xs text-muted-foreground">
                        Pay via bank transfer
                      </div>
                    </div>
                  </Label>
                </div> */}

                {/* <div className="flex items-center space-x-3 border rounded-lg p-4">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label
                    htmlFor="cash"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <DollarSign className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Cash</div>
                      <div className="text-xs text-muted-foreground">
                        Pay with cash on delivery
                      </div>
                    </div>
                  </Label>
                </div> */}
              </RadioGroup>

              {/* Stripe Form for Credit Card */}
              {formData.paymentMethod === "credit-card" && (
                <Elements stripe={stripePromise}>
                  <StripeForm
                    formData={formData}
                    totalPrice={totalPrice}
                    items={items}
                    clearCart={clearCart}
                    onSuccess={(id) => {
                      setInvoiceNumber(id);
                      setIsSuccess(true);
                    }}
                  />
                </Elements>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer for Non-Stripe Payments */}
        {formData.paymentMethod !== "credit-card" && (
          <div className="border-t pt-4 mt-4">
            <Button
              onClick={handleNonStripeCheckout}
              disabled={items.length === 0 || isProcessing}
              className="w-full flex items-center justify-center"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>Place Order - ${totalPrice.toFixed(2)}</>
              )}
            </Button>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Stripe Form Component
function StripeForm({
  formData,
  totalPrice,
  items,
  clearCart,
  onSuccess,
}: {
  formData: any;
  totalPrice: number;
  items: any[];
  clearCart: () => void;
  onSuccess: (invoiceId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const { showToast } = useToast();
  const { user } = useAuth();

  const generateRandomOrderItemIds = (
    quantity: number,
    selectedCard: "essential" | "custom" | "infinite" | "sticker"
  ) => {
    const prefixMap = {
      essential: "O",
      custom: "O",
      infinite: "O",
      sticker: "O",
    };

    const prefix = prefixMap[selectedCard];

    return Array.from({ length: quantity }, () => {
      const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit
      return `${prefix}-${randomNumber}`;
    });
  };

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    // Validation
    formData.email = user?.email;
    const validateForm = () => {
      const errors: string[] = [];
      if (!formData.customerName.trim()) errors.push("Name is required");
      // if (!formData.email.trim()) errors.push("Email is required");
      // if (!formData.email.includes("@")) errors.push("Valid email is required");
      if (!formData.phone.trim()) errors.push("Phone is required");
      if (!formData.shippingAddress.trim())
        errors.push("Shipping address is required");
      if (!formData.city.trim()) errors.push("City is required");
      if (!formData.state.trim()) errors.push("State is required");
      if (!formData.zipCode.trim()) errors.push("Zip code is required");
      return errors;
    };

    const errors = validateForm();
    if (errors.length > 0) {
      showToast("Fill all the required fields", "error");
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          currency: "usd",
        }),
      });

      // Firebase Auth
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const userId = currentUser ? currentUser.uid : null;

      const { clientSecret } = await res.json();

      const cardElement = elements.getElement(CardElement);
      const { paymentIntent, error } = await stripe.confirmCardPayment(
        clientSecret!,
        {
          payment_method: { card: cardElement! },
        }
      );

      if (error) throw error;

      // Convert cart items to invoice items
      const invoiceItems: AccessoryInvoiceItem[] = items.map((item) => {
        const basePrice = item.originalPrice || item.unitPrice;
        const discountPercent = item.originalPrice
          ? ((item.originalPrice - item.unitPrice) / item.originalPrice) * 100
          : 0;

        const orderItemId = generateRandomOrderItemIds(
          item.quantity,
          item.selectedCard // "essential" | "custom"
        );
        return {
          productType: item.type === "nfc-card" ? "card" : "sticker",
          color: item.color,
          selectedCard: item.selectedCard,
          assignedDigitalCard: item?.assignedDigitalCard,
          showLogoMobileOnBack: item?.showLogoMobileOnBack,
          cardDetails: item?.cardDetails,
          productVariant: item.name,
          quantity: item.quantity,
          orderItemId: orderItemId,
          basePrice: basePrice,
          discountApplied: discountPercent,
          addOnFees: {
            logoRemoval: item.options?.customLogo ? 5 : undefined,
            customLogo: item.options?.customLogo ? 5 : undefined,
          },
          subtotal: item.unitPrice * item.quantity,
        };
      });

      // Create invoice
      const invoice = createInvoice(invoiceItems, {
        name: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        address: `${formData.shippingAddress}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const updatedInvoice = {
        ...invoice,
        status:
          formData.paymentMethod === "credit-card"
            ? ("paid" as const)
            : ("pending" as const),
        paymentMethod: formData.paymentMethod,
      };

      const existingInvoices = loadInvoices();
      const filteredInvoices = existingInvoices.filter(
        (inv) => inv.invoiceNumber !== invoice.invoiceNumber
      );

      const accessoryInvoices = JSON.parse(
        JSON.stringify([updatedInvoice, ...filteredInvoices])
      );

      setInvoiceNumber(invoice.invoiceNumber);

      if (paymentIntent?.status === "succeeded") {
        /**
         *  Extract Stripe Payment Details
         */
        //@ts-ignore
        const charge = paymentIntent.charges?.data?.[0];

        const cardInfo = charge?.payment_method_details?.card
          ? {
              brand: charge.payment_method_details.card.brand,
              last4: charge.payment_method_details.card.last4,
              exp_month: charge.payment_method_details.card.exp_month,
              exp_year: charge.payment_method_details.card.exp_year,
            }
          : null;

        const paymentInfo = {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          card: cardInfo,
          receipt_url: charge?.receipt_url || null,
        };

        /**
         * Save Order to Firestore
         */
        const orderRef = doc(db, "orders", paymentIntent.id);

        await setDoc(orderRef, {
          items,
          total: totalPrice,
          userId: userId,
          paymentMethod: formData.paymentMethod,
          status: "paid",
          accessory_invoices: accessoryInvoices,
          paymentDetails: paymentInfo,
          createdAt: serverTimestamp(),
        });

        localStorage.removeItem("accessory_invoices");
        localStorage.removeItem("accessory_invoice_counter");

        clearCart();
        showToast("Payment successful!", "success");
        onSuccess(paymentIntent.id);

        const userQuery = doc(db, "users", userId);
        const userSnapshot = await getDoc(userQuery);
        const user_data = userSnapshot.data();
        if (user_data?.notificationPreferences?.email) {
          await fetch("/api/send-order-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              customerName: formData.customerName,
              invoiceNumber: invoice.invoiceNumber,
              total: totalPrice,
              items,
            }),
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(`${err} Payment failed`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-4 border p-4 rounded space-y-3">
      <CardElement className="p-4 border rounded" />
      <Button onClick={handleSubmit} disabled={isProcessing} className="w-full">
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>Pay ${totalPrice.toFixed(2)}</>
        )}
      </Button>
    </div>
  );
}
