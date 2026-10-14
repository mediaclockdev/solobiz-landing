"use client";

import { AccessoryInvoice } from './invoiceGenerator';
import { loadInvoices } from './invoiceGenerator';

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItems: number;
  periodComparison?: {
    revenueChange: number;
    ordersChange: number;
  };
}

export interface ProductMetrics {
  productType: string;
  totalSold: number;
  revenue: number;
  averagePrice: number;
}

export interface TimeSeriesData {
  date: string;
  revenue: number;
  orders: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  productType?: 'nfc-card' | 'Stickers' | 'all';
  status?: AccessoryInvoice['status'] | 'all';
}

export function calculateSalesMetrics(
  invoices: AccessoryInvoice[],
  filters?: ReportFilters
): SalesMetrics {
  const filtered = filterInvoices(invoices, filters);
  
  const totalRevenue = filtered.reduce((sum, inv) => sum + inv.totals.total, 0);
  const totalOrders = filtered.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItems = filtered.reduce((sum, inv) => 
    sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    totalItems
  };
}

export function getProductMetrics(
  invoices: AccessoryInvoice[],
  filters?: ReportFilters
): ProductMetrics[] {
  const filtered = filterInvoices(invoices, filters);
  const productMap = new Map<string, { sold: number; revenue: number; count: number }>();

  filtered.forEach(invoice => {
    invoice.items.forEach(item => {
      const key = `${item.productType}-${item.productVariant}`;
      const existing = productMap.get(key) || { sold: 0, revenue: 0, count: 0 };
      
      productMap.set(key, {
        sold: existing.sold + item.quantity,
        revenue: existing.revenue + item.subtotal,
        count: existing.count + 1
      });
    });
  });

  return Array.from(productMap.entries()).map(([key, data]) => ({
    productType: key,
    totalSold: data.sold,
    revenue: data.revenue,
    averagePrice: data.count > 0 ? data.revenue / data.count : 0
  }));
}

export function getTimeSeriesData(
  invoices: AccessoryInvoice[],
  filters?: ReportFilters,
  granularity: 'day' | 'week' | 'month' = 'day'
): TimeSeriesData[] {
  const filtered = filterInvoices(invoices, filters);
  const dataMap = new Map<string, { revenue: number; orders: number }>();

  filtered.forEach(invoice => {
    const date = new Date(invoice.date);
    let key: string;

    if (granularity === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (granularity === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    const existing = dataMap.get(key) || { revenue: 0, orders: 0 };
    dataMap.set(key, {
      revenue: existing.revenue + invoice.totals.total,
      orders: existing.orders + 1
    });
  });

  return Array.from(dataMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function filterInvoices(
  invoices: AccessoryInvoice[],
  filters?: ReportFilters
): AccessoryInvoice[] {
  if (!filters) return invoices;

  return invoices.filter(invoice => {
    // Date filtering
    if (filters.startDate && invoice.date < filters.startDate) return false;
    if (filters.endDate && invoice.date > filters.endDate) return false;

    // Status filtering
    if (filters.status && filters.status !== 'all' && invoice.status !== filters.status) {
      return false;
    }

    // Product type filtering
    // if (filters.productType && filters.productType !== 'all') {
    //   const hasProductType = invoice.items.some(item => item?.productType === filters?.productType);
    //   if (!hasProductType) return false;
    // }

    return true;
  });
}

export function exportToCSV(invoices: AccessoryInvoice[]): string {
  const headers = [
    'Invoice Number',
    'Date',
    'Customer Name',
    'Customer Email',
    'Product Type',
    'Product Variant',
    'Quantity',
    'Base Price',
    'Discount',
    'Add-on Fees',
    'Subtotal',
    'Status',
    'Payment Method'
  ];

  const rows = invoices.flatMap(invoice =>
    invoice.items.map(item => [
      invoice.invoiceNumber,
      new Date(invoice.date).toLocaleDateString(),
      invoice.customerInfo.name,
      invoice.customerInfo.email,
      item.productType,
      item.productVariant,
      item.quantity,
      item.basePrice,
      item.discountApplied + '%',
      Object.values(item.addOnFees).reduce((sum, fee) => sum + (fee || 0), 0),
      item.subtotal,
      invoice.status,
      invoice.paymentMethod || 'N/A'
    ])
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

export function generateReport(filters?: ReportFilters) {
  const invoices = loadInvoices();
  const salesMetrics = calculateSalesMetrics(invoices, filters);
  const productMetrics = getProductMetrics(invoices, filters);
  const timeSeriesData = getTimeSeriesData(invoices, filters);

  return {
    salesMetrics,
    productMetrics,
    timeSeriesData,
    invoices: filterInvoices(invoices, filters)
  };
}
