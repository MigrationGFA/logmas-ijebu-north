/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  treasurerService,
  RevenueCategory,
  InvoiceStatus,
  UpsertServiceFeeData,
  ServiceFeeConfig,
} from "@/services/apiTreasurer";
import { serviceKey } from "./useServices";

export const treasurerKeys = {
  all: ["treasurer"] as const,
  revenue: () => [...treasurerKeys.all, "revenue"] as const,
  revenueOverview: (params?: any) => [...treasurerKeys.revenue(), "overview", params] as const,
  revenueByOfficer: (params?: any) => [...treasurerKeys.revenue(), "by-officer", params] as const,
  revenueByWard: (params?: any) => [...treasurerKeys.revenue(), "by-ward", params] as const,
  reconciliation: (params?: any) => [...treasurerKeys.all, "reconciliation", params] as const,
  invoices: () => [...treasurerKeys.all, "invoices"] as const,
  invoicesList: (params?: any) => [...treasurerKeys.invoices(), params] as const,
  invoice: (id: string) => [...treasurerKeys.invoices(), id] as const,
  
  // NEW: Service Fee Management Keys
  serviceFees: () => [...treasurerKeys.all, "service-fees"] as const,
  serviceFeesList: () => [...treasurerKeys.serviceFees(), "list"] as const,
  serviceFee: (serviceId: string) => [...treasurerKeys.serviceFees(), serviceId] as const,
  
  // NEW: Treasury Overview Keys
  treasuryOverview: (params?: any) => [...treasurerKeys.all, "treasury-overview", params] as const,
  
  // NEW: Field Officers Keys
  fieldOfficers: (params?: any) => [...treasurerKeys.all, "field-officers", params] as const,

  // Field-officer static-account payment confirmation
  awaitingConfirmation: (params?: any) =>
    [...treasurerKeys.all, "awaiting-confirmation", params] as const,
};

// ============================================================
// Field-officer static-account payment confirmation hooks
// ============================================================

export function useAwaitingConfirmation() {
  const queryClient = useQueryClient();

  const useGetAwaitingConfirmation = (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    return useQuery({
      queryKey: treasurerKeys.awaitingConfirmation(params),
      queryFn: () => treasurerService.listAwaitingConfirmation(params),
      staleTime: 15 * 1000, // worklist moves fast — 15s
    });
  };

  const confirmPaymentMutation = useMutation({
    mutationFn: (
      args:
        | string
        | {
            paymentId: string;
            overrideUnderpayment?: boolean;
            underpaymentReason?: string;
          },
    ) => {
      const pid = typeof args === "string" ? args : args.paymentId;
      const payload =
        typeof args === "object"
          ? {
              overrideUnderpayment: args.overrideUnderpayment,
              underpaymentReason: args.underpaymentReason,
            }
          : undefined;
      return treasurerService.confirmStaticAccountPayment(pid, payload);
    },
    onSuccess: (data) => {
      toast.success(
        `Payment confirmed — receipt ${data.receipt.receiptNumber} issued`,
      );
      queryClient.invalidateQueries({
        queryKey: treasurerKeys.awaitingConfirmation(),
      });
      queryClient.invalidateQueries({ queryKey: treasurerKeys.treasuryOverview() });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to confirm payment");
    },
  });

  const declinePaymentMutation = useMutation({
    mutationFn: ({
      paymentId,
      reason,
    }: {
      paymentId: string;
      reason: string;
    }) => treasurerService.declineStaticAccountPayment(paymentId, reason),
    onSuccess: () => {
      toast.success("Payment proof declined — application declined");
      queryClient.invalidateQueries({
        queryKey: treasurerKeys.awaitingConfirmation(),
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to decline payment");
    },
  });

  const subAdminReviewPaymentMutation = useMutation({
    mutationFn: ({
      paymentId,
      action,
      comment,
    }: {
      paymentId: string;
      action: "approve" | "request_correction";
      comment?: string;
    }) =>
      treasurerService.subAdminReviewStaticAccountPayment(paymentId, {
        action,
        comment,
      }),
    onSuccess: (_data, variables) => {
      if (variables.action === "approve") {
        toast.success(
          "Payment evidence verified by Sub-Admin and forwarded to Treasurer for final approval",
        );
      } else {
        toast.info(
          "Correction requested on payment evidence — applicant notified",
        );
      }
      queryClient.invalidateQueries({
        queryKey: treasurerKeys.awaitingConfirmation(),
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to review payment evidence");
    },
  });

  return {
    useGetAwaitingConfirmation,
    confirmPayment: confirmPaymentMutation.mutate,
    confirmPaymentAsync: confirmPaymentMutation.mutateAsync,
    isConfirming: confirmPaymentMutation.isPending,
    declinePayment: declinePaymentMutation.mutate,
    declinePaymentAsync: declinePaymentMutation.mutateAsync,
    isDeclining: declinePaymentMutation.isPending,
    subAdminReviewPayment: subAdminReviewPaymentMutation.mutate,
    subAdminReviewPaymentAsync: subAdminReviewPaymentMutation.mutateAsync,
    isSubAdminReviewing: subAdminReviewPaymentMutation.isPending,
  };
}

// ============================================================
// NEW: Service Fee Management Hooks
// ============================================================

export function useServiceFees() {
  const queryClient = useQueryClient();

  const useGetServiceFees = () => {
    return useQuery({
      queryKey: treasurerKeys.serviceFeesList(),
      queryFn: () => treasurerService.listServiceFees(),
    });
  };

  const useGetServiceFee = (serviceId: string) => {
    return useQuery({
      queryKey: treasurerKeys.serviceFee(serviceId),
      queryFn: () => treasurerService.getServiceFee(serviceId),
      enabled: !!serviceId,
    });
  };

  const upsertServiceFeeMutation = useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: UpsertServiceFeeData }) =>
      treasurerService.upsertServiceFee(serviceId, data),
    onSuccess: (_data: ServiceFeeConfig) => {
      queryClient.invalidateQueries({ queryKey: treasurerKeys.serviceFees() });
      queryClient.invalidateQueries({ queryKey: treasurerKeys.treasuryOverview() });
      queryClient.invalidateQueries({ queryKey: serviceKey.all });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to configure service fee");
    },
  });

  return {
    useGetServiceFees,
    useGetServiceFee,
    upsertServiceFee: upsertServiceFeeMutation.mutate,
    upsertServiceFeeAsync: upsertServiceFeeMutation.mutateAsync,
    isUpserting: upsertServiceFeeMutation.isPending,
  };
}

