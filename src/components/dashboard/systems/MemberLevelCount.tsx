"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/services/firebase";
import { collection, doc, getDocs } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

type MemberLevelCountProps = {
  l2Child: string;
  l4Multiplier: string;
  l5Multiplier: string;
  l6Multiplier: string;
};

export function MemberLevelCount({
  l2Child,
  l4Multiplier,
  l5Multiplier,
  l6Multiplier,
}: MemberLevelCountProps) {
  const [userCount, setUserCount] = useState(0);
  const [levelCounts, setLevelCounts] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  });
  const { user } = useAuth();
  const [levelPercentages, setLevelPercentages] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  });

  useEffect(() => {
    async function fetchUsersCount() {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        setUserCount(querySnapshot.size);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }

    async function fetchUsersByLevel() {
      try {
        const querySnapshot = await getDocs(collection(db, "referrals"));
        const counts: any = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        let otherCounts = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const level = data.Level;
        //  console.log("Level", level);
          if (level == 1) {
            // counts[1] = counts[1] + 1;
          } else if (level >= 1 && level <= 6) {
            counts[level] = counts[level] + 1;
            otherCounts++;
          }
        });
        counts[1] = userCount ? userCount - otherCounts : 0;
        setLevelCounts(counts);
      } catch (error) {
        console.error("Error fetching users by level:", error);
      }
    }

    if (user) {
      fetchUsersByLevel();
      fetchUsersCount();
    }
  }, [user]);

  useEffect(() => {
    if (userCount > 0) {
      const percentages: any = {};
      Object.entries(levelCounts).forEach(([level, count]) => {
        percentages[level] = ((count as number) / userCount) * 100;
      });
      setLevelPercentages(percentages);
    }
  }, [userCount, levelCounts]);


  return (
    <Card className="lg:col-span-3 card-hover">
      <CardHeader>
        <CardTitle className="text-lg">Member Count By Levels</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">1.</span>
              <span className="text-sm">
                Level -1: &lt; {l2Child || "100"} referrals |{" "}
                <span className="font-medium">Starter member</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {levelPercentages[1].toFixed(0)}%
              </span>
              <span className="text-sm font-medium"> {levelCounts[1]}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">2.</span>
              <span className="text-sm">
                Level -2: = {l2Child || "100"} Child referrals |{" "}
                <span className="font-medium">Level-Up member</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {levelPercentages[2].toFixed(0)}%
              </span>
              <span className="text-sm font-medium">{levelCounts[2]}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">3.</span>
              <span className="text-sm">
                Level -3: =&gt; {l2Child || "100"} Child referrals who are
                Level-2 |{" "}
                <span className="font-medium">Bronze Earner member</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {levelPercentages[3].toFixed(0)}%
              </span>
              <span className="text-sm font-medium">{levelCounts[3]}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">4.</span>
              <span className="text-sm">
                Level -4: =&gt; L3 x {l4Multiplier} |{" "}
                <span className="font-medium">Silver Earner member</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {levelPercentages[4].toFixed(0)}%
              </span>
              <span className="text-sm font-medium">{levelCounts[4]}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">5.</span>
              <span className="text-sm">
                Level -5: =&gt; L3 x {l5Multiplier} |{" "}
                <span className="font-medium">Gold Earner member</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {levelPercentages[5].toFixed(0)}%
              </span>
              <span className="text-sm font-medium">{levelCounts[5]}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">6.</span>
              <span className="text-sm">
                Level -6: =&gt; L3 x {l6Multiplier} |{" "}
                <span className="font-medium">Platinum Earner member</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {levelPercentages[6].toFixed(0)}%
              </span>
              <span className="text-sm font-medium">{levelCounts[6]}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
