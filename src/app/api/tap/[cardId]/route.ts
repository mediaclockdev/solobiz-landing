import { NextResponse } from "next/server";
import { adminDB } from "@/services/firebaseAdmin";
import admin from "firebase-admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  // Find card by metadata.id
  const cardsRef = adminDB.collection("cards");
  const querySnapshot = await cardsRef
    .where("metadata.id", "==", cardId)
    .limit(1)
    .get();

  // Card not found
  if (querySnapshot.empty) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_LIVE_URL}/invalid`
    );
  }

  const docSnap = querySnapshot.docs[0];
  const cardRef = docSnap.ref;
  const card = docSnap.data();

  // Card not active
  if (card.status !== "active") {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_LIVE_URL}/disabled`
    );
  }

  // Update tap analytics
  await cardRef.update({
    view_count: admin.firestore.FieldValue.increment(1),
    last_tapped_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Redirect to destination
  return NextResponse.redirect(card.redirectUrl);
}
