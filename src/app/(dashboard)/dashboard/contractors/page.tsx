/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Users,
  Wallet,
  ShieldCheck,
  Phone,
  Mail,
  Building2,
  FileText,
  Search,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useLgaAdmin } from "@/hooks/queries/useLgaAdmin";

import { StatCard } from "@/components/dashboard/shared";
import { tokenManager } from "@/services/apiAuth";
import { AddContractorDialog } from "@/components/lgaAdmin/AddContractorDialog";
import { AddAgentDialog } from "@/components/lgaAdmin/AddAgentDialog";
import Link from "next/link";
import { AddAgentData } from "@/services/apiLgaAdmin";
import { usePagination } from "@/hooks/usePagination";
import { ListPagination } from "@/components/ui/list-pagination";



export default function ContractorsPage() {
  const user = tokenManager.getUser();
  const { contractors } = useLgaAdmin();
  const { useGetContractors, createContractor, addAgent, isCreatingContractor, isAddingAgent } = contractors;
  const [search, setSearch] = useState("");
  
  const { data, isLoading, refetch } = useGetContractors({ search: search || undefined });
  
  const userRole = user?.role;
  const canManage = userRole === "lga_admin" || userRole === "super_admin";

  const stats = data?.stats || {
    totalContractors: 0,
    activeContractors: 0,
    totalAgentsDeployed: 0,
    totalRevenueViaContractors: 0,
  };
  const contractorsList = data?.contractors || [];
  const fieldAgents = data?.fieldAgents || [];

  const filteredContractors = contractorsList.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const pagination = usePagination(filteredContractors, 12, [search]);

  const handleCreateContractor = async (formData: any) => {
    await createContractor(formData);
    refetch();
  };

  const handleAddAgent = async (contractorId: string, agentData: AddAgentData) => {
    await addAgent({ contractorId, data: agentData });
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Contractors" subtitle="Onboard revenue collection contractors and manage their field agents" />
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Contractors"
        subtitle="Onboard revenue collection contractors and manage their field agents"
        action={canManage ? <AddContractorDialog onCreate={handleCreateContractor} isCreating={isCreatingContractor} /> : undefined}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Contractors" value={String(stats.totalContractors)} icon={Briefcase} color="primary" />
        <StatCard label="Active" value={String(stats.activeContractors)} icon={ShieldCheck} color="success" />
        <StatCard label="Field Agents Deployed" value={String(stats.totalAgentsDeployed)} icon={Users} color="info" />
        <StatCard label="Revenue via Contractors" value={formatCurrency(stats.totalRevenueViaContractors)} icon={Wallet} color="warning" />
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <TabsList>
            <TabsTrigger value="grid">Contractors ({contractorsList.length})</TabsTrigger>
            <TabsTrigger value="agents">All Field Agents ({fieldAgents.length})</TabsTrigger>
          </TabsList>
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contractors..."
              className="pl-8"
            />
          </div>
        </div>

        <TabsContent value="grid">
          <div className="grid lg:grid-cols-2 gap-4">
            {pagination.pageItems.map((contractor) => (
              <ContractorCard
                key={contractor.id}
                contractor={contractor}
                canManage={canManage}
                onAddAgent={(data:AddAgentData) => handleAddAgent(contractor.id, data)}
                onRefresh={refetch}
                isAddingAgent={isAddingAgent}
              />
            ))}
            {filteredContractors.length === 0 && (
              <Card className="p-10 text-center text-sm text-muted-foreground lg:col-span-2">
                No contractors found.
              </Card>
            )}
          </div>
          <ListPagination pagination={pagination} unit="contractors" />
        </TabsContent>

        <TabsContent value="agents">
          <AgentsTable agents={fieldAgents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Contractor Card Component
function ContractorCard({ contractor, canManage, onAddAgent, onRefresh, isAddingAgent }: any) {
  const { contractors } = useLgaAdmin();

  // const handleResetPassword = () => {
  //   resetPassword(contractor.id);
  //   onRefresh();
  // };

  const handleToggleStatus = () => {
    // Implement status toggle
    onRefresh();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-gradient-hero flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{contractor.companyName}</h3>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <FileText className="h-3 w-3" />
              Contact: {contractor.contactName}
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            contractor.status === "active"
              ? "border-success/30 text-success bg-success/10"
              : contractor.status === "suspended"
                ? "border-destructive/30 text-destructive bg-destructive/10"
                : "border-warning/30 bg-warning/10"
          }
        >
          {contractor.status}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Mail className="h-3 w-3" />
          {contractor.email}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Phone className="h-3 w-3" />
          {contractor.phone}
        </div>
      </div>

      {contractor.scope.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {contractor.scope.slice(0, 3).map((s: string) => (
            <Badge key={s} variant="secondary" className="text-[10px]">
              {s}
            </Badge>
          ))}
          {contractor.scope.length > 3 && (
            <Badge variant="secondary" className="text-[10px]">+{contractor.scope.length - 3}</Badge>
          )}
        </div>
      )}
      
      {contractor.wards.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {contractor.wards.slice(0, 3).map((w: string) => (
            <Badge key={w} variant="outline" className="text-[10px]">
              {w}
            </Badge>
          ))}
          {contractor.wards.length > 3 && (
            <Badge variant="outline" className="text-[10px]">+{contractor.wards.length - 3}</Badge>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t text-center">
        <div>
          <div className="text-lg font-bold">{contractor.agentCount}</div>
          <div className="text-[10px] text-muted-foreground">Agents</div>
        </div>
        <div>
          <div className="text-lg font-bold">{contractor.commission}%</div>
          <div className="text-[10px] text-muted-foreground">Commission</div>
        </div>
        <div>
          <div className="text-lg font-bold">{formatCurrency(contractor.collected)}</div>
          <div className="text-[10px] text-muted-foreground">Collected</div>
        </div>
      </div>

      {canManage && (
        <div className="mt-4 flex flex-wrap gap-2">
          <AddAgentDialog
            contractor={contractor}
            onAddAgent={onAddAgent}
            isAdding={isAddingAgent}
          />
          {/* <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={handleResetPassword}
            disabled={isResetting}
          >
            <KeyRound className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={handleToggleStatus}
          >
            {contractor.status === "active" ? "Suspend" : "Activate"}
          </Button> */}
        </div>
      )}
    </Card>
  );
}

// Agents Table Component
function AgentsTable({ agents }: { agents: any[] }) {
  const pagination = usePagination(agents, 10);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="text-sm font-medium">All Field Agents</div>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link href="/dashboard/field-officers">
            <ExternalLink className="h-3 w-3 mr-1" />
            Open Full View
          </Link>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Contractor</TableHead>
              <TableHead>Ward</TableHead>
              <TableHead>Collected</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.pageItems.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {agent.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-[10px] text-muted-foreground">{agent.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs">{agent.contractorName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">{agent.ward}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{formatCurrency(agent.totalCollected)}</TableCell>
                <TableCell>
                  <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {agents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No field agents found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="px-4 pb-4">
        <ListPagination pagination={pagination} unit="agents" />
      </div>
    </Card>
  );
}