"use client";

import { LGA_CONFIG } from "@/config/lga.config";
import { useState, Suspense } from "react";
import { PageHeader } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Landmark,
  Loader2,
  Copy,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useAwaitingConfirmation } from "@/hooks/queries/useTreasurer";
import { treasurerService, type AwaitingConfirmationApplication } from "@/services/apiTreasurer";
import { tokenManager } from "@/services/apiAuth";
import { toast } from "sonner";

const date = (v?: string | null) =>
  v ? new Date(v).toLocaleString("en-NG") : "—";
const money = (v: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    Number(v),
  );

function PaymentConfirmationsContent() {
  const currentUser = tokenManager.getUser();
  const userRole = currentUser?.role || "treasurer";
  const isSubAdmin = userRole === "sub_admin";
  const isFinalTreasurer =
    userRole === "treasurer" ||
    userRole === "lga_admin" ||
    userRole === "super_admin";

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [declining, setDeclining] =
    useState<AwaitingConfirmationApplication | null>(null);
  const [correctionApp, setCorrectionApp] =
    useState<AwaitingConfirmationApplication | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  // Review Modal State (the bank settlement audit lives inside it,
  // and only for claims that came through a gateway account)
  const [reviewApp, setReviewApp] =
    useState<AwaitingConfirmationApplication | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditData, setAuditData] = useState<any | null>(null);
  const [overrideUnderpayment, setOverrideUnderpayment] = useState(false);

  const {
    useGetAwaitingConfirmation,
    confirmPaymentAsync,
    declinePaymentAsync,
    subAdminReviewPaymentAsync,
  } = useAwaitingConfirmation();

  const { data, isLoading, isFetching, error, refetch } =
    useGetAwaitingConfirmation({ page, limit: 25, status });

  async function handleOpenGPayAudit(app: AwaitingConfirmationApplication) {
    const payment = app.invoice?.payments[0];
    if (!payment) return;
    setAuditLoading(true);
    setAuditData(null);
    setOverrideUnderpayment(false);

    try {
      const res: any = await treasurerService.getGPayAudit(payment.id);
      setAuditData(res);
    } catch (err: any) {
      toast.error(err?.message || "Failed to query live bank settlement audit records");
    } finally {
      setAuditLoading(false);
    }
  }

  async function review(
    app: AwaitingConfirmationApplication,
    rejection?: string,
    override?: boolean,
  ) {
    const payment = app.invoice?.payments[0];
    if (!payment) return;
    setBusy(true);
    try {
      if (rejection) {
        await declinePaymentAsync({ paymentId: payment.id, reason: rejection });
      } else {
        await confirmPaymentAsync({
          paymentId: payment.id,
          overrideUnderpayment: override ?? overrideUnderpayment,
          underpaymentReason: override ? "Authorized by Treasurer after review" : undefined,
        });
      }
      setDeclining(null);
      setReviewApp(null);
      setReason("");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Payment confirmation error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubAdminReview(
    app: AwaitingConfirmationApplication,
    action: "approve" | "request_correction",
    comment?: string,
  ) {
    const payment = app.invoice?.payments[0];
    if (!payment) return;
    setBusy(true);
    try {
      await subAdminReviewPaymentAsync({
        paymentId: payment.id,
        action,
        comment,
      });
      setCorrectionApp(null);
      setReviewApp(null);
      setReason("");
      await refetch();
    } catch {
      /* Handled by hook toast */
    } finally {
      setBusy(false);
    }
  }

  const quickDeclineReasons = [
    "Underpayment: Amount received is less than statutory fee",
    "No matching bank settlement record found for reference",
    "Payment evidence is invalid, unreadable, or missing",
    "Payment was sent to wrong destination account",
  ];

  // One place that works out what a claim is and what can be done with
  // it, shared by the slim table row and the review modal. FO
  // collections carry the real payer in formData and have no fixed
  // fee, so underpayment never applies to them.
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v : null;

  function claimFacts(app: AwaitingConfirmationApplication) {
    const p = app.invoice?.payments[0];
    const fd = (app.formData ?? {}) as Record<string, unknown>;
    const isFo = app.service?.foOnly === true || fd._foCollection === true;
    const applicantName = app.applicant
      ? `${app.applicant.firstName} ${app.applicant.lastName}`
      : null;
    const payerName =
      (isFo ? str(fd.payerName) : str(fd.fullName)) ||
      applicantName ||
      app.fullName ||
      "—";
    const payerPhone =
      str(fd.phone) || app.applicant?.phone || app.phone || null;
    const payerEmail =
      str(fd.email) || app.applicant?.email || app.email || null;
    const expectedFee = Number(app.invoice?.amount || 0);
    const receivedAmount = Number(p?.amount || 0);
    const isUnderpaid =
      !isFo &&
      (p?.matchStatus === "underpayment" ||
        (expectedFee > 0 &&
          receivedAmount > 0 &&
          receivedAmount < expectedFee - 0.01));
    const shortfall = isUnderpaid ? expectedFee - receivedAmount : 0;
    const confirmed = p?.status === "confirmed";
    const rejected = p?.matchStatus === "rejected";
    const subAdminApproved = p?.matchStatus === "sub_admin_approved";
    const correctionRequested = p?.matchStatus === "correction_requested";
    const canReview =
      !confirmed &&
      !rejected &&
      (app.status === "awaiting_payment_confirmation" ||
        app.status === "correction_requested") &&
      (!!p?.proofUrl || !!p?.id);
    return {
      p,
      isFo,
      payerName,
      payerPhone,
      payerEmail,
      expectedFee,
      receivedAmount,
      isUnderpaid,
      shortfall,
      confirmed,
      rejected,
      subAdminApproved,
      correctionRequested,
      canReview,
    };
  }

  function statusBadge(f: ReturnType<typeof claimFacts>) {
    if (f.confirmed)
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 gap-1 text-[11px] font-semibold">
          <CheckCircle2 className="h-3 w-3" /> Payment Confirmed
        </Badge>
      );
    if (f.rejected)
      return (
        <Badge variant="destructive" className="gap-1 text-[11px]">
          <XCircle className="h-3 w-3" /> Payment Rejected
        </Badge>
      );
    if (f.subAdminApproved)
      return (
        <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 gap-1 text-[11px] font-semibold">
          <ShieldCheck className="h-3 w-3" /> Sub-Admin Verified
        </Badge>
      );
    if (f.correctionRequested)
      return (
        <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 gap-1 text-[11px] font-semibold">
          <AlertTriangle className="h-3 w-3" /> Correction Requested
        </Badge>
      );
    return (
      <Badge
        variant="outline"
        className="text-[11px] text-amber-700 border-amber-300 bg-amber-500/10 font-semibold gap-1"
      >
        <Clock className="h-3 w-3" /> Pending Verification
      </Badge>
    );
  }

  function openReview(app: AwaitingConfirmationApplication) {
    setReviewApp(app);
    setAuditData(null);
    setAuditLoading(false);
    setOverrideUnderpayment(false);
  }

  const rf = reviewApp ? claimFacts(reviewApp) : null;
  const rp = rf?.p ?? undefined;
  const rfd = (reviewApp?.formData ?? {}) as Record<string, unknown>;
  const proofIsImage =
    !!rp?.proofUrl && /\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(rp.proofUrl);

  return (
    <div className="space-y-6">
      {/* Direct Bank Inflows & Settlements (the GPay Monitoring Hub)
          is hidden while that provider is parked (Nov 25, 2026); this
          page is the Citizen Payment Claims queue alone. */}
      <>
          <PageHeader
        title={
          isSubAdmin
            ? "First-Level Payment Verification (Sub-Admin)"
            : "Treasury Payment Verification & Receipt Issuance"
        }
        subtitle={
          isSubAdmin
            ? "Inspect bank transfer claims and evidence before forwarding verified payments to the Treasurer for final approval."
            : "Verify payment inflows against council accounts, check for underpayments, issue official revenue receipts, and maintain statutory audit records."
        }
        action={
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-64 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              ["all", "All payments"],
              ["pending", "Pending verification"],
              ["confirmed", "Payment Confirmed"],
              ["rejected", "Payment Rejected"],
            ].map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="flex items-center gap-1 font-medium">
            <Landmark className="h-3.5 w-3.5 text-primary" /> Live Bank Verification Active
          </span>
        </div>
      </div>

      {error ? (
        <Card className="p-6 text-destructive">
          Unable to load payments. Please try refreshing.
        </Card>
      ) : (
        <Card className="overflow-x-auto bg-gradient-card border-border/40">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead>Application / Service</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading treasury payment records…
                  </TableCell>
                </TableRow>
              ) : !data?.data.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No payments match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((app) => {
                  const f = claimFacts(app);
                  return (
                    <TableRow key={app.id}>
                      {/* Application & Service */}
                      <TableCell className="align-top">
                        <div className="font-mono font-bold text-primary text-xs">
                          {app.applicationNumber}
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          {app.service.name}
                        </div>
                        {f.isFo && (
                          <Badge className="bg-amber-500 text-white text-[10px] py-0 px-1.5 mt-1 w-fit font-semibold">
                            FO Collection
                          </Badge>
                        )}
                      </TableCell>

                      {/* Payer (the real payer; for FO collections that
                          is the person in formData, not the officer) */}
                      <TableCell className="align-top">
                        <div className="font-medium text-xs text-foreground">
                          {f.payerName}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {f.payerPhone || f.payerEmail || "—"}
                        </div>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="align-top">
                        <div className="text-xs font-bold text-foreground whitespace-nowrap">
                          {money(f.receivedAmount || f.expectedFee)}
                        </div>
                        {f.isUnderpaid && (
                          <div className="text-[11px] text-rose-600 font-semibold whitespace-nowrap">
                            Expected {money(f.expectedFee)}
                          </div>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-top">
                        {statusBadge(f)}
                        {f.rejected && app.declineReason && (
                          <p className="text-[11px] text-destructive max-w-[160px] truncate mt-1" title={app.declineReason}>
                            {app.declineReason}
                          </p>
                        )}
                      </TableCell>

                      {/* Date the claim was made */}
                      <TableCell className="align-top text-xs text-muted-foreground whitespace-nowrap">
                        {date(f.p?.proofUploadedAt || f.p?.createdAt || app.createdAt)}
                      </TableCell>

                      {/* The one action: everything else lives in the
                          review modal */}
                      <TableCell className="text-right align-top">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReview(app)}
                          className="text-xs h-8 font-semibold"
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {data?.meta && (
        <div className="flex justify-between items-center text-xs">
          <p className="text-muted-foreground">
            {data.meta.total} applications · Page {page} of {Math.max(1, data.meta.totalPages)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages || isFetching}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================
          PAYMENT REVIEW MODAL
          Everything about one claim in one place: who paid, what was
          claimed, the evidence, the bank settlement audit where one
          exists, and only the actions that apply to this claim and
          this role. FO collections have no gateway settlement, so
          they get no audit section at all.
         ============================================================ */}
      <Dialog
        open={!!reviewApp}
        onOpenChange={(open) => {
          if (!open && !busy) setReviewApp(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          {reviewApp && rf && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-lg font-bold">
                    Payment Review
                  </DialogTitle>
                  {statusBadge(rf)}
                  {rf.isFo && (
                    <Badge className="bg-amber-500 text-white text-[10px] font-semibold">
                      FO Collection
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground break-words">
                  <span className="font-mono font-semibold text-primary break-all">
                    {reviewApp.applicationNumber}
                  </span>
                  {" · "}
                  {reviewApp.service.name}
                  {" · Invoice "}
                  {reviewApp.invoice?.invoiceNumber || "—"}
                </p>
              </DialogHeader>

              <div className="space-y-5 pt-1 min-w-0">
                {/* Who paid */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    {rf.isFo ? "Payer & Collection" : "Payer"}
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs rounded-xl border p-3 bg-card [&>*]:min-w-0">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Payer</span>
                      <span className="font-semibold text-foreground">{rf.payerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Phone</span>
                      <span className="font-semibold text-foreground">{rf.payerPhone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Email</span>
                      <span className="font-semibold text-foreground break-all">{rf.payerEmail || "—"}</span>
                    </div>
                    {rf.isFo ? (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Collected By</span>
                        <span className="font-semibold text-foreground break-all">
                          {reviewApp.createdBy
                            ? `${reviewApp.createdBy.firstName} ${reviewApp.createdBy.lastName} (${reviewApp.createdBy.role})`
                            : "—"}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Submitted By</span>
                        <span className="font-semibold text-foreground break-all">
                          {reviewApp.createdBy
                            ? `${reviewApp.createdBy.firstName} ${reviewApp.createdBy.lastName} (${reviewApp.createdBy.role})`
                            : "Citizen Self-service"}
                        </span>
                      </div>
                    )}
                    {rf.isFo && str(rfd.merchantName) && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Business</span>
                        <span className="font-semibold text-foreground">{str(rfd.merchantName)}</span>
                      </div>
                    )}
                    {rf.isFo && str(rfd.location) && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Location</span>
                        <span className="font-semibold text-foreground">{str(rfd.location)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Application Date</span>
                      <span className="font-semibold text-foreground">{date(reviewApp.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* The payment itself */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Payment
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs rounded-xl border p-3 bg-card [&>*]:min-w-0">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Amount Claimed</span>
                      <span className="text-sm font-black text-foreground">
                        {money(rf.receivedAmount || rf.expectedFee)}
                      </span>
                    </div>
                    {!rf.isFo && (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Expected Fee</span>
                        <span className="text-sm font-black text-foreground">{money(rf.expectedFee)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Reference</span>
                      <span className="font-mono font-medium text-foreground break-all">{rp?.reference || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Method</span>
                      <span className="font-semibold text-foreground">
                        {rf.isFo ? "Bank transfer" : rp?.gatewayRef ? "Gateway transfer" : "Direct static transfer"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Destination</span>
                      <span className="font-semibold text-foreground">
                        {rf.isFo
                          ? "LGA collection account"
                          : reviewApp.invoice?.virtualBankName || "Official LGA Collection Bank"}
                      </span>
                      {!rf.isFo && reviewApp.invoice?.virtualAccountNumber && (
                        <span className="font-mono text-[11px] text-muted-foreground block break-all">
                          {reviewApp.invoice.virtualAccountNumber}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Claim Date</span>
                      <span className="font-semibold text-foreground">
                        {date(rp?.proofUploadedAt || rp?.createdAt)}
                      </span>
                    </div>
                  </div>
                  {rf.isUnderpaid && (
                    <Alert variant="destructive" className="border-2 border-rose-500/40 bg-rose-500/10 mt-3">
                      <AlertTriangle className="h-5 w-5 text-rose-600" />
                      <AlertTitle className="text-sm font-bold">
                        Underpayment: shortfall of {money(rf.shortfall)}
                      </AlertTitle>
                      <AlertDescription className="text-xs leading-relaxed mt-1">
                        The claimed amount is {money(rf.receivedAmount)} against an expected fee of {money(rf.expectedFee)}. Run the settlement audit below before confirming.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* The evidence */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Payment Evidence
                  </h4>
                  {rp?.proofUrl ? (
                    <div className="rounded-xl border p-3 bg-card space-y-2 overflow-hidden min-w-0">
                      {proofIsImage && (
                        <div className="max-h-96 overflow-auto rounded-lg border bg-muted/30">
                          {/* Proof images vary in size, so the preview
                              keeps its natural size inside a scrollable
                              box instead of stretching the modal. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={rp.proofUrl}
                            alt="Payment proof"
                            className="block w-auto h-auto max-w-none"
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <a
                          href={rp.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline font-semibold flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Open proof full size
                        </a>
                        <span className="text-[11px] text-muted-foreground">
                          Uploaded {date(rp.proofUploadedAt || rp.createdAt)}
                          {rp.proofUploadedBy
                            ? ` by ${rp.proofUploadedBy.firstName} ${rp.proofUploadedBy.lastName}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground rounded-xl border p-3 bg-card">
                      Claim logged without an uploaded receipt (the payer used &quot;I have paid&quot;).
                    </p>
                  )}
                </div>

                {rf.rejected && reviewApp.declineReason && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900">
                    <span className="font-bold block mb-0.5">Rejection reason</span>
                    {reviewApp.declineReason}
                  </div>
                )}

                {/* Settlement audit: gateway claims only. FO transfers
                    settle into the one LGA account and have nothing for
                    a gateway to audit. */}
                {rf.isFo ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
                    This is a field officer collection, so there is no gateway settlement to audit. Check the transfer against the LGA collection account statement, then confirm or reject below.
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <Landmark className="h-3.5 w-3.5" /> Bank Settlement Audit
                      </h4>
                      {!auditLoading && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenGPayAudit(reviewApp)}
                          className="text-xs h-7 font-semibold"
                        >
                          {auditData ? "Re-run check" : "Run check"}
                        </Button>
                      )}
                    </div>
                    {auditLoading ? (
                      <div className="rounded-xl border p-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Checking the council bank settlement records…
                      </div>
                    ) : auditData ? (
                      <div className="space-y-3">
                        {auditData.isUnderpayment ? (
                          <Alert variant="destructive" className="border-2 border-rose-500/40 bg-rose-500/10">
                            <AlertTriangle className="h-5 w-5 text-rose-600" />
                            <AlertTitle className="text-sm font-bold">
                              ⚠️ UNDERPAYMENT DETECTED: Shortfall of {money(auditData.shortfall)}
                            </AlertTitle>
                            <AlertDescription className="text-xs leading-relaxed mt-1">
                              The citizen transferred <strong>{money(auditData.settledAmount)}</strong>, but the statutory fee for this service is <strong>{money(auditData.expectedAmount)}</strong>.
                              An official receipt cannot be issued for an underpaid transaction without full settlement or an authorized waiver note.
                            </AlertDescription>
                          </Alert>
                        ) : auditData.isExactMatch ? (
                          <Alert className="border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-950">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <AlertTitle className="text-sm font-bold text-emerald-900">
                              ✓ Full Settlement Verified on Council Bank Account
                            </AlertTitle>
                            <AlertDescription className="text-xs text-emerald-800 leading-relaxed mt-1">
                              Exact statutory fee of <strong>{money(auditData.settledAmount)}</strong> has been verified and settled to the {LGA_CONFIG.identity.name} LGA trust account.
                            </AlertDescription>
                          </Alert>
                        ) : !auditData.foundInGateway ? (
                          <Alert className="border-amber-400 bg-amber-50 text-amber-950">
                            <Clock className="h-5 w-5 text-amber-600" />
                            <AlertTitle className="text-sm font-bold text-amber-900">
                              No Bank Inflow Found Yet
                            </AlertTitle>
                            <AlertDescription className="text-xs text-amber-800 leading-relaxed mt-1">
                              No matching transaction was found on the official council account for this reference. The citizen may have transferred recently or entered an incorrect reference.
                            </AlertDescription>
                          </Alert>
                        ) : null}

                        <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-xl border text-xs">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                              Statutory Fee
                            </span>
                            <span className="text-sm font-black text-foreground">
                              {money(auditData.expectedAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                              Actual Settled
                            </span>
                            <span className={`text-sm font-black ${auditData.isUnderpayment ? "text-rose-600" : "text-emerald-700"}`}>
                              {money(auditData.settledAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                              Difference / Shortfall
                            </span>
                            <span className={`text-sm font-black ${auditData.isUnderpayment ? "text-rose-600" : "text-foreground"}`}>
                              {auditData.isUnderpayment ? `-${money(auditData.shortfall)}` : "₦0.00"}
                            </span>
                          </div>
                        </div>

                        {auditData.foundInGateway && (
                          <div className="rounded-xl border divide-y text-xs bg-card">
                            <div className="flex justify-between p-2.5">
                              <span className="text-muted-foreground">Payer Bank &amp; Account:</span>
                              <span className="font-semibold text-foreground text-right">
                                {auditData.payerDetails?.sourceBankName || "OPAY"} • {auditData.payerDetails?.sourceAccountNumber || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between p-2.5">
                              <span className="text-muted-foreground">Payer Customer Name:</span>
                              <span className="font-semibold text-foreground text-right">
                                {auditData.payerDetails?.sourceAccountName || auditData.payerDetails?.customerName || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between p-2.5">
                              <span className="text-muted-foreground">Destination Collection Account:</span>
                              <span className="font-mono font-medium text-foreground text-right">
                                {auditData.gatewayDetails?.accountNumber} ({auditData.gatewayDetails?.serviceCode})
                              </span>
                            </div>
                            <div className="flex justify-between p-2.5">
                              <span className="text-muted-foreground">Bank Session / Reference ID:</span>
                              <span className="font-mono text-[11px] text-muted-foreground text-right break-all">
                                {auditData.gatewayDetails?.sessionId || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between p-2.5">
                              <span className="text-muted-foreground">Settlement Reference:</span>
                              <span className="font-mono text-[11px] text-muted-foreground text-right break-all">
                                {auditData.gatewayDetails?.gpayReference || auditData.gatewayDetails?.settlementId}
                              </span>
                            </div>
                            <div className="flex justify-between p-2.5">
                              <span className="text-muted-foreground">Transfer Narration / Remarks:</span>
                              <span className="text-[11px] text-foreground text-right max-w-xs break-words">
                                {auditData.payerDetails?.tranRemarks || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between p-2.5">
                              <span className="text-muted-foreground">Bank Timestamp:</span>
                              <span className="text-foreground text-right">
                                {date(auditData.payerDetails?.tranDateTime || auditData.gatewayDetails?.createdAt)}
                              </span>
                            </div>
                          </div>
                        )}

                        {isFinalTreasurer && auditData.isUnderpayment && (
                          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-2 text-amber-950">
                            <label className="flex items-start gap-2 font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={overrideUnderpayment}
                                onChange={(e) => setOverrideUnderpayment(e.target.checked)}
                                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                              />
                              <span>
                                Authorized Override: Proceed with confirmation despite shortfall (Recorded in Audit Ledger).
                              </span>
                            </label>
                            <p className="text-[11px] text-amber-800">
                              Only check this if an official fee waiver, instalment agreement, or cash balance was settled directly at the council treasury.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground rounded-xl border p-3 bg-card">
                        Run the check to see whether this transfer has settled in the council account, and for how much.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setReviewApp(null)}
                  className="text-xs"
                >
                  Close
                </Button>

                {rf.canReview ? (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        const app = reviewApp;
                        setReviewApp(null);
                        setDeclining(app);
                        setReason(
                          rf.isUnderpaid
                            ? `Underpayment: Transferred ${money(rf.receivedAmount)} instead of statutory fee ${money(rf.expectedFee)} (Shortfall: ${money(rf.shortfall)})`
                            : "",
                        );
                      }}
                      className="text-xs"
                    >
                      Reject
                    </Button>

                    {!rf.subAdminApproved && (isSubAdmin || isFinalTreasurer) && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          setCorrectionApp(reviewApp);
                          setReason("");
                          setReviewApp(null);
                        }}
                        className="text-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950 font-semibold"
                      >
                        Request Correction
                      </Button>
                    )}

                    {(isSubAdmin || (!rf.subAdminApproved && isFinalTreasurer)) && !rf.subAdminApproved && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => handleSubAdminReview(reviewApp, "approve")}
                        className="text-xs bg-primary text-primary-foreground font-semibold gap-1"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        1st Review Approve
                      </Button>
                    )}

                    {isFinalTreasurer &&
                      (rf.isUnderpaid && !auditData ? (
                        <Button
                          size="sm"
                          disabled={busy || auditLoading}
                          onClick={() => handleOpenGPayAudit(reviewApp)}
                          className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        >
                          Check Underpayment
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={busy || (!!auditData?.isUnderpayment && !overrideUnderpayment)}
                          onClick={() => review(reviewApp, undefined, overrideUnderpayment)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {busy ? "Confirming..." : "Confirm & Receipt"}
                        </Button>
                      ))}
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground self-center">
                    This claim has already been decided. The details above are read only.
                  </p>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Sub-Admin Request Correction Modal */}
      <Dialog
        open={!!correctionApp}
        onOpenChange={(open) => {
          if (!open && !busy) setCorrectionApp(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payment Evidence Correction</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Specify what additional payment information or clearer transfer
            receipt the applicant needs to provide.
          </p>
          <Textarea
            aria-label="Correction comment"
            placeholder="e.g., Transfer receipt image is blurry or session ID is missing. Please upload a clearer payment receipt..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setCorrectionApp(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={!reason.trim() || busy}
              onClick={() =>
                correctionApp &&
                handleSubAdminReview(
                  correctionApp,
                  "request_correction",
                  reason.trim(),
                )
              }
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {busy ? "Sending…" : "Send Correction Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Modal with Quick Reasons */}
      <Dialog
        open={!!declining}
        onOpenChange={(open) => {
          if (!open && !busy) setDeclining(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment Evidence</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Select a predefined reason or enter a detailed explanation. The applicant will be notified immediately via Email and SMS with resubmission instructions.
          </p>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Quick Select Reasons:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickDeclineReasons.map((qr) => (
                <button
                  type="button"
                  key={qr}
                  onClick={() => setReason(qr)}
                  className="text-[11px] text-left px-2.5 py-1 rounded-md border border-border bg-muted/50 hover:bg-muted text-foreground transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Official Justification:
            </span>
            <Textarea
              aria-label="Rejection reason"
              placeholder="Provide clear reason why this payment evidence was rejected..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs min-h-[90px]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setDeclining(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || busy}
              onClick={() => declining && review(declining, reason.trim())}
            >
              {busy ? "Saving…" : "Reject Payment & Notify Citizen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    </div>
  );
}

export default function PaymentConfirmationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
          Loading Payment Confirmations &amp; Settlement Hub...
        </div>
      }
    >
      <PaymentConfirmationsContent />
    </Suspense>
  );
}
