import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";

export default async function manifest({
  params,
}: {
  params: Promise<{ cardUrlName: string }>;
}) {
  const { cardUrlName } = await params;

  let title = "Solo Biz Card";

  try {
    const q = query(
      collection(db, "cards"),
      where("urlName", "==", cardUrlName),
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      title = data?.title || title;
    }
  } catch (error) {
    console.error("Manifest fetch error:", error);
  }

  const iconUrl = `/api/card-icon/${cardUrlName}`;

  return {
    name: title,
    short_name: title,
    start_url: `/${cardUrlName}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",

    icons: [
      {
        src: iconUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: iconUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],

    shortcuts: [
      {
        name: title,
        short_name: title,
        url: `/${cardUrlName}`,
        icons: [
          {
            src: iconUrl,
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
