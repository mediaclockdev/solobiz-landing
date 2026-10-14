"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/contexts/ToastContext";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

/**
 * One-time purchase of the grandchild lead list (client points b1-b4).
 *
 * Shows the breakdown the client asked for - [# of leads X $00.00 = $ cost] -
 * then takes payment and hands the PaymentIntent id back so the caller can
 * record the purchase and open the access window.
 *
 * The price is displayed here but recomputed server-side in
 * /api/create-payment-intent, so what is charged never depends on the client.
 */
function LeadExportPaymentForm({
  uid,
  leadCount,
  perLeadFee,
  total,
  accessDays,
  onPaid,
  onCancel,
}: {
  uid?: string;
  leadCount: number;
  perLeadFee: number;
  total: number;
  accessDays: number;
  onPaid: (paymentIntentId: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  // Card errors belong next to the card field, not in a toast that slides away
  // while the user is still looking at the form they need to correct.
  const [errorMessage, setErrorMessage] = useState("");
  const { showToast } = useToast();

  const handlePay = async () => {
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) {
      setErrorMessage("The card field is not ready yet. Please try again.");
      return;
    }

    setErrorMessage("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: "usd",
          leadExport: { uid, leadCount, perLeadFee },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.clientSecret) {
        setErrorMessage(
          data.error || "We could not start the payment. Please try again.",
        );
        return;
      }

      const { paymentIntent, error } = await stripe.confirmCardPayment(
        data.clientSecret,
        { payment_method: { card } },
      );

      /* A declined card, an expired card, a wrong CVC - these are NORMAL
       * outcomes of taking a payment, not faults. They are shown in the form
       * and deliberately not sent to console.error: Stripe's error is a plain
       * object, not an Error instance, so logging it printed "{}" and the Next
       * dev overlay raised it as a red Console Error as though the code had
       * crashed. */
      if (error) {
        setErrorMessage(
          error.message ||
            "Your card could not be charged. Please check the details and try again.",
        );
        return;
      }

      // Belt and braces: only "succeeded" means the money actually moved.
      // Other statuses (requires_action, processing) must not unlock anything.
      if (paymentIntent?.status !== "succeeded") {
        setErrorMessage(
          "The payment did not complete. No charge has been made - please try again.",
        );
        return;
      }

      await onPaid(paymentIntent.id);
      showToast("Payment complete. Your download is ready.", "success");
    } catch (err: any) {
      // Anything reaching here is genuinely unexpected - a network drop, or a
      // failure inside onPaid (the Firestore write). Normalised before logging
      // so the console never shows a bare "{}".
      console.error("Lead export payment error:", {
        message: err?.message ?? String(err),
        name: err?.name,
        code: err?.code,
      });
      setErrorMessage(
        err?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {leadCount} {leadCount === 1 ? "lead" : "leads"} &times; $
            {perLeadFee.toFixed(2)}
          </span>
          <span className="font-semibold">${total.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between border-t pt-2 text-base font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          One-time payment. Your download stays available for {accessDays}{" "}
          {accessDays === 1 ? "day" : "days"}, then access expires.
        </p>
      </div>

      <div
        className={`rounded-xl border p-3 ${
          errorMessage ? "border-destructive" : ""
        }`}
      >
        <CardElement
          options={{ hidePostalCode: true }}
          // Clear a stale failure as soon as the user edits the card, and
          // surface Stripe's own live validation (bad number, past expiry)
          // before they ever press Pay.
          onChange={(event) => setErrorMessage(event.error?.message ?? "")}
        />
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button onClick={handlePay} disabled={!stripe || isProcessing}>
          {isProcessing ? "Processing..." : "Pay to download list"}
        </Button>
      </div>
    </div>
  );
}

export function LeadExportPurchaseModal({
  open,
  onOpenChange,
  uid,
  leadCount,
  perLeadFee,
  total,
  accessDays,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uid?: string;
  leadCount: number;
  perLeadFee: number;
  total: number;
  accessDays: number;
  onPaid: (paymentIntentId: string) => Promise<void> | void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* z-[60]: this opens from inside the grandchild dialog, which sits at
          z-50. Without the bump it renders underneath and cannot be used. */}
      <DialogContent className="z-[60] max-w-md top-1/2 bottom-auto -translate-y-1/2 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Download grandchild leads
          </DialogTitle>
        </DialogHeader>

        {perLeadFee > 0 && total >= 0.5 ? (
          <Elements stripe={stripePromise}>
            <LeadExportPaymentForm
              uid={uid}
              leadCount={leadCount}
              perLeadFee={perLeadFee}
              total={total}
              accessDays={accessDays}
              onPaid={async (id) => {
                await onPaid(id);
                onOpenChange(false);
              }}
              onCancel={() => onOpenChange(false)}
            />
          </Elements>
        ) : (
          // Fee unset in settings/LeadExportFee or below Stripe's 50c minimum
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {perLeadFee <= 0
                ? "Lead downloads are not priced yet. Please contact support or ask an administrator to set the per-lead fee."
                : `The calculated total ($${total.toFixed(2)}) is below the minimum charge of $0.50.`}
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
