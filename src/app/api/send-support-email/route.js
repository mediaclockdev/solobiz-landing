import nodemailer from "nodemailer";
import { db } from "@/services/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export async function POST(req) {
  try {
    const {
      userName,
      userEmail,
      issueDescription,
      subject,
      action = "Support",
    } = await req.json();

    // Validate input
    if (!userName || !userEmail || !issueDescription) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    // Configure transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email HTML template
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color:#2563eb;">${action} Page Message </h2>
        <p><strong>User Name:</strong> ${userName}</p>
        <p><strong>User Email:</strong> ${userEmail}</p>
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ""}
        <p><strong>Description:</strong></p>
        <div style="background:#f9fafb; padding:10px; border-radius:6px;">
          ${issueDescription}
        </div>
        <p style="margin-top:20px; color:#888; font-size:13px;">
          This email was generated automatically by the Support form.
        </p>
      </div>
    `;

    const e =
      action === "Support"
        ? process.env.SUPPORT_EMAIL
        : process.env.CONTACT_EMAIL;

    await transporter.sendMail({
      from: `"${action} Form" <${e}>`,
      to: `${e}`,
      replyTo: userEmail,
      subject: `[${action}] Message from ${userName}'s - ${
        subject || "No Subject"
      }`,
      html: htmlTemplate,
    });

    // Save issue in Firestore
    const supportCollection = collection(db, "support_data");
    await addDoc(supportCollection, {
      userName,
      userEmail,
      subject: subject || "",
      issueDescription,
      source: action,
      createdAt: new Date().toISOString(),
    });

    // Optional: Update count tracker (if you still need it)
    // const docRef = doc(db, "support_metadata", "summary");
    // const docSnap = await getDoc(docRef);

    // if (docSnap.exists()) {
    //   const currentCount = docSnap.data().count || 0;
    //   await updateDoc(docRef, { count: currentCount + 1 });
    // } else {
    //   await setDoc(docRef, { count: 1 });
    // }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Email send error:", error);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
    });
  }
}
