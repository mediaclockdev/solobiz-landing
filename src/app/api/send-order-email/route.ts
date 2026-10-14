import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, customerName, invoiceNumber, total, items } =
      await req.json();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const itemsHtml = items
      .map(
        (item) => `
    <tr>
      <td style="padding:10px 0; color:#111827;">
        ${item.name}
      </td>
      <td align="center" style="color:#374151;">
        ${item.quantity}
      </td>
      <td align="right" style="color:#374151;">
        $${(item.unitPrice * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation</title>
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
                SoloBizCards
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              <h2 style="color:#111827; margin-top:0;">
                Thank you for your order 🎉
              </h2>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                Hi <strong>${customerName}</strong>,
              </p>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                We’ve received your order successfully. Here are the details:
              </p>

              <!-- Invoice Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:6px; padding:15px; margin:20px 0;">
                <tr>
                  <td style="font-size:14px; color:#111827;">
                    <strong>Invoice Number</strong>
                  </td>
                  <td align="right" style="font-size:14px; color:#374151;">
                    ${invoiceNumber}
                  </td>
                </tr>
              </table>

              <!-- Items -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <thead>
                  <tr>
                    <th align="left" style="border-bottom:1px solid #e5e7eb; padding-bottom:8px; color:#111827;">
                      Item
                    </th>
                    <th align="center" style="border-bottom:1px solid #e5e7eb; padding-bottom:8px; color:#111827;">
                      Qty
                    </th>
                    <th align="right" style="border-bottom:1px solid #e5e7eb; padding-bottom:8px; color:#111827;">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td style="font-size:16px; color:#111827;">
                    <strong>Total</strong>
                  </td>
                  <td align="right" style="font-size:16px; color:#16a34a; font-weight:bold;">
                    $${total.toFixed(2)}
                  </td>
                </tr>
              </table>

              <p style="margin-top:25px; color:#374151; font-size:15px; line-height:1.6;">
                Your order is currently being processed. We’ll notify you once it’s shipped.
              </p>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                If you have any questions, feel free to contact our <a href="${process.env.NEXT_PUBLIC_API_LIVE_URL}dashboard/support">support team</a>.
              </p>

              <p style="margin-top:30px; color:#111827; font-size:14px;">
                <strong>— <a href="${process.env.NEXT_PUBLIC_API_LIVE_URL}dashboard/support">SoloBizCards Team</a></strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6; padding:15px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#6b7280;">
                This is an automated email. Please do not reply.
              </p>
              <p style="margin:5px 0 0; font-size:12px; color:#6b7280;">
                © ${new Date().getFullYear()} SoloBizCards. All rights reserved.
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
      from: `"SoloBizCards" <${process.env.BILLING_EMAIL}>`,
      to: email,
      replyTo: email,
      subject: "Your Order Confirmation",
      html,
    });

    // 📩 Admin email
    await transporter.sendMail({
      from: `"SoloBizCards" <${process.env.SALES_EMAIL}>`,
      to: process.env.SALES_EMAIL,
      subject: "New Order Received",
      html: `
    <h2>New Order</h2>
    <p>Customer Email: ${email}</p>
    ${html}
  `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
