"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Users, GitBranch, TrendingUp, Percent } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function ReferralsLevels() {
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

  useEffect(() => {
    async function fetchCounts() {
      const userId = user?.uid;
      const children = await countChildren(userId);
      const parents = await countParents(userId);
      setParentCount(parents);
      setChildCount(children);
    }

    const fetchSettings = async () => {
      try {
        const userId = user?.uid;
        if (!userId) return;

        const settingsRef = doc(db, "users", userId);
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) return;
        const settings = settingsSnap.data();

        const settingsReferralEarningRate = doc(db, "users", userId);
        const settingssettingsReferralEarningRateSnap = await getDoc(
          settingsReferralEarningRate
        );
        if (!settingssettingsReferralEarningRateSnap.exists()) return;
        const settingsData = settingssettingsReferralEarningRateSnap.data();

        setchildEarnings(settingsData.childEarnings);
        setRgrandchildEarnings(settingsData.grandchildEarnings);

        const MNR = settings.l2Child;
        setMNR?.(MNR);

        // --- Fetch user data ---
        const userRef = doc(db, "referrals", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data();

        const children = userData.children || [];
        const RCA = children.length;

        let childrenReachedLevel2 = 0;
        let totalGrandChildrenFromLevel2 = 0;
        let totalGrandChildrenAll = 0;
        let level3Count = 0;

        const nonLevel2Deficits = [];
        for (const childId of children) {
          const childRef = doc(db, "referrals", childId);
          const childSnap = await getDoc(childRef);

          if (!childSnap.exists()) {
            continue;
          }

          const childData = childSnap.data();
          const childChildren = childData.children || [];
          const childRCA = childChildren.length;
          const childLevel = Number(childData.Level ?? childData.Level) || 1;

          totalGrandChildrenAll += childRCA;

          if (childRCA >= MNR || childLevel >= 2) {
            childrenReachedLevel2++;
            totalGrandChildrenFromLevel2 += childRCA;
          } else {
            const deficit = Math.max(0, MNR - childRCA);
            nonLevel2Deficits.push(deficit);
          }

          if (childLevel >= 3) {
            level3Count++;
          }
        }

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
          MNR - childrenReachedLevel2
        );

        let remainingPoints = childrenRemainingLevel2;
        let levelPercentage = RCA ? (childrenReachedLevel2 * 100) / RCA : 0;
        setLevelUpPercentage(Number(levelPercentage));

        let userLevelStr = 1;
        let memberLevel = "Starter";
        let requiredChildrenToNext = 0;
        let requiredGrandChildrenToNext = 0;
        let nextLevelName = "";

        if (RCA < MNR) {
          userLevelStr = 1;
          memberLevel = "Starter";
          requiredChildrenToNext = Math.max(0, MNR - RCA);
          requiredGrandChildrenToNext = 0;
          nextLevelName = "Level-Up";
          remainingPoints = 0;
        } else if (childrenReachedLevel2 < MNR) {
          userLevelStr = childrenReachedLevel2;
          memberLevel = "Level-Up";
          requiredChildrenToNext = childrenRemainingLevel2;
          requiredGrandChildrenToNext = remainingGrandChildren;
          nextLevelName = "Bronze";
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
            MNR * MNR - totalGrandChildrenFromLevel2
          );
          nextLevelName = "Bronze";
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
        } else if (
          totalGrandChildrenFromLevel2 <
          settings.l4Multiplier * (MNR * MNR)
        ) {
          userLevelStr = 3;
          memberLevel = "Bronze Earner";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = Math.max(
            0,
            settings.l4Multiplier * (MNR * MNR) - totalGrandChildrenFromLevel2
          );
          nextLevelName = "Silver Earner";
        } else if (
          totalGrandChildrenFromLevel2 <
          settings.l5Multiplier * (MNR * MNR)
        ) {
          userLevelStr = 4;
          memberLevel = "Silver Earner";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = Math.max(
            0,
            settings.l5Multiplier * (MNR * MNR) - totalGrandChildrenFromLevel2
          );
          nextLevelName = "Gold Earner";
        } else if (
          totalGrandChildrenFromLevel2 <
          settings.l6Multiplier * (MNR * MNR)
        ) {
          userLevelStr = 5;
          memberLevel = "Gold Earner";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = Math.max(
            0,
            settings.l6Multiplier * (MNR * MNR) - totalGrandChildrenFromLevel2
          );
          nextLevelName = "Platinum Earner";
        } else {
          userLevelStr = 6;
          memberLevel = "Platinum";
          requiredChildrenToNext = 0;
          requiredGrandChildrenToNext = 0;
          nextLevelName = "Max Level";
        }
        setLevel?.(childrenReachedLevel2);
        setMemberLevel?.(memberLevel);
        setCurrentChildren?.(RCA);
        setCurrentGrandChildren?.(totalGrandChildrenAll);
        setRemainingChildren?.(requiredChildrenToNext);
        setRemainingGrandChildren?.(requiredGrandChildrenToNext);
        setNextLevelNeed?.(remainingPoints);
      } catch (err) {
        console.error("Error fetching referral settings:", err);
      }
    };

    if (user) {
      fetchCounts();
      fetchSettings();
    }
  }, [MNR]);

  const referralData = [
    {
      label: "Child Referrals",
      value: childCount,
      icon: Users,
    },
    {
      label: "Grandchild Referrals",
      value: parentCount,
      icon: GitBranch,
    },
    {
      label: "Level Up Referrals",
      value: level,
      icon: TrendingUp,
    },
    {
      label: "Leveled-Up %",
      value: `${Number(levelUpPercentage).toFixed(0)}%`,
      icon: Percent,
    },
  ];

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Referrals Levels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {referralData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
