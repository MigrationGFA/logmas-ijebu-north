"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiApplications } from "@/services/apiApplications";
import { getLgaServiceById } from "@/config/lgaServices";
import type { Application } from "@/types/application";
import {
  Loader2,
  Search,
  ArrowRight,
  ClipboardList,
  XCircle,
} from "lucide-react";

interface TrackPageProps {
  params: Promise<{ id: string }>;
}

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const STAGES = ["Submitted", "Under Review", "Decision", "Document Issued"];

const statusMeta = (status: string) => {
  const key = String(status || "").toLowerCase().replace(/\s+/g, "_");
  switch (key) {
    case "under_review":
      return {
        label: "Under Review",
        className: "bg-amber-500/10 text-amber-700 border-amber-300",
        stage: 1,
      };
    case "approved":
      return {
        label: "Approved",
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
        stage: 2,
      };
    case "completed":
      return {
        label: "Completed",
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
        stage: 3,
      };
    case "declined":
    case "rejected":
      return {
        label: "Declined",
        className: "bg-destructive/10 text-destructive border-destructive/30",
        stage: 2,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-muted text-muted-foreground border-border",
        stage: 0,
      };
    default:
      return {
        label: "Submitted",
        className: "bg-primary/10 text-primary border-primary/30",
        stage: 0,
      };
  }
};

export default function TrackApplicationPage({ params }: TrackPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [reference, setReference] = useState("");
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve the [id] segment — application number, UUID or payment reference —
  // against the backend. Re-runs whenever the URL segment changes (a new
  // search pushes a new /track/<value>).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setApp(null);

    apiApplications
      .getApplicationByReference(id)
      .then((res) => {
        if (!cancelled) setApp(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error && err.message
            ? err.message
            : "We could not find that application reference.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const next = reference.trim();
    if (next) router.push(`/track/${encodeURIComponent(next)}`);
  };

  const serviceName = app
    ? app.serviceName ||
      getLgaServiceById(app.serviceId)?.name ||
      app.service?.name ||
      "Statutory Service"
    : "";
  const applicantName = app
    ? app.applicant?.name ||
      app.formData?.fullName ||
      [app.formData?.firstName, app.formData?.lastName]
        .filter(Boolean)
        .join(" ") ||
      "Applicant"
    : "";
  const status = app ? statusMeta(String(app.status || "submitted")) : null;
  const paid =
    !!app &&
    (app.paymentStatus === "paid" || app.invoice?.paymentStatus === "confirmed");
  const declineReason = app?.declineReason || app?.rejectionReason || null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="space-y-1.5 text-center">
          <Badge variant="outline" className="mx-auto text-xs gap-1">
            <ClipboardList className="h-3 w-3" /> Track My Application
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Application Status
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your application number to follow live progress — no sign-in
            required.
          </p>
        </div>

        <Card className="p-4 bg-gradient-card border-border/40">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="e.g. ODE-APP-2026-000101"
              className="font-mono text-sm"
              aria-label="Application reference"
            />
            <Button type="submit" className="bg-primary font-semibold shrink-0">
              <Search className="h-4 w-4 mr-1.5" /> Track
            </Button>
          </form>
        </Card>

        {loading && (
          <Card className="p-10 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Looking up “{id}”…</p>
          </Card>
        )}

        {!loading && error && (
          <Card className="p-8 text-center space-y-3">
            <XCircle className="h-9 w-9 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">Application not found</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">
              Check the number printed on your receipt or application form, or
              contact the LGA help desk for assistance.
            </p>
          </Card>
        )}

        {!loading && !error && app && status && (
          <>
            <Card className="p-5 bg-gradient-card border-border/40 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-bold text-sm text-primary">
                  {app.applicationNumber || app.id}
                </span>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
                <Detail label="Service" value={serviceName} />
                <Detail label="Applicant" value={applicantName} />
                <Detail label="Submitted" value={formatDate(app.createdAt)} />
                <Detail
                  label="Payment"
                  value={
                    paid
                      ? "Payment confirmed"
                      : app.paymentStatus === "pending" ||
                          app.invoice?.paymentStatus === "pending"
                        ? "Processing…"
                        : "Awaiting payment"
                  }
                />
                <Detail label="Invoice No." value={app.invoiceNumber} mono />
                <Detail label="Receipt No." value={app.receiptNumber} mono />
                <Detail
                  label="Certificate No."
                  value={app.certificateNumber || undefined}
                  mono
                />
              </div>

              {status.label === "Declined" && declineReason && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  <span className="font-semibold">Reason for decline:</span>{" "}
                  {declineReason}
                </div>
              )}
            </Card>

            <Card className="p-5 bg-gradient-card border-border/40">
              <h2 className="text-sm font-semibold mb-4">Progress</h2>
              <ol className="space-y-3">
                {STAGES.map((stage, index) => {
                  const done = index < status.stage;
                  const current = index === status.stage;
                  const blocked = status.label === "Declined" && index === 2;
                  const tone = blocked
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : current
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground";
                  return (
                    <li key={stage} className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${tone}`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`text-sm ${
                          done || current || blocked
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stage}
                        {blocked && " — Declined"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </Card>

            {app.timeline && app.timeline.length > 0 && (
              <Card className="p-5 bg-gradient-card border-border/40">
                <h2 className="text-sm font-semibold mb-3">History</h2>
                <ol className="space-y-3 border-l border-border/60 pl-4">
                  {app.timeline.map((event) => (
                    <li key={event.id} className="relative text-xs">
                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">
                          {event.title}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-muted-foreground mt-0.5">
                          {event.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button asChild variant="outline" className="flex-1 text-xs">
                <Link href="/services">Services Directory</Link>
              </Button>
              <Button
                asChild
                className="flex-1 bg-primary text-xs font-semibold"
              >
                <Link href="/apply">
                  Start New Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}


