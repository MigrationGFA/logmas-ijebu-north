/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { genInvoiceRef, genReceiptNumber, genQRToken, genVerificationCode, addNotification, addAudit } from "./store";
import { LGA_CONFIG } from "@/config/lga.config";

export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Inspection Required"
  | "Inspection Completed"
  | "Awaiting Assessment"
  | "Assessment Approved"
  | "Invoice Generated"
  | "Awaiting Payment"
  | "Payment Confirmed"
  | "Pending Approval"
  | "Approved"
  | "Certificate Generated"
  | "Completed"
  | "Returned For Correction"
  | "Rejected"
  | "Revoked";

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

export interface InspectionReport {
  scheduledAt?: string;
  inspectedAt?: string;
  inspectorName?: string;
  findings?: string;
  photos?: string[];
  recommendedCategory?: string;
  recommendedFee?: number;
  completed: boolean;
}

export interface TreasuryAssessment {
  assessedAt?: string;
  assessedBy?: string;
  approvedFee?: number;
  revenueHead?: string;
  treasuryNotes?: string;
  status: "pending" | "approved" | "rejected";
}

export interface LgaApplication {
  id: string;
  applicationNo: string;
  serviceId: string;
  serviceName: string;
  category: string;
  applicant: string;
  phone: string;
  email?: string;
  address: string;
  ward: string;
  nin?: string;
  cacNumber?: string;
  revenueHead: string;
  amount: number;
  status: ApplicationStatus;
  paymentStatus: "unpaid" | "paid" | "pending";
  invoiceId?: string;
  invoiceNumber?: string;
  receiptNumber?: string;
  paidAt?: string;
  paymentMethod?: string;
  certificateNumber?: string;
  licenceNumber?: string;
  issuedAt?: string;
  issuedBy?: string;
  expiryDate?: string;
  qrToken: string;
  verificationCode: string;
  createdAt: string;
  updatedAt: string;

  // Form payload
  details: Record<string, any>;
  documents: { name: string; url: string; status: "uploaded" | "verified" }[];

  // Workflow tracking
  inspectionReport?: InspectionReport;
  treasuryAssessment?: TreasuryAssessment;
  correctionNotes?: string;
  rejectionReason?: string;
  councillorNotes?: string;

  // Timeline
  timeline: ApplicationTimelineEvent[];
}

export const APPLICATIONS_STORAGE_KEY = `${LGA_CONFIG.identity.id}_applications`;
export const LEGACY_APPLICATIONS_STORAGE_KEY = "legacy_applications";
export const APPLICATIONS_EVENT_KEY = `${LGA_CONFIG.identity.id}:applications-change`;
export const LEGACY_APPLICATIONS_EVENT_KEY = "lga:applications-change";

const STORAGE_KEY = APPLICATIONS_STORAGE_KEY;
const EVT_KEY = APPLICATIONS_EVENT_KEY;

