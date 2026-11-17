/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "@/lib/api";
import { apiCertificates } from "./apiCertificates";
import { apiPublicCertificate } from "./apiPublicCertificate";
import { BackendCertificate, CertificateApplicant } from "@/types/certificate";
import { PublicCertificate } from "@/types/publicCertificate";
import { LGA_CONFIG } from "@/config/lga.config";

export interface VerificationResultData {
  valid: boolean;
  type: "SOO" | "PERMIT" | "LEVY" | "DOCUMENT";
  title: string;
  status: string;
  isExpired: boolean;
  idNumber: string;
  holder: string;
  issuedAt: string;
  expiresAt: string | null;
  amount: number;
  metadata: {
    gender?: string;
    ward?: string;
    purpose?: string;
    ownerName?: string;
    businessAddress?: string;
    categoryName?: string;
    wardName?: string;
    [key: string]: any;
  };
  certificateNumber?: string;
  publicToken?: string;
  pdfUrl?: string | null;
}

export interface VerificationResponse {
  valid: boolean;
  data?: VerificationResultData;
  error?: string;
}

/**
 * Derives the UI category type ("SOO" | "PERMIT" | "LEVY" | "DOCUMENT")
 */
function deriveDocType(serviceCode?: string, serviceName?: string, category?: string): "SOO" | "PERMIT" | "LEVY" | "DOCUMENT" {
  const combined = `${serviceCode || ""} ${serviceName || ""} ${category || ""}`.toUpperCase();

  if (combined.includes("ORIGIN") || combined.includes("SOO") || combined.includes("INDIGENE") || combined.includes("COO")) {
    return "SOO";
  }
  if (combined.includes("LEVY") || combined.includes("HAULAGE") || combined.includes("REVENUE") || combined.includes("TAX")) {
    return "LEVY";
  }
  if (
    combined.includes("PERMIT") ||
    combined.includes("TRADE") ||
    combined.includes("BUSINESS") ||
    combined.includes("CLUB") ||
    combined.includes("ASSOCIATION") ||
    combined.includes("LIQUOR") ||
    combined.includes("COMMERCIAL")
  ) {
    return "PERMIT";
  }
  return "DOCUMENT";
}

/**
 * Transforms BackendCertificate into VerificationResultData
 */
function transformBackendCertToVerify(cert: BackendCertificate, inputQuery: string): VerificationResultData {
  const service = cert.service || ({} as any);
  const app = cert.application || ({} as any);
  const formData = app.formData || {};
  const applicant: Partial<CertificateApplicant> = app.applicant ?? {};

  const type = deriveDocType(service.code, service.name, service.category);
  const holder =
    applicant.name ||
    formData.fullName ||
    formData.businessName ||
    formData.organizationName ||
    formData.applicantName ||
    "Registered Citizen / Business";

  const isExpired = cert.expiresAt ? new Date(cert.expiresAt).getTime() < Date.now() : false;
  const status =
    isExpired
      ? "Expired"
      : app.status === "Approved" || app.status === "Completed"
      ? "Valid & Active Official Document"
      : app.status || "Valid & Active";

  return {
    valid: true,
    type,
    title: service.name || `Statutory ${LGA_CONFIG.identity.fullName} Document`,
    status,
    isExpired,
    idNumber: cert.certificateNumber || cert.verificationCode || cert.id,
    holder,
    issuedAt: cert.issuedAt || app.createdAt || new Date().toISOString(),
    expiresAt: cert.expiresAt || null,
    amount: cert.invoice?.amount || app.feeAmount || 0,
    metadata: {
      gender: formData.gender || formData.sex || "N/A",
      ward: formData.ward || formData.wardName || `${LGA_CONFIG.identity.name} Ward`,
      purpose: formData.purpose || formData.reasonForApplication || "Official State Verification",
      ownerName: formData.ownerName || formData.proprietor || holder,
      businessAddress: formData.businessAddress || formData.address || `${LGA_CONFIG.identity.name} LGA, ${LGA_CONFIG.identity.state}`,
      categoryName: service.name || "Statutory LGA Service",
      wardName: formData.ward || formData.wardName || `${LGA_CONFIG.identity.name} Ward`,
      stateOfOrigin: formData.stateOfOrigin || LGA_CONFIG.identity.state,
      lga: LGA_CONFIG.identity.fullName,
      nin: applicant.nin || formData.nin || "Verified",
      cacNumber: formData.cacNumber || "N/A",
    },
    certificateNumber: cert.certificateNumber,
    publicToken: cert.certificateNumber || cert.qrToken || cert.id || inputQuery,
    pdfUrl: cert.pdfUrl || null,
  };
}

/**
 * Transforms PublicCertificate into VerificationResultData
 */
