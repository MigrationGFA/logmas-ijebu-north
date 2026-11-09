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
  /** Unique system identifier / slug (e.g. "ijebu-north-east", "ikeja", "abeokuta-north") */
  id: string;
  /** Primary common name (e.g. "Ijebu North East") */
  name: string;
  /** Full official government entity name (e.g. "Ijebu North East Local Government") */
  fullName: string;
  /** Formal administrative title (e.g. "Ijebu North East Local Government Area") */
  formalTitle: string;
  /** Official council authority name (e.g. "Ijebu North East Local Government Council") */
  councilName: string;
  /** Short abbreviation code used in identifiers (e.g. "INE") */
  shortCode: string;
  /** Official acronym (e.g. "INELG") */
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
  /** Geographic headquarters town (e.g. "Atan") */
  headquarters: string;
}

export interface LgaCouncillor {
  /** Ward the councillor represents (must match a ward name in `wards`) */
  ward: string;
  /** Full name including honorific (e.g. "Hon. Osibanjo Adeleke Solomon") */
  name: string;
  /** Public contact phone */
  phone: string;
  /** Public contact email */
  email: string;
  /**
   * Optional council role within the ward / council.
   * e.g. "Ward Councillor" (default) or "Majority Leader".
   */
  role?: string;
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
  /** Generic single-councillor slot (legacy; prefer `councillors`) */
  councillor?: {
    name: string;
    title: string;
  };
  /** Authoritative ward councillor roster (one entry per ward) */
  councillors?: LgaCouncillor[];
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


export interface LgaBankingAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  serviceCode: string;
  status: 'active' | 'inactive';
}

export interface LgaBankingConfig {
  statutory: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode: string;
  };
  services: Record<string, LgaBankingAccount>;
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
  banking: LgaBankingConfig;
  wards: LgaWardConfig[];
  content: LgaContentConfig;
}

/**
 * ACTIVE LOCAL GOVERNMENT CONFIGURATION (IJEBU NORTH EAST LGA)
 */
