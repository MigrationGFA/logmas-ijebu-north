/* eslint-disable @typescript-eslint/no-explicit-any */
import { LGA_CONFIG, LgaConfiguration } from "./lga.config";

export interface ServiceFeeConfig {
  serviceId: string;
  serviceName: string;
  category: string;
  revenueHead: string;
  fee: number;
  status: "active" | "inactive";
  lastUpdated: string;
}

export interface ServiceType {
  id: string;
  name: string;
  code?: string;
  category:
    | "Certificates"
    | "Community & Agriculture"
    | "Rates & Levies"
    | "Licences & Permits"
    | "Urban Development"
    | string;
  description: string;
  revenueHead: string;
  processingTime: string;
  estimatedDays?: string | number;
  certificateType?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  feeType?: "fixed" | "tiered" | "variable";
  defaultFee: number;
  feeDescription?: string;
  requiresInspection?: boolean;
  requiresAssessment?: boolean;
  requiresTreasuryApproval?: boolean;
  requiresLgaApproval?: boolean;
  supportsCertificate?: boolean;
  supportsLicence?: boolean;
  supportsRenewal: boolean;
  requiresPayment?: boolean;
  requiredDocuments?: string[];
  icon?: string;
  color?: string;
  feeConfig?: {
    id: string;
    amount: string;
    status: string;
    updatedAt: string;
  };
  _count?: {
    applications?: number;
  };
  requirements?: string[];
}

/**
 * Service Catalog Factory: Generates standard LGA municipal services
 * with dynamic titles, jurisdiction descriptions, and currency formatting.
 */
