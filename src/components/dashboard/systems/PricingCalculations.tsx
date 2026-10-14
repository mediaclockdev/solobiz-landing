"use client";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { db } from "@/services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

type PricingCalculationsProps = {
  proUpgradeMonthly: string;
  setProUpgradeMonthly: (value: string) => void;
  addOneCardMonthly: string;
  setAddOneCardMonthly: (value: string) => void;
  addFiveCardsMonthly: string;
  setAddFiveCardsMonthly: (value: string) => void;
  discount: string;
  setDiscount: (value: string) => void;
  freeTrialPeriod: string;
  setFreeTrialPeriod: (value: string) => void;
  proUpgradePerYear: number;
  proUpgradeYearlyWithDiscount: number;
  proUpgradeMonthlyEquivalent: number;
  addOneCardPerYear: number;
  addOneCardYearlyWithDiscount: number;
  addOneCardMonthlyEquivalent: number;
  addFiveCardsPerYear: number;
  addFiveCardsYearlyWithDiscount: number;
  addFiveCardsMonthlyEquivalent: number;
};

export function PricingCalculations({
  proUpgradeMonthly,
  setProUpgradeMonthly,
  addOneCardMonthly,
  setAddOneCardMonthly,
  addFiveCardsMonthly,
  setAddFiveCardsMonthly,
  discount,
  setDiscount,
  freeTrialPeriod,
  setFreeTrialPeriod,
  proUpgradePerYear,
  proUpgradeYearlyWithDiscount,
  proUpgradeMonthlyEquivalent,
  addOneCardPerYear,
  addOneCardYearlyWithDiscount,
  addOneCardMonthlyEquivalent,
  addFiveCardsPerYear,
  addFiveCardsYearlyWithDiscount,
  addFiveCardsMonthlyEquivalent,
}: PricingCalculationsProps) {
  const { showToast } = useToast();
  const settingsRef = doc(db, "settings", "PricingRequirement");

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        const data = snap.data();
        setProUpgradeMonthly(data.proUpgradeMonthly || "");
        setAddOneCardMonthly(data.addOneCardMonthly || "");
        setAddFiveCardsMonthly(data.addFiveCardsMonthly || "");
        setDiscount(data.discount || "");
        setFreeTrialPeriod(data.freeTrialPeriod || "");
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await setDoc(
        settingsRef,
        {
          proUpgradeMonthly,
          addOneCardMonthly,
          addFiveCardsMonthly,
          discount,
          freeTrialPeriod,
          proUpgradePerYear,
          proUpgradeYearlyWithDiscount,
          proUpgradeMonthlyEquivalent,
          addOneCardPerYear,
          addOneCardYearlyWithDiscount,
          addOneCardMonthlyEquivalent,
          addFiveCardsPerYear,
          addFiveCardsYearlyWithDiscount,
          addFiveCardsMonthlyEquivalent,
        },
        { merge: true }
      );
      showToast(
        "Pricing requirements have been saved successfully.",
        "success"
      );
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Failed to save settings. Please try again.", "error");
    }
  };

  return (
    <Card className="lg:col-span-3 card-hover">
      <CardHeader>
        <CardTitle className="text-lg">Pricing Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Discount */}
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm">Discount =</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-20 h-8 text-xs"
                placeholder="0"
              />
              <span className="text-sm">%</span>
            </div>
          </div>

          {/* Pro Upgrade */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Pro Upgrade: Paid monthly =</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={proUpgradeMonthly}
                onChange={(e) => setProUpgradeMonthly(e.target.value)}
                className="w-20 h-8 text-xs"
                placeholder="0"
              />
              <span className="text-sm">
                = ${proUpgradePerYear.toFixed(0)} per year | Paid yearly = $
                {proUpgradeYearlyWithDiscount.toFixed(0)} = $
                {proUpgradeMonthlyEquivalent.toFixed(0)} per month
              </span>
            </div>
          </div>

          {/* Add 1 Card */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Add 1 Card: Paid monthly =</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={addOneCardMonthly}
                onChange={(e) => setAddOneCardMonthly(e.target.value)}
                className="w-20 h-8 text-xs"
                placeholder="0"
              />
              <span className="text-sm">
                = ${addOneCardPerYear.toFixed(0)} per year | Paid yearly = $
                {addOneCardYearlyWithDiscount.toFixed(0)} = $
                {addOneCardMonthlyEquivalent.toFixed(0)} per month
              </span>
            </div>
          </div>

          {/* Add 5 Cards */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Add 5 Cards: Paid monthly =</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={addFiveCardsMonthly}
                onChange={(e) => setAddFiveCardsMonthly(e.target.value)}
                className="w-20 h-8 text-xs"
                placeholder="0"
              />
              <span className="text-sm">
                = ${addFiveCardsPerYear.toFixed(0)} per year | Paid yearly = $
                {addFiveCardsYearlyWithDiscount.toFixed(0)} = $
                {addFiveCardsMonthlyEquivalent.toFixed(0)} per month
              </span>
            </div>
          </div>

          <div className="h-0 border-t border-border my-2"></div>

          {/* Free Trial */}
          <div className="flex items-center justify-between">
            <span className="text-sm">
              Initial Free PRO Features Trial Period =
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={freeTrialPeriod}
                onChange={(e) => setFreeTrialPeriod(e.target.value)}
                className="w-20 h-8 text-xs"
                placeholder="0"
              />
              <span className="text-sm">days</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Pricing
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
