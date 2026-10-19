/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  GetInvoicesParams,
  invoicesService,
  PaymentData,
//   type DynamicVirtualAccount,
  type InvoiceStatus,
} from "@/services/apiInvoice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  clearPendingPayment,
  getActivePaymentProvider,
  getCheckoutUrl,
  isGpayInitResponse,
  stashPendingPayment,
  type PaymentProvider,
} from "@/config/paymentGateway";


export const invoicesKeys = {
  all: ["invoices"] as const,
  hub: () => [...invoicesKeys.all, "hub"] as const,
  filteredHub: (params?: GetInvoicesParams) =>
    [...invoicesKeys.hub(), params] as const,
  detail: (id: string) => [...invoicesKeys.all, "detail", id] as const,
  va: (invoiceNumber: string) => [...invoicesKeys.all, "va", invoiceNumber] as const,
};

// Hook for invoices list/hub
export function useInvoices(params?: GetInvoicesParams) {
  const queryClient = useQueryClient();

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: invoicesKeys.filteredHub(params),
    queryFn: () => invoicesService.getInvoicesHub(params),
    staleTime: 30 * 1000,
  });

  const stats = response?.stats || {
    outstanding: 0,
    totalCollected: 0,
    transactions: 0,
    avgPayment: 0,
  };

  const invoices = response?.invoices || [];

  return {
    outstanding: stats.outstanding,
    collected: stats.totalCollected,
    transactions: stats.transactions,
    avgPayment: stats.avgPayment,
    invoices,
    isLoading,
    error,
    refetch,
  };
}

// Hook for single invoice details
export function useInvoiceDetails(invoiceId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: invoicesKeys.detail(invoiceId),
    queryFn: () => invoicesService.getInvoiceById(invoiceId),
    enabled: !!invoiceId,
    staleTime: 60 * 1000,
  });
  const invoice = data;

  const isPayable = invoice
    ? String(invoice.paymentStatus) !== "confirmed" &&
      String(invoice.paymentStatus) !== "cancelled"
    : false;

  const paymentProgress = invoice
    ? (invoice.amountPaid / invoice.totalAmount) * 100
    : 0;

  return {
    invoice,
    isLoading,
    error,
    refetch,
    isPayable,
    paymentProgress,
  };
}

/**
 * Reserved (static) bank-transfer account for an existing invoice.
 * GET /invoices/:invoiceNumber/virtual-account (authenticated) - the supported
 * bank-transfer path now that the dynamic minting routes are disabled
 * server-side. Settlement happens via gateway webhook / treasurer confirmation;
 * this hook only supplies the account details and a manual refresh.
 */
export function useInvoiceVirtualAccount(
  invoiceNumber?: string,
  enabled = true,
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: invoicesKeys.va(invoiceNumber || ""),
    queryFn: () => invoicesService.getInvoiceVirtualAccount(invoiceNumber!),
    enabled: !!invoiceNumber && enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });

  return {
    virtualAccount: data,
    isLoading,
    error,
    refetch,
  };
}
/**
 * Citizen/staff proof-of-payment upload for this invoice bank transfer.
 * POST /invoices/:invoiceNumber/payment-proof (multipart field "proof") —
 * records the proof on the pending bank_transfer Payment and parks the
 * application at awaiting_payment_confirmation for the treasurer worklist.
 * The invoice keeps saying "Pay now" until the treasurer confirms.
 */
