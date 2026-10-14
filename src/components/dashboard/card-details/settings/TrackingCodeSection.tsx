"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";

interface TrackingCodeSectionProps {
  cardId: string;
  card: any;
}

export function TrackingCodeSection({
  cardId,
  card,
}: TrackingCodeSectionProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const saveTrackingCode = async () => {
    if (!trackingCode.trim()) {
      showToast("Tracking code is required", "error");
      return;
    }

    try {
      setLoading(true);

      // Find card by metadata.id
      const q = query(
        collection(db, "cards"),
        where("metadata.id", "==", cardId)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        showToast("Card not found", "error");
        return;
      }

      const cardDoc = snap.docs[0];
      const cardRef = doc(db, "cards", cardDoc.id);

      // Update tracking code
      await updateDoc(cardRef, {
        "metadata.tracking": trackingCode,
        "metadata.trackingUpdatedAt": serverTimestamp(),
      });

      showToast("Tracking code saved successfully", "success");
      setShowPopup(false);
      setTrackingCode("");
      router.push(`/dashboard/cards/`);
    } catch (error) {
      console.error(error);
      showToast("Failed to save tracking code", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Tracking Code</h3>
            <span className="text-sm text-muted-foreground mb-1">
              Note: You need to add the Card URL in Google Analytics. After
              that, you will receive the Tag Manager code. Add the provided
              code, and then you will be able to see the reports in Google
              Analytics.
            </span>

            {card?.metadata?.tracking && (
              <div className="p-3 bg-muted/20 rounded-md border">
                <>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tracking Code:
                  </p>
                  <p className="text-sm font-mono break-all">
                    {card.metadata.tracking}
                  </p>
                </>
              </div>
            )}

            <div>
              {" "}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPopup(true)}
              >
                Add New
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center !mt-0">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />

          <div className="relative z-10 w-[90%] max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Add Tracking Code
            </h2>
            <Input
              placeholder="Enter tracking code"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowPopup(false)}>
                Cancel
              </Button>

              <Button onClick={saveTrackingCode} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
