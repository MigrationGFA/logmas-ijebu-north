"use client";

import { LGA_CONFIG } from "@/config/lga.config";
import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertTriangle,
  Landmark,
  Loader2,
  Copy,
  ArrowRight,
  RefreshCw,
  Search,
  Building2,
  Receipt,
  FileCheck2,
  Check,
  CreditCard,
  Layers,
  ArrowDownLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useGPayHub } from "@/hooks/queries/useTreasurer";
import { type GPayTransactionItem } from "@/services/apiTreasurer";
import Link from "next/link";

const money = (v: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(Number(v || 0));

const formatDate = (v?: string | null) =>
  v ? new Date(v).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }) : "—";

const LGA_REVENUE_ACCOUNTS = [
  {
    code: "DEMANDNOTIC",
    accountNumber: "9644698974",
    name: "Business Demand Notice",
    bank: "Official LGA Collection Bank",
    category: "Commercial Revenue",
  },
  {
    code: "STRTNAMNG",
    accountNumber: "9644698967",
    name: "Street Naming & Numbering",
    bank: "Official LGA Collection Bank",
    category: "Infrastructure",
  },
  {
    code: "COMDEVLEVY",
    accountNumber: "9644698950",
    name: "Community Development Levy",
    bank: "Official LGA Collection Bank",
    category: "Development",
  },
  {
    code: "ORIGINCER",
    accountNumber: "9644698943",
    name: "Certificate of Origin",
    bank: "Official LGA Collection Bank",
    category: "Statutory Registry",
  },
  {
    code: "MARRIAGEREG",
    accountNumber: "9644698936",
    name: "Marriage Registration",
    bank: "Official LGA Collection Bank",
    category: "Registry & Permits",
  },
  {
    code: "BAALEREGIS",
    accountNumber: "9644698929",
    name: "Baale & Community Leaders",
    bank: "Official LGA Collection Bank",
    category: "Traditional & Chieftaincy",
  },
];

interface GPayMonitoringHubProps {
  userRole?: string;
}

