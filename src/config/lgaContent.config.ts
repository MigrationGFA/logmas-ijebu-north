import { LGA_CONFIG } from "@/config/lga.config";
import chairmanPhoto from "@/assets/chairman.jpg";

export const STATS = [
  { label: "Land Area", value: "1,560 km2", trend: "Agricultural Hub" },
  { label: "Established", value: String(LGA_CONFIG.identity.establishedYear), trend: LGA_CONFIG.identity.state },
  { label: "Primary Economic Sector", value: "Quarry & Farming", trend: "#1 Granite & Cassava" },
];

export const SERVICES = [
  {
    icon: "FileBadge",
    title: "State of Origin",
    desc: `Apply, pay and download your ${LGA_CONFIG.identity.name} LGA indigene certificate online with QR verification.`,
    color: "primary",
  },
  {
    icon: "Sprout",
    title: "Farmers Registration",
    desc: "Register agricultural holdings, poultry, livestock, and crop farmlands.",
    color: "success",
  },
  {
    icon: "Truck",
    title: "Haulage & Transit Fees",
    desc: "Haulage operators can settle granite, timber, and produce haulage fees online.",
    color: "info",
  },
  {
    icon: "Home",
    title: "Tenement Rate",
    desc: "Assess, view, and pay property rates for residential and commercial premises.",
    color: "warning",
  },
  {
    icon: "Pickaxe",
    title: "Quarry Fees & Permits",
    desc: "Obtain operating permits and pay extraction levies for quarry sites.",
    color: "gold",
  },
  {
    icon: "MessageSquare",
    title: "Complaints & Feedback",
    desc: `Raise concerns directly with ${LGA_CONFIG.identity.fullName} council officers.`,
    color: "primary",
  },
];

export const TESTIMONIALS = [
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
    role: `Quarry Operator, ${LGA_CONFIG.wards[0]?.name || "Ward 1"}`,
    quote:
      "LOGMAS makes haulage and quarry permit payments transparent for our fleet drivers.",
  },
];

export const NEWS = [
  {
    date: "12 May 2026",
    tag: "Announcement",
    title: `${LGA_CONFIG.identity.name} LOGMAS Service Expansion Portal Goes Live Across All ${LGA_CONFIG.wards.length} Wards`,
  },
];

export interface ApplicationRecord {
  id: string;
  applicant: string;
  dob: string;
  gender: "Male" | "Female";
  address: string;
  lga: string;
  ward: string;
  phone: string;
  email: string;
  photoUrl?: string;
  type: string;
  serviceId?: string;
  status: "pending" | "review" | "approved" | "declined" | "returned_for_correction";
  paymentStatus: "paid" | "unpaid";
  receiptNumber?: string;
  amount: number;
  date: string;
  history: { date: string; event: string }[];
  remarks?: string;
}

export const APPLICATIONS: ApplicationRecord[] = [
  {
    id: "APP-ODE-9821",
    applicant: "Adebayo Ogunleye",
    dob: "1988-04-12",
    gender: "Male",
    address: "15 the LGA Secretariat Road",
    lga: "the LGA",
    ward: "the LGA",
    phone: "+2348012345678",
    email: "adebayo@example.com",
    type: "State of Origin",
    serviceId: "certificate_of_origin",
    status: "pending",
    paymentStatus: "paid",
    receiptNumber: "RCT-20260508-ODE1",
    amount: 3500,
    date: "2026-05-08",
    history: [
      { date: "2026-05-08", event: "Application submitted" },
      { date: "2026-05-08", event: "Payment confirmed (N3,500)" },
    ],
  },
  {
    id: "APP-ODE-9820",
    applicant: "Obantoko Progressive Club",
    dob: "1992-11-03",
    gender: "Female",
    address: "8 Obantoko Express Way",
    lga: "the LGA",
    ward: "Obantoko",
    phone: "+2348022345678",
    email: "obantokoclub@example.com",
    type: "Certificate of Club Registration",
    serviceId: "club_registration",
    status: "approved",
    paymentStatus: "paid",
    receiptNumber: "RCT-20260507-ODE2",
    amount: 15000,
    date: "2026-05-07",
    history: [
      { date: "2026-05-07", event: "Application submitted" },
      { date: "2026-05-07", event: "Inspection completed" },
      { date: "2026-05-07", event: "Approved by LGA Admin" },
    ],
  },
];

