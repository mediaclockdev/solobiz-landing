// app/api/vcard/[slug]/route.ts
import { NextResponse } from "next/server";
import { adminDB } from "@/services/firebaseAdmin";
import { BusinessCard } from "@/types/businessCard";
import { generateVCardServer } from "@/utils/businessCardServer";
 
/**
 * Fetch a card from Firestore by URL name
 */
async function getBusinessCardByUrlName(
  urlName: string
): Promise<BusinessCard | null> {
  try {
    // Try querying by urlName field
    const querySnapshot = await adminDB
      .collection("cards")
      .where("urlName", "==", urlName)
      .limit(1)
      .get();
   
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as BusinessCard;
    }
 
    // Fallback to checking by document ID
    const ref = adminDB.collection("cards").doc(urlName);
    const snap = await ref.get();
    if (snap.exists) {
      return snap.data() as BusinessCard;
    }
 
    return null;
  } catch (err) {
    console.error("[ERROR] Failed reading Firestore:", err);
    throw err;
  }
}
 
 
/**
 * GET /api/vcard/[slug] - Returns downloadable .vcf
 */
export async function GET(
  req: Request,
  { params }: { params: any }
) {
  try {
    const slug = params.slug;
    if (!slug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
 
    const card = await getBusinessCardByUrlName(slug);
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
 
    // Generate vCard server-side
    const vCardText = generateVCardServer(card);
 
    return new NextResponse(vCardText, {
      status: 200,
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${
          card.urlName || "contact"
        }.vcf"`,
      },
    });
  } catch (error) {
    console.error("[SERVER ERROR] vCard API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}