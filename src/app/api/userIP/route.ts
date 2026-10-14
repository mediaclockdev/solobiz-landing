import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");

    let ip = forwarded?.split(",")[0].trim() || realIp || null;

    if (!ip || ip === "127.0.0.1" || ip === "::1") {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      ip = data.ip;
    }

    return NextResponse.json({ ip: ip }, { status: 200 });
  } catch (error) {
    console.error("Server crashed:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
