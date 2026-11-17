import { api } from "../lib/api";

// Enums based on your Prisma schema
export type Role =
  | "citizen"
  | "business_owner"
  | "treasurer"
  | "lga_admin"
  | "chairman"
  | "ward_councillor"
  | "agent"
  | "contractor"
  | "field_officer"
  | "super_admin"
  | "sub_admin"
  | "auditor";

export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";
export type PermitStatus = "pending" | "issued" | "expired" | "revoked";
export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "forwarded_to_councillor";
export type ComplaintStatus = "open" | "in_progress" | "closed";

// Citizen Metrics
export interface CitizenMetrics {
  pendingPayments: number;
  awaitingForm: number;
  submitted?: number;
  approvedApplications: number;
  openComplaints: number;
  recentApplications: Array<{
    id: string;
    status: ApplicationStatus;
    createdAt: string;
    [key: string]: unknown;
  }>;
}
export interface BusinessOwnerMetrics {
  activeNotices: number;
  totalPaid: number;
  outstanding: number;
  activePermits: number;
}

export interface BusinessOwnerOverview {
  metrics: BusinessOwnerMetrics;
  recentInvoices: Array<{
    reference: string;
    amount: number;
    customerName: string;
    status: "Active" | "Inactive";
  }>;
}

// Management Cadre Metrics (Treasurer, LGA Admin, Chairman)
export interface ManagementMetrics {
  totalRevenue: number;
  activePermits: number;
  overdueInvoices: number;
  wardCoverage: number;
}

export interface ContractorInvoice {
  id: string;
  invoiceNumber: string;
  status: "paid" | "overdue" | "unpaid";
  amount: number;
  balanceDue: number;
  customerName: string;
  createdAt: string;
}

export interface ContractorReceipt {
  id: string;
  invoiceId: string;
  amount: number;
  createdAt: string;
}

export interface ContractorOfficer {
  id: string;
  name: string;
  phone: string | null;
  status: "active" | "inactive";
}

export interface ContractorRevenueTrend {
  month: string;
  amount: number;
}

export interface ContractorOverviewData {
  invoices: ContractorInvoice[];
  receipts: ContractorReceipt[];
  officers: ContractorOfficer[];
  revenueTrend: ContractorRevenueTrend[];
  role: Role;
  success: boolean;
}

// Ward Councillor Metrics
export interface CouncillorMetrics {
  totalConstituents: number;
  pendingApprovals: number;
  approvedSOO: number;
  totalComplaints: number;
}

export interface CouncillorApplication {
  id: string;
  applicant: string;
  ward: string;
  status: string;
}

export interface CouncillorOverviewData {
  metrics: CouncillorMetrics;
  applications: CouncillorApplication[];
}

export interface TreasurerMetrics {
  totalRevenue: number;
  pendingAmount: number;
  activeOfficers: number;
  transactionCount: number;
  invoiceGeneratedCount: number;
  pendingInvoiceCount: number;
}

export interface AuditorMetrics {
  totalCollected: number;
  outstanding: number;
  receiptsCount: number;
  auditEvents: number;
  permitsIssued: number;
  permitsPending: number;
  cashShare: number;
  activeOfficers: number;
  cashCollected: number;
  digitalCollected: number;
}

export interface Anomaly {
  id: string;
  reference: string;
  customerName: string;
  amount: number;
}

export interface HighValueTransaction {
  id: string;
  receiptNumber: string;
  customerName: string;
  levyType: string;
  paymentMethod: string;
  amount: number;
}

export interface RecentAudit {
  id: string;
  action: string;
  target: string;
  actor: string;
  actorRole: string;
  createdAt: string;
}

// Field Officer Metrics
export interface FieldOfficerMetrics {
  totalInvoicesGenerated: number;
  totalCollected: number;
  pendingCount: number;
  overdueCount: number;
  channelBreakdown: {
    cash: number;
    pos: number;
    online: number;
    transfer: number;
  };
}

// Default/Other Roles
export interface DefaultMetrics {
  message?: string;
  metrics?: Record<string, never>;
}

// Union type for all possible metric responses
export type DashboardMetrics =
  | {
      metrics: CitizenMetrics;
      recentApplications?: Array<{
        id: string;
        applicationNumber?: string;
        service?: string;
        status: ApplicationStatus;
        feeAmount?: number;
        createdAt: string;
      }>;
    }
  | {
      metrics: BusinessOwnerMetrics;
      recentInvoices: Array<{
        reference: string;
        amount: number;
        customerName: string;
        status: string;
      }>;
    }
  | { metrics: ManagementMetrics }
  | { metrics: CouncillorMetrics }
  | {
      metrics: TreasurerMetrics;
      revenueTrendChart: Array<{ month: number; amount: number }>; // Changed from date to month
      categoryBreakdown: Array<{ category: string; amount: number }>;
    }
  | {
      contractorData: ContractorOverviewData; // New: Full contractor data for UI
    }
  | { metrics: FieldOfficerMetrics }
  | { metrics: DefaultMetrics; message?: string }
  | {
      metrics: AuditorMetrics;
      anomalies: Anomaly[];
      highValueTransactions: HighValueTransaction[];
      recentAudits: RecentAudit[];
    };

