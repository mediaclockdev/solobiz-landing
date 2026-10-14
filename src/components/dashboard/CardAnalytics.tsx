"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Eye,
  Download,
  Share,
  Users,
  MousePointer,
  Monitor,
  AreaChart as AreaChartIcon,
  BarChart3,
  Crown,
  Lock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { loadBusinessCards } from "@/utils/cardStorage";
import { useParams, useSearchParams } from "next/navigation";
import { useNavigate, useLocation } from "@/lib/navigation";

interface CardAnalyticsProps {
  onUpgrade: () => void;
  onLockClick: () => void;
}

type TimeRange = "7d" | "30d" | "90d" | "1y";

// const chartData = {
//   "7d": [
//     {
//       name: "Mon",
//       views: 45,
//       saves: 20,
//       shares: 15,
//       clicks: 35,
//       adViews: 60,
//       leads: 8,
//     },
//     {
//       name: "Tue",
//       views: 52,
//       saves: 25,
//       shares: 18,
//       clicks: 42,
//       adViews: 72,
//       leads: 12,
//     },
//     {
//       name: "Wed",
//       views: 48,
//       saves: 22,
//       shares: 16,
//       clicks: 38,
//       adViews: 65,
//       leads: 10,
//     },
//     {
//       name: "Thu",
//       views: 61,
//       saves: 30,
//       shares: 22,
//       clicks: 48,
//       adViews: 85,
//       leads: 15,
//     },
//     {
//       name: "Fri",
//       views: 55,
//       saves: 28,
//       shares: 20,
//       clicks: 45,
//       adViews: 78,
//       leads: 13,
//     },
//     {
//       name: "Sat",
//       views: 67,
//       saves: 35,
//       shares: 25,
//       clicks: 52,
//       adViews: 92,
//       leads: 18,
//     },
//     {
//       name: "Sun",
//       views: 59,
//       saves: 32,
//       shares: 23,
//       clicks: 49,
//       adViews: 82,
//       leads: 16,
//     },
//   ],
//   "30d": [
//     {
//       name: "Week 1",
//       views: 320,
//       saves: 140,
//       shares: 95,
//       clicks: 250,
//       adViews: 450,
//       leads: 65,
//     },
//     {
//       name: "Week 2",
//       views: 450,
//       saves: 190,
//       shares: 130,
//       clicks: 340,
//       adViews: 620,
//       leads: 85,
//     },
//     {
//       name: "Week 3",
//       views: 380,
//       saves: 165,
//       shares: 110,
//       clicks: 290,
//       adViews: 520,
//       leads: 72,
//     },
//     {
//       name: "Week 4",
//       views: 520,
//       saves: 220,
//       shares: 155,
//       clicks: 390,
//       adViews: 710,
//       leads: 98,
//     },
//   ],
//   "90d": [
//     {
//       name: "Month 1",
//       views: 1650,
//       saves: 715,
//       shares: 485,
//       clicks: 1270,
//       adViews: 2300,
//       leads: 320,
//     },
//     {
//       name: "Month 2",
//       views: 1890,
//       saves: 820,
//       shares: 560,
//       clicks: 1450,
//       adViews: 2650,
//       leads: 380,
//     },
//     {
//       name: "Month 3",
//       views: 2100,
//       saves: 910,
//       shares: 620,
//       clicks: 1600,
//       adViews: 2900,
//       leads: 420,
//     },
//   ],
//   "1y": [
//     {
//       name: "Q1",
//       views: 5640,
//       saves: 2445,
//       shares: 1665,
//       clicks: 4320,
//       adViews: 7850,
//       leads: 1120,
//     },
//     {
//       name: "Q2",
//       views: 6200,
//       saves: 2690,
//       shares: 1830,
//       clicks: 4750,
//       adViews: 8640,
//       leads: 1250,
//     },
//     {
//       name: "Q3",
//       views: 5980,
//       saves: 2590,
//       shares: 1760,
//       clicks: 4580,
//       adViews: 8320,
//       leads: 1180,
//     },
//     {
//       name: "Q4",
//       views: 6850,
//       saves: 2970,
//       shares: 2020,
//       clicks: 5240,
//       adViews: 9540,
//       leads: 1380,
//     },
//   ],
// };

