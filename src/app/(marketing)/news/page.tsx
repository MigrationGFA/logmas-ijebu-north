"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell, PageHero } from "@/components/page-shell";
import { NEWS } from "@/config/lgaContent.config";
import { usePublicNews } from "@/hooks/queries/useNews";
import { Calendar, ArrowRight, Search, Loader2 } from "lucide-react";

const FILTER_TAGS = ["All", "Announcement", "Event", "Project", "Health", "Culture"];

// Fallback shape used only when the API has no data / fails to load, so the
// page is never empty for visitors. Same fields the API returns, so render
// code below doesn't need to branch.
const FALLBACK_NEWS = NEWS.map((n, i) => ({
    id: `fallback-${i}`,
    slug: `fallback-${i}`,
    title: n.title,
    date: n.date,
    tag: n.tag,
    excerpt: undefined as string | undefined,
}));

export default function NewsPage() {
    const [search, setSearch] = useState("");
    const [tag, setTag] = useState("All");

    const { data, isLoading, isError } = usePublicNews({
        search: search || undefined,
        tag: tag === "All" ? undefined : (tag as never),
    });

    const apiArticles = data?.data ?? [];
    const items = useMemo(() => {
        if (apiArticles.length > 0) {
            return apiArticles.map((a) => ({
                id: a.id,
                slug: a.slug,
                title: a.title,
                date: a.publishedAt
                    ? new Date(a.publishedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                      })
                    : "—",
                tag: a.tag,
                excerpt: a.excerpt,
            }));
        }
        // Only fall back to static data when nothing came back from the API
        // (loading finished, no error that we should surface differently).
        if (!isLoading) return FALLBACK_NEWS;
        return [];
    }, [apiArticles, isLoading]);

    return (
        <PageShell>
            <PageHero
                eyebrow="News & Events"
                title="Updates from your council"
                subtitle="Stay informed with announcements, press releases, project updates and community events."
            />
            <section className="container mx-auto px-4 py-14">
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search news, events, announcements..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {FILTER_TAGS.map((t) => (
                            <Badge
                                key={t}
                                variant={t === tag ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => setTag(t)}
                            >
                                {t}
                            </Badge>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-center text-muted-foreground py-16">
                        {isError ? "Couldn't load news right now." : "No news articles yet."}
                    </p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {items.map((n) => (
                            <Card
                                key={n.id}
                                className="p-6 bg-gradient-card border-border/40 hover:shadow-elegant transition-smooth"
                            >
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" /> {n.date}
                                    <Badge variant="outline" className="ml-auto">
                                        {n.tag}
                                    </Badge>
                                </div>
                                <h3 className="mt-3 font-semibold leading-snug">{n.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                    {n.excerpt
                                        ? n.excerpt
                                        : "Read the full update and discover how this development affects citizens, businesses and partners across the LGA."}
                                </p>
                                <Button asChild variant="ghost" size="sm" className="mt-3 px-0 text-primary">
                                    <a href={n.slug.startsWith("fallback-") ? "/news" : `/news/${n.slug}`}>
                                        Read more <ArrowRight className="h-3 w-3 ml-1" />
                                    </a>
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </PageShell>
    );
}
