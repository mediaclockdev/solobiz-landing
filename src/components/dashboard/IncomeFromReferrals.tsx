"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";

export function IncomeFromReferrals(props) {
  const {
    countRef,
    countChild,
    countGrandChild,
    paidChildReferals,
    grandChildPaidReferals,
    paidChild,
    grandChildPaid,
    grossAddonsChildEarning,
    grossAddonsGrandChildEarning,
  } = props;
  const [childEarnings, setChildEarnings] = useState(0);
  const [grandchildEarnings, setGrandchildEarnings] = useState(0);
  const [operatingCostRate, setOperatingCostRate] = useState(0);

  const [childBalance, setChildBalance] = useState(0);
  const [grandchildBalance, setGrandchildBalance] = useState(0);

  const [pricing, setPricing] = useState(0);

  const { user } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, "settings", "ReferralEarningRate");

        const snap = await getDoc(settingsRef);

        const userRef = doc(db, "users", user?.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.userChildEarning) {
            setChildEarnings(userData.userChildEarning);
          } else {
            if (snap.exists()) {
              const data = snap.data();
              setChildEarnings(data.childEarnings || 0);
            }
          }

          if (userData.userGrandChildEarning) {
            setGrandchildEarnings(userData.userGrandChildEarning);
          } else {
            if (snap.exists()) {
              const data = snap.data();
              setGrandchildEarnings(data.grandchildEarnings || 0);
            }
          }

          if (userData.operatingCostRate) {
            setOperatingCostRate(userData.operatingCostRate);
          } else {
            if (snap.exists()) {
              const data = snap.data();
              setOperatingCostRate(data.operatingCostRate || 0);
            }
          }
        } else {
          if (snap.exists()) {
            const data = snap.data();
            setChildEarnings(data.childEarnings || 0);
            setGrandchildEarnings(data.grandchildEarnings || 0);
            setOperatingCostRate(data.operatingCostRate || 0);
          }
        }

        // if (snap.exists()) {
        //   const data = snap.data();
        //   setOperatingCostRate(data.operatingCostRate || 0);
        // }

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

    const fetchReferalBalance = async () => {
      try {
        const settingsRefBalance = doc(db, "referrals", user?.uid);
        const refSnap = await getDoc(settingsRefBalance);

        if (refSnap.exists()) {
          const data = refSnap.data();
          // setChildBalance(data.childBalance || 0);
          // setGrandchildBalance(data.parentBalance || 0);
        }
      } catch (err) {
        console.error("Error fetching referral settings:", err);
      }
    };

    fetchSettings();

    fetchReferalBalance();
  }, [user]);
  const grossChildEarning =
    grossAddonsChildEarning +
    Number((paidChild * childEarnings * pricing) / 100);
  const grossGChildEarning =
    grossAddonsGrandChildEarning +
    Number((grandChildPaid * grandchildEarnings * pricing) / 100);

  const netChildEarning =
    grossChildEarning - (grossChildEarning * operatingCostRate) / 100;
  const netGChildEarning =
    grossGChildEarning - (grossGChildEarning * operatingCostRate) / 100;
  const referralData = [
    {
      title: "Total Referrals",
      value: countRef,
      subValue: "",
      className: "font-medium",
    },
    {
      title: "Referrals Breakdown",
      value: `Children = ${countChild}`,
      subValue: `Grandchildren = ${countGrandChild}`,
      className: "",
    },
    {
      title: "Paid Referrals",
      value: `${Number(paidChildReferals).toFixed(0)}% | ${paidChild ?? "0"}`,
      subValue: `${Number(grandChildPaidReferals).toFixed(0)}% | ${
        grandChildPaid ?? "0"
      }`,
      className: "",
    },
    {
      title: "% Earned",
      value: `${childEarnings}%`,
      subValue: `${grandchildEarnings}%`,
      className: "text-primary",
    },
    {
      title: "Gross Earnings",
      value: `$${(
        Number(
          grossAddonsChildEarning + (paidChild * childEarnings * pricing) / 100
        ) || 0
      ).toFixed(2)}`,

      subValue: `$${(
        Number(
          grossAddonsGrandChildEarning +
            (grandChildPaid * grandchildEarnings * pricing) / 100
        ) || 0
      ).toFixed(2)}`,

      className: "text-green-600",
    },
    {
      title: "Net Earnings",
      value: `$${Number(netChildEarning ?? 0)
        .toFixed(2)
        .toLocaleString()}`,
      subValue: `$${Number(netGChildEarning ?? 0)
        .toFixed(2)
        .toLocaleString()}`,
      className: "text-green-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Income From Referrals</h3>
        <p className="text-sm text-muted-foreground">
          Your total referrals and the income generated from the Paying
          referrals
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {referralData.map((item, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className={`text-sm ${item.className}`}>{item.value}</div>
              {item.subValue && (
                <div className={`text-sm ${item.className}`}>
                  {item.subValue}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
