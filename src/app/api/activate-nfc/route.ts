import { NextResponse } from "next/server";
import { adminDB } from "@/services/firebaseAdmin";
import admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const { card_id, business_card_url, userId, Email } = await req.json();
    const decodedId = decodeURIComponent(card_id);
    const snap = await adminDB
      .collection("nfc_cards")
      .where("card_id", "==", decodedId)
      .limit(1)
      .get();

    if (snap.empty) {
      console.error("No NFC card found for:", decodedId);
      return NextResponse.json(
        { error: "NFC card not found" },
        { status: 404 }
      );
    }

    const docRef = snap.docs[0].ref;

    await docRef.update({
      business_card_url: business_card_url,
      status: "active",
      activated_at: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId,
      Email: Email,
    });


    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Activation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
