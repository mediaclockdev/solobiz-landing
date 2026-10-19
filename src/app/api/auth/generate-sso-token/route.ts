import { NextResponse } from "next/server";
import { adminAuth } from "@/services/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json(
        { error: "User UID is required" },
        { status: 400 },
      );
    }
    // Generate single-use / short-lived Firebase custom token for this user
    const customToken = await adminAuth.createCustomToken(uid);
    return NextResponse.json({ token: customToken });
  } catch (error: any) {
    console.error("Error creating SSO token:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create token" },
      { status: 500 },
    );
  }
}
