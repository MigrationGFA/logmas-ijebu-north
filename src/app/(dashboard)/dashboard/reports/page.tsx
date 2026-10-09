"use client"
import { useMemo, useState } from "react";
import { PageHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Download,
  TrendingUp,
  Banknote,
  CreditCard,
  Wallet,
  Calendar,
  Loader2,
  ChevronDown,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useReportsOverview, useReportsExport } from "@/hooks/queries/useReports";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServices } from "@/hooks/queries/useServices";

// â”€â”€ Preset definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Each preset computes its own from/to as YYYY-MM-DD strings, sent as a custom
// range to the existing backend  -  no backend changes needed, since explicit
// from/to already overrides everything else server-side.
type PresetKey =
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_6_months"
  | "all"
  | "custom";

// Date range comparisons must run in Lagos time (WAT, UTC+1): toISOString()
// round trips through UTC and shifts every day by one, which is what made
// the report filters off by one.
const toLocalISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfWeekISO(d: Date): Date {
  // Monday-based week (ISO): 0 = Monday ... 6 = Sunday
  const weekday = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - weekday, 0, 0, 0, 0);
}

// Local (Lagos, UTC+1) display helper for date strings like "2026-10-09".
const formatReportDate = (d: string | undefined | null): string =>
  d ? new Date(`${d}T00:00:00+01:00`).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }) : "-";

function endOfWeekISO(d: Date): Date {
  const weekday = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - weekday), 23, 59, 59, 999);
}

function computePreset(key: PresetKey): { from?: string; to?: string } | undefined {
  const now = new Date();

  switch (key) {
    case "yesterday": {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return { from: toLocalISO(y), to: toLocalISO(y) };
    }
    case "this_week": {
      const start = startOfWeekISO(now);
      const end = endOfWeekISO(now);
      return { from: toLocalISO(start), to: toLocalISO(end) };
    }
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toLocalISO(start), to: toLocalISO(now) };
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0); // day 0 = last day of prev month
      return { from: toLocalISO(start), to: toLocalISO(endOfMonth(start)) };
    }
    case "last_6_months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return { from: toLocalISO(start), to: toLocalISO(now) };
    }
    case "all":
      return undefined; // no filter at all
    case "custom":
      return undefined; // handled separately via manual inputs
  }
}

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "last_6_months", label: "Last 6 Months" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom" },
];

