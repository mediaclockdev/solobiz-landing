"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/contexts/ToastContext";
import { format } from "date-fns";
import { DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentRecord {
  id: string;
  userName: string;
  paypalAccount: string;
  referralNumber: string;
  amount: number;
  status: "due" | "paid" | "unpaid";
}

export function PaymentDueUsersList(props) {
  const [loading, setLoading] = useState(true);
  const { setLoadDataLoading, loadDataLoading, onOpenChange, open } = props;
  const [dueRecords, setDueRecords] = useState<PaymentRecord[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(
    null
  );
  const { showToast } = useToast();
  const { user } = useAuth();

  const fetchCurrentMonthEarnings = async () => {
    try {
      const earningsCol = collection(db, "earnings");
      const snapshot = await getDocs(earningsCol);

      // You can make this dynamic if needed:
      const currentDate = new Date();
      const currentMonth = format(currentDate, "MMM"); // e.g., 'Nov'
      const currentYear = format(currentDate, "yyyy"); // e.g., '2025'

      // const currentMonth = "Mar"; // Example
      // const currentYear = "2026"; // Example

      const dueData: PaymentRecord[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Access nested month data object
        const monthData = data?.yearWiseEarnings?.[currentYear]?.[currentMonth];

        // Only include if unpaid and amount > 0
        if (
          monthData &&
          monthData.amount > 0 &&
          monthData.status === "unpaid"
        ) {
          const userId = data.userId;

          // Fetch user info
          const userRef = doc(db, "users", userId);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : null;

          // Fetch PayPal info
          const monetizedRef = doc(db, "monetized", userId);
          const monetizedSnap = await getDoc(monetizedRef);
          const paypalAccount = monetizedSnap.exists()
            ? monetizedSnap.data().paypalAccount || "N/A"
            : "N/A";

          dueData.push({
            id: docSnap.id,
            userName: userData?.displayName || "Unknown User",
            paypalAccount,
            referralNumber: userData?.referralCode || "-",
            amount: monthData.amount,
            status: monthData.status,
          });
        }
      }
      setDueRecords(dueData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching earnings:", error);
      showToast("Failed to fetch current month earnings", "error");
    }
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
    }
  }, [open]);

  useEffect(() => {
    if (user) {
      fetchCurrentMonthEarnings();
    }
  }, [processingPayment, user]);

  const handlePayNow = async (record: PaymentRecord) => {
    if (!user) return;
    setProcessingPayment(record.id);

    try {
      const earningDocRef = doc(db, "earnings", record.id);
      const earningSnap = await getDoc(earningDocRef);

      if (earningSnap.exists()) {
        // You can make these dynamic if needed
        const currentDate = new Date();
        const currentMonth = format(currentDate, "MMM"); // e.g., 'Nov'
        const currentYear = format(currentDate, "yyyy"); // e.g., '2025'
        // const currentMonth = "Mar";
        // const currentYear = "2026";

        const userRef = doc(db, "users", record?.id);
        const userSnap = await getDoc(userRef);
        let clientEmail = "";
        if (userSnap.exists()) {
          const userData = userSnap.data();
          clientEmail = userData.email;
        }

        // Replace with your admin email
        const adminEmail = process.env.BILLING_EMAIL;

        // Call API to send email
        await fetch("/api/send-payment-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientEmail,
            adminEmail,
            userName: record.userName,
            month: currentMonth,
            year: currentYear,
            amount: record.amount,
          }),
        });

        // Update nested amount and status directly using dot notation
        await updateDoc(earningDocRef, {
          [`yearWiseEarnings.${currentYear}.${currentMonth}.status`]: "paid",
          // [`yearWiseEarnings.${currentYear}.${currentMonth}.amount`]: 0,
          updatedAt: serverTimestamp(),
        });

        onOpenChange(false);
        showToast(`Payment for ${record.userName} marked as paid!`, "success");

        // Update local state
        setDueRecords((prev) =>
          prev.map((r) => (r.id === record.id ? { ...r, status: "paid" } : r))
        );
      }

      setLoadDataLoading(true);
    } catch (error) {
      console.error("Error updating payment:", error);
      showToast("Failed to mark payment as paid", "error");
    } finally {
      setProcessingPayment(null);
    }
  };

  const totalAmount = dueRecords.reduce(
    (sum, record) => sum + record.amount,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <CardTitle>This Month's Payment Due</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            {dueRecords.length} {dueRecords.length === 1 ? "User" : "Users"}
          </div>
        </div>
        <CardDescription>
          {format(new Date(), "MMMM yyyy")} - Total Due:{" "}
          <span className="font-semibold text-foreground">
            ${totalAmount.toFixed(2)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : dueRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payments due this month
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Referral Number</TableHead>
                  <TableHead>PayPal Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dueRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.userName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.referralNumber}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {record.paypalAccount}
                      </code>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${record.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {record.status === "due" || record.status == "unpaid" ? (
                        <Button
                          size="sm"
                          onClick={() => handlePayNow(record)}
                          disabled={processingPayment === record.id}
                        >
                          {processingPayment === record.id
                            ? "Processing..."
                            : "Pay Now"}
                        </Button>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant="secondary">Paid</Badge>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