const INITIAL_SEED_APPLICATIONS: LgaApplication[] = [
  {
    id: "ODE-2026-001",
    applicationNo: "ODE/COO/2026/0001",
    serviceId: "certificate_of_origin",
    serviceName: "State of Origin",
    category: "Certificates",
    applicant: "Adebayo Citizen",
    phone: "08077778888",
    email: "evans@joemarineng.com",
    address: `12 Camp Road, Obantoko, ${LGA_CONFIG.identity.formalTitle}`,
    ward: "Ward 7 (Itesi / Camp)",
    nin: "99990000111",
    revenueHead: "1001 - Certificate Fees",
    amount: 3500,
    status: "Completed",
    paymentStatus: "paid",
    invoiceNumber: "ODE/INV/2026/000101",
    receiptNumber: "ODE/RCP/2026/000101",
    paidAt: "2026-08-01T10:00:00Z",
    paymentMethod: "card",
    certificateNumber: "ODE/COO/2026/000001",
    issuedAt: "2026-08-02T11:00:00Z",
    issuedBy: `${LGA_CONFIG.leadership.chairman.name} (${LGA_CONFIG.leadership.chairman.title})`,
    qrToken: "QR-ODE-COO-000001",
    verificationCode: "VER-COO-001",
    createdAt: "2026-08-01T09:00:00Z",
    updatedAt: "2026-08-02T11:00:00Z",
    details: {
      fullName: "Adebayo Citizen",
      dateOfBirth: "1992-05-14",
      gender: "male",
      fatherName: "Bamidele Citizen",
      fatherCompound: "Agbo Compound",
      purpose: "Employment Verification",
      ward: "Ward 7 (Itesi / Camp)",
    },
    documents: [
      { name: "Passport Photo", url: "/documents/passport.jpg", status: "verified" },
      { name: "NIN Slip", url: "/documents/nin.pdf", status: "verified" },
      { name: "Baale Letter", url: "/documents/baale_letter.pdf", status: "verified" },
    ],
    timeline: [
      { id: "t1", stage: "Created", title: "Application Drafted", description: "Application created by Citizen", actor: "Adebayo Citizen", actorRole: "citizen", timestamp: "2026-08-01 09:00", status: "completed" },
      { id: "t2", stage: "Submitted", title: "Submitted", description: "Application submitted for processing", actor: "Adebayo Citizen", actorRole: "citizen", timestamp: "2026-08-01 09:05", status: "completed" },
      { id: "t3", stage: "Invoice Generated", title: "Statutory Invoice Issued", description: "Invoice ODE/INV/2026/000101 for ₦3,500 generated", actor: "System Treasury", actorRole: "treasurer", timestamp: "2026-08-01 09:10", status: "completed" },
      { id: "t4", stage: "Payment Confirmed", title: "Payment Received", description: "₦3,500 paid via Online Gateway. Receipt ODE/RCP/2026/000101 issued.", actor: "Adebayo Citizen", actorRole: "citizen", timestamp: "2026-08-01 10:00", status: "completed" },
      { id: "t5", stage: "Approved", title: "Application Approved", description: "Verified by Ward Councillor & approved by LGA Admin", actor: "LGA Admin", actorRole: "lga_admin", timestamp: "2026-08-02 11:00", status: "completed" },
      { id: "t6", stage: "Certificate Generated", title: "Certificate Issued", description: "Official Certificate ODE/COO/2026/000001 ready for download", actor: "System", actorRole: "system", timestamp: "2026-08-02 11:00", status: "completed" },
    ],
  },
  {
    id: "ODE-2026-002",
    applicationNo: "ODE/TEN/2026/0002",
    serviceId: "tenement_rate",
    serviceName: "Tenement Rate",
    category: "Rates & Levies",
    applicant: "Camp Retail Hub (Bola Adesanya)",
    phone: "08088889999",
    email: "camp@example.com",
    address: `Plot 14 Commercial Row, Camp Junction, ${LGA_CONFIG.identity.name}`,
    ward: "Ward 7 (Itesi / Camp)",
    revenueHead: "2001 - Tenement & Property Rates",
    amount: 25000,
    status: "Invoice Generated",
    paymentStatus: "unpaid",
    invoiceNumber: "ODE/INV/2026/000102",
    qrToken: "QR-ODE-TEN-000002",
    verificationCode: "VER-TEN-002",
    createdAt: "2026-08-03T08:30:00Z",
    updatedAt: "2026-08-04T14:00:00Z",
    details: {
      propertyName: "Camp Retail Hub Plaza",
      propertyType: "Commercial Building",
      ownerName: "Bola Adesanya",
      ward: "Ward 7 (Itesi / Camp)",
      numberOfUnits: "4 Shops",
    },
    documents: [
      { name: "Property Layout", url: "/documents/layout.pdf", status: "uploaded" },
    ],
    inspectionReport: {
      inspectedAt: "2026-08-04T10:00:00Z",
      inspectorName: "Tunji Field",
      findings: "2-story commercial structure with 4 operational shops.",
      recommendedCategory: "Commercial Tier 2",
      recommendedFee: 25000,
      completed: true,
    },
    treasuryAssessment: {
      assessedAt: "2026-08-04T14:00:00Z",
      assessedBy: "Treasury Dept",
      approvedFee: 25000,
      revenueHead: "2001 - Tenement & Property Rates",
      status: "approved",
    },
    timeline: [
      { id: "t1", stage: "Submitted", title: "Application Submitted", description: "Property assessment requested", actor: "Bola Adesanya", actorRole: "business_owner", timestamp: "2026-08-03 08:30", status: "completed" },
      { id: "t2", stage: "Inspection Completed", title: "Site Inspection Conducted", description: "Inspected by Officer Tunji Field. Recommended ₦25,000", actor: "Tunji Field", actorRole: "field_officer", timestamp: "2026-08-04 10:00", status: "completed" },
      { id: "t3", stage: "Invoice Generated", title: "Demand Notice Issued", description: "Invoice ODE/INV/2026/000102 for ₦25,000 issued by Treasury. Awaiting payment.", actor: "Treasury", actorRole: "treasurer", timestamp: "2026-08-04 14:00", status: "current" },
    ],
  },
  {
    id: "ODE-2026-003",
    applicationNo: "ODE/FAR/2026/0003",
    serviceId: "farmers_registration",
    serviceName: "Certificate of Farmers Registration",
    category: "Community & Agriculture",
    applicant: `${LGA_CONFIG.identity.name} Farmers Cooperative (Kazeem)`,
    phone: "08012345678",
    email: `farmers@${LGA_CONFIG.contact.email.split("@")[1] || "lga.gov.ng"}`,
    address: "Alagbagba Farm Settlement, Ward 4",
    ward: "Ward 4 (Alagbagba)",
    revenueHead: "1004 - Agricultural Services",
    amount: 5000,
    status: "Pending Approval",
    paymentStatus: "paid",
    invoiceNumber: "ODE/INV/2026/000103",
    receiptNumber: "ODE/RCP/2026/000103",
    paidAt: "2026-08-05T09:00:00Z",
    paymentMethod: "pos",
    qrToken: "QR-ODE-FAR-000003",
    verificationCode: "VER-FAR-003",
    createdAt: "2026-08-04T11:00:00Z",
    updatedAt: "2026-08-05T09:00:00Z",
    details: {
      farmerName: "Kazeem Olanrewaju",
      farmType: "Crop & Livestock",
      farmLocation: "Alagbagba Sector B",
      farmSize: "5 Hectares",
    },
    documents: [
      { name: "Cooperative Certificate", url: "/documents/coop.pdf", status: "verified" },
      { name: "Farm Sketch", url: "/documents/sketch.png", status: "verified" },
    ],
    timeline: [
      { id: "t1", stage: "Submitted", title: "Application Submitted", description: "Farmers registration submitted", actor: "Kazeem Olanrewaju", actorRole: "citizen", timestamp: "2026-08-04 11:00", status: "completed" },
      { id: "t2", stage: "Payment Confirmed", title: "Payment Received", description: "₦5,000 paid via Field POS. Receipt ODE/RCP/2026/000103 issued.", actor: "Field Officer", actorRole: "field_officer", timestamp: "2026-08-05 09:00", status: "completed" },
      { id: "t3", stage: "Pending Approval", title: "Awaiting LGA Approval", description: "Pending final review and certificate approval by LGA Admin.", actor: "LGA Admin", actorRole: "lga_admin", timestamp: "2026-08-05 09:05", status: "current" },
    ],
  },
  {
    id: "ODE-2026-004",
    applicationNo: "ODE/LIQ/2026/0004",
    serviceId: "liquor_licence",
    serviceName: "Liquor Licence",
    category: "Licences & Permits",
    applicant: "Golden Lounge & Bar (Chief Samuel)",
    phone: "08033334444",
    email: "golden@lounge.ng",
    address: "45 Osiele Market Road, Ward 2",
    ward: "Ward 2 (Osiele Market)",
    revenueHead: "2003 - Excise & Trade Licences",
    amount: 35000,
    status: "Inspection Required",
    paymentStatus: "unpaid",
    qrToken: "QR-ODE-LIQ-000004",
    verificationCode: "VER-LIQ-004",
    createdAt: "2026-08-05T14:20:00Z",
    updatedAt: "2026-08-05T14:20:00Z",
    details: {
      businessName: "Golden Lounge & Bar",
      licenceType: "Bar & Hotel Retail",
      address: "45 Osiele Market Road",
      capacity: "120 Seats",
    },
    documents: [
      { name: "Tenancy Agreement", url: "/documents/tenancy.pdf", status: "uploaded" },
      { name: "CAC Document", url: "/documents/cac.pdf", status: "uploaded" },
    ],
    timeline: [
      { id: "t1", stage: "Submitted", title: "Application Submitted", description: "Liquor licence requested", actor: "Chief Samuel", actorRole: "business_owner", timestamp: "2026-08-05 14:20", status: "completed" },
      { id: "t2", stage: "Inspection Required", title: "Field Inspection Scheduled", description: "Scheduled for public health & environmental inspection", actor: "Field Officer Dept", actorRole: "field_officer", timestamp: "2026-08-05 14:30", status: "current" },
    ],
  },
  {
    id: "ODE-2026-005",
    applicationNo: "ODE/QUA/2026/0005",
    serviceId: "quarry_permit",
    serviceName: "Quarry Fees and Permit",
    category: "Licences & Permits",
    applicant: "Boluwaji Quarry Operations Ltd",
    phone: "08055556666",
    email: "quarry@boluwaji.com",
    address: "Quarry Site 3, Ward 9, Boluwaji",
    ward: "Ward 9 (Boluwaji)",
    revenueHead: "2005 - Mining & Natural Resources",
    amount: 150000,
    status: "Awaiting Assessment",
    paymentStatus: "unpaid",
    qrToken: "QR-ODE-QUA-000005",
    verificationCode: "VER-QUA-005",
    createdAt: "2026-08-02T10:00:00Z",
    updatedAt: "2026-08-04T11:00:00Z",
    details: {
      companyName: "Boluwaji Quarry Operations Ltd",
      cadastreLeaseNo: "FMC/QL/2024/88",
      siteArea: "12 Acres",
      extractionCapacity: "500 Tons/day",
    },
    documents: [
      { name: "Cadastre Lease", url: "/documents/lease.pdf", status: "verified" },
      { name: "EIA Report", url: "/documents/eia.pdf", status: "verified" },
    ],
    inspectionReport: {
      inspectedAt: "2026-08-04T10:30:00Z",
      inspectorName: "Kemi Field Officer",
      findings: "Active granite quarrying site with 2 crushers and heavy haulage traffic.",
      recommendedCategory: "Heavy Mining Tier 1",
      recommendedFee: 150000,
      completed: true,
    },
    timeline: [
      { id: "t1", stage: "Submitted", title: "Application Submitted", description: "Quarry operating permit requested", actor: "Boluwaji Quarry", actorRole: "business_owner", timestamp: "2026-08-02 10:00", status: "completed" },
      { id: "t2", stage: "Inspection Completed", title: "Mining Site Inspected", description: "Field Officer Kemi verified site equipment & EIA clearance", actor: "Kemi Field Officer", actorRole: "field_officer", timestamp: "2026-08-04 10:30", status: "completed" },
      { id: "t3", stage: "Awaiting Assessment", title: "Awaiting Treasury Fee Tariff", description: "Pending Treasury assessment & invoice creation", actor: "Treasury Dept", actorRole: "treasurer", timestamp: "2026-08-04 11:00", status: "current" },
    ],
  },
  {
    id: "ODE-2026-006",
    applicationNo: "ODE/CLU/2026/0006",
    serviceId: "club_registration",
    serviceName: "Certificate of Club Registration",
    category: "Certificates",
    applicant: "Itesi Youth Development Club",
    phone: "08022223333",
    email: "itesiyouths@gmail.com",
    address: "Community Centre, Camp Road, Ward 7",
    ward: "Ward 7 (Itesi / Camp)",
    revenueHead: "1002 - Organization Fees",
    amount: 15000,
    status: "Returned For Correction",
    paymentStatus: "unpaid",
    qrToken: "QR-ODE-CLU-000006",
    verificationCode: "VER-CLU-006",
    createdAt: "2026-08-03T11:00:00Z",
    updatedAt: "2026-08-05T16:00:00Z",
    correctionNotes: "Please attach the signed minutes of the inaugural meeting and updated executive list with NINs.",
    details: {
      clubName: "Itesi Youth Development Club",
      presidentName: "Oluwaseun Popoola",
      secretaryName: "Funmi Adeniyi",
      purpose: "Youth Empowerment & Social Welfare",
    },
    documents: [
      { name: "Draft Constitution", url: "/documents/constitution.pdf", status: "uploaded" },
    ],
    timeline: [
      { id: "t1", stage: "Submitted", title: "Submitted", description: "Club registration submitted", actor: "Oluwaseun Popoola", actorRole: "citizen", timestamp: "2026-08-03 11:00", status: "completed" },
      { id: "t2", stage: "Returned For Correction", title: "Returned for Correction", description: "Returned by LGA Admin: Attached minutes missing required executive signatures.", actor: "LGA Admin", actorRole: "lga_admin", timestamp: "2026-08-05 16:00", status: "current" },
    ],
  },
  {
    id: "ODE-2026-007",
    applicationNo: "ODE/KIO/2026/0007",
    serviceId: "kiosk_licence",
    serviceName: "Kiosk Licence",
    category: "Licences & Permits",
    applicant: "Sunlight Refreshment Kiosk",
    phone: "08099990000",
    address: "Osiele Market Bus Stop",
    ward: "Ward 2 (Osiele Market)",
    revenueHead: "3002 - Micro Trade Permits",
    amount: 8000,
    status: "Draft",
    paymentStatus: "unpaid",
    qrToken: "QR-ODE-KIO-000007",
    verificationCode: "VER-KIO-007",
    createdAt: "2026-08-06T09:00:00Z",
    updatedAt: "2026-08-06T09:00:00Z",
    details: {
      kioskName: "Sunlight Refreshment Kiosk",
      operatorName: "Mercy Johnson",
      itemSold: "Soft Drinks & Provisions",
    },
    documents: [],
    timeline: [
      { id: "t1", stage: "Draft", title: "Draft Saved", description: "Application saved as draft", actor: "Mercy Johnson", actorRole: "citizen", timestamp: "2026-08-06 09:00", status: "current" },
    ],
  },
  {
    id: "ODE-2026-008",
    applicationNo: "ODE/CDA/2026/0008",
    serviceId: "cda_registration",
    serviceName: "Certificate of CDA Registration",
    category: "Community & Agriculture",
    applicant: "Osiele Central CDA",
    phone: "08066667777",
    address: "Community Hall, Osiele",
    ward: "Ward 2 (Osiele Market)",
    revenueHead: "1003 - Community Dev Head",
    amount: 10000,
    status: "Rejected",
    paymentStatus: "unpaid",
    qrToken: "QR-ODE-CDA-000008",
    verificationCode: "VER-CDA-008",
    createdAt: "2026-07-28T10:00:00Z",
    updatedAt: "2026-07-30T14:00:00Z",
    rejectionReason: "Boundary dispute resolution required with neighbouring Ward 3 CDA before formal LGA registration.",
    details: {
      cdaName: "Osiele Central CDA",
      chairmanName: "High Chief Aremu",
      boundaryDescription: "Osiele Market North to Railway Track",
    },
    documents: [],
    timeline: [
      { id: "t1", stage: "Submitted", title: "Submitted", description: "CDA registration submitted", actor: "High Chief Aremu", actorRole: "citizen", timestamp: "2026-07-28 10:00", status: "completed" },
      { id: "t2", stage: "Rejected", title: "Application Rejected", description: "Rejected: Boundary dispute resolution required before registration.", actor: "LGA Admin", actorRole: "lga_admin", timestamp: "2026-07-30 14:00", status: "completed" },
    ],
  },
];

