"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/dashboard/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileBadge,
  FileText,
  DollarSign,
  Download,
  Printer,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Building2,
  Phone,
  MapPin,
  Plus,
  RefreshCw,
  AlertTriangle,
  Receipt,
  User,
} from "lucide-react";
import Link from "next/link";
import { LGA_CONFIG } from "@/config/lga.config";
import { tokenManager } from "@/services/apiAuth";
import { getPublicCertificateUrl } from "@/lib/certificateTokens";
import {
  useApplications,
  useMoveToUnderReview,
  useApproveApplication,
  useDeclineApplication,
} from "@/hooks/queries/useApplications";
import { Application, ApplicationStatus } from "@/types/application";
import { FormDataViewer } from "@/components/services/FormDataViewer";
import { DocumentsViewer } from "@/components/services/DocumentsViewer";
import { useServices } from "@/hooks/queries/useServices";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

const WARDS = LGA_CONFIG.wards.map((ward) => ward.name);

export default function ApplicationsPage() {
  const currentUser = tokenManager.getUser();
  const userRole = currentUser?.role || "citizen";

  const isAdmin = ["super_admin", "lga_admin", "chairman", "councillor"].includes(userRole);
  const isFieldOfficer = userRole === "field_officer";
  const isCitizen = !isAdmin && !isFieldOfficer;

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [wardFilter, setWardFilter] = useState<string>("all");

  // Selection & Modal States
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);

  // Queries & Mutations
  const { data: applications = [], isLoading, error, refetch, isFetching } = useApplications({
    search: searchTerm,
    status: statusFilter !== "all" ? statusFilter : undefined,
    serviceId: serviceFilter !== "all" ? serviceFilter : undefined,
    wardId: wardFilter !== "all" ? wardFilter : undefined,
  });

  const {services,isLoading:isServicing} = useServices()

  const moveToReviewMutation = useMoveToUnderReview();
  const approveMutation = useApproveApplication();
  const declineMutation = useDeclineApplication();

  // Filter applications for citizen role if applicable, with client-side
  // fallback for search/status/service/ward filters in case the API does not
  // apply them.
  const displayApplications = React.useMemo(() => {
    let list = applications;
    if (isCitizen && currentUser) {
      const userPhone = currentUser.phone || "";
      const userEmail = currentUser.email || "";
      const userName = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim().toLowerCase();

      list = list.filter((app) => {
        if (app.applicantId && app.applicantId === currentUser.id) return true;
        if (app.createdById && app.createdById === currentUser.id) return true;
        return false;
      });
    }

    // Client-side search fallback
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((app) =>
        [app.applicationNumber, app.formData?.fullName, app.formData?.email, app.formData?.phone, app.applicant?.firstName, app.applicant?.lastName, app.applicant?.email, app.applicant?.phone, app.service?.name]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)),
      );
    }

    // Client-side status fallback
    if (statusFilter && statusFilter !== "all") {
      const sf = statusFilter.toLowerCase();
      list = list.filter((app) => {
        const s = String(app.status || "").toLowerCase();
        if (sf === "awaiting_form") return s.includes("awaiting_form");
        return s === sf;
      });
    }

    // Client-side service fallback
    if (serviceFilter && serviceFilter !== "all") {
      list = list.filter((app) => {
        const sid = app.serviceId;
        return sid === serviceFilter;
      });
    }

    // Client-side ward fallback
    if (wardFilter && wardFilter !== "all") {
      list = list.filter((app) => {
        const wid = app.ward || app.formData?.ward || app.applicant?.ward;
        return wid === wardFilter;
      });
    }

    return list;
  }, [applications, isCitizen, currentUser, searchTerm, statusFilter, serviceFilter, wardFilter]);

  // Status Metrics
  const stats = React.useMemo(() => {
    const total = displayApplications.length;
    const submitted = displayApplications.filter((a) => a.status?.toLowerCase() === "submitted").length;
    const underReview = displayApplications.filter((a) => a.status?.toLowerCase() === "under_review").length;
    const approved = displayApplications.filter((a) => a.status?.toLowerCase() === "approved" || a.status?.toLowerCase() === "completed").length;
    const declined = displayApplications.filter((a) => a.status?.toLowerCase() === "declined" || a.status?.toLowerCase() === "rejected").length;
    return { total, submitted, underReview, approved, declined };
  }, [displayApplications]);

  const handleOpenDetail = (app: Application) => {
    setSelectedApp(app);
    setDetailModalOpen(true);
  };

  const handleMoveToReview = async (app: Application) => {
    try {
      const updated = await moveToReviewMutation.mutateAsync({ id: app.id });
      if (selectedApp?.id === app.id) setSelectedApp(updated);
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleApprove = async (app: Application) => {
    try {
      const updated = await approveMutation.mutateAsync({ id: app.id });
      if (selectedApp?.id === app.id) setSelectedApp(updated);
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleOpenDecline = (app: Application) => {
    setSelectedApp(app);
    setDeclineReason("");
    setDeclineModalOpen(true);
  };

  const handleExecuteDecline = async () => {
    if (!selectedApp) return;
    if (!declineReason.trim()) {
      return;
    }

    try {
      const updated = await declineMutation.mutateAsync({
        id: selectedApp.id,
        declineReason: declineReason.trim(),
      });
      setSelectedApp(updated);
      setDeclineModalOpen(false);
      setDeclineReason("");
    } catch {
      // Error handled by mutation toast
    }
  };

  // console.log(selectedApp,"lol")

  const getStatusBadge = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "awaiting_form") {
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300 text-[11px] gap-1 font-semibold">
          <FileText className="w-3 h-3" /> Awaiting Form (Paid)
        </Badge>
      );
    }
    if (s === "submitted") {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300 text-[11px] gap-1 font-semibold">
          <Clock className="w-3 h-3" /> Submitted
        </Badge>
      );
    }
    if (s === "awaiting_payment_confirmation") {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 text-[11px] gap-1 font-semibold">
          <Clock className="w-3 h-3" /> Awaiting Payment Confirmation
        </Badge>
      );
    }
    if (s.includes("review")) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 text-[11px] gap-1 font-semibold">
          <RefreshCw className="w-3 h-3 animate-spin" /> Under Review
        </Badge>
      );
    }
    if (s === "approved" || s === "completed") {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[11px] gap-1 font-semibold">
          <CheckCircle2 className="w-3 h-3" /> Approved
        </Badge>
      );
    }
    if (s === "declined" || s === "rejected") {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-300 border-red-300 text-[11px] gap-1 font-semibold">
          <XCircle className="w-3 h-3" /> Declined
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[11px]">
        {status}
      </Badge>
    );
  };

  // Helper function to get service name
  const getServiceName = (app: Application) => {
    return app.service?.name || app.serviceName || "Service";
  };

  // Helper function to get service category
  const getServiceCategory = (app: Application) => {
    return app.service?.category || app.category || "Service";
  };

  // Helper function to get revenue head
  const getRevenueHead = (app: Application) => {
    return app.service?.revenueHead || app.revenueHead || "";
  };

  // Helper function to get fee amount
  const getFeeAmount = (app: Application) => {
    return app.feeAmount || app.amount || 0;
  };

  // Helper function to get application number
  const getApplicationNumber = (app: Application) => {
    return app.applicationNumber || app.id;
  };

  // Helper function to get full name from formData
  const getFullName = (app: Application) => {
    if (app.formData?.fullName) return app.formData.fullName;
    if (app.formData?.firstName && app.formData?.lastName) {
      return `${app.formData.firstName} ${app.formData.lastName}`;
    }
    if(app.applicant) return `${app.applicant.firstName} ${app.applicant.lastName}`
    return "N/A";
  };

  // Helper function to get ward
  const getWard = (app: Application) => {
    return app.ward || app.formData?.ward || "Ward 7";
  };

  // Helper function to format when the application was created
  const getAppliedAt = (app: Application) => {
    if (!app.createdAt) return null;
    const d = new Date(app.createdAt);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      // hour: "2-digit",
      // minute: "2-digit",
    });
  };

  console.log(selectedApp,"selectedApp")

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <PageHeader
            title={isAdmin ? "Statutory Service Applications" : isFieldOfficer ? "Field Officer Applications Registry" : "My Applications"}
            subtitle={
              isAdmin
                ? `Review, verify documents, and issue official certificates and licences for ${LGA_CONFIG.identity.name}.`
                : isFieldOfficer
                ? `Submit and track citizen and business service applications across ${LGA_CONFIG.identity.name} wards.`
                : "Track the status of your statutory certificates, permits, and licence applications."
            }
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button asChild size="sm" className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-semibold">
            <Link href="/dashboard/services">
              <Plus className="h-4 w-4" />
              {isFieldOfficer ? "Apply for Citizen" : "New Application"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-card border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Total Applications
          </span>
          <div className="text-2xl font-black text-foreground mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 bg-blue-500/5 border-blue-500/20 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Submitted / Pending
          </span>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{stats.submitted}</div>
        </Card>
        <Card className="p-4 bg-amber-500/5 border-amber-500/20 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Pending Form Completion
          </span>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{stats.underReview}</div>
        </Card>
        <Card className="p-4 bg-emerald-500/5 border-emerald-500/20 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Approved & Issued
          </span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{stats.approved}</div>
        </Card>
      </div>

      {/* Search & Filtering Toolbar */}
      <div className="bg-card border rounded-xl p-3.5 sm:p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by App No, Name, NIN, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-9"
            />
          </div>

          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="text-xs h-9 truncate" disabled={isServicing}>
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statutory Services</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={wardFilter} onValueChange={setWardFilter}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="All Wards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {LGA_CONFIG.identity.name} Wards</SelectItem>
                {WARDS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w} Ward
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Applications Table / Cards */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : error ? (
        <ErrorState
          title="Failed to load applications"
          error={error}
          refetch={refetch}
        />
      ) : displayApplications.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-base text-foreground">No applications found</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "all"
                ? "No applications match your active search or filter parameters."
                : "You have not submitted any statutory service applications yet."}
            </p>
          </div>
          <Button asChild size="sm" className="text-xs">
            <Link href="/dashboard/services">Browse Services Catalogue</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayApplications.map((app) => {
            const s = String(app.status).toLowerCase();
            const isSubmitted = s === "submitted";
            const isUnderReview = s.includes("review");
            const isApproved = s === "approved" || s === "completed";
            const isDeclined = s === "declined" || s === "rejected";

            return (
              <div
                key={app.id}
                className="bg-card border rounded-xl p-4 hover:border-primary/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs"
              >
                {/* Left info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-sm text-primary">
                      {getApplicationNumber(app)}
                    </span>
                    {getStatusBadge(app.status)}
                    {/* <Badge variant="secondary" className="text-[10px] font-normal">
                      {getServiceCategory(app)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      Ward: <strong>{getWard(app)}</strong>
                    </span> */}
                    {getAppliedAt(app) && (
                      <span className="text-[11px] text-muted-foreground">
                        Applied: <strong>{getAppliedAt(app)}</strong>
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-foreground">{getServiceName(app)}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <strong className="text-foreground">{getFullName(app)}</strong>
                      </span>
                      {app.formData?.phone && <span>• Phone: {app.formData.phone}</span>}
                      {app.formData?.nin && <span className="font-mono text-[11px]">NIN: {app.formData.nin}</span>}
                    </div>
                  </div>

                  {/* Payment Status Indicator */}
                  {app.invoice && (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${
                          app.invoice.paymentStatus === 'confirmed' 
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
                            : 'bg-amber-500/10 text-amber-700 border-amber-300'
                        }`}
                      >
                        Payment: {app.invoice.paymentStatus}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        ₦{Number(app.invoice.amount).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Decline reason notice banner if rejected */}
                  {isDeclined && app.declineReason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-xs text-red-900 dark:text-red-200 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-[11px]">Decline Justification:</strong>
                        <span>{app.declineReason}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Actions & Pipeline Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 shrink-0">
                  {/* Draft Application Completion Action */}
                  {isCitizen && s === "awaiting_form" && (
                    <Button
                      size="sm"
                      asChild
                      className="text-xs h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
                    >
                      <Link href={`/dashboard/applications/${app.id}/complete`}>
                        <FileText className="h-3.5 w-3.5" />
                        Complete Form
                      </Link>
                    </Button>
                  )}

                  {/* Pipeline Action Buttons for Admins */}
                  {isAdmin && isSubmitted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveToReview(app)}
                      disabled={moveToReviewMutation.isPending}
                      className="text-xs h-8 gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Move to Under Review
                    </Button>
                  )}

                  {/* {isAdmin && isUnderReview && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(app)}
                        disabled={approveMutation.isPending}
                        className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve & Issue
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDecline(app)}
                        disabled={declineMutation.isPending}
                        className="text-xs h-8 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-300"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Decline
                      </Button>
                    </>
                  )} */}

                  {/* Certificate button if approved */}
                  {isApproved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.open(getPublicCertificateUrl(app?.certificate?.certificateNumber as string), "_blank");
                      }}
                      className="text-xs h-8 gap-1.5 border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-semibold"
                    >
                      <FileBadge className="h-3.5 w-3.5" />
                      View Certificate / Licence
                    </Button>
                  )}

                  {/* View Details Modal */}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenDetail(app)}
                    className="text-xs h-8 gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED APPLICATION DRAWER / MODAL */}
      {selectedApp && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6">
            <DialogHeader className="border-b pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-6">
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg font-black text-foreground">
                      {getServiceName(selectedApp)}
                    </DialogTitle>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                  <DialogDescription className="text-xs font-mono mt-0.5">
                    Application No: {getApplicationNumber(selectedApp)}
                    {" "}
                    • Applied: {getAppliedAt(selectedApp) ?? "N/A"}
                  </DialogDescription>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Statutory Assessment
                  </span>
                  <span className="text-base font-black text-primary">
                    ₦{Number(getFeeAmount(selectedApp)).toLocaleString()}
                  </span>
                </div>
              </div>
            </DialogHeader>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-6">
              {/* Applicant Snapshot Profile */}
              <div className="border rounded-xl p-4 bg-muted/10 space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Applicant Profile & Identity
                  </h5>
                  {selectedApp.applicantId ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 text-[10px] border-emerald-300">
                      Registered User
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 text-[10px] border-amber-300">
                      Unregistered Walk-in Applicant
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px] block font-medium">Full Name:</span>
                    <span className="font-semibold text-foreground">{getFullName(selectedApp)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block font-medium">Phone Number:</span>
                    <span className="font-semibold text-foreground">{selectedApp.applicant?.phone || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block font-medium">Ward of Residency:</span>
                    <span className="font-semibold text-foreground">{getWard(selectedApp)}</span>
                  </div>
                  {selectedApp.applicant?.address && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground text-[11px] block font-medium">Address:</span>
                      <span className="font-semibold text-foreground">{selectedApp.applicant.address}</span>
                    </div>
                  )}
                  {selectedApp.applicant?.email && (
                    <div>
                      <span className="text-muted-foreground text-[11px] block font-medium">Email:</span>
                      <span className="font-semibold text-foreground">{selectedApp.applicant.email}</span>
                    </div>
                  )}
                  {selectedApp.applicant?.nin && (
                    <div>
                      <span className="text-muted-foreground text-[11px] block font-medium">NIN:</span>
                      <span className="font-mono font-semibold text-foreground">{selectedApp.applicant.nin}</span>
                    </div>
                  )}
                  {selectedApp.applicant?.cacNumber && (
                    <div>
                      <span className="text-muted-foreground text-[11px] block font-medium">CAC Reg No:</span>
                      <span className="font-mono font-semibold text-foreground">{selectedApp.applicant.cacNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Decline Reason Banner if declined */}
              {selectedApp.declineReason && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 space-y-1 text-xs text-red-900 dark:text-red-200">
                  <span className="font-bold flex items-center gap-1.5 text-red-700 dark:text-red-300">
                    <XCircle className="h-4 w-4" /> Application Declined by the LGA Authority
                  </span>
                  <p className="mt-1 leading-relaxed">{selectedApp.declineReason}</p>
                </div>
              )}

              {/* Invoice Information */}
              {selectedApp.invoice && (
                <div className="border rounded-xl p-4 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5" /> Invoice Details
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[11px] block font-medium">Invoice Number:</span>
                      <span className="font-mono font-semibold text-foreground">{selectedApp.invoice.invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block font-medium">Payment Status:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${
                          selectedApp.invoice.paymentStatus === 'confirmed' 
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
                            : 'bg-amber-500/10 text-amber-700 border-amber-300'
                        }`}
                      >
                        {selectedApp.invoice.paymentStatus}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block font-medium">Amount:</span>
                      <span className="font-bold text-foreground">₦{Number(selectedApp.invoice.amount).toLocaleString()}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-[11px] block font-medium">Payment Method:</span>
                      <span className="font-semibold text-foreground">{selectedApp.invoice?.payments[0]?.method ?? "online"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Form Data Viewer */}
              {selectedApp.formData && (
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Application Parameters & Structured Data
                  </h5>
                  <FormDataViewer formData={selectedApp.formData} />
                </div>
              )}

              {/* Uploaded Documents Viewer with Thumbnail & Lightbox Preview */}
              {selectedApp.applicationDocuments && selectedApp.applicationDocuments.length > 0 && (
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Statutory Supporting Documents ({selectedApp.applicationDocuments.length})
                  </h5>
                  <DocumentsViewer documents={selectedApp.applicationDocuments} />
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDetailModalOpen(false)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin && selectedApp.status?.toLowerCase() === "submitted" && (
                  <Button
                    size="sm"
                    onClick={() => handleMoveToReview(selectedApp)}
                    disabled={moveToReviewMutation.isPending}
                    className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Move to Under Review
                  </Button>
                )}

                {isAdmin && selectedApp.status?.toLowerCase().includes("review") && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(selectedApp)}
                      disabled={approveMutation.isPending}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Issue Certificate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDecline(selectedApp)}
                      className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Decline Application
                    </Button>
                  </>
                )}

                {(selectedApp.status?.toLowerCase() === "approved" ||
                  selectedApp.status?.toLowerCase() === "completed") && (
                  <Button
                    size="sm"
                    // onClick={() => setCertificateModalOpen(true)}
                       onClick={() => {
                    const certId = selectedApp.certificate?.certificateNumber ?? selectedApp.certificateNumber ?? selectedApp.id;
                    window.open(getPublicCertificateUrl(certId), "_blank");
                  }}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <FileBadge className="h-3.5 w-3.5" /> View Official Certificate
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MANDATORY DECLINE REASON MODAL */}
      {selectedApp && (
        <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 font-bold">
                <AlertTriangle className="h-5 w-5" /> Decline Application
              </DialogTitle>
              <DialogDescription className="text-xs">
                Provide the specific statutory reason for declining {getApplicationNumber(selectedApp)} (Applicant: {getFullName(selectedApp)}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs py-2">
              <div className="space-y-1.5">
                <Label htmlFor="decline_reason">
                  Decline Justification / Notice <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="decline_reason"
                  rows={4}
                  required
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Specify missing documentation, failed site inspection, invalid lineage claims, or non-compliance with the LGA bye-laws..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeclineModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!declineReason.trim() || declineMutation.isPending}
                  onClick={handleExecuteDecline}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Confirm & Decline Application
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* OFFICIAL CERTIFICATE / LICENCE MODAL */}
      {selectedApp && (
        <Dialog open={certificateModalOpen} onOpenChange={setCertificateModalOpen}>
          <DialogContent className="max-w-3xl p-6">
            <DialogHeader className="border-b pb-3 text-center">
              <DialogTitle className="text-lg font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                the Local Government, Ogun State
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold">
                Official Statutory Certificate / Operational Licence
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 p-8 border-4 border-double border-emerald-600/40 rounded-2xl bg-emerald-500/5 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-600/20 text-emerald-800 dark:text-emerald-200 flex items-center justify-center mx-auto">
                <FileBadge className="h-9 w-9" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  This is to certify that
                </span>
                <h3 className="text-2xl font-black text-foreground">
                  {getFullName(selectedApp)}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Has fulfilled all statutory conditions, documentation verifications, and bye-law requirements for
                </p>
                <h4 className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                  {getServiceName(selectedApp)}
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-background/90 p-4 rounded-xl border max-w-lg mx-auto text-left">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Certificate No:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedApp.certificate?.certificateNumber || selectedApp.certificateNumber || `ODE/CERT/2026/${selectedApp.id.slice(0, 8)}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Ward Domain:</span>
                  <span className="font-semibold text-foreground">{getWard(selectedApp)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Issued Date:</span>
                  <span className="font-semibold text-foreground">
                    {new Date(selectedApp.updatedAt || selectedApp.createdAt).toLocaleDateString("en-NG")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t text-xs text-muted-foreground max-w-md mx-auto">
                <div className="text-left">
                  <span className="block font-bold text-foreground">Executive Chairman</span>
                  <span>the Local Government</span>
                </div>
                <div className="w-16 h-16 border rounded-lg bg-card flex items-center justify-center font-mono text-[9px] font-bold text-muted-foreground">
                  QR VERIFIED
                </div>
                <div className="text-right">
                  <span className="block font-bold text-foreground">Head of Local Govt. Admin</span>
                  <span>HOLGA / Secretary</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCertificateModalOpen(false)}
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const certId = selectedApp.certificate?.certificateNumber || selectedApp.certificateNumber || selectedApp.id;
                    window.open(getPublicCertificateUrl(certId), "_blank");
                  }}
                  className="gap-1.5 border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                >
                  <FileBadge className="h-3.5 w-3.5" /> Full Certificate
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

