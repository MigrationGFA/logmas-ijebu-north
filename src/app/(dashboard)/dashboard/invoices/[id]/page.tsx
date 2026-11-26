"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from "@/components/dashboard/qr-code";
import { cardProcessingFee, cardChargeTotal } from "@/lib/paymentFees";
import {
  ArrowLeft,
  Copy,
  Send,
  CreditCard,
  Receipt as ReceiptIcon,
  Printer,
  Phone,
  Mail,
  MessageCircle,
  Wallet,
  Link2,
  CheckCircle2,
  Loader2,
  Landmark,
  Upload,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useInvoiceDetails,
  useInvoicePayment,
  useInvoiceVirtualAccount,
  useUploadInvoicePaymentProof,
  useRecordFoInvoicePayment,
  useReplaceFoPaymentProof,
  useSubmitFoCorrection,
} from "@/hooks/queries/useInvoices";
import { useBankAccount } from "@/hooks/queries/useBankAccount";

import { tokenManager } from "@/services/apiAuth";
import { invoicesService } from "@/services/apiInvoice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSkeleton } from "@/components/ui/LoadingSkeleton";
import { readPendingPayment, resolvePaymentProvider } from "@/config/paymentGateway";

export default function InvoiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: invoiceId } = React.use(params);
  const user = tokenManager.getUser();

  const userRole = user?.role;

  const isOfficer = userRole === "field_officer";
  // Online "Pay now" is an applicant action (citizens/business owners);
  // staff roles only view/confirm payments.
  const isPayer = userRole === "citizen" || userRole === "business_owner";

  // Use real API hooks
  const { invoice, isLoading, error, isPayable, paymentProgress, refetch } =
    useInvoiceDetails(invoiceId);

  const {
    recordPayment,
    isRecordingPayment,
    initializeOnlinePayment,
    isInitializingPayment,
    sendPaymentLink,
    isSendingPaymentLink,
    verifyPayment,
    isVerifyingPayment,
  } = useInvoicePayment(invoiceId, invoice?.invoiceNumber);

  // ON HOLD (Nov 24, 2026): the Bank Transfer tab on public-service
  // invoices is off for now. The tab block carries its own JSX comments,
  // so it is switched off here instead of commented out; flip this back
  // to true to restore it.
  const SHOW_BANK_TRANSFER_TAB = false;

  // Reserved (static) bank-transfer account for this invoice. The one-shot
  // dynamic minting routes are disabled server-side, so the reserved account
  // carries the bank-transfer flow: display details, citizen transfers,
  // webhook/treasurer confirmation. The lookup only runs while the
  // transfer tab is in play: resolving the account also mints the
  // placeholder transfer record, and a citizen merely viewing their
  // invoice must not create one.
  const {
    virtualAccount: invoiceVa,
    isLoading: isVaLoading,
    error: vaError,
    refetch: refetchVa,
  } = useInvoiceVirtualAccount(
    invoice?.invoiceNumber,
    isPayable && SHOW_BANK_TRANSFER_TAB,
  );

  // Citizen/staff upload of transfer evidence for THIS invoice — records the
  // proof on the pending bank_transfer Payment and parks the application for
  // the treasurer's Payment Confirmations worklist. Never confirms payment.
  const { uploadProofAsync, isUploadingProof } = useUploadInvoicePaymentProof(
    invoiceId,
    invoice?.invoiceNumber,
  );

  // FO-only service invoices: the payer transfers to the LGA collection
  // account (from the database, managed in Settings); the officer records
  // the transfer here with the payer's receipt as proof, and the treasurer
  // confirms afterwards.
  const { recordFoPayment, isRecordingFoPayment } = useRecordFoInvoicePayment(
    invoiceId,
    invoice?.invoiceNumber,
  );
  const { replaceFoProof, isReplacingFoProof } = useReplaceFoPaymentProof(
    invoiceId,
    invoice?.invoiceNumber,
  );
  const { bankAccount } = useBankAccount(
    Boolean(
      (invoice as any)?.service?.foOnly ??
        (invoice as any)?.application?.service?.foOnly ??
        (invoice as any)?.application?.formData?._foCollection,
    ),
  );
  const [foProofFile, setFoProofFile] = React.useState<File | null>(null);
  // Live preview of the receipt the officer is about to record, so a
  // wrong pick is visible before it is committed.
  const foProofPreviewUrl = React.useMemo(
    () =>
      foProofFile && foProofFile.type.startsWith("image/")
        ? URL.createObjectURL(foProofFile)
        : null,
    [foProofFile],
  );
  React.useEffect(() => {
    return () => {
      if (foProofPreviewUrl) URL.revokeObjectURL(foProofPreviewUrl);
    };
  }, [foProofPreviewUrl]);
  const [replaceProofFile, setReplaceProofFile] = React.useState<File | null>(
    null,
  );
  const [proofFile, setProofFile] = React.useState<File | null>(null);

  // Are-you-sure gate for the payment-method actions that commit the moment
  // they are clicked: recording an officer collection (cash or bank
  // transfer) and starting the online gateway payment. Clicking a method
  // only opens this confirmation; nothing is recorded or started until the
  // user confirms, so a wrong method is never picked by mistake.
  const [pendingMethodConfirm, setPendingMethodConfirm] = React.useState<
    | { kind: "fo"; method: "cash" | "bank_transfer" }
    | { kind: "online" }
    | null
  >(null);

  // Auto-verify if we're landing back from a gateway redirect. The provider was
  React.useEffect(() => {
    const pending = readPendingPayment();
    if (pending) {
      verifyPayment({ reference: pending.reference, provider: pending.provider });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log(invoice, "invoice");

  const copy = (v: string, label: string) => {
    navigator.clipboard?.writeText(v);
    toast.success(`${label} copied`);
  };

  const [isRefreshingTransfer, setIsRefreshingTransfer] = React.useState(false);
  // After a manual transfer the webhook or treasurer confirms the payment;
  // "I have paid" just re-pulls the invoice + reserved account so the page
  // reflects a confirmation without a full reload.
  const handleRefreshTransferStatus = async () => {
    setIsRefreshingTransfer(true);
    try {
      await refetchVa();
      await refetch();
    } finally {
      setIsRefreshingTransfer(false);
    }
  };

  const fullPaymentUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pay/${invoice?.invoiceNumber || invoiceId}`
      : "";

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline">
          <Link href="/dashboard/invoices">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Invoices
          </Link>
        </Button>
        <ErrorState
          title="Invoice not found"
          error={error || "The invoice may have been deleted or you don't have access."}
          refetch={refetch}
        />
      </div>
    );
  }

  // Calculate amounts from the new data structure
  const totalAmount = Number(invoice.amount) || 0;
  const amountPaid =
    invoice.payments?.reduce(
      (sum, p) => (p.status === "confirmed" ? sum + Number(p.amount) : sum),
      0,
    ) || 0;
  const balanceDue = totalAmount - amountPaid;

  // Pay Online (card) carries the 1.5% processing fee on top of the invoice
  // amount; bank transfer does not. The backend charges exactly these figures.
  const onlineProcessingFee = cardProcessingFee(totalAmount);
  const onlineTotal = cardChargeTotal(totalAmount);
  const formatMoney = (n: number) =>
    n.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const formatFileSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  // Proof already attached to any payment on this invoice (uploaded by the
  // citizen or staff) — drives the Bank Transfer tab's status block.
  const transferProof = invoice.payments?.find((p) => p.proofUrl) || null;

  const handleUploadProof = async () => {
    if (!proofFile) {
      toast.error("Choose a proof file (PNG, JPG or PDF) first");
      return;
    }
    try {
      await uploadProofAsync(proofFile);
      setProofFile(null);
    } catch {
      // The hook already surfaced the error toast.
    }
  };

  // Get customer information from application
  const customerName =
    invoice.application?.formData?.fullName ||
    invoice.application?.applicant?.fullName ||
    "N/A";
  const customerPhone =
    invoice.application?.formData?.phone ||
    invoice.application?.applicant?.phone ||
    "";

  // Get service/levy information
  const serviceName = invoice.application?.service?.name || "N/A";
  const revenueHead = invoice.application?.service?.code || "";

  // Format status for display
  const status = invoice.paymentStatus || "pending";

  // FO-only services show the LGA collection account (from the database)
  // in their own panel instead of the public payment options: the officer
  // records the transfer with proof, the treasurer confirms.
  // The _foCollection stamp on the application is a third signal, so the
  // public payment options can never surface on an FO invoice even if a
  // service relation is missing from the payload.
  const isFoOnlyInvoice = Boolean(
    (invoice as any)?.service?.foOnly ??
      (invoice as any)?.application?.service?.foOnly ??
      (invoice as any)?.application?.formData?._foCollection,
  );

  // Only a recorded bank transfer counts as a pending FO claim. A pending
  // card payment (the payer opened the pay link but has not finished) is
  // not a transfer record and must never present as one.
  const foPendingPayment =
    invoice.payments?.find(
      (p) =>
        p.status === "pending" &&
        p.method === "bank_transfer" &&
        p.matchStatus !== "rejected",
    ) || null;

  // A claim the treasurer sent back for correction: the officer may
  // then edit the payer's details (never the amount) and resubmit,
  // which returns the claim to a normal pending claim.
  const foCorrectionPayment =
    invoice.payments?.find(
      (p) =>
        p.status === "pending" &&
        p.method === "bank_transfer" &&
        p.matchStatus === "correction_requested",
    ) || null;

  // A claim the treasurer bounced back: stays visible until the officer
  // records again, so the officer knows the first receipt was refused
  // and why.
  const foBouncedClaim =
    status !== "confirmed" && !foPendingPayment
      ? invoice.payments?.find(
          (p) => p.method === "bank_transfer" && p.matchStatus === "rejected",
        ) || null
      : null;
  const bounceReason = (invoice.application as any)?.declineReason ?? null;

  // The method the payer is currently set to use, recorded on the
  // collection when it was created and updated whenever the officer
  // resends on the other channel.
  const paymentChannel: "card" | "transfer" =
    (invoice.application?.formData as any)?.paymentChannel === "card"
      ? "card"
      : "transfer";

  // How this invoice was actually settled, once it is settled.
  const confirmedPayment =
    invoice.payments?.find((p) => p.status === "confirmed") || null;
  const paidViaCard = confirmedPayment?.method === "online_gateway";

  // On an FO collection the payer is the walk-up customer captured on the
  // collection form, not the officer whose account created the record.
  const payerName =
    invoice.application?.formData?.payerName ||
    invoice.application?.formData?.fullName ||
    "N/A";

  const handlePaymentConfirm = (
    method: "transfer" | "pos" | "cash",
    reference?: string,
  ) => {
    recordPayment({
      method: method === "transfer" ? "bank_transfer" : method,
      amount: balanceDue,
      reference,
      narration: `Payment via ${method.toUpperCase()} at LGA office`,
    });
  };

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`Issued ${new Date(invoice.createdAt).toLocaleDateString()} • ${invoice.application?.applicationNumber ? `Application: ${invoice.application.applicationNumber}` : ""}`}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/invoices">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> All invoices
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
          </div>
        }
      />

      {/* Are-you-sure modal for payment-method actions (see
          pendingMethodConfirm above). Cancel records nothing. */}
      <Dialog
        open={pendingMethodConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setPendingMethodConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingMethodConfirm?.kind === "online"
                ? "Pay online?"
                : pendingMethodConfirm?.method === "cash"
                  ? "Record payment as Cash?"
                  : "Record payment as Bank Transfer?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {pendingMethodConfirm?.kind === "online" ? (
              <>
                You will be redirected to Paystack to complete payment of ₦
                {formatMoney(onlineTotal)} for this invoice (₦
                {formatMoney(totalAmount)} plus the 1.5% card processing fee
                of ₦{formatMoney(onlineProcessingFee)}). Make sure online
                payment is the method you want before you continue.
              </>
            ) : (
              <>
                This records that the payer paid ₦{balanceDue.toLocaleString()}{" "}
                by bank transfer, with the receipt you selected attached as
                proof.
                {foProofFile &&
                  ` Receipt file: ${foProofFile.name} (${formatFileSize(foProofFile.size)}).`}{" "}
                The treasurer will be asked to confirm it. If the file turns
                out to be wrong, you can replace the receipt from this page
                any time before the treasurer confirms. Make sure the
                receipt is the right one before you confirm.
              </>
            )}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingMethodConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const pending = pendingMethodConfirm;
                setPendingMethodConfirm(null);
                if (!pending) return;
                if (pending.kind === "online") {
                  initializeOnlinePayment();
                } else if (foProofFile) {
                  recordFoPayment(foProofFile);
                }
              }}
              disabled={isRecordingFoPayment || isInitializingPayment}
            >
              {pendingMethodConfirm?.kind === "online"
                ? "Yes, continue to payment"
                : "Yes, record transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-gradient-card border-border/40">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total Due
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  ₦{totalAmount.toLocaleString()}
                </div>
                {balanceDue > 0 && balanceDue < totalAmount && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Paid: ₦{amountPaid.toLocaleString()} • Balance: ₦
                    {balanceDue.toLocaleString()}
                  </div>
                )}
              </div>
              <StatusBadge status={status} />
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${paymentProgress}%` }}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Field
                label={isFoOnlyInvoice ? "Payer" : "Customer"}
                value={isFoOnlyInvoice ? payerName : customerName}
              />
              {customerPhone && <Field label="Phone" value={customerPhone} />}
              {isFoOnlyInvoice && invoice.application?.applicant?.fullName && (
                <Field
                  label="Collected By"
                  value={invoice.application.applicant.fullName}
                />
              )}
              {invoice.application?.formData?.merchantName && (
                <Field
                  label="Business"
                  value={invoice.application.formData.merchantName}
                />
              )}
              {invoice.application?.formData?.location && (
                <Field
                  label="Location"
                  value={invoice.application.formData.location}
                />
              )}
              <Field label="Service/Levy" value={serviceName} />
              {revenueHead && (
                <Field label="Revenue Head" value={revenueHead} />
              )}
              <Field
                label="Application Number"
                value={invoice.application?.applicationNumber || "N/A"}
              />
              <Field
                label="Status"
                value={status.charAt(0).toUpperCase() + status.slice(1)}
              />
              {invoice.application?.ward && (
                <Field label="Ward" value={invoice.application.ward} />
              )}
              {invoice.paidAt && (
                <Field
                  label="Paid On"
                  value={new Date(invoice.paidAt).toLocaleString()}
                />
              )}
            </div>

            {invoice.application?.formData?.purpose && (
              <div className="mt-4 p-3 rounded-lg bg-muted/40 text-sm">
                <span className="text-muted-foreground">Purpose: </span>
                {invoice.application.formData.purpose}
              </div>
            )}
          </Card>

          {isFoOnlyInvoice ? (
            <Card className="p-6 bg-gradient-card border-border/40">
              <h3 className="font-semibold mb-2">Officer Collection</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {status === "confirmed"
                  ? paidViaCard
                    ? "This is a field-officer-only service. The payer paid online by card, and the payment was confirmed automatically when it went through."
                    : "This is a field-officer-only service. The payer paid by bank transfer to the LGA collection account, and the treasurer confirmed it."
                  : paymentChannel === "card"
                    ? "This is a field-officer-only service. The payer pays online by card, using the payment link sent to their phone by SMS. This invoice confirms itself automatically when the payment goes through."
                    : "This is a field-officer-only service. The payer transfers to the LGA collection account below, then sends the collecting officer the receipt. The officer records the transfer here, and the treasurer confirms it."}
              </p>
              {status !== "confirmed" && paymentChannel === "transfer" &&
                (bankAccount ? (
                  <div className="rounded-lg border border-border/60 bg-background p-4 mb-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Pay into
                    </div>
                    <div className="font-semibold mt-1">
                      {bankAccount.bankName}
                    </div>
                    <div className="text-xl font-bold tracking-wide">
                      {bankAccount.accountNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {bankAccount.accountName}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Amount: ₦{totalAmount.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm mb-4">
                    No collection account has been set yet. The treasurer or
                    an admin can add it in Settings, under Bank Account,
                    before payers can be given transfer details.
                  </div>
                ))}
              {status !== "confirmed" && !foPendingPayment && isOfficer && (
                <div className="mb-4">
                  <ResendInstructionsDialog
                    key={paymentChannel}
                    invoiceNumber={invoice.invoiceNumber}
                    payerEmail={invoice.application?.formData?.email ?? null}
                    currentChannel={paymentChannel}
                    onSent={() => refetch()}
                  />
                </div>
              )}
              {foBouncedClaim && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-3 text-sm mb-4">
                  The treasurer declined the last receipt
                  {bounceReason ? `: ${bounceReason}.` : "."}{" "}
                  {isOfficer
                    ? "Record the transfer again below with the correct receipt."
                    : "The collecting officer has been asked to record it again with the correct receipt."}
                </div>
              )}
              {status === "confirmed" ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {paidViaCard
                    ? "Paid online by card"
                    : "Confirmed by the treasurer"}
                </div>
              ) : foCorrectionPayment ? (
                isOfficer ? (
                  <FoCorrectionForm
                    invoiceId={invoiceId}
                    invoiceNumber={invoice.invoiceNumber}
                    payerName={String(
                      (invoice.application?.formData as any)?.payerName ?? "",
                    )}
                    phone={String(
                      (invoice.application?.formData as any)?.phone ?? "",
                    )}
                    merchantName={String(
                      (invoice.application?.formData as any)?.merchantName ??
                        "",
                    )}
                    location={String(
                      (invoice.application?.formData as any)?.location ?? "",
                    )}
                    amount={Number(invoice.amount || 0)}
                    comment={bounceReason}
                  />
                ) : (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
                    The treasurer requested a correction on this collection
                    {bounceReason ? `: ${bounceReason}.` : "."} The
                    collecting officer has been asked to fix the payer
                    details and send it back.
                  </div>
                )
              ) : foPendingPayment ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
                  Transfer recorded
                  {foPendingPayment.proofUrl && (
                    <>
                      {" "}
                      with proof (
                      <a
                        href={foPendingPayment.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline"
                      >
                        view receipt
                      </a>
                      )
                    </>
                  )}
                  . Awaiting treasurer confirmation.
                  {isOfficer && " You will be notified when it is confirmed."}
                  {isOfficer && (
                    <div className="mt-3 border-t border-amber-500/30 pt-3 space-y-2">
                      <Label htmlFor="fo-proof-replace">
                        Wrong receipt? Replace it before the treasurer
                        confirms
                      </Label>
                      <Input
                        id="fo-proof-replace"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          setReplaceProofFile(e.target.files?.[0] || null)
                        }
                      />
                      {replaceProofFile && (
                        <p className="text-xs text-muted-foreground">
                          {replaceProofFile.name} (
                          {formatFileSize(replaceProofFile.size)})
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!replaceProofFile || isReplacingFoProof}
                        onClick={() =>
                          replaceProofFile && replaceFoProof(replaceProofFile)
                        }
                      >
                        {isReplacingFoProof ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-1.5" />
                        )}
                        Replace receipt
                      </Button>
                    </div>
                  )}
                </div>
              ) : isOfficer ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fo-proof">
                      Payer&apos;s transfer receipt
                    </Label>
                    <Input
                      id="fo-proof"
                      type="file"
                      accept="image/*,.pdf"
                      className="mt-1.5"
                      onChange={(e) =>
                        setFoProofFile(e.target.files?.[0] || null)
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Images or PDF only, up to 5 MB. The treasurer uses
                      the receipt to match the payment in the LGA account.
                    </p>
                    {foProofFile && (
                      <div className="mt-3 rounded-lg border border-border/60 bg-background p-3">
                        {foProofPreviewUrl ? (
                          <img
                            src={foProofPreviewUrl}
                            alt="Selected receipt preview"
                            className="max-h-48 rounded-md object-contain"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            PDF receipt selected
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground truncate">
                            {foProofFile.name} ({formatFileSize(foProofFile.size)})
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFoProofFile(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() =>
                      setPendingMethodConfirm({
                        kind: "fo",
                        method: "bank_transfer",
                      })
                    }
                    disabled={isRecordingFoPayment || !foProofFile}
                    className="w-full"
                  >
                    {isRecordingFoPayment ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Landmark className="h-4 w-4 mr-1.5" />
                    )}
                    Record Transfer
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {paymentChannel === "card"
                    ? "This collection is set to pay online. Payment follow-up for it sits with the collecting officer."
                    : "Awaiting the collecting officer's transfer record, then treasurer confirmation."}
                </p>
              )}
            </Card>
          ) : isPayable && (isPayer || isOfficer) ? (
            <Card className="p-6 bg-gradient-card border-border/40">
              <h3 className="font-semibold mb-4">Payment Options</h3>
              <Tabs defaultValue={isPayer ? "online" : isOfficer ? "pos" : "online"}>
                <TabsList className="mb-4">
                  {isPayer && (
                    <TabsTrigger value="online">
                      <Link2 className="h-4 w-4 mr-1.5" /> Pay online
                    </TabsTrigger>
                  )}
                  {/* Bank Transfer tab: OFF for now (see
                      SHOW_BANK_TRANSFER_TAB). When it returns: bank transfer
                      is visible to EVERYONE with invoice access — staff/FO
                      need the account details to relay to citizens and
                      merchants who cannot pay online. */}
                  {SHOW_BANK_TRANSFER_TAB && (
                    <TabsTrigger value="transfer">
                      <Landmark className="h-4 w-4 mr-1.5" /> Bank Transfer
                    </TabsTrigger>
                  )}
                  {isOfficer && (
                    <>
                      <TabsTrigger value="pos">
                        <CreditCard className="h-4 w-4 mr-1.5" /> POS
                      </TabsTrigger>
                      <TabsTrigger value="cash">
                        <Wallet className="h-4 w-4 mr-1.5" /> Cash
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>

                <TabsContent value="online">
                  <div className="p-4 rounded-lg border border-border/60 bg-background space-y-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Pay now
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Invoice amount</span>
                        <span className="font-medium">₦{formatMoney(totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Card processing fee (1.5%)</span>
                        <span className="font-medium">₦{formatMoney(onlineProcessingFee)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                        <span className="font-semibold">Total to pay</span>
                        <span className="font-bold">₦{formatMoney(onlineTotal)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You&apos;ll be redirected to Gpay to complete this
                      payment.
                    </p>
                    <Button
                      className="w-full bg-gradient-hero"
                      onClick={() => setPendingMethodConfirm({ kind: "online" })}
                      disabled={isInitializingPayment}
                    >
                      {isInitializingPayment ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4 mr-1.5" />
                      )}
                      Pay online
                    </Button>
                  </div>
                </TabsContent>
                {SHOW_BANK_TRANSFER_TAB && (
                <TabsContent value="transfer">
                  <div className="p-4 rounded-lg border border-border/60 bg-background space-y-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Bank transfer (reserved account)
                    </div>

                    {isVaLoading && (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading bank
                        transfer details...
                      </div>
                    )}

                    {!isVaLoading && !invoiceVa && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                          Bank transfer is unavailable for this invoice
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {vaError?.message ||
                            "We could not load the reserved account for this service."}
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => refetchVa()}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try again
                        </Button>
                      </div>
                    )}

                    {invoiceVa && (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Transfer{" "}
                          <span className="font-semibold text-foreground">
                            &#8358;{(invoiceVa.amount || balanceDue).toLocaleString()}
                          </span>{" "}
                          to the account below and use{" "}
                          <span className="font-mono font-semibold text-foreground">
                            {invoiceVa.reference}
                          </span>{" "}
                          as the transfer reference. The treasury reviews and
                          confirms incoming transfers - your receipt follows once
                          it lands.
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-2xl font-mono font-bold">
                              {invoiceVa.accountNumber}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {invoiceVa.bankName} &bull; {invoiceVa.accountName}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copy(invoiceVa.accountNumber, "Account number")
                            }
                          >
                            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground">
                            Transfer reference
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="font-mono font-semibold">
                              {invoiceVa.reference}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copy(invoiceVa.reference, "Reference")}
                            >
                              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                            </Button>
                          </span>
                        </div>

                        {/* Proof of payment — required before the treasurer confirms */}
                        {transferProof ? (
                          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="h-4 w-4 shrink-0" />{" "}
                              Proof uploaded — awaiting treasurer confirmation
                            </div>
                            <p className="text-xs text-muted-foreground">
                              This invoice stays at &quot;Pay now&quot; until the
                              treasurer reviews your proof and confirms the
                              transfer. Your receipt follows immediately after.
                            </p>
                            {transferProof.proofUrl && (
                              <a
                                href={transferProof.proofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-xs text-primary underline"
                              >
                                View uploaded proof
                              </a>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <Upload className="h-4 w-4 text-primary shrink-0" />{" "}
                              Upload proof of payment
                            </div>
                            <p className="text-xs text-muted-foreground">
                              1) Transfer with the reference above. 2) Upload a
                              screenshot or PDF of your receipt. 3) The treasurer
                              reviews and confirms — until then this invoice
                              still shows &quot;Pay now&quot;.
                            </p>
                            <Input
                              type="file"
                              accept=".png,.jpg,.jpeg,.pdf"
                              onChange={(e) =>
                                setProofFile(e.target.files?.[0] ?? null)
                              }
                            />
                            <Button
                              className="w-full"
                              onClick={handleUploadProof}
                              disabled={!proofFile || isUploadingProof}
                            >
                              {isUploadingProof ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />{" "}
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-1.5" /> Send proof
                                  to treasurer
                                </>
                              )}
                            </Button>
                          </div>
                            <Button
                              variant="outline"
                              className="w-full mt-3"
                              onClick={handleRefreshTransferStatus}
                              disabled={isRefreshingTransfer}
                            >
                              {isRefreshingTransfer ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{" "}
                                  Checking payment status...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> I have
                                  paid - refresh status
                                </>
                              )}
                            </Button>
                          </>
                        )}
                          </>
                        )}
                  </div>
                </TabsContent>
                )}
                <TabsContent value="pos">
                  <POSConfirmDialog
                    onConfirm={(ref) => handlePaymentConfirm("pos", ref)}
                    isProcessing={isRecordingPayment}
                  />
                </TabsContent>

                <TabsContent value="cash">
                  <CashConfirmDialog
                    amount={balanceDue}
                    onConfirm={(received, note) => handlePaymentConfirm("cash")}
                    isProcessing={isRecordingPayment}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          ) : (
            <Card className="p-6 bg-success/5 border-2 border-success/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <Badge className="bg-success text-success-foreground">
                    Paid
                  </Badge>
                  <h3 className="font-semibold mt-1">Invoice settled</h3>
                  <p className="text-sm text-muted-foreground">
                    Paid on{" "}
                    {invoice.paidAt &&
                      new Date(invoice.paidAt).toLocaleString()}
                  </p>
                </div>
                {invoice.receipts && invoice.receipts.length > 0 && (
                  <Button asChild className="ml-auto bg-gradient-hero">
                    <Link
                      href={`/dashboard/receipts/${invoice.receipts[0].id}`}
                    >
                      <ReceiptIcon className="h-4 w-4 mr-1.5" /> View receipt
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {(isPayer || isOfficer) && status !== "confirmed" && !isFoOnlyInvoice && (
            <Card className="p-5 bg-gradient-card border-border/40 text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Scan to Pay
              </div>
              <div className="flex justify-center">
                <a href={fullPaymentUrl} target="_blank" rel="noreferrer">
                  <QRCodeSVG value={fullPaymentUrl} size={180} />
                </a>
              </div>
              <div className="mt-3 text-xs text-muted-foreground break-all">
                {invoice.invoiceNumber}
              </div>
            </Card>
          )}

          {isOfficer && status !== "confirmed" && !isFoOnlyInvoice && (
            <Card className="p-5 bg-gradient-card border-border/40 space-y-2">
              <h4 className="font-semibold text-sm mb-1">Send payment link</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Sends via SMS and email in one go
              </p>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => sendPaymentLink()}
                disabled={isSendingPaymentLink}
              >
                {isSendingPaymentLink ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send payment link
              </Button>
            </Card>
          )}

          {invoice.payments && invoice.payments.length > 0 && (
            <Card className="p-5 bg-gradient-card border-border/40">
              <h4 className="font-semibold text-sm mb-3">Payment History</h4>
              <div className="space-y-2">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row justify-between items-center text-sm border-b pb-2"
                  >
                    <div className="flex-1">
                      <span className="font-medium">
                        ₦{Number(payment.amount).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {payment.method}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({payment.status})
                      </span>
                    </div>
                    {payment.status === "pending" &&
                    payment.method === "online_gateway" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          verifyPayment({
                            reference: payment.reference,
                            provider: resolvePaymentProvider(payment.reference),
                          })
                        }
                        disabled={isVerifyingPayment}
                      >
                        {isVerifyingPayment ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Check status"
                        )}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {payment.confirmedAt
                          ? new Date(payment.confirmedAt).toLocaleDateString()
                          : "Pending"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

// POSConfirmDialog and CashConfirmDialog remain the same as in your original code

function POSConfirmDialog({
  onConfirm,
  isProcessing,
}: {
  onConfirm: (ref: string) => void;
  isProcessing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-hero" disabled={isProcessing}>
          <CreditCard className="h-4 w-4 mr-1.5" /> Record POS payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm POS payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>POS Reference / RRN</Label>
            <Input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. 0123456789"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>POS Receipt (optional)</Label>
            <Input type="file" accept="image/*" className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!ref) return toast.error("Enter POS reference");
              setOpen(false);
              onConfirm(ref);
            }}
            className="bg-gradient-hero"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
            )}
            Confirm payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CashConfirmDialog({
  amount,
  onConfirm,
  isProcessing,
}: {
  amount: number;
  onConfirm: (received: number, note: string) => void;
  isProcessing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [received, setReceived] = useState(amount);
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-hero" disabled={isProcessing}>
          <Wallet className="h-4 w-4 mr-1.5" /> Record cash payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm cash collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Amount received (₦)</Label>
            <Input
              type="number"
              value={received}
              onChange={(e) => setReceived(Number(e.target.value))}
              className="mt-1.5"
            />
            {received < amount && (
              <p className="text-xs text-red-500 mt-1">
                Amount is less than balance due (₦{amount.toLocaleString()})
              </p>
            )}
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1.5"
              placeholder="e.g., Payment received at LGA office"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (received < amount) {
                toast.error(
                  `Amount must be at least ₦${amount.toLocaleString()}`,
                );
                return;
              }
              setOpen(false);
              onConfirm(received, note);
            }}
            className="bg-gradient-hero"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1.5" />
            )}
            Confirm & issue receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


/**
 * Resend the payment instructions for an FO collection invoice by SMS:
 * the card payment link, or the LGA collection account details for a
 * bank transfer. The backend refuses while a recorded transfer is
 * awaiting treasurer confirmation, so a payer is never pushed to pay
 * twice. Card links need the payer's email (Paystack requires one); it
 * is prefilled from the collection record where one was captured.
 */
function FoCorrectionForm({
  invoiceId,
  invoiceNumber,
  payerName: initialPayerName,
  phone: initialPhone,
  merchantName: initialMerchantName,
  location: initialLocation,
  amount,
  comment,
}: {
  invoiceId: string;
  invoiceNumber: string;
  payerName: string;
  phone: string;
  merchantName: string;
  location: string;
  amount: number;
  comment?: string | null;
}) {
  const { submitFoCorrection, isSubmittingFoCorrection } =
    useSubmitFoCorrection(invoiceId, invoiceNumber);
  const [payerName, setPayerName] = React.useState(initialPayerName);
  const [phone, setPhone] = React.useState(initialPhone);
  const [merchantName, setMerchantName] = React.useState(initialMerchantName);
  const [location, setLocation] = React.useState(initialLocation);
  const [proofFile, setProofFile] = React.useState<File | null>(null);

  const fileSize = (bytes: number) =>
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const canSend =
    payerName.trim().length > 0 &&
    phone.trim().length > 0 &&
    !isSubmittingFoCorrection;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm space-y-3">
      <p>
        <span className="font-semibold">
          The treasurer requested a correction
        </span>
        {comment ? `: ${comment}` : "."} Fix the payer details below and
        send it back. The amount cannot be changed.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="fo-corr-payer">Payer name</Label>
          <Input
            id="fo-corr-payer"
            className="mt-1.5 bg-background"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="fo-corr-phone">Payer phone number</Label>
          <Input
            id="fo-corr-phone"
            className="mt-1.5 bg-background"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="fo-corr-business">Business (optional)</Label>
          <Input
            id="fo-corr-business"
            className="mt-1.5 bg-background"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="fo-corr-location">Location (optional)</Label>
          <Input
            id="fo-corr-location"
            className="mt-1.5 bg-background"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Amount collected:{" "}
        <span className="font-semibold text-foreground">
          ₦{amount.toLocaleString()}
        </span>{" "}
        (cannot be changed)
      </p>
      <div>
        <Label htmlFor="fo-corr-proof">New receipt (optional)</Label>
        <Input
          id="fo-corr-proof"
          type="file"
          accept="image/*,.pdf"
          className="mt-1.5 bg-background"
          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
        />
        {proofFile && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {proofFile.name} ({fileSize(proofFile.size)})
          </p>
        )}
      </div>
      <Button
        size="sm"
        disabled={!canSend}
        onClick={() =>
          submitFoCorrection({
            details: {
              payerName: payerName.trim(),
              phone: phone.trim(),
              merchantName: merchantName.trim(),
              location: location.trim(),
            },
            proof: proofFile,
          })
        }
      >
        {isSubmittingFoCorrection ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-1.5" />
        )}
        Send correction
      </Button>
    </div>
  );
}

function ResendInstructionsDialog({
  invoiceNumber,
  payerEmail,
  currentChannel,
  onSent,
}: {
  invoiceNumber: string;
  payerEmail?: string | null;
  currentChannel: "card" | "transfer";
  onSent?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<"card" | "transfer">(currentChannel);
  const [email, setEmail] = useState(payerEmail ?? "");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (channel === "card" && !email.trim()) {
      toast.error("Enter the payer's email address for the card payment link");
      return;
    }
    setSending(true);
    try {
      const result = await invoicesService.resendPaymentInstructions(
        invoiceNumber,
        channel === "card" ? { channel, email: email.trim() } : { channel },
      );
      if (result.smsSent) {
        toast.success("Payment instructions sent to the payer by SMS");
        onSent?.();
        setOpen(false);
      } else {
        toast.error("The SMS could not be sent. Check the number and try again.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Could not resend the payment instructions");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Send className="h-4 w-4 mr-1.5" /> Resend or switch payment method
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send payment instructions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The payer gets an SMS with how to pay this invoice. Picking the
            other method switches this collection to it, so the payer can
            pay the new way instead.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={channel === "transfer" ? "default" : "outline"}
              onClick={() => setChannel("transfer")}
            >
              <Landmark className="h-4 w-4 mr-1.5" /> Bank transfer
            </Button>
            <Button
              type="button"
              variant={channel === "card" ? "default" : "outline"}
              onClick={() => setChannel("card")}
            >
              <Link2 className="h-4 w-4 mr-1.5" /> Card payment link
            </Button>
          </div>
          {channel === "card" && (
            <div>
              <Label htmlFor="resend-payer-email">Payer&apos;s email</Label>
              <Input
                id="resend-payer-email"
                type="email"
                className="mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="payer@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Needed for the card payment. The SMS carries the payment
                link itself.
              </p>
            </div>
          )}
          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1.5" />
            )}
            Send SMS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
