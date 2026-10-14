"use client";

import { useEffect, useState } from "react";
import { db } from "@/services/firebase";
import { collection, getDocs } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type ChartType = "area" | "bar";
type TimePeriod = "7d" | "30d" | "90d" | "1yr";

/**
 * Fetch Firestore cards dynamically for 7 days, 30 days, 90 days, 1 year
 */
async function fetchCards(timePeriod: TimePeriod) {
  try {
    const today = new Date();
    const snapshot = await getDocs(collection(db, "users"));

    // -------- 7 DAYS --------
    if (timePeriod === "7d") {
      const startDate = new Date();
      startDate.setDate(today.getDate() - 6);

      const dailyCounts: Record<
        string,
        { free: number; paid: number; churned: number }
      > = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        dailyCounts[key] = { free: 0, paid: 0, churned: 0 };
      }

      snapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt: Date | null = null;
        const rawDate = data?.createdAt;

        if (rawDate?.toDate) createdAt = rawDate.toDate();
        else if (typeof rawDate === "string") createdAt = new Date(rawDate);

        // Count free/paid users
        if (createdAt && createdAt >= startDate) {
          const key = createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          if (dailyCounts[key]) {
            if (data?.planType === "free") dailyCounts[key].free++;
            else if (data?.planType === "paid") dailyCounts[key].paid++;
          }
        }

        // Count churned users
        let deletedAt: Date | null = null;
        const rawDeleted = data?.deletedAt;
        if (rawDeleted?.toDate) deletedAt = rawDeleted.toDate();
        else if (typeof rawDeleted === "string")
          deletedAt = new Date(rawDeleted);

        if (deletedAt && deletedAt >= startDate) {
          const key = deletedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          if (dailyCounts[key]) {
            dailyCounts[key].churned++;
          }
        }
      });

      return Object.entries(dailyCounts).map(([day, counts]) => ({
        name: day,
        free: counts.free,
        paid: counts.paid,
        churned: counts.churned,
      }));
    }

    // -------- 30 DAYS WEEKLY --------
    if (timePeriod === "30d") {
      const startDate = new Date();
      startDate.setDate(today.getDate() - 29);

      const weeklyCounts: Record<
        string,
        { free: number; paid: number; churned: number }
      > = {
        "Week 1": { free: 0, paid: 0, churned: 0 },
        "Week 2": { free: 0, paid: 0, churned: 0 },
        "Week 3": { free: 0, paid: 0, churned: 0 },
        "Week 4": { free: 0, paid: 0, churned: 0 },
      };

      snapshot.forEach((doc) => {
        const data = doc.data();

        // --- Created users (free/paid) ---
        let createdAt: Date | null = null;
        const rawDate = data?.createdAt;
        if (rawDate?.toDate) createdAt = rawDate.toDate();
        else if (typeof rawDate === "string") createdAt = new Date(rawDate);

        if (createdAt && createdAt >= startDate) {
          const diffDays = Math.floor(
            (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          const weekIndex = Math.floor(diffDays / 7); // 0-3
          const weekName = `Week ${4 - weekIndex}`; // reverse order
          if (weeklyCounts[weekName]) {
            if (data?.planType === "free") weeklyCounts[weekName].free++;
            else if (data?.planType === "paid") weeklyCounts[weekName].paid++;
          }
        }

        // --- Churned users ---
        let deletedAt: Date | null = null;
        const rawDeleted = data?.deletedAt;
        if (rawDeleted?.toDate) deletedAt = rawDeleted.toDate();
        else if (typeof rawDeleted === "string")
          deletedAt = new Date(rawDeleted);

        if (deletedAt && deletedAt >= startDate) {
          const diffDays = Math.floor(
            (today.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          const weekIndex = Math.floor(diffDays / 7); // 0-3
          const weekName = `Week ${4 - weekIndex}`; // reverse order
          if (weeklyCounts[weekName]) {
            weeklyCounts[weekName].churned++;
          }
        }
      });

      return Object.entries(weeklyCounts).map(([week, counts]) => ({
        name: week,
        free: counts.free,
        paid: counts.paid,
        churned: counts.churned,
      }));
    }

    // -------- 90 DAYS WEEKLY --------
    if (timePeriod === "90d") {
      const startDate = new Date();
      startDate.setDate(today.getDate() - 89); // last 90 days

      const weeklyCounts: Record<
        string,
        { free: number; paid: number; churned: number }
      > = {};
      for (let i = 12; i >= 0; i--) {
        weeklyCounts[`Week ${13 - i}`] = { free: 0, paid: 0, churned: 0 };
      }

      snapshot.forEach((doc) => {
        const data = doc.data();

        // --- Created users (free/paid) ---
        let createdAt: Date | null = null;
        const rawDate = data?.createdAt;
        if (rawDate?.toDate) createdAt = rawDate.toDate();
        else if (typeof rawDate === "string") createdAt = new Date(rawDate);

        if (createdAt && createdAt >= startDate) {
          const diffDays = Math.floor(
            (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          const weekIndex = Math.floor(diffDays / 7); // 0-12
          const weekName = `Week ${13 - weekIndex}`; // reverse order
          if (weeklyCounts[weekName]) {
            if (data?.planType === "free") weeklyCounts[weekName].free++;
            else if (data?.planType === "paid") weeklyCounts[weekName].paid++;
          }
        }

        // --- Churned users ---
        let deletedAt: Date | null = null;
        const rawDeleted = data?.deletedAt;
        if (rawDeleted?.toDate) deletedAt = rawDeleted.toDate();
        else if (typeof rawDeleted === "string")
          deletedAt = new Date(rawDeleted);

        if (deletedAt && deletedAt >= startDate) {
          const diffDays = Math.floor(
            (today.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          const weekIndex = Math.floor(diffDays / 7); // 0-12
          const weekName = `Week ${13 - weekIndex}`; // reverse order
          if (weeklyCounts[weekName]) {
            weeklyCounts[weekName].churned++;
          }
        }
      });

      return Object.entries(weeklyCounts).map(([week, counts]) => ({
        name: week,
        free: counts.free,
        paid: counts.paid,
        churned: counts.churned,
      }));
    }

    // -------- 1 YEAR MONTHLY --------
    if (timePeriod === "1yr") {
      const startDate = new Date();
      startDate.setMonth(today.getMonth() - 11); // last 12 months

      const monthlyCounts: Record<
        string,
        { free: number; paid: number; churned: number }
      > = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = d.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        monthlyCounts[key] = { free: 0, paid: 0, churned: 0 };
      }

      snapshot.forEach((doc) => {
        const data = doc.data();

        // --- Created users (free/paid) ---
        let createdAt: Date | null = null;
        const rawDate = data?.createdAt;
        if (rawDate?.toDate) createdAt = rawDate.toDate();
        else if (typeof rawDate === "string") createdAt = new Date(rawDate);

        if (createdAt && createdAt >= startDate) {
          const key = createdAt.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          if (monthlyCounts[key]) {
            if (data?.planType === "free") monthlyCounts[key].free++;
            else if (data?.planType === "paid") monthlyCounts[key].paid++;
          }
        }

        // --- Churned users ---
        let deletedAt: Date | null = null;
        const rawDeleted = data?.deletedAt;
        if (rawDeleted?.toDate) deletedAt = rawDeleted.toDate();
        else if (typeof rawDeleted === "string")
          deletedAt = new Date(rawDeleted);

        if (deletedAt && deletedAt >= startDate) {
          const key = deletedAt.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          if (monthlyCounts[key]) {
            monthlyCounts[key].churned++;
          }
        }
      });

      return Object.entries(monthlyCounts).map(([month, counts]) => ({
        name: month,
        free: counts.free,
        paid: counts.paid,
        churned: counts.churned,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching cards:", error);
    return [];
  }
}

export function MembersChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<ChartType>("area");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7d");

  useEffect(() => {
    async function loadData() {
      const data = await fetchCards(timePeriod);
      setChartData(data);
    }
    loadData();
  }, [timePeriod]);

  const formatTooltip = (value: number, name: string, props: any) => {
    const { payload } = props;
    if (!payload) return [value, name];

    const total = payload.free + payload.paid + payload.churned;
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0";

    return [`${value.toLocaleString()} (${percentage}%)`, name];
  };

  return (
    <Card className="lg:col-span-2 card-hover">
      <CardHeader>
        <CardTitle className="text-lg">Members</CardTitle>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Free, paid and churned over time.
          </p>

          <div className="flex flex-wrap gap-2">
            {/* Chart Type Toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={chartType === "area" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("area")}
                className="h-8 px-3 text-xs"
              >
                Area
              </Button>
              <Button
                variant={chartType === "bar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("bar")}
                className="h-8 px-3 text-xs"
              >
                Bar
              </Button>
            </div>

            {/* Time Period Toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {(["7d", "30d", "90d", "1yr"] as TimePeriod[]).map((period) => (
                <Button
                  key={period}
                  variant={timePeriod === period ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod(period)}
                  className="h-8 px-3 text-xs"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="free"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name="Free"
                />
                <Area
                  type="monotone"
                  dataKey="paid"
                  stackId="1"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.6}
                  name="Paid"
                />
                <Area
                  type="monotone"
                  dataKey="churned"
                  stackId="1"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.6}
                  name="Churned"
                />
              </AreaChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Bar dataKey="free" fill="hsl(var(--primary))" name="Free" />
                <Bar dataKey="paid" fill="hsl(var(--chart-2))" name="Paid" />
                <Bar
                  dataKey="churned"
                  fill="hsl(var(--destructive))"
                  name="Churned"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
