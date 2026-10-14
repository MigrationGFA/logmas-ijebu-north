/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  GetInvoicesParams,
  invoicesService,
  PaymentData,
  type DynamicVirtualAccount,
  type InvoiceStatus,
} from "@/services/apiInvoice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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
 * a gentle 5s poll keeps the page live while the citizen watches the countdown.
 */
export function useInvoiceDynamicPayment(
  invoiceId: string,
  invoiceNumber?: string,
) {
  const queryClient = useQueryClient();
  const [dynamicAccount, setDynamicAccount] =
    useState<DynamicVirtualAccount | null>(null);
  const [dynamicAccountError, setDynamicAccountError] = useState<string | null>(
    null,
  );
  const [isCheckingDynamic, setIsCheckingDynamic] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopDynamicPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: invoicesKeys.detail(invoiceId),
    });
    queryClient.invalidateQueries({ queryKey: invoicesKeys.hub() });
  };

  const pollDynamicStatus = async (
    reference: string,
  ): Promise<boolean> => {
    try {
      const result = await invoicesService.verifyDynamicPayment(reference);
      if (result.status === "confirmed") {
        stopDynamicPoll();
        toast.success("Payment confirmed — refreshing your invoice...");
        invalidate();
        return true;
      }
      if (result.status === "failed" || result.status === "expired") {
        stopDynamicPoll();
        setDynamicAccountError(
          "This transfer account has expired. Please generate a new one.",
        );
        return false;
      }
    } catch (err: any) {
      console.error("Dynamic payment poll failed:", err);
    }
    return false;
  };

  const handleCheckDynamicStatus = async () => {
    if (!dynamicAccount) return;
    setIsCheckingDynamic(true);
    await pollDynamicStatus(dynamicAccount.reference);
    setIsCheckingDynamic(false);
  };

  const handleStartDynamicTransfer = async () => {
    if (!invoiceNumber) {
      toast.error("Invoice not loaded yet.");
      return;
    }
    setDynamicAccountError(null);
    stopDynamicPoll();
    try {
      const va = await invoicesService.createDynamicInvoicePayment(
        invoiceNumber,
      );
      setDynamicAccount(va);
      toast.success("Transfer account ready — it expires in 15 minutes.");
      stopDynamicPoll();
      pollRef.current = setInterval(() => {
        void pollDynamicStatus(va.reference);
      }, 5000);
    } catch (err: any) {
      console.error("Dynamic account creation failed:", err);
      const msg =
        err?.message ||
        "Could not create a transfer account. Please try another method.";
      setDynamicAccountError(msg);
      toast.error(msg);
    }
  };

  const resetDynamic = () => {
    stopDynamicPoll();
    setDynamicAccount(null);
    setDynamicAccountError(null);
  };

  useEffect(() => {
    return () => stopDynamicPoll();
  }, []);

  return {
    dynamicAccount,
    dynamicAccountError,
    isCheckingDynamic,
    createDynamicInvoice: handleStartDynamicTransfer,
    verifyDynamicPayment: handleCheckDynamicStatus,
    resetDynamic,
  };
}

