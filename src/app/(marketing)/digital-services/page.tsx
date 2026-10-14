"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell, PageHero } from "@/components/page-shell";
import { ServiceApplicationGuideSteps } from "@/components/services/ServiceApplicationGuideSteps";
import { PublicServiceApplyWidget } from "@/components/services/PublicServiceApplyWidget";
import Link from "next/link";
import {
    FileBadge,
    Store,
    Truck,
    ScrollText,
    Receipt,
    MessageSquare,
    ShieldCheck,
    ArrowRight,
    CreditCard,
    QrCode,
    LayoutDashboard,
    Sparkles,
} from "lucide-react";

const MODULES = [
    {
        icon: FileBadge,
        title: "State of Origin",
        desc: "Apply, pay ₦3,500 statutory fee and download QR-verified indigene certificates.",
        to: "/services/certificate_of_origin",
    },
    {
        icon: Store,
        title: "Market Stall & Levies",
        desc: "Settle daily, weekly and monthly market levies with instant receipts.",
        to: "/services/market_stall_allocation",
    },
    {
        icon: Truck,
        title: "Heavy-Duty Vehicle Levy",
        desc: "Haulage and transport operators pay and receive verifiable passes.",
        to: "/services/heavy_duty_haulage",
    },
    {
        icon: ScrollText,
        title: "Trade Permits & Licences",
        desc: "View and pay statutory trade permits and liquor licences online.",
        to: "/services/liquor_licence",
    },
    {
        icon: Receipt,
        title: "Club & CDA Registration",
        desc: "Formalize community associations and social clubs with official certificates.",
        to: "/services/club_registration",
    },
    {
        icon: MessageSquare,
        title: "Complaints & Inquiries",
        desc: "Raise citizen service issues and track responses end-to-end.",
        to: "/complaints",
    },
    {
        icon: QrCode,
        title: "Public Verification",
        desc: "Verify certificates and receipts via QR or certificate serial number.",
        to: "/verify",
    },
    {
        icon: CreditCard,
        title: "All Statutory Services",
        desc: "Browse the full directory of 12+ the Local Government services.",
        to: "/services",
    },
];

export default function DigitalServices() {
    return (
        <PageShell>
            <PageHero
                eyebrow="LOGMAS  -  E-Government"
                title="Every government service. One secure portal."
                subtitle="LOGMAS is the official digital backbone of the Local Government Area  -  bringing every citizen, business and council workflow online with audit-grade transparency."
            >
                <div className="flex flex-wrap gap-3">
                    <Button asChild className="bg-gradient-hero shadow-elegant">
                        <Link href="/services">
                            <Sparkles className="mr-2 h-4 w-4" /> Apply for a Service Online
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/verify">Verify a Document</Link>
                    </Button>
                </div>
            </PageHero>

            {/* 6-Step Mandatory Application Process Banner */}
            <section className="bg-muted/20 border-b border-border/40 py-12">
                <div className="container mx-auto px-4 max-w-6xl">
                    <ServiceApplicationGuideSteps
                        title="Official 6-Step Application & Payment Process"
                        subtitle="Please review these mandatory steps before paying for any statutory service. First-time applicants have an account created automatically upon payment."
                    />
                </div>
            </section>

            {/* First-Timer Instant Application & Payment Widget */}
            <section className="container mx-auto px-4 py-14 max-w-6xl">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        First-Timer Fast Service Payment
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        Select any service, enter your name, email, and phone number, view the statutory fee, and make payment online to auto-create your account.
                    </p>
                </div>

                <PublicServiceApplyWidget
                    initialServiceId="certificate_of_origin"
                    showStepGuide={false}
                />
            </section>

            {/* Services Modules Grid */}
            <section className="container mx-auto px-4 py-14 border-t border-border/40">
                <div className="mb-8 text-center max-w-2xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Key Public Service Modules</h2>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        Click on any module to view requirements or apply online with official SLA processing.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {MODULES.map((m) => (
                        <Link key={m.title} href={m.to} className="block">
                            <Card className="p-6 h-full bg-gradient-card border-border/40 hover:shadow-elegant hover:-translate-y-1 transition-smooth">
                                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                                    <m.icon className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold">{m.title}</h3>
                                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                                <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                                    Access Service <ArrowRight className="h-3 w-3" />
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="bg-secondary/40 py-14 border-t border-border/40">
                <div className="container mx-auto px-4 grid md:grid-cols-3 gap-5">
                    {[
                        {
                            icon: ShieldCheck,
                            t: "Bank-grade security",
                            d: "Encrypted in transit and at rest. NDPR-compliant.",
                        },
                        {
                            icon: LayoutDashboard,
                            t: "Unified dashboards",
                            d: "Tailored views for citizens, businesses and council staff.",
                        },
                        {
                            icon: QrCode,
                            t: "Verifiable everywhere",
                            d: "Every receipt and certificate is publicly verifiable by QR.",
                        },
                    ].map((c) => (
                        <Card key={c.t} className="p-6 bg-background border-border/40">
                            <c.icon className="h-6 w-6 text-primary" />
                            <h3 className="mt-3 font-semibold">{c.t}</h3>
                            <p className="mt-1.5 text-sm text-muted-foreground">{c.d}</p>
                        </Card>
                    ))}
                </div>
            </section>
        </PageShell>
    );
}

