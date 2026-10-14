"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  CheckCircle2,
  Copy,
  Landmark,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import type {
  PaymentProofResult,
  StaticAccountApplicationResponse,
} from "@/services/apiFieldOfficer";
import { useStaticAccountApplications } from "@/hooks/queries/useFieldOfficer";

interface FoBankTransferPanelProps {
  result: StaticAccountApplicationResponse;
  onReset: () => void;
}

function formatNgn(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Shown to a field officer after creating an assisted application paid via the
 * FO-only static bank account. Displays the transfer instructions and lets the
 * officer upload proof of the transfer once done — the treasurer confirms it.
 */
export default function FoBankTransferPanel({
  result,
  onReset,
}: FoBankTransferPanelProps) {
  const { uploadPaymentProofAsync, isUploadingProof } =
    useStaticAccountApplications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<PaymentProofResult | null>(null);

  const { transferInstructions, application, invoice, payment } = result;

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadPaymentProofAsync({ paymentId: payment.id, file });
      setUploaded(res);
    } catch {
      // toast handled by the mutation
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
          Awaiting payment confirmation
        </Badge>
        <span className="text-sm font-semibold">
          {application.applicationNumber}
        </span>
        <span className="text-xs text-muted-foreground">
          Invoice {invoice.invoiceNumber}
        </span>
      </div>

      <div>
        <h3 className="font-bold flex items-center gap-2 mb-1">
          <Landmark className="h-4 w-4" />
          Bank transfer instructions
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Ask the applicant to transfer exactly{" "}
          <span className="font-semibold text-foreground">
            {formatNgn(transferInstructions.amount)}
          </span>{" "}
          to the account below. Use the reference exactly as shown.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <InfoRow label="Bank" value={transferInstructions.bankName} />
          <InfoRow
            label="Account number"
            value={transferInstructions.accountNumber}
            onCopy={() =>
              copyToClipboard(transferInstructions.accountNumber, "Account number")
            }
          />
          <InfoRow label="Account name" value={transferInstructions.accountName} />
          <InfoRow label="Amount" value={formatNgn(transferInstructions.amount)} />
          <InfoRow
            label="Reference"
            value={transferInstructions.reference}
            highlight
            onCopy={() =>
              copyToClipboard(transferInstructions.reference, "Reference")
            }
          />
        </div>
      </div>

      <div className="border-t pt-4">
        {uploaded ? (
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-medium text-sm">Proof of payment uploaded</p>
              <p className="text-xs text-muted-foreground">
                The treasurer will confirm the transfer shortly. The
                application moves forward automatically once confirmed.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingProof}
            >
              {isUploadingProof ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1.5" />
              )}
              Upload proof of transfer
            </Button>
            <p className="text-xs text-muted-foreground">
              Screenshot or PDF of the transfer confirmation
            </p>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <Button variant="outline" onClick={onReset}>
          <Banknote className="h-4 w-4 mr-1.5" />
          Create another assisted application
        </Button>
      </div>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  highlight,
  onCopy,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 bg-muted/30">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={`text-sm truncate ${highlight ? "font-bold text-primary" : "font-medium"}`}
        >
          {value}
        </p>
      </div>
      {onCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onCopy}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

