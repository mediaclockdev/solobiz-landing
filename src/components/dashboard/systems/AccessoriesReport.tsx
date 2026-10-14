import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Package, DollarSign } from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { loadInvoices } from "@/utils/invoiceGenerator";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  doc,
} from "firebase/firestore";
import { db } from "@/services/firebase";

export function AccessoriesReport() {
  const navigate = useNavigate();
  //   const invoices = loadInvoices();
  //   const paidInvoices = invoices.filter((inv) => inv.status === "paid");

  //   const totalRevenue = paidInvoices.reduce(
  //     (sum, inv) => sum + inv.totals.total,
  //     0
  //   );
  //   const totalItems = paidInvoices.reduce(
  //     (sum, inv) =>
  //       sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
  //     0
  //   );

  const [orders, setOrders] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0); // total orders
  const [totalItems, setTotalItems] = useState(0); // total items (items[] + accessory items[])
  const [totalAmount, setTotalAmount] = useState(0); // total amount

  useEffect(() => {
    const loadAllOrders = async () => {
      try {
        const ordersCollection = collection(db, "orders");
        const snapshot = await getDocs(ordersCollection);

        const orderList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        //console.log("orderList", orderList);

        const totalOrders = orderList.length;

        // 🔹 SUM OF QUANTITY FROM ALL ORDERS
        const totalQuantity = orderList.reduce((sum, order:any) => {
          const items = order?.items || [];
          const qtySum = items.reduce((q, item) => q + (item.quantity || 0), 0);
          return sum + qtySum;
        }, 0);

        // 🔹 SUM OF TOTAL AMOUNTS OF ALL ORDERS
        const totalAmount = orderList.reduce((sum, order:any) => {
          return sum + (Number(order.total) || 0);
        }, 0);

        // 🔹 (OPTIONAL) SUM OF ACCESSORY INVOICE TOTALS
        const accessoryTotal = orderList.reduce((sum, order:any) => {
          const invoices = order.accessory_invoices || [];
          const invoiceTotal = invoices.reduce(
            (invSum, inv) => invSum + (inv?.totals?.total || 0),
            0
          );
          return sum + invoiceTotal;
        }, 0);

        // Store results in React state
        setOrders(orderList);
        setTotalRecords(totalOrders);
        setTotalItems(totalQuantity); // 👈 quantity sum
        setTotalAmount(totalAmount); // 👈 total order amount

      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    loadAllOrders();
  }, []);

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground border-b pb-2">
          Accessories Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold">${totalAmount?.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
          <div>
            <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">Orders</p>
          </div>
          <div>
            <Package className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Items</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => navigate("/dashboard/accessories/reports")}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          View Reports
        </Button>
      </CardContent>
    </Card>
  );
}