export function useUploadInvoicePaymentProof(
  detailId: string,
  invoiceNumber?: string,
) {
  const queryClient = useQueryClient();

  const uploadProofMutation = useMutation({
    mutationFn: (file: File) => {
      if (!invoiceNumber) {
        throw new Error("Invoice not loaded yet.");
      }
      return invoicesService.uploadPaymentProof(invoiceNumber, file);
    },
    onSuccess: () => {
      toast.success("Proof of payment uploaded — the treasurer will review it");
      queryClient.invalidateQueries({ queryKey: invoicesKeys.detail(detailId) });
      queryClient.invalidateQueries({ queryKey: invoicesKeys.hub() });
      if (invoiceNumber) {
        queryClient.invalidateQueries({ queryKey: invoicesKeys.va(invoiceNumber) });
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Could not upload proof of payment");
    },
  });

  return {
    uploadProof: uploadProofMutation.mutate,
    uploadProofAsync: uploadProofMutation.mutateAsync,
    isUploadingProof: uploadProofMutation.isPending,
  };
}

// Hook for invoice payments
export function useInvoicePayment(
  invoiceId: string,
  invoiceNumber?: string,
) {
  const queryClient = useQueryClient();
  // Gateway for newly started payments. GPay by default; override with
  // NEXT_PUBLIC_PAYMENT_PROVIDER=paystack.
  const paymentProvider = getActivePaymentProvider();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  // Record cash/POS payment (field officer only)
  const recordPaymentMutation = useMutation({
    mutationFn: (data: PaymentData) =>
      invoicesService.recordPayment(invoiceId, data),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: invoicesKeys.detail(invoiceId),
      });
      queryClient.invalidateQueries({ queryKey: invoicesKeys.hub() });

      if (response.isFullPayment && response.receipt) {
        toast.success("Receipt generated successfully!");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Payment failed");
    },
  });

  // Initialize online payment â€” Paystack or GPay depending on config, and
  // whichever one actually answered the init call.
  const initializeOnlinePaymentMutation = useMutation({
    mutationFn: () =>
      invoicesService.initializeOnlinePaymentFor(
        invoiceId,
        invoiceNumber,
        paymentProvider,
      ),
    onSuccess: (response) => {
      // `gateway: "gpay"` only ever appears on GPay init responses, so trust the
      // response over the configured default.
      const provider: PaymentProvider = isGpayInitResponse(response)
        ? "gpay"
        : paymentProvider;

      // Stash reference + provider so the page knows which gateway to verify.
      stashPendingPayment(response.reference, provider);

      // GPay hands back a COMPLETE MPGS checkout URL; Paystack returns a base
      // URL that must be extended with "/payment/verify".
      const url = getCheckoutUrl(response, provider);
      if (!url) {
        toast.error("The payment gateway did not return a checkout link.");
        return;
      }

      console.log("Initializing payment via", provider, response.reference);
      window.location.href = url;
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to initialize payment");
    },
  });

  // Field officer sends the Paystack link to the business via SMS + email
  // (currently routed to a fixed test contact server-side, not the real business)
  const sendPaymentLinkMutation = useMutation({
    mutationFn: () => invoicesService.sendPaymentLink(invoiceId),
    onSuccess: (response) => {
      if (response.smsSent) toast.success("SMS sent");
      else toast.error("SMS failed to send");

      if (response.emailSent) toast.success("Email sent");
      else toast.error("Email failed to send");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send payment link");
    },
  });

  // Verify a payment against the gateway that created it â€” call on mount if a
  // reference is pending (e.g. after the redirect back), or manually via a
  // "Refresh status" button.
  const verifyPaymentMutation = useMutation({
    mutationFn: ({
      reference,
      provider,
    }: {
      reference: string;
      provider?: PaymentProvider;
    }) =>
      invoicesService.verifyPaymentByProvider(
        reference,
        provider ?? paymentProvider,
      ),
    onSuccess: (response) => {
      if (response.status === "confirmed") {
        toast.success("Payment confirmed!");
        clearPendingPayment();
      }
      queryClient.invalidateQueries({
        queryKey: invoicesKeys.detail(invoiceId),
      });
      queryClient.invalidateQueries({ queryKey: invoicesKeys.hub() });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to verify payment");
    },
  });

  // DEV ONLY: Simulate payment
  const simulatePaymentMutation = useMutation({
    mutationFn: () => invoicesService.simulatePayment(invoiceId),
    onSuccess: () => {
      toast.success("Payment simulated successfully!");
      queryClient.invalidateQueries({
        queryKey: invoicesKeys.detail(invoiceId),
      });
      queryClient.invalidateQueries({ queryKey: invoicesKeys.hub() });
    },
    onError: (error: any) => {
      toast.error(error.message || "Simulation failed");
    },
  });

  return {
    checkoutUrl,
    recordPayment: recordPaymentMutation.mutate,
    recordPaymentAsync: recordPaymentMutation.mutateAsync,
    isRecordingPayment: recordPaymentMutation.isPending,
    recordPaymentError: recordPaymentMutation.error,

    initializeOnlinePayment: initializeOnlinePaymentMutation.mutate,
    isInitializingPayment: initializeOnlinePaymentMutation.isPending,

    sendPaymentLink: sendPaymentLinkMutation.mutate,
    isSendingPaymentLink: sendPaymentLinkMutation.isPending,

    verifyPayment: verifyPaymentMutation.mutate,
    isVerifyingPayment: verifyPaymentMutation.isPending,

    simulatePayment: simulatePaymentMutation.mutate,
    isSimulatingPayment: simulatePaymentMutation.isPending,
  };
}

