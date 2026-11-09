"use client";

import { LGA_CONFIG } from "@/config/lga.config";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useServices } from "@/hooks/queries/useServices";
import {
  getConfiguredFeeForService,
} from "@/config/lgaServices";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ServiceApplicationGuideSteps } from "./ServiceApplicationGuideSteps";
import { invoicesService } from "@/services/apiInvoice";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FileCheck2,
  AlertCircle,
  Layers,
  AlertTriangle,
  Home,
} from "lucide-react";
import Link from "next/link";
import { formatAndValidateNigerianPhoneNumber } from "@/lib/helper";
import {
  getActivePaymentProvider,
  getCheckoutUrl,
  isGpayInitResponse,
  PAYMENT_PROVIDER_LABELS,
  stashPendingPayment,
  type PaymentProvider,
} from "@/config/paymentGateway";
import { PaymentReviewDialog } from "./PaymentReviewDialog";
import { isValidEmailShape, suggestEmailDomain } from "@/lib/emailTypo";
import { DEFAULT_STREET_NAMING_RATES } from "./forms/StreetNamingForm";
import {
  LEVY_CLASSIFICATIONS,
  PROPERTY_TYPES_BY_CLASSIFICATION,
} from "./forms/CommunityDevelopmentLevyForm";

export interface PublicServiceApplyWidgetProps {
  initialServiceId?: string;
  className?: string;
  showStepGuide?: boolean;
}

const STREET_SERVICE_OPTIONS = [
  "Street Naming",
  "Street Renewal",
  "Street Objection",
] as const;

const STREET_ROAD_TYPES = [
  "Street",
  "Road",
  "Avenue",
  "Close",
  "Crescent",
  "Drive",
  "Lane",
  "Way",
  "Boulevard",
  "Bus Stop",
] as const;

