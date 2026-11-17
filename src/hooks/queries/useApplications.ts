import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiApplications } from "@/services/apiApplications";
import {
  ApplicationsQueryParams,
  CreateApplicationData,
} from "@/types/application";

export const applicationsKeys = {
  all: ["applications"] as const,
  list: (params?: ApplicationsQueryParams) => ["applications", "list", params ?? {}] as const,
  detail: (id: string) => ["applications", "detail", id] as const,
  searchApplicants: (q: string) => ["applicants", "search", q] as const,
};

export function useApplications(params?: ApplicationsQueryParams) {
  return useQuery({
    queryKey: applicationsKeys.list(params),
    queryFn: () => apiApplications.getApplications(params),
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: id ? applicationsKeys.detail(id) : ["applications", "noop"],
    queryFn: () => apiApplications.getApplicationById(id as string),
    enabled: !!id,
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApplicationData) => apiApplications.submitApplication(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: applicationsKeys.all });
      toast.success(`Application ${data.application.applicationNumber} submitted successfully!`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit statutory application");
    },
  });
}

export function useCompleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        formData?: Record<string, any>;
        files?: Record<string, any>;
        applicantId?: string;
        serviceId?: string;
      };
    }) => apiApplications.completeApplication(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: applicationsKeys.all });
      qc.invalidateQueries({ queryKey: applicationsKeys.detail(data?.id) });
      toast.success(
        `Application ${data?.applicationNumber || data?.id || ""} completed and submitted successfully!`
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to complete statutory application");
    },
  });
}

export function useMoveToUnderReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiApplications.moveToUnderReview(id, notes),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: applicationsKeys.all });
      qc.invalidateQueries({ queryKey: applicationsKeys.detail(data.id) });
      toast.success(`Application ${data.applicationNumber} moved to Under Review`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update review status");
    },
  });
}

export function useApproveApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiApplications.approveApplication(id, notes),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: applicationsKeys.all });
      qc.invalidateQueries({ queryKey: applicationsKeys.detail(data.id) });
      toast.success(`Application ${data.applicationNumber} Approved & Certificate/Licence Issued!`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to approve application");
    },
  });
}

export function useDeclineApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, declineReason }: { id: string; declineReason: string }) =>
      apiApplications.declineApplication(id, declineReason),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: applicationsKeys.all });
      qc.invalidateQueries({ queryKey: applicationsKeys.detail(data.id) });
      toast.error(`Application ${data.applicationNumber} Declined`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to decline application");
    },
  });
}

export function useSearchApplicants(query: string) {
  return useQuery({
    queryKey: applicationsKeys.searchApplicants(query),
    queryFn: () => apiApplications.searchApplicants(query),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 1000 * 60,
  });
}