export default function ReportsPage() {
  const [activePreset, setActivePreset] = useState<PresetKey>("this_month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeTab, setActiveTab] = useState("services");
  const [selectedService, setSelectedService] = useState<string>("all");

  const [filterRange, setFilterRange] = useState<{ from?: string; to?: string } | undefined>(
    computePreset("this_month"),
  );
  const [appliedRange, setAppliedRange] = useState<{ from?: string; to?: string }>({});

  // Fetch services for filter
  const { services, isLoading: servicesLoading } = useServices();

  // Pass service filter to reports hook
  const { data, stats, byService, invoices, receipts, isLoading, refetch } =
    useReportsOverview({
      ...filterRange,
      serviceId: selectedService !== "all" ? selectedService : undefined,
    });

  const { downloadCSV } = useReportsExport();

  const handlePresetClick = (key: PresetKey) => {
    setActivePreset(key);
    if (key === "custom") return;
    setFilterRange(computePreset(key));
    setAppliedRange(computePreset(key) ?? {});
  };

  const handleApplyCustom = () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both a start and end date");
      return;
    }
    setFilterRange({ from: fromDate, to: toDate });
    setAppliedRange({ from: fromDate, to: toDate });
  };

  const handleExportInvoices = () => {
    if (!invoices || invoices.length === 0) {
      toast.error("No invoices to export");
      return;
    }
    const exportData = invoices.map((inv) => ({
      Reference: inv.reference,
      "Application No": inv.applicationNumber || " - ",
      Customer: inv.customerName,
      Service: inv.service?.name || " - ",
      "Revenue Head": inv.service?.revenueHead || " - ",
      Status: inv.paymentStatus || " - ",
      Amount: inv.amount,
      "Created At": inv.createdAt
        ? new Date(inv.createdAt).toLocaleDateString()
        : " - ",
      Phone: inv.phone || " - ",
      Email: inv.email || " - ",
      "Date of Payment": inv.date_of_payment
        ? new Date(inv.date_of_payment).toLocaleDateString()
        : " - ",
    }));
    downloadCSV(exportData, "invoices_export");
  };

  const handleExportReceipts = () => {
    if (!receipts || receipts.length === 0) {
      toast.error("No receipts to export");
      return;
    }
    const exportData = receipts.map((rec) => ({
      "Receipt Number": rec.receiptNumber,
      "Invoice Number": rec.invoiceNumber,
      "Application No": rec.applicationNumber || " - ",
      Customer: rec.customerName,
      Service: rec.service?.name || " - ",
      "Payment Method": rec.paymentMethod,
      Officer: rec.officerName || " - ",
      Amount: rec.amount,
      "Issued At": rec.issuedAt
        ? new Date(rec.issuedAt).toLocaleDateString()
        : " - ",
      Phone: rec.phone || " - ",
      Email: rec.email || " - ",
      "Date of Payment": rec.date_of_payment
        ? new Date(rec.date_of_payment).toLocaleDateString()
        : " - ",
    }));
    downloadCSV(exportData, "receipts_export");
  };

  const handleExportAll = () => {
    if (invoices.length === 0 && receipts.length === 0) {
      toast.error("No data to export");
      return;
    }
    handleExportInvoices();
    toast.info("Invoices exported. Receipts export also available in Receipts tab.");
  };

  // Filter byService data based on selected service
  const filteredByService = useMemo(() => {
    if (selectedService === "all") return byService;
    return byService.filter((item) => item.id === selectedService);
  }, [byService, selectedService]);

  if (isLoading || servicesLoading) {
    return (
      <div>
        <PageHeader
          title="Reports & Analytics"
          subtitle="Exportable revenue, invoice and officer performance reports"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Exportable revenue, invoice and officer performance reports"
        action={
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-1.5" /> Export All
          </Button>
        }
      />

      {/* Period Filter  -  Paystack-style pill segmented control */}
      <Card className="p-4 mb-6 bg-gradient-card border-border/40">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Period</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-muted/50 border border-border/40">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePresetClick(p.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activePreset === p.key
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {data?.period && activePreset !== "custom" && (
            <span className="text-xs text-muted-foreground ml-1">
              {appliedRange.from && appliedRange.to
                ? `${formatReportDate(appliedRange.from)} - ${formatReportDate(appliedRange.to)}`
                : "All time"}
            </span>
          )}
        </div>

        {/* Custom range  -  only revealed when "Custom" is selected */}
        {activePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <Button onClick={handleApplyCustom} size="sm">
              Apply
            </Button>
            {appliedRange.from && appliedRange.to && (
              <span className="text-xs text-muted-foreground ml-auto">
                {formatReportDate(appliedRange.from)} -{" "}
                {formatReportDate(appliedRange.to)}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Service Filter */}
      <div className="mb-6">
        <Card className="p-4 bg-gradient-card border-border/40">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by Service:</span>
            </div>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-[250px] text-sm">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedService !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedService("all")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Clear Filter
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Revenue"
          value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          label="Online Gateway"
          value={`₦${(stats?.byMethod?.online || 0).toLocaleString()}`}
          icon={Wallet}
          color="primary"
        />
        <StatCard
          label="Bank Transfer"
          value={`₦${(stats?.byMethod?.transfer || 0).toLocaleString()}`}
          icon={Banknote}
          color="info"
        />
        <StatCard
          label="POS"
          value={`₦${(stats?.byMethod?.pos || 0).toLocaleString()}`}
          icon={CreditCard}
          color="warning"
        />
      </div>

      <Tabs defaultValue={activeTab}>
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="services" onClick={() => setActiveTab("services")} className="gap-2">
              <TrendingUp className="h-4 w-4 md:hidden" />
              <span className="hidden md:inline">By Service</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" onClick={() => setActiveTab("invoices")} className="gap-2">
              <CreditCard className="h-4 w-4 md:hidden" />
              <span className="hidden md:inline">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="receipts" onClick={() => setActiveTab("receipts")} className="gap-2">
              <Download className="h-4 w-4 md:hidden" />
              <span className="hidden md:inline">Receipts</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === "invoices" && (
            <div className="flex justify-end mb-3">
              <Button size="sm" variant="outline" onClick={handleExportInvoices}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
          )}
          {activeTab === "receipts" && (
            <div className="flex justify-end mb-3">
              <Button size="sm" variant="outline" onClick={handleExportReceipts}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
          )}
        </div>

        {/* By Service Tab */}
        <TabsContent value="services">
          <Card className="bg-gradient-card border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Revenue Head</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredByService.map((item) => {
                  const totalRevenue = stats?.totalRevenue || 0;
                  const pct = totalRevenue > 0
                    ? ((item.revenue / totalRevenue) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.revenueHead}</TableCell>
                      <TableCell>{item.transactions}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₦{item.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{pct}%</TableCell>
                    </TableRow>
                  );
                })}
                {filteredByService.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {selectedService !== "all" 
                        ? "No revenue data available for the selected service" 
                        : "No revenue data available for the selected period"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card className="bg-gradient-card border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Application No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs">{i.reference}</TableCell>
                    <TableCell className="font-mono text-xs">{i.applicationNumber || " - "}</TableCell>
                    <TableCell>{i.customerName}</TableCell>
                    <TableCell className="text-xs">{i.service?.name || " - "}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${
                          i.paymentStatus === 'confirmed' 
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
                            : i.paymentStatus === 'pending'
                            ? 'bg-amber-500/10 text-amber-700 border-amber-300'
                            : 'bg-gray-500/10 text-gray-700 border-gray-300'
                        }`}
                      >
                        {i.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₦{i.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No invoices found for the selected period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts">
          <Card className="bg-gradient-card border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Officer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.receiptNumber}</TableCell>
                    <TableCell className="font-mono text-xs">{r.invoiceNumber}</TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell className="text-xs">{r.service?.name || " - "}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {r.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.officerName || " - "}</TableCell>
                    <TableCell className="text-right font-mono">
                      ₦{r.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {receipts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No receipts found for the selected period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
