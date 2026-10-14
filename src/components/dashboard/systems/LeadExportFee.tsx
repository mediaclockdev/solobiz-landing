"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useState, useEffect } from "react";
import { db } from "@/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * Admin control for the per-lead export fee (client point b3).
 *
 * A user exporting their grandchild list pays
 *   perLeadFee x number of leads
 * and keeps access for accessDays before it expires (point b4).
 *
 * Read by Referrals.tsx when the user clicks Export CSV. Stored at
 * settings/LeadExportFee, matching the ReferralEarningRate pattern.
 */
export function LeadExportFee() {
  const [perLeadFee, setPerLeadFee] = useState("");
  const [accessDays, setAccessDays] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const settingsRef = doc(db, "settings", "LeadExportFee");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data();
          setPerLeadFee(data.perLeadFee?.toString() ?? "");
          setAccessDays(data.accessDays?.toString() ?? "");
        }
      } catch (error) {
        console.error("Error fetching lead export fee:", error);
        showToast("Failed to fetch lead export settings.", "error");
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    const fee = Number(perLeadFee);
    const days = Number(accessDays);

    if (!Number.isFinite(fee) || fee < 0) {
      showToast("Per-lead fee must be zero or more.", "error");
      return;
    }
    if (!Number.isInteger(days) || days < 1) {
      showToast("Access duration must be at least 1 day.", "error");
      return;
    }

    setSaving(true);
    try {
      // merge: never clobber fields a later version of this card may add.
      await setDoc(
        settingsRef,
        { perLeadFee: fee, accessDays: days },
        { merge: true },
      );
      showToast("Lead export settings have been saved.", "success");
    } catch (error) {
      console.error("Error saving lead export fee:", error);
      showToast("Failed to save lead export settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const EXAMPLE_LEADS = 100;
  const fee = Number(perLeadFee) || 0;
  const days = Number(accessDays) || 0;

  return (
    <Card className="lg:col-span-2 card-hover">
      <CardHeader>
        <CardTitle className="text-lg">Lead Export Fee</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Container query, not a viewport breakpoint: this card sits in a
            lg:grid-cols-5 grid, so its width depends on the grid and on whether
            the sidebar is collapsed - neither of which tracks the viewport. */}
        <div className="space-y-4 [container-type:inline-size]">
          <p className="text-sm text-muted-foreground">
            Pricing for grandchild lead CSV downloads
          </p>

          <div className="space-y-3">
            {/* Label stacks above the field on a narrow column and sits beside
                it once there is room, so the long labels never crowd the input
                the way a fixed row did. */}
            <div className="flex flex-col gap-2 border-b pb-3 [@container(min-width:320px)]:flex-row [@container(min-width:320px)]:items-center [@container(min-width:320px)]:justify-between [@container(min-width:320px)]:gap-4">
              <div className="min-w-0">
                <span className="text-sm">Per-lead fee</span>
                <p className="text-xs text-muted-foreground">
                  Charged for every lead in the export
                </p>
              </div>
              {/* $ sits inside the field rather than floating beside it. */}
              <div className="relative w-full shrink-0 [@container(min-width:320px)]:w-28">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={perLeadFee}
                  onChange={(e) => setPerLeadFee(e.target.value)}
                  className="h-8 w-full pl-5 text-xs"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 border-b pb-3 [@container(min-width:320px)]:flex-row [@container(min-width:320px)]:items-center [@container(min-width:320px)]:justify-between [@container(min-width:320px)]:gap-4">
              <div className="min-w-0">
                <span className="text-sm">Access duration</span>
                <p className="text-xs text-muted-foreground">
                  How long the download stays available
                </p>
              </div>
              {/* Same width as the fee field above, so the two line up. */}
              <div className="relative w-full shrink-0 [@container(min-width:320px)]:w-28">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={accessDays}
                  onChange={(e) => setAccessDays(e.target.value)}
                  className="h-8 w-full pr-11 text-xs"
                  placeholder="7"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  days
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              {fee > 0 && days > 0 ? (
                <>
                  A user with {EXAMPLE_LEADS} leads pays{" "}
                  <span className="font-semibold text-foreground">
                    ${(fee * EXAMPLE_LEADS).toFixed(2)}
                  </span>{" "}
                  and keeps access for{" "}
                  <span className="font-semibold text-foreground">
                    {days} {days === 1 ? "day" : "days"}
                  </span>
                  .
                </>
              ) : (
                <>
                  Set a fee and duration to price lead downloads. Until a fee is
                  set, users are told downloads are unavailable.
                </>
              )}
            </p>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
