import Stripe from "stripe";
import { NextResponse } from "next/server";
import { adminDB } from "@/services/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const userRef = adminDB.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data() as any;

    // ✅ Validate existing Stripe customer or create a new one
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

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
    });

    return NextResponse.json({
      setupClientSecret: setupIntent.client_secret,
    });
  } catch (error: any) {
    console.error("create-setup-intent error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create setup intent" },
      { status: 500 }
    );
  }
}
