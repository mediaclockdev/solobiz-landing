import Stripe from "stripe";
import { NextResponse } from "next/server";
import { adminDB } from "@/services/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  try {
    /* --------------------------------------------------
     * 1️⃣ Read request
     * -------------------------------------------------- */
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      );
    }

    /* --------------------------------------------------
     * 2️⃣ Fetch subscription with invoice
     * -------------------------------------------------- */
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: [
        "latest_invoice",
        "latest_invoice.lines",
        "latest_invoice.payment_intent",
        "latest_invoice.charge",
      ],
    });

    if (!subscription.latest_invoice) {
      return NextResponse.json({
        success: false,
        message: "No invoice generated yet",
      });
    }

    const invoice = subscription.latest_invoice as Stripe.Invoice;

    /* --------------------------------------------------
     * 3️⃣ Only continue if PAID
     * -------------------------------------------------- */
    if (invoice.status !== "paid") {
      return NextResponse.json({
        success: false,
        message: "Invoice not paid yet",
        invoiceStatus: invoice.status,
      });
    }

    /* --------------------------------------------------
     * 4️⃣ Find user by subscriptionId
     * -------------------------------------------------- */
    const userSnap = await adminDB
      .collection("users")
      .where("subscriptionId", "==", subscriptionId)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return NextResponse.json(
        { error: "User not found for subscription" },
        { status: 404 }
      );
    }

    const userDoc = userSnap.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    /* --------------------------------------------------
     * 5️⃣ Resolve billing period (SAFE)
     * -------------------------------------------------- */
    const line = invoice.lines?.data?.[0];

    if (!line?.period?.start || !line?.period?.end) {
      return NextResponse.json({
        success: false,
        message: "Billing period not available yet",
      });
    }

    const subscriptionStartDate = new Date(line.period.start * 1000);
    const subscriptionEndDate = new Date(line.period.end * 1000);

    /* --------------------------------------------------
     * 6️⃣ Resolve PaymentIntent (CREATE-LIKE LOGIC)
     * -------------------------------------------------- */
    let paymentIntentId: string | null = null;

    // 1️⃣ Direct invoice payment_intent

    //@ts-ignore
    if (invoice.payment_intent) {
      paymentIntentId =
        //@ts-ignore
        typeof invoice.payment_intent === "string"
          ? //@ts-ignore
            invoice.payment_intent
          : //@ts-ignore
            invoice.payment_intent.id;
    }

    // 2️⃣ Via charge → payment_intent
    //@ts-ignore
    if (!paymentIntentId && invoice.charge) {
      const charge =
        //@ts-ignore
        typeof invoice.charge === "string"
          ? //@ts-ignore
            await stripe.charges.retrieve(invoice.charge)
          : //@ts-ignore
            invoice.charge;

      paymentIntentId = charge.payment_intent as string | null;
    }

    // 3️⃣ Fallback → latest PaymentIntent for customer
    if (!paymentIntentId) {
      const intents = await stripe.paymentIntents.list({
        customer: subscription.customer as string,
        limit: 1,
      });

      if (intents.data.length > 0) {
        paymentIntentId = intents.data[0].id;
      }
    }

    /* --------------------------------------------------
     * 7️⃣ Invoice + pricing info
     * -------------------------------------------------- */
    const numericPrice = invoice.amount_paid ? invoice.amount_paid / 100 : 0;

    const invoiceUrl = invoice.hosted_invoice_url || null;
    const invoicePdf = invoice.invoice_pdf || null;

    /* --------------------------------------------------
     * 8️⃣ PREVENT DUPLICATE PAYMENT INTENT
     * -------------------------------------------------- */
    if (paymentIntentId) {
      const existingSnap = await adminDB
        .collection("subscriptions")
        .where("paymentIntentId", "==", paymentIntentId)
        .limit(1)
        .get();

      if (!existingSnap.empty) {
        return NextResponse.json({
          success: true,
          message: "Subscription already synced for this payment",
          existingSubscriptionId: existingSnap.docs[0].id,
        });
      }
    }

    /* --------------------------------------------------
     * 8️⃣ INSERT NEW RECORD (NEW DOC ONLY ✔)
     * -------------------------------------------------- */
    await adminDB.collection("subscriptions").add({
      userId,
      plan: userData.planName || "Unknown",
      planPrice: numericPrice,
      subscriptionId: subscription.id,
      paymentIntentId,
      status: "active",

      startDate: Timestamp.fromDate(subscriptionStartDate),
      endDate: Timestamp.fromDate(subscriptionEndDate),

      stripeCustomerId: subscription.customer,
      invoiceUrl,
      invoicePdf,

      createdAt: Timestamp.now(),
    });

    /* --------------------------------------------------
     * 9️⃣ Update user CURRENT STATE ONLY
     * -------------------------------------------------- */
    await userDoc.ref.update({
      subscriptionStartDate: Timestamp.fromDate(subscriptionStartDate),
      subscriptionEndDate: Timestamp.fromDate(subscriptionEndDate),
      lastPaymentStatus: "paid",
      updatedAt: Timestamp.now(),
    });

    /* --------------------------------------------------
     * 🔟 Success
     * -------------------------------------------------- */
    return NextResponse.json({
      success: true,
      message: "Subscription synced successfully",
      data: {
        subscriptionId,
        invoiceId: invoice.id,
        paymentIntentId,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
      },
    });
  } catch (error: any) {
    console.error("❌ Sync subscription failed:", error);

    return NextResponse.json(
      { error: error.message || "Subscription sync failed" },
      { status: 500 }
    );
  }
}
