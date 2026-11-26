"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Link2, Loader2, ReceiptText } from "lucide-react";
import { services } from "@/services/apiServices";
import { ServiceType } from "@/config/lgaServices";

interface FoCollectionFormProps {
  service: ServiceType;
}

/**
 * Simple collection form for FO-only services.
 *
 * The service was already selected in the catalogue. The officer records
 * who paid, how much was actually paid after bargaining, and the
 * merchant where there is one. There is no fixed fee and no document
 * checklist for these services. The officer chooses how the payer will
 * pay before recording (bank transfer or the online payment link), and
 * the payer is texted the matching instructions. Submitting creates the
 * application and its invoice together, then lands the officer on the
 * invoice page; a recorded transfer is confirmed by the treasurer, while
 * a card payment confirms itself at the gateway.
 */
/** Digits-only comparison so 0803..., +234 803... and 234803... agree. */
const samePhoneNumber = (a: string, b: string): boolean => {
  const norm = (v: string) => {
    const d = v.replace(/\D/g, "");
    return d.startsWith("234") && d.length >= 12 ? `0${d.slice(3)}` : d;
  };
  return norm(a) !== "" && norm(a) === norm(b);
};

export default function FoCollectionForm({ service }: FoCollectionFormProps) {
  const router = useRouter();
  const [payerName, setPayerName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPhone, setConfirmPhone] = useState("");
  const [email, setEmail] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [location, setLocation] = useState("");
  const [amount, setAmount] = useState("");
  const [channel, setChannel] = useState<"card" | "transfer">("transfer");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneMismatch =
    confirmPhone.trim() !== "" && !samePhoneNumber(phone, confirmPhone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const paidAmount = Number(amount);
    if (!payerName.trim()) return setError("Payer name is required.");
    if (!phone.trim()) return setError("Phone number is required.");
    if (!confirmPhone.trim())
      return setError("Confirm the phone number. The payment instructions are sent to it.");
    if (!samePhoneNumber(phone, confirmPhone))
      return setError("The two phone numbers do not match. Check them and try again.");
    if (!location.trim()) return setError("Collection location is required.");
    if (!paidAmount || paidAmount <= 0)
      return setError("Enter the amount actually paid. It must be greater than ₦0.");
    if (!service.code) return setError("Service code is missing.");
    // A collection creates an invoice and sends the payer an SMS, so
    // it can never be recorded offline. Say so at once instead of
    // letting the submit hang on a dead connection.
    if (typeof navigator !== "undefined" && !navigator.onLine)
      return setError(
        "No network. A collection needs a connection because it creates the invoice and sends the payer an SMS. Reconnect and try again.",
      );

    setIsSubmitting(true);
    try {
      const res: any = await services.createFoCollection({
        serviceCode: service.code,
        payerName: payerName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        merchantName: merchantName.trim() || undefined,
        location: location.trim(),
        amount: paidAmount,
        channel,
      });

      const invoiceNumber =
        res?.invoice?.invoiceNumber ?? res?.data?.invoice?.invoiceNumber;
      if (!invoiceNumber) {
        throw new Error("Collection was recorded but no invoice was returned.");
      }

      const smsSent = res?.smsSent ?? res?.data?.smsSent;
      if (channel === "card") {
        if (smsSent) {
          toast.success("Collection recorded. The payment link was sent to the payer by SMS.");
        } else {
          toast.warning("Collection recorded, but the SMS did not go through. Resend it from the invoice page.");
        }
      } else {
        toast.success("Collection recorded. Now record the transfer once the payer pays.");
      }
      router.push(`/dashboard/invoices/${invoiceNumber}`);
    } catch (err: any) {
      console.error("FO collection failed:", err);
      setError(err?.message || "Could not record this collection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">FO-only service.</span>{" "}
        This service is not visible to the public and has no fixed fee. Record
        the amount actually paid after bargaining, choose how the payer will
        pay, and the payment instructions go to their phone by SMS.
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fo-payer-name" className="text-xs font-semibold">
            Payer Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fo-payer-name"
            placeholder="e.g. Adebisi Stores"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            className="h-10 text-sm bg-background"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fo-phone" className="text-xs font-semibold">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fo-phone"
            placeholder="e.g. 0803 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-10 text-sm bg-background"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fo-confirm-phone" className="text-xs font-semibold">
            Confirm Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fo-confirm-phone"
            placeholder="Re-enter the phone number"
            value={confirmPhone}
            onChange={(e) => setConfirmPhone(e.target.value)}
            className="h-10 text-sm bg-background"
            required
          />
          {phoneMismatch ? (
            <p className="text-[11px] text-destructive">
              The two phone numbers do not match.
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              The payment instructions are sent to this number, so it has to
              be right.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fo-email" className="text-xs font-semibold">
            Email (Optional)
          </Label>
          <Input
            id="fo-email"
            type="email"
            placeholder="e.g. payer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 text-sm bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fo-merchant" className="text-xs font-semibold">
            Merchant / Business (If Any)
          </Label>
          <Input
            id="fo-merchant"
            placeholder="e.g. Adebisi Provisions Ltd"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            className="h-10 text-sm bg-background"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="fo-location" className="text-xs font-semibold">
            Collection Location <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fo-location"
            placeholder="e.g. Stall 12, Ilese Market"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-10 text-sm bg-background"
            required
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="fo-amount" className="text-xs font-semibold">
            Amount Paid (₦) <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
              ₦
            </div>
            <Input
              id="fo-amount"
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8 h-10 font-bold text-sm bg-background"
              required
            />
          </div>
          <span className="text-[10px] text-muted-foreground">
            Enter what was actually paid, not a standard rate.
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">
          How will the payer pay? <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            type="button"
            variant={channel === "transfer" ? "default" : "outline"}
            className="h-auto py-3 justify-start"
            onClick={() => setChannel("transfer")}
          >
            <Landmark className="h-4 w-4 mr-2 shrink-0" />
            <span className="text-left">
              <span className="block text-sm font-semibold">Bank Transfer</span>
              <span className="block text-xs font-normal opacity-80">
                The payer gets the LGA account details by SMS
              </span>
            </span>
          </Button>
          <Button
            type="button"
            variant={channel === "card" ? "default" : "outline"}
            className="h-auto py-3 justify-start"
            onClick={() => setChannel("card")}
          >
            <Link2 className="h-4 w-4 mr-2 shrink-0" />
            <span className="text-left">
              <span className="block text-sm font-semibold">Pay Online</span>
              <span className="block text-xs font-normal opacity-80">
                The payer gets a card payment link by SMS
              </span>
            </span>
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto text-sm font-semibold gap-1.5"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Recording...
          </>
        ) : (
          <>
            <ReceiptText className="h-4 w-4" /> Record Collection &amp; Open Invoice
          </>
        )}
      </Button>
    </form>
  );
}
