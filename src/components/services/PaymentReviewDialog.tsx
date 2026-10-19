"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileCheck2,
  Loader2,
  Lock,
  Mail,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PAYMENT_PROVIDER_LABELS,
  type PaymentProvider,
} from "@/config/paymentGateway";
// import type { DynamicVirtualAccount } from "@/services/apiInvoice";
import { QRCodeSVG } from "@/components/dashboard/qr-code";

// ON HOLD — live countdown for the dynamic 15-minute transfer account.
// /** Live mm:ss countdown to an ISO expiry. Turns red under 60s. */
// function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
//   const [now, setNow] = useState(() => Date.now());
// 
//   useEffect(() => {
//     const id = setInterval(() => setNow(Date.now()), 1000);
//     return () => clearInterval(id);
//   }, []);
// 
//   const remaining = Math.max(
//     0,
//     Math.floor((new Date(expiresAt).getTime() - now) / 1000),
//   );
//   const mins = Math.floor(remaining / 60);
//   const secs = remaining % 60;
//   const urgent = remaining <= 60;
// 
//   return (
//     <span
//       className={`inline-flex items-center gap-1.5 font-mono font-semibold tabular-nums ${
//         urgent ? "text-destructive" : "text-foreground"
//       }`}
//     >
//       <Clock className="h-3.5 w-3.5" />
//       {mins}:{secs.toString().padStart(2, "0")}
//     </span>
//   );
// }

/**
 * A dedicated virtual account for this specific payment.
 *
 * Every field is supplied by the backend. The browser never holds a GPay
 * merchant key, and no account number is ever hard-coded in the client,
 * because the reserved-accounts endpoint returns every account the LGA owns.
 */
export interface VirtualAccountDetails {
  accountNumber: string;
  bankName: string;
  accountName: string;
  /** Pending-payment reference the citizen must quote in the transfer narration. */
  reference: string;
  /** Amount that will settle this account, in naira. */
  amount: number;
  /** Route A also sends this as `expectedAmount`; prefer it when present. */
  expectedAmount?: number;
  invoiceNumber?: string | null;
}

export interface PaymentReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  serviceCategory: string;
  fullName: string;
  email: string;
  phone: string;
  /** Statutory fee in naira. */
  fee: number;
  provider: PaymentProvider;
  isProcessing: boolean;
// ON HOLD (public apply = card only): reserved/dynamic account + proof props — restore with the static tab below.
//   /** Only pass this once the backend can also reconcile the transfer. */
//   virtualAccount?: VirtualAccountDetails | null;
//   /** Static (reserved) account details returned by the gateway.
//    * Used when the service does not use the one-shot dynamic transfer flow.
//    */
//   staticAccount?: VirtualAccountDetails | null;
//   /** One-shot 15-min Providus account (auto-confirms). Present once minted. */
//   dynamicAccount?: DynamicVirtualAccount | null;
//   /** True while the dynamic account is being created. */
//   isCreatingDynamicAccount?: boolean;
//   /** Error from the last dynamic-account creation attempt, if any. */
//   dynamicAccountError?: string;
//   /** Static account reference. Present if the service uses a reserved account. */
//   staticAccountReference?: string | null;
//   /** Why the reserved account could not be loaded, when the fetch failed. */
//   staticAccountError?: string;
//   /** Callback to upload proof of payment for the static account. */
//   onUploadProof?: (paymentId: string, file: File) => void;
//   /** Whether the proof has been uploaded. */
//   proofUploaded?: boolean;
//   /** Mint the dynamic account (starts the 15-min clock). */
//   onStartDynamicTransfer?: () => void;
//   /** Poll the gateway for settlement of the minted dynamic account. */
//   onCheckDynamicStatus?: () => void;
//   /** True while a dynamic-account status poll is in flight. */
//   isCheckingDynamicStatus?: boolean;
  onCheckout: () => void;
  onEditDetails: () => void;
//   onCheckTransferStatus?: () => void;
}

