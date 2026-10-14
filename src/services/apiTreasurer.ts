/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "../lib/api";

// Types based on your controller
export type RevenueCategory =
  | "state_of_origin_fee"
  | "trade_permits"
  | "haulage_levy"
  | "market_levy"
  | "signage_levy"
  | "development_levy"
  | "property_tax";

export type InvoiceStatus =
  | "sent"
  | "paid"
  | "partially_paid"
  | "overdue"
  | "cancelled";
export type BillingCycle =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "one_time";

// Treasury Overview Types
export interface TreasuryOverviewResponse {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalInvoices: number;
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: string;
    confirmedTransactions: number;
    totalPaymentTransactions: number;
  };
  paymentMethods: Array<{
    method: string;
    totalCollected: number;
    transactions: number;
  }>;
  applicationStatuses: Array<{
    status: string;
    count: number;
  }>;
  revenueByService: Array<{
    serviceId: string;
    serviceName: string;
    serviceCode: string;
    totalCollected: number;
    transactions: number;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    reference: string;
    gatewayRef: string | null;
    createdAt: string;
    confirmedAt: string | null;
    invoice: {
      id: string;
      invoiceNumber: string;
      amount: number;
      application: {
        applicationNumber: string;
        fullName: string;
        service: {
          name: string;
          code: string;
        };
      };
    };
  }>;
}

// Service Fee Types
export interface ServiceFeeConfig {
  id: string;
  serviceId: string;
  amount: number;
  status: "ACTIVE" | "INACTIVE";
  updatedById: string | null;
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ServiceWithFee {
  id: string;
  code: string;
  name: string;
  category: string;
  revenueHead: string;
  description: string;
  requirements: string[];
  estimatedDays: number;
  certificateType: string;
  supportsRenewal: boolean;
  isActive: boolean;
  feeConfig: ServiceFeeConfig | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertServiceFeeData {
  amount: number;
  status?: boolean; // true = ACTIVE, false = INACTIVE
}

// Reconciliation Types
export interface ReconciliationInvoice {
  id: string;
  invoiceNumber: string;
  invoiceAmount: number;
  paymentStatus: string;
  totalCollected: number;
  outstanding: number;
  paymentCount: number;
  confirmedPaymentCount: number;
  paidAt: string | null;
  createdAt: string;
  transactionRef: string | null;
  application: {
    id: string;
    applicationNumber: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    service: {
      id: string;
      code: string;
      name: string;
      category: string;
    };
  };
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    reference: string;
    gatewayRef: string | null;
    confirmedAt: string | null;
    createdAt: string;
  }>;
  receipts: Array<{
    id: string;
    receiptNumber: string;
    verificationCode: string;
    amountPaid: number;
    issuedAt: string;
  }>;
  virtualAccount: {
    bankName: string | null;
    accountNumber: string | null;
    reference: string | null;
  };
}

export interface ReconciliationResponse {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    variance: number;
    invoiceCount: number;
  };
  data: ReconciliationInvoice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Field Officers Types
export interface FieldOfficer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  ward: {
    id: string;
    name: string;
  } | null;
  status: "active" | "suspended" | "deactivated";
  totalCollected: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  } | null;
}

export interface FieldOfficersResponse {
  stats: {
    totalOfficers: number;
    active: number;
    suspended: number;
    deactivated: number;
    totalCollected: number;
  };
  officers: FieldOfficer[];
}




// Revenue Analytics Types (existing)
export interface RevenueOverview {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    totalInvoices: number;
    collectionRate: string;
  };
  byCategory: Array<{
    category: RevenueCategory;
    invoiced: number;
    collected: number;
    invoiceCount: number;
  }>;
  byStatus: Array<{
    status: InvoiceStatus;
    totalAmount: number;
    invoiceCount: number;
  }>;
  byPaymentMethod: Array<{
    method: string;
    totalAmount: number;
    transactions: number;
  }>;
  dailyTrend: Array<{
    date: string;
    collected: number;
    transactions: number;
  }>;
}

export interface RevenueByOfficer {
  period: {
    from: string;
    to: string;
  };
  data: Array<{
    officer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      contractorId?: string;
      contractor?: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
    collected: number;
    invoiced: number;
    transactions: number;
  }>;
}

export interface RevenueByWard {
  period: {
    from: string;
    to: string;
  };
  data: Array<{
    ward: {
      id: string;
      name: string;
      code: string;
    };
    invoiced: number;
    collected: number;
    invoiceCount: number;
  }>;
}

