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
  Clock,
  CreditCard,
  FileBadge,
  CheckCircle2,
  MessageSquare,
  Receipt,
  Stamp,
  ShieldCheck,
} from "lucide-react";
import { useOverview } from "@/hooks/queries/useOverview";
import { format } from "date-fns";
import { Role } from "@/services/apiOverview";
import Link from "next/link";
import { QuickActions } from "@/components/dashboard/DashboardWidgets";

function CitizenOverview({ role }: { role: Role }) {
  // const pending = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  const { citizenMetrics:data } = useOverview(role);

  const pending = data?.metrics?.pendingPayments ?? 0;
  const approvedApplications = data?.metrics?.approvedApplications ?? 0;
  const openComplaints = data?.metrics?.openComplaints ?? 0;
  const awaitingFormSubmissions = data?.metrics?.awaitingForm ?? 0;  

  // console.log("Citizen Metrics:", citizenMetrics);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Approved Applications"
          value={String(approvedApplications)}
          icon={FileBadge}
          color="primary"
        />
        <StatCard
          label="Pending Bills"
          value={`₦${pending.toLocaleString()}`}
          icon={Clock}
          color="warning"
        />
        {/* hasnt been done yet */}
        <StatCard
          label="Awaiting Form Submission"
          value={String(awaitingFormSubmissions)}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          label="Complaints"
          value={String(openComplaints)}
          icon={MessageSquare}
          color="info"
        />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-card border-border/40 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Applications</h3>
            <Button asChild size="sm" className="bg-gradient-hero">
              <Link href="/dashboard/services">Apply now</Link>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Service Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.recentApplications?.slice(0, 3).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{`APP-${a.id.split("-")[1]}`}</TableCell>
                  <TableCell className="truncate">{a.service}</TableCell>
                  <TableCell>{format(a.createdAt, "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <QuickActions
          items={[
            {
              icon: FileBadge,
              label: "Apply for State of Origin",
              to: "/dashboard/services/state_of_origin",
            },
            {
              icon: FileBadge,
              label: "All Government Services",
              to: "/dashboard/services",
            },
            {
              icon: CreditCard,
              label: "Pay Fees",
              to: "/dashboard/invoices",
            },
            {
              icon: MessageSquare,
              label: "Raise Complaint",
              to: "/dashboard/complaints",
            },
            { icon: Receipt, label: "My Receipts", to: "/dashboard/receipts" },
          ]}
        />
      </div>
    </>
  );
}

export default CitizenOverview;
