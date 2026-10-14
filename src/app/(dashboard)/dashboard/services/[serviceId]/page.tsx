"use client";

import React, { useState, use } from "react";
import {
  getLgaServiceById,
  getConfiguredFeeForService,
} from "@/config/lgaServices";
import { PageHeader } from "@/components/dashboard/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileBadge,
  Clock,
  ShieldCheck,
  Receipt,
  FileText,
  User,
  ExternalLink,
  Printer,
  Calendar,
} from "lucide-react";
import { tokenManager } from "@/services/apiAuth";
import { useSubmitApplication } from "@/hooks/queries/useApplications";
import { ApplicantSnapshot } from "@/components/services/ApplicantSelectionStep";
import { Application } from "@/types/application";

// Form Imports
import CertificateOfOriginForm from "@/components/services/forms/CertificateOfOriginForm";
import ClubRegistrationForm from "@/components/services/forms/ClubRegistrationForm";
import CdaRegistrationForm from "@/components/services/forms/CdaRegistrationForm";
import FarmersRegistrationForm from "@/components/services/forms/FarmersRegistrationForm";
import EnvironmentalSanitationForm from "@/components/services/forms/EnvironmentalSanitationForm";
import TenementRateForm from "@/components/services/forms/TenementRateForm";
import HaulageFeesForm from "@/components/services/forms/HaulageFeesForm";
import LiquorLicenceForm from "@/components/services/forms/LiquorLicenceForm";
import ViewingCentreLicenceForm from "@/components/services/forms/ViewingCentreLicenceForm";
import QuarryPermitForm from "@/components/services/forms/QuarryPermitForm";
import StreetNamingForm from "@/components/services/forms/StreetNamingForm";
import KioskLicenceForm from "@/components/services/forms/KioskLicenceForm";
import { useServices } from "@/hooks/queries/useServices";

interface PageProps {
  params: Promise<{ serviceId: string }>;
}