export function createLgaServiceCatalog(lga: LgaConfiguration = LGA_CONFIG): ServiceType[] {
  const lgaName = lga.identity.name;
  const formalTitle = lga.identity.formalTitle;

  return [
    {
      id: "certificate_of_origin",
      name: "State of Origin",
      category: "Certificates",
      description: `Official indigene certificate issued to born residents and descendants of ${formalTitle}.`,
      revenueHead: "1001 - Certificate Fees",
      processingTime: "1 - 2 Business Days",
      feeType: "fixed",
      defaultFee: 3500,
      feeDescription: "₦3,500 statutory application and issuing fee",
      requiresInspection: false,
      requiresAssessment: false,
      requiresTreasuryApproval: false,
      requiresLgaApproval: true,
      supportsCertificate: true,
      supportsLicence: false,
      supportsRenewal: false,
      requiresPayment: true,
      requiredDocuments: [
        "Passport Photograph (red background)",
        "National Identity Card / NIN Slip",
        "Birth Certificate / Sworn Declaration of Age",
        "Letter of Identification from Family Head or Baale",
      ],
      icon: "FileBadge",
      color: "primary",
    },
    {
      id: "club_registration",
      name: "Certificate of Club Registration",
      category: "Certificates",
      description: `Official registration and certification for social, sports, cultural, and youth clubs operating in ${lgaName} LGA.`,
      revenueHead: "1002 - Organization Fees",
      processingTime: "3 - 5 Business Days",
      feeType: "fixed",
      defaultFee: 15000,
      feeDescription: "₦15,000 annual registration and certificate fee",
      requiresInspection: true,
      requiresAssessment: false,
      requiresTreasuryApproval: true,
      requiresLgaApproval: true,
      supportsCertificate: true,
      supportsLicence: false,
      supportsRenewal: true,
      requiresPayment: true,
      requiredDocuments: [
        "Club Constitution / Rules",
        "Minutes of Inaugural Meeting",
        "List of Executive Members & Contacts",
        "Passport Photographs of President & Secretary",
        "Proof of Secretariat / Meeting Venue Address",
      ],
      icon: "Users",
      color: "gold",
    },
    {
      id: "cda_registration",
      name: "Certificate of Community Development Association Registration",
      category: "Community & Agriculture",
      description: `Registration and formal recognition of Community Development Associations (CDAs) in ${lgaName} LGA wards.`,
      revenueHead: "1003 - Community Dev Head",
      processingTime: "3 - 5 Business Days",
      feeType: "fixed",
      defaultFee: 10000,
      feeDescription: "₦10,000 community registration fee",
      requiresInspection: true,
      requiresAssessment: false,
      requiresTreasuryApproval: true,
      requiresLgaApproval: true,
      supportsCertificate: true,
      supportsLicence: false,
      supportsRenewal: true,
      requiresPayment: true,
      requiredDocuments: [
        "CDA Constitution & By-Laws",
        "Inaugural Meeting Minutes & Attendance Sheet",
        "List of Executive Members with Phone Numbers",
        "Community Boundary Map / Sketch",
        "Letter of Support from Ward Development Committee",
      ],
      icon: "Building2",
      color: "info",
    },
    {
      id: "farmers_registration",
      name: "Certificate of Farmers Registration",
      category: "Community & Agriculture",
      description: `Formal registration and identification certificate for crop, livestock, and poultry farmers across ${lgaName} LGA.`,
      revenueHead: "1004 - Agricultural Services",
      processingTime: "2 - 3 Business Days",
      feeType: "fixed",
      defaultFee: 5000,
      feeDescription: "₦5,000 agricultural registration fee",
      requiresInspection: true,
      requiresAssessment: false,
      requiresTreasuryApproval: false,
      requiresLgaApproval: true,
      supportsCertificate: true,
      supportsLicence: false,
      supportsRenewal: true,
      requiresPayment: true,
      requiredDocuments: [
        "Passport Photograph of Applicant",
        "Means of Identification (NIN / Voter Card)",
        "Farm Location GPS Coordinates or Sketch",
        "Proof of Land Ownership or Tenancy Agreement",
        "Cooperative / Farmers Association Card (if applicable)",
      ],
      icon: "Sprout",
      color: "success",
    },
    {
      id: "environmental_sanitation",
      name: "Certificate of Environmental Sanitation Compliance",
      category: "Certificates",
      description: "Mandatory environmental sanitation and public health compliance certificate for commercial & industrial premises.",
      revenueHead: "1005 - Health & Sanitation",
      processingTime: "3 - 5 Business Days",
      feeType: "tiered",
      defaultFee: 20000,
      feeDescription: "₦15,000 - ₦50,000 depending on facility size and category",
      requiresInspection: true,
      requiresAssessment: true,
      requiresTreasuryApproval: true,
      requiresLgaApproval: true,
      supportsCertificate: true,
      supportsLicence: false,
      supportsRenewal: true,
      requiresPayment: true,
      requiredDocuments: [
        "Facility Layout & Sanitation Plan",
        "Waste Management / Disposal Contract Evidence",
        "Pest Control & Fumigation Certificate",
        "Photographs of Waste Storage & Toilet Facilities",
      ],
      icon: "ShieldCheck",
      color: "warning",
    },
    {
      id: "tenement_rate",
      name: "Tenement Rate",
      category: "Rates & Levies",
      description: `Annual statutory property rate levied on residential, commercial, and industrial property owners in ${lgaName} LGA.`,
      revenueHead: "2001 - Tenement & Property Rates",
      processingTime: "1 - 2 Business Days",
      feeType: "variable",
      defaultFee: 25000,
      feeDescription: "Assessed based on annual rental value, property classification, and location ward",
      requiresInspection: true,
      requiresAssessment: true,
      requiresTreasuryApproval: true,
      requiresLgaApproval: false,
      supportsCertificate: true,
      supportsLicence: false,
      supportsRenewal: true,
      requiresPayment: true,
      requiredDocuments: [
        "Property Ownership Document / Survey Plan",
        "Building Elevation Photographs",
        "Previous Year Tenement Clearance (for renewals)",
        "Valid ID of Property Owner / Agent",
      ],
      icon: "Home",
      color: "primary",
    },
    {
      id: "haulage_fees",
      name: "Haulage Fees",
      category: "Rates & Levies",
      description: `Levy on heavy-duty haulage vehicles, granite, sand, timber, and agricultural produce transport through ${lgaName} LGA.`,
      revenueHead: "2002 - Haulage & Transit Head",
      processingTime: "Instant / Same Day",
      feeType: "tiered",
      defaultFee: 10000,
      feeDescription: "₦5,000 - ₦25,000 per trip or monthly operator permit based on truck tonnage",
      requiresInspection: false,
      requiresAssessment: true,
      requiresTreasuryApproval: true,
      requiresLgaApproval: false,
      supportsCertificate: false,
      supportsLicence: true,
      supportsRenewal: true,
      requiresPayment: true,
      requiredDocuments: [
        "Vehicle Registration Papers",
        "Driver's Licence",
        "Waybill / Load Manifest",
        "Quarry or Loading Point Dispatch Note",
      ],
      icon: "Truck",
      color: "info",
    },
    {
      id: "liquor_licence",
      name: "Liquor Licence Fees",
      category: "Licences & Permits",
      description: `Annual statutory licence authorizing retail or wholesale sale of alcoholic beverages within ${lgaName} LGA jurisdiction.`,
      revenueHead: "2003 - Excise & Trade Licences",
      processingTime: "3 - 5 Business Days",
      feeType: "tiered",
      defaultFee: 25000,
      feeDescription: "₦20,000 - ₦60,000 based on hotel, bar, or distributor category",
      requiresInspection: true,
      requiresAssessment: true,
      requiresTreasuryApproval: true,
      requiresLgaApproval: true,
      supportsCertificate: false,
      supportsLicence: true,
      supportsRenewal: true,
      requiresPayment: true,
      requiredDocuments: [
        "Business Premises Tenancy Agreement / C of O",
        "CAC Business Registration Documents",
        "Environmental Sanitation Compliance Certificate",
        "Valid ID of Business Proprietor",
      ],
      icon: "Beer",
      color: "warning",
    },
    {
      id: "viewing_centre_licence",
      name: "Viewing Centre Licence Fee",
      category: "Licences & Permits",
      description: `Annual permit and safety licence for commercial football viewing centres and game arcades in ${lgaName} LGA.`,
      revenueHead: "2004 - Entertainment & Sports",
      processingTime: "2 - 4 Business Days",
      feeType: "fixed",
      defaultFee: 15000,
      feeDescription: "₦15,000 annual viewing centre licence fee",
      requiresInspection: true,
      requiresAssessment: false,
      requiresTreasuryApproval: true,
      requiresLgaApproval: true,
      supportsCertificate: false,
      supportsLicence: true,
      supportsRenewal: true,
      requiresPayment: true,
      requiredDocuments: [
        "Premises Location Sketch & Photos",
        "Fire Extinguisher & Safety Equipment Receipt",
        "Passport Photograph & ID of Operator",
        "Tenancy Agreement or Approval Letter",
      ],
      icon: "Tv",
      color: "gold",
    },
    {
      id: "quarry_permit",
      name: "Quarry Fees and Permits",
      category: "Licences & Permits",
      description: `Annual operating permit, environmental fee, and stone/granite extraction licence for quarry operators in ${lgaName} LGA.`,
      revenueHead: "2005 - Mining & Natural Resources",
      processingTime: "5 - 7 Business Days",
      feeType: "variable",
      defaultFee: 150000,
      feeDescription: "₦150,000 base fee plus per-tonnage extraction assessment",
      requiresInspection: true,
      requiresAssessment: true,
      requiresTreasuryApproval: true,
      requiresLgaApproval: true,
      supportsCertificate: false,
      supportsLicence: true,
      supportsRenewal: true,
      requiresPayment: true,
      requiredDocuments: [
        "Federal Mining Cadastre Lease / Quarry Licence",
        "State Ministry of Environment EIA Approval",
        "Community Host Agreement (MOU)",
        "Site Survey Plan & GPS Coordinates",
        "CAC Certificate of Incorporation",
      ],
      icon: "Pickaxe",
      color: "primary",
    },
    {
      id: "street_naming",
      name: "Street Naming and Property Numbering",
      category: "Urban Development",
      description: `Formal approval, naming, and property house numbering registration for streets and estates in ${lgaName} LGA.`,
      revenueHead: "3001 - Urban Planning Head",
      processingTime: "7 - 10 Business Days",
      feeType: "fixed",
      defaultFee: 100000,
      feeDescription: "₦100,000 for street naming approval; ₦5,000 per property number plate",
      requiresInspection: true,
      requiresAssessment: true,
      requiresTreasuryApproval: true,
      requiresLgaApproval: true,
      supportsCertificate: true,
      supportsLicence: false,
      supportsRenewal: false,
      requiresPayment: true,
      requiredDocuments: [
        "Formal Application Letter with Justification",
        "CDA Resolution or Residents Consent List",
        "Street Location Map & Layout Diagram",
        "Applicant Identification & Contact Details",
      ],
      icon: "MapPin",
      color: "info",
    },
    {
      id: "kiosk_licence",
      name: "Kiosk Licence",
      category: "Licences & Permits",
      description: `Annual trading permit for temporary kiosks, roadside containers, and mobile sales booths in ${lgaName} LGA.`,
      revenueHead: "3002 - Micro Trade Permits",
      processingTime: "1 - 2 Business Days",
      feeType: "fixed",
      defaultFee: 8000,
      feeDescription: "₦8,000 annual kiosk licence fee",
      requiresInspection: true,
      requiresAssessment: false,
      requiresTreasuryApproval: false,
      requiresLgaApproval: true,
      supportsCertificate: false,
      supportsLicence: true,
      supportsRenewal: true,
      requiresPayment: true,
      requiredDocuments: [
        "Kiosk & Placement Site Photograph",
        "Landowner or Market Committee Consent Letter",
        "Passport Photograph of Operator",
        "Valid ID Card",
      ],
      icon: "Store",
      color: "success",
    },
  ];
}

