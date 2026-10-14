"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/services/firebase";
import { db } from "@/services/firebase";
import {
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

export default function ActivatePage({
  params,
}: {
  params: Promise<{ card_id: string }>;
}) {
  const { card_id } = use(params);
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const run = async () => {
      if (!user) {
        router.push(`/login?redirect=/activate/${card_id}`);
        return;
      }

      try {
        const q = query(collection(db, "cards"), where("uid", "==", user.uid));
        const snap = await getDocs(q);
        const result = snap.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));
        setCards(result);
      } catch (err) {
        console.error("Failed to fetch cards", err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [card_id, router, user]);

  const activateCard = async () => {
    const selectedCard = cards.find((c) => c?.metadata?.id === selectedCardId);
    if (!selectedCard) return;

    try {
      setActivating(true);

      await fetch("/api/activate-nfc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid,
          Email: user?.email,
          card_id: card_id,
          // activated_at: serverTimestamp(),
          business_card_url: selectedCard?.urlName,
          status: "active",
        }),
      });

      router.push(
        `${process.env.NEXT_PUBLIC_API_LIVE_URL}/${selectedCard.urlName}`
      );
    } catch (err) {
      console.error("Activation failed", err);
      alert("Failed to activate card");
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border bg-white shadow-lg p-8 space-y-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground bg-primary/5 rounded-lg px-3 py-2 mb-4 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <img
              src="/lovable-uploads/solo-logo-icon.png"
              alt="Logo"
              className="h-16 w-auto"
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Activate your NFC card
            </h1>
            <p className="text-sm text-muted-foreground">
              Select a business card to link with your NFC
            </p>
          </div>

          {/* Content */}
          {cards.length === 0 && (
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No business cards found for your account.
              </p>
            </div>
          )}

          {cards.length > 0 && (
            <div className="space-y-4">
              {/* Dropdown */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Business Card
                </label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                >
                  <option value="">-- Select a card --</option>
                  {cards.map((card) => (
                    <option key={card?.metadata?.id} value={card?.metadata?.id}>
                      {card.urlName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activate Button */}
              <button
                disabled={!selectedCardId || activating}
                onClick={activateCard}
                className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {activating ? "Activating..." : "Activate Card"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Your Company. All rights reserved.
        </p>
      </div>
    </div>
  );
}
