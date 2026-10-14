"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";

type TimeRange = "7d" | "30d" | "90d" | "1y";

export function RevenueChart(props: any) {
  const { onLockClick } = props;
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const defaultData = [
    {
      name: "Jan",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
    {
      name: "Feb",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
    {
      name: "Mar",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
    {
      name: "Apr",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
    {
      name: "May",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
    {
      name: "Jun",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
    {
      name: "Jul",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
    {
      name: "Aug",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
    {
      name: "Sep",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
    {
      name: "Oct",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
    {
      name: "Nov",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
    {
      name: "Dec",
      views: 0,
      shares: 0,
      adViews: 0,
      clicks: 0,
      saves: 0,
      leads: 0,
    },
  ];

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  async function fetchAllCardsData(timeRange: string) {
    const today = new Date();
    const cardsQuery = query(
      collection(db, "cards"),
      where("uid", "==", user?.uid)
    );
    const cardsSnapshot = await getDocs(cardsQuery);

    const monthlyViews: Record<string, number> = {};
    const monthlyShares: Record<string, number> = {};
    const monthlyAdViews: Record<string, number> = {};
    const createEmptyDailyData = (days: number) => {
      const data: Record<
        string,
        {
          views: number;
          shares: number;
          adViews: number;
          clicks: number;
          saves: number;
          leads: number;
        }
      > = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split("T")[0];
        data[key] = {
          views: 0,
          shares: 0,
          adViews: 0,
          clicks: 0,
          saves: 0,
          leads: 0,
        };
      }
      return data;
    };

    const createEmptyWeeklyData = (weeks: number) => {
      const data: Record<
        string,
        {
          views: number;
          shares: number;
          adViews: number;
          clicks: number;
          saves: number;
          leads: number;
        }
      > = {};
      for (let i = 1; i <= weeks; i++) {
        data[`Week ${i}`] = {
          views: 0,
          shares: 0,
          adViews: 0,
          clicks: 0,
          saves: 0,
          leads: 0,
        };
      }
      return data;
    };
    // Handle daily (7d or 30d)
    if (timeRange === "7d") {
      const daysToFetch = 7;
      const startDate = new Date();
      startDate.setDate(today.getDate() - (daysToFetch - 1));

      // Initialize date keys for last X days
      const dailyData: Record<
        string,
        {
          views: number;
          shares: number;
          adViews: number;
          clicks: number;
          saves: number;
          leads: number;
        }
      > = {};
      for (let i = daysToFetch - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split("T")[0]; // YYYY-MM-DD (matches Firestore keys)
        dailyData[key] = {
          views: 0,
          shares: 0,
          adViews: 0,
          clicks: 0,
          saves: 0,
          leads: 0,
        };
      }

      // Aggregate all cards
      cardsSnapshot.forEach((doc) => {
        const cardData = doc.data();

        const cardViewsByDay = cardData.cardViewsByDay || {};
        const cardSharesByDay = cardData.cardSharesByDay || {};
        const cardAdsByDay = cardData.cardAdsViewByDay || {};

        const cardClicksByDay = cardData.linkClicksByDay || {};
        const cardSavesByDay = cardData.saveContactsByDay || {};
        const cardLeadsGeneratedByDay = cardData.cardLeadsGeneratedByDay || {};

        for (const [dateKey, count] of Object.entries(cardClicksByDay)) {
          if (dailyData[dateKey])
            dailyData[dateKey].clicks += Number(count) || 0;
        }

        for (const [dateKey, count] of Object.entries(cardSavesByDay)) {
          if (dailyData[dateKey])
            dailyData[dateKey].saves += Number(count) || 0;
        }

        for (const [dateKey, count] of Object.entries(
          cardLeadsGeneratedByDay
        )) {
          if (dailyData[dateKey])
            dailyData[dateKey].leads += Number(count) || 0;
        }

        // Views
        for (const [dateKey, count] of Object.entries(cardViewsByDay)) {
          if (dailyData[dateKey])
            dailyData[dateKey].views += Number(count) || 0;
        }

        // Shares
        for (const [dateKey, count] of Object.entries(cardSharesByDay)) {
          if (dailyData[dateKey])
            dailyData[dateKey].shares += Number(count) || 0;
        }

        // Ad Views
        for (const [dateKey, count] of Object.entries(cardAdsByDay)) {
          if (dailyData[dateKey])
            dailyData[dateKey].adViews += Number(count) || 0;
        }
      });

      // Convert to chart-friendly format
      const mappedData = Object.entries(dailyData).map(([dateKey, values]) => ({
        name: new Date(dateKey).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        views: values.views,
        shares: values.shares,
        adViews: values.adViews,
        clicks: values.clicks,
        saves: values.saves,
        leads: values.leads,
      }));

      setData(mappedData);
      return mappedData;
    }

    if (["30d", "90d"].includes(timeRange)) {
      const rangeDays = timeRange === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(today.getDate() - (rangeDays - 1));
      const totalWeeks = Math.ceil(rangeDays / 7);

      const weeklyData = createEmptyWeeklyData(totalWeeks);

      const getWeekIndex = (date: Date) => {
        const diffDays = Math.floor(
          (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays < 0 || diffDays >= rangeDays) return -1;
        return Math.floor(diffDays / 7);
      };

      cardsSnapshot.forEach((doc) => {
        const data = doc.data();
        const views = data.cardViewsByDay || {};
        const shares = data.cardSharesByDay || {};
        const ads = data.cardAdsViewByDay || {};
        const clicks = data.linkClicksByDay || {};
        const saves = data.saveContactsByDay || {};
        const leads = data.cardLeadsGeneratedByDay || {};

        const processData = (
          source: Record<string, number>,
          key: "views" | "shares" | "adViews" | "clicks" | "saves" | "leads"
        ) => {
          for (const [dateKey, val] of Object.entries(source)) {
            const date = new Date(dateKey);
            if (date >= startDate && date <= today) {
              const weekIndex = getWeekIndex(date);
              if (weekIndex >= 0 && weekIndex < totalWeeks) {
                const weekName = `Week ${weekIndex + 1}`;
                weeklyData[weekName][key] += Number(val) || 0;
              }
            }
          }
        };

        processData(views, "views");
        processData(shares, "shares");
        processData(ads, "adViews");
        processData(clicks, "clicks");
        processData(saves, "saves");
        processData(leads, "leads");
      });

      const mappedData = Object.entries(weeklyData)
        .map(([name, values]) => ({
          name,
          views: values.views,
          shares: values.shares,
          adViews: values.adViews,
          clicks: values.clicks,
          saves: values.saves,
          leads: values.leads,
        }))
        .sort((a, b) => {
          const aNum = Number(a.name.split(" ")[1]);
          const bNum = Number(b.name.split(" ")[1]);
          return aNum - bNum;
        });
      console.log("mapped---", mappedData);

      setData(mappedData);
      return mappedData;
    }

    if (timeRange === "1y") {
      const monthlyData: Record<
        string,
        {
          views: number;
          shares: number;
          adViews: number;
          clicks: number;
          saves: number;
          leads: number;
        }
      > = {};

      // Initialize last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(today.getMonth() - i);
        const key = d.toISOString().slice(0, 7); // YYYY-MM for lookup
        monthlyData[key] = {
          views: 0,
          shares: 0,
          adViews: 0,
          clicks: 0,
          saves: 0,
          leads: 0,
        };
      }

      // Aggregate all cards
      cardsSnapshot.forEach((doc) => {
        const data = doc.data();
        const views = data.cardViewsByMonth || {};
        const shares = data.cardSharesByMonth || {};
        const adViews = data.cardAdsViewByMonth || {};

        const clicks = data.linkClicksByMonth || {};
        const saves = data.saveContactsByMonth || {};
        const leads = data.cardLeadsGeneratedByMonth || {};

        for (const [monthKey, count] of Object.entries(clicks)) {
          if (monthlyData[monthKey])
            monthlyData[monthKey].clicks += Number(count) || 0;
        }

        for (const [monthKey, count] of Object.entries(saves)) {
          if (monthlyData[monthKey])
            monthlyData[monthKey].saves += Number(count) || 0;
        }

        for (const [monthKey, count] of Object.entries(leads)) {
          if (monthlyData[monthKey])
            monthlyData[monthKey].leads += Number(count) || 0;
        }

        for (const [monthKey, count] of Object.entries(views)) {
          if (monthlyData[monthKey])
            monthlyData[monthKey].views += Number(count) || 0;
        }
        for (const [monthKey, count] of Object.entries(shares)) {
          if (monthlyData[monthKey])
            monthlyData[monthKey].shares += Number(count) || 0;
        }
        for (const [monthKey, count] of Object.entries(adViews)) {
          if (monthlyData[monthKey])
            monthlyData[monthKey].adViews += Number(count) || 0;
        }
      });

      // Map to chart-friendly array with label like "Oct 2025"
      const mappedData = Object.entries(monthlyData)
        .map(([monthKey, values]) => {
          const [year, month] = monthKey.split("-").map(Number);
          const date = new Date(year, month - 1);
          return {
            name: date.toLocaleString("en-US", {
              month: "short",
              year: "numeric",
            }), // Oct 2025
            views: values.views,
            shares: values.shares,
            adViews: values.adViews,
            clicks: values.clicks,
            saves: values.saves,
            leads: values.leads,
          };
        })
        .sort((a, b) => {
          const aDate = new Date(a.name);
          const bDate = new Date(b.name);
          return aDate.getTime() - bDate.getTime();
        });

      setData(mappedData);
      return mappedData;
    }

    // Handle monthly (default)
    cardsSnapshot.forEach((doc) => {
      const cardData = doc.data();

      const cardViewsByDay = cardData.cardViewsByDay || {};
      const cardSharesByDay = cardData.cardSharesByDay || {};
      const cardAdsViewByDay = cardData.cardAdsViewByDay || {};

      for (const [monthKey, views] of Object.entries(cardViewsByDay)) {
        monthlyViews[monthKey] =
          (monthlyViews[monthKey] || 0) + Number(views) || 0;
      }

      for (const [monthKey, shares] of Object.entries(cardSharesByDay)) {
        monthlyShares[monthKey] =
          (monthlyShares[monthKey] || 0) + Number(shares) || 0;
      }

      for (const [monthKey, adViews] of Object.entries(cardAdsViewByDay)) {
        monthlyAdViews[monthKey] =
          (monthlyAdViews[monthKey] || 0) + Number(adViews) || 0;
      }
    });

    // Map monthly data
    const mappedData = Object.entries(monthlyViews).map(
      ([monthKey, views]) => ({
        name: monthKey, // e.g. "2025-10"
        views: views,
        shares: monthlyShares[monthKey] ?? 0,
        adViews: monthlyAdViews[monthKey] ?? 0,
      })
    );

    setData(mappedData);
    return mappedData;
  }

  function parseCreatedAt(input: any) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  useEffect(() => {
    if (!user) return;

    const isFree = user?.planType === "free";

    setIsFreePlan(isFree);
    const createdAt = parseCreatedAt(user?.createdAt);
    const trialEnd = new Date(
      createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000
    );
    const trialActive = new Date() <= trialEnd;
    setIsTrialActive(trialActive);
  }, [user]);

  useEffect(() => {
    async function loadData() {
      fetchAllCardsData(timeRange);
    }
    if (user) {
      loadData();
    }
  }, [user, timeRange]);
  const isProLocked = isFreePlan && !isTrialActive;
  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-col">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-semibold">
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              Card Activities
              {isProLocked && (
                <Lock
                  size={14}
                  className="ml-1 text-yellow-500"
                  onClick={() => onLockClick()}
                />
              )}
            </div>
          </CardTitle>
          <CardDescription>Statistics for your business cards</CardDescription>
        </div>

        <div
          className={`mt-4 flex flex-wrap items-center gap-2 md:ml-auto ${
            isProLocked ? "opacity-60 blur-[2px] pointer-events-none" : ""
          }`}
        >
          <div className="flex bg-muted rounded-md p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChartType("area")}
              className={cn(
                "rounded-sm",
                chartType === "area" &&
                  "bg-background shadow-sm bg-primary text-primary-foreground"
              )}
            >
              Area
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChartType("bar")}
              className={cn(
                "rounded-sm",
                chartType === "bar" &&
                  "bg-background shadow-sm bg-primary text-primary-foreground"
              )}
            >
              Bar
            </Button>
          </div>
          <div className="flex bg-muted rounded-md p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange("7d")}
              className={cn(
                "rounded-sm",
                timeRange === "7d" &&
                  "bg-background shadow-sm bg-primary text-primary-foreground"
              )}
            >
              7d
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange("30d")}
              className={cn(
                "rounded-sm",
                timeRange === "30d" &&
                  "bg-background shadow-sm bg-primary text-primary-foreground"
              )}
            >
              30d
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange("90d")}
              className={cn(
                "rounded-sm",
                timeRange === "90d" &&
                  "bg-background shadow-sm bg-primary text-primary-foreground"
              )}
            >
              90d
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange("1y")}
              className={cn(
                "rounded-sm",
                timeRange === "1y" &&
                  "bg-background shadow-sm bg-primary text-primary-foreground"
              )}
            >
              1y
            </Button>
          </div>
        </div>
      </CardHeader>
      <div
        className={`transition-all duration-300 ${
          isProLocked ? "opacity-60 blur-[2px] pointer-events-none" : ""
        }`}
      >
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorShares"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorAdViews"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorClicks"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f03e3e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f03e3e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSaves" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="saves"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorSaves)"
                  />
                  <Area
                    type="monotone"
                    dataKey="shares"
                    stroke="#f97316"
                    fillOpacity={1}
                    fill="url(#colorShares)"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#f03e3e"
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                  />
                  <Area
                    type="monotone"
                    dataKey="adViews"
                    stroke="#ec4899"
                    fillOpacity={1}
                    fill="url(#colorAdViews)"
                  />

                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorLeads)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={data}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#3b82f6" />
                  <Bar dataKey="saves" fill="#10b981" />
                  <Bar dataKey="shares" fill="#f97316" />
                  <Bar dataKey="clicks" fill="#f03e3e" />
                  <Bar dataKey="adViews" fill="#ec4899" />
                  <Bar dataKey="leads" fill="#8b5cf6" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
