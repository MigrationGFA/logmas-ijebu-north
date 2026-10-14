"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import {  getConfiguredFeeForService } from "@/config/lgaServices";
import { useServices } from "@/hooks/queries/useServices";
import { ServiceApplicationGuideSteps } from "@/components/services/ServiceApplicationGuideSteps";
import { PublicServiceApplyWidget } from "@/components/services/PublicServiceApplyWidget";
import { LGA_CONFIG } from "@/config/lga.config";
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
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  FileCheck,
  QrCode,
  ShieldAlert,
  CreditCard,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

const ICONS: Record<string, any> = {
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

function ServicesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlServiceId = searchParams ? searchParams.get("serviceId") : null;

  const { services: servicesData, isLoading } = useServices();

  const services = useMemo(() => {
    const list = Array.isArray(servicesData) ? servicesData : (servicesData as any)?.data || [];
    if (list && list.length > 0) {
      return list;
    }
    return [];
  }, [servicesData]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedQuickService, setSelectedQuickService] = useState<string>(
    urlServiceId || "certificate_of_origin"
  );

  // Sync state when URL serviceId changes
  useEffect(() => {
    if (urlServiceId) {
      setSelectedQuickService(urlServiceId);
    }
  }, [urlServiceId]);

  const categories = [
    "All",
    "Certificates",
    "Community & Agriculture",
    "Rates & Levies",
    "Licences & Permits",
    "Urban Development",
  ];

  const filteredServices = services
    .filter((service: any) => {
      const matchesSearch =
        (service.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (service.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (service.revenueHead || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "All" || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a: any, b: any) => {
      const aIsCoo = a.id === "certificate_of_origin" || a.code === "certificate_of_origin";
      const bIsCoo = b.id === "certificate_of_origin" || b.code === "certificate_of_origin";
      if (aIsCoo && !bIsCoo) return -1;
      if (!aIsCoo && bIsCoo) return 1;
      return 0;
    });

  const handleApplyClick = (serviceId: string) => {
    setSelectedQuickService(serviceId);
    try {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
      params.set("serviceId", serviceId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } catch (e) {
      console.error("Failed to update URL", e);
    }

    // Smooth scroll to quick apply
    const el = document.getElementById("quick-apply-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-mesh border-b border-border/40">
          <div className="container mx-auto px-4 py-14 md:py-18 text-center max-w-4xl">
            <Badge variant="outline" className="mb-3">
              Official LGA Services & Portal
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Statutory Services & Licences for {LGA_CONFIG.identity.name}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-base">
              Apply for State of Origin, business permits, haulage passes, property rates, and trade licences online with end-to-end digital verification.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => {
                  const el = document.getElementById("quick-apply-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-gradient-hero text-primary-foreground font-semibold shadow-elegant"
              >
                <Sparkles className="mr-2 h-4 w-4" /> First-Timer? Select Service & Pay
              </Button>
              <Button asChild variant="outline">
                <Link href="#services-catalog">Browse All Services</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 6-Step Mandatory Process Banner */}
        <section className="bg-muted/20 border-b border-border/40 py-10">
          <div className="container mx-auto px-4">
            <ServiceApplicationGuideSteps
              title="Official 6-Step Application & Payment Process"
              subtitle="Please follow these steps for all services. First-time applicants will have an account automatically created with login details sent to their email upon payment."
            />
          </div>
        </section>

        {/* First Timer Interactive Application & Payment Section */}
        <section id="quick-apply-section" className="container mx-auto px-4 py-12">
          <PublicServiceApplyWidget
            initialServiceId={selectedQuickService}
            showStepGuide={false}
          />
        </section>

        {/* Filter and Services Grid */}
        <section id="services-catalog" className="container mx-auto px-4 py-12 md:py-16 border-t border-border/40">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">
              Full Statutory Directory
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Available Council Services & Tariffs
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Select any service below to view SLA requirements or initiate your statutory payment and application.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services, certificate of origin, rates, permits..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden md:inline mr-1" />
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="whitespace-nowrap text-xs font-medium"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((s: any) => {
              const Icon = ICONS[s.icon] || FileBadge;
              const fee = Number(
                s.feeConfig?.amount ?? getConfiguredFeeForService(s.id) ?? s.defaultFee ?? 0
              );
              const processingTime =
                s.processingTime || (s.estimatedDays ? `${s.estimatedDays} Business Days` : "1 - 3 Business Days");
              const reqDocsCount = (s.requiredDocuments || s.requirements || []).length;

              return (
                <Card
                  key={s.id}
                  className="p-6 flex flex-col justify-between bg-gradient-card border-border/40 hover:shadow-elegant transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: `color-mix(in oklab, var(--${s.color || "primary"}) 12%, transparent)`,
                        }}
                      >
                        <Icon className="h-6 w-6" style={{ color: `var(--${s.color || "primary"})` }} />
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-semibold">
                        {s.category || "Statutory"}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      <Link href={`/services/${s.id}`}>{s.name}</Link>
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {s.description}
                    </p>

                    <div className="mt-4 p-3 rounded-lg bg-muted/40 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Statutory Fee:</span>
                        <span className="font-bold text-foreground">
                          {fee > 0 ? `₦${fee.toLocaleString()}` : s.feeDescription || "Variable Tariff"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Processing Time:</span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary" /> {processingTime}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground pt-0.5">
                        <span>Revenue Head:</span>
                        <span className="font-mono text-[11px] text-foreground">{s.revenueHead || "1001"}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Requires {reqDocsCount > 0 ? reqDocsCount : 2} verification documents</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <QrCode className="h-3.5 w-3.5 text-primary" />
                        <span>Instant verifiable QR certificate</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/40 grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" size="sm" className="text-xs">
                      <Link href={`/services/${s.id}`}>Details & SLA</Link>
                    </Button>
                    <Button
                      onClick={() => handleApplyClick(s.id)}
                      size="sm"
                      className="bg-gradient-hero text-xs font-semibold"
                    >
                      <CreditCard className="mr-1.5 h-3 w-3" /> Pay & Apply
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <Card className="p-12 text-center bg-muted/20 border-dashed">
              <ShieldAlert className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-base">No statutory services match your search</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Try clearing your search query or selecting &ldquo;All&rdquo; categories.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
              >
                Reset Filters
              </Button>
            </Card>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ServicesPageContent />
    </Suspense>
  );
}