/**
 * Default compiled service catalog for current LGA
 */
export const DEFAULT_SERVICES = createLgaServiceCatalog(LGA_CONFIG);

/**
 * Universal lookup helper for services across the system
 */
export function getServiceById(id: string, services: ServiceType[] = DEFAULT_SERVICES): ServiceType | undefined {
  if (!id) return undefined;

  let raw = "";
  try {
    raw = decodeURIComponent(id).trim();
  } catch {
    raw = id.trim();
  }

  const stripped = raw
    .replace(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})_/i, "")
    .replace(/^service_/i, "")
    .replace(/^srv_/i, "");

  const exact = services.find((s) => s.id === stripped || s.id === id);
  if (exact) return exact;

  const clean = stripped.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const directClean = services.find((s) => s.id === clean);
  if (directClean) return directClean;

  const aliasMap: Record<string, string> = {
    "certificate-of-origin": "certificate_of_origin",
    "origin": "certificate_of_origin",
    "indigene": "certificate_of_origin",
    "origin_certificate": "certificate_of_origin",
    "coo": "certificate_of_origin",
    "club-registration": "club_registration",
    "club": "club_registration",
    "club_reg": "club_registration",
    "association": "club_registration",
    "cda-registration": "cda_registration",
    "cda": "cda_registration",
    "community-development": "cda_registration",
    "farmers-registration": "farmers_registration",
    "farmer": "farmers_registration",
    "farmers": "farmers_registration",
    "agriculture": "farmers_registration",
    "environmental-sanitation": "environmental_sanitation",
    "sanitation": "environmental_sanitation",
    "environmental": "environmental_sanitation",
    "health": "environmental_sanitation",
    "tenement-rate": "tenement_rate",
    "tenement": "tenement_rate",
    "property-rate": "tenement_rate",
    "haulage-fees": "haulage_fees",
    "haulage": "haulage_fees",
    "truck": "haulage_fees",
    "liquor-licence": "liquor_licence",
    "liquor": "liquor_licence",
    "bar": "liquor_licence",
    "viewing-centre-licence": "viewing_centre_licence",
    "viewing-centre": "viewing_centre_licence",
    "viewingcentre": "viewing_centre_licence",
    "quarry-permit": "quarry_permit",
    "quarry": "quarry_permit",
    "mining": "quarry_permit",
    "street-naming": "street_naming",
    "street": "street_naming",
    "kiosk-licence": "kiosk_licence",
    "kiosk": "kiosk_licence",
    "booth": "kiosk_licence",
  };

  const mappedId = aliasMap[clean] || aliasMap[clean.replace(/_/g, "-")];
  if (mappedId) {
    return services.find((s) => s.id === mappedId);
  }

  return services.find((s) => {
    const sIdClean = s.id.toLowerCase().replace(/_/g, "");
    const targetClean = clean.replace(/_/g, "");
    return (
      s.id.toLowerCase().includes(clean) ||
      clean.includes(s.id.toLowerCase()) ||
      sIdClean.includes(targetClean) ||
      targetClean.includes(sIdClean)
    );
  });
}

