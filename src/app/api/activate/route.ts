import { NextResponse } from "next/server";
import { adminDB } from "@/services/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { email, cardId } = await req.json();

    if (!email || !cardId) {
      return NextResponse.json(
        { error: "Missing email or cardId" },
        { status: 400 }
      );
    }

    // Fetch card where metadata.id = cardId
    const cardSnap = await adminDB
      .collection("cards")
      .where("metadata.id", "==", cardId)
      .limit(1)
      .get();

    if (cardSnap.empty) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const cardDoc = cardSnap.docs[0];
    const cardData = cardDoc.data();
    const cardOwnerUid = cardData.uid;

    if (!cardOwnerUid) {
      return NextResponse.json({ error: "Card UID missing" }, { status: 400 });
    }

    // Fetch user by email
    const userSnap = await adminDB
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userDoc = userSnap.docs[0];
    const userId = userDoc.id;

    // Compare UID from card & UID from user
    if (userId !== cardOwnerUid) {
      return NextResponse.json(
        { error: "This card does not belong to this user" },
        { status: 403 }
      );
    }

    // Build business URL
    const fullCardId = cardData?.urlName ?? cardDoc.id;

    const businessUrl = `${process.env.NEXT_PUBLIC_API_LIVE_URL}/${fullCardId}`;

    // Activate card
    await adminDB.collection("cards").doc(cardDoc.id).update({
      claimed: true,
      assignedUserId: userId,
      businessUrl,
      claimedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      redirect: businessUrl,
    });
  } catch (err: any) {
    console.error("Activation Error:", err);
    return NextResponse.json(
      { error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}
