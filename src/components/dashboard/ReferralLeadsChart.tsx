"use client";

import { useEffect, useState } from "react";
import { db } from "@/services/firebase";
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Child / grandchild leads over time, plus download history (client point c).
 *
 * Matches the Members chart on the admin Systems page, with two differences
 * the client asked for: the AREA option is gone (Bar and Line only), and the
 * series are child and grandchild leads rather than free/paid/churned.
 *
 * Dates come from referrals/{uid}.createdAt, which SignUpModal writes with
 * serverTimestamp() for every new signup. Those documents are keyed by uid, so
 * they are read with documentId() "in" batches - Firestore caps that at 30 per
 * query, and one query per lead would be dozens of sequential round trips.
 */

type ChartType = "bar" | "line";
type TimePeriod = "7d" | "30d" | "90d" | "1yr";

const BATCH_SIZE = 30;

/** serverTimestamp() normally, but older rows may hold a Date or a string. */
function readDate(raw: any): Date | null {
  if (!raw) return null;
  if (raw.toDate) return raw.toDate();
  if (raw instanceof Date) return raw;
  if (typeof raw === "string") {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/** Reads createdAt for a batch of uids out of one collection. */
async function fetchDatesFrom(
  collectionName: "referrals" | "users",
  uids: string[],
): Promise<{ dates: Date[]; missing: string[] }> {
  const dates: Date[] = [];
  const missing: string[] = [];

  for (let i = 0; i < uids.length; i += BATCH_SIZE) {
    const batch = uids.slice(i, i + BATCH_SIZE);
    if (!batch.length) continue;

    const snap = await getDocs(
      query(collection(db, collectionName), where(documentId(), "in", batch)),
    );

    const seen = new Set<string>();
    snap.forEach((d) => {
      seen.add(d.id);
      const date = readDate(d.data()?.createdAt);
      if (date) dates.push(date);
      else missing.push(d.id);
    });

    // A uid with no document at all is still unresolved.
    batch.forEach((uid) => {
      if (!seen.has(uid)) missing.push(uid);
    });
  }

  return { dates, missing };
}

/**
 * Join dates for a list of uids.
 *
 * referrals/{uid}.createdAt is the primary source - SignUpModal writes it with
 * serverTimestamp() for every signup. Accounts seeded straight into Firestore
 * often skip it, so anything still undated falls back to users/{uid}.createdAt,
 * which the same signup path also writes. Without the fallback the chart just
 * renders empty, which reads as broken rather than as missing data.
 */
async function fetchJoinDates(uids: string[]): Promise<Date[]> {
  if (!uids.length) return [];

  const primary = await fetchDatesFrom("referrals", uids);
  if (!primary.missing.length) return primary.dates;

  const fallback = await fetchDatesFrom("users", primary.missing);
  return [...primary.dates, ...fallback.dates];
}

/** Bucket boundaries + labels for a period, oldest first. */
function buildBuckets(period: TimePeriod) {
  const buckets: { label: string; start: Date; end: Date }[] = [];
  const now = new Date();

  const push = (label: string, start: Date, end: Date) =>
    buckets.push({ label, start, end });

  if (period === "7d") {
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      push(
        start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        start,
        end,
      );
    }
  } else if (period === "30d") {
    // Four weekly buckets reads better than 30 daily ticks.
    for (let i = 3; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      push(
        start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        start,
        end,
      );
    }
  } else if (period === "90d") {
    for (let i = 2; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      push(start.toLocaleDateString("en-US", { month: "short" }), start, end);
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      push(start.toLocaleDateString("en-US", { month: "short" }), start, end);
    }
  }

  return buckets;
}

function bucketCounts(
  period: TimePeriod,
  childDates: Date[],
  grandchildDates: Date[],
) {
  const buckets = buildBuckets(period);
  const countIn = (dates: Date[], start: Date, end: Date) =>
    dates.filter((d) => d >= start && d < end).length;

  return buckets.map(({ label, start, end }) => ({
    name: label,
    child: countIn(childDates, start, end),
    grandchild: countIn(grandchildDates, start, end),
  }));
}

export function ReferralLeadsChart({
  uid,
  history = [],
}: {
  uid?: string;
  /** Rows from the leadExports collection, newest first. */
  history?: any[];
}) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");
  const [childDates, setChildDates] = useState<Date[]>([]);
  const [grandchildDates, setGrandchildDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  // How many referrals exist in total, regardless of whether a date was found.
  // Lets the card tell "you have no leads" apart from "your leads have no
  // dates" and "your leads are outside this period" - three very different
  // reasons for an empty chart.
  const [totalLeads, setTotalLeads] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!uid) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "referrals", uid));
        const data = snap.data();
        const childUids: string[] = data?.children || [];
        const grandchildUids: string[] = data?.grandchildren || [];

        const [children, grandchildren] = await Promise.all([
          fetchJoinDates(childUids),
          fetchJoinDates(grandchildUids),
        ]);
        if (cancelled) return;
        setTotalLeads(childUids.length + grandchildUids.length);
        setChildDates(children);
        setGrandchildDates(grandchildren);
      } catch (error) {
        console.error("Error loading referral lead dates:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const chartData = bucketCounts(timePeriod, childDates, grandchildDates);
  const datedLeads = childDates.length + grandchildDates.length;
  const inPeriod = chartData.reduce((n, d) => n + d.child + d.grandchild, 0);

  /** Why is the chart empty? Only set when it actually is. */
  const emptyReason =
    loading || inPeriod > 0
      ? null
      : totalLeads === 0
        ? "No referrals yet. Share your referral link to start building leads."
        : datedLeads === 0
          ? `You have ${totalLeads} referrals, but none of them record a signup date, so they cannot be plotted over time.`
          : `No referrals in this period. You have ${datedLeads} dated ${
              datedLeads === 1 ? "referral" : "referrals"
            } in total - try a longer range.`;

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="text-lg">Leads</CardTitle>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Child and grandchild referrals over time.
          </p>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {(["bar", "line"] as ChartType[]).map((type) => (
                <Button
                  key={type}
                  variant={chartType === type ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType(type)}
                  className="h-8 px-3 text-xs capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>

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
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
            </div>
          ) : emptyReason ? (
            <div className="flex h-full items-center justify-center px-6">
              <p className="max-w-sm text-center text-sm text-muted-foreground">
                {emptyReason}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="name"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="child"
                    fill="hsl(var(--primary))"
                    name="Child leads"
                  />
                  <Bar
                    dataKey="grandchild"
                    fill="hsl(var(--chart-2))"
                    name="Grandchild leads"
                  />
                </BarChart>
              ) : (
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="name"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="child"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Child leads"
                  />
                  <Line
                    type="monotone"
                    dataKey="grandchild"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Grandchild leads"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Download history - the other half of client point (c). Rows come
            from the leadExports records written when a CSV is purchased. */}
        <div className="mt-6 border-t pt-4">
          <h3 className="mb-3 text-sm font-semibold">Download history</h3>

          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No lead downloads purchased yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium">Leads</th>
                    <th className="pb-2 pr-4 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Access</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    const paidAt = row.paidAt?.toDate?.();
                    const expiresAt = row.expiresAt?.toDate?.();
                    const isActive = expiresAt && expiresAt > new Date();

                    return (
                      <tr key={row.id} className="border-t">
                        <td className="py-2 pr-4">
                          {paidAt ? paidAt.toLocaleDateString() : "-"}
                        </td>
                        <td className="py-2 pr-4">{row.leadCount ?? "-"}</td>
                        <td className="py-2 pr-4">
                          ${Number(row.amount ?? 0).toFixed(2)}
                        </td>
                        <td className="py-2">
                          {isActive ? (
                            <span className="text-emerald-600 font-medium">
                              Active until {expiresAt.toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Expired
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
