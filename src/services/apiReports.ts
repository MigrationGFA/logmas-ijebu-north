import { api } from "../lib/api";

// Types based on your controller
export type PaymentMethod = "bank_transfer" | "pos" | "cash" | "online_gateway" | "virtual_account";
export type InvoiceStatus = "sent" | "paid" | "partially_paid" | "overdue" | "cancelled";

export interface ReportsPeriod {
  from: string;
  to: string;
}

export interface ReportsStats {
  totalRevenue: number;
  byMethod: {
    transfer: number;
    pos: number;
    cash: number;
    online: number;
  };
}

export interface ByLevyItem {
  levy: string;
  transactions: number;
  revenue: number;
}
export interface ByServiceType {
  type: string;
  transactions: number;
  revenue: number;
  label:string
}

export interface ByOfficerItem {
  id: string | null;
  name: string;
  ward: string;
  invoicesIssued: number;
  totalCollected: number;
  totalInvoiced: number;
}

export interface ReportInvoice {
  id: string;
  reference: string;
  customerName: string;
  levyType: string;
  status: InvoiceStatus;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  // Payer contact + provenance fields — consumed by the dashboard tables
  // and the CSV exports on the reports page.
  applicationNumber?: string | null;
  service?: { name?: string; revenueHead?: string } | null;
  paymentStatus?: string;
  createdAt?: string;
  phone?: string | null;
  email?: string | null;
  date_of_payment?: string | null;
}

export interface ReportReceipt {
  id: string;
  receiptNumber: string;
  customerName: string;
  paymentMethod: string;
  officerName: string;
  amount: number;
  levyType: string;
  paidAt: string;
  invoiceNumber?: string | null;
  applicationNumber?: string | null;
  service?: { name?: string; revenueHead?: string } | null;
  issuedAt?: string;
  phone?: string | null;
  email?: string | null;
  date_of_payment?: string | null;
}

export interface ReportsOverviewResponse {
  period: ReportsPeriod;
  stats: ReportsStats;
  byLevy: ByLevyItem[];
  byServiceType: ByServiceType[];
  byOfficer: ByOfficerItem[];
  invoices: ReportInvoice[];
  receipts: ReportReceipt[];
}

export interface ExportInvoice {
  reference: string;
  customerName: string;
  levyType: string;
  status: InvoiceStatus;
  amount: number;
  amountPaid: number;
  balanceDue: number;
  dueDate: string;
  createdAt: string;
  phone?: string | null;
  email?: string | null;
  date_of_payment?: string | null;
}

export interface ExportReceipt {
  receiptNumber: string;
  customerName: string;
  levyType: string;
  paymentMethod: string;
  officerName: string;
  amount: number;
  paidAt: string;
  phone?: string | null;
  email?: string | null;
  date_of_payment?: string | null;
}

// Service functions
export const reportsService = {
  // Get reports overview (all data in one call)
  getReportsOverview: (params?: { from?: string; to?: string }) =>
    api.get<ReportsOverviewResponse>("/reports/overview", { params }),
  
  // Export invoices to CSV
  exportInvoices: (params?: { from?: string; to?: string }) =>
    api.get<ExportInvoice[]>("/reports/export/invoices", { params }),
  
  // Export receipts to CSV
  exportReceipts: (params?: { from?: string; to?: string }) =>
    api.get<ExportReceipt[]>("/reports/export/receipts", { params }),
};