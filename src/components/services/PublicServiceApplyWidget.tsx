"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useServices } from "@/hooks/queries/useServices";
import {
  ServiceType,
  getConfiguredFeeForService,
} from "@/config/lgaServices";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ServiceApplicationGuideSteps } from "./ServiceApplicationGuideSteps";
import { invoicesService, type DynamicVirtualAccount, type ServiceVirtualAccount } from "@/services/apiInvoice";
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


export interface PublicServiceApplyWidgetProps {
  initialServiceId?: string;
  className?: string;
  showStepGuide?: boolean;
}

function PublicServiceApplyWidgetInner({
  initialServiceId = "certificate_of_origin",
  className = "",
  showStepGuide = true,
}: PublicServiceApplyWidgetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlServiceId = searchParams ? searchParams.get("serviceId") : null;

  const { services: servicesData, isLoading } = useServices();

  const services = useMemo(() => {
    const list = Array.isArray(servicesData)
      ? servicesData
      : (servicesData as any)?.data || [];
    if (list && list.length > 0) {
      return list;
    }
    return [];
  }, [servicesData]);

  // Initial state derived from URL or initialServiceId
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    urlServiceId || initialServiceId || "certificate_of_origin",
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState<
    import("@/components/services/PaymentReviewDialog").VirtualAccountDetails | null
  >(null);
  const [virtualAccountError, setVirtualAccountError] = useState("");
  const [formError, setFormError] = useState("");
  // Applicant details are reviewed in a dialog before any checkout session is
  // created, so nothing is charged until they confirm there.
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // ── Dynamic (15-min, auto-confirm) transfer account ──────────────────────
  const [dynamicAccount, setDynamicAccount] =
    useState<DynamicVirtualAccount | null>(null);
  const [dynamicAccountError, setDynamicAccountError] = useState("");
  const [isCreatingDynamic, setIsCreatingDynamic] = useState(false);
  const [isCheckingDynamic, setIsCheckingDynamic] = useState(false);

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
        s.slug?.toLowerCase() === selectedServiceId?.toLowerCase(),
    );
    return match || services[0];
  }, [services, selectedServiceId]);

  // Calculate statutory fee
  const statutoryFee = useMemo(() => {
    if (!selectedService) return 0;
    if (
      selectedService.feeConfig?.amount !== undefined &&
      selectedService.feeConfig?.amount !== null
    ) {
      return Number(selectedService.feeConfig.amount);
    }
    const configured = getConfiguredFeeForService(selectedService.id);
    if (configured) return configured;
    return Number(selectedService.defaultFee ?? selectedService.amount ?? 0);
  }, [selectedService]);

  // Bank-transfer account for the review dialog. Fetched ONCE per dialog-open
  // (route A is rate-limited, and the backend re-quotes the same reference
  // within a 60-min reuse window). serviceId MUST be the service UUID from
  // useServices() — a code string (e.g. "certificate_of_origin") returns
  // NOT_FOUND. Any 404/400 lands on the online-only fallback, never a crash.
  useEffect(() => {
    if (!isReviewOpen || !selectedService?.id) return;
    const serviceId = selectedService.id;
    let cancelled = false;
    setVirtualAccountError("");

    const applyVa = (va: ServiceVirtualAccount) => {
      if (cancelled) return;
      setVirtualAccount({
        accountNumber: va.accountNumber,
        bankName: va.bankName,
        accountName: va.accountName,
        reference: va.reference,
        amount: va.expectedAmount,
        expectedAmount: va.expectedAmount,
        invoiceNumber: null,
      });
    };

    const cached = reservedVaCache.get(serviceId);
    if (cached) {
      // Served from cache — no network call, no rate-limit hit.
      applyVa(cached);
    } else {
      invoicesService
        .getVirtualAccountForService(serviceId)
        .then((va) => {
          reservedVaCache.set(serviceId, va);
          applyVa(va);
        })
        .catch((err: any) => {
          if (cancelled) return;
          setVirtualAccount(null);
          setVirtualAccountError(err?.message || "Bank transfer unavailable");
        });
    }
    return () => {
      cancelled = true;
    };
  }, [isReviewOpen, selectedService?.id]);

  // Calculate required documents
  const requiredDocuments: string[] = useMemo(() => {
    if (!selectedService) return [];
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

  /**
   * Non-blocking nudge for a mistyped domain (`gnail.com`). The applicant's
   * credentials are emailed to whatever address they type, and a typo is still a
   * syntactically valid address, so the backend cannot catch it.
   */
  const emailSuggestion = useMemo(() => suggestEmailDomain(email), [email]);

  /**
   * Client-side gate for the review step, mirroring the backend zod rules so an
   * obviously bad payload never reaches the gateway. Returns an error message,
   * or "" alongside the normalised phone number.
   */
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
    return { error: "", phone: phoneValidation.formattedNumber };
  };

  /**
   * "Review ..." only opens the dialog. No checkout session is created until the
   * applicant confirms their details and picks a payment method there.
   */
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

    // Gateway for this payment. GPay by default; override with
    // NEXT_PUBLIC_PAYMENT_PROVIDER=paystack.
    const configuredProvider = getActivePaymentProvider();

    try {
      const response = await invoicesService.initializePublicPaymentFor(
        {
          serviceId,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: formattedPhone,
        },
        configuredProvider,
      );

      // `gateway: "gpay"` is only ever returned by the GPay controller, so the
      // response is authoritative over the configured default.
      const provider: PaymentProvider = isGpayInitResponse(response)
        ? "gpay"
        : configuredProvider;

      // api.ts already unwraps the { status, data } envelope, so the payload is
      // read directly off the response.
      const paymentUrl = response?.paymentUrl;
      const reference = response?.reference;

      if (!paymentUrl) {
        throw new Error(
          response?.message ||
            "Payment gateway URL was not returned. Please check service status and try again.",
        );
      }

      // Preserve the returned payment reference so it can be used when the applicant returns
      if (reference) {
        // The provider is stashed alongside it: Paystack and GPay references are
        // both "PAY-...", so /payment/result cannot infer which gateway to
        // verify against.
        stashPendingPayment(reference, provider);
        sessionStorage.setItem("publicPaymentServiceId", serviceId);
      }

      toast.success(
        `Redirecting to ${PAYMENT_PROVIDER_LABELS[provider]} secure checkout...`,
      );

      // GPay: navigate to the COMPLETE MPGS checkout URL verbatim.
      // Paystack: "/payment/verify" is appended to the base URL.
      window.location.href = getCheckoutUrl(response, provider);
    } catch (err: any) {
      console.error("Public payment initialization failed:", err);
      // The backend validates the payload (zod) and returns field-level errors,
      // e.g. { email: { _errors: ["Invalid email address"] } }. Show those
      // instead of the generic "Data validation processing failed" message.
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

  // ── Dynamic transfer-account handlers ────────────────────────────────────

  // Poll the gateway for settlement of the minted dynamic account. On confirm
  // we redirect to the shared result page — settlement (invoice/receipt/portal
  // account) already happened server-side inside settleIntent.
  const pollDynamicStatus = async (reference: string): Promise<boolean> => {
    try {
      const result = await invoicesService.verifyDynamicPayment(reference);
      if (result.status === "confirmed") {
        toast.success("Payment confirmed — preparing your receipt...");
        window.location.href = `/payment/result?reference=${encodeURIComponent(
          reference,
        )}`;
        return true;
      }
      if (result.status === "failed" || result.status === "expired") {
        setDynamicAccountError(
          "This transfer account has expired. Please generate a new one.",
        );
        return false;
      }
    } catch (err: any) {
      console.error("Dynamic payment poll failed:", err);
    }
    return false;
  };

  const handleCheckDynamicStatus = async () => {
    if (!dynamicAccount) return;
    setIsCheckingDynamic(true);
    await pollDynamicStatus(dynamicAccount.reference);
    setIsCheckingDynamic(false);
  };

  const handleStartDynamicTransfer = async () => {
    setFormError("");
    setDynamicAccountError("");

    // If we already minted an account and its 15-min timer lapsed, re-check it
    // BEFORE creating a new one. Money sent into an expired account is NOT lost
    // — the gateway/webhook still settles it against this same reference — so we
    // must confirm it rather than silently abandoning the payer into a new VA.
    if (dynamicAccount) {
      setIsCheckingDynamic(true);
      const alreadyPaid = await pollDynamicStatus(dynamicAccount.reference);
      setIsCheckingDynamic(false);
      if (alreadyPaid) return; // confirmed -> already redirected to /payment/result
      toast.info(
        "No payment found on the previous account yet. Generating a fresh one — a transfer already made is still reconciled automatically.",
      );
    }

    const { error, phone: formattedPhone } = validateDetails();
    if (error) {
      setFormError(error);
      toast.error(error);
      return;
    }

    const serviceId = selectedService?.id || selectedServiceId;
    setIsCreatingDynamic(true);
    try {
      const va = await invoicesService.createDynamicPublicPayment({
        serviceId,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: formattedPhone,
      });
      setDynamicAccount(va);
      // Stash so /payment/result can verify even if the tab navigates away.
      stashPendingPayment(va.reference, "gpay");
      sessionStorage.setItem("publicPaymentServiceId", serviceId);
      toast.success("Transfer account ready — it expires in 15 minutes.");
    } catch (err: any) {
      console.error("Dynamic account creation failed:", err);
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        "Could not create a transfer account. Please try the online option.";
      setDynamicAccountError(msg);
      toast.error(msg);
    } finally {
      setIsCreatingDynamic(false);
    }
  };

  // A minted account is tied to one amount; reset it if the service changes.
  useEffect(() => {
    setDynamicAccount(null);
    setDynamicAccountError("");
  }, [selectedServiceId]);

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
                  Select Service & Review Your Payment
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Review your details, then pay your statutory fee online to
                  instantly generate your portal login credentials and proceed
                  to the dashboard.
                </p>
              </div>

              <div className="bg-muted/40 p-3.5 rounded-xl border border-border/60 text-right shrink-0">
                <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  Statutory Payable Amount
                </div>
                <div className="text-2xl font-bold text-foreground mt-0.5">
                  ₦{statutoryFee.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
                  <ShieldCheck className="h-3 w-3" /> Official Government
                  Treasury Fee
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
                      value={selectedService?.id || selectedServiceId}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-border/80 bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                    >
                      {services.map((s: any) => {
                        const fee = Number(
                          s.feeConfig?.amount ??
                            getConfiguredFeeForService(s.id) ??
                            s.defaultFee ??
                            0,
                        );
                        return (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.category || "Statutory"})  - {" "}
                            {fee > 0 ? `₦${fee.toLocaleString()}` : "Variable"}
                          </option>
                        );
                      })}
                    </select>
                  </div>

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
                          {selectedService.processingTime ||
                            (selectedService.estimatedDays
                              ? `${selectedService.estimatedDays} Business Days`
                              : "1 - 3 Business Days")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <span className="text-muted-foreground font-medium">
                          Total Statutory Fee:
                        </span>
                        <span className="font-bold text-sm text-primary">
                          ₦{statutoryFee.toLocaleString()}
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
                      {requiredDocuments.slice(0, 3).map((d, i) => (
                        <li key={i} className="truncate">
                          {d}
                        </li>
                      ))}
                      {requiredDocuments.length > 3 && (
                        <li>
                          +{requiredDocuments.length - 3} more statutory
                          document(s)
                        </li>
                      )}
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
                </div>
              </div>

              {/* Notice & CTA Button */}
              <div className="pt-4 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    Secured by 256-bit encryption. You will be redirected to our
                    secure checkout to complete payment.
                  </span>
                </div>

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
        serviceName={selectedService?.name || "Statutory Service"}
        serviceCategory={selectedService?.category || "Statutory"}
        fullName={fullName.trim()}
        email={email.trim()}
        phone={phone}
        fee={statutoryFee}
        provider={getActivePaymentProvider()}
        isProcessing={isProcessing}
        virtualAccount={virtualAccount}
        dynamicAccount={dynamicAccount}
        isCreatingDynamicAccount={isCreatingDynamic}
        dynamicAccountError={dynamicAccountError}
        isCheckingDynamicStatus={isCheckingDynamic}
        onStartDynamicTransfer={handleStartDynamicTransfer}
        onCheckDynamicStatus={handleCheckDynamicStatus}
        onCheckout={startCheckout}
        onEditDetails={() => setIsReviewOpen(false)}
        onCheckTransferStatus={() => setIsReviewOpen(false)}
      />
    </div>
  );
}

// Reserved (static) VA is stable per service and its endpoint is rate-limited
// (60 req / 15 min). Cache at module scope so reopening the review dialog or
// re-entering the payment tab never re-hits the gateway for the same service.
const reservedVaCache = new Map<string, ServiceVirtualAccount>();

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

