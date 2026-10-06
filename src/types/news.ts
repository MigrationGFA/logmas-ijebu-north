// ── News & Updates ─────────────────────────────────────────────────────────
// Backend mirror contract: see NEWS_BACKEND_CONTRACT.md at repo root.
// Prisma sketch for the backend AI:
//   model News {
//     id          String     @id @default(uuid())
//     slug        String     @unique
//     title       String
//     excerpt     String
//     body        String     @db.Text
//     tag         String
//     coverImageUrl String?
//     status      NewsStatus @default(draft)
//     publishedAt DateTime?
//     authorId    String
//     authorName  String
//     createdAt   DateTime   @default(now())
//     updatedAt   DateTime   @updatedAt
//     deletedAt   DateTime?
//   }
//   enum NewsStatus { draft published archived }

export type NewsStatus = "draft" | "published" | "archived";

export type NewsTag =
  | "Announcement"
  | "Event"
  | "Project"
  | "Health"
  | "Culture"
  | "Empowerment"
  | "Revenue";

export const NEWS_TAGS: NewsTag[] = [
  "Announcement",
  "Event",
  "Project",
  "Health",
  "Culture",
  "Empowerment",
  "Revenue",
];

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tag: NewsTag;
  coverImageUrl?: string | null;
  status: NewsStatus;
  /** ISO display date. Maps to the legacy static `date` string ("12 May 2026"). */
  publishedAt: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NewsListResponse {
  data: NewsItem[];
  meta: NewsListMeta;
}

export interface CreateNewsPayload {
  title: string;
  excerpt?: string;
  body: string;
  tag: NewsTag;
  coverImageUrl?: string | null;
  status?: NewsStatus;
  publishedAt?: string | null;
}

export type UpdateNewsPayload = Partial<CreateNewsPayload>;

export interface NewsListParams {
  tag?: NewsTag | "All";
  search?: string;
  status?: NewsStatus;
  page?: number;
  limit?: number;
}
