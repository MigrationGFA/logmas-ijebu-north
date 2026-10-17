/**
 * Central Local Government Area (LGA) Configuration
 * 
 * Single source of truth for all local government-specific parameters, branding,
 * leadership, contact channels, statutory text, certificate naming, verification,
 * and template assets.
 * 
 * TO ONBOARD A NEW LGA:
 * Simply update this configuration object (or provide environment overrides).
 * All services, certificate layouts, public verification routes, site chrome,
 * forms, and marketing pages will adapt automatically.
 */

export interface LgaIdentityConfig {
  /** Unique system identifier / slug (e.g. "odeda", "ikeja", "abeokuta-north") */
  id: string;
  /** Primary common name (e.g. "Odeda") */
  name: string;
  /** Full official government entity name (e.g. "Odeda Local Government") */
  fullName: string;
  /** Formal administrative title (e.g. "Odeda Local Government Area") */
  formalTitle: string;
  /** Official council authority name (e.g. "Odeda Local Government Council") */
  councilName: string;
  /** Short abbreviation code used in identifiers (e.g. "ODE") */
  shortCode: string;
  /** Official acronym (e.g. "ODLG") */
  acronym: string;
  /** State name including 'State' (e.g. "Ogun State") */
  state: string;
  /** State short name (e.g. "Ogun") */
  stateShort: string;
  /** Country of jurisdiction (e.g. "Nigeria") */
  country: string;
  /** Geopolitical administrative zone (e.g. "South West") */
  geopoliticalZone: string;
  /** Official government motto or slogan */
  motto: string;
  /** Founding or creation year */
  establishedYear: number | string;
  /** Principal establishing legal authority / edict */
  establishingLaw: string;
  /** Geographic headquarters town (e.g. "Odeda") */
  headquarters: string;
}

export interface LgaExecutiveLeadership {
  chairman: {
    name: string;
    honorific?: string;
    title: string;
    fullTitle: string;
    signatureImagePath: string;
    portraitImagePath: string;
    officeEmail?: string;
    tenureNote?: string;
  };
  viceChairman?: {
    name: string;
    title: string;
  };
  secretary?: {
    name: string;
    title: string;
  };
  treasurer?: {
    name: string;
    title: string;
  };
  headOfLocalGovAdmin?: {
    name: string;
    title: string;
  };
  councillor?: {
    name: string;
    title: string;
  };
}

export interface LgaContactConfig {
  phone: string;
  phoneRaw: string;
  phoneTel: string;
  altPhone: string;
  altPhoneRaw: string;
  emergencyPhone: string;
  email: string;
  emailMailto: string;
  supportEmail: string;
  chairmanEmail: string;
  revenueEmail: string;
  secretariatAddress: string;
  shortAddress: string;
  officeHours: string;
  operatingDays: string;
  weekendHours: string;
  portalUrl: string;
  helpdeskTitle: string;
  socials: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
  };
}

export interface LgaVerificationConfig {
  /** Domain host for citizen QR verification scans */
  domain: string;
  /** Fully qualified public verification URL endpoint */
  verifyUrl: string;
  /** Canonical certificate view route */
  publicLookupUrl: string;
  /** Statutory confirmation text displayed upon successful lookup */
  verificationMessage: string;
  /** Public explanatory subtitle */
  publicVerificationNotice: string;
  /** Security and anti-fraud seal statement */
  securedBadgeText: string;
  /** Disclaimer on computer-generated credentials */
  disclaimer: string;
}

export interface LgaCertificateConfig {
  /** Standardized prefixes for document numbering */
  namingConventions: {
    originPrefix: string;
    clubPrefix: string;
    generalPrefix: string;
    permitPrefix: string;
    receiptPrefix: string;
    invoicePrefix: string;
    applicationPrefix: string;
    verificationPrefix: string;
  };
  /** Master background templates */
  templates: {
    portrait: {
      id: string;
      name: string;
      defaultTitle: string;
      backgroundImage: string;
    };
    landscape: {
      id: string;
      name: string;
      defaultTitle: string;
      backgroundImage: string;
    };
    receipt: {
      id: string;
      name: string;
      defaultTitle: string;
      backgroundImage: string;
    };
  };
  /** Standard statutory phrases, legal edicts, and footer banners */
  legalWording: {
    statutoryLawNotice: string;
    originPreamble: string;
    clubPreamble: string;
    receiptNotice: string;
    footerBannerText: string;
    citizenDeclaration: string;
  };
}

