"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell, PageHero } from "@/components/page-shell";
import { LEADERSHIP } from "@/config/lgaContent.config";
import { LGA_CONFIG } from "@/config/lga.config";
import { Mail, Phone, Crown, Quote } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Ward councillors are sourced from the LGA config so the marketing site and
// the admin dashboard always show the same verified roster.
const councillors = LGA_CONFIG.leadership.councillors ?? [];

export default function LeadershipPage() {
    const chairman = LEADERSHIP[0];
    return (
        <PageShell>
            <PageHero
                eyebrow="Government Leadership"
                title="Servant-leadership for every citizen"
                subtitle={`A modern council united by vision, transparency and an unwavering commitment to ${LGA_CONFIG.identity.fullName}.`}
            />

            <section className="container mx-auto px-4 py-14">
                <Card className="overflow-hidden border-border/40 bg-gradient-card shadow-elegant">
                    <div className="grid md:grid-cols-3">
                        <div className="order-2 md:order-1 relative bg-gradient-hero text-primary-foreground min-h-[320px] sm:min-h-[360px] md:min-h-[400px]">
                            {chairman.image ? (
                                <Image
                                    src={chairman.image}
                                    alt={`${chairman.name}, ${chairman.role}`}
                                    className="absolute inset-0 w-full h-full object-cover object-top"
                                    fill
                                    priority
                                />
                            ) : (
                                <div className="p-10 flex flex-col items-center justify-center text-center h-full">
                                    <div className="h-32 w-32 rounded-full bg-white/15 border-4 border-white/30 flex items-center justify-center text-4xl font-bold backdrop-blur">
                                        {chairman.initials}
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-6 text-white">
                                <div className="flex items-center gap-2">
                                    <Crown className="h-4 w-4 text-gold" />
                                    <span className="text-xs uppercase tracking-wider opacity-90">
                                        {chairman.role}
                                    </span>
                                </div>
                                <div className="mt-1 font-bold text-lg">{chairman.name}</div>
                                <div className="text-xs opacity-90">{LGA_CONFIG.identity.fullName} · {LGA_CONFIG.identity.state}</div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 md:col-span-2 p-6 sm:p-8 md:p-10">
                            <Badge className="bg-gold/15 text-gold border-gold/30">
                                Chairman&apos;s Welcome Address
                            </Badge>
                            <Quote className="h-8 w-8 text-gold mt-4" />
                            <div className="mt-3 space-y-3 text-sm md:text-base leading-relaxed">
                                <p>Dear citizens, residents, farmers, investors and friends of {LGA_CONFIG.identity.fullName},</p>
                                <p>
                                    It is with profound humility and gratitude to Almighty God that I welcome you to the official digital home of {LGA_CONFIG.identity.fullName}, {LGA_CONFIG.identity.state}.
                                </p>
                                <p>
                                    Our administration is committed to building an {LGA_CONFIG.identity.name} where every community across our {LGA_CONFIG.wards.length} wards feels the impact of purposeful, people-centred governance. We remain focused on improving infrastructure, supporting our farmers, traders and youths, strengthening grassroots development and making government more accessible to all.
                                </p>
                                <p>
                                    This platform is part of our commitment to open, transparent and accessible governance. Here, you can learn about who we are, what we do, our leadership, communities, programmes and projects, while also accessing essential Local Government services such as Certificate of Origin, Business Permit, Haulage Pass, Building-related services, Demand Notices, payments, official receipts, complaints and other services.
                                </p>
                                <p>
                                    Through technology and initiatives like this platform, we are bringing government services closer to you - making them easier to access, more transparent and more convenient.
                                </p>
                                <p>
                                    I invite you to explore this portal, stay informed, access our services, engage with us and join us in building a greater {LGA_CONFIG.identity.name}.
                                </p>
                                <p>
                                    Together, with God&apos;s guidance and your support, {LGA_CONFIG.identity.fullName} will continue to rise.
                                </p>
                                <div className="pt-2">
                                    <p className="font-semibold not-italic">
                                        {LGA_CONFIG.leadership.chairman.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {LGA_CONFIG.leadership.chairman.title}, {LGA_CONFIG.identity.fullName} · {LGA_CONFIG.identity.state}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button asChild className="bg-gradient-hero shadow-elegant">
                                    <Link href="/invest">Invest with Us</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/contact">Contact the Office</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </section>

            <section className="container mx-auto px-4 pb-16">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">Council Executives</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {LEADERSHIP.slice(1).map((m) => (
                        <Card
                            key={m.name}
                            className="p-6 bg-gradient-card border-border/40 hover:shadow-elegant transition-smooth"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-hero text-primary-foreground flex items-center justify-center font-bold text-lg shadow-elegant">
                                    {m.initials}
                                </div>
                                <div>
                                    <div className="font-semibold">{m.name}</div>
                                    <div className="text-xs text-muted-foreground">{m.role}</div>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{m.bio}</p>
                            <div className="mt-4 pt-4 border-t border-border/40 flex gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Mail className="h-3 w-3" /> {m.email || "Not available"}
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="bg-secondary/40 py-14">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Ward Councillors</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        The {councillors.length} elected councillors representing each ward of {LGA_CONFIG.identity.fullName}.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {councillors.map((c) => (
                            <Card
                                key={c.ward}
                                className="p-5 bg-background border-border/40 hover:shadow-card transition-smooth"
                            >
                                <Badge variant="outline" className="mb-2">
                                    {c.ward}
                                </Badge>
                                <div className="font-semibold text-sm">{c.name}</div>
                                {c.role && (
                                    <div className="text-xs text-primary font-medium mt-1">{c.role}</div>
                                )}
                                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <Phone className="h-3 w-3" /> {c.phone}
                                    </div>
                                    <div className="flex items-center gap-1.5 break-all">
                                        <Mail className="h-3 w-3 shrink-0" /> {c.email}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </PageShell>
    );
}

