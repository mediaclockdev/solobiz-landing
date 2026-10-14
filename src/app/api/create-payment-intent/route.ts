import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  try {
    const { items, currency, leadExport } = await req.json();

    /* ------------------------------------------------------------------
     * LEAD EXPORT  (referrals client point b2)
     * ------------------------------------------------------------------
     * A one-time charge for a grandchild CSV, priced server-side as
     * perLeadFee x leadCount. Handled before the accessories path below
     * because that one creates a Stripe Product AND Price per line item,
     * which is pointless API traffic for a single intangible download.
     *
     * The amount is recomputed here rather than trusted from the client,
     * so a tampered request cannot set its own price.
     * ------------------------------------------------------------------ */
    if (leadExport) {
      const leadCount = Number(leadExport.leadCount);
      const perLeadFee = Number(leadExport.perLeadFee);

      if (
        !Number.isInteger(leadCount) ||
        leadCount < 1 ||
        !Number.isFinite(perLeadFee) ||
        perLeadFee <= 0
      ) {
        return NextResponse.json(
          { error: "Invalid lead export request" },
          { status: 400 },
        );
      }

      const amount = Math.round(leadCount * perLeadFee * 100);

      // Stripe rejects anything under 50 cents on USD.
      if (amount < 50) {
        return NextResponse.json(
          { error: "Total is below the minimum chargeable amount" },
          { status: 400 },
        );
      }

      const leadIntent = await stripe.paymentIntents.create({
        amount,
        currency: currency || "usd",
        metadata: {
          source: "lead_export",
          uid: leadExport.uid ?? "",
          leadCount: String(leadCount),
          perLeadFee: String(perLeadFee),
        },
      });

      return NextResponse.json({ clientSecret: leadIntent.client_secret });
    }

    let totalAmount = 0;

    for (const item of items) {
      /* -----------------------------------
       * 1️⃣ Create Stripe Product
       * ----------------------------------- */
      const product = await stripe.products.create({
        name: item.name,
        description: item.selectedCard
          ? `Card: ${item.selectedCard}`
          : "Accessory",
        metadata: {
          type: item.type,
          color: item.color,
        },
      });

      /* -----------------------------------
       * 2️⃣ Create Stripe Price
       * ----------------------------------- */
      await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(item.unitPrice * 100),
        currency,
      });

      totalAmount += item.unitPrice * item.quantity;
    }

    /* -----------------------------------
     * 3️⃣ Create PaymentIntent
     * ----------------------------------- */
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency,
      metadata: {
        source: "accessories_checkout",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
