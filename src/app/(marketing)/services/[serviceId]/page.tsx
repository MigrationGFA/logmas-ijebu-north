"use client";

import React, { use, useState } from "react";
import { getLgaServiceById, LGA_SERVICES, ServiceType, getConfiguredFeeForService } from "@/config/lgaServices";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ServiceApplicationGuideSteps } from "@/components/services/ServiceApplicationGuideSteps";
import { PublicServiceApplyWidget } from "@/components/services/PublicServiceApplyWidget";
import { SITE_CONTACT } from "@/config/siteContact";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  FileBadge,
  Users,
  Building2,
  Sprout,
  ShieldCheck,
  Home,
  Truck,
  Beer,
  Tv,
  Pickaxe,
  MapPin,
  Store,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  QrCode,
  CreditCard,
  HelpCircle,
  Phone,
  Mail,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  UserCheck,
  LogIn,
} from "lucide-react";
import { useServices } from "@/hooks/queries/useServices";

const ICON_MAP: Record<string, any> = {
  FileBadge,
  Users,
  Building2,
  Sprout,
  ShieldCheck,
  Home,
  Truck,
  Beer,
  Tv,
  Pickaxe,
  MapPin,
  Store,
};

interface PublicServicePageProps {
  params: Promise<{ serviceId: string }>;
}