const STORAGE_KEY = `${LGA_CONFIG.identity.id}_service_fee_configs`;

export function getInitialServiceFeeConfigs(): ServiceFeeConfig[] {
  return DEFAULT_SERVICES.map((s) => ({
    serviceId: s.id,
    serviceName: s.name,
    category: s.category,
    revenueHead: s.revenueHead,
    fee: s.defaultFee,
    status: "active",
    lastUpdated: "2026-08-16",
  }));
}

export function getServiceFeeConfigs(): ServiceFeeConfig[] {
  if (typeof window === "undefined") {
    return getInitialServiceFeeConfigs();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const initial = getInitialServiceFeeConfigs();
        return initial.map((init) => {
          const found = parsed.find((p: any) => p.serviceId === init.serviceId);
          return found
            ? {
                ...init,
                fee: typeof found.fee === "number" ? found.fee : init.fee,
                status: found.status === "inactive" ? "inactive" : "active",
                lastUpdated: found.lastUpdated || init.lastUpdated,
              }
            : init;
        });
      }
    }
  } catch (e) {
    console.error("Error loading service fee configs", e);
  }
  const initial = getInitialServiceFeeConfigs();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

export function getConfiguredFeeForService(serviceId: string): number {
  const configs = getServiceFeeConfigs();
  const found = configs.find((c) => c.serviceId === serviceId);
  if (found && typeof found.fee === "number") {
    return found.fee;
  }
  const svc = getServiceById(serviceId);
  return svc ? svc.defaultFee : 0;
}

export function saveServiceFeeConfig(
  serviceId: string,
  fee: number,
  status: "active" | "inactive"
): ServiceFeeConfig[] {
  const current = getServiceFeeConfigs();
  const updated = current.map((item) => {
    if (item.serviceId === serviceId) {
      return {
        ...item,
        fee: Math.max(0, Number(fee)),
        status,
        lastUpdated: new Date().toISOString().slice(0, 10),
      };
    }
    return item;
  });

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(`${LGA_CONFIG.identity.id}:service-fees-change`, { detail: updated }));
    } catch (e) {
      console.error("Error saving service fee configs", e);
    }
  }
  return updated;
}

export function toggleServiceFeeStatus(serviceId: string): ServiceFeeConfig[] {
  const current = getServiceFeeConfigs();
  const target = current.find((c) => c.serviceId === serviceId);
  const newStatus = target?.status === "active" ? "inactive" : "active";
  return saveServiceFeeConfig(serviceId, target ? target.fee : 0, newStatus);
}

export function resetServiceFeeToDefault(serviceId: string): ServiceFeeConfig[] {
  const svc = getServiceById(serviceId);
  if (!svc) return getServiceFeeConfigs();
  return saveServiceFeeConfig(serviceId, svc.defaultFee, "active");
}
