import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { clientEmail, adminEmail, userName, month, year, amount } =
      await req.json();

    if (
      !clientEmail ||
      !adminEmail ||
      !userName ||
      !month ||
      !year ||
      !amount
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Email Logo URL (replace with your main logo)
    const logoUrl =
      "https://dash.solobizcards.com/lovable-uploads/6e79eba6-9505-44d3-9af1-e8b13b7c46d0.png";

    // Nodemailer Transport Config
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // -----------------------------------------------------------
    // ⭐ CLIENT EMAIL TEMPLATE
    // -----------------------------------------------------------
    const clientEmailTemplate = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; padding:0; background:#f5f7fa; font-family:Arial, sans-serif;">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">
          
          <tr>
            <td style="padding:20px; text-align:center; background:#4f46e5;">
              <img src="${logoUrl}" alt="Logo" style="width:120px; margin-bottom:10px;border-radius:10px;" />
              <h2 style="color:#fff; margin:0;">Payment Confirmation</h2>
            </td>
          </tr>

          <tr>
            <td style="padding:25px; color:#333;">
              <h3>Hello ${userName},</h3>

              <p>We are excited to inform you that your earnings have been processed successfully.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td style="padding:8px 0; font-size:16px;">Month:</td>
                  <td style="padding:8px 0; font-size:16px;"><strong>${month} ${year}</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-size:16px;">Amount:</td>
                  <td style="padding:8px 0; font-size:16px; color:#10b981;"><strong>$${amount}</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-size:16px;">Status:</td>
                  <td style="padding:8px 0; font-size:16px; color:green;"><strong>Paid</strong></td>
                </tr>
              </table>

              <p style="margin-top:25px;">Thank you for being a valued contributor to our platform.</p>

              <p style="margin-top:30px; font-size:14px; color:#666;">
                If you have any questions, feel free to reply to this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:15px; background:#f1f2f6; text-align:center; font-size:12px; color:#888;">
              © ${year} SoloBizCards. All Rights Reserved.
            </td>
          </tr>

        </table>
      </body>
    </html>
    `;

    // -----------------------------------------------------------
    // ⭐ ADMIN EMAIL TEMPLATE
    // -----------------------------------------------------------
    const adminEmailTemplate = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; padding:0; background:#f5f7fa; font-family:Arial, sans-serif;">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">
          
          <tr>
            <td style="padding:20px; text-align:center; background:#1e293b;">
              <img src="${logoUrl}" alt="Logo" style="width:100px; margin-bottom:10px;border-radius:10px;" />
              <h2 style="color:#fff; margin:0;">Client Payment Notification</h2>
            </td>
          </tr>

          <tr>
            <td style="padding:25px; color:#333;">
              <h3>Payment Received</h3>

              <p>A client has completed a payment. Below are the details:</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td style="padding:8px 0; font-size:16px;">Client Name:</td>
                  <td style="padding:8px 0; font-size:16px;"><strong>${userName}</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-size:16px;">Month:</td>
                  <td style="padding:8px 0; font-size:16px;"><strong>${month} ${year}</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-size:16px;">Amount:</td>
                  <td style="padding:8px 0; font-size:16px; color:#10b981;"><strong>$${amount}</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-size:16px;">Status:</td>
                  <td style="padding:8px 0; font-size:16px; color:green;"><strong>Paid</strong></td>
                </tr>
              </table>

              <p style="margin-top:25px;">
                You may update the admin records or dashboard accordingly.
              </p>

              <p style="margin-top:30px; font-size:14px; color:#666;">
                -- System Notification
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:15px; background:#f1f2f6; text-align:center; font-size:12px; color:#888;">
              © ${year} SoloBizCards (Admin)
            </td>
          </tr>

        </table>
      </body>
    </html>
    `;

    // -----------------------------------------------------------
    // Send Emails
    // -----------------------------------------------------------

    // Email to client
    await transporter.sendMail({
      from: `"SoloBizCards" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      replyTo: clientEmail,
      subject: "🎉 Payment Confirmation",
      html: clientEmailTemplate,
    });

    // Email to admin
    await transporter.sendMail({
      from: `"SoloBizCards" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: "📩 Client Payment Notification",
      html: adminEmailTemplate,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send email",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
