/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "@/lib/api";
import {
  Application,
  CreateApplicationData,
  ApplicationsQueryParams,
  ApplicantSearchResult,
} from "@/types/application";
import {
  getLgaApplications,
} from "@/lib/lgaApplications";
import {
  getLgaServiceById,
} from "@/config/lgaServices";
import { LGA_CONFIG } from "@/config/lga.config";

// Helper to normalize an application from backend or local storage
function normalizeApplication(raw: any): any {
  if (!raw) return raw;
  const service = getLgaServiceById(raw.serviceId || "");
  const serviceName =
    raw.serviceName || service?.name || `${LGA_CONFIG.identity.formalTitle} Statutory Service`;
  const category = raw.category || service?.category || "Services";
  const rawStatus = raw.status || "submitted";

  // Normalize status text
  let status = rawStatus;
  const lower = String(rawStatus).toLowerCase();
  if (lower === "submitted") status = "Submitted";
  else if (lower === "under_review" || lower === "under review")
    status = "Under Review";
  else if (lower === "approved") status = "Approved";
  else if (lower === "declined" || lower === "rejected") status = "Declined";
  else if (lower === "cancelled") status = "Cancelled";
  else if (lower === "completed") status = "Completed";

  // Prefer service-specific formData values for applicant/contact snapshot
  const detailsObj = raw.formData || raw.details || {};
  const applicantName =
    detailsObj.fullName ||
    raw.applicant?.name ||
    (raw.applicant?.firstName
      ? `${raw.applicant.firstName} ${raw.applicant.lastName || ""}`.trim()
      : undefined) ||
    raw.details?.applicantName ||
    raw.details?.fullName ||
    undefined;

  // Normalize documents
  const docs = Array.isArray(
    raw.applicationDocuments ? raw.applicationDocuments : raw.documents,
  )
    ? (raw.applicationDocuments ? raw.applicationDocuments : raw.documents).map(
        (d: any) => ({
          id: d.id || d._id || d.documentType,
          documentType:
            d.documentType || d.type || d.name?.split("_")[0] || "document",
          name: d.name || d.fileName || d.originalName || "document.pdf",
          url: d.url || d.fileUrl || "/documents/sample.pdf",
          fileSize: d.fileSize || d.size || 250000,
          mimeType:
            d.mimeType ||
            d.contentType ||
            (d.name?.endsWith(".png")
              ? "image/png"
              : d.name?.endsWith(".jpg") || d.name?.endsWith(".jpeg")
                ? "image/jpeg"
                : "application/pdf"),
          status: d.status || "uploaded",
          uploadedAt: d.uploadedAt || d.createdAt || raw.createdAt,
        }),
      )
    : [];

  return {
    id:
      raw.id || raw._id || `ODE-2026-${Math.floor(100 + Math.random() * 900)}`,
    applicationNo:
      raw.applicationNo ||
      raw.appNo ||
      `ODE/${(raw.serviceId || "APP").substring(0, 3).toUpperCase()}/2026/${Math.floor(1000 + Math.random() * 9000)}`,
    serviceId: raw.serviceId || "",
    serviceName,
    category,
    status: status as any,
    fullName: applicantName,
    phone: detailsObj.phone || raw.phone || raw.applicant?.phone || undefined,
    email: detailsObj.email || raw.email || raw.applicant?.email || null,
    address:
      detailsObj.address || detailsObj.siteAddress || raw.address || undefined,
    ward: detailsObj.ward || raw.ward || undefined,
    nin: detailsObj.nin || raw.nin || null,
    cacNumber: detailsObj.cacNumber || raw.cacNumber || null,
    applicantId: raw.applicantId || raw.applicant?.id || null,
    createdById: raw.createdById || raw.createdBy?.id,
    applicant: raw.applicant || null,
    createdBy: raw.createdBy || null,
    formData: detailsObj,
    applicationDocuments: docs,
    declineReason: raw.declineReason || raw.rejectionReason || null,
    rejectionReason: raw.rejectionReason || raw.declineReason || null,
    correctionNotes: raw.correctionNotes || null,
    reviewedByAdminId: raw.reviewedByAdminId || null,
    reviewedByAdminAt: raw.reviewedByAdminAt || null,
    reviewNotes: raw.reviewNotes || null,
    approvedAt:
      raw.approvedAt ||
      (status === "Approved" || status === "Completed" ? raw.updatedAt : null),
    declinedAt:
      raw.declinedAt || (status === "Declined" ? raw.updatedAt : null),
    certificate: raw.certificate || (raw.certificateNumber ? { certificateNumber: raw.certificateNumber } : undefined),
    certificateNumber: raw.certificate?.certificateNumber || raw.certificateNumber || raw.licenceNumber || null,
    licenceNumber: raw.licenceNumber || raw.certificate?.certificateNumber || raw.certificateNumber || null,
    issuedAt: raw.issuedAt || null,
    issuedBy: raw.issuedBy || null,
    expiryDate: raw.expiryDate || null,
    feeAmount: raw.feeAmount || raw.amount || undefined,
    amount: raw.amount || raw.feeAmount || undefined,
    revenueHead:
      raw.revenueHead || service?.revenueHead || "1001 - Statutory LGA Revenue",
    paymentStatus:
      raw.paymentStatus ||
      (raw.status === "Approved" || raw.status === "Completed"
        ? "paid"
        : "unpaid"),
    paidAt: raw.paidAt || null,
    invoiceId: raw.invoiceId || null,
    invoiceNumber: raw.invoiceNumber || raw.invoiceId || null,
    receiptNumber: raw.receiptNumber || null,
    qrToken: raw.qrToken || `QR-ODE-${raw.id || "APP"}`,
    verificationCode:
      raw.verificationCode ||
      `VER-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    timeline: raw.timeline || [],
  };
}

const appendFilesToFormData = (
  formData: FormData,
  files?: Record<string, any>,
) => {
  if (!files) return;

  Object.entries(files).forEach(([reqKey, value]) => {
    if (!value) return;

    // Direct File
    if (value instanceof File) {
      formData.append(reqKey, value, value.name);
      return;
    }

    // Direct Blob
    if (value instanceof Blob) {
      formData.append(reqKey, value, `${reqKey}.pdf`);
      return;
    }

    // Common shape: { file: File }
    if (value.file instanceof File) {
      formData.append(reqKey, value.file, value.file.name);
      return;
    }

    // Common shape: { file: Blob }
    if (value.file instanceof Blob) {
      formData.append(reqKey, value.file, `${reqKey}.pdf`);
      return;
    }

    console.warn(
      `[appendFilesToFormData] Skipping "${reqKey}" because it is not a File/Blob:`,
      value,
    );
  });
};

export const apiApplications = {
  /**
   * Submit an application with multipart/form-data.
   * Document files are attached directly with their machine-readable requirement keys as field names.
   * NOTE: feeAmount is NEVER sent from the frontend per backend contract.
   */
  submitApplication: async (
    payload: CreateApplicationData,
  ): Promise<Application> => {
    const formData = new FormData();

    formData.append("serviceId", payload.serviceId);

    if (payload.applicantId) {
      formData.append("applicantId", String(payload.applicantId));
    }

    formData.append("formData", JSON.stringify(payload.formData || {}));

    appendFilesToFormData(formData, payload.files);

    console.log(
      "SUBMIT FormData files:",
      [...formData.entries()]
        .filter(([key, value]) => value instanceof File)
        .map(([key, value]) => ({
          field: key,
          name: (value as File).name,
          size: (value as File).size,
          type: (value as File).type,
        })),
    );

    return api.upload<Application>("/applications", formData);
  },

  completeApplication: async (
    id: string,
    payload: {
      formData?: Record<string, any>;
      files?: Record<string, any>;
      applicantId?: string;
      serviceId?: string;
    },
  ): Promise<Application> => {
    const formData = new FormData();

    if (payload.applicantId) {
      formData.append("applicantId", String(payload.applicantId));
    }

    if (payload.serviceId) {
      formData.append("serviceId", payload.serviceId);
    }

    if (payload.formData) {
      formData.append("formData", JSON.stringify(payload.formData));
    }

    appendFilesToFormData(formData, payload.files);

    console.log(
      "COMPLETE FormData files:",
      [...formData.entries()]
        .filter(([key, value]) => value instanceof File)
        .map(([key, value]) => ({
          field: key,
          name: (value as File).name,
          size: (value as File).size,
          type: (value as File).type,
        })),
    );

    return api.upload<Application>(`/applications/${id}/complete`, formData, {
      method: "PATCH",
    });
  },

  /**
   * Get applications with query filtering and pagination.
   */
  getApplications: async (
    params?: ApplicationsQueryParams,
  ): Promise<Application[]> => {
    const res = await api.get<any>("/applications", { params });

    if (Array.isArray(res)) {
      return res;
    }

    if (res && Array.isArray(res.data)) {
      return res.data;
    }

    if (res && Array.isArray(res.applications)) {
      return res.applications;
    }

    return [];
  },

  /**
   * Get single application by ID.
   */
  getApplicationById: async (id: string): Promise<Application> => {
    const res = await api.get<any>(`/applications/${id}`);

    if (!res) {
      throw new Error("Application not found");
    }

    return res;
  },
  /**
   * Public lookup used by the "Track My Application" page. Accepts an
   * application number (e.g. "ODE-APP-2026-000101"), a raw UUID, or a payment
   * reference ("PAY-..."). Backends differ in which lookup routes they expose,
   * so this cascades through strategies until one resolves:
   *   1. GET /applications/reference/:reference — skip-auth public track route.
   *   2. GET /applications/:id — the standard single-application route; the
   *      session token is attached when the citizen is signed in.
   *   3. GET /applications?search= — authenticated list search with an exact
   *      applicationNumber/id match preferred over the first hit.
   */
  getApplicationByReference: async (
    reference: string,
  ): Promise<Application> => {
    const ref = (reference || "").trim();
    if (!ref) {
      throw new Error("An application reference is required");
    }

    // 1) Public reference endpoint (auth header deliberately stripped).
    try {
      const res = await api.get<any>(
        `/applications/reference/${encodeURIComponent(ref)}`,
        { headers: { "skip-auth": "true" } },
      );
      if (res) return res;
    } catch {
      // Route missing on this backend build — try the next strategy.
    }

    // 2) Direct fetch by id (or by number where the backend resolves it).
    try {
      const res = await api.get<any>(`/applications/${encodeURIComponent(ref)}`);
      if (res) return res;
    } catch {
      // Fall through to the list search.
    }

    // 3) Authenticated search fallback with exact-match preference.
    const res = await api.get<any>("/applications", {
      params: { search: ref, limit: 25 },
    });
    const list: any[] = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : [];
    const needle = ref.toLowerCase();
    const exact = list.find(
      (a) =>
        a?.id === ref ||
        String(a?.applicationNumber || "").toLowerCase() === needle,
    );
    const match = exact;
    if (!match) {
      throw new Error(`No application found for "${ref}"`);
    }
    return match;
  },

  /**
   * Transition status: Submitted -> Under Review
   */
  moveToUnderReview: async (
    id: string,
    notes?: string,
  ): Promise<Application> => {
    try {
      const res = await api.patch<any>(
        `/applications/admin/${id}/under-review`,
        {
          notes,
        },
      );
      return normalizeApplication(res);
    } catch (error) {
      console.error("Failed to move application to under review:", error);
      throw error;
    }
  },

  /**
   * Transition status: Under Review -> Approved
   */
  approveApplication: async (
    id: string,
    notes?: string,
  ): Promise<Application> => {
    try {
      const res = await api.patch<any>(`/applications/admin/${id}/approve`, {
        notes,
      });
      return normalizeApplication(res);
    } catch {
      const res2 = await api.post<any>(`/applications/admin/${id}/approve`, {
        notes,
      });
      return normalizeApplication(res2);
    }
  },

  /**
   * Transition status: Under Review -> Declined (Reason mandatory!)
   */
  declineApplication: async (
    id: string,
    declineReason: string,
  ): Promise<Application> => {
    if (!declineReason || declineReason.trim().length === 0) {
      throw new Error(
        "A specific decline reason is mandatory to reject this application.",
      );
    }

    try {
      const res = await api.patch<any>(`/applications/admin/${id}/decline`, {
        declineReason,
      });
      return normalizeApplication(res);
    } catch {
      const res2 = await api.post<any>(`/applications/admin/${id}/decline`, {
        declineReason,
      });
      return normalizeApplication(res2);
    }
  },

  /**
   * Search registered applicants by NIN, phone, name, email for Field Officer flow
   */
  searchApplicants: async (query: string): Promise<ApplicantSearchResult[]> => {
    const q = (query || "").trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const results: ApplicantSearchResult[] = [];

    // 1. Try customer/user search API
    try {
      const res = await api.get<any[]>("/customers", { params: { search: q } });
      if (Array.isArray(res)) {
        res.forEach((c) => {
          results.push({
            id: c.id || c._id,
            name:
              c.name ||
              `${c.firstName || ""} ${c.lastName || ""}`.trim() ||
              c.businessName ||
              "Registered Citizen",
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone || "",
            nin: c.nin,
            cacNumber: c.cacNumber,
            address: c.address,
            ward: c.ward?.name || c.ward,
            role: c.role || (c.businessName ? "business_owner" : "citizen"),
            businessName: c.businessName,
          });
        });
      }
    } catch {
      // Continue to next backend-driven source.
    }

    // 2. Query existing backend-sourced application records for past applicants
    const existingApps = getLgaApplications();
    existingApps.forEach((app) => {
      const match =
        app.applicant.toLowerCase().includes(q) ||
        (app.phone && app.phone.toLowerCase().includes(q)) ||
        (app.nin && app.nin.toLowerCase().includes(q)) ||
        (app.email && app.email.toLowerCase().includes(q));

      if (
        match &&
        !results.some(
          (r) => r.phone === app.phone || (app.nin && r.nin === app.nin),
        )
      ) {
        results.push({
          id: app.id,
          name: app.applicant,
          phone: app.phone,
          email: app.email,
          nin: app.nin,
          cacNumber: app.cacNumber,
          address: app.address,
          ward: app.ward,
          role:
            app.category === "Licences & Permits"
              ? "business_owner"
              : "citizen",
        });
      }
    });

    return results;
  },
};