export function PaymentReviewDialog({
  open,
  onOpenChange,
  serviceName,
  serviceCategory,
  fullName,
  email,
  phone,
  fee,
  provider,
  isProcessing,
//   staticAccount,
//   dynamicAccount,
//   isCreatingDynamicAccount,
//   dynamicAccountError,
//   staticAccountReference,
//   staticAccountError,
//   onUploadProof,
//   proofUploaded,
//   onStartDynamicTransfer,
//   onCheckDynamicStatus,
//   isCheckingDynamicStatus,
  onCheckout,
  onEditDetails,
}: PaymentReviewDialogProps) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // Start from a clean slate every time the dialog is opened.
  useEffect(() => {
    if (open) {
      setConfirmEmail("");
      setConfirmError("");
    }
  }, [open]);

  const emailsMatch =
    confirmEmail.trim().length > 0 &&
    confirmEmail.trim().toLowerCase() === email.trim().toLowerCase();

  const handleConfirmEmailChange = (value: string) => {
    setConfirmEmail(value);
    if (confirmError) setConfirmError("");
  };

  // Guarded here as well as on the form: the checkout session is created from
  // this handler, so a mistyped email must never reach the gateway.
  const handleCheckout = () => {
    if (!emailsMatch) {
      setConfirmError(
        "The two email addresses do not match. Retype your email address to confirm. Your login credentials will be sent there.",
      );
      return;
    }
    onCheckout();
  };

  // Instant transfer mints a real, amount-bound account and the receipt is
  // emailed to the applicant — so it gets the same email-confirmation gate as
  // checkout. A payer who skipped the field gets a pointer back to it.
//   const handleStartDynamic = () => {
//     if (!emailsMatch) {
//       setConfirmError(
//         "Confirm your email address above before generating a transfer account. Your receipt and login details are matched to this address.",
//       );
//       return;
//     }
//     onStartDynamicTransfer?.();
//   };

  // Ticks once a second while a minted account is displayed so a lapsed 15-min
  // account can offer "Generate new account" instead of a dead countdown.
//   const [now, setNow] = useState(() => Date.now());
//   useEffect(() => {
//     if (!open || !dynamicAccount) return;
//     setNow(Date.now());
//     const id = setInterval(() => setNow(Date.now()), 1000);
//     return () => clearInterval(id);
//   }, [open, dynamicAccount]);
//   const dynamicExpired =
//     !!dynamicAccount &&
//     new Date(dynamicAccount.expiresAt).getTime() <= now;

  const handleClose = () => {
    if (isProcessing) return;
    onOpenChange(false);
  };

//   const copyDynamic = async (text: string, message: string) => {
//     try {
//       await navigator.clipboard.writeText(text);
//       toast.success(message);
//     } catch {
//       toast.error("Could not copy. Please write it down manually.");
//     }
//   };

