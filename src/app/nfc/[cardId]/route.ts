import { NextResponse } from "next/server";
import { adminDB } from "@/services/firebaseAdmin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  // Modify the query to find the card where metadata.id matches the cardId
  const cardsRef = adminDB.collection("cards");
  const querySnapshot = await cardsRef.where("metadata.id", "==", cardId).get();

  if (querySnapshot.empty) {
    return new Response(`Invalid card ${cardId}`, { status: 404 });
  }

  // Assuming only one card matches the query (metadata.id is unique)
  const card = querySnapshot.docs[0].data();

  console.log("card", card);

  // If the card is NOT claimed → go to activation page
  if (!card.claimed) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_LIVE_URL}/activate/${cardId}`
    );
  }

  // If card is claimed → open the business URL
  return NextResponse.redirect(card.businessUrl);
}
