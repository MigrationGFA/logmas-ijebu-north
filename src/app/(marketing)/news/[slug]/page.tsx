"use client";

// NOTE: created to fix a missing route — the news cards/links on the
// homepage and the /news listing page already pointed at `/news/{slug}`,
// but this dynamic route didn't exist yet, so those links 404'd.

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";
import { useNewsArticle } from "@/hooks/queries/useNews";
import { Calendar, ArrowLeft, Loader2, FileQuestion } from "lucide-react";

export default function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const { data: article, isLoading, isError } = useNewsArticle(slug);

  const formattedDate = article?.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 px-2 text-muted-foreground">
          <Link href="/news">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to News & Events
          </Link>
        </Button>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError || !article ? (
          <div className="flex flex-col items-center text-center py-24">
            <FileQuestion className="h-10 w-10 text-muted-foreground mb-4" />
            <h1 className="text-xl font-semibold">Article not found</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              This article may have been unpublished, removed, or the link is
              incorrect.
            </p>
            <Button asChild className="mt-6">
              <Link href="/news">Browse all news</Link>
            </Button>
          </div>
        ) : (
          <article>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {formattedDate && (
                <>
                  <Calendar className="h-3.5 w-3.5" /> {formattedDate}
                </>
              )}
              <Badge variant="outline" className="ml-auto">
                {article.tag}
              </Badge>
            </div>

            <h1 className="mt-3 text-2xl md:text-4xl font-bold tracking-tight leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {article.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.coverImageUrl}
                alt={article.title}
                className="mt-6 w-full rounded-xl object-cover max-h-[420px] border border-border/40"
              />
            )}

            <div className="mt-8 prose prose-sm md:prose-base max-w-none whitespace-pre-wrap leading-relaxed text-foreground">
              {article.body}
            </div>

            {article.authorName && (
              <p className="mt-10 pt-6 border-t border-border/40 text-xs text-muted-foreground">
                Published by {article.authorName}
              </p>
            )}
          </article>
        )}
      </section>
    </PageShell>
  );
}
