import React from 'react'
import { StatCard } from '../shared';
import { AlertCircle, BarChart3, Clock, CreditCard, FilePlus2, TrendingUp, UserCog, Wallet, Loader2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOverview } from '@/hooks/queries/useOverview';
import { Role } from '@/services/apiOverview';
import { MiniChart, QuickActions, RecentInvoices } from '@/components/dashboard/DashboardWidgets';
import Link from 'next/link';

interface ContractorOverviewProps {
  role: Role;
}

function ContractorOverview({ role }: ContractorOverviewProps) {
  const { contractorData, isLoading, error } = useOverview(role);

  if (isLoading) {
    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  
  
  if (error || !contractorData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Failed to load contractor data</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const { invoices, receipts, officers, revenueTrend } = contractorData;

  // Calculate stats
  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  const collected = receipts.reduce((s, r) => s + r.amount, 0);
  const pending = invoices.filter((i) => i.status === "unpaid").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const activeOfficers = officers.filter((o) => o.status === "active").length;

  const formatInK = (amount: number) => {
    return `₦${(amount / 1000).toFixed(1)}K`;
  };

  // Format revenue trend for MiniChart
  const chartData = revenueTrend.map((item) => ({
    month: item.month,
    amount: item.amount,
  }));
  
  
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Billed"
          value={formatInK(billed)}
          icon={Wallet}
          trend="+12%"
          color="primary"
        />
        <StatCard
          label="Collected"
          value={formatInK(collected)}
          icon={TrendingUp}
          trend="+18%"
          color="success"
        />
        <StatCard
          label="Pending"
          value={formatInK(pending)}
          icon={Clock}
          color="warning"
        />
        <StatCard
          label="Overdue"
          value={formatInK(overdue)}
          icon={AlertCircle}
          color="destructive"
        />
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <MiniChart revenueTrendChart={chartData} />
        <QuickActions
          items={[
            { icon: FilePlus2, label: "New Invoice", to: "/dashboard/invoices/new" },
            { icon: UserCog, label: "Officers", to: "/dashboard/field-officers" },
            { icon: CreditCard, label: "Payments", to: "/dashboard/payments" },
            { icon: BarChart3, label: "Reports", to: "/dashboard/reports" },
          ]}
        />
      </div>
      
      <Card className="mt-6 p-5 bg-gradient-card border-border/40">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">My Field Officers</h3>
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/field-officers">Manage</Link>
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {officers.length} officers • {activeOfficers} active
        </div>
      </Card>
      
      <div className="mt-6">
        <RecentInvoices invoices={invoices.map(inv => ({
          id: inv.id,
          reference: inv.invoiceNumber,
          customerName: inv.customerName,
          amount: inv.amount,
          status: inv.status,
          dueDate: new Date(inv.createdAt).toISOString(),
        }))} />
      </div>
    </>
  );
}

export default ContractorOverview;