export const LGA_CONFIG: LgaConfiguration = {
  platform: {
    name: "LOGMAS",
    fullName: "Local Government Management and Administration System",
    version: "2.0.0",
  },
  identity: {
    id: "ijebu-north-east",
    name: "Ijebu North East",
    fullName: "Ijebu North East Local Government",
    formalTitle: "Ijebu North East Local Government Area",
    councilName: "Ijebu North East Local Government Council",
    shortCode: "INE",
    acronym: "INELG",
    state: "Ogun State",
    stateShort: "Ogun",
    country: "Nigeria",
    geopoliticalZone: "South West",
    motto: "Transparency, Service & Progress",
    establishedYear: 1996,
    establishingLaw: "Ogun State Local Government Creation Edict, 1996",
    headquarters: "Atan",
  },

  leadership: {
    chairman: {
      name: "Hon. Folusho Joseph Badejo",
      honorific: "Hon.",
      title: "Executive Chairman",
      fullTitle: "Hon. Folusho Joseph Badejo\nExecutive Chairman, Ijebu North East Local Government",
      signatureImagePath: "/certificates/signatures/chairman-signature.png",
      portraitImagePath: "/assets/chairman.jpg",
      officeEmail: "folushobadejo@yahoo.com",
      tenureNote: "Executive Chairman, Ijebu North East Local Government Area · Ogun State",
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
      name: "Head of Local Government Administration",
      title: "Head of Local Government Administration (HOLGA)",
    },
    councillors: [
      {
        ward: "Atan-Imuku",
        name: "Hon. Osibanjo Adeleke Solomon",
        phone: "08038355995",
        email: "osibanjoadeleke@gmail.com",
        role: "Ward Councillor",
      },
      {
        ward: "Odosimadegun/Odosenbora",
        name: "Hon. Falujo Adeola Onabode",
        phone: "08033313041",
        email: "falujoonabode@gmail.com",
        role: "Ward Councillor",
      },
      {
        ward: "Imomo/Ododeyo/Imewuro",
        name: "Hon. Ogunmosu Olabode Clement",
        phone: "08038556949",
        email: "Ogunmosubode@gmail.com",
        role: "Ward Councillor",
      },
      {
        ward: "Odosenlu/Okeolowu/Alaro",
        name: "Hon. Adekogbe Ayodele Samson",
        phone: "08100973778",
        email: "aykogbe@gmail.com",
        role: "Ward Councillor",
      },
      {
        ward: "Igede/Itamarun",
        name: "Hon. Okulaja Emmanuel Abiodun",
        phone: "07033726911",
        email: "okulajaabiodun85@gmail.com",
        role: "Ward Councillor",
      },
      {
        ward: "Oju Ona",
        name: "Hon. Odufuwa Tosin Victor",
        phone: "08080217611",
        email: "emtosproperties@gmail.com",
        role: "Majority Leader",
      },
      {
        ward: "Isonyin/Apunren",
        name: "Hon. Jagunna Olufunmilayo Janet",
        phone: "07064317581",
        email: "jagunnafunmilola@gmail.com",
        role: "Ward Councillor",
      },
      {
        ward: "Ilese Ijebu",
        name: "Hon. Adeiye Oriyomi Ajoke",
        phone: "08123100146",
        email: "oriyomiadeiye14@gmail.com",
        role: "Ward Councillor",
      },
      {
        ward: "Ogbogbo Oke Eri",
        name: "Hon. Parakoyi Azeez Ayomide",
        phone: "08072703321",
        email: "parakoyiazeez@gmail.com",
        role: "Ward Councillor",
      },
      {
        ward: "Erunwon",
        name: "Hon. Osunnowo Azeez Olajide",
        phone: "07061088375",
        email: "osunnowoazeez454@gmail.com",
        role: "Ward Councillor",
      },
    ],
  },

  contact: {
    phone: "+234 803 373 3155",
    phoneRaw: "+2348033733155",
    phoneTel: "tel:+2348033733155",
    altPhone: "+234 803 373 3155",
    altPhoneRaw: "+2348033733155",
    emergencyPhone: "112",
    email: "info@ijebunortheastlga.com.ng",
    emailMailto: "mailto:info@ijebunortheastlga.com.ng",
    supportEmail: "support@ijebunortheastlga.com.ng",
    chairmanEmail: "folushobadejo@yahoo.com",
    revenueEmail: "revenue@ijebunortheastlga.com.ng",
    secretariatAddress: "LGA Secretariat, Atan, Ijebu North East, Ogun State",
    shortAddress: "LGA Secretariat, Atan, Ogun State",
    officeHours: "Monday - Friday: 8:00 AM - 5:00 PM",
    operatingDays: "Mon - Fri, 8am - 5pm",
    weekendHours: "Closed (Emergency & online services active 24/7)",
    portalUrl: "https://www.ijebunortheastlga.com.ng",
    helpdeskTitle: "Ijebu North East Council Citizens Helpdesk",
    socials: {
      facebook: "https://facebook.com/ijebunortheastlga",
      twitter: "https://x.com/ijebunortheastlga",
      instagram: "https://instagram.com/ijebunortheastlga",
      youtube: "https://youtube.com/@ijebunortheastlga",
    },
  },

  verification: {
    domain: "verify.ijebunortheastlga.com.ng",
    verifyUrl: "https://verify.ijebunortheastlga.com.ng/verify",
    publicLookupUrl: "https://www.ijebunortheastlga.com.ng/certificate",
    verificationMessage: "Authentic certificate issued by Ijebu North East Local Government Secretariat.",
    publicVerificationNotice: "Verify the authenticity of Ijebu North East LGA Certificates of Origin, trade permits, and official receipts.",
    securedBadgeText: "Verified & Active in Council Registry",
    disclaimer: "This certificate is computer generated and does not require further signature. • ðŸ”’ Secure Document",
  },

  certificates: {
    namingConventions: {
      originPrefix: "INE/CO",
      clubPrefix: "INE/CR",
      generalPrefix: "INE/CERT",
      permitPrefix: "INE/PRM",
      receiptPrefix: "INE/REC",
      invoicePrefix: "INV-INE",
      applicationPrefix: "INE-APP",
      verificationPrefix: "VER-INE",
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
      originPreamble: "This is to certify that the applicant named below has fulfilled all statutory requirements and is confirmed a bonafide indigene of Ijebu North East Local Government Area, Ogun State, Nigeria.",
      clubPreamble: "This is to certify that the organization named below has satisfied statutory requirements and is officially registered under the Community Development regulations of Ijebu North East Local Government Authority.",
      receiptNotice: "Official Council Revenue Settlement • Audited and Secured by Local Government Treasury.",
      footerBannerText: "IJEBU NORTH EAST LOCAL GOVERNMENT - TRANSPARENCY, SERVICE & PROGRESS",
      citizenDeclaration: "I solemnly declare that the information provided in this statutory application is true, authentic, and accurate. I understand that false statements or forged documentation incur criminal liability and automatic nullification under Local Government bye-laws.",
    },
  },

  branding: {
    logoPath: "/logo.png",
    councilEmblemPath: "/images/ijebu-north-east-crest.png",
    stateEmblemPath: "/images/ogun-crest.png",
    nationalEmblemPath: "/images/nigeria-crest.png",
    faviconPath: "/favicon.ico",
    appTitle: "IJEBU NORTHEAST PORTAL",
    appDescription:
      "Local Government Management and Administration System for Ijebu North East Local Government Area",
  },

  
    // Dedicated service bank accounts for this LGA. Ported empty from the Ifo
    // implementation on purpose: Ifo's account numbers belong to Ifo. Fill in
    // this LGA's own Providus accounts when GPay issues them.
    banking: {
      statutory: {
        accountName: "",
        accountNumber: "",
        bankName: "Providus Bank Plc",
        bankCode: "000023",
      },
      services: {},
    },

    wards: [
    {
      id: "1dd25f41-d76c-46d6-bf8a-cf47d4981cd9",
      name: "Atan-Imuku",
      code: "INE-01",
      description: "LGA headquarters & civic-secretariat axis",
    },
    {
      id: "3a4cbbdc-6a9a-420e-a405-ac80febe2425",
      name: "Odosimadegun/Odosenbora",
      code: "INE-02",
      description: "Mixed residential and trading ward",
    },
    {
      id: "3b612f5c-3c05-4332-a46a-92fc8f830519",
      name: "Imomo/Ododeyo/Imewuro",
      code: "INE-03",
      description: "Agricultural corridor ward",
    },
    {
      id: "652b0a54-5382-499f-a7d0-c552b012216c",
      name: "Odosenlu/Okeolowu/Alaro",
      code: "INE-04",
      description: "Mixed residential ward belt",
    },
    {
      id: "5e304bbb-cf9b-49c6-a9a6-1bd934f4f54c",
      name: "Igede/Itamarun",
      code: "INE-05",
      description: "Rural farming settlements",
    },
    {
      id: "ad9d983b-376e-48e9-8409-1fc00c87bac9",
      name: "Oju Ona",
      code: "INE-06",
      description: "Urban commercial ward",
    },
    {
      id: "4d093ac0-7e02-47bd-915b-0fe85d2c0f0e",
      name: "Isonyin/Apunren",
      code: "INE-07",
      description: "Renewable-energy and trading corridor",
    },
    {
      id: "5aab4f90-023a-41f3-9bc7-9027d7f006ae",
      name: "Ilese Ijebu",
      code: "INE-08",
      description: "Township residential ward",
    },
    {
      id: "2f04bc56-6d90-4dbf-8e3e-a89cfa4fd217",
      name: "Ogbogbo Oke Eri",
      code: "INE-09",
      description: "Coastal/rural administrative ward",
    },
    {
      id: "da2bd6f7-c823-44e7-9ffa-577044d5c232",
      name: "Erunwon",
      code: "INE-10",
      description: "Historic township perimeter",
    },
  ],

  content: {
    stats: {
      landArea: "137 km2",
      landAreaTrend: "Commerce & Agriculture",
      primarySector: "Trade & Agro-Allied",
      primarySectorTrend: "#1 Market & Distribution Hub",
    },

    testimonials: [
      {
        name: "Farmer Samuel Adebiyi",
        role: "Cassava Producer, Ojowo Ward",
        quote:
          "Registering my agricultural farm and getting my certificate was fast and smooth on LOGMAS.",
      },
      {
        name: "Mrs. Toyin Ogunyemi",
        role: "Business Owner, Atan",
        quote: "I paid my trade permit and liquor licence online and received my QR receipt instantly.",
      },
      {
        name: "Engr. Timothy Olalere",
        role: "Transport Operator, Owu",
        quote: "LOGMAS makes haulage and market permit payments transparent for our fleet drivers.",
      },
    ],

    news: [
      {
        date: "12 May 2026",
        tag: "Announcement",
        title: "Ijebu North East LOGMAS Service Expansion Portal Goes Live Across All Wards",
      },
    ],

    careers: [
      {
        id: "1",
        title: "Revenue Collection Officer",
        dept: "Finance & Treasury",
        location: "Atan Secretariat",
        type: "Full-Time",
        deadline: "30 Sep 2026",
      },
      {
        id: "2",
        title: "Environmental Health Inspector",
        dept: "Health & Sanitation",
        location: "Owu Ward",
        type: "Full-Time",
        deadline: "04 Oct 2026",
      },
      {
        id: "3",
        title: "Agricultural Extension Officer",
        dept: "Agriculture",
        location: "Ojowo / Ososa",
        type: "Full-Time",
        deadline: "12 Oct 2026",
      },
    ],

    wardsInfo: [
    {
      name: "Atan-Imuku",
      x: 50,
      y: 42,
      population: "",
      feature: "LGA headquarters & civic-secretariat axis",
      accent: "primary",
    },
    {
      name: "Odosimadegun/Odosenbora",
      x: 62,
      y: 32,
      population: "",
      feature: "Mixed residential trading hub",
      accent: "secondary",
    },
    {
      name: "Imomo/Ododeyo/Imewuro",
      x: 74,
      y: 34,
      population: "",
      feature: "Agricultural corridor ward",
      accent: "success",
    },
    {
      name: "Odosenlu/Okeolowu/Alaro",
      x: 70,
      y: 56,
      population: "",
      feature: "Mixed residential ward belt",
      accent: "warning",
    },
    {
      name: "Igede/Itamarun",
      x: 38,
      y: 56,
      population: "",
      feature: "Rural farming settlements",
      accent: "secondary",
    },
    {
      name: "Oju Ona",
      x: 86,
      y: 40,
      population: "",
      feature: "Urban commercial ward",
      accent: "primary",
    },
    {
      name: "Isonyin/Apunren",
      x: 90,
      y: 60,
      population: "",
      feature: "Renewable-energy corridor",
      accent: "gold",
    },
    {
      name: "Ilese Ijebu",
      x: 70,
      y: 68,
      population: "",
      feature: "Township residential ward",
      accent: "info",
    },
    {
      name: "Ogbogbo Oke Eri",
      x: 58,
      y: 66,
      population: "",
      feature: "Coastal/rural administrative ward",
      accent: "secondary",
    },
    {
      name: "Erunwon",
      x: 30,
      y: 40,
      population: "",
      feature: "Historic township perimeter",
      accent: "success",
    },
    ],

    gallery: [
      { id: "1", title: "Ijebu North East Local Government Secretariat Complex", category: "Infrastructure", image: "/assets/banner5.png" },
      { id: "2", title: "Atan Modern Market Opening", category: "Commerce", image: "/assets/banner2.png" },
      { id: "3", title: "Road Infrastructure & Public Facilities", category: "Infrastructure", image: "/assets/banner1.png" },
    ],

    investOpps: [
      {
        title: "Agro-Allied Processing Plants",
        sector: "Agro-Allied Industry",
        location: "Ojowo & Ososa Wards",
        desc: "Abundant farm produce supply for starch, flour and food processing production.",
        icon: "Sprout",
        roi: "19%",
      },
      {
        title: "Modern Market & Lockup Development",
        sector: "Commerce",
        location: "Atan & Ojowo Wards",
        desc: "High demand for modern markets, lockup stores and wholesale distribution facilities.",
        icon: "Building2",
        roi: "17%",
      },
      {
        title: "Transport & Haulage Logistics",
        sector: "Transport",
        location: "Owu / Itele Corridor",
        desc: "Strategic location on the Ijebu corridor supports haulage and transit logistics ventures.",
        icon: "Pickaxe",
        roi: "23%",
      },
    ],

    tourism: [
      {
        title: "Atan Market & Civic Square",
        location: "Ijebu North East Local Government Area",
        category: "Commerce & Culture",
        desc: "Vibrant trading centre and civic hub reflecting the commercial life of the area.",
        tag: "Commerce",
      },
      {
        title: "Ijebu Traditional Heritage",
        location: "Ijebu North East",
        category: "Cultural Heritage",
        desc: "Rich ancestral Yoruba history, traditional festivals and chieftaincy heritage.",
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


/**
 * Resolve the bank account a service's payments should be directed to.
 * Dedicated per-service accounts win; everything else falls back to the
 * statutory council revenue account. Ported from the Ifo implementation.
 */
export function getLgaServiceBanking(serviceCodeOrId: string): LgaBankingAccount {
  const code = (serviceCodeOrId || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const map: Record<string, string> = {
    community_development_levy: 'community_development_levy',
    tenement_rate: 'community_development_levy',
    comdevlevy: 'community_development_levy',
    street_naming: 'street_naming',
    strtnamng: 'street_naming',
    baale_registration: 'baale_registration',
    baaleregis: 'baale_registration',
    state_of_origin: 'state_of_origin',
    certificate_of_origin: 'state_of_origin',
    origincer: 'state_of_origin',
    marriage_registration: 'marriage_registration',
    marriage_certificate: 'marriage_registration',
    marriagereg: 'marriage_registration',
    demand_notice: 'demand_notice',
    business_demand_notice: 'demand_notice',
    demandnotic: 'demand_notice',
  };
  const key = map[code];
  if (key && (LGA_CONFIG as any).banking?.services?.[key]) {
    return (LGA_CONFIG as any).banking.services[key];
  }
  return {
    accountName: (LGA_CONFIG as any).banking?.statutory?.accountName || "",
    accountNumber: (LGA_CONFIG as any).banking?.statutory?.accountNumber || "",
    bankName: (LGA_CONFIG as any).banking?.statutory?.bankName || "Providus Bank Plc",
    bankCode: (LGA_CONFIG as any).banking?.statutory?.bankCode || "000023",
    serviceCode: 'STATUTORY',
    status: 'active',
  };
}
