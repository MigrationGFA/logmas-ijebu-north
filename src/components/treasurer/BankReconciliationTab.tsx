/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * Bank reconciliation, read from GET /treasurer/reconciliation.
 *
 * This tab previously computed its figures from a localStorage mock
 * store of invented applications, displayed a hardcoded settlement
 * account number, and its "Auto-Match Gateway Feed" button simply
 * toasted that reconciliation had matched a bank feed it never called.
 * Every figure below now comes from the server's reconciliation report:
 * invoices issued, amounts collected against them, what is still
 * outstanding, and the variance. There is no run/export button, because
 * there is no such action on the backend; the report itself is the
 * reconciliation.
 */
import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  FileText,
  Scale,
} from "lucide-react";
import { useReconciliation } from "@/hooks/queries/useTreasurer";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

function statusBadge(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "paid" || s === "confirmed" || s === "settled") {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[10px]">
        Settled
      </Badge>
    );
  }
  if (s === "partially_paid" || s === "partial") {
    return (
      <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 text-[10px]">
        Part Paid
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px]">
      Outstanding
    </Badge>
  );
}

export default function BankReconciliationTab() {
  const { useGetReconciliation } = useReconciliation();
  const { data, isLoading, error, refetch } = useGetReconciliation({
    page: 1,
    limit: 50,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const invoices = useMemo(() => data?.data ?? [], [data]);
  const summary = data?.summary;

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.application.fullName.toLowerCase().includes(q) ||
        inv.application.service.name.toLowerCase().includes(q),
    );
  }, [invoices, searchQuery]);

  if (isLoading) return <TableSkeleton rows={8} cols={6} />;
  if (error) {
    return (
      <ErrorState
        title="Could not load the reconciliation report"
        error={error as Error}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row: server summary only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <div className="text-xs text-muted-foreground font-medium">Total Collected</div>
          <div className="text-xl sm:text-2xl font-bold font-mono break-words text-emerald-600 dark:text-emerald-400 mt-1">
            ₦{(summary?.totalCollected ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600/80 flex items-center gap-1 mt-1">
            <CheckCircle2 className="h-3 w-3" /> Confirmed against invoices
          </div>
        </Card>

        <Card className="p-4 bg-amber-500/10 border-amber-500/20">
          <div className="text-xs text-muted-foreground font-medium">Total Outstanding</div>
          <div className="text-xl sm:text-2xl font-bold font-mono break-words text-amber-600 dark:text-amber-400 mt-1">
            ₦{(summary?.totalOutstanding ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-600/80 flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" /> Unpaid balance on issued invoices
          </div>
        </Card>

        <Card className="p-4 bg-blue-500/10 border-blue-500/20">
          <div className="text-xs text-muted-foreground font-medium">Total Invoiced</div>
          <div className="text-xl sm:text-2xl font-bold font-mono break-words text-blue-600 dark:text-blue-400 mt-1">
            ₦{(summary?.totalInvoiced ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-blue-600/80 flex items-center gap-1 mt-1">
            <FileText className="h-3 w-3" /> {summary?.invoiceCount ?? 0} invoices in period
          </div>
        </Card>

        <Card className="p-4 bg-purple-500/10 border-purple-500/20">
          <div className="text-xs text-muted-foreground font-medium">Variance</div>
          <div className="text-xl sm:text-2xl font-bold font-mono break-words text-purple-600 dark:text-purple-400 mt-1">
            ₦{(summary?.variance ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-purple-600/80 flex items-center gap-1 mt-1">
            <Scale className="h-3 w-3" /> Invoiced minus collected and outstanding
          </div>
        </Card>
      </div>

      {/* Invoice-level reconciliation table */}
      <Card className="p-5 bg-gradient-card border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Invoice Reconciliation
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data?.period
                ? `Period ${new Date(data.period.from).toLocaleDateString("en-GB")} to ${new Date(data.period.to).toLocaleDateString("en-GB")}. `
                : ""}
              Each row is one invoice from the live register, with the
              payments confirmed against it.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice, applicant, service"
              className="h-9 w-56 text-xs"
            />
            <Button onClick={() => void refetch()} variant="outline" size="sm" className="text-xs gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Invoice</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Invoiced (₦)</TableHead>
                <TableHead>Collected (₦)</TableHead>
                <TableHead>Outstanding (₦)</TableHead>
                <TableHead>Payments</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground text-xs">
                    No invoices in this period yet. Issued invoices and the
                    payments confirmed against them will appear here.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {inv.invoiceNumber}
                      <div className="text-[10px] font-normal text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{inv.application.fullName}</div>
                      <div className="text-[10px] text-muted-foreground">{inv.application.applicationNumber}</div>
                    </TableCell>
                    <TableCell className="text-xs">{inv.application.service.name}</TableCell>
                    <TableCell className="font-mono text-xs">₦{inv.invoiceAmount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono font-bold text-xs text-emerald-600">
                      ₦{inv.totalCollected.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-amber-600">
                      ₦{inv.outstanding.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {inv.confirmedPaymentCount}/{inv.paymentCount} confirmed
                      {inv.virtualAccount?.accountNumber ? (
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {inv.virtualAccount.bankName || "Virtual account"} {inv.virtualAccount.accountNumber}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">{statusBadge(inv.paymentStatus)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
