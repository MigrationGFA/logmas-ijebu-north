"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Pencil, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { NEWS_TAGS, type NewsItem, type NewsStatus } from "@/types/news";
import { uploadsService } from "@/services/uploads";

const newsSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(180),
  excerpt: z.string().max(280).optional(),
  body: z.string().min(20, "Article body must be at least 20 characters"),
  tag: z.enum([
    "Announcement",
    "Event",
    "Project",
    "Health",
    "Culture",
    "Empowerment",
    "Revenue",
  ]),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.string().optional(),
});

export type NewsFormData = z.infer<typeof newsSchema>;

interface NewsEditorDialogProps {
  /** When set, the dialog edits this article; otherwise it creates a new one. */
  article?: NewsItem | null;
  onSubmit: (
    data: NewsFormData & { coverImageUrl?: string | null },
    onSaved: () => void,
  ) => void;
  isSaving: boolean;
}

export function NewsEditorDialog({
  article,
  onSubmit,
  isSaving,
}: NewsEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(
    article?.coverImageUrl ?? null,
  );
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      body: "",
      tag: "Announcement",
      status: "draft",
      publishedAt: "",
    },
  });

  // Seed the form when opening for edit.
  useEffect(() => {
    if (open && article) {
      reset({
        title: article.title,
        excerpt: article.excerpt ?? "",
        body: article.body,
        tag: article.tag,
        status: article.status,
        publishedAt: article.publishedAt
          ? article.publishedAt.slice(0, 10)
          : "",
      });
      setCoverUrl(article.coverImageUrl ?? null);
    } else if (open && !article) {
      reset({
        title: "",
        excerpt: "",
        body: "",
        tag: "Announcement",
        status: "draft",
        publishedAt: "",
      });
      setCoverUrl(null);
    }
  }, [open, article, reset]);

  const selectedTag = watch("tag");
  const selectedStatus = watch("status");

  const handleCoverPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG or PNG)");
      e.target.value = "";
      return;
    }
    setIsUploading(true);
    try {
      // Backend note: `?type=news` falls through to `documents/` until the
      // backend adds `news: 'public/uploads/news'` to UPLOAD_FOLDER_MAP.
      // Response shape ({ url }) is identical either way.
      const result = await uploadsService.uploadFile(file, "news");
      setCoverUrl(result.url);
      toast.success("Cover image uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload cover",
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const submit = (data: NewsFormData) => {
    // Omit the key entirely when empty rather than sending `publishedAt: null`
    // — some backend zod schemas reject `null` for an `optional()` string
    // field while happily accepting the key being absent.
    const payload: NewsFormData & { coverImageUrl?: string | null } = {
      ...data,
      coverImageUrl: coverUrl,
    };
    if (!payload.publishedAt) {
      delete (payload as Partial<NewsFormData>).publishedAt;
    }
    onSubmit(payload, () => setOpen(false));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {article ? (
          <Button size="sm" variant="outline" className="h-8 text-xs">
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
        ) : (
          <Button className="bg-gradient-hero shadow-elegant">
            <Plus className="h-4 w-4 mr-1.5" /> New Article
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? "Edit article" : "New article"}
          </DialogTitle>
          <DialogDescription>
            {article
              ? "Update the article. Republishing is instant on the public site."
              : "Drafts stay hidden from the public site until published."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              {...register("title")}
              placeholder="e.g. Chairman commissions renovated Atan market stalls"
              className="mt-1.5"
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <Select
                value={selectedTag}
                onValueChange={(v) =>
                  setValue("tag", v as NewsFormData["tag"])
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NEWS_TAGS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status *</Label>
              <Select
                value={selectedStatus}
                onValueChange={(v) =>
                  setValue("status", v as NewsStatus)
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Excerpt (card teaser, max 280 chars)</Label>
            <Textarea
              {...register("excerpt")}
              rows={2}
              placeholder="One or two sentences shown on the news cards..."
              className="mt-1.5"
            />
            {errors.excerpt && (
              <p className="text-xs text-red-500 mt-1">
                {errors.excerpt.message}
              </p>
            )}
          </div>

          <div>
            <Label>Article body *</Label>
            <Textarea
              {...register("body")}
              rows={8}
              placeholder="Full article text (markdown accepted)..."
              className="mt-1.5"
            />
            {errors.body && (
              <p className="text-xs text-red-500 mt-1">
                {errors.body.message}
              </p>
            )}
          </div>

          <div>
            <Label>Cover image</Label>
            <div className="mt-1.5 flex items-center gap-3">
              {coverUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverUrl}
                    alt="Cover preview"
                    className="h-20 w-32 rounded-lg object-cover border border-border/60"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverUrl(null)}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1"
                    aria-label="Remove cover"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/60 px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
                  <ImagePlus className="h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload cover (JPG/PNG, 5MB max)"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleCoverPick}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <Label>Publish date (optional — defaults to now when published)</Label>
            <Input
              {...register("publishedAt")}
              type="date"
              className="mt-1.5"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || isUploading}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : article ? (
                "Save changes"
              ) : (
                "Create article"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
