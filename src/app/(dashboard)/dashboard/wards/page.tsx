/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useMemo } from "react";

import { z } from "zod";
import { PageHeader } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MapPin,
  Users,
  UserPlus,
  Phone,
  Mail,
  ShieldCheck,
  KeyRound,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useLgaAdmin } from "@/hooks/queries/useLgaAdmin";

import AddCouncillorDialog from "@/components/lgaAdmin/AddCouncillorDialog";
import AddWardDialog from "@/components/lgaAdmin/AddWardDialog";
import AssignCouncillorDialog from "@/components/lgaAdmin/AssignCouncillorDialog";
import { Staff } from "@/services/apiLgaAdmin";


// Ward Form Schema
export const wardSchema = z.object({
  name: z.string().min(1, "Ward name is required"),
  code: z.string().min(1, "Ward code is required"),
  description: z.string().optional(),
});

export type WardFormData = z.infer<typeof wardSchema>;

// Councillor Form Schema
export const councillorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["ward_councillor"]),
  wardId: z.string().optional(),
});

export type CouncillorFormData = z.infer<typeof councillorSchema>;

export default function WardsPage() {
  const { wards: wardsApi, staff: staffApi } = useLgaAdmin();
  const { useGetWards, createWard, deleteWard, assignCouncillor, isCreating, isDeleting, isAssigning } = wardsApi;
  const { useGetStaff, createStaff, toggleStaffStatus, isCreating: isCreatingStaff, isToggling } = staffApi;
  
  const { data: wardsData, isLoading: wardsLoading, refetch: refetchWards } = useGetWards({ limit: 100 });
  const { data: staffData, isLoading: staffLoading, refetch: refetchStaff } = useGetStaff({ 
    role: "ward_councillor",
    limit: 100 
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  
  const wards = useMemo(() => wardsData || [], [wardsData]);
  const councillors = useMemo(() => staffData || [], [staffData]);

  // console.table(wards)
  
  const filteredWards = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return wards;
    return wards.filter((w) => w.name.toLowerCase().includes(query));
  }, [wards, searchQuery]);
  
  const assignedCount = wards?.filter((w) => (w?.councillors?.length ?? 0) > 0).length ?? 0;
  const unassignedCount = wards.length - assignedCount;

  const handleCreateWard = async (data: WardFormData) => {
    await createWard(data);
    refetchWards();
  };

  const handleDeleteWard = async (id: string) => {
    if (confirm("Are you sure you want to delete this ward?")) {
      await deleteWard(id);
      refetchWards();
    }
  };

  const handleAssignCouncillor = async (wardId: string, councillorId: string) => {
    await assignCouncillor({ id: wardId, data: { councillorId } });
    refetchWards();
    refetchStaff();
  };

  const handleCreateCouncillor = async (data: CouncillorFormData) => {
    await createStaff({
      ...data,
      role: "ward_councillor",
    });
    refetchStaff();
    refetchWards();
  };

  const handleToggleStatus = async (id: string) => {
    await toggleStaffStatus({id});
    refetchStaff();
  };

  const isLoading = wardsLoading || staffLoading;

  console.log(filteredWards,"filteredWards")

  return (
    <div>
      <PageHeader
        title="Ward Management"
        subtitle="Create wards, assign councillors, and provision Ward Councillor accounts"
        action={
          <div className="flex gap-2">
            <AddCouncillorDialog 
              wards={wards} 
              onCreate={handleCreateCouncillor} 
              isCreating={isCreatingStaff}
            />
            <AddWardDialog onCreate={handleCreateWard} isCreating={isCreating} />
          </div>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={MapPin} label="Total Wards" value={wards.length} tone="primary" />
        <StatCard icon={ShieldCheck} label="Wards with Councillor" value={assignedCount} tone="success" />
        <StatCard icon={Users} label="Unassigned Wards" value={unassignedCount} tone="warning" />
        <StatCard icon={UserPlus} label="Total Councillors" value={councillors.length} tone="info" />
      </div>

      <Tabs defaultValue="wards" className="w-full">
        <TabsList>
          <TabsTrigger value="wards">Wards ({wards.length})</TabsTrigger>
          <TabsTrigger value="councillors">Councillors ({councillors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="wards" className="mt-4">
          <div className="mb-4 relative max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wards..."
              className="pl-8"
            />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWards.map((ward) => {
                const councillor = ward.councillors?.[0];
                return (
                  <Card key={ward.id} className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-base flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-primary" />
                          {ward.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Code: {ward.code}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteWard(ward.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {ward.description && (
                      <p className="text-xs text-muted-foreground mt-2">{ward.description}</p>
                    )}
                    <div className="mt-4 pt-3 border-t">
                      {councillor ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {councillor.firstName[0]}{councillor.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">
                                {councillor.firstName} {councillor.lastName}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {councillor?.phone ?? "No phone"}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleAssignCouncillor(ward.id, "")}
                            disabled={isAssigning}
                          >
                            Unassign
                          </Button>
                        </div>
                      ) : (
                        <AssignCouncillorDialog
                          ward={ward}
                          councillors={councillors}
                          onAssign={(cid) => handleAssignCouncillor(ward.id, cid)}
                          isAssigning={isAssigning}
                        />
                      )}
                    </div>
                  </Card>
                );
              })}
              {filteredWards.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No wards found. Create your first ward.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="councillors" className="mt-4">
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2.5">Councillor</th>
                      <th className="text-left px-4 py-2.5">Contact</th>
                      <th className="text-left px-4 py-2.5">Assigned Ward</th>
                      <th className="text-left px-4 py-2.5">Status</th>
                      <th className="text-right px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {councillors.map((c:Staff) => {
                      const ward = wards.find((w) => w.id === c.wardId);
                      return (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {c.firstName[0]}{c.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{c.firstName} {c.lastName}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  Created {new Date(c.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </div>
                            {c.phone && (
                              <div className="text-xs flex items-center gap-1 text-muted-foreground mt-0.5">
                                <Phone className="h-3 w-3" />
                                {c.phone}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {ward ? (
                              <Badge variant="secondary">{ward.name}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={c.isActive ? "default" : "destructive"}
                            >
                              {c.isActive ? "Active" : "Suspended"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  toast.success(`Password reset link sent to ${c.firstName} ${c.lastName}`);
                                }}
                              >
                                <KeyRound className="h-3 w-3 mr-1" />
                                Reset
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleToggleStatus(c.id)}
                                disabled={isToggling}
                              >
                                {c.isActive ? "Suspend" : "Activate"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {councillors.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          No councillors found. Create your first councillor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: string }) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  };
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tones[tone] || tones.primary}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </Card>
  );
}





