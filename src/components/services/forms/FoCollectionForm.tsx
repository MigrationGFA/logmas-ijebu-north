"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ReceiptText } from "lucide-react";
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
 * checklist for these services. Submitting creates the application and
 * its invoice together, then lands the officer on the invoice page to
 * record how the payer paid (cash or bank transfer) for the treasurer
 * to confirm.
 */
export default function FoCollectionForm({ service }: FoCollectionFormProps) {
  const router = useRouter();
  const [payerName, setPayerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [location, setLocation] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const paidAmount = Number(amount);
    if (!payerName.trim()) return setError("Payer name is required.");
    if (!phone.trim()) return setError("Phone number is required.");
    if (!location.trim()) return setError("Collection location is required.");
    if (!paidAmount || paidAmount <= 0)
      return setError("Enter the amount actually paid. It must be greater than ₦0.");
    if (!service.code) return setError("Service code is missing.");

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
      });

      const invoiceNumber =
        res?.invoice?.invoiceNumber ?? res?.data?.invoice?.invoiceNumber;
      if (!invoiceNumber) {
        throw new Error("Collection was recorded but no invoice was returned.");
      }

      toast.success("Collection recorded. Now choose how the payer paid.");
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
        the amount actually paid after bargaining. No bank details are shown
        for this service; the treasurer confirms the collection afterwards.
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