export function getLgaApplications(): LgaApplication[] {
  if (typeof window === "undefined") return INITIAL_SEED_APPLICATIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_APPLICATIONS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_APPLICATIONS));
      return INITIAL_SEED_APPLICATIONS;
    }
    const apps = JSON.parse(raw);
    return Array.isArray(apps) && apps.length > 0 ? apps : INITIAL_SEED_APPLICATIONS;
  } catch {
    return INITIAL_SEED_APPLICATIONS;
  }
}

export function saveLgaApplications(apps: LgaApplication[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    window.dispatchEvent(new CustomEvent(EVT_KEY));
    window.dispatchEvent(new CustomEvent(LEGACY_APPLICATIONS_EVENT_KEY));
  } catch (err) {
    console.error("Failed to save applications", err);
  }
}

export function getLgaApplicationById(id: string): LgaApplication | undefined {
  const apps = getLgaApplications();
  return apps.find((a) => a.id === id || a.applicationNo === id);
}

export function createLgaApplication(data: {
  serviceId: string;
  serviceName: string;
  category: string;
  applicant: string;
  phone: string;
  email?: string;
  address: string;
  ward: string;
  nin?: string;
  cacNumber?: string;
  revenueHead: string;
  amount: number;
  details: Record<string, any>;
  documents?: { name: string; url: string; status: "uploaded" | "verified" }[];
  isDraft?: boolean;
}): LgaApplication {
  const apps = getLgaApplications();
  const count = apps.length + 101;
  const id = `ODE-2026-${String(count).padStart(3, "0")}`;
  const serviceCode = data.serviceId.substring(0, 3).toUpperCase();
  const appNo = `ODE/${serviceCode}/2026/${String(count).padStart(4, "0")}`;
  const now = new Date().toISOString();
  const dateStr = now.replace("T", " ").substring(0, 16);

  const initialStatus: ApplicationStatus = data.isDraft ? "Draft" : "Submitted";

  const newApp: LgaApplication = {
    id,
    applicationNo: appNo,
    serviceId: data.serviceId,
    serviceName: data.serviceName,
    category: data.category,
    applicant: data.applicant,
    phone: data.phone,
    email: data.email,
    address: data.address,
    ward: data.ward || "the LGA",
    nin: data.nin,
    cacNumber: data.cacNumber,
    revenueHead: data.revenueHead,
    amount: data.amount,
    status: initialStatus,
    paymentStatus: "unpaid",
    qrToken: genQRToken(),
    verificationCode: genVerificationCode(),
    createdAt: now,
    updatedAt: now,
    details: data.details,
    documents: data.documents || [],
    timeline: [
      {
        id: `t-${Date.now()}-1`,
        stage: initialStatus,
        title: data.isDraft ? "Draft Saved" : "Application Submitted",
        description: data.isDraft
          ? "Application saved to draft"
          : `Application for ${data.serviceName} submitted successfully.`,
        actor: data.applicant,
        actorRole: "citizen",
        timestamp: dateStr,
        status: "current",
      },
    ],
  };

  const updated = [newApp, ...apps];
  saveLgaApplications(updated);

  addNotification({
    title: data.isDraft ? "Draft Saved" : "Application Submitted",
    body: `${newApp.applicationNo} • ${data.serviceName} • Status: ${initialStatus}`,
    type: "info",
  });

  addAudit({
    actor: data.applicant,
    actorRole: "citizen",
    action: data.isDraft ? "APPLICATION_DRAFTED" : "APPLICATION_SUBMITTED",
    target: newApp.applicationNo,
    meta: { service: data.serviceName, amount: data.amount },
  });

  return newApp;
}

