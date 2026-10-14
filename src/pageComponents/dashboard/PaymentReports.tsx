"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { format, parseISO, isWithinInterval } from "date-fns";
import { db } from "@/services/firebase";
import { collection, getDocs } from "firebase/firestore";

type EarningRecord = {
  userId: string;
  totalEarningBalance: number;
  yearWiseEarnings: any;
};

type UnpaidPaymentRecord = {
  recordId: string;
  userId: string;
  userName: string;
  email: string;
  referralNumber: string;
  paypalAccount: string;
  monthYear: string;
  amount: number;
  status: string;
};

export default function PaymentReports() {
  const currentDate = new Date();
  const currentMonthStart = format(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    "yyyy-MM-dd"
  );
  const currentMonthEnd = format(
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
    "yyyy-MM-dd"
  );

  const [filters, setFilters] = useState({
    startDate: currentMonthStart,
    endDate: currentMonthEnd,
    status: "all",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [earningsData, setEarningsData] = useState<EarningRecord[]>([]);
  const [usersData, setUsersData] = useState<Record<string, any>>({});
  const [monetizedData, setMonetizedData] = useState<Record<string, any>>({});
  const [selectedRecord, setSelectedRecord] =
    useState<UnpaidPaymentRecord | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch Firestore Data
  useEffect(() => {
    const fetchEarnings = async () => {
      setIsLoading(true);
      try {
        const earningsCol = collection(db, "earnings");
        const snapshot = await getDocs(earningsCol);
        const records: EarningRecord[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          records.push({
            userId: data.userId,
            totalEarningBalance: data.totalEarningBalance || 0,
            yearWiseEarnings: data.yearWiseEarnings || {},
          });
        });

        setEarningsData(records);
      } catch (err) {
        console.error("Error fetching earnings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  useEffect(() => {
    const fetchMonetized = async () => {
      try {
        const monetizedCol = collection(db, "monetized");
        const snapshot = await getDocs(monetizedCol);
        const monetizedMap: Record<string, any> = {};
        snapshot.forEach((doc) => {
          monetizedMap[doc.id] = doc.data(); // store monetized info by userId
        });
        setMonetizedData(monetizedMap);
      } catch (err) {
        console.error("Error fetching monetized data:", err);
      }
    };
    fetchMonetized();
  }, []);

  const unpaidPayments: UnpaidPaymentRecord[] = useMemo(() => {
    return earningsData.flatMap((record) =>
      Object.entries(record.yearWiseEarnings || {}).flatMap(
        ([year, months]: any) =>
          Object.entries(months)
            .filter(([month, info]: any) => {
              const recordDate = new Date(`${month} 1, ${year}`);
              const start = parseISO(filters.startDate);
              const end = parseISO(filters.endDate);

              // Apply date filter
              if (!isWithinInterval(recordDate, { start, end })) return false;

              // Apply status filter
              if (filters.status !== "all" && info.status !== filters.status)
                return false;

              return info.amount > 0; // only include if amount > 0
            })
            .map(([month, info]: any) => ({
              recordId: `${record.userId}-${year}-${month}`,
              userId: record.userId,
              userName: usersData[record.userId]?.displayName || "Unknown",
              email: usersData[record.userId]?.email || "Unknown",
              referralNumber:
                monetizedData[record.userId]?.referralNumber || "-",
              paypalAccount: monetizedData[record.userId]?.paypalAccount || "-",
              monthYear: `${year}-${month}`,
              amount: info.amount,
              status: info.status,
            }))
      )
    );
  }, [earningsData, usersData, filters]); // <-- add filters dependency

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCol = collection(db, "users");
        const snapshot = await getDocs(usersCol);
        const usersMap: Record<string, any> = {};
        snapshot.forEach((doc) => {
          usersMap[doc.id] = doc.data(); // store user info by userId
        });
        setUsersData(usersMap);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  // Process Data
  const report = useMemo(() => {
    if (isLoading || earningsData.length === 0) {
      return {
        metrics: { totalRevenue: 0, totalDue: 0, paidCount: 0, dueCount: 0 },
        statusDistribution: [
          { name: "Paid", value: 0, count: 0 },
          { name: "Due", value: 0, count: 0 },
        ],
        timeSeriesData: [],
      };
    }

    let totalRevenue = 0;
    let totalDue = 0;
    let paidCount = 0;
    let dueCount = 0;
    const paidUsers = new Set();
    const dueUsers = new Set();

    const timeSeriesMap: Record<
      string,
      { revenue: number; paymentCount: number }
    > = {};

    const start = parseISO(filters.startDate);
    const end = parseISO(filters.endDate);

    earningsData.forEach((record) => {
      const { yearWiseEarnings } = record;

      Object.entries(yearWiseEarnings || {}).forEach(([year, months]: any) => {
        Object.entries(months).forEach(([month, info]: any) => {
          const date = new Date(`${month} 1, ${year}`);
          if (!isWithinInterval(date, { start, end })) return;

          const amount = info.amount || 0;
          const status = info.status || "unpaid";

          if (status === "paid" && amount > 0) {
            totalRevenue += amount;
            paidCount += 1; // count each month
          } else if (status === "unpaid" && amount > 0) {
            totalDue += amount;
            dueCount += 1; // count each month
          }

          const key = `${month}-${year}`;
          if (!timeSeriesMap[key]) {
            timeSeriesMap[key] = { revenue: 0, paymentCount: 0 };
          }
          if (status === "paid" && amount > 0) {
            timeSeriesMap[key].revenue += amount;
          }
          if (amount > 0) {
            timeSeriesMap[key].paymentCount += 1;
          }
        });
      });
    });

    // const paidCount = paidUsers.size;
    // const dueCount = dueUsers.size;

    const statusDistribution = [
      { name: "Paid", value: totalRevenue, count: paidCount },
      { name: "Due", value: totalDue, count: dueCount },
    ];

    const timeSeriesData = Object.entries(timeSeriesMap).map(([month, v]) => ({
      month,
      ...v,
    }));

    return {
      metrics: { totalRevenue, totalDue, paidCount, dueCount },
      statusDistribution,
      timeSeriesData,
    };
  }, [earningsData, filters, isLoading]);

  const COLORS = {
    paid: "#10B981",
    due: "#EF4444",
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payment Reports</h1>
          <p className="text-sm text-muted-foreground">
            Analytics and insights for monetization payments
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Showing: {format(new Date(filters.startDate), "MMMM yyyy")} -
            {format(new Date(filters.endDate), "MMMM yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setFilters({
                startDate: currentMonthStart,
                endDate: currentMonthEnd,
                status: "all",
              })
            }
          >
            <Calendar className="h-4 w-4 mr-2" />
            Current Month
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v: string) =>
                  setFilters({ ...filters, status: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 text-green-600" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${report.metrics.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Total Due Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ${report.metrics.totalDue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Payments Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.metrics.paidCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-red-500" />
              Payments Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.metrics.dueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="status">Payment Status</TabsTrigger>
          <TabsTrigger value="records">Payment Records</TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Payment Count Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {report.timeSeriesData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No payment data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={report.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      name="Revenue ($)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="paymentCount"
                      stroke="#3B82F6"
                      name="Payment Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status */}
        <TabsContent value="status">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Status by Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={report.statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label={({ name, value }) =>
                        `${name}: $${value.toFixed(2)}`
                      }
                    >
                      {report.statusDistribution.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === "Paid" ? COLORS.paid : COLORS.due
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status by Count</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Count">
                      {report.statusDistribution.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === "Paid" ? COLORS.paid : COLORS.due
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          {selectedRecord ? (
            <div>
              <Button
                variant="ghost"
                onClick={() => setSelectedRecord(null)}
                className="mb-4"
              >
                ← Back to list
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle>Payment Record Details</CardTitle>
                  <CardDescription>
                    Record ID: {selectedRecord.recordId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        User Name
                      </Label>
                      <p className="font-medium">{selectedRecord.userName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Email
                      </Label>
                      <p className="font-medium">{selectedRecord.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Referral Number
                      </Label>
                      <p className="font-medium">
                        {selectedRecord.referralNumber}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        PayPal Account
                      </Label>
                      <p className="font-medium">
                        {selectedRecord.paypalAccount}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Month/Year
                      </Label>
                      <p className="font-medium">{selectedRecord.monthYear}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Amount
                      </Label>
                      <p className="font-medium text-lg">
                        ${selectedRecord.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Status
                      </Label>
                      <div className="mt-1">
                        <Badge
                          variant={
                            selectedRecord.status === "paid"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {selectedRecord.status === "paid" ? "Paid" : "Due"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment Due Records</CardTitle>
                <CardDescription>
                  {unpaidPayments.length} record(s) found
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {unpaidPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No payment due records</p>
                  </div>
                ) : (
                  unpaidPayments.map((record) => (
                    <div
                      key={record.recordId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <div>
                        <p className="font-semibold">{record.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.email}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge
                          variant={
                            record.status === "paid" ? "default" : "destructive"
                          }
                        >
                          {record.status === "paid" ? "Paid" : "Due"}
                        </Badge>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${record.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
