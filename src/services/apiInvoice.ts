import { api } from "../lib/api";
import { ApiResponse } from "./apiAuth";
import type { PaymentProvider } from "@/config/paymentGateway";

// Types based on your controller
export type InvoiceStatus = "sent" | "paid" | "partially_paid" | "overdue" | "cancelled" | "pending";
export type PaymentMethod = "cash" | "pos" | "bank_transfer" | "online" | "virtual_account";

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  reference: string;
  confirmedAt: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  verificationCode: string;
  qrToken: string;
  issuedAt: string;
}

export interface Permit {
  id: string;
  permitNumber: string;
  status: string;
}

export interface VirtualAccount {
  accountNumber: string;
  bankName: string;
  accountName: string;
  reference: string;
  /** Quoted transfer amount in naira. Route A sends this as `expectedAmount`; route B also sends `amount`. */
  expectedAmount: number;
  amount?: number;
  invoiceNumber?: string | null;
}

export interface ServiceVirtualAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
  expectedAmount: number;
}

export interface InvoiceVirtualAccount extends ServiceVirtualAccount {
  amount: number;
  invoiceNumber: string;
}

export interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;



  issuedAt: string;
  dueDate: string;
  paidAt: string | null;
  invoiceType: string;

  // Amounts
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  subtotal: number;
  penaltyAmount: number;

  // Customer
  customerName: string;
  customerPhone: string | null;

  // Levy details
  levyType: string;
  description: string;
  frequency: string;
  unitPrice: number;
  quantity: number;

  // Officer
  fieldOfficer: string | null;

  // QR
  qrData: string;

  // Receipt (null until paid)
  receipt: Receipt | null;

  // Permit (null if not a permit invoice)
  permit: Permit | null;

  // Virtual account
  virtualAccount: VirtualAccount | null;

  // Payment history
  payments: Payment[];

  // Payment options available
  paymentOptions: string[];
}

export interface InvoiceStats {
  outstanding: number;
  totalCollected: number;
  transactions: number;
  avgPayment: number;
}

export interface InvoiceList {
  id: string;
  reference: string;
  customerName: string | null;
  levyType?: string | null;
  invoiceType?: string;
  dueDate?: string;
  amount: number;
  status?: InvoiceStatus;
  paymentStatus: string;
  paidAt?: string | null;
  createdAt?: string | null;
  dateOfApplication?: string | null;
  application?: {
    id: string;
    applicationNumber: string;
    applicantId: string;
  } | null;
  service?: {
    id: string;
    code: string;
    name: string;
    category: string;
  } | null;
  receipts?: { id: string; receiptNumber: string }[];
  receiptId?: string | null;
}

export interface InvoicesHubResponse {
  success: boolean;
  stats: InvoiceStats;
  invoices: InvoiceList[];
}

export interface GetInvoicesParams {
  tab?: string;
  search?: string;
}

export interface PaymentData {
  method: PaymentMethod;
  amount?: number;
  reference?: string;
  narration?: string;
}

export interface PaymentResponse {
  payment: Payment;
  invoice: InvoiceDetails;
  receipt: Receipt | null;
  isFullPayment: boolean;
  message: string;
}

export interface SimulatePaymentResponse {
  payment: Payment;
  invoice: InvoiceDetails;
  receipt: Receipt;
}

// Matches paystack.controller.ts's initializePaystackPayment response exactly  - 
// no more "stub" field, this is the real thing now.
export interface OnlinePaymentInitResponse {
  paymentUrl: string;
  reference: string;
  message: string;
  // authorizationUrl: string;

  // ── GPay additions (POST /payments/gpay/initialize/:invoiceNumber) ──
  // `gateway` is only ever set by the GPay controller, so its absence means Paystack.
  gateway?: string;
  amount?: number;
  invoiceNumber?: string;
  flow?: string;
  isFullPayment?: boolean;
}

export interface PublicPaymentInitRequest {
  serviceId: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface PublicPaymentInitResponse {
  paymentUrl: string;
  reference: string;
  accessCode?: string;
  message?: string;

  // ── GPay additions (POST /payments/gpay/public/initialize) ──
  gateway?: string;
  amount?: number;
  invoiceNumber?: string;
  serviceId?: string;
  flow?: string;
}

// Matches sendPaymentLinkToBusiness's response
export interface SendPaymentLinkResponse {
  reference: string;
  checkoutLink: string;
  smsSent: boolean;
  emailSent: boolean;
}

export interface VerifyPaymentResponse {
  status: "confirmed" | "success" | "failed" | "abandoned" | string;
  payment?: Payment;
  invoice?: InvoiceDetails;
  receipt?: Receipt | null;
  message?: string;
  application?: any;
  user?: any;
  data?: any;

  // ── Shared by both gateways ──
  reference?: string;
  /** "new_application" | "invoice_online" */
  flow?: "new_application" | "invoice_online" | string;
  isFullPayment?: boolean;
  /** Idempotency flag: the settlement had already been recorded earlier. */
  alreadyProcessed?: boolean;
  alreadyConfirmed?: boolean;

