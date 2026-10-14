"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ArrowUpRight } from "lucide-react";

export function YourAccessories() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [thisMonthQty, setThisMonthQty] = useState(0);
  const [lastMonthQty, setLastMonthQty] = useState(0);
  const [qtyChange, setQtyChange] = useState(0);

  const [thisMonthTaps, setThisMonthTaps] = useState(0);
  const [lastMonthTaps, setLastMonthTaps] = useState(0);
  const [tapChange, setTapChange] = useState(0);

  const getMonthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const calcPercentChange = (current: number, last: number) =>
    last > 0 ? Number((((current - last) / last) * 100).toFixed(2)) : 0;

  useEffect(() => {
    if (!user?.uid) return;

    const fetchAccessoriesCount = async () => {
      try {
        setLoading(true);

        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        let totalQuantity = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();

          if (Array.isArray(data.items)) {
            data.items.forEach((item: any) => {
              totalQuantity += Number(item.quantity || 0);
            });
          }
        });

        setCount(totalQuantity);
      } catch (error) {
        console.error("Failed to fetch accessories quantity", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccessoriesCount();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchCounts = async () => {
      try {
        setLoading(true);

        const now = new Date();
        const thisMonthKey = getMonthKey(now);
        const lastMonthKey = getMonthKey(
          new Date(now.getFullYear(), now.getMonth() - 1, 1)
        );

        const nfcQuery = query(
          collection(db, "nfc_cards"),
          where("userId", "==", user.uid)
        );

        const snap = await getDocs(nfcQuery);

        let totalTaps = 0;
        let thisMonthTaps = 0;
        let lastMonthTaps = 0;

        snap.forEach((doc) => {
          const data = doc.data();

          totalTaps += Number(data.view_count || 0);

          const tapsByMonth = data.tapCountsByMonth || {};

          thisMonthTaps += tapsByMonth[thisMonthKey] || 0;
          lastMonthTaps += tapsByMonth[lastMonthKey] || 0;
        });

        setTapCount(totalTaps);
        setThisMonthTaps(thisMonthTaps);
        setLastMonthTaps(lastMonthTaps);
        setTapChange(calcPercentChange(thisMonthTaps, lastMonthTaps));
      } catch (err) {
        console.error("Failed to fetch NFC tap counts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [user?.uid]);

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground border-b pb-2">
          Your Accessories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <span className="text-2xl font-bold">{loading ? "—" : count}</span>{" "}
          <span className="text-muted-foreground">|</span>{" "}
          <span className="text-2xl font-bold">{tapCount}</span>{" "}
          <span className="text-sm font-medium text-muted-foreground">
            Views
          </span>
        </div>

        <p className="flex items-center gap-1 mt-1 text-xs">
          {tapChange > 0 ? (
            <>
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">{tapChange.toFixed(0)}%</span>
            </>
          ) : tapChange < 0 ? (
            <>
              <ArrowUpRight className="h-3 w-3 rotate-90 text-red-500" />
              <span className="text-red-500">
                {Math.abs(tapChange).toFixed(0)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">0%</span>
            </>
          )}

          <span className="text-muted-foreground ml-1">from last month</span>
        </p>

        {/* <p className="text-xs text-muted-foreground mt-1">
          total accessories purchased
        </p> */}
      </CardContent>
    </Card>
  );
}