export function updateApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  actorInfo: { name: string; role: string },
  updates: Partial<LgaApplication> = {}
): LgaApplication | null {
  const apps = getLgaApplications();
  const index = apps.findIndex((a) => a.id === id || a.applicationNo === id);
  if (index === -1) return null;

  const current = apps[index];
  const now = new Date().toISOString();
  const dateStr = now.replace("T", " ").substring(0, 16);

  // Mark all previous timeline events as completed
  const updatedTimeline = (current.timeline || []).map((t) => ({ ...t, status: "completed" as const }));

  // Add new stage event
  updatedTimeline.push({
    id: `t-${Date.now()}`,
    stage: newStatus,
    title: `Status: ${newStatus}`,
    description: updates.correctionNotes || updates.rejectionReason || updates.councillorNotes || `Application status transitioned to ${newStatus}`,
    actor: actorInfo.name,
    actorRole: actorInfo.role,
    timestamp: dateStr,
    status: "current",
  });

  const updatedApp: LgaApplication = {
    ...current,
    ...updates,
    status: newStatus,
    updatedAt: now,
    timeline: updatedTimeline,
  };

  apps[index] = updatedApp;
  saveLgaApplications(apps);

  addNotification({
    title: `Application ${newStatus}`,
    body: `${updatedApp.applicationNo} updated to ${newStatus} by ${actorInfo.name}`,
    type: newStatus === "Approved" || newStatus === "Completed" ? "success" : newStatus === "Rejected" ? "error" : "info",
  });

  addAudit({
    actor: actorInfo.name,
    actorRole: actorInfo.role,
    action: `STATUS_${newStatus.toUpperCase().replace(/\s+/g, "_")}`,
    target: updatedApp.applicationNo,
  });

  return updatedApp;
}