export interface InvoiceListResponse {
  data: Array<{
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    category: RevenueCategory;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    createdAt: string;
    dueDate: string;
    business?: {
      id: string;
      businessName: string;
      ownerName: string;
    };
    assignedOfficer?: {
      id: string;
      firstName: string;
      lastName: string;
    };
    receipt?: {
      id: string;
      receiptNumber: string;
      issuedAt: string;
    };
    _count: {
      payments: number;
    };
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  category: RevenueCategory;
  description: string;
  subtotal: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  penaltyAmount: number;
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  business?: {
    id: string;
    businessName: string;
    ownerName: string;
    phone: string;
    address: string;
  };
  assignedOfficer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  levyConfig?: {
    id: string;
    name: string;
    category: string;
    billingCycle: string;
    amount: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    reference: string;
    status: string;
    confirmedAt: string;
    createdAt: string;
  }>;
  receipt?: {
    id: string;
    receiptNumber: string;
    issuedAt: string;
  };
  permit?: {
    id: string;
    permitNumber: string;
    status: string;
    validFrom: string;
    validTo: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================
// Field-officer static-account payment confirmation
// ============================================================

export interface AwaitingConfirmationPayment {
  id: string;
  amount: number;
  status: string;
  matchStatus: string | null;
  reference: string | null;
  proofUrl: string | null;
  proofUploadedAt: string | null;
  proofUploadedBy: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

export interface AwaitingConfirmationApplication {
  id: string;
  applicationNumber: string;
  status: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  service: { id: string; name: string; code: string };
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    payments: AwaitingConfirmationPayment[];
  } | null;
}

export interface ConfirmStaticAccountResult {
  confirmedPayment: { id: string; status: string; confirmedAt: string | null };
  updatedInvoice: { id: string; paymentStatus: string; paidAt: string | null };
  receipt: { id: string; receiptNumber: string };
  updatedApplication: { id: string; status: string };
}

// Service functions
export const treasurerService = {
  // ============================================================
  // NEW: Service Fee Management (from updated controllers)
  // ============================================================
  
  /**
   * GET /treasurer/fees
   * List all active services with their fee configuration
   */
  listServiceFees: () =>
    api.get<ServiceWithFee[]>("/treasurer/fees"),

  /**
   * GET /treasurer/fees/:serviceId
   * Get a specific service with its fee configuration
   */
  getServiceFee: (serviceId: string) =>
    api.get<ServiceWithFee>(`/treasurer/fees/${serviceId}`),

  /**
   * PATCH /treasurer/fees/:serviceId
   * Create or update service fee configuration
   */
  upsertServiceFee: (serviceId: string, data: UpsertServiceFeeData) =>
    api.patch<ServiceFeeConfig>(`/treasurer/fees/${serviceId}`, data),

  /**
   * GET /treasurer/revenue
   * Get treasury overview with revenue analytics
   */
  getTreasuryOverview: (params?: { from?: string; to?: string }) =>
    api.get<TreasuryOverviewResponse>("/treasurer/revenue", { params }),

  /**
   * GET /treasurer/reconciliation
   * Get reconciliation report with pagination
   */
  getReconciliation: (params?: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<ReconciliationResponse>("/treasurer/reconciliation", { params }),

  /**
   * GET /treasurer/field-officers
   * Get field officers list with collection data
   */
  getFieldOfficers: (params?: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<FieldOfficersResponse>("/treasurer/field-officers", { params }),

  // ============================================================
  // Field-officer static-account payment confirmation
  // ============================================================

  /**
   * GET /treasurer/applications/awaiting-confirmation
   * Worklist of applications parked at `awaiting_payment_confirmation`.
   */
  listAwaitingConfirmation: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<AwaitingConfirmationApplication>>(
      "/treasurer/applications/awaiting-confirmation",
      { params },
    ),

  /**
   * PATCH /treasurer/payments/:paymentId/confirm
   * Confirm the payment, settle the invoice, issue a receipt and release the
   * application back to `submitted`.
   */
  confirmStaticAccountPayment: (paymentId: string) =>
    api.patch<ConfirmStaticAccountResult>(
      `/treasurer/payments/${paymentId}/confirm`,
    ),

  /**
   * PATCH /treasurer/payments/:paymentId/decline
   * Reject the submitted proof; the application is declined with the reason.
   */
  declineStaticAccountPayment: (paymentId: string, reason: string) =>
    api.patch<{ updatedPayment: unknown; updatedApplication: unknown }>(
      `/treasurer/payments/${paymentId}/decline`,
      { reason },
    ),

  // ============================================================
  // EXISTING: Revenue Analytics (kept as-is)
  // ============================================================
  
  getRevenueOverview: (params?: { from?: string; to?: string }) =>
    api.get<RevenueOverview>("/treasurer/revenue", { params }),

  getRevenueByOfficer: (params?: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => api.get<RevenueByOfficer>("/treasurer/revenue/by-officer", { params }),

  getRevenueByWard: (params?: { from?: string; to?: string }) =>
    api.get<RevenueByWard>("/treasurer/revenue/by-ward", { params }),

  // ============================================================
  // EXISTING: Invoice Management (kept as-is)
  // ============================================================
  
  getAllInvoices: (params?: {
    from?: string;
    to?: string;
    status?: InvoiceStatus;
    category?: RevenueCategory;
    officerId?: string;
    businessId?: string;
    page?: number;
    limit?: number;
  }) => api.get<InvoiceListResponse>("/treasurer/invoices", { params }),

  getInvoiceById: (id: string) =>
    api.get<InvoiceDetails>(`/treasurer/invoices/${id}`),

  markInvoiceOverdue: (id: string) =>
    api.patch<InvoiceDetails>(`/treasurer/invoices/${id}/mark-overdue`),
};