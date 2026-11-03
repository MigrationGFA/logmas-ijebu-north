/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StatCard, StatusBadge } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Clock,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  Building2,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Role } from "@/services/apiOverview";
import { QuickActions } from "@/components/dashboard/DashboardWidgets";
import { tokenManager } from "@/services/apiAuth";
import { toast } from "sonner";
import Link from "next/link";
import { useOverview } from "@/hooks/queries/useOverview";

interface TreasurerOverviewProps {
  role: Role;
}

export default function TreasurerOverview({ role }: TreasurerOverviewProps) {
  const user = tokenManager.getUser();
  const { treasurerMetrics } = useOverview(role as Role);
  
  // Extract data from the hook
  const metrics = treasurerMetrics?.metrics;
  const revenueTrendChart = treasurerMetrics?.revenueTrendChart || [];
  const categoryBreakdown = treasurerMetrics?.categoryBreakdown || [];

  // Remove all the local state and logic for applications
  // No more useState, useEffect, loadApps, etc.

  return (
    <>
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Revenue Collected"
          value={`₦${metrics?.totalRevenue?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          label="Pending Outstanding Revenue"
          value={`₦${metrics?.pendingAmount?.toLocaleString() || 0}`}
          icon={Clock}
          color="primary"
        />
        <StatCard
          label="Invoices Issued"
          value={String(metrics?.invoiceGeneratedCount || 0)}
          icon={Receipt}
          color="info"
        />
        <StatCard
          label="Active Officers"
          value={String(metrics?.activeOfficers || 0)}
          icon={Users}
          color="warning"
        />
      </div>

      {/* REMOVED: Treasury Assessment Queue section - completely removed */}

      {/* Category Revenue Breakdown & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 bg-card border-border/60">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Revenue Breakdown by Service Category
          </h3>
          <div className="space-y-4">
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((item, index) => {
                const maxAmount = Math.max(...categoryBreakdown.map((c) => c.amount), 1);
                return (
                  <div key={item.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{item.category}</span>
                      <span className="font-mono font-bold">₦{item.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-hero transition-all duration-700"
                        style={{
                          width: `${(item.amount / maxAmount) * 100}%`,
                          transitionDelay: `${index * 50}ms`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground">No service category data available yet.</p>
            )}
          </div>
        </Card>

        <QuickActions
          items={[
            { icon: FileText, label: "All Service Apps", to: "/dashboard/applications" },
            { icon: BarChart3, label: "Reports & Analytics", to: "/dashboard/reports" },
            { icon: CreditCard, label: "Demand Notices", to: "/dashboard/invoices" },
            { icon: Receipt, label: "Statutory Receipts", to: "/dashboard/receipts" },
          ]}
        />
      </div>

      {/* REMOVED: Treasury Assessment Dialog - completely removed */}
    </>
  );
}
