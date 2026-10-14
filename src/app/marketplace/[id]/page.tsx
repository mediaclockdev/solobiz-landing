import AdsDisplayClient from "./AdsDisplayClient";
import type { Metadata, ResolvingMetadata } from "next";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;

  let profilePicture = "/lovable-uploads/logo_color_correct.png";

  // ✅ Correct collection reference
  const cardsRef = collection(db, "marketplace_ads");
  const cardsSnapshot = await getDocs(cardsRef);

  const CARD_DOC_ID = "mainCard";

  let imageUrl =
    "https://firebasestorage.googleapis.com/v0/b/solobizcards-db.firebasestorage.app/o/cardPreviews%2Fogwebsite%2Fdefault.png?alt=media";

  try {
    const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      if (data?.backupCard?.url) {
        imageUrl = data.backupCard.url;
      } else if (data?.ogImage?.url) {
        imageUrl = data.ogImage.url;
      }
    }
  } catch (error) {
    console.error("Error fetching OG image:", error);
  }

  // Default fallback metadata
  let cardData: any = {
    title: "Solo Biz Cards",
    description:
      "Digital business cards for solo entrepreneurs, small businesses and side hustlers.",
    image: imageUrl,
    url: `/marketplace/${id}`,
  };

  // ✅ Find specific document by id
  const adDocRef = doc(db, "marketplace_ads", id);
  const adDocSnap = await getDoc(adDocRef);

  if (adDocSnap.exists()) {
    const data = adDocSnap.data();

    profilePicture = data?.image || profilePicture;

    cardData = {
      title: data?.title || "Solo Biz Cards",
      description:
        data?.description || "Digital business cards for solo entrepreneurs.",
      image: data?.image || imageUrl,
      url: `/marketplace/${id}`,
    };
  }

  return {
    title: cardData.title,
    description: cardData.description,
    icons: {
      icon: profilePicture,
      shortcut: profilePicture,
      apple: profilePicture,
    },
    openGraph: {
      title: cardData.title,
      description: cardData.description,
      url: cardData.url,
      images: [
        {
          url: cardData.image,
          width: 1200,
          height: 630,
          alt: "Card Preview",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: cardData.title,
      description: cardData.description,
      images: [cardData.image],
    },
  };
}

export default function MarketplaceDetailsPage() {
  return <AdsDisplayClient />;
}
