"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Receipt,
  UserCheck,
  Building2,
  ExternalLink,
  Clock,
  Loader2,
  FileBadge,
  RotateCcw,
} from "lucide-react";
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
import { tokenManager } from "@/services/apiAuth";
import {
  useApplication,
  useCompleteApplication,
} from "@/hooks/queries/useApplications";
import { useServices } from "@/hooks/queries/useServices";
import {
  getLgaServiceById,
  ServiceType,
} from "@/config/lgaServices";
import { Application } from "@/types/application";
import { ApplicantSnapshot } from "@/components/services/ApplicantSelectionStep";

// Dynamic Service Form Components
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

interface PostPaymentCompletionFormProps {
  applicationId: string;
  reference?: string | null;
}

export function PostPaymentCompletionForm({
  applicationId,
  reference,
}: PostPaymentCompletionFormProps) {
  const router = useRouter();
  const currentUser = tokenManager.getUser();
  const isAuthenticated = !!tokenManager.getAccessToken();

  const {
    data: application,
    isLoading: isAppLoading,
    error: appError,
    refetch: refetchApp,
  } = useApplication(applicationId);

  const { useGetServiceBySlug } = useServices();
  const serviceSlug =
    application?.serviceId ||
    application?.service?.code ||
    (application as any)?.serviceCode ||
    "";
  const { data: fetchedService, isLoading: isServiceLoading } =
    useGetServiceBySlug(serviceSlug);

  const completeMutation = useCompleteApplication();

  const [completedApplication, setCompletedApplication] =
    useState<any | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Resolved service object: backend service or local config lookup
  const service: ServiceType | null =
    (fetchedService as ServiceType) ||
    getLgaServiceById(serviceSlug) ||
    (application?.service as any) ||
    null;

  // 1. Not Authenticated State
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(
      `/dashboard/applications/${applicationId}/complete${reference ? `?reference=${reference}` : ""}`
    );
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <Card className="border-border/80 shadow-md">
          <CardHeader className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <UserCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-bold">
              Authentication Required
            </CardTitle>
            <CardDescription className="text-sm">
              Your payment has been successfully recorded. Please log in to complete the statutory application form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-muted/50 border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Application ID:</span>
                <span className="font-mono font-medium">{applicationId}</span>
              </div>
              {reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Reference:</span>
                  <span className="font-mono font-medium">{reference}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild className="flex-1 bg-primary">
                <Link href={`/login?redirect=${returnUrl}`}>
                  Log In to Continue Form
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/register?redirect=${returnUrl}`}>
                  Create Free Account
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Loading State
  if (isAppLoading || (serviceSlug && isServiceLoading)) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            Retrieving Statutory Application Context...
          </h3>
          <p className="text-xs text-muted-foreground">
            Connecting payment verification with the LGA application registry.
          </p>
        </div>
      </div>
    );
  }

  // 3. Error Loading State
  if (appError || !application) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <Card className="border-destructive/30 shadow-md">
          <CardHeader className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-bold">
              Application Not Found or Error
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              We could not load the statutory application (ID: {applicationId}).
              {(appError as any)?.message && (
                <span className="block mt-1 text-destructive font-mono text-xs">
                  {(appError as any).message}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => refetchApp()}
              variant="default"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Retry Loading Application
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/applications">
                <ArrowLeft className="h-4 w-4 mr-2" /> Go to My Applications
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. Success Completion State
  if (completedApplication) {
    const appNum =
      completedApplication.application.applicationNumber 
    const sName =
      service?.name ||
      "Statutory Service";

    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <Card className="border-2 border-emerald-500/30 bg-emerald-500/5 shadow-md">
          <CardHeader className="text-center pb-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <Badge
              variant="outline"
              className="mx-auto bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs px-3 py-1 font-semibold"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Statutory Application Transmitted
            </Badge>
            <CardTitle className="text-2xl font-black text-foreground pt-1">
              Application Details & Documents Submitted!
            </CardTitle>
            <CardDescription className="text-sm max-w-lg mx-auto">
              Your official application for <strong>{sName}</strong> has been completed with paid statutory fees and submitted to the the LGA Executive Treasury & Processing Desk.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 max-w-xl mx-auto">
            {/* Reference Box */}
            <div className="bg-background border rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between border-b pb-2.5">
                <span className="text-xs text-muted-foreground font-medium">
                  Application Number:
                </span>
                <span className="font-mono font-black text-sm text-primary">
                  {appNum}
                </span>
              </div>

              <div className="flex items-center justify-between border-b pb-2.5">
                <span className="text-xs text-muted-foreground font-medium">
                  Status:
                </span>
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-700 border-blue-300 text-xs font-semibold"
                >
                  <Clock className="w-3 h-3 mr-1" /> Submitted
                </Badge>
              </div>

              <div className="flex items-center justify-between border-b pb-2.5">
                <span className="text-xs text-muted-foreground font-medium">
                  Statutory Fee Payment:
                </span>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 border-emerald-300 text-xs font-semibold"
                >
                  Confirmed / Settled
                </Badge>
              </div>

              {reference && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    Payment Gateway Ref:
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {reference}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Button asChild className="w-full h-11 text-sm font-semibold bg-primary">
                <Link href="/dashboard/applications">
                  View in My Applications Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full text-xs">
                <Link href="/dashboard/services">
                  Return to Services Directory
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pre-populate applicant snapshot from authenticated user or existing application details
  const initialApplicant: ApplicantSnapshot = {
    applicantId: currentUser?.id || application?.applicantId || null,
    isRegistered: true,
    fullName:
      currentUser?.firstName
        ? `${currentUser.firstName} ${currentUser.lastName || ""}`.trim()
        : application?.formData?.fullName || "",
    phone: currentUser?.phone || application?.applicant?.phone || "",
    email: currentUser?.email || application?.applicant?.email || undefined,
    address: currentUser?.address || application?.applicant?.address || "",
    nin: currentUser?.nin || application?.applicant?.nin || undefined,
  };

  const handleFormSubmit = async (payload: any) => {
    setSubmissionError(null);
    try {
      let formData = {};
      let files = {};
      let applicantId = initialApplicant?.applicantId || currentUser?.id || undefined;

      if (payload && (payload.applicant || payload.formData || payload.files)) {
        formData = payload.formData || {};
        files = payload.files || {};
        if (payload.applicant?.applicantId) {
          applicantId = payload.applicant.applicantId;
        }
      } else {
        formData = payload || {};
      }

      const res = await completeMutation.mutateAsync({
        id: applicationId,
        payload: {
          formData,
          files,
          applicantId,
          serviceId: application.serviceId,
        },
      });

      setCompletedApplication(res || application);
    } catch (err: any) {
      console.error("Completion error:", err);
      const errMsg =
        err?.message ||
        "An error occurred while submitting your statutory application form. Please verify the required documents and try again.";
      setSubmissionError(errMsg);
    }
  };

  // Fallback service definition if not found
  const effectiveService: ServiceType = service || {
    id: application.serviceId || "certificate_of_origin",
    code: application.service?.code || "certificate_of_origin",
    name: application.service?.name || application.serviceName || "Statutory Service Application",
    category: application.service?.category || application.category || "Certificates",
    revenueHead: application.service?.revenueHead || "REVENUE",
    description: "Complete your statutory application form and upload mandatory supporting documents.",
    requirements: application.service?.requirements || [
      "passport_photo",
      "nin_slip",
      "proof_of_residency",
    ],
    estimatedDays: application.service?.estimatedDays || 3,
    certificateType: "CERTIFICATE_OF_ORIGIN",
    supportsRenewal: false,
    isActive: true,
  };

  const commonProps = {
    service: effectiveService,
    onSubmit: handleFormSubmit,
    isSubmitting: completeMutation.isPending,
    mode: (currentUser?.role === "field_officer"
      ? "field_officer"
      : currentUser?.role === "business_owner"
      ? "business_owner"
      : "citizen") as any,
    initialApplicant,
  };

  const renderServiceForm = () => {
    switch (effectiveService.code) {
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
      {/* Top Breadcrumb & Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link
              href="/dashboard/applications"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> My Applications
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Post-Payment Completion</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Complete Application: {effectiveService.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
            Your statutory payment has been verified. Complete the applicant details and upload supporting documents to transmit to the the Local Government registry.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-700 border-emerald-300 text-xs px-2.5 py-1 font-semibold"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Fee Paid & Verified
          </Badge>
          {/* <Badge variant="secondary" className="text-xs">
            Awaiting Form (Paid)
          </Badge> */}
        </div>
      </div>

      {/* Verified Payment Context Banner */}
      <div className="bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-background border border-emerald-500/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/20 px-2 py-0.5 rounded">
              Payment Completed
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              App ID: {application.applicationNumber || application.id}
            </span>
            {reference && (
              <span className="text-xs font-mono text-muted-foreground">
                • Ref: {reference}
              </span>
            )}
          </div>
          <h3 className="font-bold text-base text-foreground">
            {effectiveService.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            Fill in the required information below. Submitting this form will finalize your application for administrative review.
          </p>
        </div>
        <div className="bg-background/90 border border-emerald-500/20 p-3 rounded-lg text-left sm:text-right shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
            Payment Status
          </span>
          <span className="text-sm font-extrabold text-emerald-600 flex items-center sm:justify-end gap-1">
            <CheckCircle2 className="h-4 w-4" /> Settled
          </span>
        </div>
      </div>

      {/* Submission Error Banner */}
      {submissionError && (
        <Alert variant="destructive" className="border-destructive/40">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-bold">Submission Error</AlertTitle>
          <AlertDescription className="text-xs">
            {submissionError}
          </AlertDescription>
        </Alert>
      )}

      {/* Dynamic Service Form Component */}
      <div className="pt-2">
        {renderServiceForm()}
      </div>
    </div>
  );
}

