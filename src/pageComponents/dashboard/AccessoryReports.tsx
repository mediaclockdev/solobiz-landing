"use client";

import jsPDF from "jspdf";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";

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
import {
  Download,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Calendar,
  FileText,
} from "lucide-react";

import {
  generateReport,
  exportToCSV,
  ReportFilters,
} from "@/utils/accessoryReporting";
import { loadInvoices, AccessoryInvoice } from "@/utils/invoiceGenerator";
import { Badge } from "@/components/ui/badge";
// import { AccessoryInvoice as InvoiceComponent } from "@/components/dashboard/AccessoryInvoice";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AccessoryInvoice as InvoiceComponent } from "@/components/dashboard/systems/AccessoryInvoice";

type Order = any; // adapt to your real type
type PaymentMethodMap = Record<string, number>;

export default function AccessoryReports() {
  // -------------------------
  // original filters (kept)
  // -------------------------
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: "",
    endDate: "",
    productType: "all",
    status: "all",
  });

  // -------------------------
  // new states
  // -------------------------
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [variants, setVariants] = useState<string[]>([]);
  const [productVariantFilter, setProductVariantFilter] =
    useState<string>("all");

  const [selectedInvoice, setSelectedInvoice] =
    useState<AccessoryInvoice | null>(null);

  // pagination for invoices
  const [invoicePage, setInvoicePage] = useState<number>(1);
  const invoicePageSize = 8;

  // aggregation period: day | week | month | year
  const [period, setPeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("daily");

  // for PDF exports
  const [exportingPdf, setExportingPdf] = useState(false);

  // COLORS array (kept)
  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#A78BFA",
  ];

  // ---------------------------------------------
  // LOAD ORDERS + INVOICES FROM FIRESTORE (live)
  // ---------------------------------------------
  useEffect(() => {
    setLoading(true);
    const loadAll = async () => {
      try {
        const ordersCol = collection(db, "orders");
        const snap = await getDocs(ordersCol);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(list);

        // collect product variants for filter dropdown
        const variantSet = new Set<string>();
        list.forEach((o: any) => {
          o.items?.forEach((it: any) => {
            if (it.productVariant) variantSet.add(it.productVariant);
            if (it.variant) variantSet.add(it.variant); // possible alternate field
          });
        });
        setVariants(["all", ...Array.from(variantSet)]);
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // ---------------------------------------------
  // HELPER: build date key based on period
  // ---------------------------------------------
  const makeKeyFromDate = (d: Date) => {
    if (period === "daily") {
      return d.toISOString().slice(0, 10); // yyyy-mm-dd
    } else if (period === "weekly") {
      // ISO week-year
      // simple approach: find monday of week
      const date = new Date(d);
      const day = (date.getDay() + 6) % 7; // monday=0..sunday=6
      const monday = new Date(date);
      monday.setDate(date.getDate() - day);
      return monday.toISOString().slice(0, 10); // week label by monday
    } else if (period === "monthly") {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // yyyy-mm
    } else {
      return `${d.getFullYear()}`; // yyyy
    }
  };

  // ---------------------------------------------
  // COMPUTE LIVE REPORT FROM ORDERS (all features)
  // ---------------------------------------------
  const report = useMemo(() => {
    if (loading) {
      return {
        salesMetrics: {
          totalRevenue: 0,
          totalOrders: 0,
          totalItems: 0,
          averageOrderValue: 0,
        },
        timeSeriesData: [],
        productMetrics: [],
        invoices: [],
        topProducts: [],
        paymentMethods: {},
        statusBreakdown: [],
        userMetrics: [],
        mergedByProductType: [],
      };
    }

    // apply filters from UI
    let filtered = [...orders];

    // date range
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filtered = filtered.filter((o) => {
        const created = o.createdAt?.seconds
          ? new Date(o.createdAt.seconds * 1000)
          : new Date(o.createdAt);
        return created >= start;
      });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      // include entire day
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((o) => {
        const created = o.createdAt?.seconds
          ? new Date(o.createdAt.seconds * 1000)
          : new Date(o.createdAt);
        return created <= end;
      });
    }

    // status filter
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(
        (o) => (o.status || "").toLowerCase() === filters.status.toLowerCase()
      );
    }

    // productType filter
    // productType filter (safe for any structure)
    // productType filter (correct for your structure)
    if (filters.productType && filters.productType !== "all") {
      filtered = filtered.filter((o) =>
        o.items?.some((item: any) => {
          const cd = item.cardDetails;
          console.log("cd", cd);
          console.log("filters", filters);

          // cardDetails may be missing in some items
          if (!cd) return false;

          return cd.cardType === filters.productType;
        })
      );
    }

    // product variant filter
    if (productVariantFilter && productVariantFilter !== "all") {
      filtered = filtered.filter((o) =>
        o.items?.some(
          (it: any) =>
            (it.productVariant || it.variant) === productVariantFilter
        )
      );
    }

    // basic metrics
    const totalOrders = filtered.length;
    const totalRevenue = filtered.reduce(
      (s, o) => s + (Number(o.total) || 0),
      0
    );
    const totalItems = filtered.reduce(
      (sum, order) =>
        sum +
        (order.items?.reduce((q: number, i: any) => q + (i.quantity || 0), 0) ||
          0),
      0
    );
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // time series (period aware)
    const timeMap: Record<
      string,
      { date: string; orders: number; revenue: number }
    > = {};
    filtered.forEach((o) => {
      const created = o.createdAt?.seconds
        ? new Date(o.createdAt.seconds * 1000)
        : new Date(o.createdAt);
      const key = makeKeyFromDate(created);
      if (!timeMap[key]) timeMap[key] = { date: key, orders: 0, revenue: 0 };
      timeMap[key].orders += 1;
      timeMap[key].revenue += Number(o.total) || 0;
    });
    // sort keys
    const timeSeriesData = Object.keys(timeMap)
      .sort()
      .map((k) => timeMap[k]);

    // product metrics & top selling products
    const productMap: Record<
      string,
      {
        productType: string;
        totalSold: number;
        revenue: number;
        variants: Record<string, number>;
      }
    > = {};
    filtered.forEach((order) => {
      order.items?.forEach((item: any) => {
        const productKey =
          item.productVariant || item.name || item.productType || "Unknown";
        if (!productMap[productKey]) {
          productMap[productKey] = {
            productType: productKey,
            totalSold: 0,
            revenue: 0,
            variants: {},
          };
        }
        productMap[productKey].totalSold += item.quantity || 0;
        productMap[productKey].revenue += Number(
          item.subtotal ?? item.unitPrice ?? 0
        );
        const variant = item.productVariant || item.variant || "default";
        productMap[productKey].variants[variant] =
          (productMap[productKey].variants[variant] || 0) +
          (item.quantity || 0);
      });
    });
    const productMetrics = Object.values(productMap).map((p) => ({
      productType: p.productType,
      totalSold: p.totalSold,
      revenue: p.revenue,
      variants: p.variants,
    }));

    const topProducts = [...productMetrics]
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    // payment method stats
    const paymentMethods: PaymentMethodMap = {};
    filtered.forEach((o) => {
      const method = (
        o.paymentMethod ||
        o.payment_type ||
        "Unknown"
      ).toString();
      paymentMethods[method] =
        (paymentMethods[method] || 0) + (Number(o.total) || 0);
    });

    // order status pie
    const statusMap: Record<string, number> = {};
    filtered.forEach((o) => {
      const st = (o.status || "unknown").toString();
      statusMap[st] = (statusMap[st] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusMap).map(
      ([status, count]) => ({ status, count })
    );

    // user-wise analytics
    const userMap: Record<
      string,
      { name: string; orders: number; revenue: number; items: number }
    > = {};
    filtered.forEach((o) => {
      const uid = o.userId || o.customer?.id || o.customer?.email || "unknown";
      const name = (
        o.customer?.customerName ||
        o.customer?.name ||
        uid
      ).toString();
      if (!userMap[uid])
        userMap[uid] = { name, orders: 0, revenue: 0, items: 0 };
      userMap[uid].orders += 1;
      userMap[uid].revenue += Number(o.total) || 0;
      userMap[uid].items +=
        o.items?.reduce((q: number, it: any) => q + (it.quantity || 0), 0) || 0;
    });
    const userMetrics = Object.values(userMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // invoices list (flat map across orders)
    const invoices = filtered.flatMap(
      (o) =>
        o.accessory_invoices?.map((inv: any) => ({
          invoiceNumber: inv.invoiceNumber,
          date: inv.date,
          totals: inv.totals || { total: Number(inv.total) || 0 },
          customerInfo: inv.customerInfo || o.customer || { name: "Unknown" },
          orderId: o.id,
          rawOrder: o,
        })) ?? []
    );

    // pagination on invoices will be applied when rendering using invoicePage/invoicePageSize

    // merged chart: revenue vs productType (group by productType)
    const typeMap: Record<string, { revenue: number; units: number }> = {};
    filtered.forEach((o) => {
      o.items?.forEach((it: any) => {
        const type = it.productType || "unknown";
        if (!typeMap[type]) typeMap[type] = { revenue: 0, units: 0 };
        typeMap[type].revenue += Number(it.subtotal ?? it.unitPrice ?? 0) || 0;
        typeMap[type].units += it.quantity || 0;
      });
    });
    const mergedByProductType = Object.entries(typeMap).map(
      ([productType, val]) => ({
        productType,
        revenue: val.revenue,
        units: val.units,
      })
    );

    return {
      salesMetrics: {
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrderValue: avgOrderValue,
      },
      timeSeriesData,
      productMetrics,
      topProducts,
      paymentMethods,
      statusBreakdown,
      userMetrics,
      invoices,
      mergedByProductType,
    };
  }, [orders, filters, productVariantFilter, period, loading]);

  // ---------------------------------------------
  // CSV export (kept)
  // ---------------------------------------------
  const handleExportCSV = () => {
    try {
      const csv = exportToCSV(report.invoices);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `accessories-report-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export CSV failed", err);
    }
  };

  // ---------------------------------------------
  // PDF: download single invoice as PDF
  // ---------------------------------------------
  const handleDownloadInvoicePDF = async (invoice: any) => {
    setExportingPdf(true);
    try {
      const [{ jsPDF }, html2canvas] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      // render a small invoice card to canvas
      const node = document.createElement("div");
      node.style.width = "800px";
      node.style.padding = "16px";
      node.style.fontFamily = "Arial, Helvetica, sans-serif";
      node.innerHTML = `
        <h2>Invoice ${invoice.invoiceNumber}</h2>
        <p>Order: ${invoice.orderId}</p>
        <p>Customer: ${invoice.customerInfo?.name || ""}</p>
        <p>Date: ${new Date(invoice.date).toLocaleString()}</p>
        <p>Total: $${(invoice.totals?.total ?? 0).toFixed(2)}</p>
      `;
      document.body.appendChild(node);
      const canvas = await html2canvas.default(node, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      //@ts-ignore
      const pdf = new jsPDF.jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
      document.body.removeChild(node);
    } catch (err) {
      console.error("Invoice PDF export failed", err);
    } finally {
      setExportingPdf(false);
    }
  };

  // ---------------------------------------------
  // PDF: export whole dashboard (visible data)
  // ---------------------------------------------
  const handleExportDashboardPDF = async () => {
    setExportingPdf(true);
    try {
      const [{ jsPDF }, html2canvas] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const container = document.createElement("div");
      container.style.width = "1200px";
      container.style.padding = "18px";
      container.style.fontFamily = "Arial, Helvetica, sans-serif";

      // Build simple snapshot HTML of metrics + top products
      const metricsHtml = `
        <h1>Accessory Dashboard</h1>
        <p>Date: ${new Date().toLocaleString()}</p>
        <div>
          <p>Total Revenue: $${report.salesMetrics.totalRevenue.toFixed(2)}</p>
          <p>Total Orders: ${report.salesMetrics.totalOrders}</p>
          <p>Total Items: ${report.salesMetrics.totalItems}</p>
          <p>Avg Order Value: $${report.salesMetrics.averageOrderValue.toFixed(
            2
          )}</p>
        </div>
        <h3>Top Products</h3>
        <ul>
          ${report.topProducts
            .map(
              (p: any) =>
                `<li>${p.productType} — ${
                  p.totalSold
                } units — $${p.revenue.toFixed(2)}</li>`
            )
            .join("")}
        </ul>
      `;
      container.innerHTML = metricsHtml;
      document.body.appendChild(container);

      const canvas = await html2canvas.default(container, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      //@ts-ignore
      const pdf = new jsPDF.jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.removeChild(container);
    } catch (err) {
      console.error("Dashboard PDF export failed", err);
    } finally {
      setExportingPdf(false);
    }
  };

  // ---------------------------------------------
  // invoices pagination helpers
  // ---------------------------------------------
  const totalInvoicePages = Math.max(
    1,
    Math.ceil(report.invoices.length / invoicePageSize)
  );
  const invoicesPageSlice = report.invoices.slice(
    (invoicePage - 1) * invoicePageSize,
    invoicePage * invoicePageSize
  );

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------
  if (loading) return <div className="p-10 text-xl">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Accessory Reports</h1>
          <p className="text-sm text-muted-foreground">
            Analytics and insights for accessory sales
          </p>
        </div>

        {/* <div className="flex items-center gap-3">

          <div className="flex gap-2">
            <Button
              variant={period === "daily" ? "default" : "ghost"}
              onClick={() => setPeriod("daily")}
            >
              Day
            </Button>
            <Button
              variant={period === "weekly" ? "default" : "ghost"}
              onClick={() => setPeriod("weekly")}
            >
              Week
            </Button>
            <Button
              variant={period === "monthly" ? "default" : "ghost"}
              onClick={() => setPeriod("monthly")}
            >
              Month
            </Button>
            <Button
              variant={period === "yearly" ? "default" : "ghost"}
              onClick={() => setPeriod("yearly")}
            >
              Year
            </Button>
          </div>

          <Button onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          <Button onClick={handleExportDashboardPDF} disabled={exportingPdf}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div> */}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Product Type</Label>
              <Select
                value={filters.productType}
                onValueChange={(value: any) =>
                  setFilters({ ...filters, productType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="nfc-card">NFC Cards</SelectItem>
                  <SelectItem value="Stickers">Tap Stickers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* <div className="space-y-2">
              <Label className="text-xs">Product Variant</Label>
              <Select value={productVariantFilter} onValueChange={(value: any) => setProductVariantFilter(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {variants.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div> */}

            {/* <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value: any) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${report.salesMetrics.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.salesMetrics.totalOrders}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${report.salesMetrics.averageOrderValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" /> Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.salesMetrics.totalItems}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* TIMELINE */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Orders Over Time</CardTitle>
              <CardDescription>
                Daily / Weekly / Monthly / Yearly sales performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={report.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    name="Revenue ($)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#10B981"
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* merged chart: revenue vs product type */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Revenue vs Product Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.mergedByProductType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productType" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue ($)" />
                  <Bar dataKey="units" name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card> */}
        </TabsContent>

        {/* PRODUCTS */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.productMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productType" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Units Sold by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={report.productMetrics}
                      dataKey="totalSold"
                      nameKey="productType"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {report.productMetrics.map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Selling Products (new) */}
            {/* <Card>
              <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.topProducts.map((p: any, idx: number) => (
                    <div key={p.productType} className="flex justify-between">
                      <div>
                        <div className="font-medium">{idx + 1}. {p.productType}</div>
                        <div className="text-sm text-muted-foreground">{Object.keys(p.variants || {}).length} variants</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{p.totalSold} units</div>
                        <div className="text-sm">${p.revenue.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}

            {/* Payment method stats */}
            {/* <Card>
              <CardHeader><CardTitle>Payment Method Revenue</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(report.paymentMethods).map(([method, amt]) => (
                    <div key={method} className="flex justify-between">
                      <div className="text-sm">{method}</div>
                      <div className="font-semibold">${amt.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}

            {/* Status pie */}
            {/* <Card>
              <CardHeader><CardTitle>Order Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={report.statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                      {report.statusBreakdown.map((entry: any, idx: number) => (
                        <Cell key={entry.status} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card> */}

            {/* User-wise analytics */}
            {/* <Card>
              <CardHeader><CardTitle>User-wise Analytics</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.userMetrics.map((u: any) => (
                    <div key={u.name} className="flex justify-between">
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-sm text-muted-foreground">{u.orders} orders</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${u.revenue.toFixed(2)}</div>
                        <div className="text-sm">{u.items} items</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}
          </div>
        </TabsContent>

        {/* INVOICES */}
        <TabsContent value="invoices" className="space-y-4">
          {selectedInvoice ? (
            <div>
              <Button
                variant="ghost"
                onClick={() => setSelectedInvoice(null)}
                className="mb-4"
              >
                ← Back to list
              </Button>
              {/* <div className="mb-4">
                <Button
                  onClick={() =>
                    selectedInvoice && handleDownloadInvoicePDF(selectedInvoice)
                  }
                  disabled={exportingPdf}
                >
                  Download Invoice PDF
                </Button>
              </div> */}
              <InvoiceComponent invoice={selectedInvoice} />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>
                  {report.invoices.length} invoice(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No invoices found</p>
                    </div>
                  ) : (
                    <>
                      {invoicesPageSlice.map((invoice: any) => (
                        <div
                          onClick={() => setSelectedInvoice(invoice)}
                          key={invoice.invoiceNumber}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        >
                          <div
                            className="flex items-center gap-4"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-semibold">
                                {invoice.invoiceNumber}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {invoice.customerInfo?.name}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-semibold">
                                ${(invoice.totals?.total ?? 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(invoice.date).toLocaleDateString()}
                              </p>
                              <Badge variant="secondary">
                                {" "}
                                {invoice.rawOrder?.status.toUpperCase()}
                              </Badge>
                            </div>
                            {/* <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleDownloadInvoicePDF(invoice)} disabled={exportingPdf}>PDF</Button>
                              <Button size="sm" variant="ghost" onClick={() => setSelectedInvoice(invoice)}>View</Button>
                            </div> */}
                          </div>
                        </div>
                      ))}

                      {/* pagination controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Page {invoicePage} of {totalInvoicePages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            disabled={invoicePage <= 1}
                            onClick={() =>
                              setInvoicePage((p) => Math.max(1, p - 1))
                            }
                          >
                            Prev
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={invoicePage >= totalInvoicePages}
                            onClick={() =>
                              setInvoicePage((p) =>
                                Math.min(totalInvoicePages, p + 1)
                              )
                            }
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
