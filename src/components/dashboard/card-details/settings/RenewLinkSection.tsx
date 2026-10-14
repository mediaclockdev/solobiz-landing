"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@/lib/navigation";
import {
  doc,
  updateDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";

interface RenewLinkSectionProps {
  cardId: string;
  card: any;
}

export function RenewLinkSection({ cardId, card }: RenewLinkSectionProps) {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newUrlName, setNewUrlName] = useState("");
  const { showToast } = useToast();
  const router = useRouter();

  const renewLink = async () => {
    try {
      if (!newUrlName.trim()) {
        showToast("Please enter a new link name", "error");
        return;
      }

      setLoading(true);
      const existingQuery = query(
        collection(db, "cards"),
        where("urlName", "==", newUrlName),
      );

      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        showToast("This URL name is already taken", "error");
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "cards"),
        where("urlName", "==", card.urlName),
      );

      const snap = await getDocs(q);
      if (snap.empty) {
        showToast("Card not found", "error");
        return;
      }

      const cardDoc = snap.docs[0];
      const cardRef = doc(db, "cards", cardDoc.id);

      await updateDoc(cardRef, {
        urlName: newUrlName,
        "metadata.renewedAt": serverTimestamp(),
      });

      showToast("Link updated successfully!", "success");
      setShowPopup(false);
      navigate(`/dashboard/cards/${cardId}`);
    } catch (error) {
      console.error(error);
      showToast("Failed to renew link", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Renew Link</h3>

            <div className="p-3 bg-muted/20 rounded-md border">
              <p className="text-sm text-muted-foreground mb-1">
                Current Link:
              </p>
              <p className="text-sm font-mono break-all">
                {process.env.NEXT_PUBLIC_API_LIVE_URL}
                {card.urlName}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewUrlName(card.urlName);
                setShowPopup(true);
              }}
              disabled={loading}
            >
              {loading ? "Renewing..." : "Renew Link"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] !mt-0">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />

          <div className="relative z-10 w-[90%] max-w-md rounded-2xl border bg-card text-card-foreground shadow-2xl p-6 animate-in fade-in-50 zoom-in-95">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center">Renew Link</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Renewing the link will invalidate the current URL. Anyone using
                the old link will no longer be able to access this card.
              </p>

              {/* Input Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">New Card URL</label>
                <Input
                  placeholder="enter new url name"
                  value={newUrlName}
                  onChange={(e) => setNewUrlName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {process.env.NEXT_PUBLIC_API_LIVE_URL}
                  {newUrlName}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPopup(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>

                <Button onClick={renewLink} disabled={loading}>
                  {loading ? "Renewing..." : "Renew"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
