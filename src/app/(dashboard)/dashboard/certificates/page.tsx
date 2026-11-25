/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo } from "react";
import { useCertificates } from "@/hooks/queries/useCertificates";
import { BackendCertificate } from "@/types/certificate";
import { formatOfficialDate, getPublicCertificateUrl } from "@/lib/certificateTokens";
import { useAuth } from "@/hooks/queries/useAuth";
import {
  FileBadge,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar,
  User,
  CreditCard,
  Building2,
  RefreshCw,
  Copy,
  Check,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import { usePagination } from "@/hooks/usePagination";
import { ListPagination } from "@/components/ui/list-pagination";

export default function CertificatesDashboardPage() {
  const { user } = useAuth();
  const { data: certificates = [], isLoading, isRefetching, refetch } = useCertificates();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("all");
  const [selectedCert, setSelectedCert] = useState<BackendCertificate | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Extract unique services for filter tabs
  const servicesList = useMemo(() => {
    const map = new Map<string, string>();
    certificates.forEach((c) => {
      if (c.service?.code && c.service?.name) {
        map.set(c.service.code, c.service.name);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [certificates]);

  // Filter certificates based on search and selected service
  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      // Service filter
      if (
        selectedServiceFilter !== "all" &&
        cert.service?.code !== selectedServiceFilter
      ) {
        return false;
      }

      // Search filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const certNum = cert.certificateNumber?.toLowerCase() || "";
      const verCode = cert.verificationCode?.toLowerCase() || "";
      const appNum = cert.application?.applicationNumber?.toLowerCase() || "";
      const applicantName =
        cert.application?.applicant?.name?.toLowerCase() ||
        cert.application?.formData?.fullName?.toLowerCase() ||
        cert.application?.formData?.name?.toLowerCase() ||
        "";
      const serviceName = cert.service?.name?.toLowerCase() || "";
      const issuedByName = cert.issuedBy?.name?.toLowerCase() || "";

      return (
        certNum.includes(term) ||
        verCode.includes(term) ||
        appNum.includes(term) ||
        applicantName.includes(term) ||
        serviceName.includes(term) ||
        issuedByName.includes(term)
      );
    });
  }, [certificates, searchTerm, selectedServiceFilter]);

  const pagination = usePagination(filteredCertificates, 10, [
    searchTerm,
    selectedServiceFilter,
  ]);

  // Quick statistics
  const stats = useMemo(() => {
    const total = certificates.length;
    const totalAmount = certificates.reduce(
      (sum, c) => sum + (c.invoice?.amount || c.application?.feeAmount || 0),
      0
    );
    const originCount = certificates.filter(
      (c) => c.service?.code === "certificate_of_origin"
    ).length;
    const clubCount = certificates.filter(
      (c) =>
        c.service?.code?.toLowerCase().includes("club") ||
        c.service?.code?.toLowerCase().includes("cda")
    ).length;

    return { total, totalAmount, originCount, clubCount };
  }, [certificates]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const roleScopedNotice = useMemo(() => {
    const role = user?.role;
    if (role === "citizen" || role === "business_owner") {
      return "Showing official statutory certificates issued to your account or created by you.";
    }
    if (role === "field_officer") {
      return "Showing official certificates issued for applications processed under your jurisdiction.";
    }
    return "Central Statutory Certificate Registry  -  All issued LGA credentials.";
  }, [user?.role]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Issued Certificates & Licences
            </h1>
            <Badge variant="outline" className="text-[11px] border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 font-semibold gap-1">
              <ShieldCheck className="w-3 h-3" />
              Official Registry
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {roleScopedNotice}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="text-xs gap-1.5 h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button asChild size="sm" className="text-xs gap-1.5 h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">
            <Link href="/certificate">
              <Search className="w-3.5 h-3.5" />
              <span>Public Token Search</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Issued Certificates</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 flex items-center justify-center">
                <FileBadge className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {stats.total}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">Active & Valid</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Statutory Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                ₦{stats.totalAmount.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">Receipted</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Origin Certificates</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {stats.originCount}
              </span>
              <span className="text-[11px] text-muted-foreground">Indigene credentials</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Clubs & Associations</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {stats.clubCount}
              </span>
              <span className="text-[11px] text-muted-foreground">CDAs & Societies</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border shadow-xs bg-white dark:bg-slate-900">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by Certificate No, Verification Code, Applicant, or Service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <Button
                size="sm"
                variant={selectedServiceFilter === "all" ? "default" : "outline"}
                onClick={() => setSelectedServiceFilter("all")}
                className={`text-xs h-8 ${selectedServiceFilter === "all" ? "bg-emerald-700 hover:bg-emerald-800 text-white" : ""}`}
              >
                All ({certificates.length})
              </Button>
              {servicesList.map((svc) => {
                const count = certificates.filter((c) => c.service?.code === svc.code).length;
                return (
                  <Button
                    key={svc.code}
                    size="sm"
                    variant={selectedServiceFilter === svc.code ? "default" : "outline"}
                    onClick={() => setSelectedServiceFilter(svc.code)}
                    className={`text-xs h-8 whitespace-nowrap ${selectedServiceFilter === svc.code ? "bg-emerald-700 hover:bg-emerald-800 text-white" : ""}`}
                  >
                    {svc.name} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates List / Table */}
      {isLoading ? (
        <Card className="p-12 text-center border shadow-xs bg-white dark:bg-slate-900">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Loading issued certificates from the Local Government registryâ€¦
            </p>
          </div>
        </Card>
      ) : filteredCertificates.length === 0 ? (
        <Card className="p-12 text-center border shadow-xs bg-white dark:bg-slate-900">
          <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FileBadge className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Certificates Found
            </h3>
            <p className="text-xs text-muted-foreground">
              {searchTerm || selectedServiceFilter !== "all"
                ? "No certificates match your search filters. Try clearing search criteria."
                : "No issued certificates are currently recorded for this user role."}
            </p>
            {(searchTerm || selectedServiceFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedServiceFilter("all");
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {pagination.pageItems.map((cert) => {
            const applicantName =
              cert.application?.applicant?.name ||
              cert.application?.formData?.fullName ||
              cert.application?.formData?.clubName ||
              cert.application?.formData?.name ||
              "Statutory Applicant";

            const applicantPhone =
              cert.application?.applicant?.phone ||
              cert.application?.formData?.phone;

            const applicantEmail =
              cert.application?.applicant?.email ||
              cert.application?.formData?.email;

            const publicCertUrl = getPublicCertificateUrl(
              cert.certificateNumber || cert.id
            );

            return (
              <Card
                key={cert.id}
                className="border shadow-xs hover:border-emerald-300 transition-colors bg-white dark:bg-slate-900 overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left block: Title, numbers, applicant */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 border-emerald-200 text-[11px] font-semibold">
                        {cert.service?.name || "Statutory Certificate"}
                      </Badge>

                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {cert.certificateNumber}
                      </span>

                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">
                        <span>Code:</span>
                        <span className="font-bold">{cert.verificationCode}</span>
                        <button
                          onClick={() => handleCopy(cert.verificationCode, `code-${cert.id}`)}
                          className="ml-1 text-slate-400 hover:text-slate-700"
                          title="Copy verification code"
                        >
                          {copiedCode === `code-${cert.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-semibold truncate">{applicantName}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Issued: {formatOfficialDate(cert.issuedAt)}</span>
                      </div>

                      {cert.invoice && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <CreditCard className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-mono">
                            ₦{cert.invoice.amount.toLocaleString()} ({cert.invoice.paymentStatus.toUpperCase()})
                          </span>
                        </div>
                      )}
                    </div>

                    {(applicantPhone || applicantEmail) && (
                      <p className="text-[11px] text-muted-foreground">
                        Contact: {applicantPhone || " - "} • {applicantEmail || " - "}
                        {cert.issuedBy?.name ? ` • Signatory: ${cert.issuedBy.name} (${cert.issuedBy.role})` : ""}
                      </p>
                    )}
                  </div>

                  {/* Right block: Action buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCert(cert)}
                      className="text-xs h-8 gap-1.5 flex-1 sm:flex-initial"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </Button>

                    <Button
                      asChild
                      size="sm"
                      className="text-xs h-8 gap-1.5 bg-[#0D3B1E] hover:bg-[#14532D] text-white font-semibold flex-1 sm:flex-initial shadow-xs"
                    >
                      <a href={publicCertUrl} target="_blank" rel="noreferrer">
                        <FileBadge className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </a>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1 hidden sm:inline-flex text-muted-foreground hover:text-foreground"
                    >
                      <Link
                        href={`/verify?code=${encodeURIComponent(cert.certificateNumber || cert.verificationCode)}`}
                        target="_blank"
                        title="Open in public verification registry"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filteredCertificates.length > 0 && (
        <ListPagination pagination={pagination} unit="certificates" />
      )}

      {/* Certificate Detailed Inspector Modal */}
      {selectedCert && (
        <Dialog open={!!selectedCert} onOpenChange={(open) => !open && setSelectedCert(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Certificate Record Details
                </DialogTitle>
                <Badge className="bg-emerald-700 text-white text-[10px]">Active Record</Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Official statutory certificate ledger entry from the Local Government Authority.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              {/* Certificate Identifier Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Certificate Number:</span>
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400 text-sm">
                      {selectedCert.certificateNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Verification Security Code:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {selectedCert.verificationCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Application Number:</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {selectedCert.application?.applicationNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">QR Token:</span>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate block">
                      {selectedCert.qrToken}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service & Issuing Office */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    Statutory Service
                  </span>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedCert.service?.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Category: {selectedCert.service?.category || "Statutory LGA Service"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Revenue Head: {selectedCert.service?.revenueHead || "1001 - Statutory LGA Revenue"}
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    Issuance & Authority
                  </span>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedCert.issuedBy?.name || "Hon. Akinyemi A. Odunayo"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Role: {selectedCert.issuedBy?.role || "LGA Executive"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Issued: {formatOfficialDate(selectedCert.issuedAt)}
                  </div>
                </div>
              </div>

              {/* Applicant & Payload */}
              <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 space-y-2">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Applicant & Service Payload
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Applicant Name: </span>
                    <span className="font-semibold">
                      {selectedCert.application?.applicant?.name ||
                        selectedCert.application?.formData?.fullName ||
                        selectedCert.application?.formData?.clubName ||
                        "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <span>
                      {selectedCert.application?.applicant?.email ||
                        selectedCert.application?.formData?.email ||
                        "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    <span>
                      {selectedCert.application?.applicant?.phone ||
                        selectedCert.application?.formData?.phone ||
                        "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Address: </span>
                    <span>
                      {selectedCert.application?.formData?.address ||
                        selectedCert.application?.formData?.secretariatAddress ||
                        "the Local Government Area, Ogun State"}
                    </span>
                  </div>
                </div>

                {/* Form Data Summary if extra keys exist */}
                {selectedCert.application?.formData && (
                  <div className="pt-2 border-t mt-2">
                    <span className="text-[10px] text-muted-foreground font-medium block mb-1">
                      Submitted Form Fields:
                    </span>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded p-2 text-[11px] font-mono max-h-32 overflow-y-auto space-y-0.5">
                      {Object.entries(selectedCert.application.formData).map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-slate-200/50 dark:border-slate-700/50 py-0.5">
                          <span className="text-muted-foreground">{k}:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                            {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice & Payment Settlement */}
              {selectedCert.invoice && (
                <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    Invoice & Settlement Record
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Invoice No: </span>
                      <span className="font-mono font-bold">{selectedCert.invoice.invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Amount: </span>
                      <span className="font-bold text-emerald-700 font-mono">
                        ₦{selectedCert.invoice.amount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        {selectedCert.invoice.paymentStatus.toUpperCase()}
                      </Badge>
                    </div>
                    {selectedCert.invoice.paidAt && (
                      <div className="text-muted-foreground text-[11px]">
                        Paid: {new Date(selectedCert.invoice.paidAt).toLocaleDateString("en-NG")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCert(null)}
                  className="text-xs"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                  >
                    <Link
                      href={`/verify?code=${encodeURIComponent(selectedCert.certificateNumber || selectedCert.verificationCode)}`}
                      target="_blank"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Verify Public</span>
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    className="text-xs gap-1.5 bg-[#0D3B1E] hover:bg-[#14532D] text-white font-semibold"
                  >
                    <a
                      href={getPublicCertificateUrl(selectedCert.certificateNumber || selectedCert.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileBadge className="w-3.5 h-3.5" />
                      <span>View Official Document</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

