import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { userId, userEmail, userName, preferences } = await req.json();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>User Notification Preferences Updated</h2>

        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>User Name:</strong> ${userName}</p>
        <p><strong>User Email:</strong> ${userEmail}</p>

        <h3 style="margin-top:20px;">Enabled Notifications</h3>
        <ul>
          <li>Email Notifications: <strong>${
            preferences.email ? "Enabled ✅" : "Disabled ❌"
          }</strong></li>
          <li>Order Updates: <strong>${
            preferences.orderUpdates ? "Enabled ✅" : "Disabled ❌"
          }</strong></li>
          <li>Marketing Emails: <strong>${
            preferences.marketing ? "Enabled ✅" : "Disabled ❌"
          }</strong></li>
        </ul>

        <p style="margin-top:20px; color:#888; font-size:13px;">
          This email was generated automatically when a user updated notification settings.
        </p>
      </div>
    `;
    await transporter.verify(); // 🔍 checks SMTP connection

    await transporter.sendMail({
      from: `"SoloBizCards" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: userEmail,
      subject: `Notification Settings Updated by ${userName}`,
      html: htmlTemplate,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin notification error:", error);
    return NextResponse.json(
      { error: "Failed to send email", message: error?.message },
      { status: 500 }
    );
  }
}