export default function ServiceDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const serviceId = resolvedParams.serviceId;
  const router = useRouter();

  const { services: allServices, useGetServiceBySlug } = useServices();
  const matchedFromList: any = allServices.find(
    (s: any) => s.id === serviceId || s.code === serviceId || s.slug === serviceId
  );
  const lookupKey = matchedFromList?.code || matchedFromList?.slug || serviceId;
  const {
    data: fetchedService,
    isLoading: isServiceLoading,
    error,
  } = useGetServiceBySlug(lookupKey);
  const service: any = matchedFromList || fetchedService;

  const currentUser = tokenManager.getUser();
  const userRole = currentUser?.role || "citizen";
  const isFieldOfficer = userRole === "field_officer";

  const submitApplicationMutation = useSubmitApplication();
  const [submittedApp, setSubmittedApp] = useState<Application | null>(null);

  // Loading UI
  if (isServiceLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">
            Loading service details...
          </p>
        </div>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
        <PageHeader
          title="Error Loading Service"
          subtitle="There was a problem loading the service details. Please try again."
        />
        <Button asChild variant="outline" onClick={() => router.refresh()}>
          <Link href="/dashboard/services">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Services Catalogue
          </Link>
        </Button>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
        <PageHeader
          title="Service Not Found"
          subtitle="The requested the LGA service could not be found."
        />
        <Button asChild variant="outline">
          <Link href="/dashboard/services">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Services Catalogue
          </Link>
        </Button>
      </div>
    );
  }

  // Initialize applicant profile snapshot based on role
  const initialApplicant: any = {
    applicantId: currentUser?.id || null,
    isRegistered: !!currentUser?.id,
  };

  const handleSubmit = async (payload: any) => {
    let applicant: any = initialApplicant;
    let formData: Record<string, any> = {};
    let files: Record<string, any> = {};

    // Preferred payload shape: { applicant?, formData, files? }
    // Do not merge applicant snapshot into formData or invent fallback values.
    if (payload && (payload.applicant || payload.files || payload.formData)) {
      applicant = payload.applicant || initialApplicant;
      formData = payload.formData || {};
      files = payload.files || {};
    } else {
      // Legacy dictionary fallback: treat payload as formData only.
      formData = payload || {};

    }

    try {
      const res = await submitApplicationMutation.mutateAsync({
        serviceId: service.id,
        applicantId: applicant?.applicantId || undefined,
        formData,
        files,
      });

      console.log("Submission response:", res);

      if (res.application.applicationNumber) {
        router.push(`/dashboard/invoices/${res.invoice.invoiceNumber}`);

        setSubmittedApp(res);
      }
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  // Get fee from service data
  const currentFee = service.feeConfig?.amount
    ? parseFloat(service.feeConfig.amount)
    : service.defaultFee || 0;

  // Get requirements from service data
  const serviceRequirements = service.requirements || [];

  const renderForm = () => {
    const commonProps = {
      service,
      onSubmit: handleSubmit,
      isSubmitting: submitApplicationMutation.isPending,
      mode: (isFieldOfficer
        ? "field_officer"
        : userRole === "business_owner"
          ? "business_owner"
          : "citizen") as any,
      initialApplicant,
    };

    // Map service code to appropriate form component
    switch (service.code) {
      case "certificate_of_origin":
        return <CertificateOfOriginForm {...commonProps} />;
      case "club_registration":
        return <ClubRegistrationForm {...commonProps} />;
      case "cda_registration":
        return <CdaRegistrationForm {...commonProps} />;
      case "farmers_registration":
        return <FarmersRegistrationForm {...commonProps} />;
      case "environmental_sanitation":
        return <EnvironmentalSanitationForm {...commonProps} />;
      case "tenement_rate":
        return <TenementRateForm {...commonProps} />;
      case "haulage_fees":
        return <HaulageFeesForm {...commonProps} />;
      case "liquor_licence":
        return <LiquorLicenceForm {...commonProps} />;
      case "viewing_centre_licence":
        return <ViewingCentreLicenceForm {...commonProps} />;
      case "quarry_permit":
        return <QuarryPermitForm {...commonProps} />;
      case "street_naming":
        return <StreetNamingForm {...commonProps} />;
      case "kiosk_licence":
        return <KioskLicenceForm {...commonProps} />;
      default:
        return <CertificateOfOriginForm {...commonProps} />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4 sm:py-6 px-3 sm:px-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link
              href="/dashboard/services"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Services Catalogue
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {service.category}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {service.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
            {service.description}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              Statutory Fee
            </span>
            <span className="text-base sm:text-lg font-black text-primary">
              â‚¦{currentFee.toLocaleString()}
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-xs bg-primary/5 text-primary border-primary/20"
          >
            {service.estimatedDays
              ? `${service.estimatedDays} days`
              : "3-5 days"}
          </Badge>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION STATE */}
      {submittedApp ? (
        <Card className="border-2 border-emerald-500/30 bg-emerald-500/5 shadow-md">
          <CardHeader className="text-center pb-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-foreground">
              Statutory Application Submitted!
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm max-w-lg mx-auto">
              Your application for{" "}
              <strong>
                {submittedApp.application?.service?.name || service?.name}
              </strong>{" "}
              has been transmitted to the Local Government Authority.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 max-w-2xl mx-auto">
            {/* Reference Box */}
            <div className="bg-background border rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Application Number:
                  </span>
                  <span className="font-mono font-bold text-sm text-primary">
                    {submittedApp.application?.applicationNumber ||
                      submittedApp.application?.applicationNo}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Status:
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-700 text-xs border-amber-300 font-semibold mt-0.5"
                  >
                    {submittedApp.application?.status || submittedApp.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Applicant Name:
                  </span>
                  <span className="font-semibold text-foreground">
                    {submittedApp.application?.formData?.fullName ||
                      submittedApp.application?.applicant?.fullName ||
                      submittedApp.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Ward of Application:
                  </span>
                  <span className="font-semibold text-foreground">
                    {submittedApp.application?.formData?.ward ||
                      submittedApp.application?.ward ||
                      submittedApp.ward ||
                      "Ward 7"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Revenue Head:
                  </span>
                  <span className="font-semibold text-foreground">
                    {submittedApp.application?.service?.revenueHead ||
                      submittedApp.application?.revenueHead ||
                      submittedApp.revenueHead}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Calculated Statutory Fee:
                  </span>
                  <span className="font-bold text-foreground">
                    â‚¦
                    {Number(
                      submittedApp.application?.feeAmount ||
                        submittedApp.invoice?.amount ||
                        submittedApp.amount,
                    )?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(
                    submittedApp.application?.createdAt ||
                      submittedApp.createdAt,
                  ).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="font-mono text-[11px]">
                  Ref:{" "}
                  {submittedApp.invoice?.invoiceNumber ||
                    submittedApp.application?.applicationNumber ||
                    submittedApp.id}
                </span>
              </div>
            </div>

            {/* Invoice Status */}
            {submittedApp.invoice && (
              <div className="bg-muted/20 border rounded-xl p-4 text-xs space-y-2">
                <h5 className="font-bold text-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" /> Invoice
                  Information
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Invoice Number:
                    </span>
                    <span className="font-mono font-semibold text-sm">
                      {submittedApp.invoice.invoiceNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Payment Status:
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold mt-0.5 ${
                        submittedApp.invoice.paymentStatus === "paid"
                          ? "bg-green-500/10 text-green-700 border-green-300"
                          : "bg-amber-500/10 text-amber-700 border-amber-300"
                      }`}
                    >
                      {submittedApp.invoice.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Virtual Bank:
                    </span>
                    <span className="font-semibold text-foreground">
                      {submittedApp.invoice.virtualBankName ||
                        "Zenith Bank / the LGA Treasury"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Amount:
                    </span>
                    <span className="font-bold text-foreground">
                      â‚¦{Number(submittedApp.invoice.amount)?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps Guidance */}
            <div className="bg-muted/30 border rounded-xl p-4 text-xs space-y-2">
              <h5 className="font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> What happens next?
              </h5>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed pl-1">
                <li>
                  the LGA Desk Officers will examine your documents against
                  traditional council and departmental records.
                </li>
                <li>
                  You will receive SMS/dashboard updates if any additional
                  inspections or verification are required.
                </li>
                <li>
                  Upon approval by the Executive Chairman, your official
                  statutory certificate/licence will be generated.
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                asChild
                className="gap-2 bg-primary text-primary-foreground font-semibold"
              >
                <Link href="/dashboard/applications">
                  <FileText className="h-4 w-4" /> View in My Applications
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/dashboard/receipts/${submittedApp.invoice?.id}`}>
                  <Receipt className="h-4 w-4" /> View Payment Receipts
                </Link>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSubmittedApp(null)}
                className="text-xs text-muted-foreground"
              >
                Submit Another Application
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* SERVICE FORM WIZARD */
        <div>{renderForm()}</div>
      )}
    </div>
  );
}

