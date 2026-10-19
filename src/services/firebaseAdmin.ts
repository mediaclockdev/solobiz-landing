import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail:
        process.env.FIREBASE_CLIENT_EMAIL ||
        process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
      privateKey: (
        process.env.FIREBASE_PRIVATE_KEY ||
        process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY
      )
        ?.replace(/^"|"$/g, "")
        .replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminAuth = admin.auth();
export const adminDB = admin.firestore();
export const adminStorage = admin.storage();
export const adminBucket = admin.storage().bucket();