export default function PublicServiceDetailPage({ params }: PublicServicePageProps) {
  const resolvedParams = use(params);
  const serviceId = resolvedParams.serviceId;

  const { services: allServices, useGetServiceBySlug } = useServices();
  const matchedFromList: any = allServices.find(
    (s: any) => s.id === serviceId || s.code === serviceId || s.slug === serviceId
  );
  const lookupKey = matchedFromList?.code || matchedFromList?.slug || serviceId;
  const { data: fetchedService } = useGetServiceBySlug(lookupKey);
  const service: any = matchedFromList || fetchedService;

  const [activeTab, setActiveTab] = useState<"apply" | "requirements" | "workflow" | "faq">("apply");

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center max-w-2xl">
          <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <Badge variant="outline" className="mb-3">
            Service Not Found
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            We couldn&apos;t find that service
          </h1>
          <p className="mt-3 text-muted-foreground">
            The requested service &ldquo;{serviceId}&rdquo; may have moved or been updated in the the Local Government statutory catalogue.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild className="bg-gradient-hero">
              <Link href="/services">
                <ArrowLeft className="mr-2 h-4 w-4" /> Browse All LGA Services
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const IconComponent = ICON_MAP[service.icon] || FileBadge;
  const currentFee = service.feeConfig.amount;

  // Filter related services in same category or adjacent
  const relatedServices = LGA_SERVICES.filter(
    (s) => s.id !== service.id && (s.category === service.category || Math.random() > 0.5)
  ).slice(0, 3);

  const scrollToApply = () => {
    const el = document.getElementById("apply-and-pay-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Breadcrumbs & Header Section */}
        <section className="bg-gradient-mesh border-b border-border/40">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/services" className="hover:text-primary transition-colors">
                Services
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Badge variant="secondary" className="text-[10px]">
                {service.category}
              </Badge>
            </nav>

            <div className="grid lg:grid-cols-12 gap-8 items-start md:px-8">
              <div className="lg:col-span-8">
                <div className="flex items-start gap-4">
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-elegant"
                    style={{
                      // backgroundColor: `color-mix(in oklab, var(--${service.color}) 15%, transparent)`,
                    }}
                  >
                    <IconComponent
                      className="h-8 w-8"
                      // style={{ color: `var(--${service.color})` }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                        Head: {service.revenueHead}
                      </span>
                      {/* {service.supportsCertificate && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                          Official Certificate
                        </Badge>
                      )}
                      {service.supportsLicence && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                          Statutory Licence
                        </Badge>
                      )} */}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                      {service.name}
                    </h1>
                    <p className="mt-2 text-base text-muted-foreground leading-relaxed max-w-2xl">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-6 pt-6 border-t border-border/40 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-[11px] text-muted-foreground font-medium">Processing SLA</div>
                      <div className="font-semibold text-foreground">{ (service.estimatedDays
                              ? `${service.estimatedDays} Business Days`
                              : "1 - 3 Business Days")}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-[11px] text-muted-foreground font-medium">Official Fee</div>
                      <div className="font-semibold text-foreground">
                        {`₦${currentFee.toLocaleString()}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-[11px] text-muted-foreground font-medium">Verification</div>
                      <div className="font-semibold text-foreground">Instant QR Verification</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Box */}
              <div className="lg:col-span-4">
                <Card className="p-6 bg-card border-border/80 shadow-elegant">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Citizen & Business Action
                  </div>
                  {/* <div className="mt-2 text-2xl font-bold text-foreground">
                    {service.feeType === "fixed" ? (
                      <>
                        ₦{currentFee.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-muted-foreground">/ statutory fee</span>
                      </>
                    ) : (
                      <span className="text-lg">{service.feeDescription}</span>
                    )}
                  </div> */}
                  <p className="text-xs text-muted-foreground mt-1">
                    Pay statutory fee online to instantly auto-create your account, receive login details via email, and complete your application form.
                  </p>

                  <div className="mt-6 space-y-2.5">
                    <Button
                      onClick={scrollToApply}
                      className="w-full bg-gradient-hero shadow-elegant text-sm font-semibold h-11"
                    >
                      <CreditCard className="mr-2 h-4 w-4" /> Pay & Apply Online Now
                    </Button>

                    <Button asChild variant="outline" className="w-full text-xs h-10">
                      <Link href="/verify">
                        <QrCode className="mr-2 h-3.5 w-3.5" /> Verify Existing Certificate
                      </Link>
                    </Button>

                    <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground h-9">
                      <Link href="/contact">
                        <HelpCircle className="mr-1.5 h-3.5 w-3.5" /> Have questions? Contact LGA Helpdesk
                      </Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 6-Step Statutory Application Guide Posted Before Payment on Service Page */}
        <section className="bg-muted/20 border-b border-border/40 py-10">
          <div className="container mx-auto px-4">
            <ServiceApplicationGuideSteps
              title={`Official 6-Step Application Process for ${service.name}`}
              subtitle="Please follow these steps carefully. Payment must be made online, after which login credentials will be dispatched to your email for application form completion."
            />
          </div>
        </section>

        {/* Main Interactive Apply & Payment Section for this service */}
        <section id="apply-and-pay-section" className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <Badge variant="outline" className="mb-1 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" /> Service Application Form
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Apply & Settle Statutory Fee for {service.name}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Provide applicant payment details below to make payment online, auto-provision your account, and submit your documentation.
            </p>
          </div>

          <PublicServiceApplyWidget
            initialServiceId={service.id}
            showStepGuide={false}
          />
        </section>

        {/* Content Tabs / Sections */}
        <section className="container mx-auto px-4 py-12 md:py-16 border-t border-border/40">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-10">
              {/* Requirements & Documents */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileCheck className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight">Required Documents & Eligibility (Step 4)</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Before you log in to fill the application form, please prepare clear digital copies (PDF, JPG, PNG under 5MB each) of the following statutory documents:
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {service.requirements?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-border/60 bg-gradient-card flex items-start gap-3 text-sm"
                    >
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div className="font-medium text-foreground leading-snug">{doc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div className="pt-6 border-t border-border/40">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-3 text-sm">
                  <Card className="p-4 bg-card border-border/60">
                    <h3 className="font-semibold text-foreground">How long does it take to receive my approved document?</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Standard processing for {service.name} takes {service.processingTime}. Once approved by the council, your digital certificate becomes immediately available in your portal dashboard.
                    </p>
                  </Card>

                  <Card className="p-4 bg-card border-border/60">
                    <h3 className="font-semibold text-foreground">What happens after I make payment online?</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Your citizen portal account is automatically generated, and login credentials are sent directly to your registered email address. You can log in immediately to complete the application form and upload your documents.
                    </p>
                  </Card>

                  <Card className="p-4 bg-card border-border/60">
                    <h3 className="font-semibold text-foreground">Can third parties verify the authenticity of my certificate?</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Yes. Every certificate, permit, and licence features a cryptographically secured QR code that embassies, universities, banks, and government agencies can scan or verify online at logmas.gov.ng/verify.
                    </p>
                  </Card>
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-6">
              {/* Help & Contact Support */}
              <Card className="p-6 bg-gradient-mesh border-border/60">
                <h3 className="font-semibold text-base">Council Support Desk</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Need assistance with your documentation or status inquiry? Reach out to the Local Government customer care.
                </p>

                <div className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                  <a href={SITE_CONTACT.phoneTel} className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span>{SITE_CONTACT.phone}</span>
                  </a>
                  <a href={SITE_CONTACT.emailMailto} className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>{SITE_CONTACT.email}</span>
                  </a>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{SITE_CONTACT.shortAddress}</span>
                  </div>
                </div>

                <Button asChild variant="outline" size="sm" className="mt-5 w-full text-xs">
                  <Link href="/contact">Contact LGA Office</Link>
                </Button>
              </Card>

              {/* Related Services */}
              <Card className="p-6 bg-card border-border/60">
                <h3 className="font-semibold text-base mb-3">Other LGA Services</h3>
                <div className="space-y-3">
                  {relatedServices.map((rel) => {
                    const RelIcon = ICON_MAP[rel.icon] || FileBadge;
                    return (
                      <Link
                        key={rel.id}
                        href={`/services/${rel.id}`}
                        className="block p-3 rounded-lg border border-border/40 hover:bg-secondary/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <RelIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-foreground truncate">{rel.name}</h4>
                            <span className="text-[10px] text-muted-foreground">{rel.category}</span>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <Button asChild variant="ghost" size="sm" className="mt-4 w-full text-xs text-primary font-medium">
                  <Link href="/services">View All 12 Services â†’</Link>
                </Button>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}