  // ── GPay only: returned when the intent was already settled before ──
  /** Raw gateway status, e.g. "APPROVED", "REVERSED". */
  rawStatus?: string;
  /** Raw MPGS payload, kept for debugging. */
  mpgsResult?: unknown;
}

// Service functions
/**
 * A one-shot Providus dynamic virtual account minted for exactly this payment.
 * Expires after ~15 minutes (GPay) and settles automatically via webhook or the
 * public verify poll — no treasurer step. Every field comes from the backend;
 * the browser never holds a merchant key.
 */
export interface DynamicVirtualAccount {
  gateway: "gpay";
  channel: "dynamic_va";
  reference: string;
  amount: number;
  accountNumber: string;
  accountName: string;
  bankName: string;
  qrCode: string | null;
  ussd: Record<string, string> | null;
  /** ISO-8601 expiry (15 minutes from creation). */
  expiresAt: string;
  /** Convenience countdown seed; recompute from expiresAt client-side. */
  expiresInSeconds: number;
  invoiceNumber?: string;
  serviceId?: string;
  flow?: "new_application" | "invoice_online" | string;
  message?: string;
}

/** Poll result for GET /payments/gpay/dynamic-account/verify/:reference. */
export interface DynamicPaymentVerifyResult {
  status: "pending" | "expired" | "confirmed" | "failed" | string;
  reference?: string;
  rawStatus?: string;
  expiresAt?: string | null;
  alreadyConfirmed?: boolean;
  flow?: string;
  /** Present on confirmation — same completion payload as checkout verify. */
  invoice?: any;
  receipt?: any;
  application?: any;
}

export const invoicesService = {
  // Get unified invoices hub data (stats + ledger)
  getInvoicesHub: async (params?: GetInvoicesParams): Promise<InvoicesHubResponse> => {
    let statusParam: string | undefined;
    if (params?.tab && params.tab !== "all") {
      if (params.tab === "unpaid") {
        statusParam = "sent";
      } else {
        statusParam = params.tab;
      }
    }

    try {
      return await api.get<InvoicesHubResponse>("/invoices/hub", {
        params: {
          tab: statusParam,
          search: params?.search,
        },
      });
    } catch {
      throw new Error("Unable to fetch invoice hub data from backend");
    }
  },

  // Get single invoice by ID with full details
  getInvoiceById: async (id: string): Promise<InvoiceDetails> => {
      return await api.get<InvoiceDetails>(`/invoices/${id}`);
  },

  // Record payment (cash/POS - field officer only)
  recordPayment: async (id: string, data: PaymentData): Promise<PaymentResponse> => {
   
      return await api.post<PaymentResponse>(`/invoices/${id}/pay`, data);

  },


  /**
   * PUBLIC bank-transfer account for a service (no invoice yet).
   * GET /payments/gpay/virtual-account?serviceId=<service UUID>. Send the
   * `skip-auth` header so the interceptor strips auth. `api` auto-unwraps the
   * envelope, so fields are read directly. 404 VIRTUAL_ACCOUNT_UNAVAILABLE
   * means "unmapped service / inactive / upstream failure" — render the
   * online-only fallback, it is not a crash.
   */
  getVirtualAccountForService: async (
    serviceId: string,
  ): Promise<ServiceVirtualAccount> => {
    return await api.get<ServiceVirtualAccount>(
      `/payments/gpay/virtual-account?serviceId=${encodeURIComponent(serviceId)}`,
      {
        headers: {
          "skip-auth": "true",
        },
      },
    );
  },

  /**
   * Authenticated bank-transfer account for an existing invoice.
   * GET /invoices/:invoiceNumber/virtual-account (canonical mount).
   * Paid/non-pending invoices return 400 BAD_REQUEST.
   */
  getInvoiceVirtualAccount: async (
    invoiceNumber: string,
  ): Promise<InvoiceVirtualAccount> => {
    return await api.get<InvoiceVirtualAccount>(
      `/invoices/${encodeURIComponent(invoiceNumber)}/virtual-account`,
    );
  },

  /**
   * PUBLIC dynamic (15-min, auto-confirm) transfer account for the "apply + pay
   * first" flow. POST /payments/gpay/dynamic-account/public with `skip-auth`.
   * Unlike the reserved account, this settles automatically (webhook / verify
   * poll) — no treasurer confirmation needed.
   */
  createDynamicPublicPayment: async (data: {
    serviceId: string;
    fullName: string;
    email: string;
    phone: string;
  }): Promise<DynamicVirtualAccount> => {
    return await api.post<DynamicVirtualAccount>(
      "/payments/gpay/dynamic-account/public",
      data,
      {
        headers: {
          "skip-auth": "true",
        },
      },
    );
  },

  /**
   * Authenticated dynamic (15-min, auto-confirm) transfer account for an
   * existing invoice. POST /payments/gpay/dynamic-account/invoices/:invoiceNumber
   * (invoice NUMBER, not id).
   */
  createDynamicInvoicePayment: async (
    invoiceNumber: string,
  ): Promise<DynamicVirtualAccount> => {
    return await api.post<DynamicVirtualAccount>(
      `/payments/gpay/dynamic-account/invoices/${encodeURIComponent(invoiceNumber)}`,
      {},
    );
  },

  /**
   * PUBLIC poll for a minted dynamic account.
   * GET /payments/gpay/dynamic-account/verify/:reference. Drives the 15-min
   * countdown UI; the webhook is the primary settlement signal, this is the
   * fallback so the citizen's page updates without a push.
   */
  verifyDynamicPayment: async (
    reference: string,
  ): Promise<DynamicPaymentVerifyResult> => {
    return await api.get<DynamicPaymentVerifyResult>(
      `/payments/gpay/dynamic-account/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          "skip-auth": "true",
        },
      },
    );
  },

  
  // Public payment initialization for citizen apply flow (Paystack)
  initializePublicPayment: async (
    data: PublicPaymentInitRequest
  ): Promise<PublicPaymentInitResponse> => {
    return await api.post<PublicPaymentInitResponse>(
      "/invoices/public/initialize",
      data,
      {
        headers: {
          "skip-auth": "true",
        },
      }
    );
  },

  /**
   * GPay invoice payment. NOTE: the route takes the invoice NUMBER, not the id —
   * POST /payments/gpay/initialize/:invoiceNumber
   */
  initializeOnlinePaymentGpay: async (
    invoiceNumber: string
  ): Promise<OnlinePaymentInitResponse> => {
    return await api.post<OnlinePaymentInitResponse>(
      `/payments/gpay/initialize/${encodeURIComponent(invoiceNumber)}`,
      {},
    );
  },

  /** Authenticated invoice payment on the configured gateway. */
  initializeOnlinePaymentFor: async (
    id: string,
    invoiceNumber: string | undefined,
    provider: PaymentProvider
  ): Promise<OnlinePaymentInitResponse> => {
    if (provider === "gpay") {
      if (!invoiceNumber) {
        throw new Error("Cannot start a GPay payment without an invoice number.");
      }
      return await invoicesService.initializeOnlinePaymentGpay(invoiceNumber);
    }
    return await invoicesService.initializeOnlinePayment(id);
  },

  /** GPay (Mastercard MPGS) verification — GET /payments/gpay/verify/:reference */
  verifyGpayPayment: async (
    reference: string
  ): Promise<VerifyPaymentResponse> => {
    return await api.get<VerifyPaymentResponse>(
      `/payments/gpay/verify/${encodeURIComponent(reference)}`,
    );
  },

  /**
   * Verify a payment against the gateway that created it. Both gateways mint a
   * "PAY-..." reference, so the provider must be known — see
   * `resolvePaymentProvider` in @/config/paymentGateway.
   */
  verifyPaymentByProvider: async (
    reference: string,
    provider: PaymentProvider
  ): Promise<VerifyPaymentResponse> => {
    return provider === "gpay"
      ? await invoicesService.verifyGpayPayment(reference)
      : await invoicesService.verifyPayment(reference);
  },


  // Public payment initialization for citizen apply flow (GPay / Mastercard MPGS)
  initializePublicPaymentGpay: async (
    data: PublicPaymentInitRequest
  ): Promise<PublicPaymentInitResponse> => {
    return await api.post<PublicPaymentInitResponse>(
      "/payments/gpay/public/initialize",
      data,
      {
        headers: {
          "skip-auth": "true",
        },
      }
    );
  },

  /** Public "apply & pay" initialization on the configured gateway. */
  initializePublicPaymentFor: async (
    data: PublicPaymentInitRequest,
    provider: PaymentProvider
  ): Promise<PublicPaymentInitResponse> => {
    return provider === "gpay"
      ? await invoicesService.initializePublicPaymentGpay(data)
      : await invoicesService.initializePublicPayment(data);
  },


  initializeOnlinePayment: async (id: string): Promise<OnlinePaymentInitResponse> => {
  return await api.post<OnlinePaymentInitResponse>(`/invoices/${id}/pay-online`, {});
},

verifyPayment: async (reference: string): Promise<VerifyPaymentResponse> => {
  return await api.get<VerifyPaymentResponse>(`/payments/verify/${reference}`);
},

   // Field officer sends Paystack link via SMS + email
  sendPaymentLink: async (id: string): Promise<SendPaymentLinkResponse> => {
    return await api.post<SendPaymentLinkResponse>(`/invoices/${id}/send-payment-link`, {});
  },


  // DEV ONLY: Simulate payment
  simulatePayment: async (id: string): Promise<SimulatePaymentResponse> => {

      return await api.post<SimulatePaymentResponse>(`/invoices/${id}/simulate-payment`, {});
   
  },
};
