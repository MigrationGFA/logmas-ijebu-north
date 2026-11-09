"use client";

import { LGA_CONFIG } from "@/config/lga.config";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GPayMonitoringHub } from "@/components/treasurer/GPayMonitoringHub";
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
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTopTab, setActiveTopTab] = useState<"queue" | "hub">(
    tabParam === "hub" ? "hub" : "queue"
  );
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

  // GPay Audit Modal State
  const [auditApp, setAuditApp] =
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
    setAuditApp(app);
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
      setAuditApp(null);
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
      setAuditApp(null);
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

  return (
    <div className="space-y-6">
      {/* Top Segmented Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/60 rounded-xl border border-border w-fit">
        <button
          type="button"
          onClick={() => setActiveTopTab("queue")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTopTab === "queue"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-primary" />
          Citizen Payment Claims
          {data?.meta?.totalCount !== undefined && (
            <Badge variant="secondary" className="text-[10px] ml-1">
              {data.meta.totalCount}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTopTab("hub")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTopTab === "hub"
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Landmark className="h-4 w-4 text-emerald-400" />
          Direct Bank Inflows &amp; Settlements
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        </button>
      </div>

      {activeTopTab === "hub" ? (
        <GPayMonitoringHub userRole={userRole} />
      ) : (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application / Service</TableHead>
                <TableHead>Applicant / Payer</TableHead>
                <TableHead>Destination Account</TableHead>
                <TableHead>Expected vs. Received</TableHead>
                <TableHead>Transaction Ref / Date</TableHead>
                <TableHead>Payment Evidence</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading treasury payment records…
                  </TableCell>
                </TableRow>
              ) : !data?.data.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No payments match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((app) => {
                  const p = app.invoice?.payments[0];
                  const rejected = p?.matchStatus === "rejected";
                  const confirmed = p?.status === "confirmed";
                  const subAdminApproved =
                    p?.matchStatus === "sub_admin_approved";
                  const correctionRequested =
                    p?.matchStatus === "correction_requested";

                  const expectedFee = Number(app.invoice?.amount || 0);
                  const receivedAmount = Number(p?.amount || 0);
                  const isUnderpaid =
                    p?.matchStatus === "underpayment" || (expectedFee > 0 && receivedAmount > 0 && receivedAmount < expectedFee - 0.01);
                  const shortfall = isUnderpaid ? expectedFee - receivedAmount : 0;

                  const canReview =
                    !confirmed &&
                    !rejected &&
                    (app.status === "awaiting_payment_confirmation" ||
                      app.status === "correction_requested") &&
                    (!!p?.proofUrl || !!p?.id);

                  return (
                    <TableRow key={app.id}>
                      {/* 1. Application & Service */}
                      <TableCell>
                        <div className="font-mono font-bold text-primary text-xs">
                          {app.applicationNumber}
                        </div>
                        <div className="text-xs font-semibold text-foreground truncate max-w-[180px]">
                          {app.service.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {date(app.createdAt)}
                        </div>
                      </TableCell>

                      {/* 2. Applicant / Contact */}
                      <TableCell>
                        <div className="font-medium text-xs text-foreground">
                          {app.applicant
                            ? `${app.applicant.firstName} ${app.applicant.lastName}`
                            : app.fullName || "—"}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                          {app.applicant?.email || app.email || "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {app.createdBy
                            ? `${app.createdBy.firstName} (${app.createdBy.role})`
                            : "Citizen Self-service"}
                        </div>
                      </TableCell>

                      {/* 3. Destination Account */}
                      <TableCell>
                        <div className="text-xs font-semibold text-foreground">
                          {app.invoice?.virtualBankName || "Official LGA Collection Bank"}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {app.invoice?.virtualAccountNumber || "—"}
                        </div>
                      </TableCell>

                      {/* 4. Expected vs Received (Underpayment Flagging) */}
                      <TableCell>
                        <div className="text-xs">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold block">
                            Expected: {money(expectedFee)}
                          </span>
                          {isUnderpaid ? (
                            <span className="font-bold text-rose-600 block">
                              Settled: {money(receivedAmount)}
                            </span>
                          ) : confirmed ? (
                            <span className="font-bold text-emerald-700 block">
                              Received: {money(receivedAmount || expectedFee)}
                            </span>
                          ) : (
                            <span className="font-medium text-amber-600 block">
                              {receivedAmount > 0 ? `Claimed: ${money(receivedAmount)}` : "Awaiting Bank Settlement"}
                            </span>
                          )}
                        </div>
                        {isUnderpaid ? (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5 mt-1 block w-fit font-bold">
                            ⚠️ Underpayment: -{money(shortfall)}
                          </Badge>
                        ) : confirmed ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] py-0 px-1.5 mt-1 block w-fit font-semibold">
                            ✓ Full Settlement
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 mt-1 block w-fit font-medium text-amber-700 border-amber-300 bg-amber-500/10">
                            Pending Bank Settlement
                          </Badge>
                        )}
                      </TableCell>

                      {/* 5. Transaction Ref */}
                      <TableCell>
                        <div className="text-xs font-mono font-medium text-foreground truncate max-w-[150px]">
                          {p?.reference || "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {p?.gatewayRef ? `Gateway Ref: ${p.gatewayRef}` : "Direct Static Transfer"}
                        </div>
                      </TableCell>

                      {/* 6. Payment Evidence */}
                      <TableCell>
                        {p?.proofUrl ? (
                          <a
                            href={p.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-semibold text-xs flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" /> View Proof
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">
                            Claim Logged (&quot;I Have Paid&quot;)
                          </span>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          {date(p?.proofUploadedAt || p?.createdAt)}
                        </div>
                      </TableCell>

                      {/* 7. Verification Status */}
                      <TableCell>
                        <div className="space-y-1">
                          {confirmed ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 gap-1 text-[11px] font-semibold">
                              <CheckCircle2 className="h-3 w-3" /> Payment Confirmed
                            </Badge>
                          ) : rejected ? (
                            <Badge variant="destructive" className="gap-1 text-[11px]">
                              <XCircle className="h-3 w-3" /> Payment Rejected
                            </Badge>
                          ) : subAdminApproved ? (
                            <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 gap-1 text-[11px] font-semibold">
                              <ShieldCheck className="h-3 w-3" /> Sub-Admin Verified
                            </Badge>
                          ) : correctionRequested ? (
                            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 gap-1 text-[11px] font-semibold">
                              <AlertTriangle className="h-3 w-3" /> Correction Requested
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-amber-700 border-amber-300 bg-amber-500/10 font-semibold gap-1">
                              <Clock className="h-3 w-3" /> Pending Verification
                            </Badge>
                          )}
                          {rejected && app.declineReason && (
                            <p className="text-[11px] text-destructive max-w-[160px] truncate" title={app.declineReason}>
                              {app.declineReason}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* 8. Actions */}
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* Live GPay / Bank Audit Button */}
                          {p && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenGPayAudit(app)}
                              className="text-xs h-8 gap-1 border-blue-400 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 font-semibold"
                            >
                              <Landmark className="h-3.5 w-3.5" />
                              Audit Payment
                            </Button>
                          )}

                          {canReview && (
                            <>
                              {/* Sub-Admin First-Level Verification */}
                              {(isSubAdmin || (!subAdminApproved && isFinalTreasurer)) && !subAdminApproved && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  disabled={busy}
                                  onClick={() => handleSubAdminReview(app, "approve")}
                                  className="text-xs h-8 gap-1 bg-primary text-primary-foreground font-semibold"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  1st Review Approve
                                </Button>
                              )}

                              {/* Treasurer Final Confirm & Receipt Issuance */}
                              {isFinalTreasurer && (
                                <Button
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => {
                                    if (isUnderpaid) {
                                      handleOpenGPayAudit(app);
                                    } else {
                                      review(app);
                                    }
                                  }}
                                  className={`text-xs h-8 gap-1 text-white font-semibold ${
                                    isUnderpaid
                                      ? "bg-amber-600 hover:bg-amber-700"
                                      : "bg-emerald-600 hover:bg-emerald-700"
                                  }`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {isUnderpaid ? "Check Underpayment" : "Confirm & Receipt"}
                                </Button>
                              )}

                              {/* Reject Payment Button */}
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busy}
                                onClick={() => {
                                  setDeclining(app);
                                  setReason(
                                    isUnderpaid
                                      ? `Underpayment: Transferred ${money(receivedAmount)} instead of statutory fee ${money(expectedFee)} (Shortfall: ${money(shortfall)})`
                                      : "",
                                  );
                                }}
                                className="text-xs h-8"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
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
          LIVE GPAY / BANK SETTLEMENT AUDIT MODAL
         ============================================================ */}
      <Dialog
        open={!!auditApp}
        onOpenChange={(open) => {
          if (!open && !busy) setAuditApp(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Bank Settlement Audit
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Direct audit against council bank settlement ledger &amp; designated collection accounts.
                </p>
              </div>
            </div>
          </DialogHeader>

          {auditLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Connecting to banking settlement ledger &amp; auditing records...
              </p>
            </div>
          ) : auditData ? (
            <div className="space-y-4 pt-1">
              {/* Alert Status Banner */}
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

              {/* Settlement Breakdown Cards */}
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

              {/* Audit Details Table */}
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

              {/* Underpayment Override Checkbox for Authorized Treasurer */}
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
          ) : null}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setAuditApp(null)}
              className="text-xs"
            >
              Close
            </Button>

            {auditApp && (
              <>
                {/* Reject Button from Audit Modal */}
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    const app = auditApp;
                    setAuditApp(null);
                    setDeclining(app);
                    setReason(
                      auditData?.isUnderpayment
                        ? `Underpayment: Received ${money(auditData.settledAmount)} instead of statutory fee ${money(auditData.expectedAmount)} (Shortfall: ${money(auditData.shortfall)})`
                        : "No matching bank settlement record found for this transaction claim",
                    );
                  }}
                  className="text-xs"
                >
                  Reject Claim
                </Button>

                {/* Sub-Admin First Review Approval */}
                {isSubAdmin && (
                  <Button
                    size="sm"
                    disabled={busy || (auditData?.isUnderpayment && !overrideUnderpayment)}
                    onClick={() => handleSubAdminReview(auditApp, "approve")}
                    className="text-xs bg-primary text-primary-foreground font-semibold"
                  >
                    1st Review Approve
                  </Button>
                )}

                {/* Treasurer Final Confirm & Receipt */}
                {isFinalTreasurer && (
                  <Button
                    size="sm"
                    disabled={
                      busy ||
                      (auditData?.isUnderpayment && !overrideUnderpayment) ||
                      (!auditData?.foundInGateway && !overrideUnderpayment)
                    }
                    onClick={() => review(auditApp, undefined, overrideUnderpayment)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {busy ? "Confirming..." : "Final Confirm & Issue Receipt"}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
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
      )}
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
