"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell, PageHero } from "@/components/page-shell";
import { GALLERY } from "@/config/lgaContent.config";
import {
    Image as ImageIcon,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

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

// Full-screen viewer for one gallery entry. Opens on tap, moves through
// the whole gallery with on-screen arrows, keyboard arrows, or a touch
// swipe, and closes from the X, the backdrop, or Escape.
function GalleryLightbox({
    index,
    onClose,
    onNavigate,
}: {
    index: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
}) {
    const entry = GALLERY[index];
    const [failed, setFailed] = useState(false);
    const touchStartX = useRef<number | null>(null);

    const goPrev = useCallback(() => {
        onNavigate((index - 1 + GALLERY.length) % GALLERY.length);
    }, [index, onNavigate]);
    const goNext = useCallback(() => {
        onNavigate((index + 1) % GALLERY.length);
    }, [index, onNavigate]);

    // A new entry gets a fresh chance to load its photo.
    useEffect(() => {
        setFailed(false);
    }, [index]);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
            if (event.key === "ArrowLeft") goPrev();
            if (event.key === "ArrowRight") goNext();
        }
        window.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [goPrev, goNext, onClose]);

    if (!entry) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={entry.title}
            onClick={onClose}
            onTouchStart={(e) => {
                touchStartX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
                const delta = endX - touchStartX.current;
                touchStartX.current = null;
                if (Math.abs(delta) < 40) return;
                if (delta > 0) goPrev();
                else goNext();
            }}
        >
            <div className="flex items-center justify-between px-4 py-3 text-white">
                <span className="text-sm text-white/70">
                    {index + 1} / {GALLERY.length}
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close viewer"
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div
                className="relative flex-1 mx-4 mb-2"
                onClick={(e) => e.stopPropagation()}
            >
                {entry.image && !failed ? (
                    <Image
                        src={entry.image}
                        alt={entry.title}
                        fill
                        sizes="100vw"
                        className="object-contain"
                        onError={() => setFailed(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-white/30" />
                    </div>
                )}

                <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous photo"
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next photo"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            </div>

            <div
                className="px-4 pb-6 pt-1 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <Badge className="bg-white/10 text-white border-white/20 mb-2">
                    {entry.category}
                </Badge>
                <div className="text-white font-medium">{entry.title}</div>
            </div>
        </div>
    );
}

export default function GalleryPage() {
    const palette = ["primary", "gold", "info", "success", "warning", "primary", "gold", "info"];
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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
                        <Card
                            key={g.title}
                            className="overflow-hidden border-border/40 group cursor-pointer"
                            onClick={() => setLightboxIndex(i)}
                        >
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
            {lightboxIndex !== null && (
                <GalleryLightbox
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}
        </PageShell>
    );
}
