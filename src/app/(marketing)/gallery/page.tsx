"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell, PageHero } from "@/components/page-shell";
import { GALLERY } from "@/config/lgaContent.config";
import { Image as ImageIcon } from "lucide-react";

// Renders the entry's photo across the card header. If the file is missing
// or fails to load, nothing renders and the gradient tile behind it shows,
// so an entry never displays a broken image.
function GalleryPhoto({ src, alt }: { src?: string; alt: string }) {
    const [failed, setFailed] = useState(false);
    if (!src || failed) return null;
    return (
        <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover object-top"
            onError={() => setFailed(true)}
        />
    );
}

export default function GalleryPage() {
    const palette = ["primary", "gold", "info", "success", "warning", "primary", "gold", "info"];
    return (
        <PageShell>
            <PageHero
                eyebrow="Media Gallery"
                title="Moments that define our community"
                subtitle="A growing archive of agricultural shows, mining hubs, community projects and the everyday beauty of the Local Government Area."
            />
            <section className="container mx-auto px-4 py-14">
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {GALLERY.map((g, i) => (
                        <Card key={g.title} className="overflow-hidden border-border/40 group cursor-pointer">
                            <div
                                className="h-44 relative flex items-end p-3"
                                style={{
                                    background: `linear-gradient(135deg, color-mix(in oklab, var(--${palette[i % palette.length]}) 70%, transparent), color-mix(in oklab, var(--gold) 40%, transparent))`,
                                }}
                            >
                                <GalleryPhoto src={g.image} alt={g.title} />
                                <ImageIcon className="absolute top-3 right-3 z-10 h-5 w-5 text-white/70" />
                                <Badge className="relative z-10 bg-black/40 text-white border-white/20 backdrop-blur">
                                    {g.category}
                                </Badge>
                            </div>
                            <div className="p-3">
                                <div className="font-medium text-sm">{g.title}</div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
        </PageShell>
    );
}
