/* eslint-disable @typescript-eslint/no-explicit-any */


import React from 'react'
import {  useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  PageHeader,
  StatCard,
} from "@/components/dashboard/shared";

import {
  CheckCircle2,
  Wallet,
  FilePlus2,
  Receipt as ReceiptIcon,
} from "lucide-react";
import {
  useDemandNotice,
  useFieldOfficerBusinesses,
  useFieldOfficerCollections,
  useViolation,
  useWardPermits,
} from "@/hooks/queries/useFieldOfficer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Business } from "@/services/apiFieldOfficer";
import { tokenManager } from "@/services/apiAuth";
import { captureRecord } from "@/lib/offline/queue";
import { NGN, statusClass } from './page';
import { ErrorState } from "@/components/ui/ErrorState";
import { MetricsSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";

function FieldOfficerView() {
  const user = tokenManager.getUser();

  // Replace mock store with real API hooks
  const { useGetPermits } = useWardPermits();
  const { issueDemandNotice, isIssuing } = useDemandNotice();
  const { logViolation, isLogging } = useViolation();
  const { useGetCollectionSummary } = useFieldOfficerCollections();
  const { useGetBusinesses } = useFieldOfficerBusinesses(
    user?.role === "field_officer",
  );

  // Fetch real data
  const {
    data: permitsData,
    isLoading: permitsLoading,
    error: permitsError,
    refetch: refetchPermits,
  } = useGetPermits();
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useGetCollectionSummary();
  const {
    data: businessesData,
    isLoading: businessesLoading,
    error: businessesError,
    refetch: refetchBusinesses,
  } = useGetBusinesses();

  const [scanOpen, setScanOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [businessSearch, setBusinessSearch] = useState("");

  // Form state for violation logging
  const [violationForm, setViolationForm] = useState({
    businessId: "" as string | undefined,
    businessName: "",
    address: "",
    description: "",
    severity: "minor" as "minor" | "major" | "critical",
  });

  // Get data from API response
  const permits = permitsData?.permits ?? [];
  const stats = permitsData?.stats;
  const businesses = businessesData ?? [];

  const dailyCollections = stats?.dailyCollections ?? 0;
  const inspectedShops = stats?.inspectedShops ?? 0;
  const wardId = stats?.wardId;

//   console.log(permitsData, "permitsData");
  // Filter businesses based on search
  const filteredBusinesses = businesses.filter(
    (b) =>
      b.businessName.toLowerCase().includes(businessSearch.toLowerCase()) ||
      b.ownerName.toLowerCase().includes(businessSearch.toLowerCase()),
  );

  // Handle business selection
  const handleSelectBusiness = (business: Business) => {
    setViolationForm({
      ...violationForm,
      businessId: business.id,
      businessName: business.businessName,
      address: business.address,
    });
    setBusinessSearch("");
  };

  // Clear business selection
  const handleClearBusiness = () => {
    setViolationForm({
      ...violationForm,
      businessId: undefined,
      businessName: "",
      address: "",
    });
  };

  const handleIssueDemandNotice = (permitId: string, businessName: string) => {
    issueDemandNotice(permitId, {
      onSuccess: () => {
        toast.success(`Demand notice issued to ${businessName}`);
      },
    });
  };

  const handleLogViolation = () => {
    // Validate based on whether business is selected or not
    if (violationForm.businessId) {
      // Business selected - only description required
      if (!violationForm.description) {
        toast.error("Description is required");
        return;
      }
    } else {
      // No business selected - businessName and address required
      if (!violationForm.businessName || !violationForm.address) {
        toast.error(
          "Business name and address are required for unregistered businesses",
        );
        return;
      }
    }

    if (!wardId) {
      toast.error("No ward assigned to your account");
      return;
    }

    const payload = violationForm.businessId
      ? {
          businessId: violationForm.businessId,
          description: violationForm.description,
          severity: violationForm.severity,
          wardId: wardId,
        }
      : {
          businessName: violationForm.businessName,
          address: violationForm.address,
          description: violationForm.description,
          severity: violationForm.severity,
          wardId: wardId,
        };

    const resetViolationForm = () => {
      setLogOpen(false);
      setViolationForm({
        businessId: undefined,
        businessName: "",
        address: "",
        description: "",
        severity: "minor",
      });
    };

    // Offline: capture the violation on the device instead of losing it.
    // It syncs through POST /offline/sync when the network returns.
    const captureOffline = async () => {
      if (!user?.id) return;
      await captureRecord({
        recordType: "violation",
        officerId: user.id,
        title: `Violation: ${payload.businessName || "Registered business"}`,
        formData: payload as Record<string, unknown>,
      });
      toast.success(
        "No network. Violation saved on this phone. It will sync automatically when the network returns.",
      );
      resetViolationForm();
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      void captureOffline();
      return;
    }

    logViolation(payload, {
      onSuccess: resetViolationForm,
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : "";
        const status = (err as { status?: number })?.status;
        if (
          !navigator.onLine ||
          status === 0 ||
          /network|failed to fetch|timeout|econn/i.test(message)
        ) {
          void captureOffline();
        }
      },
    });
  };

  if (permitsLoading || summaryLoading || businessesLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Field Enforcement Hub"
          subtitle={`Assigned Ward Verification & Billing Portal${wardId ? `: ${stats?.wardName} Ward` : ""}.`}
        />
        <MetricsSkeleton count={4} />
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  const anyError = permitsError || summaryError || businessesError;
  if (anyError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Field Enforcement Hub"
          subtitle={`Assigned Ward Verification & Billing Portal${wardId ? `: ${stats?.wardName} Ward` : ""}.`}
        />
        <ErrorState
          title="Failed to load field enforcement data"
          error={anyError}
          refetch={() => {
            refetchPermits();
            refetchSummary();
            refetchBusinesses();
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Field Enforcement Hub"
        subtitle={`Assigned Ward Verification & Billing Portal${wardId ? `: ${stats?.wardName} Ward` : ""}.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Dialog open={logOpen} onOpenChange={setLogOpen}>
              <DialogTrigger asChild>
                {/* <Button className="shadow-lg">
                  <FilePlus2 className="h-4 w-4 mr-2" />
                  Log Violation
                </Button> */}
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Log Business Violation</DialogTitle>
                  <DialogDescription>
                    Record a compliance violation. Search for an existing
                    business or enter details for unregistered businesses.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Business Search/Selection */}
                  <div>
                    <Label>Search Existing Business (Optional)</Label>
                    <div className="relative">
                      <Input
                        placeholder="Search by business or owner name..."
                        value={businessSearch}
                        onChange={(e) => setBusinessSearch(e.target.value)}
                      />
                      {businessSearch && filteredBusinesses.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredBusinesses.map((b) => (
                            <button
                              key={b.id}
                              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                              onClick={() => handleSelectBusiness(b)}
                            >
                              <div className="font-medium">
                                {b.businessName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {b.ownerName} • {b.address}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {violationForm.businessId && (
                      <div className="mt-2 flex items-center gap-2 bg-primary/5 p-2 rounded-md">
                        <span className="text-sm flex-1">
                          Selected:{" "}
                          <strong>{violationForm.businessName}</strong>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearBusiness}
                          className="h-6 px-2"
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Business Name - only show if no business selected */}
                  {!violationForm.businessId && (
                    <div>
                      <Label>Business Name *</Label>
                      <Input
                        placeholder="e.g. Mama Tunde Stores"
                        value={violationForm.businessName}
                        onChange={(e) =>
                          setViolationForm({
                            ...violationForm,
                            businessName: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Address - only show if no business selected */}
                  {!violationForm.businessId && (
                    <div>
                      <Label>Street Address *</Label>
                      <Input
                        placeholder="Address within your ward"
                        value={violationForm.address}
                        onChange={(e) =>
                          setViolationForm({
                            ...violationForm,
                            address: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  <div>
                    <Label>Severity</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={violationForm.severity}
                      onChange={(e) =>
                        setViolationForm({
                          ...violationForm,
                          severity: e.target.value as any,
                        })
                      }
                    >
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <Label>Description *</Label>
                    <Textarea
                      placeholder="Describe the violation..."
                      rows={3}
                      value={violationForm.description}
                      onChange={(e) =>
                        setViolationForm({
                          ...violationForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Show summary of what will be logged */}
                  <div className="bg-muted/30 p-3 rounded-md text-xs text-muted-foreground">
                    {violationForm.businessId ? (
                      <span>
                        âœ“ Logging violation for registered business:{" "}
                        <strong>{violationForm.businessName}</strong>
                      </span>
                    ) : (
                      <span>
                        âš ï¸ Logging violation for unregistered business:{" "}
                        <strong>
                          {violationForm.businessName || "Name not entered"}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setLogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleLogViolation} disabled={isLogging}>
                    {isLogging ? "Saving..." : "Save Violation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          label="My Daily Collections"
          value={NGN(dailyCollections)}
          icon={Wallet}
          color="success"
          trend="Today"
        />
        <StatCard
          label="Inspected Shops"
          value={String(inspectedShops)}
          icon={CheckCircle2}
          color="primary"
        />
      </div>

      <Card className="p-4">
        <div className="text-sm text-muted-foreground mb-3">
          Showing permits in your assigned ward
          {wardId ? `: ${stats?.wardName} Ward` : ""}.
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Street Address</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permits.map((p) => (
                <TableRow key={p.id} className="transition-smooth">
                  <TableCell>
                    <div className="font-medium">{p.businessName}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.ownerName} • {p.phone}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.address}</TableCell>
                  <TableCell
                    className={
                      p.outstanding > 0
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {NGN(p.outstanding)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusClass(p.status)}>
                      {p.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleIssueDemandNotice(p.id, p.businessName)
                      }
                      disabled={p.outstanding === 0 || isIssuing}
                    >
                      <ReceiptIcon className="h-4 w-4 mr-1" />
                      {isIssuing ? "Processing..." : "Issue Demand Notice"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {permits.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No permits in your assigned ward.
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

export default FieldOfficerView
