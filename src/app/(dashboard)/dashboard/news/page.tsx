"use client";

import { useState } from "react";
import { PageHeader, StatCard, EmptyState } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Newspaper,
  FileCheck2,
  PencilLine,
  Archive,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";
import { tokenManager } from "@/services/apiAuth";
import {
  useAdminNewsList,
  useCreateNews,
  useUpdateNews,
  useDeleteNews,
} from "@/hooks/queries/useNews";
import type { NewsItem, NewsStatus } from "@/types/news";
import {
  NewsEditorDialog,
  type NewsFormData,
} from "@/components/news/NewsEditorDialog";

const STATUS_STYLES: Record<NewsStatus, string> = {
  draft: "bg-warning/15 text-warning-foreground border-warning/30",
  published: "bg-success/15 text-success border-success/30",
  archived: "bg-muted text-muted-foreground border-border/60",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type SubmitPayload = NewsFormData & { coverImageUrl?: string | null };

function toPayload(form: SubmitPayload) {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    excerpt: form.excerpt?.trim() || form.body.slice(0, 160),
    body: form.body,
    tag: form.tag,
    coverImageUrl: form.coverImageUrl ?? null,
    status: form.status,
  };
  // Omit entirely when empty — avoid sending `publishedAt: null` to a
  // backend validator that expects the key to simply be absent.
  if (form.publishedAt) {
    payload.publishedAt = form.publishedAt;
  }
  return payload as unknown as import("@/types/news").CreateNewsPayload;
}

export default function NewsPage() {
  const user = tokenManager.getUser();
  const userRole = user?.role;
  const canManage = userRole === "chairman" || userRole === "lga_admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | NewsStatus>("all");
  const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null);

  const { data, isLoading, refetch } = useAdminNewsList();
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();

  if (!canManage) {
    return (
      <div>
        <PageHeader
          title="News & Updates"
          subtitle="Council announcements, events and project updates"
        />
        <EmptyState
          title="Restricted area"
          desc="Only the Chairman and LGA Admin can manage news articles."
        />
      </div>
    );
  }

  const articles = data?.data ?? [];
  const filtered = articles.filter((a) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = data?.meta.total ?? articles.length;
  const published = articles.filter((a) => a.status === "published").length;
  const drafts = articles.filter((a) => a.status === "draft").length;
  const archived = articles.filter((a) => a.status === "archived").length;

  const handleCreate = (form: SubmitPayload, onSaved: () => void) => {
    createNews.mutate(toPayload(form), {
      onSuccess: () => {
        refetch();
        onSaved();
      },
    });
  };

  const handleUpdate = (id: string) => (form: SubmitPayload, onSaved: () => void) => {
    updateNews.mutate(
      { id, data: toPayload(form) },
      {
        onSuccess: () => {
          refetch();
          onSaved();
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteNews.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        refetch();
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="News & Updates"
        subtitle="Publish announcements, events and project updates to the public site"
        action={
          <NewsEditorDialog
            onSubmit={handleCreate}
            isSaving={createNews.isPending}
          />
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Articles" value={String(total)} icon={Newspaper} color="primary" />
        <StatCard label="Published" value={String(published)} icon={FileCheck2} color="success" />
        <StatCard label="Drafts" value={String(drafts)} icon={PencilLine} color="warning" />
        <StatCard label="Archived" value={String(archived)} icon={Archive} color="gold" />
      </div>

      <Card className="p-4 bg-gradient-card border-border/40 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "all" | NewsStatus)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={articles.length === 0 ? "No articles yet" : "No matches"}
          desc={
            articles.length === 0
              ? "Create your first article — drafts stay hidden until published."
              : "Try a different search or status filter."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium max-w-md truncate">{a.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-md">
                        {a.excerpt}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{a.tag}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_STYLES[a.status]}`}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDate(a.publishedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <NewsEditorDialog
                          article={a}
                          onSubmit={handleUpdate(a.id)}
                          isSaving={updateNews.isPending}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(a)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete article?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be removed from the
              dashboard and the public site. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteNews.isPending}
            >
              {deleteNews.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
