/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Backend Certificate API Contract
 * Matching GET /api/v1/certificates and GET /api/v1/certificates/:id
 */

export interface CertificateIssuedBy {
  id: string;
  name: string;
  role: string;
}

export interface CertificateApplicant {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  nin?: string | null;
}

export interface CertificateCreatedBy {
  id: string;
  name: string;
}

export interface CertificateApplication {
  id: string;
  applicationNumber: string;
  status: string;
  feeAmount: number;
  formData: Record<string, any>;
  createdAt: string;
  applicant?: CertificateApplicant | null;
  createdBy?: CertificateCreatedBy | null;
}

export interface CertificateService {
  id: string;
  code: string;
  name: string;
  category: string;
  revenueHead?: string;
  description?: string;
  certificateType?: string;
  estimatedDays?: number;
}

export interface CertificateInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  paymentStatus: string;
  paidAt?: string | null;
}

export interface BackendCertificate {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  qrToken: string;
  issuedAt: string;
  expiresAt: string | null;
  pdfUrl: string | null;
  issuedBy?: CertificateIssuedBy | null;
  application: CertificateApplication;
  service: CertificateService;
  invoice?: CertificateInvoice | null;
}
