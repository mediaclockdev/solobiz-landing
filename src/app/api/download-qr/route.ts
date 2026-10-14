import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const qrUrl = searchParams.get("url");
    const fileName = searchParams.get("name") || "qr-code.png";

    if (!qrUrl) {
      return NextResponse.json({ error: "Missing QR code URL" }, { status: 400 });
    }

    // Fetch the file from Firebase Storage
    const response = await fetch(qrUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return file as downloadable attachment
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/png",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error in download-qr API:", error);
    return NextResponse.json({ error: "Failed to download QR code" }, { status: 500 });
  }
}
