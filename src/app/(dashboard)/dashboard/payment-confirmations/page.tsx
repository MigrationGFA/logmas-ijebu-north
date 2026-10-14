"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Banknote,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  useAwaitingConfirmation,
} from "@/hooks/queries/useTreasurer";
import type { AwaitingConfirmationApplication } from "@/services/apiTreasurer";

function formatNgn(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** The freshest payment on the invoice — the one the treasurer acts on. */
function latestPayment(app: AwaitingConfirmationApplication) {
  return app.invoice?.payments?.[0] ?? null;
}

export default function PaymentConfirmationsPage() {
  const [page, setPage] = useState(1);
  const { useGetAwaitingConfirmation, confirmPaymentAsync, declinePaymentAsync } =
    useAwaitingConfirmation();
  const { data, isLoading, isFetching, refetch } = useGetAwaitingConfirmation({
    page,
    limit: 25,
  });

  const [declining, setDeclining] = useState<AwaitingConfirmationApplication | null>(
    null,
  );
  const [declineReason, setDeclineReason] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [submittingDecline, setSubmittingDecline] = useState(false);

  const items = data?.data ?? [];
  const meta = data?.meta;

  const handleConfirm = async (app: AwaitingConfirmationApplication) => {
    const payment = latestPayment(app);
    if (!payment) return;
    setConfirmingId(payment.id);
    try {
      await confirmPaymentAsync(payment.id);
      await refetch();
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDecline = async () => {
    const payment = declining ? latestPayment(declining) : null;
    if (!payment || !declineReason.trim()) return;
    setSubmittingDecline(true);
    try {
      await declinePaymentAsync({
        paymentId: payment.id,
        reason: declineReason.trim(),
      });
      setDeclining(null);
      setDeclineReason("");
      await refetch();
    } finally {
      setSubmittingDecline(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Confirmations"
        subtitle="Bank-transfer payments made by field officers — verify the proof, then confirm or decline"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1.5" />
            )}
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <Card className="p-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No payments awaiting confirmation</p>
          <p className="text-sm text-muted-foreground mt-1">
            Field-officer bank-transfer payments will appear here for review.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((app) => {
            const payment = latestPayment(app);
            const proofUploaded = Boolean(payment?.proofUrl);

            return (
              <Card key={app.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{app.applicationNumber}</span>
                      <Badge variant="outline">{app.service.name}</Badge>
                      {payment?.status === "confirmed" ? (
                        <Badge className="bg-green-600/15 text-green-700 dark:text-green-400">
                          Confirmed
                        </Badge>
                      ) : proofUploaded ? (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          Proof uploaded
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Awaiting proof</Badge>
                      )}
                    </div>
                    <p className="text-sm">
                      {app.fullName}
                      {app.email ? ` · ${app.email}` : ""}
                      {app.phone ? ` · ${app.phone}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(app.createdAt)}
                      {app.createdBy
                        ? ` by ${app.createdBy.firstName} ${app.createdBy.lastName} (${app.createdBy.role})`
                        : ""}
                    </p>
                    {payment?.reference && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Transfer ref: {payment.reference}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-2 shrink-0">
                    <p className="text-lg font-bold">
                      {formatNgn(payment?.amount ?? app.invoice?.amount ?? 0)}
                    </p>
                    <div className="flex gap-2 justify-end">
                      {payment?.proofUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={payment.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-1.5" />
                            View proof
                          </a>
                        </Button>
                      )}
                      {payment && payment.status !== "confirmed" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={!proofUploaded || confirmingId === payment.id}
                            onClick={() => handleConfirm(app)}
                          >
                            {confirmingId === payment.id ? (
                              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            )}
                            Confirm payment
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={confirmingId === payment.id}
                            onClick={() => setDeclining(app)}
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}


          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages} · {meta.total} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={!!declining}
        onOpenChange={(open) => {
          if (!open) {
            setDeclining(null);
            setDeclineReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Decline payment proof
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The application will be declined with this reason, and the
              citizen/field officer will be notified. They can resubmit a new
              payment afterwards.
            </p>
            <div>
              <Label htmlFor="decline-reason">Reason</Label>
              <Textarea
                id="decline-reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Transfer amount does not match the invoice"
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeclining(null);
                setDeclineReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!declineReason.trim() || submittingDecline}
              onClick={handleDecline}
            >
              {submittingDecline && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Decline application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

