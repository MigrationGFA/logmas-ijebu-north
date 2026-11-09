"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  Receipt,
  Building2,
  Calendar,
  Landmark,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useDemandNotices,
  useCancelDemandNotice,
  useResendDemandNotice,
} from "@/hooks/queries/useDemandNotices";
import { DemandNoticeRecord } from "@/services/apiDemandNotice";
import DemandNoticePrintModal from "@/components/demandNotice/DemandNoticePrintModal";
import IssueDemandNoticeModal from "@/components/demandNotice/IssueDemandNoticeModal";
import { LGA_CONFIG } from "@/config/lga.config";
import Link from "next/link";
import { toast } from "sonner";

export default function DemandNoticesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useDemandNotices({
    status: statusFilter !== "all" ? statusFilter : undefined,
    ward: wardFilter !== "all" ? wardFilter : undefined,
    search: searchTerm || undefined,
    page,
    limit: 25,
  });

  const notices = data?.notices || [];
  const metrics = data?.metrics || {
    totalIssued: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    totalOverdue: 0,
    totalCancelled: 0,
    totalAmountAssessed: 0,
    totalAmountCollected: 0,
  };

  // Modal States
  const [selectedNoticeForPrint, setSelectedNoticeForPrint] = useState<DemandNoticeRecord | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Cancellation Dialog State
  const [cancellingNotice, setCancellingNotice] = useState<DemandNoticeRecord | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const cancelMutation = useCancelDemandNotice();
  const resendMutation = useResendDemandNotice();

  const handleConfirmCancel = async () => {
    if (!cancellingNotice || !cancellationReason.trim()) return;
    await cancelMutation.mutateAsync({
      id: cancellingNotice.id,
      reason: cancellationReason.trim(),
    });
    setCancellingNotice(null);
    setCancellationReason("");
  };

  const handleExportCsv = () => {
    if (!notices.length) {
      toast.error("No demand notices to export");
      return;
    }

    const headers = [
      "Demand Notice Number",
      "Payer Name",
      "Payer Type",
      "Phone",
      "Email",
      "Ward",
      "Address",
      "Service Name",
      "Revenue Head",
      "Amount Payable",
      "Issued Date",
      "Due Date",
      "Status",
      "Providus Account",
      "Receipt Number",
    ];

    const rows = notices.map((n) => [
      `"${n.demandNoticeNumber}"`,
      `"${n.payerName}"`,
      `"${n.payerType}"`,
      `"${n.phone}"`,
      `"${n.email || ""}"`,
      `"${n.ward}"`,
      `"${n.address.replace(/"/g, '""')}"`,
      `"${n.serviceName}"`,
      `"${n.revenueHead}"`,
      n.amountPayable,
      `"${n.issuedDate}"`,
      `"${n.dueDate || ""}"`,
      `"${n.status}"`,
      `"${n.statutoryAccount?.accountNumber || ""}"`,
      `"${n.receiptNumber || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ifo_lga_demand_notices_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Demand notices exported successfully");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>{LGA_CONFIG.identity.name} Revenue Administration</span>
            <span>/</span>
            <span className="text-foreground font-medium">Demand Notices</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-700" />
            Statutory Demand Notices & Revenue Billing
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
            Create, issue, track, and reconcile formal demand notices for commercial businesses, tenements, and property owners with dedicated Providus Bank virtual account settlement.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isRefetching}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            onClick={handleExportCsv}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button
            onClick={() => setIsIssueModalOpen(true)}
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Issue Demand Notice
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-card shadow-xs border">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Issued
            </span>
            <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {metrics.totalIssued.toLocaleString()}
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              All active & historic
            </span>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200 shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid / Settled
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
              {metrics.totalPaid.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
              ₦{metrics.totalAmountCollected.toLocaleString()}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200 shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Payment Due
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
              {metrics.totalUnpaid.toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
              Awaiting transfer
            </span>
          </CardContent>
        </Card>

        <Card className="bg-red-50/50 border-red-200 shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wider block flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Overdue
            </span>
            <div className="text-xl sm:text-2xl font-black text-red-950 mt-1">
              {metrics.totalOverdue.toLocaleString()}
            </div>
            <span className="text-[10px] text-red-700 font-medium mt-0.5 block">
              Past 14-day window
            </span>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-xs border col-span-2">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Assessed Revenue Pipeline
            </span>
            <div className="text-lg sm:text-xl font-black text-foreground mt-1">
              ₦{metrics.totalAmountAssessed.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
              <span>Collection rate:</span>
              <span className="font-bold text-emerald-700">
                {metrics.totalAmountAssessed > 0
                  ? `${Math.round((metrics.totalAmountCollected / metrics.totalAmountAssessed) * 100)}%`
                  : "0%"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by notice #, payer, phone, ward..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="unpaid">Payment Due</SelectItem>
              <SelectItem value="paid">Settled / Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={wardFilter} onValueChange={setWardFilter}>
            <SelectTrigger className="h-9 text-xs w-[160px] bg-background">
              <SelectValue placeholder="All Wards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All 11 Wards</SelectItem>
              {LGA_CONFIG.wards.map((w) => (
                <SelectItem key={w.id} value={w.name}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Demand Notices Table */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs">
                <TableHead className="font-bold">Notice Reference</TableHead>
                <TableHead className="font-bold">Liable Entity & Location</TableHead>
                <TableHead className="font-bold">Revenue Head</TableHead>
                <TableHead className="font-bold">Amount Due</TableHead>
                <TableHead className="font-bold">Due Date</TableHead>
                <TableHead className="font-bold">Settlement Status</TableHead>
                <TableHead className="font-bold">Providus VA</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    Loading statutory demand notices...
                  </TableCell>
                </TableRow>
              ) : notices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    No demand notices found matching the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                notices.map((notice) => {
                  const isPaid = notice.status === "paid";
                  const isOverdue = notice.status === "overdue";
                  const isCancelled = notice.status === "cancelled";

                  return (
                    <TableRow key={notice.id} className="text-xs hover:bg-muted/30">
                      {/* Notice Number */}
                      <TableCell className="font-mono font-bold text-foreground">
                        <button
                          onClick={() => setSelectedNoticeForPrint(notice)}
                          className="hover:underline text-emerald-800 text-left font-mono"
                        >
                          {notice.demandNoticeNumber}
                        </button>
                        <span className="block text-[10px] text-muted-foreground font-sans">
                          Issued {new Date(notice.issuedDate).toLocaleDateString("en-GB")}
                        </span>
                      </TableCell>

                      {/* Liable Entity */}
                      <TableCell>
                        <strong className="block text-slate-900">{notice.payerName}</strong>
                        <span className="text-[11px] text-muted-foreground block truncate max-w-[200px]">
                          {notice.ward} · {notice.phone}
                        </span>
                      </TableCell>

                      {/* Revenue Head */}
                      <TableCell>
                        <span className="text-[11px] font-medium text-slate-700 block max-w-[180px] truncate">
                          {notice.serviceName}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]">
                          {notice.revenueHead}
                        </span>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="font-mono font-bold text-slate-900">
                        ₦{Number(notice.amountPayable || 0).toLocaleString()}
                      </TableCell>

                      {/* Due Date */}
                      <TableCell>
                        {notice.dueDate ? (
                          <span
                            className={`font-medium ${
                              isOverdue ? "text-red-700 font-bold" : "text-slate-700"
                            }`}
                          >
                            {new Date(notice.dueDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">14 Days</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isPaid ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-800 border-emerald-300 gap-1 font-semibold text-[10px]"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Settled
                          </Badge>
                        ) : isOverdue ? (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-800 border-red-300 gap-1 font-semibold text-[10px]"
                          >
                            <AlertCircle className="w-3 h-3 text-red-600" /> Overdue
                          </Badge>
                        ) : isCancelled ? (
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-600 border-slate-300 gap-1 font-semibold text-[10px]"
                          >
                            <XCircle className="w-3 h-3 text-slate-500" /> Cancelled
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-800 border-amber-300 gap-1 font-semibold text-[10px]"
                          >
                            <Clock className="w-3 h-3 text-amber-600" /> Payment Due
                          </Badge>
                        )}
                      </TableCell>

                      {/* Providus VA */}
                      <TableCell className="font-mono text-[11px]">
                        <span className="text-emerald-900 font-bold block">
                          {notice.statutoryAccount?.accountNumber || "9644698974"}
                        </span>
                        <span className="text-[10px] text-muted-foreground block font-sans">
                          Providus Bank
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            onClick={() => setSelectedNoticeForPrint(notice)}
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50"
                            title="View & Print Demand Notice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>

                          {notice.email && !isCancelled && (
                            <Button
                              onClick={() =>
                                resendMutation.mutate({ id: notice.id, email: notice.email || undefined })
                              }
                              size="sm"
                              variant="ghost"
                              disabled={resendMutation.isPending}
                              className="h-8 px-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                              title="Resend Notice Email Notification"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {isPaid && notice.invoiceId && (
                            <Button
                              asChild
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
                              title="View Payment Receipt"
                            >
                              <Link href={`/dashboard/receipts/${notice.invoiceId}`}>
                                <Receipt className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                          )}

                          {!isPaid && !isCancelled && (
                            <Button
                              onClick={() => setCancellingNotice(notice)}
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                              title="Cancel Notice"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Printable Modal */}
      <DemandNoticePrintModal
        notice={selectedNoticeForPrint}
        isOpen={!!selectedNoticeForPrint}
        onClose={() => setSelectedNoticeForPrint(null)}
      />

      {/* Issue Notice Modal */}
      <IssueDemandNoticeModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={(created) => {
          refetch();
          setSelectedNoticeForPrint(created);
        }}
      />

      {/* Cancellation Dialog */}
      <Dialog open={!!cancellingNotice} onOpenChange={(open) => !open && setCancellingNotice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-950 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-600" /> Cancel Statutory Demand Notice
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Are you sure you want to cancel notice{" "}
              <strong>{cancellingNotice?.demandNoticeNumber}</strong>? This action will void the notice and cancel the linked invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <label className="font-semibold text-slate-700">Reason for Cancellation</label>
            <Textarea
              placeholder="e.g. Assessment superseded by reassessment / Premises duplicate notice"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCancellingNotice(null)}>
              Dismiss
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!cancellationReason.trim() || cancelMutation.isPending}
              onClick={handleConfirmCancel}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
