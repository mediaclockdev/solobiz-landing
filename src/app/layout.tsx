import type { Metadata, ResolvingMetadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LifetimeOfferButton } from "@/components/ui/LifetimeOfferButton";
import "../styles/ShareModal.css";
import { Providers } from "@/providers/Providers";
import MainLayout from "@/components/MainLayout";
import Script from "next/script";

// Firebase imports (server-side)
import { db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";

export const dynamic = "force-dynamic"; // ⚡ force server-side rendering

const inter = Inter({ subsets: ["latin"] });

// Fully type-safe generateMetadata (Error)
// export async function generateMetadata(
//   _parent: ResolvingMetadata,
// ): Promise<Metadata> {

// Fully type-safe generateMetadata
export async function generateMetadata(): Promise<Metadata> {
  const CARD_DOC_ID = "mainCard";
  // let imageUrl = "/lovable-uploads/bf370590-9076-4ca0-8853-23a471ef1ede.png";

  let imageUrl =
    "https://firebasestorage.googleapis.com/v0/b/solobizcards-db.firebasestorage.app/o/cardPreviews%2Fogwebsite%2F1762320241293_1761454221996_OG_Logo-2.png?alt=media&token=ead42205-a373-4f0e-95c9-596cf7b99061";
  try {
    const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data?.ogImage?.url) {
        imageUrl = data.ogImage.url;
      } else if (data?.backupCard?.url) {
        imageUrl = data.backupCard.url;
      }
    }
  } catch (error) {
    console.error("Error fetching OG image from Firebase:", error);
  }

  const metadata: Metadata = {
    title: "Solo Business Cards",
    description: "Free! biz cards for small businesses",
    openGraph: {
      title: "Solo Business Cards",
      description: "Free! biz cards for small businesses",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Solo Business Card Preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Solo Business Cards",
      description: "Free! biz cards for small businesses",
      images: [imageUrl],
    },
  };

  return metadata;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* Google Analytics Script */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-F17PMPX18C"
        />
        {/* G-73MQDQ3M0P */}
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-F17PMPX18C');
          `}
        </Script>
        <Providers>
          <MainLayout>{children}</MainLayout>
          <Toaster />
          <Sonner />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