// Workflow action: Citizen or Field Officer simulates payment
export function processApplicationPayment(
  id: string,
  paymentMethod: string = "card",
  actorInfo: { name: string; role: string }
): LgaApplication | null {
  const app = getLgaApplicationById(id);
  if (!app) return null;

  const invRef = app.invoiceNumber || genInvoiceRef();
  const rctRef = genReceiptNumber();
  const now = new Date().toISOString();

  return updateApplicationStatus(id, "Payment Confirmed", actorInfo, {
    paymentStatus: "paid",
    invoiceNumber: invRef,
    receiptNumber: rctRef,
    paidAt: now,
    paymentMethod,
  });
}

// Workflow action: Field Officer conducts inspection
export function recordFieldInspection(
  id: string,
  inspection: {
    findings: string;
    recommendedCategory: string;
    recommendedFee: number;
    photos?: string[];
  },
  officerInfo: { name: string; role: string }
): LgaApplication | null {
  const now = new Date().toISOString();
  return updateApplicationStatus(id, "Inspection Completed", officerInfo, {
    inspectionReport: {
      inspectedAt: now,
      inspectorName: officerInfo.name,
      findings: inspection.findings,
      recommendedCategory: inspection.recommendedCategory,
      recommendedFee: inspection.recommendedFee,
      photos: inspection.photos || [],
      completed: true,
    },
    amount: inspection.recommendedFee,
  });
}

