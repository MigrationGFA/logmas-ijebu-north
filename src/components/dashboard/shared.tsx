import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { type LucideIcon, ArrowRight } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/auth";
import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = "primary",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="p-4 sm:p-5 bg-gradient-card border-border/40 hover:shadow-elegant transition-smooth">
      <div className="flex items-start justify-between">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `color-mix(in oklab, var(--${color}) 12%, transparent)` }}
        >
          <Icon className="h-5 w-5" style={{ color: `var(--${color})` }} />
        </div>
        {trend && <span className="text-xs font-semibold text-success">{trend}</span>}
      </div>
      <div className="mt-4 text-xl sm:text-2xl font-bold tracking-tight leading-tight break-words">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </Card>
  );
}



// Backend statuses (from your comments)
type BackendStatus = 
  | "draft"
  | "submitted"
  | "pending"
  | "confirmed"
  | "awaiting_form"
  | "unpaid"
  | "under_review"
  | "forwarded_to_councillor"
  | "approved"
  | "rejected"
  | "certificate_issued"
| "sent"

// Frontend display statuses (shorter, what you want to show)
type DisplayStatus = 
  | "confirmed"
  | "approved"
  | "pending"
  | "sent"
  | "awaiting form"
  | "review"
  | "overdue"
  | "declined";

// Translation mapping
const statusTranslation: Record<BackendStatus, DisplayStatus> = {
  draft: "pending",
  submitted: "pending",
  pending: "pending",
  confirmed: "confirmed",
  under_review: "review",
  forwarded_to_councillor: "review",
  approved: "approved",
  rejected: "declined",
  certificate_issued: "approved",
  sent:"sent",
  awaiting_form:"awaiting form",
  unpaid:"pending"
};

// Style mapping uses display statuses
const styleMap: Record<DisplayStatus, string> = {
  confirmed: "bg-success/15 text-success border-success/30",
  approved: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  sent: "bg-warning/15 text-warning-foreground border-warning/30",
 "awaiting form": "bg-info/15 text-info border-info/30",
  review: "bg-info/15 text-info border-info/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
  declined: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: string }) {
  const displayStatus = statusTranslation[status];
  const style = styleMap[displayStatus] || "";
  
  return (
    <Badge variant="outline" className={`capitalize ${style}`}>
      {displayStatus}
    </Badge>
  );
}

export function RoleBanner({ role }: { role: Role }) {
  return (
    <Card className="mb-6 p-5 bg-gradient-hero text-primary-foreground border-0 overflow-hidden relative">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge className="bg-white/15 text-white border-white/20 backdrop-blur">
            {ROLE_LABELS[role]}
          </Badge>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-2">
            Welcome to your dashboard
          </h2>
          <p className="text-sm opacity-90 mt-1">
            Everything you need, organized and at your fingertips.
          </p>
        </div>
        <Button
          asChild
          variant="secondary"
          className="bg-gold text-gold-foreground hover:bg-gold/90"
        >
          <Link href="/">
            View public site <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

export function EmptyState({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="p-12 text-center bg-gradient-card border-dashed border-2 border-border/60">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