export function CardAnalytics({ onUpgrade, onLockClick }: CardAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  //const currentData = chartData[timeRange];
  const [MNR, setMNR] = useState(0);
  const { user } = useAuth();
  const [childCount, setChildCount] = useState(0);
  const [parentCount, setParentCount] = useState(0);
  const [level, setLevel] = useState(0);
  const [memberLevel, setMemberLevel] = useState("Starter");
  const [childEarnings, setchildEarnings] = useState(0);
  const [grandchildEarnings, setRgrandchildEarnings] = useState(0);
  const [currentChildren, setCurrentChildren] = useState(0);
  const [currentGrandChildren, setCurrentGrandChildren] = useState(0);
  const [remainingChildren, setRemainingChildren] = useState(0);
  const [remainingGrandChildren, setRemainingGrandChildren] = useState(0);
  const [nextLevelNeed, setNextLevelNeed] = useState(0);
  const [levelUpPercentage, setLevelUpPercentage] = useState(0);
  const [cardView, setCardView] = useState(0);
  const [cardShare, setCardShare] = useState(0);
  const [cardLeadGenerated, setCardLeadGenerated] = useState(0);
  const [cardLink, setCardLink] = useState(0);
  const [cardAdsView, setAdsView] = useState(0);
  const [cardSaveContact, setSaveContact] = useState(0);
  const searchParams = useSearchParams();
  const location = useLocation();
  const cardId = location.pathname.split("/").pop();
  const [chartData, setChartData] = useState([]);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);

  async function countChildren(userId: string) {
    const userRef = doc(db, "referrals", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const children = userData.children || [];
      return children.length;
    }
    return 0;
  }

  async function countParents(userId: string) {
    const userRef = doc(db, "referrals", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const grandchildren = userData.grandchildren || [];
      return grandchildren.length;
    }
    return 0;
  }

  async function fetchCardDetails() {
    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", cardId),
      );
      const cardsSnapshot = await getDocs(cardsQuery);
      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();
        const cardView = cardDoc.data().cardView;
        const cardShare = cardDoc.data().cardShare;
        const cardLeadGenerated = cardDoc.data().leadsGenerated;
        const cardLinkClick = cardDoc.data().linkClick;
        const cardAdsView = cardDoc.data().adsView;
        const cardSaveContact = cardDoc.data().saveContact;

        setCardView(cardView);
        setCardShare(cardShare);
        setCardLeadGenerated(cardLeadGenerated);
        setCardLink(cardLinkClick);
        setAdsView(cardAdsView);
        setSaveContact(cardSaveContact);
      }
    } catch (error) {
      console.error("Error fetching card details:", error);
    }
  }

  async function fetchCardChartData(timeRange: TimeRange) {
    const cardsQuery = query(
      collection(db, "cards"),
      where("metadata.id", "==", cardId),
    );
    const cardsSnapshot = await getDocs(cardsQuery);
    if (cardsSnapshot.empty) {
      return [];
    }
    const cardData = cardsSnapshot.docs[0].data();
    const {
      cardViewsByDay = {},
      cardSharesByDay = {},
      cardAdsViewByDay = {},
      linkClicksByDay = {},
      cardLeadsGeneratedByDay = {},
      saveContactsByDay = {},
    } = cardData;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let result = [];
    let res = [];
    if (timeRange === "7d") {
      for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(today.getDate() - i);

        const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(day.getDate()).padStart(2, "0")}`;

        result.push({
          name: day.toLocaleDateString("en-US", { weekday: "short" }),
          views: cardViewsByDay[key] ?? 0,
          saves: saveContactsByDay[key] ?? 0,
          shares: cardSharesByDay[key] ?? 0,
          clicks: linkClicksByDay[key] ?? 0,
          adViews: cardAdsViewByDay[key] ?? 0,
          leads: cardLeadsGeneratedByDay[key] ?? 0,
        });
      }
      res[timeRange] = result;
    } else if (timeRange === "30d") {
      // Weekly aggregation in the last 30 days
      for (let w = 0; w < 4; w++) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7 * (3 - w));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekKey = `Week ${w + 1}`;

        let weekData = {
          name: weekKey,
          views: 0,
          saves: 0,
          shares: 0,
          clicks: 0,
          adViews: 0,
          leads: 0,
        };

        for (
          let d = new Date(weekStart);
          d <= weekEnd;
          d.setDate(d.getDate() + 1)
        ) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0",
          )}-${String(d.getDate()).padStart(2, "0")}`; // <-- full date format YYYY-MM-DD

          weekData.views += cardViewsByDay[key] ?? 0;
          weekData.saves += saveContactsByDay[key] ?? 0;
          weekData.shares += cardSharesByDay[key] ?? 0;
          weekData.clicks += linkClicksByDay[key] ?? 0;
          weekData.adViews += cardAdsViewByDay[key] ?? 0;
          weekData.leads += cardLeadsGeneratedByDay[key] ?? 0;
        }

        result.push(weekData);
      }

      res[timeRange] = result;
    } else if (timeRange === "90d") {
      // Monthly aggregation (last 3 months)
      for (let m = 2; m >= 0; m--) {
        const month = new Date(today.getFullYear(), today.getMonth() - m, 1);
        const monthKey = `Month ${3 - m}`;

        let monthData = {
          name: monthKey,
          views: 0,
          saves: 0,
          shares: 0,
          clicks: 0,
          adViews: 0,
          leads: 0,
        };

        const daysInMonth = new Date(
          month.getFullYear(),
          month.getMonth() + 1,
          0,
        ).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
          const day = new Date(month.getFullYear(), month.getMonth(), d);
          const key = `${day.getFullYear()}-${String(
            day.getMonth() + 1,
          ).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`; // <-- full date format YYYY-MM-DD

          monthData.views += cardViewsByDay[key] ?? 0;
          monthData.saves += saveContactsByDay[key] ?? 0;
          monthData.shares += cardSharesByDay[key] ?? 0;
          monthData.clicks += linkClicksByDay[key] ?? 0;
          monthData.adViews += cardAdsViewByDay[key] ?? 0;
          monthData.leads += cardLeadsGeneratedByDay[key] ?? 0;
        }

        result.push(monthData);
      }

      res[timeRange] = result;
    } else if (timeRange === "1y") {
      // Quarterly aggregation
      for (let q = 0; q < 4; q++) {
        const startMonth = q * 3;
        const quarterKey = `Q${q + 1}`;

        let quarterData = {
          name: quarterKey,
          views: 0,
          saves: 0,
          shares: 0,
          clicks: 0,
          adViews: 0,
          leads: 0,
        };

        for (let m = startMonth; m < startMonth + 3; m++) {
          const month = new Date(today.getFullYear(), m, 1);
          const daysInMonth = new Date(
            month.getFullYear(),
            month.getMonth() + 1,
            0,
          ).getDate();

          for (let d = 1; d <= daysInMonth; d++) {
            const day = new Date(month.getFullYear(), month.getMonth(), d);
            const key = `${day.getFullYear()}-${String(
              day.getMonth() + 1,
            ).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`; // <-- full date format YYYY-MM-DD

            quarterData.views += cardViewsByDay[key] ?? 0;
            quarterData.saves += saveContactsByDay[key] ?? 0;
            quarterData.shares += cardSharesByDay[key] ?? 0;
            quarterData.clicks += linkClicksByDay[key] ?? 0;
            quarterData.adViews += cardAdsViewByDay[key] ?? 0;
            quarterData.leads += cardLeadsGeneratedByDay[key] ?? 0;
          }
        }

        result.push(quarterData);
      }

      res[timeRange] = result;
    }

    return res;
  }

  function parseCreatedAt(input: any) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  useEffect(() => {
    async function fetchCounts() {
      const userId = user?.uid;
      const children = await countChildren(userId);
      const parents = await countParents(userId);
      setParentCount(parents);
      const chart = await fetchCardChartData(timeRange);
      setChartData(chart);
      //console.log("CharData===", chart);
      setChildCount(children);
    }
    const fetchSettings = async () => {
      try {
        const userId = user?.uid;
        if (!userId) return;

        //console.log("=== FETCHING REFERRAL SETTINGS ===");

        // --- Fetch referral settings ---
        const settingsRef = doc(db, "users", userId);
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) return;
        const settings = settingsSnap.data();

        const settingsReferralEarningRate = doc(db, "users", userId);
        const settingssettingsReferralEarningRateSnap = await getDoc(
          settingsReferralEarningRate,
        );
        if (!settingssettingsReferralEarningRateSnap.exists()) return;
        const settingsData = settingssettingsReferralEarningRateSnap.data();

        setchildEarnings(settingsData.childEarnings);
        setRgrandchildEarnings(settingsData.grandchildEarnings);

        const MNR = settings.l2Child;
        setMNR?.(MNR);
        //console.log("Minimum Number of Referrals (MNR):", MNR);

        // --- Fetch user data ---
        const userRef = doc(db, "referrals", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data();

        const children = userData.children || [];
        const RCA = children.length;
        //console.log("Direct children (RCA):", RCA);

        let childrenReachedLevel2 = 0;
        let totalGrandChildrenFromLevel2 = 0;
        let totalGrandChildrenAll = 0;
        let level3Count = 0;

        const nonLevel2Deficits = [];
        for (const childId of children) {
          const childRef = doc(db, "referrals", childId);
          const childSnap = await getDoc(childRef);

          if (!childSnap.exists()) {
            //console.log(`Child ID ${childId} not found`);
            continue;
          }

          const childData = childSnap.data();
          const childChildren = childData.children || [];
          const childRCA = childChildren.length;
          const childLevel = Number(childData.Level ?? childData.Level) || 1;

          totalGrandChildrenAll += childRCA;

          // console.log(`Child ID: ${childId}`);
          // console.log("  - Child Level:", childLevel);
          // console.log("  - Child Direct Children (childRCA):", childRCA);

          if (childRCA >= MNR || childLevel >= 2) {
            childrenReachedLevel2++;
            totalGrandChildrenFromLevel2 += childRCA;
            //  console.log("  -> counts as Level-2 child");
          } else {
            const deficit = Math.max(0, MNR - childRCA);
            nonLevel2Deficits.push(deficit);
            // console.log(
            //   "  -> NOT Level-2 yet, deficit to reach Level-2:",
            //   deficit
            // );
          }

          if (childLevel >= 3) {
            level3Count++;
          }
        }

        // console.log(
        //   "Total grandchildren (all children):",
        //   totalGrandChildrenAll
        // );
        // console.log(
        //   "Total grandchildren (from Level-2 children):",
        //   totalGrandChildrenFromLevel2
        // );
        // console.log("Total Level-2 children (RLA):", childrenReachedLevel2);
        // console.log("Total Level-3 children:", level3Count);

        const missingLevel2Children = Math.max(0, MNR - childrenReachedLevel2);

        nonLevel2Deficits.sort((a, b) => a - b);

        let remainingGrandChildren = 0;
        for (let i = 0; i < missingLevel2Children; i++) {
          if (i < nonLevel2Deficits.length) {
            remainingGrandChildren += nonLevel2Deficits[i];
          } else {
            remainingGrandChildren += MNR;
          }
        }

        if (childrenReachedLevel2 >= MNR) {
          remainingGrandChildren = 0;
        }

        const childrenRemainingLevel2 = Math.max(
          0,
          MNR - childrenReachedLevel2,
        );

        let remainingPoints = childrenRemainingLevel2;
        // console.log("Missing Level-2 children (count):", missingLevel2Children);
        // console.log("Deficits list (non-Level2 children):", nonLevel2Deficits);
        // console.log(
        //   "Remaining grandchildren required to get MNR Level-2 children:",
        //   remainingGrandChildren
        // );
        // console.log(
        //   "Children remaining to reach Level-2:",
        //   childrenRemainingLevel2
        // );
        // console.log(
        //   "RemainingPoints (children required to reach Level-2):",
        //   remainingPoints
        // );

        let levelPercentage = RCA ? (childrenReachedLevel2 * 100) / RCA : 0;
        setLevelUpPercentage(Number(levelPercentage));

        let userLevelStr = 1;
        let memberLevel = "Starter";
        let requiredChildrenToNext = 0;
        let requiredGrandChildrenToNext = 0;
        let nextLevelName = "";
        ``;

        if (RCA < MNR) {
          userLevelStr = 1;
          memberLevel = "Starter";
          requiredChildrenToNext = Math.max(0, MNR - RCA);
          requiredGrandChildrenToNext = 0;
          nextLevelName = "Level-Up";
          remainingPoints = 0;
        } else if (childrenReachedLevel2 < MNR) {
          //   console.log("childrenReachedLevel2=", childrenReachedLevel2);
          userLevelStr = childrenReachedLevel2;
          memberLevel = "Level-Up";
          requiredChildrenToNext = childrenRemainingLevel2;
          requiredGrandChildrenToNext = remainingGrandChildren;
          // remainingPoints=0;
          nextLevelName = "Bronze";
          // await updateDoc(userRef, {
          //   Level: 2,
          // });
        } else if (
          childrenReachedLevel2 < MNR ||
          (childrenReachedLevel2 >= MNR &&
            totalGrandChildrenFromLevel2 < MNR * MNR)
        ) {
          userLevelStr = childrenReachedLevel2;
          memberLevel = "Level-Up";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = Math.max(
            0,
            MNR * MNR - totalGrandChildrenFromLevel2,
          );
          nextLevelName = "Bronze";
          // await updateDoc(userRef, {
          //   Level: 2,
          // });
        } else if (
          childrenReachedLevel2 >= MNR &&
          totalGrandChildrenFromLevel2 >= MNR * MNR &&
          level3Count < 2 * MNR
        ) {
          userLevelStr = 3;
          memberLevel = "Bronze";
          requiredChildrenToNext = Math.max(0, 2 * MNR - level3Count);
          requiredGrandChildrenToNext = 0;
          nextLevelName = "Silver";
          // await updateDoc(userRef, {
          //   Level: 3,
          // });
        } else if (
          totalGrandChildrenFromLevel2 <
          settings.l4Multiplier * (MNR * MNR)
        ) {
          userLevelStr = 3;
          memberLevel = "Bronze Earner";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = Math.max(
            0,
            settings.l4Multiplier * (MNR * MNR) - totalGrandChildrenFromLevel2,
          );
          nextLevelName = "Silver Earner";
          // await updateDoc(userRef, { Level: 3 });
        }
        // Level 5 → Gold Earner (L5-multiplier × L3 grandchildren)
        else if (
          totalGrandChildrenFromLevel2 <
          settings.l5Multiplier * (MNR * MNR)
        ) {
          userLevelStr = 4;
          memberLevel = "Silver Earner";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = Math.max(
            0,
            settings.l5Multiplier * (MNR * MNR) - totalGrandChildrenFromLevel2,
          );
          nextLevelName = "Gold Earner";
          // await updateDoc(userRef, { Level: 4 });
        }
        // Level 6 → Platinum Earner (L6-multiplier × L3 grandchildren)
        else if (
          totalGrandChildrenFromLevel2 <
          settings.l6Multiplier * (MNR * MNR)
        ) {
          userLevelStr = 5;
          memberLevel = "Gold Earner";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = Math.max(
            0,
            settings.l6Multiplier * (MNR * MNR) - totalGrandChildrenFromLevel2,
          );
          nextLevelName = "Platinum Earner";
          // await updateDoc(userRef, { Level: 5 });
        } else {
          userLevelStr = 6;
          memberLevel = "Platinum";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = 0;
          nextLevelName = "Max Level";
          // await updateDoc(userRef, {
          //   Level: 6,
          // });
        }

        // console.log("=== LEVEL RESULT ===");
        // console.log("User Level (label):", userLevelStr);
        // console.log("Member Level:", memberLevel);
        // console.log("Next Level:", nextLevelName);
        // console.log("Children reached Level-2 (RLA):", childrenReachedLevel2);
        // console.log(
        //   "Children remaining to reach Level-2:",
        //   childrenRemainingLevel2
        // );
        // console.log(
        //   "Total grandchildren (all children):",
        //   totalGrandChildrenAll
        // );
        // console.log(
        //   "Total grandchildren (from Level-2 children):",
        //   totalGrandChildrenFromLevel2
        // );
        // console.log(
        //   "Remaining grandchildren required to form MNR Level-2 children:",
        //   remainingGrandChildren
        // );
        // console.log(
        //   "Remaining points (children still to reach Level-2):",
        //   remainingPoints
        // );

        setLevel?.(childrenReachedLevel2);
        setMemberLevel?.(memberLevel);
        setCurrentChildren?.(RCA);
        setCurrentGrandChildren?.(totalGrandChildrenAll);
        setRemainingChildren?.(requiredChildrenToNext);
        setRemainingGrandChildren?.(requiredGrandChildrenToNext);
        // setChildrenReachedLevel2?.(childrenReachedLevel2);
        // setChildrenRemainingLevel2?.(childrenRemainingLevel2);
        setNextLevelNeed?.(remainingPoints);
      } catch (err) {
        console.error("Error fetching referral settings:", err);
      }
    };

    if (user) {
      const isFree = user?.planType === "free";
      setIsFreePlan(isFree);

      const createdAt = parseCreatedAt(user?.createdAt);
      const trialEnd = new Date(
        createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000,
      );
      const trialActive = new Date() <= trialEnd;
      setIsTrialActive(trialActive);
      fetchCounts();
      fetchSettings();
      fetchCardDetails();
    }
  }, [user, MNR]);

  const referralLevels = [
    { label: "Child", count: childCount, color: "bg-green-500" },
    { label: "Grandchild", count: parentCount, color: "bg-yellow-500" },
    { label: "Leveled-Up", count: level, color: "bg-pink-500" },
    {
      label: "Leveled-Up %",
      count: levelUpPercentage ?? 0,
      color: "bg-blue-500",
    },
  ];
  const isProLocked = isFreePlan && !isTrialActive;

  return (
    <div className="space-y-4">
      {/* Metrics Cards */}

      {/* className={`grid grid-cols-2 lg:grid-cols-6 gap-4 transition-all duration-300 ${
          isProLocked ? "opacity-60 blur-[2px] pointer-events-none" : ""
        }`} */}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 transition-all duration-300">
        <Card className="border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <p className="text-xs text-muted-foreground">Card Views</p>
              </div>
              <hr className="w-full border-gray-200" />
              <div className="text-left">
                <p className="text-lg font-semibold">{cardView}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4 text-green-500" />
                <p className="text-xs text-muted-foreground">Card Saves</p>
              </div>
              <hr className="w-full border-gray-200" />
              <div className="text-left">
                <p className="text-lg font-semibold">{cardSaveContact}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Share className="h-4 w-4 text-orange-500" />
                <p className="text-xs text-muted-foreground">Card Shares</p>
              </div>
              <hr className="w-full border-gray-200" />
              <div className="text-left">
                <p className="text-lg font-semibold">{cardShare}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <MousePointer className="h-4 w-4 text-red-500" />
                <p className="text-xs text-muted-foreground">Link Clicks</p>
              </div>
              <hr className="w-full border-gray-200" />
              <div className="text-left">
                <p className="text-lg font-semibold">{cardLink}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-pink-500" />
                <p className="text-xs text-muted-foreground">Ad Views</p>
                <Crown size={12} className="text-yellow-500" />
              </div>
              <hr className="w-full border-gray-200" />
              <div className="text-left">
                <p className="text-lg font-semibold">{cardAdsView}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-500" />
                <p className="text-xs text-muted-foreground">Leads</p>
                <Crown size={12} className="text-yellow-500" />
              </div>
              <hr className="w-full border-gray-200" />
              <div className="text-left">
                <p className="text-lg font-semibold">{cardLeadGenerated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Referrals Levels */}
        {/* <Card className="lg:col-span-1 border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Referrals Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {referralLevels.map((level, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${level.color}`}
                    ></div>
                    <span className="text-sm font-medium">{level.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {level.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}

        {/* Card Analytics Chart */}
        <Card className="lg:col-span-4 border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                <div className="flex items-center gap-1 text-xs sm:text-sm">
                  Card Analytics{" "}
                  {isProLocked && (
                    <Lock
                      size={14}
                      className="ml-1 text-yellow-500"
                      onClick={() => onLockClick()}
                    />
                  )}
                </div>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Track your card performance across all metrics
              </p>
            </div>
            <div
              className={`flex flex-wrap items-center gap-2 transition-all duration-300 ${
                isProLocked ? "opacity-60 blur-[2px] pointer-events-none" : ""
              }`}
            >
              <div className="flex items-center border rounded-md">
                <Button
                  variant={chartType === "area" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType("area")}
                  className="rounded-r-none border-r"
                >
                  <AreaChartIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === "bar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType("bar")}
                  className="rounded-l-none"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center border rounded-md">
                <Button
                  variant={timeRange === "7d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange("7d")}
                  className="rounded-r-none border-r text-xs px-2"
                >
                  7d
                </Button>
                <Button
                  variant={timeRange === "30d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange("30d")}
                  className="rounded-none border-r text-xs px-2"
                >
                  30d
                </Button>
                <Button
                  variant={timeRange === "90d" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange("90d")}
                  className="rounded-none border-r text-xs px-2"
                >
                  90d
                </Button>
                <Button
                  variant={timeRange === "1y" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange("1y")}
                  className="rounded-l-none text-xs px-2"
                >
                  1y
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent
            className={`transition-all duration-300 ${
              isProLocked ? "opacity-60 blur-[2px] pointer-events-none" : ""
            }`}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={chartData[timeRange]}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Views"
                    />
                    <Area
                      type="monotone"
                      dataKey="saves"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Saves"
                    />
                    <Area
                      type="monotone"
                      dataKey="shares"
                      stackId="1"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.6}
                      name="Shares"
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                      name="Clicks"
                    />
                    <Area
                      type="monotone"
                      dataKey="adViews"
                      stackId="1"
                      stroke="#ec4899"
                      fill="#ec4899"
                      fillOpacity={0.6}
                      name="Ad Views"
                    />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      stackId="1"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.6}
                      name="Leads"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData[timeRange]}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="views" fill="#3b82f6" name="Views" />
                    <Bar dataKey="saves" fill="#10b981" name="Saves" />
                    <Bar dataKey="shares" fill="#f97316" name="Shares" />
                    <Bar dataKey="clicks" fill="#ef4444" name="Clicks" />
                    <Bar dataKey="adViews" fill="#ec4899" name="Ad Views" />
                    <Bar dataKey="leads" fill="#8b5cf6" name="Leads" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
