import { api } from "../lib/api";
import type {
  CreateNewsPayload,
  NewsItem,
  NewsListParams,
  NewsListResponse,
  UpdateNewsPayload,
} from "@/types/news";

// ── News & Updates service ─────────────────────────────────────────────────
// Backend contract: see NEWS_BACKEND_CONTRACT.md at repo root.
//
// Public reads (no auth — same `skip-auth` pattern as apiInvoice.ts public
// calls) hit /news. Dashboard reads/writes hit /lga/news (requireAuth,
// roles: chairman, lga_admin — enforced server-side; the sidebar gate here
// is UX only).
//
// Cover images reuse the general upload pipeline:
//   POST /uploads?type=news  (multipart FormData{file}, requireAuth)
// Backend note: UPLOAD_FOLDER_MAP has no `news` key yet, so uploads fall
// through to `documents/` until the backend adds:
//   news: 'public/uploads/news',
// (one line in src/utils/fileStorage.ts). Response shape is unchanged
// ({ url, filename, size }), so this client needs no update when that lands.

const SKIP_AUTH = { headers: { "skip-auth": "true" } } as const;

export const newsService = {
  // ── Public ──
  listPublicNews: (params?: NewsListParams) =>
    api.get<NewsListResponse>("/news", { params, ...SKIP_AUTH }),

  getPublicArticle: (slug: string) =>
    api.get<NewsItem>(`/news/${encodeURIComponent(slug)}`, SKIP_AUTH),

  // ── Dashboard (chairman, lga_admin) ──
  listAdminNews: (params?: NewsListParams) =>
    api.get<NewsListResponse>("/lga/news", { params }),

  createNews: (payload: CreateNewsPayload) =>
    api.post<NewsItem>("/lga/news", payload),

  updateNews: (id: string, payload: UpdateNewsPayload) =>
    api.patch<NewsItem>(`/lga/news/${encodeURIComponent(id)}`, payload),

  deleteNews: (id: string) =>
    api.delete<null>(`/lga/news/${encodeURIComponent(id)}`),
};