// API Response Types
export interface DashboardOverviewResponse {
  success: boolean;
  invoices: ContractorInvoice[];
  receipts: ContractorReceipt[];
  officers: ContractorOfficer[];
  revenueTrend: ContractorRevenueTrend[];
  applications?: CouncillorApplication[];
  role: Role;
  metrics: DashboardMetrics[keyof DashboardMetrics];
  recentInvoices?: Array<{
    reference: string;
    amount: number;
    customerName: string;
    status: string;
  }>;
  //  contractorData?: ContractorOverviewData;
  revenueTrendChart: Array<{ date: string; amount: number }>;
  categoryBreakdown: Array<{ category: string; amount: number }>;
  recentApplications?: Array<{
    id: string;
    applicationNumber?: string;
    service?: string;
    status: ApplicationStatus;
    feeAmount?: number;
    createdAt: string;
  }>;
  anomalies?: Anomaly[];
  highValueTransactions?: HighValueTransaction[];
  recentAudits?: RecentAudit[];
  message?: string;
}

// Helper type to extract metrics based on role
export type MetricsByRole<T extends Role> = T extends "citizen"
  ? CitizenMetrics
  : T extends "business_owner"
    ? BusinessOwnerMetrics
    : T extends "lga_admin" | "chairman"
      ? ManagementMetrics
      : T extends "treasurer"
        ? TreasurerMetrics
        : T extends "ward_councillor"
          ? CouncillorMetrics
          : // : T extends "contractor"
            //   ? ContractorMetrics
            T extends "field_officer"
            ? FieldOfficerMetrics
            : DefaultMetrics;

// Service functions
export const overviewService = {
  // Get dashboard overview for current user
  getDashboardOverview: () =>
    api.get<DashboardOverviewResponse>("/dashboard/overview"),

  // Type-safe getter for specific role
  getOverviewForRole: async <T extends Role>(
    role: T,
  ): Promise<{
    success: boolean;
    role: T;
    metrics: MetricsByRole<T>;
  }> => {
    const response = await api.get<DashboardOverviewResponse>(
      "/dashboard/overview",
    );
    if (response.role !== role) {
      throw new Error(`Role mismatch: expected ${role}, got ${response.role}`);
    }
    return response as unknown as {
      success: boolean;
      role: T;
      metrics: MetricsByRole<T>;
    };
  },
};

// Helper functions for type checking
export const isCitizenMetrics = (
  metrics: unknown,
): metrics is CitizenMetrics => {
  return (
    typeof metrics === "object" &&
    metrics !== null &&
    "pendingPayments" in metrics &&
    "approvedApplications" in metrics &&
    "openComplaints" in metrics
  );
};

export const isBusinessOwnerMetrics = (
  metrics: unknown,
): metrics is BusinessOwnerMetrics => {
  return (
    typeof metrics === "object" &&
    metrics !== null &&
    "activePermits" in metrics &&
    "pendingPayments" in metrics &&
    "approvedApplications" in metrics &&
    "openComplaints" in metrics
  );
};

export const isManagementMetrics = (
  metrics: unknown,
): metrics is ManagementMetrics => {
  return (
    typeof metrics === "object" &&
    metrics !== null &&
    "totalRevenue" in metrics &&
    "activePermits" in metrics &&
    "overdueInvoices" in metrics &&
    "wardCoverage" in metrics
  );
};

export const isCouncillorMetrics = (
  metrics: unknown,
): metrics is CouncillorMetrics => {
  return (
    typeof metrics === "object" &&
    metrics !== null &&
    "pendingApprovals" in metrics &&
    "wardComplaints" in metrics
  );
};

// export const isContractorMetrics = (metrics: unknown): metrics is ContractorMetrics => {
//   return (
//     typeof metrics === "object" &&
//     metrics !== null &&
//     "managedAgents" in metrics &&
//     "totalCollections" in metrics
//   );
// };

// Update the runtime type-guard check function below
export const isFieldOfficerMetrics = (
  metrics: unknown,
): metrics is FieldOfficerMetrics => {
  return (
    typeof metrics === "object" &&
    metrics !== null &&
    "totalInvoicesGenerated" in metrics &&
    "totalCollected" in metrics &&
    "pendingCount" in metrics &&
    "overdueCount" in metrics &&
    "channelBreakdown" in metrics
  );
};