export function GPayMonitoringHub({ userRole = "treasurer" }: GPayMonitoringHubProps) {
  const isAuthorizedToSettle =
    userRole === "treasurer" ||
    userRole === "super_admin" ||
    userRole === "lga_admin" ||
    userRole === "sub_admin" ||
    userRole === "chairman";

  // Filter States
  const [activeTab, setActiveTab] = useState<"inflows" | "ledger" | "accounts">("inflows");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Settlement Modal State
  const [settleTx, setSettleTx] = useState<GPayTransactionItem | null>(null);
  const [targetAppId, setTargetAppId] = useState<string>("");
  const [customAppNumber, setCustomAppNumber] = useState<string>("");
  const [overrideUnderpayment, setOverrideUnderpayment] = useState<boolean>(false);
  const [settleRemarks, setSettleRemarks] = useState<string>("");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const { useGetTransactions, settleTransactionAsync, isSettling } = useGPayHub();

  const queryParams = useMemo(() => {
    const p: any = { page: 1, limit: 50 };
    if (selectedChannel !== "all") p.channel = selectedChannel;
    if (statusFilter !== "all") p.status = statusFilter;
    if (searchQuery.trim()) p.search = searchQuery.trim();
    if (fromDate) p.fromDate = fromDate;
    if (toDate) p.toDate = toDate;
    return p;
  }, [selectedChannel, statusFilter, searchQuery, fromDate, toDate]);

  const { data, isLoading, isFetching, refetch } = useGetTransactions(queryParams);

  const summary = data?.summary || {
    total_transactions: 0,
    total_volume: "0.00",
    total_settled: "0.00",
    by_status: {},
    by_channel: [],
  };

  const transactions = data?.transactions || [];
  const awaitingApps = data?.awaitingApplications || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    toast.success("Reference copied");
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleOpenSettleModal = (tx: GPayTransactionItem) => {
    setSettleTx(tx);
    if (tx.lgaMatch?.applicationId) {
      setTargetAppId(tx.lgaMatch.applicationId);
      setCustomAppNumber(tx.lgaMatch.applicationNumber || "");
    } else {
      setTargetAppId("");
      setCustomAppNumber("");
    }
    setOverrideUnderpayment(false);
    setSettleRemarks("");
  };

  const handleExecuteSettlement = async () => {
    if (!settleTx) return;
    try {
      await settleTransactionAsync({
        gpayReference: settleTx.gpay_reference,
        applicationId: targetAppId || undefined,
        applicationNumber: !targetAppId && customAppNumber ? customAppNumber.trim() : undefined,
        overrideUnderpayment,
        remarks: settleRemarks.trim() || undefined,
      });
      setSettleTx(null);
      refetch();
    } catch (e: any) {
      // Handled in mutation hook
    }
  };

  const selectedAppObj = awaitingApps.find((a) => a.id === targetAppId);
  const targetFee = Number(
    selectedAppObj?.amount || settleTx?.lgaMatch?.expectedAmount || 0
  );
  const receivedAmount = Number(settleTx?.settled_amount || settleTx?.amount || 0);
  const isUnderpaid = targetFee > 0 && receivedAmount < targetFee;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* 1. Header with Refresh Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" />
            Direct Bank Inflows &amp; Settlements
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Monitor verified bank transfers credited to official {LGA_CONFIG.identity.name} LGA revenue accounts and reconcile them with citizen applications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5 bg-background shadow-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`}
            />
            {isFetching ? "Refreshing..." : "Refresh Records"}
          </Button>
        </div>
      </div>

      {/* 2. Key Performance Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Inflows Recorded */}
        <Card className="p-5 bg-card border border-border/70 rounded-xl shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground">
              {summary.total_transactions} Records
            </Badge>
          </div>
          <div className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {money(summary.total_volume)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total Inflow Recorded
          </div>
        </Card>

        {/* Card 2: Verified Bank Revenue */}
        <Card className="p-5 bg-card border border-border/70 rounded-xl shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-[11px] font-medium border-emerald-200/50">
              {summary.by_status?.success || 0} Settled
            </Badge>
          </div>
          <div className="mt-4 text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            {money(summary.total_settled)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Verified Bank Revenue
          </div>
        </Card>

        {/* Card 3: Banking Charges */}
        <Card className="p-5 bg-card border border-border/70 rounded-xl shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground">
              ₦0.50 / tx
            </Badge>
          </div>
          <div className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {money(Number(summary.by_status?.success || 0) * 0.5)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Statutory Processing Fees
          </div>
        </Card>

        {/* Card 4: Official Revenue Accounts */}
        <Card className="p-5 bg-card border border-border/70 rounded-xl shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-[11px] font-medium text-blue-700 dark:text-blue-400 border-blue-200">
              Active
            </Badge>
          </div>
          <div className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            6 Accounts
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Designated LGA Revenue Heads
          </div>
        </Card>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/70">
        <button
          type="button"
          onClick={() => setActiveTab("inflows")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "inflows"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          All Inflows &amp; Transactions
          <Badge variant="secondary" className="text-[10px] ml-1">
            {summary.total_transactions}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "ledger"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Settlement Ledger
          <Badge variant="secondary" className="text-[10px] ml-1">
            {summary.by_status?.success || 0}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("accounts")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "accounts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          LGA Revenue Accounts
        </button>
      </div>

      {/* 4. TAB 1: ALL INFLOWS & TRANSACTIONS */}
      {activeTab === "inflows" && (
        <Card className="p-5 border border-border/70 shadow-xs space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-4 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search payer name, service, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs bg-background"
              />
            </div>

            <div className="md:col-span-2">
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className="text-xs bg-background">
                  <SelectValue placeholder="All Payment Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Types</SelectItem>
                  <SelectItem value="PROVIDUS_RESERVED">Bank Transfer</SelectItem>
                  <SelectItem value="MASTERCARD">Card Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Credited / Settled</SelectItem>
                  <SelectItem value="pending">Pending Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs bg-background"
                title="From Date"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs bg-background"
                title="To Date"
              />
            </div>

            <div className="md:col-span-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSelectedChannel("all");
                  setFromDate("");
                  setToDate("");
                }}
                className="w-full text-xs"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-border/70 overflow-x-auto w-full max-w-full">
            <Table className="text-xs">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-[11px] font-bold text-foreground py-3">DATE &amp; TIME</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">PAYER DETAILS</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">REVENUE SERVICE</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">PAYMENT TYPE</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">AMOUNT</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">STATUS</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">RECONCILIATION</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading payment inflows...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                      No payment inflows found matching the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx: GPayTransactionItem) => {
                    const isSuccess = tx.status === "success" || tx.status === "SUCCESS";
                    const isBankTransfer =
                      tx.channel?.code === "PROVIDUS_RESERVED" ||
                      tx.channel?.code === "PROVIDUS_DVA" ||
                      tx.account_number?.startsWith("9644698");
                    const isCard =
                      tx.channel?.code === "MASTERCARD" ||
                      tx.channel?.category === "Card Gateway";

                    const isMatched = tx.lgaMatch?.isMatched;
                    const isPotential = tx.lgaMatch?.isPotentialMatch;
                    const payerName =
                      tx.payer_details?.source_account_name ||
                      tx.customer?.name ||
                      "Direct Payer";
                    const sourceBank = tx.payer_details?.source_bank_name;

                    return (
                      <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                        {/* 1. Date */}
                        <TableCell className="whitespace-nowrap font-medium text-foreground">
                          {formatDate(tx.created_at)}
                        </TableCell>

                        {/* 2. Payer Details */}
                        <TableCell>
                          <div className="font-semibold text-foreground">{payerName}</div>
                          {sourceBank ? (
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Landmark className="h-3 w-3 text-muted-foreground/70" />
                              {sourceBank}
                            </div>
                          ) : (
                            <div className="text-[11px] text-muted-foreground font-mono">
                              Ref: {tx.gpay_reference.slice(0, 18)}...
                            </div>
                          )}
                        </TableCell>

                        {/* 3. Revenue Service */}
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {tx.service_name || "General Revenue"}
                          </div>
                          {tx.account_number && (
                            <div className="text-[11px] text-muted-foreground font-mono">
                              Acct: {tx.account_number}
                            </div>
                          )}
                        </TableCell>

                        {/* 4. Payment Type */}
                        <TableCell>
                          {isBankTransfer ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-semibold">
                              Bank Transfer
                            </Badge>
                          ) : isCard ? (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-[10px] font-semibold">
                              Card Payment
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Online Inflow
                            </Badge>
                          )}
                        </TableCell>

                        {/* 5. Amount */}
                        <TableCell className="font-bold text-foreground whitespace-nowrap">
                          {money(tx.settled_amount || tx.amount)}
                        </TableCell>

                        {/* 6. Status */}
                        <TableCell>
                          {isSuccess ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] border-emerald-200">
                              Credited
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] border-amber-200">
                              Pending
                            </Badge>
                          )}
                        </TableCell>

                        {/* 7. Reconciliation Link */}
                        <TableCell>
                          {isMatched ? (
                            <div className="space-y-0.5">
                              <Badge className="bg-emerald-600 text-white text-[10px] font-medium">
                                Linked: {tx.lgaMatch?.applicationNumber}
                              </Badge>
                              {tx.lgaMatch?.receiptNumber && (
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  Rcpt: {tx.lgaMatch.receiptNumber}
                                </div>
                              )}
                            </div>
                          ) : isPotential ? (
                            <Badge variant="outline" className="text-[10px] font-medium text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300">
                              Suggested: {tx.lgaMatch?.applicationNumber}
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              Unreconciled
                            </span>
                          )}
                        </TableCell>

                        {/* 8. Action */}
                        <TableCell className="text-right whitespace-nowrap">
                          {isAuthorizedToSettle && isSuccess ? (
                            <Button
                              size="sm"
                              variant={isMatched ? "outline" : "default"}
                              onClick={() => handleOpenSettleModal(tx)}
                              className="h-7 text-xs px-2.5 font-medium gap-1"
                            >
                              {isMatched ? (
                                "View Link"
                              ) : (
                                <>
                                  Reconcile
                                  <ArrowRight className="h-3 w-3 ml-0.5" />
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(tx.gpay_reference)}
                              className="h-7 text-xs px-2 text-muted-foreground"
                              title="Copy Reference"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* 5. TAB 2: SETTLEMENT LEDGER */}
      {activeTab === "ledger" && (
        <Card className="p-5 border border-border/70 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Verified Bank Settlement Records
              </h3>
              <p className="text-xs text-muted-foreground">
                Summary of funds successfully credited to {LGA_CONFIG.identity.name} LGA official bank accounts.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {money(summary.total_settled)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Total Net Revenue Credited
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 overflow-x-auto w-full max-w-full">
            <Table className="text-xs">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-[11px] font-bold text-foreground">DATE &amp; TIME</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">PAYER</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">REVENUE SERVICE</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">GROSS AMOUNT</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">FEE DEDUCTED</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">NET CREDITED</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground">RECONCILIATION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions
                  .filter((t: GPayTransactionItem) => t.status === "success" || t.status === "SUCCESS")
                  .map((tx: GPayTransactionItem) => (
                    <TableRow key={tx.id} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap font-medium text-foreground">
                        {formatDate(tx.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          {tx.payer_details?.source_account_name || tx.customer?.name || "Direct Transfer"}
                        </div>
                        {tx.payer_details?.source_bank_name && (
                          <div className="text-[11px] text-muted-foreground">
                            {tx.payer_details.source_bank_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.service_name || "Demand Notice"}
                      </TableCell>
                      <TableCell className="font-bold text-foreground">
                        {money(tx.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        ₦0.50
                      </TableCell>
                      <TableCell className="font-bold text-emerald-700 dark:text-emerald-400">
                        {money(tx.settled_amount || Number(tx.amount) - 0.5)}
                      </TableCell>
                      <TableCell>
                        {tx.lgaMatch?.isMatched ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            {tx.lgaMatch.applicationNumber}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenSettleModal(tx)}
                            className="h-6 text-[11px] px-2"
                          >
                            Reconcile
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* 6. TAB 3: DESIGNATED LGA REVENUE ACCOUNTS */}
      {activeTab === "accounts" && (
        <Card className="p-5 border border-border/70 shadow-xs space-y-4">
          <div className="pb-3 border-b border-border/60">
            <h3 className="text-base font-bold text-foreground">
              Official LGA Revenue Bank Accounts
            </h3>
            <p className="text-xs text-muted-foreground">
              Permanent dedicated collection accounts assigned to each statutory revenue department of Ifo Local Government.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LGA_REVENUE_ACCOUNTS.map((acc) => (
              <Card key={acc.code} className="p-4 bg-muted/20 border border-border/60 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                    {acc.category}
                  </Badge>
                </div>

                <div>
                  <div className="font-bold text-sm text-foreground">{acc.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{acc.bank}</div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Account Number</div>
                    <div className="font-mono font-bold text-base text-foreground tracking-wider">
                      {acc.accountNumber}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(acc.accountNumber)}
                    className="h-8 px-2 text-xs text-primary gap-1"
                  >
                    {copiedRef === acc.accountNumber ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* 7. RECONCILE / SETTLE PAYMENT MODAL */}
      <Dialog open={!!settleTx} onOpenChange={(open) => !open && setSettleTx(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FileCheck2 className="h-5 w-5 text-primary" />
              Reconcile Bank Payment with Citizen Application
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm that funds received in the LGA bank account correspond to an application and issue an official revenue receipt.
            </DialogDescription>
          </DialogHeader>

          {settleTx && (
            <div className="space-y-4 py-2">
              {/* Payment Summary Box */}
              <div className="rounded-xl bg-muted/40 border border-border/60 p-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Bank Payment Details</span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                    Credited Inflow
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Payer Name:</span>
                    <div className="font-semibold text-foreground">
                      {settleTx.payer_details?.source_account_name ||
                        settleTx.customer?.name ||
                        "Direct Payer"}
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Originating Bank:</span>
                    <div className="font-semibold text-foreground">
                      {settleTx.payer_details?.source_bank_name || "NIP Transfer"}
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Amount Received:</span>
                    <div className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                      {money(settleTx.settled_amount || settleTx.amount)}
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Revenue Head:</span>
                    <div className="font-semibold text-foreground">
                      {settleTx.service_name || "Demand Notice"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Link Application Selection */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-foreground">
                  Select Citizen Application to Reconcile
                </Label>

                {awaitingApps.length > 0 ? (
                  <Select value={targetAppId} onValueChange={setTargetAppId}>
                    <SelectTrigger className="text-xs bg-background">
                      <SelectValue placeholder="Choose an application awaiting payment..." />
                    </SelectTrigger>
                    <SelectContent>
                      {awaitingApps.map((app) => (
                        <SelectItem key={app.id} value={app.id} className="text-xs">
                          {app.applicationNumber} — {app.citizenName} ({app.serviceName || "Service"} • {money(app.amount || 0)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    No applications currently awaiting payment. You can enter an application number manually below.
                  </div>
                )}

                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground">
                    Or Enter Application Number Directly:
                  </Label>
                  <Input
                    placeholder="e.g. APP-2026-4802EB"
                    value={customAppNumber}
                    onChange={(e) => {
                      setCustomAppNumber(e.target.value);
                      if (e.target.value) setTargetAppId("");
                    }}
                    className="text-xs font-mono mt-1"
                  />
                </div>
              </div>

              {/* Underpayment Check & Exception Authorization */}
              {isUnderpaid && (
                <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <AlertTitle className="text-xs font-bold">
                    Fee Difference Detected
                  </AlertTitle>
                  <AlertDescription className="text-xs mt-1 space-y-2">
                    <p>
                      The amount received (<strong>{money(receivedAmount)}</strong>) is less than the statutory fee (<strong>{money(targetFee)}</strong>).
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer pt-1 font-semibold text-foreground">
                      <input
                        type="checkbox"
                        checked={overrideUnderpayment}
                        onChange={(e) => setOverrideUnderpayment(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>Authorize administrative approval for this payment amount</span>
                    </label>
                  </AlertDescription>
                </Alert>
              )}

              {/* Officer Notes */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Officer Remarks / Audit Notes (Optional)
                </Label>
                <Textarea
                  placeholder="e.g. Verified via bank inflow statement. Approved for certificate processing."
                  value={settleRemarks}
                  onChange={(e) => setSettleRemarks(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettleTx(null)}
              disabled={isSettling}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteSettlement}
              disabled={isSettling || (!targetAppId && !customAppNumber.trim()) || (isUnderpaid && !overrideUnderpayment)}
              className="text-xs font-semibold gap-1.5"
            >
              {isSettling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Payment &amp; Issue Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
