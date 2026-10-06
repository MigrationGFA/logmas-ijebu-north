/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { newsService } from "@/services/apiNews";
import type {
  CreateNewsPayload,
  NewsListParams,
  UpdateNewsPayload,
} from "@/types/news";

export const newsKeys = {
  all: ["news"] as const,
  publicList: (params?: NewsListParams) =>
    [...newsKeys.all, "public", params] as const,
  publicDetail: (slug: string) =>
    [...newsKeys.all, "public", slug] as const,
  adminList: (params?: NewsListParams) =>
    [...newsKeys.all, "admin", params] as const,
};

// ── Public feed (no auth) ──

export function usePublicNews(params?: NewsListParams) {
  return useQuery({
    queryKey: newsKeys.publicList(params),
    queryFn: () => newsService.listPublicNews(params),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function useNewsArticle(slug: string) {
  return useQuery({
    queryKey: newsKeys.publicDetail(slug),
    queryFn: () => newsService.getPublicArticle(slug),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

// ── Dashboard (chairman, lga_admin) ──

export function useAdminNewsList(params?: NewsListParams) {
  return useQuery({
    queryKey: newsKeys.adminList(params),
    queryFn: () => newsService.listAdminNews(params),
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNewsPayload) =>
      newsService.createNews(payload),
    onSuccess: (data) => {
      toast.success(`"${data.title}" created successfully`);
      queryClient.invalidateQueries({ queryKey: newsKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: newsKeys.publicList() });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create news article");
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNewsPayload }) =>
      newsService.updateNews(id, data),
    onSuccess: (data) => {
      toast.success(`"${data.title}" updated successfully`);
      queryClient.invalidateQueries({ queryKey: newsKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: newsKeys.publicList() });
      queryClient.invalidateQueries({
        queryKey: newsKeys.publicDetail(data.slug),
      });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update news article");
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => newsService.deleteNews(id),
    onSuccess: () => {
      toast.success("News article deleted");
      queryClient.invalidateQueries({ queryKey: newsKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: newsKeys.publicList() });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete news article");
    },
  });
}
