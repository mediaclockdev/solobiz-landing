import { NextResponse } from "next/server";
import { adminDB } from "@/services/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ card_id: string }> }
) {
  const { card_id } = await params;

  if (!card_id) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_LIVE_URL}`);
  }

  const snap = await adminDB
    .collection("nfc_cards")
    .where("card_id", "==", card_id)
    .limit(1)
    .get();

  // NFC card not found
  if (snap.empty) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_LIVE_URL}`);
  }

  const docRef = snap.docs[0].ref;
  const nfc = snap.docs[0].data();

  // UNCLAIMED → Activate flow
  if (nfc.status === "unclaimed") {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_LIVE_URL}/activate/${card_id}`
    );
  }

  // INACTIVE → Show message
  if (nfc.status === "disabled") {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Card Inactive</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #f9fafb;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: #fff;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #dc2626;
              margin-bottom: 10px;
            }
            p {
              color: #555;
              font-size: 15px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Card Inactive</h1>
            <p>
              Your card is currently inactive.<br /><br />
              Please activate your card from the settings configuration
              or contact the administrator for assistance.
            </p>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }

  // ACTIVE → Redirect to business card
  if (nfc.status === "active") {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    await docRef.update({
      view_count: FieldValue.increment(1),
      [`tapCountsByMonth.${monthKey}`]: FieldValue.increment(1),
      last_tapped_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_LIVE_URL}/${nfc.business_card_url}`
    );
  }

  // fallback
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_API_LIVE_URL}`);
}
