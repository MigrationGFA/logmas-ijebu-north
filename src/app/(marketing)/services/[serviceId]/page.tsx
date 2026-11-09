"use client";

import React, { use } from "react";
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
  FileText,
  Crown,
  Heart,
  Clock,
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
} from "lucide-react";
import { useServices, useGetServiceBySlug } from "@/hooks/queries/useServices";

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
  FileText,
  Crown,
  Heart,
};

interface PublicServicePageProps {
  params: Promise<{ serviceId: string }>;
}

function getDynamicRequiredDocuments(service: any): string[] {
  if (
    Array.isArray(service?.requiredDocuments) &&
    service.requiredDocuments.length > 0
  ) {
    return service.requiredDocuments;
  }
  if (
    Array.isArray(service?.requirements) &&
    service.requirements.length > 0
  ) {
    return service.requirements;
  }
  const code = (service?.code || service?.id || "").toLowerCase();
  if (code.includes("origin")) {
    return [
      "Recommendation letter from the Baale of the applicant's community, OR Recommendation letter from the Councillor representing the applicant's ward",
      "National Identity Card / NIN Slip",
      "Passport Photograph (red background)",
      "Birth Certificate / Sworn Declaration of Age",
      "Proof of Residency or Family Lineage Identification within the LGA",
    ];
  }
  if (code.includes("street")) {
    return [
      "Affixed Passport Photograph of Applicant",
      "Local Government Radio & Television Receipt Photocopy",
      "Community Development Levy Receipt Photocopy",
      "Approved Cadastral Survey / Street Layout Plan",
      "Baale / Traditional Ruler Endorsement Letter",
      "CDA / Landlords Association Resolution & Minutes",
      "Applicant National Identification (NIN) / Age Proof",
    ];
  }
  if (code.includes("marriage")) {
    return [
      "Passport Photograph of Husband / Groom",
      "Passport Photograph of Wife / Bride",
      "Sworn Affidavit of Bachelorhood / Spinsterhood & Age (Marriage Ordinance Chapter 128)",
      "Birth Certificate or NPC Age Declaration for both parties",
      "National Identification (NIN) / Government ID for Groom and Bride",
      "Written Parental / Guardian Consent Letter (Mandatory if either party is under 21 years)",
    ];
  }
  if (code.includes("baale")) {
    return [
      "Royal Assent / Chieftaincy Letter from Royal Father (Oba)",
      "Minutes of Family / Community Selection Meeting",
      "Passport Photograph in Traditional Regalia (Akoko / Beads)",
      "National Identification Slip (NIN) / Government ID",
      "Community / Village Boundary Description / Sketch Map",
    ];
  }
  if (code.includes("demand") || code.includes("business")) {
    return [
      "Business Premises / Signboard Photograph",
      "CAC Business Registration Certificate (optional)",
      "Valid Identification of Business Owner / Representative",
      "Tenancy Agreement or Proof of Business Premises Ownership",
    ];
  }
  if (code.includes("levy") || code.includes("tenement")) {
    return [
      "Building / Property Elevation Photograph",
      "Proof of Ownership / Tenancy Agreement",
      "Previous Year Clearance or Council Demand Notice",
    ];
  }
  if (code.includes("club")) {
    return [
      "Club Constitution / Rules",
      "Minutes of Inaugural Meeting",
      "List of Executive Members & Contacts",
      "Passport Photographs of President & Secretary",
      "Proof of Secretariat / Meeting Venue Address",
    ];
  }
  if (code.includes("farmer")) {
    return [
      "Passport Photograph of Farmer / Cooperative Leader",
      "National Identity Card / NIN Slip",
      "Farmland Location Sketch / Coordinates",
      "Proof of Farm Tenancy or Land Ownership",
    ];
  }
  return [
    "National Identity Number (NIN) Slip",
    "Passport Photograph (clear background)",
    "Proof of Residency or Business Address in Ifo LGA",
  ];
}

