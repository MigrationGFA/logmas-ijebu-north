/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * Field Officer overview.
 *
 * Every number on this screen comes from the live API:
 * - Application counts and the recent list come from GET /applications,
 *   which the backend already scopes to applications this officer
 *   created (createdById = the signed in officer).
 * - Total Collected comes from GET /field-officer/collections/summary.
 *
 * This screen previously read a localStorage mock store
 * (src/lib/lgaApplications) seeded with invented applications, so an
 * officer with an empty database still saw activity that never happened.
 * That store also powered a "Conduct Inspection" dialog whose reports
 * were saved only in the browser. There is no inspections endpoint or
 * table on the backend, so rather than pretend, the dialog is gone: when
 * inspections get a real backend, they can come back as a real feature.
 */
import React, { useMemo } from "react";
import { StatCard, StatusBadge } from "@/components/dashboard/shared";
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
import {
  ClipboardList,
  TrendingUp,
  FileText,
  ScanLine,
  Users,
  BarChart3,
  CreditCard,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";
import { QuickActions } from "@/components/dashboard/DashboardWidgets";
import { useApplications } from "@/hooks/queries/useApplications";
import { useFieldOfficerCollections } from "@/hooks/queries/useFieldOfficer";
import { MetricsSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";

function applicantName(app: any): string {
  const fromAccount = [app.applicant?.firstName, app.applicant?.lastName]
    .filter(Boolean)
    .join(" ");
  if (fromAccount) return fromAccount;
  if (app.applicant?.name) return app.applicant.name;
  const fromForm =
    app.formData?.fullName ||
    app.formData?.applicantName ||
    app.formData?.businessName;
  return fromForm ? String(fromForm) : "—";
}

export default function FieldOfficerOverview() {
  const {
    data: applicationsData,
    isLoading,
    error,
    refetch,
  } = useApplications({ limit: 100 });
  const applications = useMemo(
    () => (Array.isArray(applicationsData) ? applicationsData : []),
    [applicationsData],
  );

  const { useGetCollectionSummary } = useFieldOfficerCollections();
  const { data: collectionSummary } = useGetCollectionSummary();

  const metrics = useMemo(() => {
    const byStatus = (statuses: string[]) =>
      applications.filter((a) =>
        statuses.includes(String(a.status || "").toLowerCase()),
      ).length;
    return {
      totalApplications: applications.length,
      awaitingReview: byStatus(["submitted", "under_review"]),
      approvedOrCompleted: byStatus(["approved", "completed"]),
      totalCollected: collectionSummary?.allTime?.collected ?? 0,
    };
  }, [applications, collectionSummary]);

  const recent = useMemo(
    () =>
      [...applications]
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
        )
        .slice(0, 8),
    [applications],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <MetricsSkeleton count={4} />
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load your overview"
        message="Your figures come straight from the database, and it could not be reached. Nothing here is estimated or filled in."
        error={error as Error}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <>
      {/* Metrics Row: live database figures only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="My Applications"
          value={String(metrics.totalApplications)}
          icon={FileText}
          color="info"
        />
        <StatCard
          label="Awaiting Review"
          value={String(metrics.awaitingReview)}
          icon={Clock}
          color="warning"
        />
        <StatCard
          label="Approved / Completed"
          value={String(metrics.approvedOrCompleted)}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          label="Total Collected"
          value={`₦${metrics.totalCollected.toLocaleString()}`}
          icon={TrendingUp}
          color="primary"
        />
      </div>

      {/* Recent applications captured or submitted by this officer */}
      <Card className="p-5 mb-6 bg-gradient-card border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              My Recent Applications
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              The latest applications you submitted or captured, read from
              the live register.
            </p>
          </div>
          <Button asChild size="sm" className="text-xs">
            <Link href="/dashboard/applications">
              View All Applications ({metrics.totalApplications})
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border border-border/60 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>App Reference</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
                    No applications yet. Applications you submit or capture
                    in the field will appear here, counted from the live
                    database.
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((app) => (
                  <TableRow
                    key={app.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      <Link
                        href={`/dashboard/applications/${app.id}`}
                        className="hover:underline"
                      >
                        {app.applicationNumber || app.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {applicantName(app)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {app.serviceName || app.service?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={String(app.status || "")
                          .toLowerCase()
                          .replace(/\s+/g, "_")}
                      />
                    </TableCell>
                    <TableCell className="text-xs">
                      ₦
                      {Number(
                        app.feeAmount ?? app.invoice?.amount ?? 0,
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {app.createdAt
                        ? new Date(app.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Quick Action Navigation Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 bg-card border-border/60 space-y-3">
          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-primary" />
            Field Verification & Revenue Operations
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Capture applications and log violations from the field, even
            with no network: records saved on your phone sync automatically
            when the connection returns, and you can follow them in the
            Offline Queue. Verify any receipt by its code before you accept
            a payment claim.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/dashboard/permits">
                <Building2 className="h-3.5 w-3.5 mr-1" /> Field Enforcement Hub
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/dashboard/offline-queue">
                <ClipboardList className="h-3.5 w-3.5 mr-1" /> Offline Queue
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/dashboard/verify-payment">
                <ScanLine className="h-3.5 w-3.5 mr-1" /> Verify Payment QR
              </Link>
            </Button>
          </div>
        </Card>

        <QuickActions
          items={[
            { icon: FileText, label: "Services Catalogue", to: "/dashboard/services" },
            { icon: ClipboardList, label: "All Service Apps", to: "/dashboard/applications" },
            { icon: ScanLine, label: "Verify Payment", to: "/dashboard/verify-payment" },
            { icon: Building2, label: "Field Enforcement", to: "/dashboard/permits" },
            { icon: Users, label: "Customers & Shops", to: "/dashboard/customers" },
            { icon: BarChart3, label: "Field Reports", to: "/dashboard/reports" },
            { icon: CreditCard, label: "Invoices & Demand", to: "/dashboard/invoices" },
          ]}
        />
      </div>
    </>
  );
}
