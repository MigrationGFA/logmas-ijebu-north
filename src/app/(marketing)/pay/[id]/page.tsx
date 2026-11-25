// app/pay/[id]/page.tsx
"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useInvoicePayment } from "@/hooks/queries/useInvoices";
import { invoicesService } from "@/services/apiInvoice";
import { getAuthToken } from "@/lib/api";
import { stashPendingPayment } from "@/config/paymentGateway";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  // Logged-in payers keep the account door, exactly as before.
  const { initializeOnlinePayment } = useInvoicePayment(id, id);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const startedRef = useRef(false);

  // Payers who arrive from an SMS link have no account: the public door
  // starts the payment against the invoice itself. Paystack needs an
  // email, taken from the collection record where one exists; when it
  // does not, the payer is asked for it here.
  const startPublic = useCallback(
    async (emailValue?: string) => {
      setStarting(true);
      setError(null);
      try {
        const response = await invoicesService.initializePublicInvoicePayment(
          id,
          emailValue,
        );
        stashPendingPayment(response.reference, "paystack");
        window.location.href = response.paymentUrl;
      } catch (err: any) {
        if (err?.backendCode === "EMAIL_REQUIRED") {
          setNeedsEmail(true);
        } else {
          setError(
            err?.message ||
              "We could not start this payment. Please contact the field officer who sent you this link.",
          );
        }
      } finally {
        setStarting(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (getAuthToken()) {
      initializeOnlinePayment();
    } else {
      void startPublic();
    }
  }, [initializeOnlinePayment, startPublic]);

  if (needsEmail) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <form
          className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-background p-6"
          onSubmit={(e) => {
            e.preventDefault();
            void startPublic(email);
          }}
        >
          <div className="space-y-1">
            <h1 className="text-base font-semibold">One more detail</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email address to continue to the card payment. Your
              receipt will be sent there.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payer-email">Email address</Label>
            <Input
              id="payer-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={starting}>
            {starting ? "Starting payment..." : "Continue to payment"}
          </Button>
        </form>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {error}
        </p>
      </div>
    );
  }

  // Optional: show a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2">Redirecting to payment gateway...</p>
    </div>
  );
}
