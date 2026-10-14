"use client";

import React, { useState, useMemo, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ------------------ TYPES ------------------
interface DayActivity {
  date: string;
  count: number;
  activities: {
    views: number;
    shares: number;
    edits: number;
    saves: number;
    clicks: number;
    ads: number;
    leads: number;
  };
}

interface ActivityHeatmapProps {
  user?: any;
  cardCount?: number;
  className?: string;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  user,
  className,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [firebaseData, setFirebaseData] = useState<Record<string, DayActivity>>(
    {}
  );
  const [cardCount, setCardCount] = useState(0);
  const [cardActivity, setcardActivity] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0;

      setIsMobile(isTouch);
    }
  }, []);

  // ------------------ FETCH FIREBASE DATA ------------------
  useEffect(() => {
    if (!user?.uid) return;

    const loadData = async () => {
      try {
        const q = query(collection(db, "cards"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);

        setCardCount(snapshot.size);
        if (snapshot.empty) return;

        const combined: Record<string, DayActivity> = {};
        let totalActivity = 0;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const cardTotal =
            Number(data.cardView) +
            Number(data.cardShare) +
            Number(data.leadsGenerated) +
            Number(data.linkClick) +
            Number(data.adsView) +
            Number(data.saveContact);
          totalActivity += cardTotal;

          const maps = {
            views: data.cardViewsByDay || {},
            saves: data.saveContactsByDay || {},
            shares: data.cardSharesByDay || {},
            clicks: data.linkClicksByDay || {},
            ads: data.cardAdsViewByDay || {},
            leads: data.cardLeadsGeneratedByDay || {},
          };

          Object.entries(maps).forEach(([type, dayMap]) => {
            Object.entries(dayMap as Record<string, number>).forEach(
              ([date, value]) => {
                if (!combined[date]) {
                  combined[date] = {
                    date,
                    count: 0,
                    activities: {
                      views: 0,
                      shares: 0,
                      edits: 0,
                      saves: 0,
                      clicks: 0,
                      ads: 0,
                      leads: 0,
                    },
                  };
                }

                switch (type) {
                  case "views":
                    combined[date].activities.views += value;
                    break;
                  case "saves":
                    combined[date].activities.saves += value;
                    break;
                  case "shares":
                    combined[date].activities.shares += value;
                    break;
                  case "clicks":
                    combined[date].activities.clicks += value;
                    break;
                  case "ads":
                    combined[date].activities.ads += value;
                    break;
                  case "leads":
                    combined[date].activities.leads += value;
                    break;
                }

                combined[date].count =
                  combined[date].activities.views +
                  combined[date].activities.shares +
                  combined[date].activities.edits +
                  combined[date].activities.saves +
                  combined[date].activities.clicks +
                  combined[date].activities.ads +
                  combined[date].activities.leads;
              }
            );
          });
        });
        setcardActivity(totalActivity);
        setFirebaseData(combined);
      } catch (err) {
        console.error("Error loading activity:", err);
      }
    };

    loadData();
  }, [user]);

  // ------------------ BUILD HEATMAP DATA ------------------
  const activityData = useMemo(() => {
    const result: DayActivity[] = [];
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);

    const totalDays =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 86400)) + 1;

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const key = date.toISOString().split("T")[0];

      if (firebaseData[key]) {
        result.push(firebaseData[key]);
      } else {
        result.push({
          date: key,
          count: 0,
          activities: {
            views: 0,
            shares: 0,
            edits: 0,
            saves: 0,
            clicks: 0,
            ads: 0,
            leads: 0,
          },
        });
      }
    }

    return result;
  }, [selectedYear, firebaseData]);

  // ------------------ COLOR LEVEL ------------------
  const getActivityLevel = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 5) return 1;
    if (count <= 10) return 2;
    if (count <= 20) return 3;
    return 4;
  };

  const getColorClass = (level: number): string => {
    const colors = [
      "bg-muted/60 hover:bg-muted/80 border border-border",
      "bg-blue-100 dark:bg-blue-950/50 hover:bg-blue-200 dark:hover:bg-blue-900/50",
      "bg-blue-300 dark:bg-blue-900/70 hover:bg-blue-400 dark:hover:bg-blue-800/70",
      "bg-blue-500 dark:bg-blue-700/80 hover:bg-blue-600 dark:hover:bg-blue-600/80",
      "bg-blue-700 dark:bg-blue-500 hover:bg-blue-800 dark:hover:bg-blue-400",
    ];
    return colors[level];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ------------------ MONTH LABELS ------------------
  const getMonthLabels = () => {
    const labels: { month: string; offset: number }[] = [];
    const startDate = new Date(selectedYear, 0, 1);

    const firstDayOfWeek = startDate.getDay();
    const adjustedStart = new Date(startDate);
    adjustedStart.setDate(adjustedStart.getDate() - firstDayOfWeek);

    let currentMonth = -1;

    const endDate = new Date(selectedYear, 11, 31);
    const totalDays =
      Math.floor(
        (endDate.getTime() - adjustedStart.getTime()) / (1000 * 86400)
      ) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(adjustedStart);
      weekStart.setDate(weekStart.getDate() + i * 7);

      const month = weekStart.getMonth();
      if (month !== currentMonth && weekStart.getFullYear() === selectedYear) {
        labels.push({
          month: weekStart.toLocaleDateString("en-US", { month: "short" }),
          offset: i,
        });
        currentMonth = month;
      }
    }

    return labels;
  };

  const monthLabels = useMemo(() => getMonthLabels(), [selectedYear]);

  // ------------------ BUILD WEEKS GRID ------------------
  const weeks = useMemo(() => {
    const result: (DayActivity | null)[][] = [];

    const start = new Date(selectedYear, 0, 1);
    const firstDayOfWeek = start.getDay();
    const adjustedStart = new Date(start);
    adjustedStart.setDate(start.getDate() - firstDayOfWeek);

    const end = new Date(selectedYear, 11, 31);

    const totalDays =
      Math.floor((end.getTime() - adjustedStart.getTime()) / (1000 * 86400)) +
      1;
    const totalWeeks = Math.ceil(totalDays / 7);

    const map = new Map(activityData.map((d) => [d.date, d]));

    for (let week = 0; week < totalWeeks; week++) {
      const weekData: (DayActivity | null)[] = [];

      for (let day = 0; day < 7; day++) {
        const current = new Date(adjustedStart);
        current.setDate(adjustedStart.getDate() + week * 7 + day);

        const key = current.toISOString().split("T")[0];
        if (current.getFullYear() === selectedYear) {
          weekData.push(map.get(key) || null);
        } else {
          weekData.push(null);
        }
      }

      result.push(weekData);
    }

    return result;
  }, [activityData, selectedYear]);

  // ------------------ RENDER UI ------------------
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>
              {cardActivity} Combined activity from {cardCount} cards in{" "}
              {selectedYear}
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedYear(currentYear)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedYear === currentYear
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {currentYear}
            </button>

            <button
              onClick={() => setSelectedYear(currentYear - 1)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedYear === currentYear - 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {currentYear - 1}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto pb-3">
            <div className="inline-block min-w-full">
              {/* Month Labels */}
              <div className="flex gap-0 mb-2 pl-8">
                {monthLabels.map((label, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground"
                    style={{
                      marginLeft:
                        i === 0
                          ? "0"
                          : `${
                              (label.offset - monthLabels[i - 1].offset) * 14 -
                              30
                            }px`,
                      minWidth: "30px",
                    }}
                  >
                    {label.month}
                  </div>
                ))}
              </div>

              {/* Day Labels + Grid */}
              <div className="flex gap-1">
                <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-2 py-px">
                  <div className="h-[10px]"></div>
                  <div className="h-[10px]">Mon</div>
                  <div className="h-[10px]"></div>
                  <div className="h-[10px]">Wed</div>
                  <div className="h-[10px]"></div>
                  <div className="h-[10px]">Fri</div>
                  <div className="h-[10px]"></div>
                </div>

                <div className="flex gap-1">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((day, di) => {
                        if (!day)
                          return <div key={di} className="w-[10px] h-[10px]" />;

                        const level = getActivityLevel(day.count);

                        const Dot = (
                          <button
                            type="button"
                            className={`w-[12px] h-[12px] rounded-sm transition ${getColorClass(
                              level
                            )}`}
                          />
                        );

                        return isMobile ? (
                          <Popover key={di}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={`w-[12px] h-[12px] rounded-sm transition ${getColorClass(
                                  level
                                )}`}
                              />
                            </PopoverTrigger>

                            <PopoverContent
                              side="top"
                              align="center"
                              className="w-auto min-w-0 p-2 text-xs"
                            >
                              <div className="text-xs space-y-1">
                                <div className="font-semibold">
                                  {formatDate(day.date)}
                                </div>
                                <div className="text-muted-foreground">
                                  {day.count === 0
                                    ? "No activity"
                                    : `${day.count} activities`}
                                </div>

                                {day.count > 0 && (
                                  <div className="space-y-0.5 text-muted-foreground">
                                    {day.activities.views > 0 && (
                                      <div>{day.activities.views} views</div>
                                    )}
                                    {day.activities.shares > 0 && (
                                      <div>{day.activities.shares} shares</div>
                                    )}
                                    {day.activities.saves > 0 && (
                                      <div>
                                        {day.activities.saves} saved contacts
                                      </div>
                                    )}
                                    {day.activities.clicks > 0 && (
                                      <div>
                                        {day.activities.clicks} link clicks
                                      </div>
                                    )}
                                    {day.activities.ads > 0 && (
                                      <div>{day.activities.ads} ad views</div>
                                    )}
                                    {day.activities.leads > 0 && (
                                      <div>{day.activities.leads} leads</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <Tooltip key={di}>
                            <TooltipTrigger asChild>
                              <div
                                className={`w-[10px] h-[10px] rounded-[2px] ${getColorClass(
                                  level
                                )} hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer`}
                              />
                            </TooltipTrigger>

                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                <div className="font-semibold">
                                  {formatDate(day.date)}
                                </div>
                                <div className="text-muted-foreground">
                                  {day.count === 0
                                    ? "No activity"
                                    : `${day.count} activities`}
                                </div>

                                {day.count > 0 && (
                                  <div className="space-y-0.5 text-muted-foreground">
                                    {day.activities.views > 0 && (
                                      <div>{day.activities.views} views</div>
                                    )}
                                    {day.activities.shares > 0 && (
                                      <div>{day.activities.shares} shares</div>
                                    )}
                                    {day.activities.saves > 0 && (
                                      <div>
                                        {day.activities.saves} saved contacts
                                      </div>
                                    )}
                                    {day.activities.clicks > 0 && (
                                      <div>
                                        {day.activities.clicks} link clicks
                                      </div>
                                    )}
                                    {day.activities.ads > 0 && (
                                      <div>{day.activities.ads} ad views</div>
                                    )}
                                    {day.activities.leads > 0 && (
                                      <div>{day.activities.leads} leads</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="w-[10px] h-[10px] rounded-[2px] bg-muted/60 border border-border" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-blue-100 dark:bg-blue-950/50" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-blue-300 dark:bg-blue-900/70" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-blue-500 dark:bg-blue-700/80" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-blue-700 dark:bg-blue-500" />
                <span>More</span>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
