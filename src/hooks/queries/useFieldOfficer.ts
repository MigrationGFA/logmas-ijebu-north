/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fieldOfficerService,
  CreateBusinessData,
  GenerateInvoiceData,
  RecordPaymentData,
  IssuePermitData,
  ViolationData,
  CreateStaticAccountApplicationData,
} from "@/services/apiFieldOfficer";
import { businessKeys } from "./useBusiness";

export const fieldOfficerKeys = {
  all: ["field-officer"] as const,
  businesses: () => [...fieldOfficerKeys.all, "businesses"] as const,
  invoices: () => [...fieldOfficerKeys.all, "invoices"] as const,
  collections: () => [...fieldOfficerKeys.all, "collections"] as const,
  collectionsSummary: () => [...fieldOfficerKeys.all, "collections", "summary"] as const,
  verifyReceipt: (code: string) => [...fieldOfficerKeys.all, "verify", code] as const,
  staticApplications: () => [...fieldOfficerKeys.all, "static-applications"] as const,
};

// ============================================================
// Static-account (bank-transfer) assisted applications
// ============================================================

export function useStaticAccountApplications() {
  const queryClient = useQueryClient();

  const createApplicationMutation = useMutation({
    mutationFn: (data: CreateStaticAccountApplicationData) =>
      fieldOfficerService.createStaticAccountApplication(data),
    onSuccess: (data) => {
      toast.success(
        `Application ${data.application.applicationNumber} created — awaiting payment confirmation`,
      );
      queryClient.invalidateQueries({
        queryKey: fieldOfficerKeys.staticApplications(),
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create application");
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: ({
      paymentId,
      file,
    }: {
      paymentId: string;
      file: File;
    }) => fieldOfficerService.uploadPaymentProof(paymentId, file),
    onSuccess: () => {
      toast.success(
        "Proof of payment uploaded — awaiting treasurer confirmation",
      );
      queryClient.invalidateQueries({
        queryKey: fieldOfficerKeys.staticApplications(),
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload proof of payment");
    },
  });

  return {
    createStaticAccountApplication: createApplicationMutation.mutate,
    createStaticAccountApplicationAsync:
      createApplicationMutation.mutateAsync,
    isCreatingStaticAccountApplication:
      createApplicationMutation.isPending,
    uploadPaymentProof: uploadProofMutation.mutate,
    uploadPaymentProofAsync: uploadProofMutation.mutateAsync,
    isUploadingProof: uploadProofMutation.isPending,
  };
}

// Business Registration Hooks
export function useFieldOfficerBusinesses(enabled:boolean) {
  const queryClient = useQueryClient();

  const useGetBusinesses = () => {
    return useQuery({
      queryKey: fieldOfficerKeys.businesses(),
      queryFn: () => fieldOfficerService.getAllWardBusinesses(),
      staleTime: 2 * 60 * 1000, // 2 minutes
      enabled
    });
    
  };

  const registerBusinessMutation = useMutation({
    mutationFn: (data: CreateBusinessData) => fieldOfficerService.registerBusiness(data),
    onSuccess: () => {
      toast.success("Business registered successfully");
      queryClient.invalidateQueries({ queryKey: fieldOfficerKeys.businesses() });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to register business");
    },
  });

  return {
    useGetBusinesses,
    registerBusiness: registerBusinessMutation.mutate,
    registerBusinessAsync: registerBusinessMutation.mutateAsync,
    isRegistering: registerBusinessMutation.isPending,
  };
}

// Invoice Generation Hooks
export function useFieldOfficerInvoices() {
  const queryClient = useQueryClient();

  const generateInvoiceMutation = useMutation({
    mutationFn: (data: GenerateInvoiceData) => fieldOfficerService.generateInvoice(data),
    onSuccess: (data) => {
      toast.success(`Invoice ${data.invoiceNumber} generated successfully`);
      queryClient.invalidateQueries({ queryKey: fieldOfficerKeys.collections() });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate invoice");
    },
  });

  return {
    generateInvoice: generateInvoiceMutation.mutate,
    generateInvoiceAsync: generateInvoiceMutation.mutateAsync,
    isGenerating: generateInvoiceMutation.isPending,
  };
}

// Payment Recording Hooks
export function useFieldOfficerPayments(permitId?:string) {
  const queryClient = useQueryClient();

  const recordPaymentMutation = useMutation({
    mutationFn: (data: RecordPaymentData) => fieldOfficerService.recordPayment(data,permitId),
    onSuccess: (response) => {
      toast.success(response.message);

      queryClient.invalidateQueries({ queryKey: businessKeys.permit(permitId ?? "") });
      queryClient.invalidateQueries({ queryKey: fieldOfficerKeys.collections() });
      queryClient.invalidateQueries({ queryKey: fieldOfficerKeys.collectionsSummary() });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record payment");
    },
  });

  return {
    recordPayment: recordPaymentMutation.mutate,
    recordPaymentAsync: recordPaymentMutation.mutateAsync,
    isRecording: recordPaymentMutation.isPending,
  };
}

// Permit Issuance Hooks
export function useFieldOfficerPermits() {
  const queryClient = useQueryClient();

  const issuePermitMutation = useMutation({
    mutationFn: (data: IssuePermitData) => fieldOfficerService.issuePermit(data),
    onSuccess: (data) => {
      toast.success(`Permit ${data.permitNumber} issued successfully`);
      queryClient.invalidateQueries({ queryKey: fieldOfficerKeys.collections() });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to issue permit");
    },
  });

  return {
    issuePermit: issuePermitMutation.mutate,
    issuePermitAsync: issuePermitMutation.mutateAsync,
    isIssuing: issuePermitMutation.isPending,
  };
}

// Receipt Verification Hook
export function useFieldOfficerReceiptVerification() {
  const useVerifyReceipt = (code: string, enabled: boolean = true) => {
    return useQuery({
      queryKey: fieldOfficerKeys.verifyReceipt(code),
      queryFn: () => fieldOfficerService.verifyReceipt(code),
      enabled: enabled && !!code,
      retry: 1,
    });
  };

  return { useVerifyReceipt };
}
export function useWardPermits() {
  const useGetPermits = (params?: { search?: string; status?: string }) => {
    return useQuery({
      queryKey: [...fieldOfficerKeys.all, "ward-permits", params],
      queryFn: () => fieldOfficerService.getWardPermits(params),
      staleTime: 30 * 1000,
    });
  };

  return { useGetPermits };
}

export function useDemandNotice() {
  const queryClient = useQueryClient();

  const issueDemandNoticeMutation = useMutation({
    mutationFn: (permitId: string) => fieldOfficerService.issueDemandNotice(permitId),
    onSuccess: (data) => {
      toast.success(`Demand notice issued - Invoice ${data.invoice.invoiceNumber}`);
      queryClient.invalidateQueries({ queryKey: fieldOfficerKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to issue demand notice");
    },
  });

  return {
    issueDemandNotice: issueDemandNoticeMutation.mutate,
    issueDemandNoticeAsync: issueDemandNoticeMutation.mutateAsync,
    isIssuing: issueDemandNoticeMutation.isPending,
  };
}

export function useViolation() {
  const queryClient = useQueryClient();

  const logViolationMutation = useMutation({
    mutationFn: (data: ViolationData) => fieldOfficerService.logViolation(data),
    onSuccess: () => {
      toast.success("Violation logged successfully");
      queryClient.invalidateQueries({ queryKey: fieldOfficerKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to log violation");
    },
  });

  return {
    logViolation: logViolationMutation.mutate,
    logViolationAsync: logViolationMutation.mutateAsync,
    isLogging: logViolationMutation.isPending,
  };
}

// Daily Collections Hooks
export function useFieldOfficerCollections() {
  const useGetCollections = (params?: { date?: string; page?: number; limit?: number }) => {
    return useQuery({
      queryKey: [...fieldOfficerKeys.collections(), params],
      queryFn: () => fieldOfficerService.getMyCollections(params),
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  const useGetCollectionSummary = () => {
    return useQuery({
      queryKey: fieldOfficerKeys.collectionsSummary(),
      queryFn: () => fieldOfficerService.getCollectionSummary(),
      staleTime: 30 * 1000,
    });
  };

  return {
    useGetCollections,
    useGetCollectionSummary,
  };
}

// Combined Field Officer Hook
export function useFieldOfficer() {
  const businesses = useFieldOfficerBusinesses(false);
  const invoices = useFieldOfficerInvoices();
  const payments = useFieldOfficerPayments();
  const permits = useFieldOfficerPermits();
  const verification = useFieldOfficerReceiptVerification();
  const collections = useFieldOfficerCollections();
   const wardPermits = useWardPermits();
  const demandNotice = useDemandNotice();
  const violation = useViolation();

  return {
    businesses,
    invoices,
    payments,
    permits,
    verification,
    collections,
     wardPermits,
    demandNotice,
    violation,
  };
}