function transformPublicCertToVerify(cert: PublicCertificate, inputQuery: string): VerificationResultData {
  const service = cert.service || ({} as any);
  const applicant = cert.applicant || ({} as any);
  const certData = cert.certificateData || {};

  const type = deriveDocType(service.code, service.name, service.category);
  const holder =
    applicant.name ||
    certData.fullName ||
    certData.clubName ||
    certData.businessName ||
    "Registered Citizen / Business";

  const isExpired =
    cert.expiryDate
      ? new Date(cert.expiryDate).getTime() < Date.now()
      : cert.validUntil && cert.validUntil.toLowerCase() !== "perpetual" && cert.validUntil.toLowerCase() !== "lifetime"
      ? new Date(cert.validUntil).getTime() < Date.now()
      : false;

  const status =
    cert.status === "valid"
      ? "Valid & Active Official Document"
      : cert.statusMessage || cert.status || "Valid & Active";

  return {
    valid: true,
    type,
    title: service.name || `Statutory ${LGA_CONFIG.identity.fullName} Document`,
    status,
    isExpired,
    idNumber: cert.certificateNumber || cert.verification?.verificationCode || cert.publicToken,
    holder,
    issuedAt: cert.issuedAt,
    expiresAt: cert.expiryDate || (cert.validUntil === "Perpetual" ? null : cert.validUntil),
    amount: cert.invoice?.amount || cert.application?.feeAmount || 0,
    metadata: {
      gender: applicant.gender || certData.gender || "N/A",
      ward: applicant.ward || certData.ward || `${LGA_CONFIG.identity.name} Ward`,
      purpose: certData.purpose || "Official State Verification",
      ownerName: certData.ownerName || certData.presidentName || holder,
      businessAddress: applicant.address || certData.clubAddress || certData.businessAddress || `${LGA_CONFIG.identity.name} LGA, ${LGA_CONFIG.identity.state}`,
      categoryName: service.name || "Statutory LGA Service",
      wardName: applicant.ward || certData.ward || `${LGA_CONFIG.identity.name} Ward`,
      stateOfOrigin: certData.stateOfOrigin || LGA_CONFIG.identity.state,
      lga: LGA_CONFIG.identity.fullName,
      nin: applicant.nin || "Verified",
    },
    certificateNumber: cert.certificateNumber,
    publicToken: cert.certificateNumber || cert.publicToken || inputQuery,
    pdfUrl: cert.pdfUrl || null,
  };
}

/**
 * Primary document verification service:
 * Resolves by certificateNumber, verificationCode, applicationNo, or UUID token.
 */
export const apiVerification = {
  verifyDocument: async (input: string): Promise<VerificationResponse> => {
    if (!input || !input.trim()) {
      return { valid: false, error: "Please enter a certificate number or verification code" };
    }

    const clean = input.trim();

    // 1. Check official backend certificate endpoint: GET /api/v1/certificates/:id
    try {
      const cert = await apiCertificates.getCertificateById(clean);
      if (cert && (cert.id || cert.certificateNumber)) {
        return {
          valid: true,
          data: transformBackendCertToVerify(cert, clean),
        };
      }
    } catch {
      // Backend lookup failed or not found, try other endpoints
    }

    // 2. Check dedicated verification endpoints if available
    const verificationEndpoints = [
      `/state-of-origin/verify/${encodeURIComponent(clean)}`,
      `/permits/verify/${encodeURIComponent(clean)}`,
      `/business/permits/verify/${encodeURIComponent(clean)}`,
    ];

    for (const endpoint of verificationEndpoints) {
      try {
        const res: any = await api.get(endpoint);
        if (res) {
          const raw = res.data || res;
          if (raw.valid === true || raw.idNumber || raw.certificateNumber || raw.holder) {
            return {
              valid: true,
              data: {
                valid: true,
                type: raw.type || deriveDocType(raw.code, raw.title, raw.category),
                title: raw.title || "Official Verified Document",
                status: raw.status || "Valid & Active",
                isExpired: raw.isExpired || false,
                idNumber: raw.idNumber || raw.certificateNumber || clean,
                holder: raw.holder || raw.name || "Verified Citizen/Business",
                issuedAt: raw.issuedAt || new Date().toISOString(),
                expiresAt: raw.expiresAt || null,
                amount: raw.amount || 0,
                metadata: raw.metadata || {},
                certificateNumber: raw.certificateNumber || raw.idNumber,
                publicToken: clean,
              },
            };
          }
        }
      } catch {
        // Continue to next endpoint
      }
    }

    // 3. Query public certificate registry endpoint
    try {
      const publicCert = await apiPublicCertificate.getPublicCertificate(clean);
      if (publicCert && publicCert.certificateNumber) {
        return {
          valid: true,
          data: transformPublicCertToVerify(publicCert, clean),
        };
      }
    } catch {
      // Public certificate lookup not found
    }

    return {
      valid: false,
      error: `No official record matches "${clean}". Check the number and try again.`,
    };
  },
};
