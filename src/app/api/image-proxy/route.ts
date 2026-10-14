import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("Missing image URL", { status: 400 });
    }

    const response = await fetch(imageUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: 500 });
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}
