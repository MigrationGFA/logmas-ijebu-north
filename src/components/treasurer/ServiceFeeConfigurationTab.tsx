/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  SlidersHorizontal,
  Power,
  CheckCircle2,
  RefreshCw,
  Search,
  FileBadge,
  Users,
  Building2,
  Sprout,
  ShieldCheck,
  Home,
  Truck,
  Beer,
  Tv,
  Pickaxe,
  MapPin,
  Store,
  Layers,
  Sparkles,
  Loader2,
  AlertTriangle,
  Plus,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { useServiceFees } from "@/hooks/queries/useTreasurer";
import { CreateServiceModal } from "./CreateServiceModal";
import { EditServiceModal } from "./EditServiceModal";

export const formatNgn = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

// Helper to render appropriate icon for each service
function getServiceIcon(id: string, className = "h-4 w-4") {
  const iconMap: Record<string, React.ReactNode> = {
    certificate_of_origin: <FileBadge className={className} />,
    club_registration: <Users className={className} />,
    cda_registration: <Building2 className={className} />,
    farmers_registration: <Sprout className={className} />,
    environmental_sanitation: <ShieldCheck className={className} />,
    tenement_rate: <Home className={className} />,
    haulage_fees: <Truck className={className} />,
    liquor_licence: <Beer className={className} />,
    viewing_centre_licence: <Tv className={className} />,
    quarry_permit: <Pickaxe className={className} />,
    street_naming: <MapPin className={className} />,
    kiosk_licence: <Store className={className} />,
  };
  return iconMap[id] || <Layers className={className} />;
}