// Workflow action: Treasury assesses fee and issues demand notice / invoice
export function issueTreasuryInvoice(
  id: string,
  assessment: {
    approvedFee: number;
    revenueHead: string;
    treasuryNotes?: string;
  },
  treasurerInfo: { name: string; role: string }
): LgaApplication | null {
  const invNo = genInvoiceRef();
  const now = new Date().toISOString();

  return updateApplicationStatus(id, "Invoice Generated", treasurerInfo, {
    amount: assessment.approvedFee,
    revenueHead: assessment.revenueHead,
    invoiceNumber: invNo,
    paymentStatus: "unpaid",
    treasuryAssessment: {
      assessedAt: now,
      assessedBy: treasurerInfo.name,
      approvedFee: assessment.approvedFee,
      revenueHead: assessment.revenueHead,
      treasuryNotes: assessment.treasuryNotes,
      status: "approved",
    },
  });
}

// Workflow action: LGA Admin Approves Application & Generates Certificate/Licence
export function approveAndGenerateCertificate(
  id: string,
  adminInfo: { name: string; role: string }
): LgaApplication | null {
  const app = getLgaApplicationById(id);
  if (!app) return null;

  const now = new Date().toISOString();
  const certNo = `ODE/${app.serviceId.substring(0, 3).toUpperCase()}/2026/${Math.floor(100000 + Math.random() * 899999)}`;
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);

  return updateApplicationStatus(id, "Certificate Generated", adminInfo, {
    certificateNumber: certNo,
    licenceNumber: certNo,
    issuedAt: now,
    issuedBy: adminInfo.name,
    expiryDate: expiry.toISOString(),
    status: "Completed",
  });
}

// Workflow action: Citizen Reapplies from a Rejected Application
export function reapplyFromRejected(
  id: string,
  citizenName: string
): LgaApplication | null {
  const app = getLgaApplicationById(id);
  if (!app) return null;

  return createLgaApplication({
    serviceId: app.serviceId,
    serviceName: app.serviceName,
    category: app.category,
    applicant: citizenName || app.applicant,
    phone: app.phone,
    email: app.email,
    address: app.address,
    ward: app.ward,
    nin: app.nin,
    cacNumber: app.cacNumber,
    revenueHead: app.revenueHead,
    amount: app.amount,
    details: { ...app.details, reappliedFrom: app.applicationNo },
    documents: app.documents,
    isDraft: false,
  });
}

// This module now exports neutral LGA function names directly.

