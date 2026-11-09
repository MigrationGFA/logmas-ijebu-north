import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  demandNoticeService,
  CreateDemandNoticePayload,
  ListDemandNoticesParams,
} from "@/services/apiDemandNotice";
import { toast } from "sonner";

export const demandNoticeKeys = {
  all: ["demand-notices"] as const,
  lists: () => [...demandNoticeKeys.all, "list"] as const,
  list: (params?: ListDemandNoticesParams) => [...demandNoticeKeys.lists(), params] as const,
  details: () => [...demandNoticeKeys.all, "detail"] as const,
  detail: (reference: string) => [...demandNoticeKeys.details(), reference] as const,
};

export function useDemandNotices(params?: ListDemandNoticesParams) {
  return useQuery({
    queryKey: demandNoticeKeys.list(params),
    queryFn: () => demandNoticeService.listDemandNotices(params),
    staleTime: 30 * 1000,
  });
}

export function useDemandNoticeByRef(reference: string, enabled = true) {
  return useQuery({
    queryKey: demandNoticeKeys.detail(reference),
    queryFn: () => demandNoticeService.getDemandNoticeByRef(reference),
    enabled: !!reference && enabled,
    staleTime: 15 * 1000,
  });
}

export function useCreateDemandNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDemandNoticePayload) =>
      demandNoticeService.createDemandNotice(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: demandNoticeKeys.all });
      toast.success(
        `Demand notice ${data?.data?.demandNoticeNumber || "created"} issued successfully!`
      );
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to issue demand notice");
    },
  });
}

export function useCancelDemandNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      demandNoticeService.cancelDemandNotice(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demandNoticeKeys.all });
      toast.success("Demand notice cancelled successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to cancel notice");
    },
  });
}

export function useResendDemandNotice() {
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email?: string }) =>
      demandNoticeService.resendDemandNotice(id, email),
    onSuccess: (res: any) => {
      toast.success(res?.message || "Demand notice notification resent successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to resend notice");
    },
  });
}
