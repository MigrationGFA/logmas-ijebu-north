"use client";
import { useState } from "react";
import {
  PageHeader,
  StatusBadge,
  StatCard,
} from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Download,
  Eye,
  Clock,
  TrendingUp,
  CreditCard,
  Wallet,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useInvoices } from "@/hooks/queries/useInvoices";
import { useAuth } from "@/hooks/queries/useAuth";
import Link from "next/link";
import { ErrorState } from "@/components/ui/ErrorState";
import { MetricsSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";

export default function InvoicesPage() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const { user } = useAuth();
  // "Pay now" is an applicant action; staff roles only manage/record payments.
  const isPayer =
    user?.role === "citizen" || user?.role === "business_owner";

  // Use the real API hook
  const {
    invoices,
    outstanding,
    collected,
    transactions,
    avgPayment,
    isLoading,
    error,
    refetch,
  } = useInvoices({
    tab: tab === "all" ? undefined : tab,
    search: q || undefined,
  });

  // console.log(invoices,"invoices");

  // Filter invoices (backend already filters by tab and search, but we can do client-side filtering for real-time search)
  const filtered = invoices.filter(
    (i) =>
      (tab === "all" ||
        i.paymentStatus === tab ||
        (tab === "pending" && i.paymentStatus === "pending")) &&
      (
        i.reference +
        (i.customerName ?? "") +
        (i.service?.name ?? "") +
        (i.application?.applicationNumber ?? "")
      )
        .toLowerCase()
        .includes(q.toLowerCase()),
  );

  const exportCSV = () => {
    if (!filtered.length) {
      toast.error("Nothing to export");
      return;
    }

    const rows = filtered.map((i) => ({
      Reference: i.reference,
      "Application No": i.application?.applicationNumber ?? " - ",
      Customer: i.customerName ?? " - ",
      Service: i.service?.name ?? " - ",
      Amount: i.amount,
      Status: i.paymentStatus,
      "Date of Application": i.dateOfApplication
        ? new Date(i.dateOfApplication).toLocaleDateString()
        : " - ",
      "Payment Date": i.paidAt
        ? new Date(i.paidAt).toLocaleDateString()
        : " - ",
    }));

    const headers = [Object.keys(rows[0]).join(",")];
    const csvRows = rows.map((r) => Object.values(r).join(","));
    const csv = [...headers, ...csvRows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoices exported successfully");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invoices & Payments"
          subtitle="Every invoice issued across the platform, with collections overview"
        />
        <MetricsSkeleton count={4} />
        <TableSkeleton rows={8} cols={7} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invoices & Payments"
          subtitle="Every invoice issued across the platform, with collections overview"
        />
        <ErrorState
          title="Failed to load invoices"
          error={error}
          refetch={refetch}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Invoices & Payments"
        subtitle="Every invoice issued across the platform, with collections overview"
        // action={
        //   (user?.role === "field_officer" || user?.role === "lga_admin") && (
        //     <Button asChild className="bg-gradient-hero shadow-elegant">
        //       <Link href="/dashboard/invoices/new">
        //         <Plus className="h-4 w-4 mr-1.5" /> Generate Invoice
        //       </Link>
        //     </Button>
        //   )
        // }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Outstanding"
          value={`₦${outstanding?.toLocaleString()}`}
          icon={Clock}
          color="warning"
        />
        <StatCard
          label="Total Collected"
          value={`₦${collected?.toLocaleString()}`}
          icon={TrendingUp}
          // trend="+12%"
          color="success"
        />
        <StatCard
          label="Transactions"
          value={String(transactions)}
          icon={CreditCard}
          color="primary"
        />
        <StatCard
          label="Avg Payment"
          value={`₦${avgPayment?.toLocaleString()}`}
          icon={Wallet}
          color="info"
        />
      </div>

      <Card className="p-4 md:p-5 bg-gradient-card border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="confirmed">Paid</TabsTrigger>
              <TabsTrigger value="pending">Unpaid</TabsTrigger>
              {/* <TabsTrigger value="overdue">Overdue</TabsTrigger> */}
            </TabsList>
          </Tabs>

          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-9 pl-8 w-44 md:w-60"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Service Name</TableHead>
                {/* <TableHead>Due</TableHead> */}
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-xs">
                    {invoice.reference}
                  </TableCell>
                  <TableCell className="font-medium">
                    {invoice.service?.name ?? " - "}
                  </TableCell>
                  {/* <TableCell>{invoice.invoiceType}</TableCell> */}
                  {/* <TableCell>{invoice.dueDate}</TableCell> */}
                  <TableCell className="font-mono">
                    ₦{invoice.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {invoice.paidAt
                      ? new Date(invoice.paidAt).toLocaleDateString("en-NG")
                      : " - "}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* <Button asChild variant="ghost" size="sm">
                        <Link href="/dashboard/invoices/$invoiceId" params={{ invoiceId: invoice.id }}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Link>
                      </Button> */}

                      {invoice.paymentStatus === "confirmed" &&
                      invoice.receipts?.[0]?.id ? (
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/dashboard/receipts/${invoice.receipts[0].id}`}
                          >
                            Receipt
                          </Link>
                        </Button>
                      ) : invoice.paymentStatus !== "confirmed" ? (
                        isPayer ? (
                          <Button asChild size="sm" className="bg-gradient-hero">
                            <Link
                              href={`/dashboard/invoices/${invoice.reference}`}
                            >
                              Pay now
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground px-2">
                            -
                          </span>
                        )
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