export interface LgaBrandingConfig {
  logoPath: string;
  councilEmblemPath: string;
  stateEmblemPath: string;
  nationalEmblemPath: string;
  faviconPath: string;
  appTitle: string;
  appDescription: string;
}

export interface LgaWardConfig {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface LgaContentConfig {
  /** Homepage "at a glance" statistics */
  stats: {
    landArea: string;
    landAreaTrend: string;
    primarySector: string;
    primarySectorTrend: string;
  };
  /** Citizen testimonials on the marketing pages */
  testimonials: { name: string; role: string; quote: string }[];
  /** News / announcement teasers */
  news: { date: string; tag: string; title: string }[];
  /** Decorative ward map dataset (positions are relative 0-100 coordinates) */
  wardsInfo: {
    name: string;
    x: number;
    y: number;
    population: string;
    feature: string;
    accent: string;
  }[];
  /** Careers / vacancies listings */
  careers: {
    id: string;
    title: string;
    dept: string;
    location: string;
    type: string;
    deadline: string;
  }[];
  /** Photo gallery captions */
  gallery: { id: string; title: string; category: string; image: string }[];
  /** Investment promotion cards */
  investOpps: {
    title: string;
    sector: string;
    location: string;
    desc: string;
    icon: string;
    roi: string;
  }[];
  /** Tourism / heritage cards */
  tourism: {
    title: string;
    location: string;
    category: string;
    desc: string;
    tag: string;
  }[];
}

export interface LgaPlatformConfig {
  name: string;
  fullName: string;
  version: string;
}

export interface LgaConfiguration {
  platform: LgaPlatformConfig;
  identity: LgaIdentityConfig;
  leadership: LgaExecutiveLeadership;
  contact: LgaContactConfig;
  verification: LgaVerificationConfig;
  certificates: LgaCertificateConfig;
  branding: LgaBrandingConfig;
  wards: LgaWardConfig[];
  content: LgaContentConfig;
}

/**
 * ACTIVE LOCAL GOVERNMENT CONFIGURATION (ODEDA LGA)
 */
export const LGA_CONFIG: LgaConfiguration = {
  platform: {
    name: "LOGMAS",
    fullName: "Local Government Management and Administration System",
    version: "2.0.0",
  },
  identity: {
    id: "odeda",
    name: "Odeda",
    fullName: "Odeda Local Government",
    formalTitle: "Odeda Local Government Area",
    councilName: "Odeda Local Government Council",
    shortCode: "ODE",
    acronym: "ODLG",
    state: "Ogun State",
    stateShort: "Ogun",
    country: "Nigeria",
    geopoliticalZone: "South West",
    motto: "Our People, Our Priority",
    establishedYear: 1976,
    establishingLaw: "Local Government (Establishment) Law of Ogun State, 2006 and other applicable laws.",
    headquarters: "Odeda",
  },

  leadership: {
    chairman: {
      name: "Hon. Dr. Waliat Folasade Adeyemo",
      honorific: "Hon. Dr.",
      title: "Executive Chairman",
      fullTitle: "Executive Chairman\nOdeda Local Government",
      signatureImagePath: "/certificates/signatures/chairman-signature.png",
      portraitImagePath: "/assets/chairman.jpg",
      officeEmail: "chairman@odedalga.com",
      tenureNote: "Executive Chairman, Odeda Local Government Area · Ogun State",
    },
    viceChairman: {
      name: "Hon. Vice Chairman",
      title: "Vice Chairman",
    },
    secretary: {
      name: "Council Secretary",
      title: "Secretary to the Local Government",
    },
    treasurer: {
      name: "Head of Local Government Treasury",
      title: "Council Treasurer",
    },
    headOfLocalGovAdmin: {
      name: "Dr. K. A. Adebisi",
      title: "Head of Local Government Administration (HOLGA)",
    },
    councillor: {
      name: "Hon. Osunnowo Azeez",
      title: "Ward Councillor",
    },
  },

  contact: {
    phone: "+234 80 333 789 71",
    phoneRaw: "+2348033378971",
    phoneTel: "tel:+2348033378971",
    altPhone: "+234 803 373 3155",
    altPhoneRaw: "+2348033733155",
    emergencyPhone: "112",
    email: "info@odedalga.com",
    emailMailto: "mailto:info@odedalga.com",
    supportEmail: "support@odedalga.com",
    chairmanEmail: "chairman@odedalga.com",
    revenueEmail: "revenue@odedalga.com",
    secretariatAddress: "LGA Secretariat, Abeokuta-Ibadan Expressway, Odeda, Ogun State",
    shortAddress: "LGA Secretariat, Odeda, Ogun State",
    officeHours: "Monday - Friday: 8:00 AM - 5:00 PM",
    operatingDays: "Mon - Fri, 8am - 5pm",
    weekendHours: "Closed (Emergency & online services active 24/7)",
    portalUrl: "https://www.odedalga.com",
    helpdeskTitle: "Odeda Council Citizens Helpdesk",
    socials: {
      facebook: "https://facebook.com/odedalga",
      twitter: "https://x.com/odedalga",
      instagram: "https://instagram.com/odedalga",
      youtube: "https://youtube.com/@odedalga",
    },
  },

  verification: {
    domain: "verify.odeda.ogunstate.gov.ng",
    verifyUrl: "https://verify.odeda.ogunstate.gov.ng/verify",
    publicLookupUrl: "https://logmas.gov.ng/certificate",
    verificationMessage: "Authentic certificate issued by Odeda Local Government Secretariat.",
    publicVerificationNotice: "Verify the authenticity of Odeda LGA Certificates of Origin, trade permits, and official receipts.",
    securedBadgeText: "Verified & Active in Council Registry",
    disclaimer: "This certificate is computer generated and does not require further signature. • ðŸ”’ Secure Document",
  },

  certificates: {
    namingConventions: {
      originPrefix: "ODLG/CO",
      clubPrefix: "ODLG/CR",
      generalPrefix: "ODE/CERT",
      permitPrefix: "ODE/PRM",
      receiptPrefix: "ODE/REC",
      invoicePrefix: "INV-ODE",
      applicationPrefix: "ODE-APP",
      verificationPrefix: "VER-ODE",
    },
    templates: {
      landscape: {
        id: "landscape",
        name: "Official Statutory Certificate (Landscape)",
        defaultTitle: "OFFICIAL STATUTORY CERTIFICATE",
        backgroundImage: "/certificates/templates/template.png",
      },
      portrait: {
        id: "portrait",
        name: "Official Portrait Certificate (Deprecated - Standardized on Landscape)",
        defaultTitle: "OFFICIAL STATUTORY CERTIFICATE",
        backgroundImage: "/certificates/templates/club-registration-template.jpg",
      },
      receipt: {
        id: "official_receipt",
        name: "Official Statutory Receipt",
        defaultTitle: "OFFICIAL RECEIPT",
        backgroundImage: "/certificates/templates/receipt-template.jpg",
      },
    },
    legalWording: {
      statutoryLawNotice: "This Certificate is issued in accordance with the provisions of the Local Government (Establishment) Law of Ogun State, 2006 and other applicable laws.",
      originPreamble: "This is to certify that the applicant named below has fulfilled all statutory requirements and is confirmed a bonafide indigene of Odeda Local Government Area, Ogun State, Nigeria.",
      clubPreamble: "This is to certify that the organization named below has satisfied statutory requirements and is officially registered under the Community Development regulations of Odeda Local Government Authority.",
      receiptNotice: "Official Council Revenue Settlement • Audited and Secured by Local Government Treasury.",
      footerBannerText: "ODEDA LOCAL GOVERNMENT - OUR PEOPLE, OUR PRIORITY",
      citizenDeclaration: "I solemnly declare that the information provided in this statutory application is true, authentic, and accurate. I understand that false statements or forged documentation incur criminal liability and automatic nullification under Local Government bye-laws.",
    },
  },

  branding: {
    logoPath: "/logo.png",
    councilEmblemPath: "/images/odeda-crest.png",
    stateEmblemPath: "/images/ogun-crest.png",
    nationalEmblemPath: "/images/nigeria-crest.png",
    faviconPath: "/favicon.ico",
    appTitle: "LOGMAS Odeda",
    appDescription: "Local Government Management and Administration System for Odeda Local Government Area",
  },

  wards: [
    { id: "ward-1", name: "Ward 1 (Odeda Secretariat)", code: "W01", description: "Odeda Central Administrative Ward" },
    { id: "ward-2", name: "Ward 2 (Osiele Market)", code: "W02", description: "Commercial Market Corridor" },
    { id: "ward-3", name: "Ward 3 (Obantoko Corridor)", code: "W03", description: "Urban Residential District" },
    { id: "ward-4", name: "Ward 4 (Alagbagba)", code: "W04", description: "Agricultural and Settlement Area" },
    { id: "ward-5", name: "Ward 5 (Ilugun)", code: "W05", description: "Historic Farming Community" },
    { id: "ward-6", name: "Ward 6 (Opeji)", code: "W06", description: "Quarry and Agro-Corridor" },
    { id: "ward-7", name: "Ward 7 (Itesi / Camp)", code: "W07", description: "Educational and Residential Hub" },
    { id: "ward-8", name: "Ward 8 (Kuto / Border)", code: "W08", description: "Border Commercial Corridor" },
    { id: "ward-9", name: "Ward 9 (Boluwaji)", code: "W09", description: "Rural Development Zone" },
    { id: "ward-10", name: "Ward 10 (Obete)", code: "W10", description: "Eastern Farming Communities" },
  ],

  content: {
    stats: {
      landArea: "1,560 km2",
      landAreaTrend: "Agricultural Hub",
      primarySector: "Quarry & Farming",
      primarySectorTrend: "#1 Granite & Cassava",
    },

    testimonials: [
      {
        name: "Farmer Samuel Adebiyi",
        role: "Cassava Producer, Osiele Ward",
        quote:
          "Registering my agricultural farm and getting my certificate was fast and smooth on LOGMAS.",
      },
      {
        name: "Mrs. Toyin Ogunyemi",
        role: "Business Owner, Obantoko",
        quote: "I paid my trade permit and liquor licence online and received my QR receipt instantly.",
      },
      {
        name: "Engr. Timothy Olalere",
        role: "Quarry Operator",
        quote: "LOGMAS makes haulage and quarry permit payments transparent for our fleet drivers.",
      },
    ],

    news: [
      {
        date: "12 May 2026",
        tag: "Announcement",
        title: "Odeda LOGMAS Service Expansion Portal Goes Live Across All 10 Wards",
      },
    ],

    careers: [
      {
        id: "1",
        title: "Revenue Collection Officer",
        dept: "Finance & Treasury",
        location: "Odeda Secretariat",
        type: "Full-Time",
        deadline: "30 Sep 2026",
      },
      {
        id: "2",
        title: "Environmental Health Inspector",
        dept: "Health & Sanitation",
        location: "Obantoko Ward",
        type: "Full-Time",
        deadline: "04 Oct 2026",
      },
      {
        id: "3",
        title: "Agricultural Extension Officer",
        dept: "Agriculture",
        location: "Osiele / Alagbagba",
        type: "Full-Time",
        deadline: "12 Oct 2026",
      },
    ],

    wardsInfo: [
      {
        name: "Odeda",
        x: 50,
        y: 42,
        population: "38,400",
        feature: "LGA headquarters & administrative council secretariat",
        accent: "primary",
      },
      {
        name: "Obantoko",
        x: 36,
        y: 30,
        population: "45,900",
        feature: "Major urban commercial center & residential hub",
        accent: "success",
      },
      {
        name: "Ilugun",
        x: 64,
        y: 32,
        population: "24,200",
        feature: "Agricultural & timber belt community",
        accent: "gold",
      },
      {
        name: "Balogun Itesi",
        x: 72,
        y: 52,
        population: "19,800",
        feature: "Rural farming settlements & cassava production",
        accent: "info",
      },
      {
        name: "Alagbagba",
        x: 28,
        y: 56,
        population: "18,300",
        feature: "Granite quarry sites & haulage route",
        accent: "success",
      },
      {
        name: "Osiele",
        x: 44,
        y: 68,
        population: "36,700",
        feature: "Educational corridor & Federal College of Education area",
        accent: "warning",
      },
      {
        name: "Alabata",
        x: 80,
        y: 74,
        population: "21,600",
        feature: "Poultry, livestock & cassava processing zone",
        accent: "warning",
      },
      {
        name: "Olodo",
        x: 20,
        y: 18,
        population: "26,800",
        feature: "Farming communities & feeder road connectivity",
        accent: "primary",
      },
      {
        name: "Obete",
        x: 60,
        y: 16,
        population: "22,400",
        feature: "Rural settlement cluster & agro-processing zone",
        accent: "gold",
      },
      {
        name: "Opeji",
        x: 82,
        y: 36,
        population: "17,900",
        feature: "Forest-edge settlement & export crop production",
        accent: "info",
      },
    ],

    gallery: [
      { id: "1", title: "Odeda Local Government Secretariat Complex", category: "Infrastructure", image: "/assets/banner5.png" },
      { id: "2", title: "Osiele Modern Market Opening", category: "Commerce", image: "/assets/banner2.png" },
      { id: "3", title: "Quarry Inspection & Mining Facilities", category: "Industry", image: "/assets/banner1.png" },
    ],

    investOpps: [
      {
        title: "Granite & Quarry Mining Expansion",
        sector: "Solid Minerals",
        location: "Alagbagba & Ilugun Wards",
        desc: "High yield granite reserves with direct proximity to Abeokuta-Lagos expressways.",
        icon: "Pickaxe",
        roi: "23%",
      },
      {
        title: "Commercial Cassava Processing Plants",
        sector: "Agro-Allied Industry",
        location: "Odeda & Olugbo Wards",
        desc: "Abundant cassava farm supply for ethanol, starch, and flour production.",
        icon: "Sprout",
        roi: "19%",
      },
      {
        title: "Student Housing & Estate Development",
        sector: "Real Estate",
        location: "Camp / FUNAAB Corridor",
        desc: "High demand for modern student apartments and commercial shopping complexes.",
        icon: "Building2",
        roi: "17%",
      },
    ],

    tourism: [
      {
        title: "Arakanga Forest Reserve & Eco-Park",
        location: "Odeda Local Government Area",
        category: "Eco-Tourism",
        desc: "Lush tropical vegetation, wildlife conservation, and serene hiking trails.",
        tag: "Eco-Tourism",
      },
      {
        title: "Olugbo Traditional Chieftaincy Heritage",
        location: "Olugbo Ward",
        category: "Cultural Heritage",
        desc: "Rich ancestral Yoruba history and traditional festivals.",
        tag: "Culture",
      },
    ],
  },
};

/**
 * Convenient helper utilities to format document numbers based on the active LGA configuration.
 */
export function formatLgaCertificateNumber(
  type: "origin" | "club" | "general" | "permit",
  uniqueSeq: string
): string {
  const currentYear = new Date().getFullYear();
  const cleanSeq = uniqueSeq.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  switch (type) {
    case "origin":
      return `${LGA_CONFIG.certificates.namingConventions.originPrefix}/${currentYear}/${cleanSeq}`;
    case "club":
      return `${LGA_CONFIG.certificates.namingConventions.clubPrefix}/${currentYear}/CLUB/${cleanSeq.slice(0, 5)}`;
    case "permit":
      return `${LGA_CONFIG.certificates.namingConventions.permitPrefix}/${currentYear}/${cleanSeq}`;
    case "general":
    default:
      return `${LGA_CONFIG.certificates.namingConventions.generalPrefix}/${currentYear}/${cleanSeq}`;
  }
}

export function formatLgaApplicationNumber(uniqueSeq: string): string {
  const cleanSeq = uniqueSeq.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return `${LGA_CONFIG.certificates.namingConventions.applicationPrefix}-${cleanSeq}`;
}

export function formatLgaReceiptNumber(uniqueSeq: string): string {
  const currentYear = new Date().getFullYear();
  const cleanSeq = uniqueSeq.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return `${LGA_CONFIG.certificates.namingConventions.receiptPrefix}/${currentYear}/${cleanSeq}`;
}

export function formatLgaInvoiceNumber(uniqueSeq: string): string {
  const currentYear = new Date().getFullYear();
  const cleanSeq = uniqueSeq.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return `${LGA_CONFIG.certificates.namingConventions.invoicePrefix}-${currentYear}-${cleanSeq}`;
}

export function getLgaVerificationUrl(codeOrToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || LGA_CONFIG.verification.verifyUrl;
  if (baseUrl.includes("/verify")) {
    return `${baseUrl}?code=${encodeURIComponent(codeOrToken)}`;
  }
  return `${baseUrl.replace(/\/$/, "")}/verify?code=${encodeURIComponent(codeOrToken)}`;
}

export function getLgaCertificateUrl(certificateNumberOrToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || LGA_CONFIG.verification.publicLookupUrl;
  return `${baseUrl.replace(/\/$/, "")}/certificate/${encodeURIComponent(certificateNumberOrToken)}`;
}

/**
 * List of ward names for dropdowns and select components
 */
export const LGA_WARD_NAMES = LGA_CONFIG.wards.map((w) => w.name);

