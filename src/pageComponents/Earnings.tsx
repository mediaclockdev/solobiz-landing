"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, DollarSign, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IncomeFromReferrals } from "@/components/dashboard/IncomeFromReferrals";
import { useAuth } from "@/contexts/AuthContext";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/contexts/ToastContext";

const Earnings = () => {
  const paymentSchedule = [
    {
      month: "May 2025",
      label: "[current]",
      amount: "$1,230.00",
      dueDate: "30th",
      status: "current",
    },
    { month: "Jun. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Jul. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Aug. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Sept. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Oct. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Nov. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Dec. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Jan. 2026", amount: "$1,230.00", dueDate: "30th" },
    { month: "Feb. 2026", amount: "$350.00", dueDate: "28th" },
    { month: "Mar. 2026", amount: "$100.00", dueDate: "30th" },
    { month: "Apr. 2026", amount: "$0.00", dueDate: "30th" },
  ];

  // const recentActivities = [
  //   { amount: "$23.40", description: "for 50% yearly service pmt." },
  //   { amount: "$4.68", description: "for 10% yearly service pmt." },
  //   { amount: "$2.47", description: "for 50% monthly service pmt." },
  //   { amount: "$0.49", description: "for 10% monthly service pmt." },
  // ];

  // const payoutHistory = [
  //   { amount: "$1,230.00", date: "Apr. 2025" },
  //   { amount: "$850.00", date: "Mar. 2025" },
  //   { amount: "$1,130.00", date: "Feb. 2025" },
  //   { amount: "$1,130.00", date: "Jan. 2025" },
  // ];
  const [open, setOpen] = useState(false);

  const [openMonthlyPrice, setOpenMonthlyPrice] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Show only the last 5

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
  const [loading, setLoading] = useState(false);
  const createdAt = user?.metadata?.creationTime ?? new Date();
  const [formattedHistory, setFormattedHistory] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const lastFive = recentActivities.slice(0, 5);

  const [monetizationStatus, setMonetizationStatus] = useState<
    "not_monetized" | "eligible" | "active"
  >("not_monetized");

  const [hasPending, setHasPending] = useState(false);
  const [eligibleSince, setEligibleSince] = useState<string>("");
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [activeSince, setActiveSince] = useState<string>("");
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [paypalAccount, setPaypalAccount] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { showToast } = useToast();
  const [valueSet, resetValueSet] = useState(0);

  const [grossAddonsChildEarning, setGrossAddonsChildEarning] = useState(0);
  const [grossAddonsGrandChildEarning, setGrossAddonsGrandChildEarning] =
    useState(0);

  const [earningCheck, setEarningCheck] = useState<boolean>(false);

  const date = new Date(createdAt);
  const day = date.getDate();
  const getDaySuffix = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
  };
  const formattedDate = date.toLocaleDateString("en-GB", options);
  const formatted = `${day}${getDaySuffix(day)} ${formattedDate}`;
  async function getRelations(userId: string) {
    const userRef = doc(db, "referrals", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const children = userData.children || [];
      const grandchildren = userData.grandchildren || [];

      return {
        childrenCount: children.length,
        grandchildrenCount: grandchildren.length,
        total: children.length + grandchildren.length,
      };
    }

    return { childrenCount: 0, grandchildrenCount: 0, total: 0 };
  }

  const [counts, setCounts] = useState({
    childrenCount: 0,
    grandchildrenCount: 0,
    total: 0,
  });

  const fetchPaidCounts = async () => {
    setIsLoading(true);
    const userRef = doc(db, "referrals", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();

    const currentLevel = userData.badgeLevel;
    const levelDateISO = userData.LevelsUpdate
      ? userData.LevelsUpdate[currentLevel]
      : new Date();
    const balanceEarnings = userData.balanceEarnings || {};
    const earningsCost = userData.earningsCost || {};
    // Convert to array of [uid, amount]
    if (balanceEarnings) {
      const reversedEntries = Object.entries(balanceEarnings).reverse();
      const reversedCostEntries = Object.entries(earningsCost).reverse();
      const result = [];
      let totalAmount = 0;
      for (const [uid, plans] of reversedEntries) {
        // Fetch user profile
        const profileRef = doc(db, "users", uid);
        const profileSnap = await getDoc(profileRef);

        const profile = profileSnap.exists() ? profileSnap.data() : {};
        const earningsCost =
          reversedCostEntries.find(([id, cost]) => id === uid)?.[1] ?? 0;
        // Get cost structure for this user
        const costPlans = earningsCost[uid] || {};
        const planType = profile.planType || "free"; // default safety
        const subscriptionExist = profile?.subscriptionStartDate || null;
        const refund = profile?.refund || null;

        // Loop through plan types (pro, addons, etc.)
        for (const [planName, amount] of Object.entries(plans)) {
          totalAmount += Number(amount);
          if (subscriptionExist) {
            result.push({
              uid,
              planName,
              amount, // plan-wise earning
              earcningsCost: earningsCost,
              name: profile.displayName || "Unknown",
              email: profile.email || "No Email",
              status: subscriptionExist && refund ? "cancelled" : null,
            });
          }
        }
      }
      setRecentActivities(result);
      // setTotalEarnings(totalAmount);
    }

    if (levelDateISO) {
      const date = new Date(levelDateISO);
      const day = date.getDate();
      const daySuffix = (d) => {
        if (d > 3 && d < 21) return "th";
        switch (d % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      };

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();

      const level3FormattedDateNew = ` ${month} ${day}${daySuffix(
        day
      )} ${year}`;

      setLevel3FormattedDate(level3FormattedDateNew);
      setCurrentLevel(currentLevel);

      if (currentLevel >= 3) {
        if (monetizationStatus != "active") {
          const monetizationStatus = "eligible";
          setMonetizationStatus(monetizationStatus);
        }
        setEligibleSince(levelDateISO || "");
        setActiveSince(levelDateISO || "");
      }

      setLoading(false);
    }

    if (currentLevel >= 3) {
      if (!user?.uid) {
        console.error("User UID not found");
        return;
      }

      const olduserRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(olduserRef);

      if (userSnap.exists()) {
        const userInfo = userSnap.data() as any;
        const userRef = doc(db, "users", user?.uid);
        if (!userInfo.userChildEarning) {
          const userChildEarning = childEarnings;
          await updateDoc(userRef, {
            userChildEarning: userChildEarning,
          });
        } else {
          setChildEarnings(userInfo.userChildEarning);
        }

        if (!userInfo.userGrandChildEarning) {
          const userGrandChildEarning = grandchildEarnings;
          await updateDoc(userRef, {
            userGrandChildEarning: userGrandChildEarning,
          });
        } else {
          setGrandchildEarnings(userInfo.userGrandChildEarning);
        }
      }
    }

    const children = userData.children || [];
    const noOfChild = children.length;
    let noOfGC = 0;
    let paidChild = 0;
    let firstPaidInitial = new Date();
    let paidGC = 0;
    let addonsGrossGCChildEarning = 0;
    let addonsGrossChildEarning = 0;
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
        if (userchildData.addons?.length > 0) {
          userchildData.addons.map((addons) => {
            if (userchildData.planType === "paid") {
              addonsGrossChildEarning +=
                Number(childEarnings * addons.price) / 100;
            }
          });
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

          if (userchildData.addons?.length > 0) {
            userchildData.addons.map((addons) => {
              if (userchildData.planType === "paid") {
                addonsGrossGCChildEarning +=
                  Number(grandchildEarnings * addons.price) / 100;
              }
            });
          }
        }
      }
    }
    setScheduleCurrentMonth(firstPaidInitial);
    setChilPaidReferals(paidChild > 0 ? (paidChild * 100) / noOfChild : 0);
    setGrandChilPaidReferals(paidGC > 0 ? (paidGC * 100) / noOfGC : 0);

    setGrossAddonsChildEarning(Number(addonsGrossChildEarning));
    setGrossAddonsGrandChildEarning(Number(addonsGrossGCChildEarning));

    setChilPaid(Number(paidChild));
    setGrandChilPaid(Number(paidGC));

    const grossChildEarning =
      addonsGrossChildEarning +
      Number((childPaid * childEarnings * pricing) / 100);

    const grossGChildEarning =
      addonsGrossGCChildEarning +
      Number((grandChildPaid * grandchildEarnings * pricing) / 100);

    const netChildEarning =
      grossChildEarning - (grossChildEarning * operatingCostRate) / 100;
    const netGChildEarning =
      grossGChildEarning - (grossGChildEarning * operatingCostRate) / 100;
    const sechduleAmount = Number(netChildEarning + netGChildEarning);
    setScheduleAmount(sechduleAmount);
    const schedule = await generateSchedule(
      scheduleCurrentMonth.getMonth(),
      scheduleCurrentMonth.getFullYear(),
      16,
      4,
      Number(sechduleAmount / 12),
      scheduleAmount
    );
    setPaymentScheduled(schedule);
    setIsLoading(false);
    resetValueSet(1);
  };

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

  const updateReferralEarningsAndBalance = async (userId) => {
    try {
      // User earnings
      const userSnap = await getDoc(doc(db, "users", userId));
      if (!userSnap.exists()) return;

      const { userChildEarning = 0, userGrandChildEarning = 0 } =
        userSnap.data();

      // Pricing (convert from cents)
      const pricingSnap = await getDoc(
        doc(db, "settings", "PricingRequirement")
      );
      if (!pricingSnap.exists()) return;

      const price =
        Number(pricingSnap.data().proUpgradeYearlyWithDiscount || 0) / 100;

      // Referral doc
      const referralRef = doc(db, "referrals", userId);
      const referralSnap = await getDoc(referralRef);
      if (!referralSnap.exists()) return;

      const {
        children = [],
        grandchildren = [],
        earningsCost = {},
        balanceEarnings = {},
        childBalanceEarnings = {},
      } = referralSnap.data();

      const updatedEarningsCost = { ...earningsCost };
      const updatedBalanceEarnings = { ...balanceEarnings };
      const updatedChildBalanceEarnings = { ...childBalanceEarnings };

      // Children
      children.forEach((childId) => {
        updatedEarningsCost[childId] = userChildEarning;
        updatedBalanceEarnings[childId] = {
          ...(updatedBalanceEarnings[childId] || {}),
          Pro: Number((price * userChildEarning).toFixed(2)),
        };

        // Update childBalanceEarnings only for children
        updatedChildBalanceEarnings[childId] = Number(
          (price * userChildEarning).toFixed(2)
        );
      });

      // Grandchildren
      grandchildren.forEach((grandChildId) => {
        updatedEarningsCost[grandChildId] = userGrandChildEarning;
        updatedBalanceEarnings[grandChildId] = {
          ...(updatedBalanceEarnings[grandChildId] || {}),
          Pro: Number((price * userGrandChildEarning).toFixed(2)),
        };
      });

      await updateDoc(referralRef, {
        earningsCost: updatedEarningsCost,
        balanceEarnings: updatedBalanceEarnings,
        childBalanceEarnings: updatedChildBalanceEarnings,
      });

      console.log("Referral earnings and balances updated successfully.");
    } catch (err) {
      console.error(err);
    }
  };

  // const updateReferralEarningsAndBalance = async (userId) => {
  //   try {
  //     // User earnings
  //     const userSnap = await getDoc(doc(db, "users", userId));
  //     if (!userSnap.exists()) return;

  //     const { userChildEarning = 0, userGrandChildEarning = 0 } =
  //       userSnap.data();

  //     // Pricing (convert from cents)
  //     const pricingSnap = await getDoc(
  //       doc(db, "settings", "PricingRequirement")
  //     );
  //     if (!pricingSnap.exists()) return;

  //     const price =
  //       Number(pricingSnap.data().proUpgradeYearlyWithDiscount || 0) / 100;

  //     // Referral doc
  //     const referralRef = doc(db, "referrals", userId);
  //     const referralSnap = await getDoc(referralRef);
  //     if (!referralSnap.exists()) return;

  //     const {
  //       children = [],
  //       grandchildren = [],
  //       earningsCost = {},
  //       balanceEarnings = {},
  //     } = referralSnap.data();

  //     const updatedEarningsCost = { ...earningsCost };
  //     const updatedBalanceEarnings = { ...balanceEarnings };

  //     // Children
  //     children.forEach((childId) => {
  //       updatedEarningsCost[childId] = userChildEarning;
  //       updatedBalanceEarnings[childId] = {
  //         ...(updatedBalanceEarnings[childId] || {}),
  //         Pro: Number((price * userChildEarning).toFixed(2)),
  //       };
  //     });

  //     // Grandchildren
  //     grandchildren.forEach((grandChildId) => {
  //       updatedEarningsCost[grandChildId] = userGrandChildEarning;
  //       updatedBalanceEarnings[grandChildId] = {
  //         ...(updatedBalanceEarnings[grandChildId] || {}),
  //         Pro: Number((price * userGrandChildEarning).toFixed(2)),
  //       };
  //     });

  //     await updateDoc(referralRef, {
  //       earningsCost: updatedEarningsCost,
  //       balanceEarnings: updatedBalanceEarnings,
  //     });
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  useEffect(() => {
    const fetchCounts = async () => {
      const res = await getRelations(user.uid);
      setCounts(res);
    };

    const fetchMonetizedData = async () => {
      const monetizedRef = doc(db, "monetized", user?.uid);
      const monetizedSnap = await getDoc(monetizedRef);

      if (monetizedSnap.exists()) {
        const existingData = monetizedSnap.data();
        if (existingData.status === "pending") {
          setHasPending(true);
          return;
        }
        if (existingData.status === "active") {
          setHasPending(false);
          setLoading(true);
          setMonetizationStatus("active");
          setLoading(false);
          return;
        }
      }
    };

    if (user) {
      updateReferralEarningsAndBalance(user?.uid);
      setIsLoading(true);
      fetchSettings();
      fetchCounts();
      fetchPaidCounts();
      setIsLoading(false);
      fetchMonetizedData();
    }
  }, [isLoading, user]);

  async function generateSchedule(
    scheduleStartMonth,
    currentYear,
    totalMonths = 12,
    zeroMonths = 4,
    finalAmount = 10,
    totalEarningAmount
  ) {
    if (!user?.uid) return [];

    const schedule = [];
    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0-based (0 = Jan)

    // --- Fetch existing Firestore data once ---
    const earningRef = doc(db, "earnings", user.uid);
    const earningSnap = await getDoc(earningRef);
    const existingEarnings = earningSnap.exists()
      ? earningSnap.data()?.yearWiseEarnings || {}
      : {};
    let oldEarnings = earningSnap.data()?.totalEarningBalance ?? 0;
    // --- Precompute zero-value months ---
    const zeroMonthIndices = [];
    for (let i = 0; i < zeroMonths; i++) {
      const date = new Date(currentYear, currentMonthIndex + i, 1);
      const monthIndex = date.getMonth();
      const monthName = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      zeroMonthIndices.push(`${monthIndex}-${year}`);
    }

    // --- Build Schedule ---
    for (let i = 0; i < totalMonths; i++) {
      const date = new Date(currentYear, currentMonthIndex + i, 1);
      const monthIndex = date.getMonth();
      const monthName = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();

      // 🔍 Check existing Firestore data for this month
      const existingMonthData = existingEarnings?.[year]?.[monthName] || null;

      let amount;
      let status = "unpaid";
      let breakDown =
        Number(oldEarnings.toFixed(2)) > Number(totalEarningAmount.toFixed(2))
          ? []
          : existingMonthData?.breakdown ?? [];

      if (existingMonthData && existingMonthData.status === "paid") {
        // If paid, keep old amount and status
        amount = existingMonthData.amount;
        status = "paid";
      } else {
        // Otherwise, follow normal logic
        amount = zeroMonthIndices.includes(`${monthIndex}-${year}`)
          ? 0
          : finalAmount;
      }
      const totalBreakdown = breakDown.reduce((sum, val) => sum + val, 0);
      if (
        Number(oldEarnings.toFixed(2)) <
          Number(totalEarningAmount.toFixed(2)) &&
        Number(totalBreakdown.toFixed(2)) < Number(amount.toFixed(2))
      ) {
        let breakdownamount = Number(totalEarningAmount) - Number(oldEarnings);
        let newEarningCount = Number(breakdownamount / 12);
        let breakAmount = zeroMonthIndices.includes(`${monthIndex}-${year}`)
          ? 0
          : newEarningCount;

        breakDown.push(Number(breakAmount.toFixed(2)));
      }
      if (totalBreakdown <= 0) {
        let breakdownamount = Number(totalEarningAmount);
        let newEarningCount = Number(breakdownamount / 12);
        let breakAmount = zeroMonthIndices.includes(`${monthIndex}-${year}`)
          ? 0
          : newEarningCount;

        breakDown.push(Number(breakAmount.toFixed(2)));
      }
      // Determine last day of month
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      const dueDate = `${lastDay}th`;

      schedule.push({
        month: `${monthName} ${year}`,
        year,
        monthName,
        amount: Number(amount.toFixed(2)),
        label: i === 0 ? "[current]" : "",
        status,
        dueDate,
        breakdown: breakDown,
      });
    }

    // --- Compute totals ---
    const totalEarningBalance = schedule.reduce((sum, s) => sum + s.amount, 0);

    // --- Convert to year-wise object ---
    const yearWiseEarnings = {};
    schedule.forEach((item) => {
      if (!yearWiseEarnings[item.year]) {
        yearWiseEarnings[item.year] = {};
      }
      yearWiseEarnings[item.year][item.monthName] = {
        amount: item.amount,
        status: item.status,
        breakdown: item.breakdown,
      };
    });
    // --- Save to Firestore ---
    try {
      if (earningSnap.exists()) {
        // Merge existing and new earnings
        //  const mergedEarnings = { ...existingEarnings };
        const mergedEarnings = JSON.parse(JSON.stringify(existingEarnings));

        for (const [year, months] of Object.entries(yearWiseEarnings)) {
          if (!mergedEarnings[year]) mergedEarnings[year] = {};

          for (const [monthName, value] of Object.entries(months)) {
            const existingMonth = mergedEarnings[year][monthName] || {
              amount: 0,
              status: "unpaid",
            };

            // Only overwrite if not already paid
            if (existingMonth.status !== "paid") {
              mergedEarnings[year][monthName] = value;
            }
          }
        }

        if (!earningCheck) {
          const isEqual =
            JSON.stringify(mergedEarnings) === JSON.stringify(existingEarnings);

          if (
            Number(oldEarnings.toFixed(2)) <
            Number(totalEarningAmount.toFixed(2))
          ) {
            setEarningCheck(true);
            await updateDoc(earningRef, {
              totalEarningBalance: Number(totalEarningBalance.toFixed(2)),
              yearWiseEarnings: mergedEarnings,
              updatedAt: serverTimestamp(),
            });
          } else {
            setEarningCheck(false);
          }
        }
      } else {
        await setDoc(earningRef, {
          userId: user.uid,
          totalEarningBalance: Number(totalEarningBalance.toFixed(2)),
          yearWiseEarnings,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error saving earnings:", error);
    }

    return schedule;
  }

  const fetchPaidEarnings = async (userId: string) => {
    const ref = doc(db, "earnings", userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return [];

    const data = snap.data();
    const yearWise = data.yearWiseEarnings || {};

    const results: { month: string; year: string; amount: number }[] = [];

    // Loop through each year
    Object.keys(yearWise).forEach((year) => {
      const months = yearWise[year];

      // Loop through each month
      Object.keys(months).forEach((month) => {
        const record = months[month];

        if (record.status === "paid") {
          results.push({
            month,
            year,
            amount: record.amount,
          });
        }
      });
    });

    return results;
  };

  useEffect(() => {
    if (!user?.uid) return;

    const load = async () => {
      const paid = await fetchPaidEarnings(user.uid);

      const formatted = paid.map((item) => {
        const formattedAmount = `$${Number(item.amount).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`;

        return {
          amount: formattedAmount,
          date: `${item.month} - ${item.year}`,
        };
      });

      setFormattedHistory(formatted);
    };

    load();
  }, [user?.uid]);

  const refreshStatus = () => {
    // const userData = loadUserData();
    // if (userData) {
    //   setMonetizationStatus(userData.monetizationStatus || "not_monetized");
    //   setActiveSince(userData.monetizationActiveSince || "");
    //   if (userData.userId) {
    //     setHasPending(hasPendingRequest(userData.userId));
    //   }
    // }
  };

  const handleActivation = async () => {
    if (!paypalAccount.trim()) {
      showToast("Please provide your PayPal account email or phone", "error");
      return;
    }

    if (!termsAccepted) {
      showToast("Please accept the payment terms and conditions", "error");
      return;
    }

    try {
      const userId = user?.uid;
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      // if (!userSnap.exists()) {
      //   showToast("User record not found in database.", "error");
      //   return;
      // }

      const userData = userSnap.data();

      const monetizationData = {
        userId: userId,
        userName: userData.displayName || "Unknown User",
        email: userData.email || "",
        referralNumber: userData.referralCode || "N/A",
        paypalAccount: paypalAccount.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const monetizedRef = doc(db, "monetized", userId);
      await setDoc(monetizedRef, monetizationData, { merge: true });

      showToast("Activation Request Submitted", "success");

      setShowActivationDialog(false);
      setPaypalAccount("");
      setTermsAccepted(false);

      refreshStatus();
    } catch (error) {
      console.error("Error submitting activation request:", error);
      showToast("Failed to submit request", "error");
    }
  };

  const [openModal, setOpenModal] = useState(false);

  const lastFivePaymet = formattedHistory?.slice(0, 5) || [];
  const remaining = formattedHistory?.slice(5) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Monetization Status */}
        {/* <Alert className="border-green-200 bg-green-50">
          <AlertTitle className="text-base font-semibold">
            Monetization Status
          </AlertTitle>
          <AlertDescription className="text-base mt-2">
            {currentLevel >= 3 ? (
              <>
                <span className="font-medium text-green-600">
                  [Monetzed - Active]
                </span>{" "}
                - Since {level3FormattedDate}
              </>
            ) : (
              <span className="font-medium text-red-600">
                [Not Monetzed - Inactive]
              </span>
            )}
          </AlertDescription>
        </Alert> */}

        {loading || monetizationStatus == null ? (
          <div className="flex justify-center items-center py-6">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {monetizationStatus === "not_monetized" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTitle className="text-base font-semibold">
                  Monetization Status
                </AlertTitle>
                <AlertDescription className="text-base mt-2">
                  <span className="font-medium text-red-600">
                    Not Monetized - Inactive
                  </span>
                  <p className="text-sm text-muted-foreground mt-2">
                    You need to meet the requirements to become eligible for
                    monetization.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {monetizationStatus === "eligible" && !hasPending && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTitle className="text-base font-semibold">
                  Monetization Status
                </AlertTitle>
                <AlertDescription className="text-base mt-2">
                  <span className="font-medium text-orange-600">
                    Monetized - Eligible:
                  </span>{" "}
                  since{" "}
                  {eligibleSince
                    ? new Date(eligibleSince).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                    onClick={() => setShowActivationDialog(true)}
                  >
                    Request Activation
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {monetizationStatus === "eligible" && hasPending && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTitle className="text-base font-semibold">
                  Monetization Status
                </AlertTitle>
                <AlertDescription className="text-base mt-2">
                  <span className="font-medium text-orange-600">
                    Monetized - Eligible:
                  </span>{" "}
                  since{" "}
                  {eligibleSince
                    ? new Date(eligibleSince).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                  <div className="mt-3 p-3 bg-white rounded-md border border-orange-300">
                    <p className="text-sm font-medium text-orange-700">
                      ⏳ Activation Request Pending
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your request is under review. You'll receive an email
                      notification once approved.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {monetizationStatus === "active" && activeSince && (
              <Alert className="border-green-200 bg-green-50">
                <AlertTitle className="text-base font-semibold">
                  Monetization Status
                </AlertTitle>
                <AlertDescription className="text-base mt-2">
                  <span className="font-medium text-green-600">
                    Monetized - Active:
                  </span>{" "}
                  since{" "}
                  {activeSince
                    ? new Date(activeSince).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                  <p className="text-sm text-muted-foreground mt-2">
                    🎉 You're now earning from referrals! Payments are processed
                    monthly.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Income From Referrals */}
        <IncomeFromReferrals
          countRef={counts.total}
          countChild={counts.childrenCount}
          countGrandChild={counts.grandchildrenCount}
          paidChildReferals={childPaidReferals}
          grandChildPaidReferals={grandChildPaidReferals}
          paidChild={childPaid}
          grandChildPaid={grandChildPaid}
          grossAddonsChildEarning={grossAddonsChildEarning}
          grossAddonsGrandChildEarning={grossAddonsGrandChildEarning}
        />

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          <div className="lg:col-span-3">
            <h2 className="text-base font-semibold mb-4">Earnings Summary</h2>
            <p className="text-sm text-muted-foreground">
              Track your pending and completed earnings from referrals.
            </p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg lg:col-span-1 lg:col-start-6 border border-blue-300 hover:border-blue-500 card-hover cursor-pointer">
            <div className="text-sm text-muted-foreground mb-1">
              12-Month Total
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ${Number(scheduleAmount).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Payment Schedule */}
        <div>
          <h2 className="text-base font-semibold mb-4">Payment Schedule</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Total payments are due by the 28th of each month.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {paymentScheduled.map((payment, index) => (
              <Card
                key={index}
                className={`card-hover cursor-pointer ${
                  payment.status === "current"
                    ? "bg-blue-50 border-blue-200 hover:border-blue-400"
                    : "hover:border-gray-400"
                }`}
                onClick={() => {
                  setSelectedPayment(payment);
                  setOpenMonthlyPrice(true);
                }}
              >
                <CardHeader className="pb-2">
                  {" "}
                  <CardTitle className="text-sm font-medium flex items-center gap-2 pb-2 border-b border-gray-200">
                    {payment.month}
                    {payment.label && (
                      <Badge variant="secondary" className="text-xs">
                        {payment.label}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 py-3">
                  <div className="text-lg font-bold">
                    ${Number(payment.amount || 0).toFixed(2)}
                  </div>
                  {/* <div className="text-xs text-muted-foreground">
                    Due Date: {payment.dueDate}.
                  </div> */}
                  <button className="text-xs text-blue-600 hover:underline pt-1">
                    Details here &gt;
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

          <AlertDialog
            open={openMonthlyPrice}
            onOpenChange={setOpenMonthlyPrice}
          >
            <AlertDialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
              <AlertDialogHeader>
                <AlertDialogTitle>{selectedPayment?.month}</AlertDialogTitle>
                <AlertDialogCancel className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </AlertDialogCancel>
              </AlertDialogHeader>
              <div className="space-y-3 max-h-80 overflow-y-auto mt-4">
                {selectedPayment?.breakdown?.length > 0 ? (
                  selectedPayment.breakdown.map(
                    (value: number, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between border-b pb-2"
                      >
                        <span className="text-blue-600 font-semibold">
                          ${value.toFixed(2)}
                        </span>
                      </div>
                    )
                  )
                ) : (
                  <span className="text-blue-600 font-semibold">$0.00</span>
                )}
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Recent Activities and Payout History */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {/* Recent Activities */}
          <Card className="lg:col-span-2 hover:border-gray-400 card-hover cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Recent Activities
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p>NOTE: Any income earned in this month</p>
                      <p>will be paid after the following 3-months,</p>
                      <p>and at the end of the 4th. month.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Trigger link */}
              <div
                className="text-sm text-blue-600 hover:underline cursor-pointer mb-4"
                onClick={() => setOpen(true)}
              >
                Last 30 recent activities &gt;
              </div>

              {/* Display last 5 payments */}
              {lastFive.length > 0 ? (
                lastFive.map((activity, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center ${
                      activity?.status ? "text-red-600 line-through" : ""
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        activity?.status
                          ? "text-red-600 line-through"
                          : "text-blue-600"
                      }`}
                    >
                      ${activity.amount}{" "}
                      {activity?.status && ` (${activity.status})`}
                    </span>
                    <span
                      className={`text-sm ${
                        activity?.status
                          ? "text-red-600 line-through"
                          : "text-muted-foreground"
                      }`}
                    >
                      for {activity.earcningsCost}% service pmt.
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No data found
                </div>
              )}

              {/* Popup (Modal) */}
              <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Recent Activities Listing
                    </AlertDialogTitle>
                    <AlertDialogCancel className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100">
                      <X className="w-5 h-5" />
                    </AlertDialogCancel>
                  </AlertDialogHeader>

                  <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
                    {recentActivities && recentActivities.length > 0 ? (
                      recentActivities.map((activity, index) => (
                        <div
                          key={index}
                          className={`flex justify-between items-center border-b pb-2 ${
                            activity?.status ? "text-red-600 line-through" : ""
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${
                              activity?.status
                                ? "text-red-600 line-through"
                                : "text-blue-600"
                            }`}
                          >
                            ${activity.amount}{" "}
                            {activity?.status && ` (${activity.status})`}
                          </span>

                          <span
                            className={`text-sm ${
                              activity?.status
                                ? "text-red-600 line-through"
                                : "text-muted-foreground"
                            }`}
                          >
                            for {activity.earcningsCost}% service pmt.
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No data found
                      </p>
                    )}
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Payout History */}
          {/* CARD */}
          <Card className="lg:col-span-2 hover:border-gray-400 card-hover cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Payout History
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* TRIGGER MODAL */}
              <div
                onClick={() => setOpenModal(true)}
                className="text-sm text-blue-600 hover:underline cursor-pointer mb-4"
              >
                Last 30 days payments &gt;
              </div>

              {/* SHOW LAST 5 RECORDS */}
              {lastFivePaymet.length > 0 ? (
                lastFivePaymet.map((payout, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm font-medium text-blue-600">
                      {payout.amount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {payout.date}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No data found
                </div>
              )}
            </CardContent>
          </Card>

          {/* MODAL FOR ALL RECORDS */}
          <AlertDialog open={openModal} onOpenChange={setOpenModal}>
            <AlertDialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-full">
              <AlertDialogHeader>
                <AlertDialogTitle>Payout History</AlertDialogTitle>
                <AlertDialogCancel className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </AlertDialogCancel>
              </AlertDialogHeader>

              {formattedHistory && formattedHistory.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 mt-2">
                  {formattedHistory.map((payout, i) => (
                    <div key={i} className="flex justify-between border-b py-2">
                      <span className="font-medium text-blue-600">
                        {payout.amount}
                      </span>
                      <span className="text-muted-foreground">
                        {payout.date}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No data found
                </p>
              )}
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Activation Dialog */}
        <AlertDialog
          open={showActivationDialog}
          onOpenChange={setShowActivationDialog}
        >
          <AlertDialogContent className="sm:max-w-md w-[calc(100%-2rem)] sm:w-full">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold">
                PAYMENT ACCOUNT REQUIREMENT
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 pt-4">
                <div className="space-y-2 text-sm text-foreground">
                  <p>
                    <strong>1.</strong> To receive payment, you need a valid
                    PayPal Account where your payouts will be sent.
                  </p>
                  <p>
                    <strong>2.</strong> Provide your PayPal Account Name in the
                    input field below
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="paypal-account">
                  Email or Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="paypal-account"
                  type="text"
                  placeholder="Enter your PayPal email or phone"
                  value={paypalAccount}
                  onChange={(e) => setPaypalAccount(e.target.value)}
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) =>
                    setTermsAccepted(checked as boolean)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept the{" "}
                    <button
                      type="button"
                      className="text-primary underline hover:text-primary/80"
                      onClick={() => setShowTermsDialog(true)}
                    >
                      payment terms and conditions
                    </button>
                    <span className="text-destructive"> *</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleActivation}>Activate</Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Terms and Conditions Dialog */}
        <AlertDialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
          <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Payment Terms and Conditions</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-foreground max-h-[400px] overflow-y-auto">
                <p className="font-semibold">Payment Processing</p>
                <p>
                  All payments will be processed through PayPal. You must have a
                  valid PayPal account to receive payments.
                </p>

                <p className="font-semibold">Payment Schedule</p>
                <p>
                  Payments are processed monthly, with a 90-day holding period.
                  Earnings from any given month will be paid at the end of the
                  4th month.
                </p>

                <p className="font-semibold">Minimum Payout Threshold</p>
                <p>
                  A minimum balance of $50 is required for payout processing.
                  Amounts below this threshold will roll over to the next
                  payment period.
                </p>

                <p className="font-semibold">Account Verification</p>
                <p>
                  Your PayPal account must be verified and in good standing to
                  receive payments. Invalid or suspended accounts may result in
                  payment delays or forfeiture.
                </p>

                <p className="font-semibold">Tax Compliance</p>
                <p>
                  You are responsible for reporting all earnings to relevant tax
                  authorities. We will provide necessary documentation for tax
                  purposes.
                </p>

                <p className="font-semibold">Payment Disputes</p>
                <p>
                  Any payment disputes must be reported within 30 days of the
                  payment date. All disputes will be reviewed on a case-by-case
                  basis.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>I Understand</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default Earnings;