function PublicServiceApplyWidgetInner({
  initialServiceId = "state_of_origin",
  className = "",
  showStepGuide = true,
}: PublicServiceApplyWidgetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlServiceId = searchParams ? searchParams.get("serviceId") : null;

  const { services: servicesData } = useServices();

  const services = useMemo(() => {
    const rawList = Array.isArray(servicesData)
      ? servicesData
      : (servicesData as any)?.data || [];
    const filteredList = rawList.filter(
      (s: any) =>
        s.id !== "cda_registration" &&
        s.code !== "cda_registration" &&
        !String(s.name || "").toLowerCase().includes("cda registration"),
    );
    return [...filteredList].sort((a: any, b: any) => {
      const aIsCoo =
        a.id === "state_of_origin" ||
        a.code === "state_of_origin" ||
        a.code === "certificate_of_origin";
      const bIsCoo =
        b.id === "state_of_origin" ||
        b.code === "state_of_origin" ||
        b.code === "certificate_of_origin";
      if (aIsCoo && !bIsCoo) return -1;
      if (!aIsCoo && bIsCoo) return 1;
      return 0;
    });
  }, [servicesData]);

  // Initial state derived from URL or initialServiceId
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    urlServiceId || initialServiceId || "state_of_origin",
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Street Naming Selection State
  const [streetOption, setStreetOption] = useState<string>("Street Naming");
  const [streetRoadType, setStreetRoadType] = useState<string>("Street");

  // Community Development Levy Selection State
  const [cdlClassification, setCdlClassification] = useState<string>("residential");
  const [cdlPropertyType, setCdlPropertyType] = useState<string>("two_bed_flat");

  // Sync state when URL serviceId or initialServiceId changes
  useEffect(() => {
    if (urlServiceId) {
      setSelectedServiceId(urlServiceId);
    } else if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
    }
  }, [urlServiceId, initialServiceId]);

  // Find currently selected service
  const selectedService = useMemo(() => {
    if (!services || services.length === 0) return null;
    const match = services.find(
      (s: any) =>
        s.id === selectedServiceId ||
        s.code?.toLowerCase() === selectedServiceId?.toLowerCase() ||
        s.id?.toLowerCase() === selectedServiceId?.toLowerCase() ||
        s.slug?.toLowerCase() === selectedServiceId?.toLowerCase() ||
        (selectedServiceId?.toLowerCase() === "certificate_of_origin" &&
          s.code?.toLowerCase() === "state_of_origin") ||
        (selectedServiceId?.toLowerCase() === "state_of_origin" &&
          s.code?.toLowerCase() === "certificate_of_origin") ||
        (selectedServiceId?.toLowerCase() === "community_development_levy" &&
          s.code?.toLowerCase() === "tenement_rate"),
    );
    return match || services[0];
  }, [services, selectedServiceId]);

  const isStreetNamingService = useMemo(() => {
    const code = (selectedService?.code || selectedService?.id || "").toLowerCase();
    return (
      code === "street_naming" ||
      String(selectedService?.name || "").toLowerCase().includes("street naming")
    );
  }, [selectedService]);

  const isCommunityDevLevyService = useMemo(() => {
    const code = (selectedService?.code || selectedService?.id || "").toLowerCase();
    return (
      code === "tenement_rate" ||
      code === "community_development_levy" ||
      String(selectedService?.name || "")
        .toLowerCase()
        .includes("community development levy")
    );
  }, [selectedService]);

  // Calculate statutory fee centrally from DB feeConfig / pricingTiers
  const statutoryFee = useMemo(() => {
    if (!selectedService) return 0;

    if (isStreetNamingService) {
      const tiers = selectedService.feeConfig?.pricingTiers;
      if (Array.isArray(tiers) && tiers.length > 0) {
        const matched = tiers.find(
          (t: any) =>
            t.isActive !== false &&
            (t.subCategory?.toLowerCase() === streetOption.toLowerCase() ||
              t.category?.toLowerCase() === streetOption.toLowerCase()) &&
            t.classification?.toLowerCase() === streetRoadType.toLowerCase(),
        );
        if (matched && Number(matched.fee) > 0) {
          return Number(matched.fee);
        }
      }
      const row =
        DEFAULT_STREET_NAMING_RATES[streetRoadType] ||
        DEFAULT_STREET_NAMING_RATES["Street"];
      if (streetOption.toLowerCase().includes("objection")) return row.objection;
      if (streetOption.toLowerCase().includes("renewal")) return row.renewal;
      return row.naming;
    }

    if (isCommunityDevLevyService) {
      const classList = PROPERTY_TYPES_BY_CLASSIFICATION[cdlClassification] || PROPERTY_TYPES_BY_CLASSIFICATION.residential;
      const matched = classList.find((p) => p.id === cdlPropertyType);
      if (matched && Number(matched.fee) > 0) {
        return Number(matched.fee);
      }
      return classList[0]?.fee || 15000;
    }

    if (
      selectedService.feeConfig?.amount !== undefined &&
      selectedService.feeConfig?.amount !== null
    ) {
      return Number(selectedService.feeConfig.amount);
    }
    const configured = getConfiguredFeeForService(
      selectedService.code || selectedService.id,
    );
    if (configured) return configured;
    return Number(selectedService.defaultFee ?? selectedService.amount ?? 0);
  }, [
    selectedService,
    isStreetNamingService,
    streetOption,
    streetRoadType,
    isCommunityDevLevyService,
    cdlClassification,
    cdlPropertyType,
  ]);

  // Calculate required documents
  const requiredDocuments: string[] = useMemo(() => {
    if (!selectedService) return [];
    const code = (selectedService.code || selectedService.id || "").toLowerCase();
    if (
      code === "state_of_origin" ||
      code === "certificate_of_origin" ||
      String(selectedService.name || "")
        .toLowerCase()
        .includes("certificate of origin")
    ) {
      return [
        "Recommendation letter from the Baale of the applicant's community, OR Recommendation letter from the Councillor representing the applicant's ward",
        "National Identity Number (NIN) Slip",
        "Passport Photograph (clear background)",
        "Proof of Residency or Family Lineage Identification",
      ];
    }
    if (
      Array.isArray(selectedService.requiredDocuments) &&
      selectedService.requiredDocuments.length > 0
    ) {
      return selectedService.requiredDocuments;
    }
    if (
      Array.isArray(selectedService.requirements) &&
      selectedService.requirements.length > 0
    ) {
      return selectedService.requirements;
    }
    return [
      "National Identity Number (NIN) Slip",
      "Passport Photograph (red background)",
      "Proof of Residency or Family Identification",
    ];
  }, [selectedService]);

  // When user changes service in dropdown
  const handleServiceChange = (newServiceId: string) => {
    setSelectedServiceId(newServiceId);
    try {
      const params = new URLSearchParams(
        searchParams ? searchParams.toString() : "",
      );
      params.set("serviceId", newServiceId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } catch (e) {
      console.error("Failed to update URL search parameters", e);
    }
  };

  const emailSuggestion = useMemo(() => suggestEmailDomain(email), [email]);

  const validateDetails = (): { error: string; phone: string } => {
    if (!selectedService?.id) {
      return {
        error: "Please select a valid statutory service to continue.",
        phone: "",
      };
    }
    if (!fullName.trim()) {
      return { error: "Please enter your full applicant name", phone: "" };
    }
    if (!isValidEmailShape(email)) {
      return { error: "Please enter a valid email address", phone: "" };
    }

    const phoneValidation = formatAndValidateNigerianPhoneNumber(phone);
    if (!phoneValidation.isValid) {
      return {
        error:
          phoneValidation.error ||
          "Please enter a valid Nigerian phone number",
        phone: "",
      };
    }
    if (!termsAccepted) {
      return {
        error:
          `Please accept the official ${LGA_CONFIG.identity.name} Local Government Service & Payment Terms and Conditions before proceeding.`,
        phone: "",
      };
    }
    return { error: "", phone: phoneValidation.formattedNumber };
  };

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const { error } = validateDetails();
    if (error) {
      setFormError(error);
      toast.error(error);
      return;
    }
    setIsReviewOpen(true);
  };

  /** Creates the checkout session and hands off to the gateway. */
  const startCheckout = async () => {
    setFormError("");

    const { error, phone: formattedPhone } = validateDetails();
    if (error) {
      setFormError(error);
      toast.error(error);
      setIsReviewOpen(false);
      return;
    }

    const serviceId = selectedService?.id || selectedServiceId;

    setIsProcessing(true);

    const configuredProvider = getActivePaymentProvider();

    try {
      const response = await invoicesService.initializePublicPaymentFor(
        {
          serviceId,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: formattedPhone,
          ...(isStreetNamingService || isCommunityDevLevyService ? { amount: statutoryFee } : {}),
        } as any,
        configuredProvider,
      );

      const provider: PaymentProvider = isGpayInitResponse(response)
        ? "gpay"
        : configuredProvider;

      const paymentUrl = response?.paymentUrl;
      const reference = response?.reference;

      if (!paymentUrl) {
        throw new Error(
          response?.message ||
            "Payment gateway URL was not returned. Please check service status and try again.",
        );
      }

      if (reference) {
        stashPendingPayment(reference, provider);
        sessionStorage.setItem("publicPaymentServiceId", serviceId);
      }

      toast.success(
        `Redirecting to ${PAYMENT_PROVIDER_LABELS[provider]} secure checkout...`,
      );

      window.location.href = getCheckoutUrl(response, provider);
    } catch (err: any) {
      console.error("Public payment initialization failed:", err);
      const fieldErrors =
        err?.backendCode === "VALIDATION_ERROR" && err?.backendDetails
          ? Object.entries(err.backendDetails as Record<string, any>)
              .map(([field, detail]) =>
                Array.isArray(detail?._errors) && detail._errors[0]
                  ? `${field}: ${detail._errors[0]}`
                  : null,
              )
              .filter(Boolean)
              .join(" - ")
          : "";
      const errorMessage =
        fieldErrors ||
        err?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Payment initialization failed. Please verify service availability and try again.";
      setFormError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const processingTimeLabel =
    selectedService?.processingTime ||
    (selectedService?.estimatedDays
      ? `${selectedService.estimatedDays} Business Days`
      : "1 - 3 Business Days");

  return (
    <div
      id="public-service-apply-container"
      className={`space-y-8 ${className}`}
    >
      {/* 6-Step Application Process Banner Posted Before Payment */}
      {showStepGuide && (
        <ServiceApplicationGuideSteps
          title="Official 6-Step Application & Payment Process"
          subtitle="Follow these mandatory steps to pay, auto-create your citizen portal account, and complete your application form."
        />
      )}

      {/* Main Interactive Form / Payment Box */}
      <Card
        id="service-payment-card"
        className="p-6 md:p-8 bg-card border-border/80 shadow-elegant"
      >
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/40 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold"
                >
                  <Sparkles className="h-3 w-3 mr-1" /> First-Timer Fast
                  Application
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Instant Account Auto-Provisioning
                </Badge>
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Select Service &amp; Review Your Payment
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Review your details, then pay your statutory fee via Dedicated
                Bank Transfer or Card to instantly generate your portal login
                credentials and proceed to the dashboard.
              </p>
            </div>

            <div className="bg-muted/40 p-3.5 rounded-xl border border-border/60 text-right shrink-0">
              <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Statutory Payable Amount
              </div>
              <div className="text-2xl font-bold text-foreground mt-0.5">
                {"\u20a6"}
                {statutoryFee.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3" /> Official Government Treasury Fee
              </div>
            </div>
          </div>

          {formError && (
            <div className="mb-6 p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleOpenReview} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column: Service & Fee Details */}
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="service-select"
                    className="text-xs font-semibold text-foreground uppercase tracking-wider"
                  >
                    1. Select Statutory Service{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="service-select"
                    value={selectedService?.id ?? selectedServiceId}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border/80 bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                  >
                    {services.map((s: any) => {
                      const code = (s.code || s.id || "").toLowerCase();
                      const isCdl =
                        code === "tenement_rate" ||
                        code === "community_development_levy";
                      const isSn = code === "street_naming";
                      const fee = Number(
                        s.feeConfig?.amount ??
                          getConfiguredFeeForService(s.code || s.id) ??
                          s.defaultFee ??
                          0,
                      );
                      const priceLabel = isCdl
                        ? `From \u20a65,000 (By Property Type)`
                        : isSn
                          ? `From \u20a6150,000`
                          : fee > 0
                            ? `\u20a6${fee.toLocaleString()}`
                            : "Variable";
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.categoryLabel || s.category || "Statutory"}) -{" "}
                          {priceLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Street Naming, Renewal & Objection Selectors */}
                {isStreetNamingService && (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" /> Street Naming &amp; Road Corridor Selection
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        Official {LGA_CONFIG.identity.name} LGA Schedule
                      </Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] font-semibold">
                          Service Option
                        </Label>
                        <select
                          value={streetOption}
                          onChange={(e) => setStreetOption(e.target.value)}
                          className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-medium"
                        >
                          {STREET_SERVICE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-[11px] font-semibold">
                          Road / Corridor Classification
                        </Label>
                        <select
                          value={streetRoadType}
                          onChange={(e) => setStreetRoadType(e.target.value)}
                          className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-medium"
                        >
                          {STREET_ROAD_TYPES.map((rt) => (
                            <option key={rt} value={rt}>
                              {rt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Selected:{" "}
                      <strong className="text-foreground">
                        {streetOption} ({streetRoadType})
                      </strong>{" "}
                      — Official Fee:{" "}
                      <strong className="text-primary font-bold">
                        {"\u20a6"}
                        {statutoryFee.toLocaleString()}
                      </strong>
                    </p>
                  </div>
                )}

                {/* Community Development Levy Property Classification & Type Selectors */}
                {isCommunityDevLevyService && (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Home className="h-3.5 w-3.5" /> Property Classification &amp; Tariff Selection
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        Official {LGA_CONFIG.identity.name} LGA Schedule
                      </Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] font-semibold">
                          Property Classification
                        </Label>
                        <select
                          value={cdlClassification}
                          onChange={(e) => {
                            const newClass = e.target.value;
                            setCdlClassification(newClass);
                            const list = PROPERTY_TYPES_BY_CLASSIFICATION[newClass] || [];
                            if (list.length > 0) {
                              setCdlPropertyType(list[0].id);
                            }
                          }}
                          className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-medium"
                        >
                          {LEVY_CLASSIFICATIONS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-[11px] font-semibold">
                          Property Type
                        </Label>
                        <select
                          value={cdlPropertyType}
                          onChange={(e) => setCdlPropertyType(e.target.value)}
                          className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-medium"
                        >
                          {(PROPERTY_TYPES_BY_CLASSIFICATION[cdlClassification] || []).map((pt) => (
                            <option key={pt.id} value={pt.id}>
                              {pt.name} — ₦{pt.fee.toLocaleString()} ({pt.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {(() => {
                      const curClass = LEVY_CLASSIFICATIONS.find((c) => c.id === cdlClassification)?.label;
                      const curType = (PROPERTY_TYPES_BY_CLASSIFICATION[cdlClassification] || []).find((pt) => pt.id === cdlPropertyType);
                      return (
                        <p className="text-[11px] text-muted-foreground">
                          Selected:{" "}
                          <strong className="text-foreground">
                            {curClass} — {curType?.name}
                          </strong>{" "}
                          ({curType?.unit}) — Statutory Fee:{" "}
                          <strong className="text-primary font-bold">
                            ₦{statutoryFee.toLocaleString()}
                          </strong>
                        </p>
                      );
                    })()}
                  </div>
                )}

                {/* Service info card */}
                {selectedService && (
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">
                        Selected Service:
                      </span>
                      <span className="font-semibold text-foreground">
                        {selectedService.name}
                      </span>
                    </div>
                    {selectedService.description && (
                      <div className="pt-1 text-muted-foreground text-[11px] leading-relaxed border-t border-border/30">
                        {selectedService.description}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-border/30">
                      <span className="text-muted-foreground font-medium">
                        Revenue Head:
                      </span>
                      <span className="font-mono text-[11px] text-foreground">
                        {selectedService.revenueHead ||
                          "1001 - General Revenue"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">
                        Processing Time SLA:
                      </span>
                      <span className="font-medium text-foreground">
                        {processingTimeLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-muted-foreground font-medium">
                        Total Statutory Fee:
                      </span>
                      <span className="font-bold text-sm text-primary">
                        {"\u20a6"}{statutoryFee.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Required Docs note */}
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground">
                  <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <FileCheck2 className="h-3.5 w-3.5 text-primary" /> Step 4
                    Note (Documents to Prepare):
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {requiredDocuments.map((d, i) => (
                      <li key={i} className="leading-snug">
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Applicant Details Form */}
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="applicant-name"
                    className="text-xs font-semibold text-foreground uppercase tracking-wider"
                  >
                    Applicant Full Name{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="applicant-name"
                      placeholder="e.g. Oladimeji Babatunde Adeyemi"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 text-sm h-11 bg-background"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Enter full name exactly as it appears on your official
                    identification document.
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="applicant-email"
                    className="text-xs font-semibold text-foreground uppercase tracking-wider"
                  >
                    Valid Email Address{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="applicant-email"
                      type="email"
                      placeholder="e.g. applicant@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 text-sm h-11 bg-background"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    Step 3: Login credentials will be automatically generated
                    and sent to this email.
                  </p>

                  {emailSuggestion && (
                    <button
                      type="button"
                      onClick={() => setEmail(emailSuggestion)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
                    >
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      Did you mean{" "}
                      <span className="underline">{emailSuggestion}</span>?
                    </button>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="applicant-phone"
                    className="text-xs font-semibold text-foreground uppercase tracking-wider"
                  >
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="applicant-phone"
                      type="tel"
                      placeholder="e.g. 0803 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 text-sm h-11 bg-background"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Used for SMS notifications on application progress and LGA
                    approvals.
                  </p>
                </div>

                {/* Mandatory Terms & Conditions Acceptance before Payment (Requirement 8) */}
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">
                        Mandatory Terms &amp; Conditions Acceptance:
                      </strong>{" "}
                      I confirm that the applicant information provided is
                      accurate and I accept the{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="text-primary underline font-medium"
                      >
                        {LGA_CONFIG.identity.name} Local Government Statutory Service &amp; Payment Terms
                        and Conditions
                      </Link>{" "}
                      (Version v1.0-2026-{LGA_CONFIG.identity.id.toUpperCase()}-LGA).
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Notice & CTA Button */}
            <div className="pt-4 border-t border-border/40 flex flex-col md:flex-row items-center justify-end gap-4">
              <Button
                id="pay-statutory-fee-button"
                type="button"
                onClick={handleOpenReview}
                disabled={isProcessing}
                size="lg"
                className="w-full md:w-auto min-w-[240px] bg-gradient-hero text-primary-foreground font-semibold shadow-elegant h-12"
              >
                <FileCheck2 className="mr-2 h-4 w-4" />
                Review Payment Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </Card>

      <PaymentReviewDialog
        open={isReviewOpen}
        onOpenChange={setIsReviewOpen}
        details={{
          serviceId: selectedService?.id || selectedServiceId,
          serviceName: selectedService?.name || "Statutory Service",
          serviceCategory:
            selectedService?.categoryLabel ||
            selectedService?.category ||
            "Statutory",
          feeAmount: statutoryFee,
          processingTime: processingTimeLabel,
          fullName: fullName.trim(),
          email: email.trim(),
          phone,
          ...(isStreetNamingService
            ? {
                selectedOption: streetOption,
                selectedClassification: streetRoadType,
              }
            : isCommunityDevLevyService
            ? {
                selectedOption:
                  LEVY_CLASSIFICATIONS.find((c) => c.id === cdlClassification)
                    ?.label || "Residential Property",
                selectedClassification:
                  (
                    PROPERTY_TYPES_BY_CLASSIFICATION[cdlClassification] || []
                  ).find((pt) => pt.id === cdlPropertyType)?.name ||
                  "Standard Property",
              }
            : {}),
        }}
        onConfirm={startCheckout}
        isSubmitting={isProcessing}
      />
    </div>
  );
}

export function PublicServiceApplyWidget(props: PublicServiceApplyWidgetProps) {
  return (
    <Suspense
      fallback={
        <Card className="p-8 bg-card border-border/80 shadow-elegant text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
          <p className="text-xs text-muted-foreground">
            Loading service application form...
          </p>
        </Card>
      }
    >
      <PublicServiceApplyWidgetInner {...props} />
    </Suspense>
  );
}