/**
 * Authenticated citizen flow for the 15-minute auto-confirming dynamic virtual
 * account, used on the invoice detail page (parity with the public apply
 * widget's "Bank transfer" tab). The webhook is the primary settlement signal;
 * the "Check status" button is the manual fallback (no auto-poll, to stay
 * inside the verify-endpoint rate limit).
 */
// ON HOLD — dynamic 15-min VA hook; backend routes are commented out in gpay.routes.ts.
// export function useInvoiceDynamicPayment(
//   invoiceId: string,
//   invoiceNumber?: string,
// ) {
//   const queryClient = useQueryClient();
//   const [dynamicAccount, setDynamicAccount] =
//     useState<DynamicVirtualAccount | null>(null);
//   const [dynamicAccountError, setDynamicAccountError] = useState<string | null>(
//     null,
//   );
//   const [isCheckingDynamic, setIsCheckingDynamic] = useState(false);
//   const [isCreatingDynamic, setIsCreatingDynamic] = useState(false);
// 
// 
//   const invalidate = () => {
//     queryClient.invalidateQueries({
//       queryKey: invoicesKeys.detail(invoiceId),
//     });
//     queryClient.invalidateQueries({ queryKey: invoicesKeys.hub() });
//   };
// 
//   const pollDynamicStatus = async (
//     reference: string,
//   ): Promise<boolean> => {
//     try {
//       const result = await invoicesService.verifyDynamicPayment(reference);
//       if (result.status === "confirmed") {
//         toast.success("Payment confirmed — refreshing your invoice...");
//         invalidate();
//         return true;
//       }
//       if (result.status === "failed" || result.status === "expired") {
//         setDynamicAccountError(
//           "This transfer account has expired. Please generate a new one.",
//         );
//         toast.error(
//           "No confirmed payment on this account yet. If you already transferred, the bank may still be processing — try again shortly or generate a new account.",
//         );
//         return false;
//       }
      // Still pending — say so explicitly. A silent return makes the button
      // look like it did nothing.
//       toast.info(
//         "Your transfer has not settled yet. Bank transfers can take a few minutes — tap \"I have paid\" again after a while.",
//       );
//       return false;
//     } catch (err: any) {
//       console.error("Dynamic payment poll failed:", err);
//       toast.error(
//         "Could not verify the payment just now. Please check your connection and try again.",
//       );
//     }
//     return false;
//   };
// 
//   const handleCheckDynamicStatus = async () => {
//     if (!dynamicAccount) return;
//     setIsCheckingDynamic(true);
//     await pollDynamicStatus(dynamicAccount.reference);
//     setIsCheckingDynamic(false);
//   };
// 
//   const handleStartDynamicTransfer = async () => {
//     if (!invoiceNumber) {
//       toast.error("Invoice not loaded yet.");
//       return;
//     }
    // If we already minted an account and its 15-min timer lapsed, re-check it
    // BEFORE creating a new one. Money sent into an expired account is NOT lost
    // — the gateway/webhook still settles it against this same reference — so we
    // must confirm it rather than silently abandoning the payer into a new VA.
//     if (dynamicAccount) {
//       setIsCheckingDynamic(true);
//       const alreadyPaid = await pollDynamicStatus(dynamicAccount.reference);
//       setIsCheckingDynamic(false);
//       if (alreadyPaid) return; // confirmed -> invoice refreshed
//       toast.info(
//         "No payment found on the previous account yet. Generating a fresh one — a transfer already made is still reconciled automatically.",
//       );
//     }
//     setDynamicAccountError(null);
//     setIsCreatingDynamic(true);
//     try {
//       const va = await invoicesService.createDynamicInvoicePayment(
//         invoiceNumber,
//       );
//       setDynamicAccount(va);
//       toast.success("Transfer account ready — it expires in 15 minutes.");
//     } catch (err: any) {
//       console.error("Dynamic account creation failed:", err);
//       const msg =
//         err?.message ||
//         "Could not create a transfer account. Please try another method.";
//       setDynamicAccountError(msg);
//       toast.error(msg);
//     } finally {
//       setIsCreatingDynamic(false);
//     }
//   };
// 
//   const resetDynamic = () => {
//     setDynamicAccount(null);
//     setDynamicAccountError(null);
//   };
// 
// 
// 
//   return {
//     dynamicAccount,
//     dynamicAccountError,
//     isCheckingDynamic,
//     isCreatingDynamic,
//     createDynamicInvoice: handleStartDynamicTransfer,
//     verifyDynamicPayment: handleCheckDynamicStatus,
//     resetDynamic,
//   };
// }

