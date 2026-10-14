import { NextResponse } from "next/server";
import sharp from "sharp";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cardUrlName: string }> }
) {
  const { cardUrlName } = await params;

  let profilePicture =
    "https://firebasestorage.googleapis.com/v0/b/solobizcards-db.firebasestorage.app/o/default.png?alt=media";

  try {
    const q = query(
      collection(db, "cards"),
      where("urlName", "==", cardUrlName)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      profilePicture = data?.profilePhoto || profilePicture;
    }

    const imageResponse = await fetch(profilePicture);
    const arrayBuffer = await imageResponse.arrayBuffer();

    const resized = await sharp(Buffer.from(arrayBuffer))
      .resize(512, 512)
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(resized), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Icon generation error:", error);

    return NextResponse.json(
      { error: "Icon generation failed" },
      { status: 500 }
    );
  }
}