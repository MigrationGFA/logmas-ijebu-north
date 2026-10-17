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
import type { DynamicVirtualAccount } from "@/services/apiInvoice";
import { QRCodeSVG } from "@/components/dashboard/qr-code";

/** Live mm:ss countdown to an ISO expiry. Turns red under 60s. */
function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - now) / 1000),
  );
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const urgent = remaining <= 60;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold tabular-nums ${
        urgent ? "text-destructive" : "text-foreground"
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}

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
  /** Only pass this once the backend can also reconcile the transfer. */
  virtualAccount?: VirtualAccountDetails | null;
  /** One-shot 15-min Providus account (auto-confirms). Present once minted. */
  dynamicAccount?: DynamicVirtualAccount | null;
  /** True while the dynamic account is being created. */
  isCreatingDynamicAccount?: boolean;
  /** Error from the last dynamic-account creation attempt, if any. */
  dynamicAccountError?: string;
  /** Mint the dynamic account (starts the 15-min clock). */
  onStartDynamicTransfer?: () => void;
  /** Poll the gateway for settlement of the minted dynamic account. */
  onCheckDynamicStatus?: () => void;
  /** True while a dynamic-account status poll is in flight. */
  isCheckingDynamicStatus?: boolean;
  onCheckout: () => void;
  onEditDetails: () => void;
  onCheckTransferStatus?: () => void;
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
  dynamicAccount,
  isCreatingDynamicAccount,
  dynamicAccountError,
  onStartDynamicTransfer,
  onCheckDynamicStatus,
  isCheckingDynamicStatus,
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
  const handleStartDynamic = () => {
    if (!emailsMatch) {
      setConfirmError(
        "Confirm your email address above before generating a transfer account. Your receipt and login details are matched to this address.",
      );
      return;
    }
    onStartDynamicTransfer?.();
  };

  // Ticks once a second while a minted account is displayed so a lapsed 15-min
  // account can offer "Generate new account" instead of a dead countdown.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!open || !dynamicAccount) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open, dynamicAccount]);
  const dynamicExpired =
    !!dynamicAccount &&
    new Date(dynamicAccount.expiresAt).getTime() <= now;

  const handleClose = () => {
    if (isProcessing) return;
    onOpenChange(false);
  };

  const copyDynamic = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error("Could not copy. Please write it down manually.");
    }
  };

  const dynamicUssdList = dynamicAccount?.ussd
    ? Object.entries(dynamicAccount.ussd)
    : [];

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
              <TabsTrigger value="auto" className="flex-1">
                <Zap className="mr-1.5 h-4 w-4" /> Bank transfer
              </TabsTrigger>
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

            <TabsContent
              value="auto"
              className="p-4 rounded-lg border border-border/60 bg-background space-y-3"
            >
              {isCreatingDynamicAccount ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating your
                  transfer account...
                </div>
              ) : dynamicAccountError ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    We could not create a transfer account
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dynamicAccountError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleStartDynamic}
                    disabled={isProcessing}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
                  </Button>
                </>
              ) : dynamicAccount ? (
                <>
                {dynamicExpired ? (
                  <div className="rounded-lg border border-amber-500/50 bg-amber-50 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      This transfer account has expired
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The 15-minute window has closed. Generate a new account to
                      continue. If you already sent money to the expired
                      account, it is still reconciled automatically — we check
                      it for settlement before minting the new one.
                    </p>
                    {onStartDynamicTransfer ? (
                      <Button
                        type="button"
                        className="w-full bg-gradient-hero text-primary-foreground font-semibold shadow-elegant"
                        onClick={handleStartDynamic}
                        disabled={isProcessing || isCreatingDynamicAccount}
                      >
                        {isCreatingDynamicAccount ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            Checking your previous transfer...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-1.5 h-4 w-4" /> Generate
                            new account
                          </>
                        )}
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Transfer to this account
                  </div>
                  <ExpiryCountdown expiresAt={dynamicAccount.expiresAt} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-2xl font-mono font-bold">
                      {dynamicAccount.accountNumber}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {dynamicAccount.bankName} &bull;{" "}
                      {dynamicAccount.accountName}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyDynamic(
                        dynamicAccount.accountNumber,
                        "Account number copied",
                      )
                    }
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                  </Button>
                </div>

                <dl className="divide-y divide-border/40 rounded-lg border border-border/60">
                  <div className="flex items-center justify-between px-3 py-2 text-xs">
                    <dt className="text-muted-foreground">Amount to pay</dt>
                    <dd className="font-semibold text-foreground">
                      &#8358;{dynamicAccount.amount.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                    <dt className="text-muted-foreground">
                      Transfer reference
                    </dt>
                    <dd className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-foreground">
                        {dynamicAccount.reference}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyDynamic(
                            dynamicAccount.reference,
                            "Reference copied",
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    </dd>
                  </div>
                </dl>

                {dynamicAccount.qrCode ? (
                  <div className="rounded-lg border border-border/60 p-3 text-center">
                    {/^(https?:|data:image\/)/i.test(dynamicAccount.qrCode) ? (
                      <img
                        src={dynamicAccount.qrCode}
                        alt="Scan to pay (NQR)"
                        className="mx-auto h-28 w-28 object-contain"
                      />
                    ) : (
                      // GPay returned the raw EMVCo NQR string rather than an
                      // image URL — render it with the shared QR component.
                      <QRCodeSVG
                        value={dynamicAccount.qrCode}
                        size={112}
                        className="mx-auto"
                      />
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Scan this NQR code with your bank app to pay.
                    </p>
                  </div>
                ) : null}

                {dynamicUssdList.length > 0 ? (
                  <div className="rounded-lg border border-border/60 p-3 space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Or pay by USSD
                    </div>
                    {dynamicUssdList.slice(0, 4).map(([bank, code]) => (
                      <div
                        key={bank}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-muted-foreground">{bank}</span>
                        <button
                          type="button"
                          onClick={() =>
                            copyDynamic(code, `${bank} USSD copied`)
                          }
                          className="font-mono font-semibold text-foreground hover:text-primary"
                        >
                          {code}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  Transfer the exact amount before the timer runs out. This
                  account is{" "}
                  <span className="font-semibold text-foreground">
                    auto-confirmed
                  </span>{" "}
                  — no treasurer step needed. Your portal account is created the
                  moment payment settles.
                </p>

                {onCheckDynamicStatus ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={onCheckDynamicStatus}
                    disabled={isCheckingDynamicStatus}
                  >
                    {isCheckingDynamicStatus ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Checking payment...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> I have
                        paid — check now
                      </>
                    )}
                  </Button>
                ) : null}
                </>
                )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Zap className="h-4 w-4 text-primary shrink-0" /> Bank
                    transfer (auto-confirms in 15 min)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We will generate a dedicated Providus Bank account for
                    exactly{" "}
                    <span className="font-semibold text-foreground">
                      &#8358;{fee.toLocaleString()}
                    </span>
                    . It stays open for 15 minutes and confirms your payment
                    automatically — no waiting for a treasurer.
                  </p>
                  {onStartDynamicTransfer ? (
                    <Button
                      type="button"
                      className="w-full bg-gradient-hero text-primary-foreground font-semibold shadow-elegant"
                      onClick={handleStartDynamic}
                      disabled={isProcessing || isCreatingDynamicAccount}
                    >
                      {isCreatingDynamicAccount ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-1.5 h-4 w-4" /> Generate transfer
                          account
                        </>
                      )}
                    </Button>
                  ) : null}
                </>
              )}
            </TabsContent>
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
