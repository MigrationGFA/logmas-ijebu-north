export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "declined"
  | "cancelled"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Declined"
  | "Cancelled"
  | "Draft"
  | "Completed";

export interface ApplicationDocument {
  id?: string;
  documentType: string; // Machine-readable requirement key e.g. "passport_photo", "nin_slip"
  name: string; // Original filename e.g. "passport.jpg"
  url: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  status?: "uploaded" | "verified" | "rejected";
}

export interface ApplicationTimelineEvent {
  id: string;
  stage: string;
  title: string;
  description: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  status: "completed" | "current" | "pending";
}

export interface ApplicationApplicantInfo {
  fullName: string;
  phone: string;
  email?: string | null;
  address: string;
  ward?: string | null;
  nin?: string | null;
  cacNumber?: string | null;
}

export interface Services {
  name: string;
  code: string;
  category: string;
  revenueHead: string;
  requirements: string[];
  estimatedDays: number;
}

export interface Application {
  id: string;
  applicationNumber: string;
  serviceId: string;
  serviceName?: string;
  category?: string;
  status: ApplicationStatus;

  service: Services;
  // Foreign keys & Relationships
  applicantId?: string | null; // ID of existing user account or null if unregistered
  createdById?: string; // ID of submitting user (FO, citizen, business owner)
  applicant?: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    address: string;
    ward?: string | null;
    nin:string;
    cacNumber:string
  } | null;
  createdBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;

  // Dynamic form data
  formData: Record<string, any>;
  ward: string | null;
  // Uploaded documents
  applicationDocuments: ApplicationDocument[];

  // Review & Admin Decision Fields
  declineReason?: string | null;
  rejectionReason?: string | null;
  correctionNotes?: string | null;
  reviewedByAdminId?: string | null;
  reviewedByAdminAt?: string | null;
  reviewNotes?: string | null;
  approvedAt?: string | null;
  declinedAt?: string | null;

  invoice: {
    amount: number;
    paymentStatus: "confirmed" | "failed" | "pending";
    invoiceNumber: string;
    virtualBankName: string;

    payments: {
      method:string
    }
  };

  // Output Credentials
  certificate?: {
    id?: string;
    certificateNumber?: string;
    verificationCode?: string;
    qrToken?: string;
    issuedAt?: string;
    issuedBy?: any;
    pdfUrl?: string | null;
  };
  certificateNumber?: string | null;
  licenceNumber?: string | null;
  issuedAt?: string | null;
  issuedBy?: string | null;
  expiryDate?: string | null;

  // Financial / Assessment
  feeAmount?: number;
  amount?: number;
  revenueHead?: string;
  paymentStatus?: "unpaid" | "paid" | "pending";
  paidAt?: string | null;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  receiptNumber?: string | null;
  qrToken?: string;
  verificationCode?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Timeline
  timeline?: ApplicationTimelineEvent[];
}

export interface CreateApplicationData {
  serviceId: string;
  applicantId?: string | null; // Set when FO selects existing registered citizen/business
  formData: Record<string, any>;
  files?: Record<
    string,
    File | { name: string; url?: string; size?: number; type?: string }
  >;
}

export interface ApplicantSearchResult {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  nin?: string;
  cacNumber?: string;
  address?: string;
  ward?: string;
  role: string; // citizen | business_owner | etc.
  businessName?: string;
}

export interface ApplicationsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  serviceId?: string;
  search?: string;
  wardId?: string;
}

export interface ApplicationsPaginatedResponse {
  data: Application[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