// ============================================================
// NEW: Treasury Overview Hooks
// ============================================================

export function useTreasuryOverview() {
  const useGetTreasuryOverview = (params?: { from?: string; to?: string }) => {
    return useQuery({
      queryKey: treasurerKeys.treasuryOverview(params),
      queryFn: () => treasurerService.getTreasuryOverview(params),
    });
  };

  return { useGetTreasuryOverview };
}

// ============================================================
// NEW: Field Officers Hooks
// ============================================================

export function useFieldOfficers() {
  const useGetFieldOfficers = (params?: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => {
    return useQuery({
      queryKey: treasurerKeys.fieldOfficers(params),
      queryFn: () => treasurerService.getFieldOfficers(params),
    });
  };

  return { useGetFieldOfficers };
}

// ============================================================
// EXISTING: Revenue Analytics Hooks (kept as-is)
// ============================================================

export function useRevenueAnalytics() {
  const useGetRevenueOverview = (params?: { from?: string; to?: string }) => {
    return useQuery({
      queryKey: treasurerKeys.revenueOverview(params),
      queryFn: () => treasurerService.getRevenueOverview(params),
    });
  };

  const useGetRevenueByOfficer = (params?: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => {
    return useQuery({
      queryKey: treasurerKeys.revenueByOfficer(params),
      queryFn: () => treasurerService.getRevenueByOfficer(params),
    });
  };

  const useGetRevenueByWard = (params?: { from?: string; to?: string }) => {
    return useQuery({
      queryKey: treasurerKeys.revenueByWard(params),
      queryFn: () => treasurerService.getRevenueByWard(params),
    });
  };

  return {
    useGetRevenueOverview,
    useGetRevenueByOfficer,
    useGetRevenueByWard,
  };
}

// ============================================================
// EXISTING: Reconciliation Hook (kept as-is)
// ============================================================

export function useReconciliation() {
  const useGetReconciliation = (params?: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => {
    return useQuery({
      queryKey: treasurerKeys.reconciliation(params),
      queryFn: () => treasurerService.getReconciliation(params),
    });
  };

  return { useGetReconciliation };
}

// ============================================================
// EXISTING: Invoice Management Hooks (kept as-is)
// ============================================================

export function useTreasurerInvoices() {
  const queryClient = useQueryClient();

  const useGetAllInvoices = (params?: {
    from?: string;
    to?: string;
    status?: InvoiceStatus;
    category?: RevenueCategory;
    officerId?: string;
    businessId?: string;
    page?: number;
    limit?: number;
  }) => {
    return useQuery({
      queryKey: treasurerKeys.invoicesList(params),
      queryFn: () => treasurerService.getAllInvoices(params),
    });
  };

  const useGetInvoice = (id: string) => {
    return useQuery({
      queryKey: treasurerKeys.invoice(id),
      queryFn: () => treasurerService.getInvoiceById(id),
      enabled: !!id,
    });
  };

  const markInvoiceOverdueMutation = useMutation({
    mutationFn: (id: string) => treasurerService.markInvoiceOverdue(id),
    onSuccess: (data) => {
      toast.success(`Invoice ${data.invoiceNumber} marked as overdue`);
      queryClient.invalidateQueries({ queryKey: treasurerKeys.invoices() });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark invoice as overdue");
    },
  });

  return {
    useGetAllInvoices,
    useGetInvoice,
    markInvoiceOverdue: markInvoiceOverdueMutation.mutate,
    markInvoiceOverdueAsync: markInvoiceOverdueMutation.mutateAsync,
    isMarkingOverdue: markInvoiceOverdueMutation.isPending,
  };
}

// ============================================================
// EXISTING: Field Officers Hook (kept for backward compatibility)
// ============================================================

export type TreasurerRole = "treasurer" | "lga_admin" | "sub_admin" | "super_admin" | "contractor" | "chairman";

export function useTreasurerOfficer(role?: TreasurerRole) {
  return useQuery({
    queryKey: ["field-officers", role],
    queryFn: () => treasurerService.getFieldOfficers(),
    // Only run query if the user is authenticated and has viewing clearance
    enabled:
      !!role &&
      (role === "lga_admin" ||
        role === "sub_admin" ||
        role === "super_admin" ||
        role === "contractor" ||
        role === "treasurer" ||
        role === "chairman"),
    staleTime: 1000 * 60 * 5, // Cache entries cleanly for 5 minutes
  });
}

// ============================================================
// Combined Treasurer Hook (kept as-is)
// ============================================================

export function useTreasurer() {
  const revenueAnalytics = useRevenueAnalytics();
  const reconciliation = useReconciliation();
  const invoices = useTreasurerInvoices();
  const serviceFees = useServiceFees();
  const treasuryOverview = useTreasuryOverview();
  const fieldOfficers = useFieldOfficers();
  const gpayHub = useGPayHub();

  return {
    revenueAnalytics,
    reconciliation,
    invoices,
    serviceFees,
    treasuryOverview,
    fieldOfficers,
    gpayHub,
  };
}

export function useGPayHub() {
  const queryClient = useQueryClient();

  const useGetTransactions = (params?: {
    channel?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    return useQuery({
      queryKey: [...treasurerKeys.all, "gpay-transactions", params],
      queryFn: () => treasurerService.getGPayTransactions(params),
      refetchInterval: 20 * 1000, // auto-refresh live feed every 20s
      staleTime: 10 * 1000,
    });
  };

  const settleTransactionMutation = useMutation({
    mutationFn: (payload: {
      gpayReference: string;
      applicationId?: string;
      applicationNumber?: string;
      overrideUnderpayment?: boolean;
      remarks?: string;
    }) => treasurerService.settleGPayTransaction(payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: [...treasurerKeys.all, "gpay-transactions"] });
      queryClient.invalidateQueries({ queryKey: treasurerKeys.awaitingConfirmation() });
      toast.success(
        res?.message || "Transaction successfully settled and linked to application!",
      );
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to settle transaction");
    },
  });

  return {
    useGetTransactions,
    settleTransaction: settleTransactionMutation.mutate,
    settleTransactionAsync: settleTransactionMutation.mutateAsync,
    isSettling: settleTransactionMutation.isPending,
  };
}
