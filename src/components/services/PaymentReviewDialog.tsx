"use client";

import { LGA_CONFIG } from "@/config/lga.config";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ShieldCheck,
  CreditCard,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  Sparkles,
  Lock,
  Landmark,
  Copy,
  CheckCircle2,
  Clock,
  Upload,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  invoicesService,
  type PublicStaticTransferResponse,
} from "@/services/apiInvoice";

export interface PaymentReviewDetails {
  serviceId?: string;
  serviceName: string;
  serviceCategory?: string;
  feeAmount: number;
  processingTime?: string;
  fullName: string;
  email: string;
  phone: string;
  selectedOption?: string;
  selectedClassification?: string;
}

interface StaticVirtualAccountInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
  expectedAmount: number;
}

export interface PaymentReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details?: PaymentReviewDetails;
  onConfirm?: () => void;
  isSubmitting?: boolean;
  gatewayLabel?: string;
  // Backward-compatible flat props
  serviceId?: string;
  serviceName?: string;
  serviceCategory?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  fee?: number;
  feeAmount?: number;
  processingTime?: string;
  provider?: string;
  isProcessing?: boolean;
  onCheckout?: () => void;
  onEditDetails?: () => void;
}

export function PaymentReviewDialog({
  open,
  onOpenChange,
  details,
  onConfirm,
  isSubmitting = false,
  gatewayLabel = "Debit Card / Online Payment Gateway",
  serviceId,
  serviceName,
  serviceCategory,
  fullName,
  email,
  phone,
  fee,
  feeAmount,
  processingTime,
  isProcessing = false,
  onCheckout,
}: PaymentReviewDialogProps) {
  const resolvedDetails: PaymentReviewDetails = details ?? {
    serviceId,
    serviceName: serviceName || "Statutory Service",
    serviceCategory: serviceCategory || "Statutory",
    feeAmount: Number(fee ?? feeAmount ?? 0),
    processingTime,
    fullName: fullName || "",
    email: email || "",
    phone: phone || "",
  };

  const handleConfirmCheckout = onConfirm || onCheckout || (() => {});
  const effectiveIsSubmitting = isSubmitting || isProcessing;

  const formattedFee = `\u20a6${Number(resolvedDetails.feeAmount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const [paymentChannel, setPaymentChannel] = useState<"card" | "static">("card");
  const [staticAccount, setStaticAccount] = useState<StaticVirtualAccountInfo | null>(null);
  const [loadingStatic, setLoadingStatic] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmittingStatic, setIsSubmittingStatic] = useState(false);
  const [staticSubmission, setStaticSubmission] =
    useState<PublicStaticTransferResponse | null>(null);

  useEffect(() => {
    if (open && resolvedDetails.serviceId) {
      setLoadingStatic(true);
      api
        .get<StaticVirtualAccountInfo>(
          `/payments/gpay/virtual-account?serviceId=${encodeURIComponent(resolvedDetails.serviceId)}`,
          { headers: { "skip-auth": "true" } },
        )
        .then((res) => {
          setStaticAccount({
            ...res,
            expectedAmount: resolvedDetails.feeAmount || res.expectedAmount,
          });
        })
        .catch(() => {
          setStaticAccount({
            bankName: "Providus Bank Plc",
            accountNumber: "",
            accountName: "",
            reference: `${LGA_CONFIG.identity.id.toUpperCase()}-${Date.now()}`,
            expectedAmount: resolvedDetails.feeAmount,
          });
        })
        .finally(() => setLoadingStatic(false));
    } else if (!open) {
      setStaticSubmission(null);
      setProofFile(null);
    }
  }, [open, resolvedDetails.serviceId, resolvedDetails.feeAmount]);

  const copyValue = (val: string, label: string) => {
    navigator.clipboard?.writeText(val);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSubmitStaticTransfer = async () => {
    if (!resolvedDetails.serviceId) {
      toast.error("Service information is missing. Please reload the page.");
      return;
    }
    setIsSubmittingStatic(true);
    try {
      const response = await invoicesService.submitPublicStaticTransfer({
        serviceId: resolvedDetails.serviceId,
        fullName: resolvedDetails.fullName,
        email: resolvedDetails.email,
        phone: resolvedDetails.phone,
        reference: staticAccount?.reference,
        amount: resolvedDetails.feeAmount,
        proof: proofFile,
      } as any);
      setStaticSubmission(response);
      if (response.status === "confirmed") {
        toast.success("Payment verified and confirmed! Official Receipt issued.");
      } else {
        toast.success(
          "Payment Verification in Progress — your application and transfer details have been recorded.",
        );
      }
    } catch (err: any) {
      toast.error(
        err?.message ||
          "Could not submit your transfer notification. Please check your connection and try again.",
      );
    } finally {
      setIsSubmittingStatic(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-emerald-900/15 shadow-2xl rounded-2xl max-h-[92vh] overflow-y-auto">
        {/* Top Official Banner */}
        <div className="bg-gradient-to-br from-[#0B2545] via-[#0F3D3E] to-[#14532D] px-6 py-5 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3 mb-2">
            <Badge className="bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-amber-400/20 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5">
              <Sparkles className="h-3 w-3 mr-1 inline" /> Official LGA Revenue Checkout
            </Badge>
            <span className="text-xs text-emerald-200/80 font-mono">
              {LGA_CONFIG.identity.name.toUpperCase()} LGA • LOGMAS
            </span>
          </div>
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-xl font-bold text-white tracking-tight">
              Confirm Application &amp; Select Payment Channel
            </DialogTitle>
            <DialogDescription className="text-emerald-100/80 text-xs">
              Pay securely online using your debit card or via dedicated council bank transfer.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-white">
          {/* Amount & Service Card */}
          <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-amber-50/40 p-4 flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{resolvedDetails.serviceName}</span>
              </div>
              {resolvedDetails.selectedOption || resolvedDetails.selectedClassification ? (
                <p className="text-[11px] font-semibold text-emerald-900">
                  {resolvedDetails.selectedOption}
                  {resolvedDetails.selectedClassification
                    ? ` • ${resolvedDetails.selectedClassification}`
                    : ""}
                </p>
              ) : null}
              <p className="text-[11px] text-slate-500">
                {resolvedDetails.processingTime
                  ? `Estimated processing: ${resolvedDetails.processingTime}`
                  : "Official statutory fee"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 block">
                Total Payable
              </span>
              <span className="text-2xl font-extrabold text-[#0B2545] tracking-tight">
                {formattedFee}
              </span>
            </div>
          </div>

          {/* Applicant Summary */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Applicant Details
            </h4>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 divide-y divide-slate-200/60 text-xs">
              <div className="flex items-center justify-between px-3.5 py-2">
                <span className="text-slate-500 flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Full Name
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {resolvedDetails.fullName}
                </span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
                </span>
                <span className="font-medium text-slate-800 text-right break-all">
                  {resolvedDetails.email}
                </span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2">
                <span className="text-slate-500 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone Number
                </span>
                <span className="font-medium text-slate-800 text-right">
                  {resolvedDetails.phone}
                </span>
              </div>
            </div>
          </div>

          {/* 2-Channel Citizen Payment Architecture */}
          <Tabs
            value={paymentChannel}
            onValueChange={(v) => setPaymentChannel(v as "card" | "static")}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full h-11 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger
                value="card"
                className="text-xs font-semibold rounded-lg data-[state=active]:bg-[#0B2545] data-[state=active]:text-white"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Pay Online (Debit Card)
              </TabsTrigger>
              <TabsTrigger
                value="static"
                className="text-xs font-semibold rounded-lg data-[state=active]:bg-[#0B2545] data-[state=active]:text-white"
              >
                <Landmark className="h-3.5 w-3.5 mr-1.5" /> Dedicated Bank Transfer
              </TabsTrigger>
            </TabsList>

            {/* CHANNEL 1: Online Card Checkout (Primary Instant Option) */}
            <TabsContent value="card" className="mt-3 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-emerald-700" />
                    Instant Card / Online Checkout
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Visa • Mastercard • Verve
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pay securely online using your Debit Card (Visa, Mastercard, or Verve)
                  via our official government payment gateway. When you complete checkout, the system automatically verifies your payment and issues your
                  Official Receipt and portal login credentials immediately.
                </p>
                <Button
                  type="button"
                  onClick={handleConfirmCheckout}
                  disabled={effectiveIsSubmitting}
                  className="w-full h-11 bg-gradient-to-r from-[#0B2545] to-[#14532D] hover:from-[#0F3D3E] hover:to-[#0B2545] text-white font-semibold shadow-md"
                >
                  {effectiveIsSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting to secure checkout...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay {formattedFee} Online by Card
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* CHANNEL 2: Dedicated Static Virtual Account (Direct Bank Transfer) */}
            <TabsContent value="static" className="mt-3 space-y-3">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 text-emerald-700" />
                    Dedicated Service Virtual Account
                  </span>
                  <Badge className="bg-emerald-700 text-white hover:bg-emerald-700 text-[10px]">
                    Dedicated Providus Bank Account
                  </Badge>
                </div>

                {loadingStatic ? (
                  <div className="flex items-center justify-center py-6 text-xs text-slate-500 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                    Loading Dedicated Providus Bank Virtual Account...
                  </div>
                ) : staticAccount ? (
                  <>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Transfer{" "}
                      <strong className="text-slate-900">{formattedFee}</strong> to
                      the dedicated {LGA_CONFIG.identity.name} LGA Providus Bank account below via Mobile App,
                      USSD, POS Agent, or Bank Branch.
                    </p>

                    <div className="rounded-lg bg-white border border-emerald-200 p-3.5 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                            Dedicated Account Number
                          </span>
                          <span className="text-xl font-mono font-extrabold text-[#0B2545] tracking-wider">
                            {staticAccount.accountNumber}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() =>
                            copyValue(staticAccount.accountNumber, "Account number")
                          }
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                            Bank Name
                          </span>
                          <span className="font-semibold text-slate-800">
                            {staticAccount.bankName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                            Account Name
                          </span>
                          <span className="font-semibold text-slate-800 break-words">
                            {staticAccount.accountName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                            Transfer Narration / Reference
                          </span>
                          <span className="font-mono font-semibold text-emerald-800">
                            {staticSubmission?.reference || staticAccount.reference}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-emerald-700"
                          onClick={() =>
                            copyValue(
                              staticSubmission?.reference || staticAccount.reference,
                              "Reference",
                            )
                          }
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy Ref
                        </Button>
                      </div>
                    </div>

                    {staticSubmission ? (
                      staticSubmission.status === "confirmed" ? (
                        <div className="rounded-lg bg-emerald-100/90 border border-emerald-400 p-4 space-y-2.5 text-xs text-emerald-950">
                          <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
                            Payment Verified &amp; Official Receipt Issued!
                          </div>
                          <p className="text-emerald-900/90 leading-relaxed">
                            Your bank transfer of <strong>{formattedFee}</strong> was
                            matched automatically via the Providus Bank webhook.
                          </p>
                          <div className="rounded-md bg-white/90 border border-emerald-300 p-2.5 grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-500 block">Application No.</span>
                              <span className="font-mono font-bold text-slate-900">
                                {staticSubmission.applicationNumber}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Invoice No.</span>
                              <span className="font-mono font-bold text-slate-900">
                                {staticSubmission.invoiceNumber}
                              </span>
                            </div>
                            {staticSubmission.receiptNumber && (
                              <div className="col-span-2">
                                <span className="text-slate-500 block">Official Receipt No.</span>
                                <span className="font-mono font-bold text-emerald-800">
                                  {staticSubmission.receiptNumber}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Button
                              asChild
                              className="w-full bg-[#14532D] hover:bg-[#0F3D3E] text-white text-xs"
                            >
                              <Link href="/login">
                                Continue to Citizen Portal <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-amber-50 border border-amber-300 p-4 space-y-3 text-xs text-amber-950">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                              <Clock className="h-4 w-4 text-amber-700 shrink-0" />
                              Payment Claim Logged • Pending Verification
                            </div>
                            <Badge className="bg-amber-500/20 text-amber-900 border border-amber-500/40 text-[10px] font-semibold">
                              Pending Verification
                            </Badge>
                          </div>
                          <p className="text-amber-900/90 leading-relaxed">
                            Your payment claim of <strong>{formattedFee}</strong> for <strong>{resolvedDetails.serviceName}</strong> has been logged. Our Treasury team will verify the payment against Providus Bank settlement records.
                          </p>
                          <div className="rounded-md bg-white border border-amber-200 p-2.5 grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-500 block">Application No.</span>
                              <span className="font-mono font-bold text-slate-900">
                                {staticSubmission.applicationNumber}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Invoice No.</span>
                              <span className="font-mono font-bold text-slate-900">
                                {staticSubmission.invoiceNumber}
                              </span>
                            </div>
                            <div className="col-span-2 pt-1 border-t border-slate-100">
                              <span className="text-slate-500 block">Payment Status</span>
                              <span className="font-bold text-amber-700 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Awaiting Bank / Treasury Verification (No receipt issued yet)
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded border border-amber-100">
                            <strong>Next Step:</strong> You do not need to wait for payment verification to complete your form! Log in below with your temporary password (sent to your email/SMS) to fill your form and upload documents now.
                          </p>
                          <div className="flex flex-col gap-2 pt-1">
                            <Button
                              asChild
                              size="sm"
                              className="w-full bg-[#14532D] hover:bg-[#0F3D3E] text-white text-xs font-semibold h-9"
                            >
                              <Link href={`/login?redirect=${encodeURIComponent(`/dashboard/applications/${staticSubmission.applicationId}/complete`)}`}>
                                Log In &amp; Fill Application Form <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleSubmitStaticTransfer}
                              disabled={isSubmittingStatic}
                              className="w-full text-xs border-amber-400 text-amber-900 hover:bg-amber-100/50"
                            >
                              {isSubmittingStatic ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  Checking Bank Webhook...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                  Check Bank Settlement Status
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="space-y-3 pt-1">
                        <div>
                          <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                            <Upload className="h-3.5 w-3.5 text-emerald-700" />
                            Optional: Upload Transfer Receipt / POS Slip (PNG, JPG, PDF)
                          </Label>
                          <Input
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                            className="h-9 text-xs bg-white"
                          />
                        </div>

                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-950 dark:text-amber-100">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Important Verification Notice
                          </div>
                          <p className="leading-relaxed">
                            Transfer the exact amount of <strong>{formattedFee}</strong> to the Providus Bank account above. Clicking <strong>&quot;I Have Paid&quot;</strong> registers your payment claim for Treasury verification — it does not automatically confirm payment. Official receipts are issued only after payment is verified by the bank or Treasury. You can log into your portal to fill your application form immediately while verification is underway.
                          </p>
                        </div>

                        <Button
                          type="button"
                          onClick={handleSubmitStaticTransfer}
                          disabled={isSubmittingStatic}
                          className="w-full h-11 bg-gradient-to-r from-[#14532D] to-[#0F3D3E] hover:from-[#0F3D3E] hover:to-[#0B2545] text-white font-semibold shadow-md"
                        >
                          {isSubmittingStatic ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Recording Transfer &amp; Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />I Have Paid —
                              Submit for Verification
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>

          {/* Official Government Receipts Assurance */}
          <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/80 p-3 flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">
                Official Government Receipts:{" "}
              </span>
              All payments are verified and recorded directly into the Ifo Local Government Treasury ledger. An official digital receipt is issued for every confirmed transaction.
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-600" /> 256-bit SSL Encrypted • {LGA_CONFIG.identity.name}
              LGA Treasury
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={effectiveIsSubmitting || isSubmittingStatic}
              className="text-xs text-slate-500"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
