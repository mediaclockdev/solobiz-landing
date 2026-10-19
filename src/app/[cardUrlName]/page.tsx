// ============================================================================
// COMMENTED OUT FOR FUNNEL-ONLY DEPLOYMENT:
// This repo only serves the welcome funnel (/, /login, /signup, /forgot).
// To restore this page, uncomment the code below.
// ============================================================================
// import type { Metadata, ResolvingMetadata } from "next";
// import CardDisplayClient from "./CardDisplayClient";
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   query,
//   where,
// } from "firebase/firestore";
// import { db } from "@/services/firebase";
// import { useState } from "react";
// 
// type Props = {
//   params: Promise<{ cardUrlName: string }>;
// };
// export async function generateMetadata(
//   { params }: Props,
//   _parent: ResolvingMetadata,
// ): Promise<Metadata> {
//   let cardId;
//   const { cardUrlName } = await params;
//   let profilePicture = "/lovable-uploads/logo_color_correct.png";
//   const cardsQuery = query(
//     collection(db, "cards"),
//     where("urlName", "==", cardUrlName),
//   );
//   const cardsSnapshot = await getDocs(cardsQuery);
// 
//   const CARD_DOC_ID = "mainCard";
//   //let imageUrl = "/lovable-uploads/bf370590-9076-4ca0-8853-23a471ef1ede.png";
//   let imageUrl =
//     "https://firebasestorage.googleapis.com/v0/b/solobizcards-db.firebasestorage.app/o/cardPreviews%2Fogwebsite%2F1762320241293_1761454221996_OG_Logo-2.png?alt=media&token=ead42205-a373-4f0e-95c9-596cf7b99061";
//   try {
//     const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
//     const docSnap = await getDoc(docRef);
// 
//     if (docSnap.exists()) {
//       const data = docSnap.data();
//       if (data?.backupCard?.url) {
//         imageUrl = data.backupCard.url;
//       } else if (data?.ogImage?.url) {
//         imageUrl = data.ogImage.url;
//       }
//     }
//   } catch (error) {
//     console.error("Error fetching OG image from Firebase:", error);
//   }
// 
//   // Default metadata (fallback)
//   let cardData: any = {
//     title: "Solo Biz Cards",
//     description:
//       "Digital business cards for solo entrepreneurs, small businesses and side hustlers.",
//     image: imageUrl,
//     url: `/card/${cardId}`,
//   };
// 
//   if (!cardsSnapshot.empty) {
//     const cardDoc = cardsSnapshot.docs[0];
//     const data = cardDoc.data();
//     profilePicture = data?.profilePhoto || imageUrl;
//     cardData = {
//       title: data.title,
//       profilePicture: data?.profilePhoto || imageUrl,
//       description:
//         "Digital business cards for solo entrepreneurs, small businesses and side hustlers.",
//       icons: {
//         icon: [
//           { url: data?.profilePhoto, sizes: "32x32", type: "image/*" },
//           { url: data?.profilePhoto, sizes: "192x192", type: "image/*" },
//           { url: data?.profilePhoto, sizes: "512x512", type: "image/*" },
//         ],
//         apple: [{ url: profilePicture, sizes: "180x180", type: "image/png" }],
//       },
//       image:
//         data?.profilePhoto && data?.profilePhoto != ""
//           ? data?.profilePhoto
//           : imageUrl,
//       url: data?.urlName ? `/${data.urlName}` : `/card/${cardId}`,
//     };
//   }
// 
//   return {
//     title: cardData.title,
//     description: cardData.description,
//     manifest: `/${cardUrlName}/manifest.webmanifest`,
//     icons: {
//       icon: [
//         {
//           url: `/api/card-icon/${cardUrlName}`,
//           sizes: "192x192",
//           type: "image/png",
//         },
//         {
//           url: `/api/card-icon/${cardUrlName}`,
//           sizes: "512x512",
//           type: "image/png",
//         },
//       ],
//       apple: [{ url: profilePicture, sizes: "180x180", type: "image/png" }],
//     },
//     openGraph: {
//       title: cardData.title,
//       description: cardData.description,
//       url: cardData.url,
//       images: [
//         {
//           url: cardData.image,
//           width: 1200,
//           height: 630,
//           alt: "Card Preview",
//         },
//       ],
//       type: "website",
//     },
//     twitter: {
//       card: "summary_large_image",
//       title: cardData.title,
//       description: cardData.description,
//       images: cardData.image,
//     },
//   };
// }
// 
// export default function CardDisplayPage() {
//   return <CardDisplayClient />;
// }
// 

import { redirect } from "next/navigation";

export default function DisabledRoute() {
  redirect("/");
  return null;
}
