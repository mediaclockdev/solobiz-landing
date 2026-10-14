"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

export function YourEarnings() {
  const { user } = useAuth();
  const [childPaidReferals, setChilPaidReferals] = useState(0);
  const [grandChildPaidReferals, setGrandChilPaidReferals] = useState(0);
  const [childPaid, setChilPaid] = useState(0);
  const [childEarnings, setChildEarnings] = useState(0);
  const [grandchildEarnings, setGrandchildEarnings] = useState(0);
  const [grandChildPaid, setGrandChilPaid] = useState(0);
  const [operatingCostRate, setOperatingCostRate] = useState(0);
  const [pricing, setPricing] = useState(0);
  const [scheduleCurrentMonth, setScheduleCurrentMonth] = useState(new Date());
  const [scheduleAmount, setScheduleAmount] = useState(0);
  const [paymentScheduled, setPaymentScheduled] = useState([]);
  const [level3FormattedDate, setLevel3FormattedDate] = useState("");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const totalEarning = async () => {
    setIsLoading(true);

    const userRef = doc(db, "referrals", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const balanceEarnings = userData.balanceEarnings || {};
    const earningsCost = userData.earningsCost || {};

    if (balanceEarnings) {
      const reversedEntries = Object.entries(balanceEarnings).reverse();
      const reversedCostEntries = Object.entries(earningsCost).reverse();
      let totalAmount = 0;

      for (const [uid, plans] of reversedEntries) {
        // Fetch user profile
        const profileRef = doc(db, "users", uid);
        const profileSnap = await getDoc(profileRef);
        const profile = profileSnap.exists() ? profileSnap.data() : {};

        // Skip free plan users
        if (profile.planType === "free") continue;

        // Get cost structure for this user
        const userEarningsCost =
          reversedCostEntries.find(([id, cost]) => id === uid)?.[1] ?? 0;

        // Loop through plan types (pro, addons, etc.) and sum amounts
        for (const [planName, amount] of Object.entries(plans)) {
          totalAmount += Number(amount);
        }
      }

      setTotalEarnings(totalAmount);
    }

    setIsLoading(false);
  };

  const fetchPaidCounts = async () => {
    //console.log("User", user.uid);
    const userRef = doc(db, "referrals", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();

    const currentLevel = userData.Level;

    const children = userData.children || [];
    const noOfChild = children.length;
    let noOfGC = 0;
    let paidChild = 0;
    let firstPaidInitial = new Date();
    let paidGC = 0;
    // --- Check children ---
    for (const childId of children) {
      const childRef = doc(db, "referrals", childId);
      const childSnap = await getDoc(childRef);

      const userchildRef = doc(db, "users", childId);
      const userchildSnap = await getDoc(userchildRef);
      if (userchildSnap.exists()) {
        const userchildData = userchildSnap.data();
        if (userchildData.planType === "paid") {
          paidChild = paidChild + 1;
          const startDate = new Date(userchildData.subscriptionStartDate);

          // Initialize or update the earliest paid subscription date
          if (!firstPaidInitial || startDate < firstPaidInitial) {
            firstPaidInitial = startDate;
          }
        }
      }

      if (!childSnap.exists()) {
        console.log(`Child ID ${childId} not found`);
        continue;
      }

      const childData = childSnap.data();
      const childChildren = childData.children || [];
      noOfGC = noOfGC + childChildren.length;
      for (const grandchildId of childChildren) {
        const userchildRef = doc(db, "users", grandchildId);
        const userchildSnap = await getDoc(userchildRef);
        if (userchildSnap.exists()) {
          const userchildData = userchildSnap.data();
          if (userchildData.planType === "paid") {
            paidGC = paidGC + 1;
            const startDate = new Date(userchildData.subscriptionStartDate);

            // Initialize or update the earliest paid subscription date
            if (!firstPaidInitial || startDate < firstPaidInitial) {
              firstPaidInitial = startDate;
            }
          }
        }
      }
    }

    setScheduleCurrentMonth(firstPaidInitial);
    setChilPaidReferals(paidChild > 0 ? (paidChild * 100) / noOfChild : 0);
    setGrandChilPaidReferals(paidGC > 0 ? (paidGC * 100) / noOfGC : 0);
    setChilPaid(paidChild);
    setGrandChilPaid(paidGC);
    const grossChildEarning = Number(
      (childPaid * childEarnings * pricing) / 100
    );
    const grossGChildEarning = Number(
      (grandChildPaid * grandchildEarnings * pricing) / 100
    );

    const netChildEarning =
      grossChildEarning - (grossChildEarning * operatingCostRate) / 100;
    const netGChildEarning =
      grossGChildEarning - (grossGChildEarning * operatingCostRate) / 100;
    const sechduleAmount = Number(netChildEarning + netGChildEarning);
    // console.log("sechduleAmount", sechduleAmount);
    setScheduleAmount(sechduleAmount);
  };

  const fetchSettings = async () => {
    try {
      const settingsRef = doc(db, "users", user.uid);
      const snap = await getDoc(settingsRef);

      if (snap.exists()) {
        const data = snap.data();
        setChildEarnings(data.childEarnings || 0);
        setGrandchildEarnings(data.grandchildEarnings || 0);
        setOperatingCostRate(data.operatingCostRate || 0);
      }

      const settingsPricingRef = doc(db, "settings", "PricingRequirement");
      const pricingSnap = await getDoc(settingsPricingRef);

      if (pricingSnap.exists()) {
        const data = pricingSnap.data();
        setPricing(data.proUpgradeYearlyWithDiscount || 0);
      }
    } catch (err) {
      console.error("Error fetching referral settings:", err);
    }
  };

  useEffect(() => {
    if (user) {
      totalEarning();
      fetchSettings();
      fetchPaidCounts();
    }
  }, [user]);

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground border-b pb-2">
          Your Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {" "}
          ${Number(totalEarnings).toFixed(2)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">total earnings</p>
      </CardContent>
    </Card>
  );
}
