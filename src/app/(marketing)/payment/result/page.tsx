/* eslint-disable react-hooks/set-state-in-effect */
// app/payment/result/page.tsx
"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { invoicesService } from "@/services/apiInvoice";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import Link from "next/link";
import { FullPageLoader } from "@/components/ProtectedRoute";
import {
  clearPendingPayment,
  PAYMENT_PROVIDER_KEY,
  PAYMENT_REFERENCE_KEY,
  resolvePaymentProvider,
  type PaymentProvider,
} from "@/config/paymentGateway";

type ResultState = "verifying" | "confirmed" | "pending" | "failed" | "error";

export default function Page() {
  return (
    <Suspense fallback={<FullPageLoader title="payment result page" />}>
      <PaymentResultPage />
    </Suspense>
  );
}

function PaymentResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Paystack returns to us with ?reference= (or the legacy ?trxref=). GPay's
  // return_url carries NO query params at all, so we fall back to the reference
  // stashed in sessionStorage before the redirect. That stash is only cleared
  // once a payment reaches a terminal state.
  const storedReference =
    typeof window !== "undefined"
      ? sessionStorage.getItem(PAYMENT_REFERENCE_KEY)
      : null;
  const storedProvider =
    typeof window !== "undefined"
      ? sessionStorage.getItem(PAYMENT_PROVIDER_KEY)
      : null;

  const urlReference =
    searchParams.get("reference") ?? searchParams.get("trxref");
  const reference = urlReference ?? storedReference;

  // Both gateways mint "PAY-..." references, so the provider is read from the
  // stash written at init time. Falls back to the reference shape, then to
  // Paystack so pre-GPay sessions keep working.
  const paymentProvider: PaymentProvider = resolvePaymentProvider(
    reference,
    storedProvider,
  );

  const [state, setState] = useState<ResultState>("verifying");
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isNormalFlow, setIsNormalFlow] = useState<boolean>(false);
  const [wasAlreadySettled, setWasAlreadySettled] = useState<boolean>(false);
  // Guards the one-shot mirror of the reference into the URL (see below).
  const mirroredToUrlRef = useRef(false);

  useEffect(() => {
    if (!reference) {
      setState("error");
      setMessage(
        "No payment reference found. Please check your transaction details or try applying again.",
      );
      return;
    }

    let cancelled = false;

    // GPay redirects back to /payment/result with no query params, so mirror the
    // reference into the URL once we have one. Without this, a refresh on the
    // result page has nothing left to verify (the session stash is cleared on
    // success) and shows "No payment reference found".
    const mirrorReferenceToUrl = () => {
      if (!reference || mirroredToUrlRef.current) return;
      mirroredToUrlRef.current = true;
      router.replace(
        `/payment/result?reference=${encodeURIComponent(reference)}`,
      );
    };

    invoicesService
      // GPay and Paystack expose separate verify routes, and a GPay reference
      // is unknown to /payments/verify/:reference (and vice versa).
      .verifyPaymentByProvider(reference, paymentProvider)
      .then((res: any) => {
        if (cancelled) return;

        const invNum = res?.invoice?.invoiceNumber ?? null;
        const rcpNum = res?.receipt?.receiptNumber ?? null;
        const appId =
          res?.application?.id ??
          res?.invoice?.applicationId ??
          res?.applicationId ??
          null;
        const sName =
          res?.application?.serviceName ??
          res?.application?.service?.name ??
          res?.service?.name ??
          null;
        const flow = res?.flow ?? res?.data?.flow ?? null;

        setInvoiceNumber(invNum);
        setReceiptNumber(rcpNum);
        setApplicationId(appId);
        setServiceName(sName);
        setIsNormalFlow(flow === "new_application");

        // GPay returns alreadyConfirmed when the intent was settled by the
        // webhook before this page ever loaded, and carries no invoice/receipt.
        const alreadySettled =
          res?.alreadyConfirmed === true || res?.alreadyProcessed === true;
        setWasAlreadySettled(alreadySettled);

        const isSuccess =
          res?.status === "confirmed" ||
          res?.status === "success" ||
          res?.success === true;

        const isFailed =
          res?.status === "failed" || res?.status === "abandoned";

        if (isSuccess) {
          setState("confirmed");
          setMessage(
            res?.message ||
              "Your statutory fee payment was verified and processed successfully.",
          );
          // Terminal state: safe to drop the stash.
          clearPendingPayment();
          mirrorReferenceToUrl();
        } else if (isFailed) {
          setState("failed");
          setMessage(
            res?.message ||
              `This payment transaction was not completed or was cancelled${
                res?.rawStatus ? ` (gateway status: ${res.rawStatus})` : ""
              }.`,
          );
        } else {
          // Still processing. The stash is deliberately kept so that reloading
          // this page - the "Re-check Payment Status" button does exactly that -
          // re-verifies the same reference. GPay's return has no query param to
          // fall back on.
          setState("pending");
          setMessage(
            res?.message ||
              "Your payment is still being processed. This can take a few seconds.",
          );
          mirrorReferenceToUrl();
        }
      })
      .catch((err: any) => {
        if (cancelled) return;

        const notFound = err?.backendCode === "NOT_FOUND" || err?.status === 404;
        const amountMismatch =
          err?.backendCode === "AMOUNT_MISMATCH" || err?.status === 409;

        setState("error");

        if (notFound) {
          // Nothing to retry: drop the stash so a later visit is not stuck.
          clearPendingPayment();
          setMessage(
            "We could not find this payment reference. It may belong to a different payment gateway, or the payment was never started on this device.",
          );
        } else if (amountMismatch) {
          setMessage(
            "The amount received does not match the statutory fee due. This payment has been flagged for review by the LGA treasury. Please contact the LGA help desk with your reference.",
          );
        } else {
          setMessage(
            err?.message ??
              "Could not verify payment status with the payment gateway.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reference, paymentProvider, router]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="p-8 max-w-lg w-full text-center space-y-5 border-border/80 shadow-elegant">
          {state === "verifying" && (
            <div className="space-y-4 py-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">
                  Gateway Verification
                </Badge>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Verifying Your Statutory Paymentâ€¦
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Connecting to government treasury gateway to confirm
                  transaction reference{" "}
                  <strong className="font-mono text-foreground text-xs">
                    {reference}
                  </strong>
                  . Please do not close this window.
                </p>
              </div>
            </div>
          )}

          {state === "confirmed" && (
            <div className="space-y-4 py-2">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="space-y-1">
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs"
                >
                  <ShieldCheck className="h-3 w-3 mr-1" /> Payment Confirmed
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Payment Confirmed!
                </h2>
                {wasAlreadySettled && (
                  <p className="text-xs text-muted-foreground bg-muted/40 border border-border/60 rounded-lg px-3 py-2 mt-2">
                    This payment was already confirmed earlier, so no new
                    invoice or receipt was generated. Your payment history is
                    unchanged. Open the portal to view the receipt.
                  </p>
                )}

                <p className="text-sm text-muted-foreground">{message}</p>
              </div>

              {(invoiceNumber || receiptNumber || reference || serviceName) && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5 text-left">
                  {serviceName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Statutory Service:
                      </span>
                      <span className="font-semibold text-foreground">
                        {serviceName}
                      </span>
                    </div>
                  )}
                  {reference && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Payment Reference:
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {reference}
                      </span>
                    </div>
                  )}
                  {invoiceNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Invoice Reference:
                      </span>
                      <span className="font-mono font-semibold text-primary">
                        {invoiceNumber}
                      </span>
                    </div>
                  )}
                  {receiptNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Receipt Number:
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {receiptNumber}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 space-y-2">
                {isNormalFlow && applicationId ? (
                  <Button
                    asChild
                    className="w-full bg-gradient-hero text-primary-foreground font-semibold h-11 shadow-sm"
                  >
                    <Link
                      href={`/dashboard/applications/${applicationId}/complete?reference=${reference || ""}`}
                    >
                      Complete Application Form{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="w-full bg-gradient-hero text-primary-foreground font-semibold h-11"
                  >
                    <Link
                      href={
                        invoiceNumber
                          ? `/dashboard/invoices/${invoiceNumber}`
                          : "/dashboard/applications"
                      }
                    >
                      Proceed to Application Portal{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}

                {applicationId && (
                  <Button asChild variant="outline" className="w-full text-xs font-semibold">
                    <Link href={`/track/${applicationId}`}>
                      Track My Application
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}

                <div className="flex gap-2">
                  {invoiceNumber && (
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 text-xs"
                    >
                      <Link href={`/dashboard/invoices/${invoiceNumber}`}>
                        View Invoice
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="flex-1 text-xs">
                    <Link href="/services">Services Directory</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state === "pending" && (
            <div className="space-y-4 py-2">
              <div className="h-16 w-16 mx-auto rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock className="h-9 w-9" />
              </div>
              <div className="space-y-1">
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs"
                >
                  Pending Gateway Settlement
                </Badge>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Payment Still Processing
                </h2>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <div className="pt-2 space-y-2">
                <Button
                  className="w-full bg-primary"
                  onClick={() => window.location.reload()}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Re-check Payment Status
                </Button>
                <Button asChild variant="outline" className="w-full text-xs">
                  <Link href="/services">Back to Services</Link>
                </Button>
              </div>
            </div>
          )}

          {(state === "failed" || state === "error") && (
            <div className="space-y-4 py-2">
              <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <XCircle className="h-9 w-9" />
              </div>
              <div className="space-y-1">
                <Badge
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/30 text-xs"
                >
                  {state === "failed"
                    ? "Transaction Incomplete"
                    : "Verification Error"}
                </Badge>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {state === "failed"
                    ? "Payment Not Completed"
                    : "Payment Verification Failed"}
                </h2>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <div className="pt-2 space-y-2">
                <Button asChild className="w-full bg-primary font-semibold">
                  <Link href="/apply">
                    <RotateCcw className="mr-2 h-4 w-4" /> Try Payment Again
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full text-xs">
                  <Link href="/services">Back to Services Catalogue</Link>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}

