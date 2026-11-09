import { api } from "@/lib/api";

export interface DemandNoticeItem {
  description: string;
  amount: number;
}

export interface DemandNoticeRecord {
  id: string;
  applicationNumber: string;
  demandNoticeNumber: string;
  payerType: "individual" | "business" | "property_owner";
  payerName: string;
  tradingName?: string | null;
  rcNumber?: string | null;
  phone: string;
  email?: string | null;
  ward: string;
  address: string;
  serviceName: string;
  revenueHead: string;
  chargeDescription: string;
  assessmentItems: DemandNoticeItem[];
  amountPayable: number;
  issuedDate: string;
  dueDate: string | null;
  status: "paid" | "unpaid" | "overdue" | "cancelled";
  paymentStatus: "pending" | "confirmed" | "failed" | "reversed" | "cancelled";
  invoiceNumber?: string | null;
  invoiceId?: string | null;
  statutoryAccount: {
    bankName: string;
    bankCode?: string;
    accountName: string;
    accountNumber: string;
    serviceCode: string;
  };
  receiptNumber?: string | null;
  receiptId?: string | null;
  paidAt?: string | null;
  issuedBy: string;
  createdAt: string;
}

export interface DemandNoticeMetrics {
  totalIssued: number;
  totalPaid: number;
  totalUnpaid: number;
  totalOverdue: number;
  totalCancelled: number;
  totalAmountAssessed: number;
  totalAmountCollected: number;
}

export interface ListDemandNoticesResponse {
  notices: DemandNoticeRecord[];
  metrics: DemandNoticeMetrics;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateDemandNoticePayload {
  payerType: "individual" | "business" | "property_owner";
  payerName: string;
  tradingName?: string;
  rcNumber?: string;
  phone: string;
  email?: string;
  ward: string;
  address: string;
  serviceCode?: string;
  revenueHead?: string;
  chargeDescription: string;
  assessmentItems?: DemandNoticeItem[];
  amountPayable: number;
  dueDate?: string;
  notes?: string;
}

export interface ListDemandNoticesParams {
  status?: string;
  search?: string;
  ward?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const demandNoticeService = {
  listDemandNotices: async (params?: ListDemandNoticesParams): Promise<ListDemandNoticesResponse> => {
    return await api.get<ListDemandNoticesResponse>("/demand-notices", { params });
  },

  getDemandNoticeByRef: async (reference: string): Promise<DemandNoticeRecord> => {
    return await api.get<DemandNoticeRecord>(`/demand-notices/${encodeURIComponent(reference)}`);
  },

  createDemandNotice: async (payload: CreateDemandNoticePayload) => {
    return await api.post<any>("/demand-notices", payload);
  },

  cancelDemandNotice: async (id: string, reason: string) => {
    return await api.post<any>(`/demand-notices/${id}/cancel`, { reason });
  },

  resendDemandNotice: async (id: string, email?: string) => {
    return await api.post<any>(`/demand-notices/${id}/resend`, { email });
  },
};
