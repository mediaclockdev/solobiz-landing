import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { adminDB } from "@/services/firebaseAdmin";
import { Message } from "@mui/icons-material";

export async function POST(req: Request) {
  try {
    const { invoiceNumber, stage, description } = await req.json();

    // Fetch parent document (example: user_orders)
    const snap = await adminDB.collection("orders").get();

    let foundInvoice: any = null;

    snap.forEach((doc) => {
      const data = doc.data();
      const invoices = data.accessory_invoices || [];

      const match = invoices.find(
        (inv: any) => inv.invoiceNumber === invoiceNumber,
      );

      if (match) {
        foundInvoice = match;
      }
    });

    if (!foundInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Send email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const stageLabel = stage.toUpperCase();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Status Update</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:#111827; padding:20px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:22px;">
                Solo Biz Cards, LLC.
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              <h2 style="color:#111827; margin-top:0;">
                Order Status Update
              </h2>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                Hello <strong>${
                  foundInvoice.customerInfo?.name ?? "Customer"
                }</strong>,
              </p>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                We wanted to let you know that the status of your order has been updated.
              </p>

              <!-- Order Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:6px; padding:15px; margin:20px 0;">
                <tr>
                  <td style="color:#111827; font-size:14px; padding-bottom:8px;">
                    <strong>Invoice Number:</strong>
                  </td>
                  <td style="color:#374151; font-size:14px; text-align:right;">
                    ${foundInvoice.invoiceNumber}
                  </td>
                </tr>
                <tr>
                  <td style="color:#111827; font-size:14px; padding-top:8px;">
                    <strong>Status:</strong>
                  </td>
                  <td style="color:#16a34a; font-size:14px; text-align:right; font-weight:bold;">
                    ${stageLabel}
                  </td>
                </tr>
              </table>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                ${description}
              </p>

             <p style="color:#374151; font-size:15px; line-height:1.6;">
                If you have any questions, feel free to reply to this email or contact our
                <a href="${process.env.NEXT_PUBLIC_API_LIVE_URL}dashboard/support">support team</a>.
              </p>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                Thank you for shopping with us! 🙌
              </p>

              <p style="margin-top:30px; color:#111827; font-size:14px;">
                <a href="https://solobizcards.com" style="color:#111827; text-decoration:none;"><strong>Solo Biz Cards, LLC.</strong></a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6; padding:15px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#6b7280;">
                © ${new Date().getFullYear()} Solo Biz Cards, LLC. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    await transporter.sendMail({
      from: `"Solo Biz Cards, LLC" <${process.env.SALES_EMAIL}>`,
      to: foundInvoice.customerInfo.email,
      replyTo: foundInvoice.customerInfo.email,
      cc: process.env.BILLING_EMAIL,
      subject: `Your order is ${stageLabel}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to send email", Message: error?.message },
      { status: 500 },
    );
  }
}