export const LEADERSHIP = [
  {
    name: LGA_CONFIG.leadership.chairman.name,
    role: LGA_CONFIG.leadership.chairman.title,
    bio: `Leading ${LGA_CONFIG.identity.fullName} with a vision for purposeful, people-centred governance, digital transformation, agricultural empowerment, and infrastructure growth across all ${LGA_CONFIG.wards.length} wards.`,
    initials: LGA_CONFIG.leadership.chairman.name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("") || "WA",
    accent: "primary",
    image: chairmanPhoto,
    party: "All Progressives Congress (APC)",
    email: LGA_CONFIG.contact.email,
  },
  {
    name: "Hon. Vice Chairman",
    role: "Vice Chairman",
    bio: `Overseeing social development, health, and women empowerment initiatives in ${LGA_CONFIG.identity.formalTitle}.`,
    initials: "VC",
    accent: "gold",
    email: `vicechairman@${LGA_CONFIG.contact.email.split("@")[1] || "lga.gov.ng"}`,
  },
  {
    name: "Secretary to Local Government",
    role: "Secretary to Local Government",
    bio: "Coordinates council administration and inter-departmental policy implementation.",
    initials: "SLG",
    accent: "info",
    email: `secretary@${LGA_CONFIG.contact.email.split("@")[1] || "lga.gov.ng"}`,
  },
  {
    name: LGA_CONFIG.leadership.headOfLocalGovAdmin?.name || "Head of Local Government Administration",
    role: "HOLGA",
    bio: `Directs civil service operations and public administration in ${LGA_CONFIG.identity.formalTitle}.`,
    initials: "HL",
    accent: "success",
    email: `holga@${LGA_CONFIG.contact.email.split("@")[1] || "lga.gov.ng"}`,
  },
  {
    name: "Council Treasurer",
    role: "Treasurer",
    bio: "Manages public finance, revenue heads, and fiscal compliance.",
    initials: "CT",
    accent: "warning",
    email: `treasurer@${LGA_CONFIG.contact.email.split("@")[1] || "lga.gov.ng"}`,
  },
];

export const WARDS_INFO: {
  name: string;
  x: number;
  y: number;
  population: string;
  feature: string;
  accent: string;
}[] = [
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
];

export const CAREERS = [
  {
    id: "1",
    title: "Revenue Collection Officer",
    dept: "Finance & Treasury",
    location: `${LGA_CONFIG.identity.name} Secretariat`,
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
];

export const DEPARTMENTS = [
  { name: "Finance & Budget", head: "HOD Finance", icon: "Calculator", desc: "Oversees revenue, budget allocation, and tax administration." },
  { name: "Works & Housing", head: "HOD Works", icon: "Building", desc: "Manages municipal infrastructure, roads, and public buildings." },
  { name: "Agricultural Services", head: "HOD Agriculture", icon: "Sprout", desc: "Supports local farmers, livestock, and agro-processing." },
  { name: "Health & Environment", head: "HOD Health", icon: "HeartPulse", desc: "Ensures sanitation, food safety, and primary healthcare." },
  { name: "Education & Social Dev", head: "HOD Education", icon: "GraduationCap", desc: "Supervises primary education, youth, and community affairs." },
];

export const DOWNLOADS = [
  { id: "1", title: `${LGA_CONFIG.identity.formalTitle} Revenue Bye-Law 2026`, type: "Legal & Gazette", size: "2.4 MB", file: "bye-law-2026.pdf" },
  { id: "2", title: "Tenement Rate Assessment Guidelines", type: "Rates & Taxes", size: "1.1 MB", file: "tenement-guidelines.pdf" },
  { id: "3", title: "Quarry & Mining Operations Guidelines", type: "Environmental & Mining", size: "1.8 MB", file: "quarry-guidelines.pdf" },
  { id: "4", title: "State of Origin Application Form PDF", type: "Civic Services", size: "850 KB", file: "origin-form.pdf" },
];

export const FAQS = [
  { question: `How do I apply for State of Origin in ${LGA_CONFIG.identity.formalTitle}?`, answer: "Navigate to Services Catalogue, select State of Origin, fill in ancestral details, upload required documents, and complete online payment." },
  { question: `What is the fee for Tenement Rate in ${LGA_CONFIG.identity.name}?`, answer: "Tenement rates vary based on property classification (Residential, Commercial, Industrial). You can calculate and pay directly on the portal." },
  { question: "How do haulage drivers pay transit fees?", answer: "Haulage drivers or dispatch officers generate instant transit passes via the Haulage Fees service page and present the QR receipt at inspection points." },
  { question: "Can I verify an issued certificate?", answer: `Yes, all ${LGA_CONFIG.identity.formalTitle} certificates and licences contain a unique QR code and verification token that can be verified online instantly.` },
];

export const GALLERY = [
  { id: "1", title: `${LGA_CONFIG.identity.fullName} Secretariat Complex`, category: "Infrastructure", image: "/assets/banner5.png" },
  { id: "2", title: "Osiele Modern Market Opening", category: "Commerce", image: "/assets/banner2.png" },
  { id: "3", title: "Quarry Inspection & Mining Facilities", category: "Industry", image: "/assets/banner1.png" },
];

export const INVEST_OPPS = [
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
    location: `${LGA_CONFIG.identity.name} & Olugbo Wards`,
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
];

export const TOURISM = [
  {
    title: "Arakanga Forest Reserve & Eco-Park",
    location: LGA_CONFIG.identity.formalTitle,
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
];
