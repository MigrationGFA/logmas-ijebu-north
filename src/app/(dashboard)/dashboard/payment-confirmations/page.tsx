"use client";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAwaitingConfirmation } from "@/hooks/queries/useTreasurer";
import type { AwaitingConfirmationApplication } from "@/services/apiTreasurer";
const date = (v?: string | null) => v ? new Date(v).toLocaleString("en-NG") : "—";
const money = (v: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(v));
export default function PaymentConfirmationsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [declining, setDeclining] = useState<AwaitingConfirmationApplication | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const { useGetAwaitingConfirmation, confirmPaymentAsync, declinePaymentAsync } = useAwaitingConfirmation();
  const { data, isLoading, isFetching, error, refetch } = useGetAwaitingConfirmation({ page, limit: 25, status });
  async function review(app: AwaitingConfirmationApplication, rejection?: string) {
    const payment = app.invoice?.payments[0];
    if (!payment) return;
    setBusy(true);
    try {
      if (rejection) await declinePaymentAsync({ paymentId: payment.id, reason: rejection });
      else await confirmPaymentAsync(payment.id);
      setDeclining(null); setReason(""); await refetch();
    } catch { /* The mutation displays the server error. */ }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <PageHeader title="Payment Confirmations" subtitle="Review citizen and field-officer transfer proofs, including confirmed and rejected payment history."
      action={<Button variant="outline" onClick={() => refetch()} disabled={isFetching}>{isFetching ? "Refreshing…" : "Refresh"}</Button>} />
    <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
      <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
      <SelectContent>{[["all", "All payments"], ["pending", "Pending review"], ["confirmed", "Confirmed"], ["rejected", "Rejected"]].map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}</SelectContent>
    </Select>
    {error ? <Card className="p-6 text-destructive">Unable to load payments. Please try refreshing.</Card> :
      <Card className="overflow-x-auto bg-gradient-card border-border/40"><Table>
        <TableHeader><TableRow>{["Application / Service", "Applicant / Submitted by", "Destination account", "Amount / Reference", "Proof uploaded", "Status / Payment date", "Actions"].map((v) => <TableHead key={v}>{v}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{isLoading ? <TableRow><TableCell colSpan={7}>Loading payment history…</TableCell></TableRow> : !data?.data.length ? <TableRow><TableCell colSpan={7}>No payments match this filter.</TableCell></TableRow> : data.data.map((app) => {
          const p = app.invoice?.payments[0];
          const rejected = p?.matchStatus === "rejected";
          const confirmed = p?.status === "confirmed";
          const canReview = !confirmed && !rejected && app.status === "awaiting_payment_confirmation" && !!p?.proofUrl;
          return <TableRow key={app.id}>
            <TableCell>{app.applicationNumber}<div className="text-xs">{app.service.name}</div><div className="text-xs">Applied: {date(app.createdAt)}</div></TableCell>
            <TableCell>{app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : app.fullName || "—"}<div className="text-xs">{app.createdBy ? `${app.createdBy.firstName} ${app.createdBy.lastName} (${app.createdBy.role})` : "Self-service"}</div></TableCell>
            <TableCell>{app.invoice?.virtualBankName || "—"}<div className="font-mono">{app.invoice?.virtualAccountNumber || "—"}</div></TableCell>
            <TableCell>{money(p?.amount ?? 0)}<div className="text-xs font-mono">{p?.reference}</div></TableCell>
            <TableCell>{p?.proofUrl ? <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-primary underline">View proof</a> : "Awaiting proof"}<div className="text-xs">{date(p?.proofUploadedAt)}</div></TableCell>
            <TableCell><Badge variant="outline">{confirmed ? "Confirmed" : rejected ? "Rejected" : p?.proofUrl ? "Pending review" : "Awaiting proof"}</Badge><div className="text-xs">{date(p?.confirmedAt)}</div>{rejected && <p className="text-xs text-destructive">{app.declineReason}</p>}</TableCell>
            <TableCell>{canReview ? <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => review(app)}>Confirm</Button><Button size="sm" variant="destructive" disabled={busy} onClick={() => { setDeclining(app); setReason(""); }}>Reject</Button></div> : "—"}</TableCell>
          </TableRow>;
        })}</TableBody>
      </Table></Card>}
    {data?.meta && <div className="flex justify-between items-center"><p className="text-sm">{data.meta.total} applications · Page {page} of {Math.max(1, data.meta.totalPages)}</p><div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={page >= data.meta.totalPages || isFetching} onClick={() => setPage(page + 1)}>Next</Button></div></div>}
    <Dialog open={!!declining} onOpenChange={(open) => { if (!open && !busy) setDeclining(null); }}><DialogContent><DialogHeader><DialogTitle>Reject payment proof</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Explain the problem. The proof remains available in payment history.</p><Textarea aria-label="Rejection reason" value={reason} onChange={(e) => setReason(e.target.value)} /><DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeclining(null)}>Cancel</Button><Button variant="destructive" disabled={!reason.trim() || busy} onClick={() => declining && review(declining, reason.trim())}>{busy ? "Saving…" : "Reject proof"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
