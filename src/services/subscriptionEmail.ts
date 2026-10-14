import nodemailer from "nodemailer";

interface SubscriptionEmailParams {
  customerEmail: string;
  customerName?: string;
  userId?: string;
  plan: string;
  price: number | string;
  billing: string;
  subscriptionId: string;
  paymentIntentId?: string | null;
  startDate?: Date | string;
  endDate?: Date | string;
  invoiceUrl?: string | null;
  invoicePdf?: string | null;
}

export async function sendSubscriptionEmails(params: SubscriptionEmailParams) {
  const {
    customerEmail,
    customerName = "Valued Customer",
    userId = "N/A",
    plan,
    price,
    billing,
    subscriptionId,
    paymentIntentId = "N/A",
    startDate,
    endDate,
    invoiceUrl,
    invoicePdf,
  } = params;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(
      "⚠️ SMTP credentials (SMTP_USER / SMTP_PASS) not configured. Skipping subscription email dispatch."
    );
    return { success: false, reason: "SMTP not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const logoUrl =
    process.env.NEXT_PUBLIC_API_LIVE_URL + "/lovable-uploads/6e79eba6-9505-44d3-9af1-e8b13b7c46d0.png";

  const liveUrl =
    process.env.NEXT_PUBLIC_API_LIVE_URL || "https://dash.solobizcards.com/";

  const formatDate = (d?: Date | string) => {
    if (!d) return "N/A";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return String(d);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  const formattedPrice =
    typeof price === "number" ? `$${price.toFixed(2)}` : `$${price}`;
  const billingCycleFormatted =
    billing.charAt(0).toUpperCase() + billing.slice(1);
  const currentYear = new Date().getFullYear();

  // -----------------------------------------------------------
  // 📧 1. CUSTOMER EMAIL TEMPLATE
  // -----------------------------------------------------------
  const customerEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Subscription Confirmation</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#333;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:30px 10px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06); border:1px solid #e5e7eb;">
            
            <!-- Brand Header -->
            <tr>
              <td style="padding:32px 24px; text-align:center; background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
                <img src="${logoUrl}" alt="SoloBizCards" style="width:110px; margin-bottom:12px; border-radius:10px;" />
                <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:700; letter-spacing:-0.5px;">
                  Subscription Activated 🎉
                </h1>
                <p style="color:#94a3b8; margin:6px 0 0 0; font-size:14px;">
                  Thank you for your purchase!
                </p>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding:32px 28px;">
                <p style="font-size:16px; color:#1e293b; margin:0 0 16px 0; line-height:1.5;">
                  Hi <strong>${customerName}</strong>,
                </p>
                <p style="font-size:15px; color:#475569; margin:0 0 24px 0; line-height:1.6;">
                  We are delighted to confirm that your subscription to <strong>SoloBizCards</strong> is now active. You have full access to your plan's features and perks.
                </p>

                <!-- Subscription Summary Box -->
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px; margin-bottom:24px;">
                  <h3 style="margin:0 0 16px 0; font-size:16px; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">
                    Subscription Details
                  </h3>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                    <tr>
                      <td style="padding:6px 0; color:#64748b;">Plan:</td>
                      <td align="right" style="padding:6px 0; color:#0f172a; font-weight:600;">${plan}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; color:#64748b;">Billing Cycle:</td>
                      <td align="right" style="padding:6px 0; color:#0f172a; font-weight:600;">${billingCycleFormatted}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; color:#64748b;">Amount:</td>
                      <td align="right" style="padding:6px 0; color:#10b981; font-weight:700; font-size:15px;">${formattedPrice}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; color:#64748b;">Status:</td>
                      <td align="right" style="padding:6px 0;">
                        <span style="background:#dcfce7; color:#15803d; font-weight:600; padding:2px 8px; border-radius:12px; font-size:12px;">Active</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; color:#64748b;">Start Date:</td>
                      <td align="right" style="padding:6px 0; color:#0f172a;">${formattedStartDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; color:#64748b;">Next Renewal / End Date:</td>
                      <td align="right" style="padding:6px 0; color:#0f172a;">${formattedEndDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; color:#64748b;">Subscription ID:</td>
                      <td align="right" style="padding:6px 0; color:#64748b; font-family:monospace; font-size:12px;">${subscriptionId}</td>
                    </tr>
                  </table>
                </div>

                ${
                  invoiceUrl || invoicePdf
                    ? `
                <!-- Invoice Actions -->
                <div style="margin-bottom:24px; text-align:center;">
                  <a href="${invoiceUrl || invoicePdf}" target="_blank" style="display:inline-block; padding:10px 20px; background:#f1f5f9; color:#334155; text-decoration:none; border-radius:6px; font-weight:600; font-size:13px; border:1px solid #cbd5e1;">
                    📄 View / Download Invoice
                  </a>
                </div>`
                    : ""
                }

                <!-- Primary CTA -->
                <div style="text-align:center; margin:28px 0 20px 0;">
                  <a href="${liveUrl}dashboard/settings?tab=subscriptions" target="_blank" style="display:inline-block; padding:12px 28px; background:#4f46e5; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; box-shadow:0 2px 8px rgba(79,70,229,0.3);">
                    Manage Your Subscription
                  </a>
                </div>

                <p style="font-size:14px; color:#64748b; line-height:1.5; margin-top:24px;">
                  If you have any questions about your account or subscription, please reach out to our <a href="${liveUrl}dashboard/support" style="color:#4f46e5; text-decoration:underline;">Support Team</a> anytime.
                </p>
                <p style="font-size:14px; color:#1e293b; margin:20px 0 0 0;">
                  Warm regards,<br />
                  <strong>The SoloBizCards Team</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px; background:#f8fafc; border-top:1px solid #f1f5f9; text-align:center; font-size:12px; color:#94a3b8;">
                <p style="margin:0;">
                  © ${currentYear} SoloBizCards, LLC. All rights reserved.
                </p>
                <p style="margin:4px 0 0 0;">
                  This is an automated receipt for your SoloBizCards subscription.
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

  // -----------------------------------------------------------
  // 🔔 2. ADMIN EMAIL TEMPLATE
  // -----------------------------------------------------------
  const adminEmailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Subscription Alert</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#333;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:30px 10px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06); border:1px solid #e5e7eb;">
            
            <!-- Admin Header -->
            <tr>
              <td style="padding:28px 24px; text-align:center; background:#0f172a;">
                <img src="${logoUrl}" alt="SoloBizCards" style="width:100px; margin-bottom:10px; border-radius:10px;" />
                <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:700;">
                  🔔 New Subscription Purchased
                </h1>
                <p style="color:#94a3b8; margin:6px 0 0 0; font-size:13px;">
                  SoloBizCards Admin Notification
                </p>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding:28px;">
                <p style="font-size:15px; color:#1e293b; margin:0 0 18px 0; line-height:1.5;">
                  A user has successfully purchased a new subscription. Below are the full details:
                </p>

                <!-- Customer Details Box -->
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:18px;">
                  <h4 style="margin:0 0 12px 0; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; color:#475569;">
                    Customer Information
                  </h4>
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                    <tr>
                      <td style="padding:4px 0; color:#64748b;">Customer Name:</td>
                      <td align="right" style="padding:4px 0; color:#0f172a; font-weight:600;">${customerName}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0; color:#64748b;">Customer Email:</td>
                      <td align="right" style="padding:4px 0; color:#0f172a; font-weight:600;"><a href="mailto:${customerEmail}" style="color:#4f46e5;">${customerEmail}</a></td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0; color:#64748b;">User ID:</td>
                      <td align="right" style="padding:4px 0; color:#64748b; font-family:monospace; font-size:12px;">${userId}</td>
                    </tr>
                  </table>
                </div>

                <!-- Subscription Details Box -->
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:20px;">
                  <h4 style="margin:0 0 12px 0; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; color:#475569;">
                    Purchase & Plan Info
                  </h4>
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                    <tr>
                      <td style="padding:4px 0; color:#64748b;">Plan:</td>
                      <td align="right" style="padding:4px 0; color:#0f172a; font-weight:600;">${plan}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0; color:#64748b;">Billing:</td>
                      <td align="right" style="padding:4px 0; color:#0f172a; font-weight:600;">${billingCycleFormatted}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0; color:#64748b;">Amount:</td>
                      <td align="right" style="padding:4px 0; color:#10b981; font-weight:700;">${formattedPrice}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0; color:#64748b;">Subscription ID:</td>
                      <td align="right" style="padding:4px 0; color:#0f172a; font-family:monospace; font-size:12px;">${subscriptionId}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0; color:#64748b;">Payment Intent ID:</td>
                      <td align="right" style="padding:4px 0; color:#64748b; font-family:monospace; font-size:12px;">${paymentIntentId}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0; color:#64748b;">Start Date:</td>
                      <td align="right" style="padding:4px 0; color:#0f172a;">${formattedStartDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0; color:#64748b;">End Date:</td>
                      <td align="right" style="padding:4px 0; color:#0f172a;">${formattedEndDate}</td>
                    </tr>
                  </table>
                </div>

                ${
                  invoiceUrl || invoicePdf
                    ? `
                <div style="margin-bottom:20px; text-align:center;">
                  <a href="${invoiceUrl || invoicePdf}" target="_blank" style="display:inline-block; padding:8px 16px; background:#f1f5f9; color:#334155; text-decoration:none; border-radius:6px; font-weight:600; font-size:13px; border:1px solid #cbd5e1;">
                    📄 View Stripe Invoice
                  </a>
                </div>`
                    : ""
                }

                <p style="font-size:13px; color:#94a3b8; margin:20px 0 0 0;">
                  -- Automated Admin Notification | SoloBizCards
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px; background:#f8fafc; border-top:1px solid #f1f5f9; text-align:center; font-size:12px; color:#94a3b8;">
                © ${currentYear} SoloBizCards Admin System
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const senderEmail =
    process.env.BILLING_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_USER;

  const adminEmail =
    process.env.ADMIN_EMAIL ||
    process.env.BILLING_EMAIL ||
    process.env.SALES_EMAIL ||
    process.env.SMTP_USER;

  const results = {
    customerEmailSent: false,
    adminEmailSent: false,
  };

  // 📤 Send to Customer
  if (customerEmail) {
    try {
      await transporter.sendMail({
        from: `"Solo Biz Cards, LLC" <${process.env.BILLING_EMAIL}>`,
        //from: `"SoloBizCards" <${process.env.BILLING_EMAIL}>`,
        to: customerEmail,
        replyTo: senderEmail,
        subject: `🎉 Subscription Confirmation - ${plan}`,
        html: customerEmailHtml,
      });
      results.customerEmailSent = true;
      console.log(`✅ Subscription confirmation email sent to customer: ${customerEmail}`);
    } catch (customerErr) {
      console.error("❌ Failed to send subscription email to customer:", customerErr);
    }
  }

  // 📤 Send to Admin
  if (adminEmail) {
    try {
      await transporter.sendMail({
        from: `"Solo Biz Cards, LLC" <${process.env.SALES_EMAIL}>`,
        //from: `"SoloBizCards System" <${process.env.SALES_EMAIL}>`,
        to: adminEmail,
        replyTo: customerEmail,
        subject: `🔔 New Subscription Purchased: ${plan} by ${customerName}`,
        html: adminEmailHtml,
      });
      results.adminEmailSent = true;
      console.log(`✅ Subscription notification email sent to admin: ${adminEmail}`);
    } catch (adminErr) {
      console.error("❌ Failed to send subscription email to admin:", adminErr);
    }
  }

  return { success: true, ...results };
}