export default function ServiceFeeConfigurationTab() {
  const { upsertServiceFee, isUpserting, useGetServiceFees } = useServiceFees();
  // The list comes from the treasurer fees endpoint, not the catalogue:
  // it returns every service with its fee config, active or not, which
  // is what a pricing screen needs. The catalogue only lists active
  // services, so a deactivated service could never be priced or
  // switched back on from here.
  const { data: servicesData, isLoading, refetch } = useGetServiceFees();
  // Add these state variables near the other useState declarations
  const [initialFeeAmount, setInitialFeeAmount] = useState<number | string>("");
  const [initialFeeStatus, setInitialFeeStatus] = useState<
    "ACTIVE" | "INACTIVE"
  >("ACTIVE");

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [feeAmount, setFeeAmount] = useState<number | string>("");
  const [feeStatus, setFeeStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Table filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Table pagination (client-side over the filtered list)
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter]);

  // Create & Edit Service Modals State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Services with their fee configs
  const services = useMemo(() => {
    return servicesData ?? [];
  }, [servicesData]);

  // Set first service as default when data loads
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // // When selected service changes, populate form
  // useEffect(() => {
  //   if (selectedServiceId && services.length > 0) {
  //     const service = services.find((s) => s.id === selectedServiceId);
  //     if (service) {
  //       const fee = service.feeConfig?.amount || 0;
  //       setFeeAmount(fee);
  //       setFeeStatus(service.feeConfig?.status || "ACTIVE");
  //     }
  //   }
  // }, [selectedServiceId, services]);

  // When selected service changes, populate form and track initial values
  useEffect(() => {
    if (selectedServiceId && services.length > 0) {
      const service = services.find((s) => s.id === selectedServiceId);
      if (service) {
        const fee = service.feeConfig?.amount || 0;
        const status = service.feeConfig?.status || "ACTIVE";

        // Set current values
        setFeeAmount(fee);
        setFeeStatus(status);

        // Set initial values for comparison
        setInitialFeeAmount(fee);
        setInitialFeeStatus(status);
      }
    }
  }, [selectedServiceId, services]);

  // Check if any changes have been made
  const hasChanges = useMemo(() => {
    const currentFee = Number(feeAmount);
    const initialFee = Number(initialFeeAmount);
    return currentFee !== initialFee || feeStatus !== initialFeeStatus;
  }, [feeAmount, initialFeeAmount, feeStatus, initialFeeStatus]);

  const selectedService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId);
  }, [services, selectedServiceId]);

  const currentActiveConfig = useMemo(() => {
    return selectedService?.feeConfig || null;
  }, [selectedService]);

  // Handle service selector change
  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
  };

  // Handle saving configuration
  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedServiceId) {
      toast.error("Please select a service first");
      return;
    }

    const numFee = Number(feeAmount);
    if (isNaN(numFee) || numFee < 0) {
      toast.error("Please enter a valid non-negative fee amount");
      return;
    }

    try {
      const serviceName = selectedService?.name || selectedServiceId;
      const formattedFee = formatNgn(numFee);
      const statusText = feeStatus === "ACTIVE" ? "Active" : "Inactive";

      // Track what changed
      const changes: string[] = [];
      const initialFee = Number(initialFeeAmount);
      const initialStatus = initialFeeStatus;

      if (numFee !== initialFee) {
        changes.push(`fee from ${formatNgn(initialFee)} to ${formattedFee}`);
      }
      if (feeStatus !== initialStatus) {
        changes.push(
          `status from ${initialStatus === "ACTIVE" ? "Active" : "Inactive"} to ${statusText}`,
        );
      }

      await upsertServiceFee({
        serviceId: selectedServiceId,
        data: {
          amount: numFee,
          status: feeStatus === "ACTIVE",
        },
      });

      // Refetch to get updated data
      await refetch();

      // Show specific toast message based on changes
      if (changes.length === 0) {
        toast.info(`No changes made to ${serviceName}`);
      } else if (changes.length === 1) {
        toast.success(`Updated ${serviceName}: ${changes[0]}`);
      } else {
        toast.success(`Updated ${serviceName}: ${changes.join(" and ")}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update service fee");
    }
  };

  // Handle toggle status from table
  const handleToggleStatus = async (
    serviceId: string,
    currentStatus: string,
  ) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const fee = service.feeConfig?.amount || 0;

    try {
      await upsertServiceFee({
        serviceId,
        data: {
          // feeConfig.amount arrives as a string (money serialization);
          // the API contract wants a number.
          amount: Number(fee),
          status: newStatus === "ACTIVE",
        },
      });
      await refetch();
      toast.success(
        `${service.name} is now ${newStatus === "ACTIVE" ? "Active" : "Inactive"}`,
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle service status");
    }
  };

  // Filter table data
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.revenueHead.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.feeConfig?.status === "ACTIVE") ||
        (statusFilter === "inactive" &&
          item.feeConfig?.status === "INACTIVE") ||
        (statusFilter === "not_configured" && !item.feeConfig);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [services, searchQuery, categoryFilter, statusFilter]);

  // Paged slice of the filtered list. The page clamps to the last valid
  // page when the list shrinks (a save, a filter change), so the table
  // never lands on a blank page.
  const totalPages = Math.max(
    1,
    Math.ceil(filteredServices.length / PAGE_SIZE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safePage - 1) * PAGE_SIZE;
  const pagedServices = filteredServices.slice(
    pageStartIndex,
    pageStartIndex + PAGE_SIZE,
  );

  // Summary statistics
  const stats = useMemo(() => {
    const totalServices = services.length;
    const activeCount = services.filter(
      (s) => s.feeConfig?.status === "ACTIVE",
    ).length;
    const inactiveCount = services.filter(
      (s) => s.feeConfig?.status === "INACTIVE",
    ).length;
    const notConfigured = services.filter((s) => !s.feeConfig).length;
    const configuredServices = services.filter((s) => s.feeConfig);
    const totalFeeSum = configuredServices.reduce(
      (sum, s) => sum + Number(s.feeConfig?.amount || 0),
      0,
    );
    const avgFee =
      configuredServices.length > 0
        ? totalFeeSum / configuredServices.length
        : 0;
    return { totalServices, activeCount, inactiveCount, notConfigured, avgFee };
  }, [services]);

  const allCategories = useMemo(() => {
    return Array.from(new Set(services.map((s) => s.category)));
  }, [services]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading services...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top summary metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Statutory Services
            </span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold mt-2">
            {stats.totalServices} Services
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Universal the LGA service registry
          </p>
        </Card>

        <Card className="p-4 bg-card border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Active Fee Schedules
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-600">
            {stats.activeCount} Active
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Available for live citizen applications
          </p>
        </Card>

        <Card className="p-4 bg-card border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Inactive / Suspended
            </span>
            <Power className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-600">
            {stats.inactiveCount} Inactive
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Temporarily disabled fee schedules
          </p>
        </Card>

        <Card className="p-4 bg-card border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Not Configured
            </span>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-orange-600">
            {stats.notConfigured} Pending
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Awaiting fee configuration
          </p>
        </Card>
      </div>

      {/* Main Fee Configuration Form Section */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                Fee Configuration & Management
              </CardTitle>
              <CardDescription>
                Select a service to update fees, or create a new statutory service for the LGA.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {currentActiveConfig && (
                <Badge
                  variant={
                    currentActiveConfig.status === "ACTIVE"
                      ? "default"
                      : "secondary"
                  }
                  className={
                    currentActiveConfig.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs"
                      : "bg-muted text-muted-foreground text-xs"
                  }
                >
                  Status:{" "}
                  {currentActiveConfig.status === "ACTIVE"
                    ? "Active"
                    : "Inactive"}
                </Badge>
              )}

              <Button
                type="button"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="bg-primary text-primary-foreground gap-1.5 text-xs font-semibold h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Service
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveChanges} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* 1. Service Selector */}
              <div className="space-y-2 md:col-span-5">
                <Label
                  htmlFor="service-select"
                  className="text-sm font-semibold flex items-center gap-1.5"
                >
                  Service:
                  <span className="text-xs font-normal text-muted-foreground">
                    (Select any of the 12 services)
                  </span>
                </Label>
                <Select
                  value={selectedServiceId}
                  onValueChange={handleServiceSelect}
                >
                  <SelectTrigger
                    id="service-select"
                    className="w-full h-11 bg-background"
                  >
                    <SelectValue placeholder="Select Service" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {services.map((s) => {
                      const fee = s.feeConfig?.amount || 0;
                      return (
                        <SelectItem key={s.id} value={s.id} className="py-2.5">
                          <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex items-center gap-2">
                              {getServiceIcon(
                                s.id,
                                "h-4 w-4 text-muted-foreground",
                              )}
                              <span className="font-medium text-sm">
                                {s.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto text-xs">
                              <span className="text-muted-foreground">
                                ({s.category})
                              </span>
                              <span className="font-bold text-primary">
                                {fee > 0 ? formatNgn(fee) : "Not set"}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {selectedService && (
                  <div className="mt-2 p-3 bg-muted/40 rounded-md border border-border/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Code:</span>
                      <span className="font-mono font-medium">
                        {selectedService.code}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Revenue Head:
                      </span>
                      <span className="font-mono font-medium">
                        {selectedService.revenueHead}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {selectedService.category}
                      </Badge>
                    </div>
                    {selectedService.feeConfig && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Current Fee:
                        </span>
                        <span className="font-semibold text-primary">
                          {formatNgn(Number(selectedService.feeConfig.amount))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Fee Input */}
              <div className="space-y-2 md:col-span-4">
                <Label
                  htmlFor="fee-input"
                  className="text-sm font-semibold flex items-center gap-1.5"
                >
                  Fee:
                  <span className="text-xs font-normal text-muted-foreground">
                    (Amount in Nigerian Naira)
                  </span>
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                    ₦
                  </div>
                  <Input
                    id="fee-input"
                    type="number"
                    min="0"
                    step="500"
                    placeholder="Enter fee amount"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="pl-8 h-11 text-base font-semibold bg-background"
                    required
                  />
                </div>

                {/* Quick fee adjustment presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground self-center mr-1">
                    Quick adjust:
                  </span>
                  {[3500, 5000, 10000, 15000, 25000, 50000, 100000, 150000].map(
                    (preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFeeAmount(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          Number(feeAmount) === preset
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground border-border/60"
                        }`}
                      >
                        {formatNgn(preset)}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* 3. Status Selector */}
              <div className="space-y-2 md:col-span-3">
                <Label
                  htmlFor="status-select"
                  className="text-sm font-semibold flex items-center gap-1.5"
                >
                  Status:
                </Label>
                <Select
                  value={feeStatus}
                  onValueChange={(v: "ACTIVE" | "INACTIVE") => setFeeStatus(v)}
                >
                  <SelectTrigger
                    id="status-select"
                    className="w-full h-11 bg-background"
                  >
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          Active
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="INACTIVE">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        <span className="font-medium text-muted-foreground">
                          Inactive
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <p className="text-[11px] text-muted-foreground pt-1">
                  {feeStatus === "ACTIVE"
                    ? "âœ“ Active fee is applied automatically to new applications."
                    : "âš  Inactive fees suspend new statutory applications."}
                </p>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {currentActiveConfig && (
                  <span>
                    Last updated:{" "}
                    <strong className="font-medium text-foreground">
                      {format(
                        currentActiveConfig.updatedAt,
                        "MMMM d, yyyy 'at' h:mm a",
                      )}
                    </strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpserting || !hasChanges}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 min-w-[140px]"
                >
                  {isUpserting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Save Changes
                    </>
                  )}
                </Button>
                {hasChanges && (
                  <span className="text-[11px] text-amber-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Configured Services List / Table Section */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">
                Configured Services & Statutory Fees
              </CardTitle>
              <CardDescription>
                Overview of all statutory the Local Government Area services
                and their configured revenue fees.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="self-start md:self-auto font-mono text-xs"
            >
              Showing {filteredServices.length} of {services.length} Services
            </Badge>
          </div>

          {/* Filter & Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3">
            <div className="relative sm:col-span-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by service name, revenue head..."
                className="pl-9 bg-background"
              />
            </div>

            <div className="sm:col-span-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                  <SelectItem value="not_configured">Not Configured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category / Revenue Head</TableHead>
                  <TableHead className="text-right">Configured Fee</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No services match your search and filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedServices.map((service, index) => {
                    const isSelected = service.id === selectedServiceId;
                    const fee = service.feeConfig?.amount || 0;
                    // FO-only services carry no fee config by design: their
                    // status is the service's own active flag, never
                    // "Not Configured".
                    const status = service.foOnly
                      ? service.isActive === false
                        ? "INACTIVE"
                        : "ACTIVE"
                      : service.feeConfig?.status || "NOT_CONFIGURED";
                    const lastUpdated =
                      service.feeConfig?.updatedAt || service.updatedAt;
                    const isToggling = isUpserting && isSelected;

                    return (
                      <TableRow
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <TableCell className="text-center text-xs font-mono text-muted-foreground">
                          {pageStartIndex + index + 1}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-md bg-muted/60 text-primary shrink-0">
                              {getServiceIcon(service.id, "h-4 w-4")}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                                {service.name}
                                {isSelected && (
                                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-normal">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                Code: {service.code}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className="text-xs font-normal"
                            >
                              {service.category
                                .replace(/_/g, " ")
                                .toLowerCase()
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Badge>
                            <div className="text-xs text-muted-foreground font-mono">
                              {service.revenueHead}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          {service.foOnly ? (
                            <span className="text-xs text-muted-foreground italic">
                              Per collection
                            </span>
                          ) : fee > 0 ? (
                            <span className="font-bold text-base text-foreground">
                              {formatNgn(fee)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Not set
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {status === "ACTIVE" && (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                              Active
                            </Badge>
                          )}
                          {status === "INACTIVE" && (
                            <Badge
                              variant="secondary"
                              className="bg-muted text-muted-foreground"
                            >
                              Inactive
                            </Badge>
                          )}
                          {status === "NOT_CONFIGURED" && (
                            <Badge
                              variant="outline"
                              className="border-orange-500/40 text-orange-600"
                            >
                              Not Configured
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {lastUpdated
                            ? new Date(lastUpdated).toLocaleDateString()
                            : " - "}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs px-2 gap-1 text-primary hover:bg-primary/10 border-primary/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingService(service);
                                setEditModalOpen(true);
                              }}
                            >
                              <Edit3 className="h-3 w-3" />
                              Edit
                            </Button>

                            {!service.foOnly && (
                              <Button
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className="h-8 text-xs px-2.5"
                                onClick={() => {
                                  handleServiceSelect(service.id);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                              >
                                <SlidersHorizontal className="h-3 w-3 mr-1" />
                                {isSelected ? "Editing" : "Configure"}
                              </Button>
                            )}

                            {!service.foOnly && status !== "NOT_CONFIGURED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  status === "ACTIVE"
                                    ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                title={
                                  status === "ACTIVE"
                                    ? "Deactivate Fee"
                                    : "Activate Fee"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(service.id, status);
                                }}
                                disabled={isToggling}
                              >
                                {isToggling ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Power className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filteredServices.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-xs text-muted-foreground">
                Showing {pageStartIndex + 1} to{" "}
                {Math.min(
                  pageStartIndex + PAGE_SIZE,
                  filteredServices.length,
                )}{" "}
                of {filteredServices.length} services
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(safePage - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={page === safePage ? "default" : "outline"}
                      size="sm"
                      className="min-w-9"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(safePage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treasurer Create Service Modal */}
      <CreateServiceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => refetch()}
      />

      {/* Treasurer Edit Service Modal */}
      <EditServiceModal
        service={editingService}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

