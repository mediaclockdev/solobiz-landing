"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PaymentDetailDialog } from "./PaymentDetailDialog";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
// import { PaymentDetailDialog } from './PaymentDetailDialog';

interface MonthlyPaymentSummary {
  monthName: string;
  monthKey: string;
  dueCount: number;
  dueTotal: number;
  paidCount: number;
  paidTotal: number;
}

export const PaymentDueSummary = (props) => {
  const { setLoadDataLoading, loadDataLoading } = props;
  const router = useRouter();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSummary, setCurrentSummary] =
    useState<MonthlyPaymentSummary | null>(null);
  const [lastSummary, setLastSummary] = useState<MonthlyPaymentSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const SIMULATED_CURRENT_DATE = new Date();

  const getMonthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const getMonthName = (date: Date) => format(date, "MMMM yyyy");

  const getPreviousMonth = (date: Date) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() - 1);
    return d;
  };

  // Extract summary for given year & month from Firestore documents
  const fetchMonthlySummary = async (
    targetYear: number,
    targetMonthName: string
  ): Promise<MonthlyPaymentSummary> => {
    const earningsCol = collection(db, "earnings");
    const snapshot = await getDocs(earningsCol);

    let dueCount = 0;
    let paidCount = 0;
    let dueTotal = 0;
    let paidTotal = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const yearData = data.yearWiseEarnings?.[targetYear];
      if (!yearData) return;

      const monthData = yearData[targetMonthName];
      if (!monthData) return;

      const amount = Number(monthData.amount || 0);
      const status = monthData.status || "unpaid";

      // 👇 Only count users if amount > 0
      if (amount > 0) {
        if (status === "unpaid") {
          dueCount++;
          dueTotal += amount;
        } else if (status === "paid") {
          paidCount++;
          paidTotal += amount;
        }
      }
    });

    return {
      monthName: `${targetMonthName} ${targetYear}`,
      monthKey: `${targetYear}-${targetMonthName}`,
      dueCount,
      dueTotal,
      paidCount,
      paidTotal,
    };
  };

  const loadData = async () => {
    setLoading(true);

    const currentDate = SIMULATED_CURRENT_DATE;
    const lastMonthDate = getPreviousMonth(currentDate);

    const currentYear = currentDate.getFullYear();
    const lastYear = lastMonthDate.getFullYear();

    const currentMonthName = format(currentDate, "MMM"); // e.g. "Nov"
    const lastMonthName = format(lastMonthDate, "MMM"); // e.g. "Oct"

    const [current, last] = await Promise.all([
      fetchMonthlySummary(currentYear, currentMonthName),
      fetchMonthlySummary(lastYear, lastMonthName),
    ]);

    setCurrentSummary(current);
    setLastSummary(last);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (loadDataLoading) {
      loadData();
      setLoadDataLoading(false);
    }
  }, [loadDataLoading]);

  const dueDate = format(SIMULATED_CURRENT_DATE, "'28th of' MMMM yyyy");

  if (loading || !currentSummary || !lastSummary) {
    return <div>Loading payment summary...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle>Payment Due Summary</CardTitle>
          </div>
          <CardDescription>
            Monthly payment tracking for monetization program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Due Date */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Due date is: {dueDate}</span>
          </div>

          {/* Summary Table */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 p-4 bg-muted font-semibold text-sm">
              <div className="col-span-1">Period</div>
              <div className="col-span-2 text-center">DUE</div>
              <div className="col-span-2 text-center">PAID</div>
            </div>

            {/* Subheader */}
            <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-muted/50 text-xs text-muted-foreground border-t">
              <div className="col-span-1"></div>
              <div className="text-center">Users</div>
              <div className="text-center">Amount</div>
              <div className="text-center">Users</div>
              <div className="text-center">Amount</div>
            </div>

            {/* Last Month Row */}
            <SummaryRow summary={lastSummary} label="Last Month" />

            {/* Current Month Row */}
            <SummaryRow
              summary={currentSummary}
              label="This Month"
              isCurrentMonth
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={() => setIsDialogOpen(true)}
              size="lg"
              className="w-full sm:flex-1"
            >
              <Users className="mr-2 h-4 w-4" />
              Payment Due List
            </Button>
            <Button
              onClick={() => router.push("/dashboard/reports")}
              variant="outline"
              size="lg"
              className="w-full sm:flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Payment Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      <PaymentDetailDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        setLoadDataLoading={setLoadDataLoading}
        loadDataLoading={loadDataLoading}
      />
    </>
  );
};

interface SummaryRowProps {
  summary: MonthlyPaymentSummary;
  label: string;
  isCurrentMonth?: boolean;
}

const SummaryRow = ({ summary, label, isCurrentMonth }: SummaryRowProps) => {
  return (
    <div
      className={`grid grid-cols-5 gap-4 px-4 py-3 border-t ${
        isCurrentMonth ? "bg-primary/5" : ""
      }`}
    >
      <div className="col-span-1 font-medium text-sm">
        <div>{label}</div>
        <div className="text-xs text-muted-foreground">{summary.monthName}</div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-destructive">
          {summary.dueCount}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-destructive">
          ${summary.dueTotal.toFixed(2)}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-green-600">
          {summary.paidCount}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-green-600">
          ${summary.paidTotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
