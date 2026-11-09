/**
 * Payment provider routing for the two supported gateways.
 *
 *   - "paystack" : legacy routes  -> POST /invoices/:id/pay-online,
 *                                     POST /invoices/public/initialize,
 *                                     GET  /payments/verify/:reference
 *   - "gpay"     : Mastercard MPGS -> POST /payments/gpay/initialize/:invoiceNumber,
 *                                     POST /payments/gpay/public/initialize,
 *                                     GET  /payments/gpay/verify/:reference
 *
 * GPay returns a COMPLETE checkout URL, while Paystack returns a base URL that the
 * caller has to extend with "/payment/verify". That difference is handled by
 * `getCheckoutUrl`, which every redirect must go through.
 *
 * The provider cannot be derived from a reference, so it is written to
 * sessionStorage next to the reference at init time and read back after the
 * gateway redirect (see `stashPendingPayment` / `readPendingPayment`).
 */

export type PaymentProvider = "paystack" | "gpay";

export const PAYMENT_REFERENCE_KEY = "pendingPaymentReference";
export const PAYMENT_PROVIDER_KEY = "pendingPaymentProvider";

/**
 * Gateway used by the "apply & pay" and "pay invoice" entry points.
 * Override per environment with NEXT_PUBLIC_PAYMENT_PROVIDER=paystack|gpay.
 */
export const DEFAULT_PAYMENT_PROVIDER: PaymentProvider = "gpay";

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  paystack: "Debit Card / Online Payment",
  gpay: "Debit Card / Online Payment",
};

export function getActivePaymentProvider(): PaymentProvider {
  const configured = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER;
  if (configured === "paystack" || configured === "gpay") return configured;
  return DEFAULT_PAYMENT_PROVIDER;
}

/**
 * Both gateways mint a `PAY-...` reference, so only the init response can tell
 * them apart: the GPay controller returns `gateway: "gpay"`, the Paystack
 * controller returns no `gateway` field at all.
 */
export function isGpayInitResponse(response?: {
  gateway?: string | null;
}): boolean {
  return response?.gateway?.toLowerCase() === "gpay";
}

/**
 * Best-effort provider for a reference when sessionStorage has no entry for it
 * (payer returned in a different tab/session, or storage was cleared).
 * Falls back to Paystack so pre-GPay sessions keep working.
 */
export function isGpayReference(reference?: string | null): boolean {
  return !!reference && reference.trim().toUpperCase().startsWith("PAY-");
}

export function resolvePaymentProvider(
  reference?: string | null,
  storedProvider?: string | null,
): PaymentProvider {
  if (storedProvider === "gpay" || storedProvider === "paystack") {
    return storedProvider;
  }
  return isGpayReference(reference) ? "gpay" : "paystack";
}

/** Persist the reference + provider so we know which gateway to verify against. */
export function stashPendingPayment(
  reference: string,
  provider: PaymentProvider,
) {
  if (typeof window === "undefined" || !reference) return;
  try {
    sessionStorage.setItem(PAYMENT_REFERENCE_KEY, reference);
    sessionStorage.setItem(PAYMENT_PROVIDER_KEY, provider);
    // localStorage is a legacy mirror kept for older sessions.
    localStorage.setItem(PAYMENT_REFERENCE_KEY, reference);
  } catch {
    // Ignore quota / private-mode failures: verification can still fall back to
    // the query string and reference heuristics.
  }
}

export function clearPendingPayment() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PAYMENT_REFERENCE_KEY);
    sessionStorage.removeItem(PAYMENT_PROVIDER_KEY);
    localStorage.removeItem(PAYMENT_REFERENCE_KEY);
  } catch {
    // Ignore.
  }
}

/** Read the pending payment, resolving the provider for the caller. */
export function readPendingPayment(): {
  reference: string;
  provider: PaymentProvider;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const reference = sessionStorage.getItem(PAYMENT_REFERENCE_KEY);
    if (!reference) return null;
    const storedProvider = sessionStorage.getItem(PAYMENT_PROVIDER_KEY);
    return { reference, provider: resolvePaymentProvider(reference, storedProvider) };
  } catch {
    return null;
  }
}

/**
 * Paystack expects `<baseUrl>/payment/verify`; GPay hands back a full MPGS
 * checkout link that must be navigated to verbatim.
 */
export function getCheckoutUrl(
  response: { paymentUrl?: string | null; gateway?: string | null },
  provider: PaymentProvider,
): string {
  const baseUrl = response?.paymentUrl ?? "";
  if (!baseUrl) return "";
  return provider === "gpay" ? baseUrl : `${baseUrl}/payment/verify`;
}
