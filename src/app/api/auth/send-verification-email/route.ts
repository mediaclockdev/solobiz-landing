import { NextResponse } from "next/server";
import { adminAuth } from "@/services/firebaseAdmin";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, name, baseUrl } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 },
      );
    }

    const landingBaseUrl = (
      baseUrl ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://solobiz-landing.vercel.app"
    ).replace(/\/$/, "");

    const continueUrl = `${landingBaseUrl}/login?verified=true`;

    // Generate Firebase verification link using Firebase Admin SDK
    const firebaseLink = await adminAuth.generateEmailVerificationLink(email);

    const parsedUrl = new URL(firebaseLink);
    const oobCode = parsedUrl.searchParams.get("oobCode");

    if (!oobCode) {
      throw new Error("Could not extract verification code from generated link");
    }

    // The direct link to our landing page verification handler
    const directVerifyUrl = `${landingBaseUrl}/verify-email?mode=verifyEmail&oobCode=${oobCode}`;

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn("SMTP credentials not configured, returning generated link");
      return NextResponse.json({
        success: true,
        sent: false,
        fallbackLink: directVerifyUrl,
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"Solo Biz Cards" <${smtpUser}>`,
      to: email,
      subject: "Verify your email for Solo Biz Cards",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e5e5; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <span style="font-size: 24px; font-weight: 800; color: #18181b; letter-spacing: -0.5px;">solo</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 12px;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a;">Verify Your Email</h1>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 28px;">
                      <p style="margin: 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                        Hi ${name ? name.split(" ")[0] : "there"}, thank you for joining Solo Biz Cards! Please confirm your email address to get started.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 28px;">
                      <a href="${directVerifyUrl}" style="display: inline-block; background-color: #212121; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        Verify Email Address
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                      <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                        If the button above does not work, copy and paste this link into your browser:
                        <br />
                        <a href="${directVerifyUrl}" style="color: #64748b; word-break: break-all;">${directVerifyUrl}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true, sent: true });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    const msg = String(error?.message || "");
    const isRateLimit =
      msg.includes("TOO_MANY_ATTEMPTS_TRY_LATER") ||
      error?.code === "auth/too-many-requests";

    if (isRateLimit) {
      return NextResponse.json(
        {
          error:
            "Too many verification attempts. Verification emails are temporarily rate-limited by Firebase. Please wait a few minutes before trying again.",
          code: "TOO_MANY_ATTEMPTS_TRY_LATER",
          sent: false,
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to send verification email" },
      { status: 500 },
    );
  }
}
