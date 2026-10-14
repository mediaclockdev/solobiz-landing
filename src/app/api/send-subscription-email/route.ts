import { NextResponse } from "next/server";
import { sendSubscriptionEmails } from "@/services/subscriptionEmail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerEmail,
      customerName,
      userId,
      plan,
      price,
      billing,
      subscriptionId,
      paymentIntentId,
      startDate,
      endDate,
      invoiceUrl,
      invoicePdf,
    } = body;

    if (!customerEmail || !plan || !subscriptionId) {
      return NextResponse.json(
        { error: "Missing required fields (customerEmail, plan, subscriptionId)" },
        { status: 400 }
      );
    }

    const result = await sendSubscriptionEmails({
      customerEmail,
      customerName,
      userId,
      plan,
      price: price ?? 0,
      billing: billing || "monthly",
      subscriptionId,
      paymentIntentId,
      startDate: startDate || new Date(),
      endDate,
      invoiceUrl,
      invoicePdf,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("send-subscription-email route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send subscription emails" },
      { status: 500 }
    );
  }
}
