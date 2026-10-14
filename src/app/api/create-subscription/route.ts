import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { request } from "http";
import { adminDB } from "@/services/firebaseAdmin";
import { sendSubscriptionEmails } from "@/services/subscriptionEmail";
// import { db } from "@/services/firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  try {
    // const [freeTrialPeriod, setFreeTrialPeriod] = useState(0);

    // const settingsRef = doc(db, "settings", "PricingRequirement");

    // useEffect(() => {
    //   const fetchSettings = async () => {
    //     const snap = await getDoc(settingsRef);
    //     if (snap.exists()) {
    //       const data = snap.data();
    //       setFreeTrialPeriod(data.freeTrialPeriod || 0);
    //     }
    //   };
    //   fetchSettings();
    // }, []);

    const {
      userId,
      plan,
      price,
      billing,
      action,
      addonSubscriptionId,
      paymentMethodId,
    } = await req.json();

    if (!userId || !action) throw new Error("Missing required fields");

    const userRef = adminDB.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error("User not found");

    const userData = userSnap.data() as any;

    const pricingRequirementRef = adminDB
      .collection("settings")
      .doc("PricingRequirement");
    const pricingRequirementSnap = await pricingRequirementRef.get();

    const pricingRequirementData = pricingRequirementSnap.data() as any;
    const freeTrialPeriod = Number(userData?.freeTrialPeriod) ?? 0;

    // Ensure Stripe customer
    let stripeCustomerId = userData.stripeCustomerId;
    if (stripeCustomerId) {
      try {
        const existingCustomer = await stripe.customers.retrieve(stripeCustomerId);
        if ((existingCustomer as any).deleted) {
          stripeCustomerId = null;
        }
      } catch (custErr: any) {
        if (
          custErr?.code === "resource_missing" ||
          custErr?.statusCode === 404 ||
          custErr?.type === "StripeInvalidRequestError"
        ) {
          stripeCustomerId = null;
        } else {
          throw custErr;
        }
      }
    }

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.fullName || userData.name || userData.displayName || undefined,
      });
      stripeCustomerId = customer.id;
      await userRef.update({ stripeCustomerId });
    }

    /* With-out Trail Periond */
    if (action === "create") {
      const numericPrice = Number(price);
      if (isNaN(numericPrice)) throw new Error("Invalid price");
      const stripeUnitAmount = Math.round(numericPrice * 100);

      const subscriptionStartDate = new Date();
      const subscriptionEndDate = new Date(subscriptionStartDate);
      if (billing === "annual") {
        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
      } else {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      }

      const product = await stripe.products.create({ name: plan });

      const stripePrice = await stripe.prices.create({
        unit_amount: stripeUnitAmount,
        currency: "usd",
        recurring: { interval: billing === "annual" ? "year" : "month" },
        product: product.id,
      });

      //🔑 REQUIRED: attach card to customer
      const paymentMethod = await stripe.paymentMethods.retrieve(
        paymentMethodId
      );

      if (!paymentMethod.customer) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId,
        });
      }

      // 🔑 REQUIRED: set as default card
      // await stripe.customers.update(stripeCustomerId, {
      //   invoice_settings: {
      //     default_payment_method: paymentMethodId,
      //   },
      // });

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: stripePrice.id }],
        default_payment_method: paymentMethodId,
        payment_settings: {
          payment_method_types: ["card"],
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent", "latest_invoice"],
      });

      let clientSecret: string | null = null;
      let paymentIntentId: string | null = null;

      if (subscription.latest_invoice) {
        const latestInvoice = subscription.latest_invoice as any;
        const paymentIntent = latestInvoice.payment_intent;

        if (paymentIntent) {
          clientSecret = paymentIntent.client_secret;
          paymentIntentId = paymentIntent.id;
        }
      }

      // if (!clientSecret) {
      //   const paymentIntent = await stripe.paymentIntents.create({
      //     customer: stripeCustomerId,
      //     amount: stripeUnitAmount,
      //     currency: "usd",
      //     description: `${plan} Subscription (${billing})`,
      //   });
      //   clientSecret = paymentIntent.client_secret;
      //   paymentIntentId = paymentIntent.id;
      // }

      let invoicePdf: string | null = null;
      let invoiceUrl: string | null = null;
      if (subscription.latest_invoice) {
        const latestInvoice = subscription.latest_invoice as any;
        invoicePdf = latestInvoice.invoice_pdf || null;
        invoiceUrl = latestInvoice.hosted_invoice_url || null;
        paymentIntentId = latestInvoice?.payment_intent?.id ?? null;
      }

      // --------------------------------------
      // 🔁 FALLBACK PAYMENT INTENT (SAFE)
      // --------------------------------------
      if (!paymentIntentId) {
        const paymentIntents = await stripe.paymentIntents.list({
          customer: stripeCustomerId,
          limit: 1,
        });

        if (paymentIntents.data.length > 0) {
          paymentIntentId = paymentIntents.data[0].id;
        }
      }

      // const subsRef = collection(db, "subscriptions");
      // await addDoc(subsRef, {
      //   userId,
      //   plan,
      //   planPrice: numericPrice,
      //   subscriptionId: subscription.id,
      //   paymentIntentId,
      //   status: "active",
      //   startDate: subscriptionStartDate,
      //   endDate: subscriptionEndDate,
      //   stripeCustomerId,
      //   invoiceUrl,
      //   invoicePdf,
      //   createdAt: new Date(),
      // });

      const subsRef = adminDB.collection("subscriptions").doc(subscription.id);

      const subsSnap = await subsRef.get();

      if (!subsSnap.exists) {
        await subsRef.set({
          userId,
          plan,
          planPrice: numericPrice,
          subscriptionId: subscription.id,
          paymentIntentId,
          status: "active",
          startDate: subscriptionStartDate,
          endDate: subscriptionEndDate,
          stripeCustomerId,
          invoiceUrl,
          invoicePdf,
          createdAt: new Date(),
        });
      }

      const isAddon = plan.startsWith("Add");
      const updateData: any = {};

      if (!isAddon) {
        // Main plan (Pro)
        updateData.planType = "paid";
        updateData.planName = plan;
        updateData.subscriptionId = subscription.id;
        updateData.canceledAtPeriodEnd = false;
        updateData.subscriptionStartDate = subscriptionStartDate;
        updateData.subscriptionEndDate = subscriptionEndDate;
        updateData.paymentIntentId = paymentIntentId;
        updateData.addons = [];
      } else {
        // Add-on plan
        const existingAddons = userData.addons || [];
        updateData.addons = [
          ...existingAddons,
          {
            name: plan,
            price: numericPrice,
            billing: billing,
            subscriptionId: subscription.id,
            startDate: subscriptionStartDate,
            endDate: subscriptionEndDate,
            paymentIntentId: paymentIntentId,
          },
        ];
      }

      // --- ADD SUBSCRIPTION HISTORY ---
      const subscriptionData = {
        plan,
        price: numericPrice,
        billing,
        subscriptionId: subscription.id,
        paymentIntentId,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        invoiceUrl,
        invoicePdf,
        createdAt: new Date(),
      };
      const existingHistory = userData.subscriptionHistory || [];
      updateData.subscriptionHistory = [...existingHistory, subscriptionData];
      // ---------------------------------
      await userRef.update(updateData);

      //await updateDoc(userRef, updateData);

      const cardsSnap = await adminDB
        .collection("cards")
        .where("uid", "==", userId)
        .get();

      if (!cardsSnap.empty) {
        const batch = adminDB.batch();

        cardsSnap.docs.forEach((doc) => {
          batch.update(doc.ref, {
            "metadata.cardType": "paid",
            "metadata.isPaid": true,
            updatedAt: new Date(),
          });
        });

        await batch.commit();
      }

      // --------------------------------------
      // 📧 SEND EMAIL TO CUSTOMER & ADMIN
      // --------------------------------------
      try {
        await sendSubscriptionEmails({
          customerEmail: userData.email,
          customerName:
            userData.fullName ||
            userData.name ||
            userData.displayName ||
            userData.username ||
            "Valued Customer",
          userId,
          plan,
          price: numericPrice,
          billing,
          subscriptionId: subscription.id,
          paymentIntentId,
          startDate: subscriptionStartDate,
          endDate: subscriptionEndDate,
          invoiceUrl,
          invoicePdf,
        });
      } catch (emailErr) {
        console.error("Failed to send subscription confirmation emails:", emailErr);
      }

      return NextResponse.json({
        subscriptionId: subscription.id,
        status: subscription.status, // 🔑 IMPORTANT
        clientSecret:
          (subscription.latest_invoice as any)?.payment_intent?.client_secret ||
          null,
        paymentIntentId,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        invoiceUrl,
        invoicePdf,
        subscription,
      });
    }

    if (action === "cancel") {
      if (!userData.subscriptionId)
        throw new Error("No active subscription found");

      const subsToCancel = [
        { name: userData.planName, id: userData.subscriptionId },
        ...(userData.addons || []).map((addon: any) => ({
          name: addon.name,
          id: addon.subscriptionId,
        })),
      ];

      const now = new Date();
      const refunds = [];
      for (const sub of subsToCancel) {
        const subscription = await stripe.subscriptions.retrieve(sub.id, {
          expand: ["latest_invoice.payment_intent", "latest_invoice.lines"],
        });

        let startDate: Date;
        let endDate: Date;

        if (
          subscription.latest_invoice &&
          //@ts-ignore
          "lines" in subscription.latest_invoice
        ) {
          //@ts-ignore
          const invoiceLine = subscription.latest_invoice.lines.data[0];
          startDate = new Date(invoiceLine.period.start * 1000);
          endDate = new Date(invoiceLine.period.end * 1000);
        } else {
          //@ts-ignore
          startDate = new Date(subscription.current_period_start * 1000);
          //@ts-ignore
          endDate = new Date(subscription.current_period_end * 1000);
        }

        const daysSinceStart =
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceStart <= 30) {
          await stripe.subscriptions.update(sub.id, {
            cancel_at_period_end: true,
          });

          const changes = await stripe.charges.list({
            customer: userData.stripeCustomerId,
            limit: 3,
          });

          for (const charge of changes.data) {
            if (charge.paid && !charge.refunded) {
              const refund = await stripe.refunds.create({ charge: charge.id });
              refunds.push(refund);
            }
          }
        }
      }

      await userRef.update({
        planType: "free",
        planName: null,
        subscriptionId: null,
        canceledAtPeriodEnd: true,
        refund: refunds,
        addons: [],
      });

      const cardsSnap = await adminDB
        .collection("cards")
        .where("uid", "==", userId)
        .get();

      if (!cardsSnap.empty) {
        const batch = adminDB.batch();

        cardsSnap.docs.forEach((doc) => {
          batch.update(doc.ref, {
            "metadata.cardType": "free",
            "metadata.isPaid": false,
            updatedAt: new Date(),
          });
        });

        await batch.commit();
      }

      return NextResponse.json({
        message: "Pro plan and all add-ons canceled and refunded successfully.",
      });
    }

    // if (action === "renew") {
    //   if (!userData.subscriptionId) throw new Error("No subscription to renew");

    //   const renewed = await stripe.subscriptions.update(
    //     userData.subscriptionId,
    //     {
    //       cancel_at_period_end: false,
    //       expand: ["latest_invoice.lines"],
    //     }
    //   );

    //   let startDate: Date | null = null;
    //   let endDate: Date | null = null;

    //   //@ts-ignore
    //   if (renewed.latest_invoice && "lines" in renewed.latest_invoice) {
    //     const invoiceLine = renewed.latest_invoice.lines.data[0];
    //     startDate = new Date(invoiceLine.period.start * 1000);
    //     endDate = new Date(invoiceLine.period.end * 1000);
    //   } else {
    //     //@ts-ignore
    //     startDate = new Date(renewed.current_period_start * 1000);
    //     //@ts-ignore
    //     endDate = new Date(renewed.current_period_end * 1000);
    //   }

    //   await updateDoc(userRef, {
    //     canceledAtPeriodEnd: false,
    //     subscriptionStartDate: startDate,
    //     subscriptionEndDate: endDate,
    //     planType: "paid",
    //     planName: userData.planName || plan,
    //   });

    //   return NextResponse.json({
    //     message: "Subscription renewed successfully! Access restored.",
    //     subscription: renewed,
    //     startDate,
    //     endDate,
    //   });
    // }

    if (action === "get") {
      if (!userData.subscriptionId) {
        return NextResponse.json({
          message: "User has no subscription",
          freeTrialPeriod,
        });
      }

      const subscription: Stripe.Subscription =
        await stripe.subscriptions.retrieve(userData.subscriptionId, {
          expand: [
            "items.data.price.product",
            "latest_invoice.payment_intent",
            "latest_invoice",
            "latest_invoice.lines",
          ],
        });

      const item = subscription.items.data[0];
      const price = item.price;
      const product = price.product as Stripe.Product;

      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (
        subscription.latest_invoice &&
        //@ts-ignore
        "lines" in subscription.latest_invoice
      ) {
        const invoiceLine = subscription.latest_invoice.lines.data[0];
        startDate = new Date(invoiceLine.period.start * 1000);
        endDate = new Date(invoiceLine.period.end * 1000);
      } else if (
        //@ts-ignore
        subscription.current_period_start &&
        //@ts-ignore
        subscription.current_period_end
      ) {
        //@ts-ignore
        startDate = new Date(subscription.current_period_start * 1000);
        //@ts-ignore
        endDate = new Date(subscription.current_period_end * 1000);
      }

      let invoicePdf: string | null = null;
      let invoiceUrl: string | null = null;

      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 10,
      });

      const paidInvoice = invoices.data.find(
        (inv) => inv.status === "paid" && inv.amount_paid > 0
      );

      if (paidInvoice) {
        invoicePdf = paidInvoice.invoice_pdf || null;
        invoiceUrl = paidInvoice.hosted_invoice_url || null;
      } else {
        const fallbackInvoice = invoices.data.find((inv) => inv.invoice_pdf);
        if (fallbackInvoice) {
          invoicePdf = fallbackInvoice.invoice_pdf;
          invoiceUrl = fallbackInvoice.hosted_invoice_url;
        }
      }

      // Using adminDB instead of db
      const subsRef = adminDB.collection("subscriptions");

      // Find subscription by subscriptionId
      const snapshot = await subsRef
        .where("subscriptionId", "==", subscription.id)
        .get();

      if (!snapshot.empty) {
        const subDoc = snapshot.docs[0].ref;

        await subDoc.update({
          invoicePdf,
          invoiceUrl,
        });
      }

      let paymentMethodDetails = null;

      const paymentIntents = await stripe.paymentIntents.list({
        customer: subscription.customer as string,
        limit: 1,
      });
      const fallbackPaymentIntentId = paymentIntents.data[0]?.id;

      const paymentIntent = await stripe.paymentIntents.retrieve(
        fallbackPaymentIntentId,
        {
          expand: ["payment_method"],
        }
      );

      paymentMethodDetails = paymentIntent.payment_method;

      return NextResponse.json({
        planName: product.name,
        price: price.unit_amount ? price.unit_amount / 100 : null,
        billing: price.recurring?.interval || null,
        status: subscription.status,
        startDate,
        endDate,
        invoicePdf,
        invoiceUrl,
        subscription: subscription,
        freeTrialPeriod,
        fallbackPaymentIntentId,
        paymentMethod: paymentMethodDetails,
      });
    }

    if (action === "cancel-addon") {
      if (!addonSubscriptionId) {
        throw new Error("Addon subscription ID is required");
      }
      const addon = (userData.addons || []).find(
        (a: any) => a.subscriptionId === addonSubscriptionId
      );
      const subscription = await stripe.subscriptions.retrieve(
        addonSubscriptionId,
        {
          expand: ["latest_invoice"],
        }
      );

      // Cancel addon at period end
      await stripe.subscriptions.update(addonSubscriptionId, {
        cancel_at_period_end: true,
      });

      const refunds = [];
      const chargesList = await stripe.charges.list({
        customer: userData.stripeCustomerId,
        limit: 50, // increase if needed
      });

      const paymentIntent = await stripe.paymentIntents.retrieve(
        addon.paymentIntentId
      );

      const chargeId = paymentIntent.latest_charge;
      //@ts-ignore
      const refund = await stripe.refunds.create({ charge: chargeId });
      refunds.push(refund);
      // Update Firestore
      // await updateDoc(userRef, {
      //   addons: (userData.addons || []).filter(
      //     (a: any) => a.subscriptionId !== addonSubscriptionId
      //   ),
      //   addonsRefund: { ...userData.addonsRefund, ...refunds },
      // });

      await userRef.update({
        addons: (userData.addons || []).filter(
          (a: any) => a.subscriptionId !== addonSubscriptionId
        ),
        addonsRefund: { ...userData.addonsRefund, ...refunds },
      });

      return NextResponse.json({
        message: "Addon canceled and refunded successfully.",
        refunds,
      });
    }

    throw new Error("Invalid action");
  } catch (err: any) {
    console.error("Subscription error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 400 }
    );
  }
}
