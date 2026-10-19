/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatCard, EmptyState } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Plus,
  Users,
  ShieldOff,
  Power,
  PowerOff,
  Wallet,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { CreateAccountDialog } from "@/components/lgaAdmin/CreateAccountDialog";
import { useAuth } from "@/hooks/queries/useAuth";
import { TreasurerRole, useTreasurerOfficer } from "@/hooks/queries/useTreasurer";
import { tokenManager } from "@/services/apiAuth";
import { FieldOfficer } from "@/services/apiTreasurer";
import { useRevenueCategories } from "@/hooks/queries/useRevenueCategories";
import { useWards } from "@/hooks/queries/useWards";

// const WARDS = ["Atan", "Ojowo", "Owu", "Ososa", "Imuwo", "Ikija", "Ife", "Itele", "Mamu"];
// const LEVIES: LevyCategory[] = [
//   "Market Levy",
//   "Haulage Levy",
//   "Environmental Levy",
//   "Lockup Store Levy",
//   "Parking Levy",
//   "Business Levy",
//   "Signage Permit",
//   "Other",
// ];


export default function FieldOfficersPage() {
  const user = tokenManager.getUser();

  // if(!user) return null
  const { data,isLoading,error, refetch } = useTreasurerOfficer(user?.role as TreasurerRole);
  

  const officers = useMemo(() => {
    return data?.officers || [];
  }, [data]);
  const stats = data?.stats || {
    totalOfficers: 0,
    active: 0,
    suspended: 0,
    totalCollected: 0,
  };

  const userRole = user?.role;
  
  const canManage = userRole === "lga_admin" || userRole === "super_admin" || userRole === "contractor" || userRole === "agent"
  const canView = canManage || userRole === "treasurer" || userRole === "chairman";
  
  // Filter for contractor view
  const visibleOfficers = useMemo(() => {
    if (userRole === "contractor") {
      return officers.filter((o: FieldOfficer) => o.createdBy?.id === user?.id);
    }
    return officers;
  }, [officers, userRole, user?.id]);

  if (!canView) {
    return (
      <div>
        <PageHeader title="Field Officers" subtitle="Read-only view" />
        <EmptyState
          title="Access restricted"
          desc="Field officers are managed by LGA Admins and Contractors."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Field Officers" subtitle="Create, assign and monitor service applications, registered users and confirmed service revenue" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Field Officers" subtitle="Create, assign and monitor service applications, registered users and confirmed service revenue" />
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Failed to load field officers</p>
          <button 
            // onClick={() => refetch()} 
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Field Officers"
        subtitle="Create, assign and monitor service applications, registered users and confirmed service revenue"
        action={canManage ? <CreateAccountDialog onSuccess={() => { void refetch(); }} /> : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Total Officers"
          value={String(stats.totalOfficers || visibleOfficers.length)}
          icon={Users}
          color="primary"
        />
        <StatCard 
          label="Active" 
          value={String(stats.active || visibleOfficers.filter((o: FieldOfficer) => o.status === "active").length)} 
          icon={ShieldCheck} 
          color="success" 
        />
        <StatCard
          label="Suspended"
          value={String(stats.suspended || visibleOfficers.filter((o: FieldOfficer) => o.status === "suspended").length)}
          icon={ShieldOff}
          color="warning"
        />
        <StatCard
          label="Confirmed Service Revenue"
          value={new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(stats.totalCollected)}
          icon={Wallet}
          color="info"
        />
        <StatCard label="Users Registered" value={String(visibleOfficers.reduce((sum, officer) => sum + (officer.usersRegistered ?? 0), 0))} icon={Users} color="primary" />
      </div>

      <Card className="p-0 bg-gradient-card border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Officer</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Services</TableHead>
                <TableHead className="text-center">Users Registered</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                {/* <TableHead className="text-right">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOfficers.map((officer: FieldOfficer) => (
                <TableRow key={officer.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                          {officer.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{officer.name}</div>
                        <div className="text-xs text-muted-foreground">{officer.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{officer.ward?.name || "-"}</TableCell>
                  <TableCell>
                    {officer.services && officer.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {officer.services.slice(0, 2).map((svc: string) => (
                          <Badge
                            key={svc}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {svc.replace(/_/g, " ")}
                          </Badge>
                        ))}
                        {officer.services.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{officer.services.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {officer.usersRegistered ?? "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(officer.totalCollected)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        officer.status === "active"
                          ? "border-success/30 text-success bg-success/10"
                          : officer.status === "suspended"
                            ? "border-warning/30 text-warning-foreground bg-warning/10"
                            : "border-destructive/30 text-destructive bg-destructive/10"
                      }
                    >
                      {officer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{officer.createdBy?.name || "-"}</TableCell>
                  {/* <TableCell className="text-right">
                    {canManage ? (
                      <OfficerActions 
                        id={officer.id} 
                        status={officer.status} 
                      name={user?.firstName ?? ""}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Read-only</span>
                    )}
                  </TableCell> */}
                </TableRow>
              ))}
              {visibleOfficers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No officers yet. Create your first officer.
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

