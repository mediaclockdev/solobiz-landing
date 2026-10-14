"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import React from "react";

type ReferralsRequirementsProps = {
  l2Child: string;
  setL2Child: (value: string) => void;
  l3LeveledUps: string;
  setL3LeveledUps: (value: string) => void;
  l4Multiplier: string;
  setL4Multiplier: (value: string) => void;
  l5Multiplier: string;
  setL5Multiplier: (value: string) => void;
  l6Multiplier: string;
  setL6Multiplier: (value: string) => void;
  l3Total: number;
  l4Total: number;
  l5Total: number;
  l6Total: number;
};

export function ReferralsRequirements({
  l2Child,
  setL2Child,
  l3LeveledUps,
  setL3LeveledUps,
  l4Multiplier,
  setL4Multiplier,
  l5Multiplier,
  setL5Multiplier,
  l6Multiplier,
  setL6Multiplier,
  l3Total,
  l4Total,
  l5Total,
  l6Total,
}: ReferralsRequirementsProps) {
  const { showToast } = useToast();

  const settingsRef = doc(db, "settings", "ReferralMembershipLevel");

  const loadSettings = async () => {
    try {
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        const data = snap.data();
        setL2Child(data.l2Child?.toString() || "");
        setL3LeveledUps(data.l3LeveledUps?.toString() || "");
        setL4Multiplier(data.l4Multiplier?.toString() || "");
        setL5Multiplier(data.l5Multiplier?.toString() || "");
        setL6Multiplier(data.l6Multiplier?.toString() || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSave = async () => {
    try {
      await setDoc(
        settingsRef,
        {
          l2Child: Number(l2Child),
          l3LeveledUps: Number(l3LeveledUps),
          l4Multiplier: Number(l4Multiplier),
          l5Multiplier: Number(l5Multiplier),
          l6Multiplier: Number(l6Multiplier),
          l3Total,
          l4Total,
          l5Total,
          l6Total,
        },
        { merge: true }
      );

      showToast("Referral membership level Settings Saved.", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Failed to save settings. Please try again.", "error");
    }
  };

  React.useEffect(() => {
    loadSettings();
  }, []);

  return (
    <Card className="lg:col-span-2 card-hover">
      <CardHeader>
        <CardTitle className="text-lg">Referrals Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* L2 */}
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm">L2 - # needed to Level-Up =</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={l2Child}
                onChange={(e) => setL2Child(e.target.value)}
                className="w-20 h-8 text-xs"
                placeholder="0"
              />
              <span className="text-sm">Children</span>
            </div>
          </div>

          {/* L3 */}
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm">L3 - # of L2s needed, Level-Ups =</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={l3LeveledUps}
                onChange={(e) => setL3LeveledUps(e.target.value)}
                className="w-20 h-8 text-xs bg-muted"
                placeholder="0"
                readOnly
              />
              <span className="text-sm">
                Total = {l3Total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* L4 */}
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm">L4 - L3 times =</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={l4Multiplier}
                onChange={(e) => setL4Multiplier(e.target.value)}
                className="w-20 h-8 text-xs"
                placeholder="0"
              />
              <span className="text-sm">
                Total = {l4Total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* L5 */}
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm">L5 - L3 times =</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={l5Multiplier}
                onChange={(e) => setL5Multiplier(e.target.value)}
                className="w-20 h-8 text-xs"
                placeholder="0"
              />
              <span className="text-sm">
                Total = {l5Total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* L6 */}
          <div className="flex items-center justify-between">
            <span className="text-sm">L6 - L3 times =</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={l6Multiplier}
                onChange={(e) => setL6Multiplier(e.target.value)}
                className="w-20 h-8 text-xs"
                placeholder="0"
              />
              <span className="text-sm">
                Total = {l6Total.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Requirements
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
