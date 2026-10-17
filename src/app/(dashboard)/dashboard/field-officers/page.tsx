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
import {  createOfficer, setOfficerStatus, type LevyCategory } from "@/lib/store";
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
  const { data,isLoading,error } = useTreasurerOfficer(user?.role as TreasurerRole);
  
  console.log(data,"tres",user)
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
      return officers.filter((o: any) => o.contractorId === user?.id);
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
        <PageHeader title="Field Officers" subtitle="Create, assign and monitor government revenue collection officers" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Field Officers" subtitle="Create, assign and monitor government revenue collection officers" />
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
        subtitle="Create, assign and monitor government revenue collection officers"
        action={canManage ? <CreateOfficerDialog /> : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          label="Total Collected"
          value={`₦${((stats.totalCollected || visibleOfficers.reduce((s: number, o: any) => s + o.totalCollected, 0)) / 1000).toFixed(1)}K`}
          icon={Wallet}
          color="info"
        />
      </div>

      <Card className="p-0 bg-gradient-card border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Officer</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Levies</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead>Collected</TableHead>
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
                    {/* <div className="flex flex-wrap gap-1">
                      {officer.levies.slice(0, 2).map((levy: string) => (
                        <Badge key={levy} variant="outline" className="text-[10px]">
                          {levy.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {officer.levies.length > 2 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{officer.levies.length - 2}
                        </Badge>
                      )}
                    </div> */}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{officer.totalCollected}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {/* ₦{officer.totalCollected.toLocaleString()} */}
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
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
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

function OfficerActions({ id, status, name }: { id: string; status: string ,name:string}) {
  const { user } = useAuth();
  if (!user) return null;
  const act = (s: "active" | "suspended" | "deactivated") => {
    setOfficerStatus(id, s, name, user.role);
    toast.success(`Officer ${s}`);
  };
  return (
    <div className="flex justify-end gap-1">
      {status !== "active" && (
        <Button size="sm" variant="outline" onClick={() => act("active")}>
          <Power className="h-3.5 w-3.5 mr-1" /> Activate
        </Button>
      )}
      {status === "active" && (
        <Button size="sm" variant="outline" onClick={() => act("suspended")}>
          <ShieldOff className="h-3.5 w-3.5 mr-1" /> Suspend
        </Button>
      )}
      {status !== "deactivated" && (
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/30"
          onClick={() => act("deactivated")}
        >
          <PowerOff className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function CreateOfficerDialog() {
  const user = tokenManager.getUser();
   const { categories:LEVIES } = useRevenueCategories("LEVY");
    const { wards:WARDS } = useWards();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    ward: "Atan",
    levy: "Market Levy" as LevyCategory,
  });
  if (!user) return null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createOfficer({
      name: form.name,
      email: form.email,
      phone: form.phone,
      ward: form.ward,
      levies: [form.levy],
      status: "active",
      createdBy: user.firstName,
      createdByRole: user.role ,
      contractorId: user.role === "contractor" ? user.id : undefined,
    });
    toast.success(`Officer ${form.name} created`);
    setOpen(false);
    setForm({ name: "", email: "", phone: "", ward: "Atan", levy: "Market Levy" });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-hero shadow-elegant">
          <Plus className="h-4 w-4 mr-1.5" /> New Officer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Field Officer</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Full Name</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ward</Label>
              <Select value={form.ward} onValueChange={(v) => setForm({ ...form, ward: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WARDS.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Primary Levy</Label>
              <Select
                value={form.levy}
                onValueChange={(v) => setForm({ ...form, levy: v as LevyCategory })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVIES.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-gradient-hero">
              <Plus className="h-4 w-4 mr-1.5" /> Create Officer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
