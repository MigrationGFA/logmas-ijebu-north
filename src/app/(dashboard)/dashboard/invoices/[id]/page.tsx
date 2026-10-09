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
  Banknote,
  Receipt as ReceiptIcon,
  Printer,
  Phone,
  Mail,
  MessageCircle,
  Wallet,
  Link2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  useInvoiceDetails,
  useInvoicePayment,
} from "@/hooks/queries/useInvoices";
import { invoicesService } from "@/services/apiInvoice";
import { ApiError } from "@/lib/api";

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
  const { invoice, isLoading, error, isPayable, paymentProgress } =
    useInvoiceDetails(invoiceId);

  const {
    recordPayment,
    isRecordingPayment,
    simulatePayment,
    initializeOnlinePayment,
    isInitializingPayment,
    sendPaymentLink,
    isSendingPaymentLink,
    verifyPayment,
    isVerifyingPayment,
  } = useInvoicePayment(invoiceId, invoice?.invoiceNumber);

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

  const [transferAccount, setTransferAccount] = React.useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    reference: string;
    expectedAmount: number;
    amount: number;
    invoiceNumber: string;
  } | null>(null);
  const [transferError, setTransferError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const invoiceNumber = invoice?.invoiceNumber;
    if (!invoiceNumber) return;
    let cancelled = false;
    invoicesService
      .getInvoiceVirtualAccount(invoiceNumber)
      .then((va) => {
        if (!cancelled) {
          setTransferAccount(va);
          setTransferError(null);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTransferAccount(null);
        const code =
          err instanceof ApiError
            ? (err.backendCode ?? String(err.status))
            : "UNKNOWN";
        setTransferError(
          code === "BAD_REQUEST"
            ? "This invoice is already settled."
            : err instanceof Error
              ? err.message
              : "Transfer unavailable",
        );
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.invoiceNumber]);

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
              <Tabs defaultValue="transfer">
                <TabsList className="mb-4">
                  {isPayer && (
                    <TabsTrigger value="online">
                      <Link2 className="h-4 w-4 mr-1.5" /> Online
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="transfer">
                    <Banknote className="h-4 w-4 mr-1.5" /> Bank Transfer
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

                <TabsContent value="transfer">
                  <div className="p-4 rounded-lg border border-border/60 bg-background space-y-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Dynamic Virtual Account
                    </div>
                    {(transferAccount?.accountNumber || invoice.virtualAccountNumber) ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-2xl font-mono font-bold">
                              {transferAccount?.accountNumber || invoice.virtualAccountNumber}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {transferAccount?.bankName ||
                                invoice.virtualBankName ||
                                "Providus Bank"}{" "}
                              •
                              {invoice.application?.formData?.fullName ||
                                "Applicant"}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copy(
                                transferAccount?.accountNumber ||
                                  invoice.virtualAccountNumber!,
                                "Account number",
                              )
                            }
                          >
                            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                          </Button>
                        </div>
                        {transferAccount && (
                          <>
                            <div className="text-xs text-muted-foreground">
                              {transferAccount.accountName}
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-muted-foreground">
                                Transfer reference
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="font-mono font-semibold">
                                  {transferAccount.reference}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    copy(
                                      transferAccount.reference,
                                      "Transfer reference",
                                    )
                                  }
                                >
                                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                                </Button>
                              </span>
                            </div>
                          </>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Transfer ₦{balanceDue.toLocaleString()} to this
                          account and quote your reference in the narration.
                          An LGA treasurer confirms the payment and your
                          receipt follows.
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Virtual account not yet generated. Please use other
                        payment methods.
                      </div>
                    )}
                    {/* Remove citizen for production */}
                    {process.env.NODE_ENV === "development" && (
                      <Button
                        className="w-full bg-gradient-hero"
                        onClick={() => simulatePayment()}
                        disabled={isRecordingPayment}
                      >
                        {isRecordingPayment ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        )}
                        Simulate transfer received
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="online">
                  <div className="p-4 rounded-lg border border-border/60 bg-background space-y-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Pay now
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You&apos;ll be redirected to Paystack to complete payment
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