//   const dynamicUssdList = dynamicAccount?.ussd
//     ? Object.entries(dynamicAccount.ussd)
//     : [];

  const summaryRows: { label: string; value: string }[] = [
    { label: "Statutory service", value: serviceName },
    { label: "Category", value: serviceCategory },
    { label: "Applicant name", value: fullName },
    { label: "Email address", value: email },
    { label: "Phone number", value: phone },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}
    >
      <DialogContent
        className="max-w-xl max-h-[92vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            Review Your Payment
          </DialogTitle>
          <DialogDescription>
            Check the details below before you pay. Once payment clears we create
            your portal account and email the login details to{" "}
            <span className="font-semibold text-foreground">{email}</span>.
            Credentials are only ever sent by email — they are never shown on
            this page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Amount payable
              </div>
              <div className="text-2xl font-bold text-foreground">
                &#8358;{fee.toLocaleString()}
              </div>
            </div>
            <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 text-right">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              Official Government
              <br />
              Treasury Fee
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background">
            <dl className="divide-y divide-border/40">
              {summaryRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-4 px-4 py-2.5 text-xs"
                >
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="font-semibold text-foreground text-right break-all">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <Label
              htmlFor="confirm-applicant-email"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Confirm email address <span className="text-destructive">*</span>
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-applicant-email"
                type="email"
                autoComplete="off"
                placeholder="Retype the email address above"
                value={confirmEmail}
                onChange={(e) => handleConfirmEmailChange(e.target.value)}
                aria-invalid={confirmError ? "true" : "false"}
                aria-describedby="confirm-email-help"
                className={`pl-10 text-sm h-11 bg-background${
                  confirmError
                    ? " border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
              />
            </div>
            {confirmError ? (
              <p className="mt-1 flex items-start gap-1 text-[11px] font-medium text-destructive">
                <AlertCircle className="mt-px h-3 w-3 shrink-0" />
                {confirmError}
              </p>
            ) : (
              <p
                id="confirm-email-help"
                className="mt-1 text-[11px] text-muted-foreground"
              >
                Credentials and your payment receipt are sent to this address
                only. Double-check it — a typo here means no login details reach
                you.
              </p>
            )}
          </div>

          <Tabs defaultValue="online" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="online" className="flex-1">
                <CreditCard className="mr-1.5 h-4 w-4" /> Pay online
              </TabsTrigger>
{/* ON HOLD — bank transfer (static) tab trigger; public apply shows card payment only.
              <TabsTrigger value="static" className="flex-1">
                <FileCheck2 className="mr-1.5 h-4 w-4" /> Bank transfer (static)
              </TabsTrigger>
*/}
            </TabsList>

            <TabsContent
              value="online"
              className="p-4 rounded-lg border border-border/60 bg-background space-y-3"
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Pay now with {PAYMENT_PROVIDER_LABELS[provider]}
              </div>
              <p className="text-sm text-muted-foreground">
                You will be redirected to our secure checkout to pay{" "}
                <span className="font-semibold text-foreground">
                  &#8358;{fee.toLocaleString()}
                </span>{" "}
                by card, USSD or bank transfer. Your portal account is created
                automatically as soon as payment is confirmed.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                256-bit encrypted checkout.
              </div>
              <Button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-gradient-hero text-primary-foreground font-semibold shadow-elegant"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Contacting {PAYMENT_PROVIDER_LABELS[provider]}...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Continue to secure checkout
                    <Lock className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </TabsContent>

{/* ON HOLD — public apply is card-only. Restore the bank-transfer tab trigger above to bring this panel back.
            <TabsContent
              value="static"
              className="p-4 rounded-lg border border-border/60 bg-background space-y-3"
            >
              {staticAccount ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileCheck2 className="h-4 w-4 text-primary shrink-0" />
                    Bank transfer (static)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A reserved account has been set up for this service. Use the
                    details below to pay the exact amount{" "}
                    <span className="font-semibold text-foreground">
                      &#8358;{fee.toLocaleString()}
                    </span>
                    . Your payment will be reviewed and confirmed by the
                    treasurer.
                  </p>
                  <div className="rounded-lg border border-border/60 bg-muted/30 space-y-3 p-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Account number
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="break-all font-mono text-sm text-foreground">
                          {staticAccount.accountNumber}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyDynamic(
                              staticAccount.accountNumber,
                              "Account number copied",
                            )
                          }
                        >
                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Bank
                      </div>
                      <div className="text-sm text-foreground">
                        {staticAccount.bankName}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Account name
                      </div>
                      <div className="text-sm text-foreground">
                        {staticAccount.accountName}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Transfer reference
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="break-all font-mono text-sm font-semibold text-foreground">
                          {staticAccount.reference}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyDynamic(
                              staticAccount.reference,
                              "Reference copied",
                            )
                          }
                        >
                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                        </Button>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Quote this reference in the transfer narration so the
                        treasury can match your payment.
                      </p>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Amount
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        &#8358;{(staticAccount.expectedAmount ?? staticAccount.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {onUploadProof ? (
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileCheck2 className="h-4 w-4 text-primary shrink-0" />
                        Upload proof of payment
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload a screenshot or PDF of your transfer to speed up
                        treasurer confirmation.
                      </p>
                      <Label htmlFor="proof-upload">Proof of payment (PNG, JPG, PDF)</Label>
                      <Input
                        id="proof-upload"
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onUploadProof("", file);
                          }
                        }}
                      />
                      {proofUploaded ? (
                        <p className="text-xs text-emerald-600">
                          <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
                          Proof uploaded and linked to your account.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileCheck2 className="h-4 w-4 text-primary shrink-0" />
                    Bank transfer (static)
                  </div>
                  {staticAccountError ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {staticAccountError}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        You can still use the Pay online tab to complete this
                        payment.
                      </p>
                    </>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      Loading this service&apos;s reserved bank account...
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
*/}

        </Tabs>
        </div>
        <DialogFooter className="sm:justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onEditDetails}
            disabled={isProcessing}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