export default function PublicServiceDetailPage({
  params,
}: PublicServicePageProps) {
  const resolvedParams = use(params);
  const serviceId = resolvedParams.serviceId;

  const { services: allServices, isLoading } = useServices();
  const matchedFromList: any = allServices.find(
    (s: any) =>
      s.id === serviceId ||
      s.code === serviceId ||
      s.slug === serviceId ||
      (serviceId === "certificate_of_origin" && s.code === "state_of_origin") ||
      (serviceId === "state_of_origin" && s.code === "certificate_of_origin") ||
      (serviceId === "community_development_levy" && s.code === "tenement_rate"),
  );
  const lookupKey = matchedFromList?.code || matchedFromList?.slug || serviceId;
  const { data: fetchedService, isLoading: isFetchingSlug } =
    useGetServiceBySlug(lookupKey);
  const service: any = matchedFromList || fetchedService;

  if ((isLoading || isFetchingSlug) && !service) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center max-w-2xl">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Loading service details...
          </p>
        </main>
        <SiteFooter />
      </div>
    );
  }

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
            The requested service &ldquo;{serviceId}&rdquo; may have moved or
            been updated in the Local Government statutory catalogue.
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
  const currentFee = Number(
    service?.feeConfig?.amount ?? service?.defaultFee ?? 0,
  );
  const sCode = (service.code || service.id || "").toLowerCase();
  const isCdl =
    sCode === "tenement_rate" || sCode === "community_development_levy";
  const isSn = sCode === "street_naming";

  // Dynamic required documents for Step 4
  const dynamicRequiredDocuments = getDynamicRequiredDocuments(service);

  // Filter related services from DB-backed services list
  const relatedServices = allServices
    .filter((s: any) => s.id !== service.id)
    .slice(0, 3);

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
              <Link
                href="/services"
                className="hover:text-primary transition-colors"
              >
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
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-elegant">
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                        Head: {service.revenueHead}
                      </span>
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
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Processing SLA
                      </div>
                      <div className="font-semibold text-foreground">
                        {service.estimatedDays
                          ? `${service.estimatedDays} Business Days`
                          : "1 - 3 Business Days"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Official Fee
                      </div>
                      <div className="font-semibold text-foreground">
                        {isCdl
                          ? "Proposed Schedule (Pending Approval)"
                          : isSn
                            ? `From \u20a6150,000`
                            : `\u20a6${currentFee.toLocaleString()}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Verification
                      </div>
                      <div className="font-semibold text-foreground">
                        Instant QR Verification
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Box */}
              <div className="lg:col-span-4">
                <Card className="p-6 bg-card border-border/80 shadow-elegant">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Citizen &amp; Business Action
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pay statutory fee online via Dedicated Providus Bank Virtual
                    Account or Card to instantly auto-create your account,
                    receive login details via email, and complete your
                    application form.
                  </p>

                  <div className="mt-6 space-y-2.5">
                    <Button
                      onClick={scrollToApply}
                      className="w-full bg-gradient-hero shadow-elegant text-sm font-semibold h-11"
                    >
                      <CreditCard className="mr-2 h-4 w-4" /> Pay &amp; Apply
                      Online Now
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full text-xs h-10"
                    >
                      <Link href="/verify">
                        <QrCode className="mr-2 h-3.5 w-3.5" /> Verify Existing
                        Certificate
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="ghost"
                      className="w-full text-xs text-muted-foreground h-9"
                    >
                      <Link href="/contact">
                        <HelpCircle className="mr-1.5 h-3.5 w-3.5" /> Have
                        questions? Contact LGA Helpdesk
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
              subtitle="Please follow these steps carefully. Payment can be made via Dedicated Static Virtual Account or Online Card, after which login credentials will be dispatched to your email for application form completion."
            />
          </div>
        </section>

        {/* Main Interactive Apply & Payment Section for this service */}
        <section
          id="apply-and-pay-section"
          className="container mx-auto px-4 py-12"
        >
          <div className="mb-6">
            <Badge
              variant="outline"
              className="mb-1 bg-primary/10 text-primary border-primary/20"
            >
              <Sparkles className="h-3 w-3 mr-1" /> Service Application Form
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Apply &amp; Settle Statutory Fee for {service.name}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Provide applicant payment details below to make payment online,
              auto-provision your account, and submit your documentation.
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
                  <h2 className="text-2xl font-bold tracking-tight">
                    Required Documents &amp; Eligibility (Step 4)
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Before you log in to fill the application form, please prepare
                  clear digital copies (PDF, JPG, PNG under 5MB each) of the
                  following statutory documents:
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {dynamicRequiredDocuments.map((doc: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-border/60 bg-gradient-card flex items-start gap-3 text-sm"
                    >
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div className="font-medium text-foreground leading-snug">
                        {doc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div className="pt-6 border-t border-border/40">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight">
                    Frequently Asked Questions
                  </h2>
                </div>

                <div className="space-y-3 text-sm">
                  <Card className="p-4 bg-card border-border/60">
                    <h3 className="font-semibold text-foreground">
                      How long does it take to receive my approved document?
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Standard processing for {service.name} takes{" "}
                      {service.estimatedDays
                        ? `${service.estimatedDays} Business Days`
                        : "1 - 3 Business Days"}
                      . Once approved by the council, your digital certificate
                      becomes immediately available in your portal dashboard.
                    </p>
                  </Card>

                  <Card className="p-4 bg-card border-border/60">
                    <h3 className="font-semibold text-foreground">
                      What happens after I make payment online?
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Your citizen portal account is automatically generated,
                      and login credentials are sent directly to your registered
                      email address. You can log in immediately to complete the
                      application form and upload your documents.
                    </p>
                  </Card>

                  <Card className="p-4 bg-card border-border/60">
                    <h3 className="font-semibold text-foreground">
                      Can third parties verify the authenticity of my
                      certificate?
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Yes. Every certificate, permit, and licence features a
                      cryptographically secured QR code that embassies,
                      universities, banks, and government agencies can scan or
                      verify online on the portal verification page.
                    </p>
                  </Card>
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Citizen Verification & Tracking Tools */}
              <Card className="p-5 bg-gradient-to-br from-primary/5 via-card to-background border-border/70 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm tracking-tight text-foreground">
                    Quick Citizen Tools
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fast access to track application progress, authenticate documents, and view statutory guides.
                </p>
                <div className="grid gap-2 pt-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="justify-start h-9 text-xs font-semibold gap-2 border-border/70"
                  >
                    <Link href="/track">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      Track Application Status
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="justify-start h-9 text-xs font-semibold gap-2 border-border/70"
                  >
                    <Link href="/verify">
                      <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                      Verify Official Certificate
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="justify-start h-8 text-xs text-muted-foreground gap-2 hover:text-foreground"
                  >
                    <Link href="/faq">
                      <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                      Frequently Asked Questions (FAQ)
                    </Link>
                  </Button>
                </div>
              </Card>

              {/* Help & Contact Support */}
              <Card className="p-6 bg-gradient-mesh border-border/60">
                <h3 className="font-semibold text-base">
                  Council Support Desk
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Need assistance with your documentation or status inquiry?
                  Reach out to the Local Government customer care.
                </p>

                <div className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                  <a
                    href={SITE_CONTACT.phoneTel}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span>{SITE_CONTACT.phone}</span>
                  </a>
                  <a
                    href={SITE_CONTACT.emailMailto}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>{SITE_CONTACT.email}</span>
                  </a>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{SITE_CONTACT.shortAddress}</span>
                  </div>
                </div>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-5 w-full text-xs"
                >
                  <Link href="/contact">Contact LGA Office</Link>
                </Button>
              </Card>

              {/* Related Services */}
              <Card className="p-6 bg-card border-border/60">
                <h3 className="font-semibold text-base mb-3">
                  Other LGA Services
                </h3>
                <div className="space-y-3">
                  {relatedServices.map((rel: any) => {
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
                            <h4 className="text-xs font-semibold text-foreground truncate">
                              {rel.name}
                            </h4>
                            <span className="text-[10px] text-muted-foreground">
                              {rel.category}
                            </span>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="mt-4 w-full text-xs text-primary font-medium"
                >
                  <Link href="/services">
                    View All {allServices.length || 16} Services &rarr;
                  </Link>
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
