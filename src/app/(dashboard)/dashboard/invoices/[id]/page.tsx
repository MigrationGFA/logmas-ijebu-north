"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from "@/components/dashboard/qr-code";
import {
  ArrowLeft,
  Copy,
  Send,
  CreditCard,
  Receipt as ReceiptIcon,
  Printer,
  Phone,
  Mail,
  MessageCircle,
  Wallet,
  Link2,
  CheckCircle2,
  Loader2,
  Landmark,
  Upload,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useInvoiceDetails,
  useInvoicePayment,
  useInvoiceVirtualAccount,
  useUploadInvoicePaymentProof,
} from "@/hooks/queries/useInvoices";

import { tokenManager } from "@/services/apiAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSkeleton } from "@/components/ui/LoadingSkeleton";
import { readPendingPayment, resolvePaymentProvider } from "@/config/paymentGateway";

export default function InvoiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: invoiceId } = React.use(params);
  const user = tokenManager.getUser();

  const userRole = user?.role;

  const isOfficer = userRole === "field_officer";
  // Online "Pay now" is an applicant action (citizens/business owners);
  // staff roles only view/confirm payments.
  const isPayer = userRole === "citizen" || userRole === "business_owner";

  // Use real API hooks
  const { invoice, isLoading, error, isPayable, paymentProgress, refetch } =
    useInvoiceDetails(invoiceId);

  const {
    recordPayment,
    isRecordingPayment,
    initializeOnlinePayment,
    isInitializingPayment,
    sendPaymentLink,
    isSendingPaymentLink,
    verifyPayment,
    isVerifyingPayment,
  } = useInvoicePayment(invoiceId, invoice?.invoiceNumber);

  // Reserved (static) bank-transfer account for this invoice. The one-shot
  // dynamic minting routes are disabled server-side, so the reserved account
  // carries the bank-transfer flow: display details, citizen transfers,
  // webhook/treasurer confirmation.
  const {
    virtualAccount: invoiceVa,
    isLoading: isVaLoading,
    error: vaError,
    refetch: refetchVa,
  } = useInvoiceVirtualAccount(invoice?.invoiceNumber, isPayable);

  // Citizen/staff upload of transfer evidence for THIS invoice — records the
  // proof on the pending bank_transfer Payment and parks the application for
  // the treasurer's Payment Confirmations worklist. Never confirms payment.
  const { uploadProofAsync, isUploadingProof } = useUploadInvoicePaymentProof(
    invoiceId,
    invoice?.invoiceNumber,
  );
  const [proofFile, setProofFile] = React.useState<File | null>(null);

  // Auto-verify if we're landing back from a gateway redirect. The provider was
  React.useEffect(() => {
    const pending = readPendingPayment();
    if (pending) {
      verifyPayment({ reference: pending.reference, provider: pending.provider });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log(invoice, "invoice");

  const copy = (v: string, label: string) => {
    navigator.clipboard?.writeText(v);
    toast.success(`${label} copied`);
  };

  const [isRefreshingTransfer, setIsRefreshingTransfer] = React.useState(false);
  // After a manual transfer the webhook or treasurer confirms the payment;
  // "I have paid" just re-pulls the invoice + reserved account so the page
  // reflects a confirmation without a full reload.
  const handleRefreshTransferStatus = async () => {
    setIsRefreshingTransfer(true);
    try {
      await refetchVa();
      await refetch();
    } finally {
      setIsRefreshingTransfer(false);
    }
  };

  const fullPaymentUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pay/${invoice?.invoiceNumber || invoiceId}`
      : "";

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline">
          <Link href="/dashboard/invoices">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Invoices
          </Link>
        </Button>
        <ErrorState
          title="Invoice not found"
          error={error || "The invoice may have been deleted or you don't have access."}
          refetch={refetch}
        />
      </div>
    );
  }

  // Calculate amounts from the new data structure
  const totalAmount = Number(invoice.amount) || 0;
  const amountPaid =
    invoice.payments?.reduce(
      (sum, p) => (p.status === "confirmed" ? sum + Number(p.amount) : sum),
      0,
    ) || 0;
  const balanceDue = totalAmount - amountPaid;

  // Proof already attached to any payment on this invoice (uploaded by the
  // citizen or staff) — drives the Bank Transfer tab's status block.
  const transferProof = invoice.payments?.find((p) => p.proofUrl) || null;

  const handleUploadProof = async () => {
    if (!proofFile) {
      toast.error("Choose a proof file (PNG, JPG or PDF) first");
      return;
    }
    try {
      await uploadProofAsync(proofFile);
      setProofFile(null);
    } catch {
      // The hook already surfaced the error toast.
    }
  };

  // Get customer information from application
  const customerName =
    invoice.application?.formData?.fullName ||
    invoice.application?.applicant?.fullName ||
    "N/A";
  const customerPhone =
    invoice.application?.formData?.phone ||
    invoice.application?.applicant?.phone ||
    "";

  // Get service/levy information
  const serviceName = invoice.application?.service?.name || "N/A";
  const revenueHead = invoice.application?.service?.code || "";

  // Format status for display
  const status = invoice.paymentStatus || "pending";

  const handlePaymentConfirm = (
    method: "transfer" | "pos" | "cash",
    reference?: string,
  ) => {
    recordPayment({
      method: method === "transfer" ? "bank_transfer" : method,
      amount: balanceDue,
      reference,
      narration: `Payment via ${method.toUpperCase()} at LGA office`,
    });
  };

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`Issued ${new Date(invoice.createdAt).toLocaleDateString()} • ${invoice.application?.applicationNumber ? `Application: ${invoice.application.applicationNumber}` : ""}`}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/invoices">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> All invoices
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-gradient-card border-border/40">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total Due
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  ₦{totalAmount.toLocaleString()}
                </div>
                {balanceDue > 0 && balanceDue < totalAmount && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Paid: ₦{amountPaid.toLocaleString()} • Balance: ₦
                    {balanceDue.toLocaleString()}
                  </div>
                )}
              </div>
              <StatusBadge status={status} />
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${paymentProgress}%` }}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {/* <Field label="Customer" value={customerName} /> */}
              {customerPhone && <Field label="Phone" value={customerPhone} />}
              <Field label="Service/Levy" value={serviceName} />
              {revenueHead && (
                <Field label="Revenue Head" value={revenueHead} />
              )}
              <Field
                label="Application Number"
                value={invoice.application?.applicationNumber || "N/A"}
              />
              <Field
                label="Status"
                value={status.charAt(0).toUpperCase() + status.slice(1)}
              />
              {invoice.application?.ward && (
                <Field label="Ward" value={invoice.application.ward} />
              )}
              {invoice.paidAt && (
                <Field
                  label="Paid On"
                  value={new Date(invoice.paidAt).toLocaleString()}
                />
              )}
            </div>

            {invoice.application?.formData?.purpose && (
              <div className="mt-4 p-3 rounded-lg bg-muted/40 text-sm">
                <span className="text-muted-foreground">Purpose: </span>
                {invoice.application.formData.purpose}
              </div>
            )}
          </Card>

          {isPayable ? (
            <Card className="p-6 bg-gradient-card border-border/40">
              <h3 className="font-semibold mb-4">Payment Options</h3>
              <Tabs defaultValue={isPayer ? "online" : isOfficer ? "pos" : "transfer"}>
                <TabsList className="mb-4">
                  {isPayer && (
                    <TabsTrigger value="online">
                      <Link2 className="h-4 w-4 mr-1.5" /> Pay online
                    </TabsTrigger>
                  )}
                  {/* Bank transfer is visible to EVERYONE with invoice access —
                      staff/FO need the account details to relay to citizens and
                      merchants who cannot pay online. */}
                  <TabsTrigger value="transfer">
                    <Landmark className="h-4 w-4 mr-1.5" /> Bank Transfer
                  </TabsTrigger>
                  {isOfficer && (
                    <>
                      <TabsTrigger value="pos">
                        <CreditCard className="h-4 w-4 mr-1.5" /> POS
                      </TabsTrigger>
                      <TabsTrigger value="cash">
                        <Wallet className="h-4 w-4 mr-1.5" /> Cash
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>

                <TabsContent value="online">
                  <div className="p-4 rounded-lg border border-border/60 bg-background space-y-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Pay now
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You&apos;ll be redirected to Gpay to complete payment
                      of ₦{totalAmount.toLocaleString()}.
                    </p>
                    <Button
                      className="w-full bg-gradient-hero"
                      onClick={() => initializeOnlinePayment()}
                      disabled={isInitializingPayment}
                    >
                      {isInitializingPayment ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4 mr-1.5" />
                      )}
                      Pay online
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="transfer">
                  <div className="p-4 rounded-lg border border-border/60 bg-background space-y-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Bank transfer (reserved account)
                    </div>

                    {isVaLoading && (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading bank
                        transfer details...
                      </div>
                    )}

                    {!isVaLoading && !invoiceVa && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                          Bank transfer is unavailable for this invoice
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {vaError?.message ||
                            "We could not load the reserved account for this service."}
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => refetchVa()}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try again
                        </Button>
                      </div>
                    )}

                    {invoiceVa && (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Transfer{" "}
                          <span className="font-semibold text-foreground">
                            &#8358;{(invoiceVa.amount || balanceDue).toLocaleString()}
                          </span>{" "}
                          to the account below and use{" "}
                          <span className="font-mono font-semibold text-foreground">
                            {invoiceVa.reference}
                          </span>{" "}
                          as the transfer reference. The treasury reviews and
                          confirms incoming transfers - your receipt follows once
                          it lands.
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-2xl font-mono font-bold">
                              {invoiceVa.accountNumber}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {invoiceVa.bankName} &bull; {invoiceVa.accountName}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copy(invoiceVa.accountNumber, "Account number")
                            }
                          >
                            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground">
                            Transfer reference
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="font-mono font-semibold">
                              {invoiceVa.reference}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copy(invoiceVa.reference, "Reference")}
                            >
                              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                            </Button>
                          </span>
                        </div>

                        {/* Proof of payment — required before the treasurer confirms */}
                        {transferProof ? (
                          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="h-4 w-4 shrink-0" />{" "}
                              Proof uploaded — awaiting treasurer confirmation
                            </div>
                            <p className="text-xs text-muted-foreground">
                              This invoice stays at &quot;Pay now&quot; until the
                              treasurer reviews your proof and confirms the
                              transfer. Your receipt follows immediately after.
                            </p>
                            {transferProof.proofUrl && (
                              <a
                                href={transferProof.proofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-xs text-primary underline"
                              >
                                View uploaded proof
                              </a>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <Upload className="h-4 w-4 text-primary shrink-0" />{" "}
                              Upload proof of payment
                            </div>
                            <p className="text-xs text-muted-foreground">
                              1) Transfer with the reference above. 2) Upload a
                              screenshot or PDF of your receipt. 3) The treasurer
                              reviews and confirms — until then this invoice
                              still shows &quot;Pay now&quot;.
                            </p>
                            <Input
                              type="file"
                              accept=".png,.jpg,.jpeg,.pdf"
                              onChange={(e) =>
                                setProofFile(e.target.files?.[0] ?? null)
                              }
                            />
                            <Button
                              className="w-full"
                              onClick={handleUploadProof}
                              disabled={!proofFile || isUploadingProof}
                            >
                              {isUploadingProof ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />{" "}
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-1.5" /> Send proof
                                  to treasurer
                                </>
                              )}
                            </Button>
                          </div>
                            <Button
                              variant="outline"
                              className="w-full mt-3"
                              onClick={handleRefreshTransferStatus}
                              disabled={isRefreshingTransfer}
                            >
                              {isRefreshingTransfer ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{" "}
                                  Checking payment status...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> I have
                                  paid - refresh status
                                </>
                              )}
                            </Button>
                          </>
                        )}
                          </>
                        )}
                  </div>
                </TabsContent>
                <TabsContent value="pos">
                  <POSConfirmDialog
                    onConfirm={(ref) => handlePaymentConfirm("pos", ref)}
                    isProcessing={isRecordingPayment}
                  />
                </TabsContent>

                <TabsContent value="cash">
                  <CashConfirmDialog
                    amount={balanceDue}
                    onConfirm={(received, note) => handlePaymentConfirm("cash")}
                    isProcessing={isRecordingPayment}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          ) : (
            <Card className="p-6 bg-success/5 border-2 border-success/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <Badge className="bg-success text-success-foreground">
                    Paid
                  </Badge>
                  <h3 className="font-semibold mt-1">Invoice settled</h3>
                  <p className="text-sm text-muted-foreground">
                    Paid on{" "}
                    {invoice.paidAt &&
                      new Date(invoice.paidAt).toLocaleString()}
                  </p>
                </div>
                {invoice.receipts && invoice.receipts.length > 0 && (
                  <Button asChild className="ml-auto bg-gradient-hero">
                    <Link
                      href={`/dashboard/receipts/${invoice.receipts[0].id}`}
                    >
                      <ReceiptIcon className="h-4 w-4 mr-1.5" /> View receipt
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {status !== "confirmed" && (
            <Card className="p-5 bg-gradient-card border-border/40 text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Scan to Pay
              </div>
              <div className="flex justify-center">
                <a href={fullPaymentUrl} target="_blank" rel="noreferrer">
                  <QRCodeSVG value={fullPaymentUrl} size={180} />
                </a>
              </div>
              <div className="mt-3 text-xs text-muted-foreground break-all">
                {invoice.invoiceNumber}
              </div>
            </Card>
          )}

          {isOfficer && status !== "confirmed" && (
            <Card className="p-5 bg-gradient-card border-border/40 space-y-2">
              <h4 className="font-semibold text-sm mb-1">Send payment link</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Sends via SMS and email in one go
              </p>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => sendPaymentLink()}
                disabled={isSendingPaymentLink}
              >
                {isSendingPaymentLink ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send payment link
              </Button>
            </Card>
          )}

          {invoice.payments && invoice.payments.length > 0 && (
            <Card className="p-5 bg-gradient-card border-border/40">
              <h4 className="font-semibold text-sm mb-3">Payment History</h4>
              <div className="space-y-2">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row justify-between items-center text-sm border-b pb-2"
                  >
                    <div className="flex-1">
                      <span className="font-medium">
                        ₦{Number(payment.amount).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {payment.method}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({payment.status})
                      </span>
                    </div>
                    {payment.status === "pending" &&
                    payment.method === "online" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          verifyPayment({
                            reference: payment.reference,
                            provider: resolvePaymentProvider(payment.reference),
                          })
                        }
                        disabled={isVerifyingPayment}
                      >
                        {isVerifyingPayment ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Check status"
                        )}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {payment.confirmedAt
                          ? new Date(payment.confirmedAt).toLocaleDateString()
                          : "Pending"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

// POSConfirmDialog and CashConfirmDialog remain the same as in your original code

function POSConfirmDialog({
  onConfirm,
  isProcessing,
}: {
  onConfirm: (ref: string) => void;
  isProcessing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-hero" disabled={isProcessing}>
          <CreditCard className="h-4 w-4 mr-1.5" /> Record POS payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm POS payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>POS Reference / RRN</Label>
            <Input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. 0123456789"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>POS Receipt (optional)</Label>
            <Input type="file" accept="image/*" className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!ref) return toast.error("Enter POS reference");
              setOpen(false);
              onConfirm(ref);
            }}
            className="bg-gradient-hero"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
            )}
            Confirm payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CashConfirmDialog({
  amount,
  onConfirm,
  isProcessing,
}: {
  amount: number;
  onConfirm: (received: number, note: string) => void;
  isProcessing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [received, setReceived] = useState(amount);
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-hero" disabled={isProcessing}>
          <Wallet className="h-4 w-4 mr-1.5" /> Record cash payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm cash collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Amount received (₦)</Label>
            <Input
              type="number"
              value={received}
              onChange={(e) => setReceived(Number(e.target.value))}
              className="mt-1.5"
            />
            {received < amount && (
              <p className="text-xs text-red-500 mt-1">
                Amount is less than balance due (₦{amount.toLocaleString()})
              </p>
            )}
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1.5"
              placeholder="e.g., Payment received at LGA office"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (received < amount) {
                toast.error(
                  `Amount must be at least ₦${amount.toLocaleString()}`,
                );
                return;
              }
              setOpen(false);
              onConfirm(received, note);
            }}
            className="bg-gradient-hero"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1.5" />
            )}
            Confirm & issue receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

