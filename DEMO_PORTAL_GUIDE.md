# DEMO PORTAL DEPLOYMENT & CONVERSION GUIDE (`demo.logmas.com.ng`)

> **Context for AI Agents & Developers in a New Chat Session:**
> This repository is being prepared/converted into a **100% standalone, zero-external-backend presentation demo** hosted at `demo.logmas.com.ng`. 
> It is designed for pitch presentations to executive council chairmen, commissioners, and stakeholders across Nigerian Local Government Areas (e.g., Kosofe LGA, Ikeja LGA, Alimosho LGA, etc.) without relying on a live external backend server.

---

## 1. Executive Overview & Rules

1. **Branding Transition**: Replace all occurrences of "Ijebu North East" with "Demo Local Government Area" / "Demo LGA".
2. **Zero Backend Dependency**: Cut off the external backend completely. The entire application must operate client-side using `localStorage`, React state/React Query, or Next.js route handlers (`app/api/*`).
3. **Seamless Login**: Provide instantaneous demo logins (Citizen, Admin, Revenue Collector, Field Officer, Executive Chairman) with pre-filled buttons—no password recovery or backend authorization hurdles.
4. **Working End-to-End Payment Flow**: Users must be able to apply for any service, generate an invoice, open a simulated payment modal (or Next.js API mock payment), complete payment with test cards/instant button, receive an official PDF-ready receipt, and view the issued certificate.
5. **Vibrant Pre-Seeded Data**: Pre-populate realistic applications, revenue figures, complaints, and certificates so dashboards look active immediately upon opening.

---

## 2. Step 1: Update Central LGA Configuration for Demo

File: `src/config/lga.config.ts`

Replace the active `LGA_CONFIG` export with the following generic Demo LGA configuration:

```typescript
export const LGA_CONFIG: LgaConfiguration = {
  platform: {
    name: "LOGMAS",
    fullName: "Local Government Management and Administration System",
    version: "2.0.0-demo",
  },
  identity: {
    id: "demo",
    name: "Demo",
    fullName: "Demo Local Government",
    formalTitle: "Demo Local Government Area",
    councilName: "Demo Local Government Council",
    shortCode: "DEMO",
    acronym: "DLG",
    state: "Demo State",
    stateShort: "Demo",
    country: "Nigeria",
    geopoliticalZone: "South West",
    motto: "Service, Progress, and Digital Excellence",
    establishedYear: 2026,
    establishingLaw: "Local Government Administration Law & Digital Public Infrastructure Guidelines.",
    headquarters: "Central Council Secretariat, Demo City",
  },

  leadership: {
    chairman: {
      name: "Hon. (Dr.) Adebayo Adeleke",
      honorific: "Hon. (Dr.)",
      title: "Executive Chairman",
      fullTitle: "Executive Chairman\nDemo Local Government Council",
      signatureImagePath: "/certificates/signatures/chairman-signature.png",
      portraitImagePath: "/assets/chairman.jpg",
      officeEmail: "chairman@demo.logmas.com.ng",
      tenureNote: "Executive Chairman, Demo Local Government Council",
    },
    viceChairman: {
      name: "Hon. Fatima Ibrahim",
      title: "Vice Chairman",
    },
    secretary: {
      name: "Chief O. A. Babatunde",
      title: "Secretary to the Local Government",
    },
    headOfAdmin: {
      name: "Dr. K. E. Okonkwo",
      title: "Head of Local Government Administration (HOLGA)",
    },
    treasurer: {
      name: "Mrs. M. O. Danjuma, FCA",
      title: "Council Treasurer",
    },
  },

  contact: {
    address: "Secretariat Complex, Commercial Avenue, Demo City",
    phone: "+234 800 000 3366",
    email: "info@demo.logmas.com.ng",
    website: "https://demo.logmas.com.ng",
    revenueDeskPhone: "+234 800 000 3367",
    supportEmail: "support@logmas.com.ng",
  },

  verification: {
    domain: "demo.logmas.com.ng",
    verifyUrlTemplate: "https://demo.logmas.com.ng/certificate/{token}",
    publicRegistryPath: "/verify",
  },

  wards: [
    { id: "ward_1", name: "Ward 1 - Central Urban", code: "W01" },
    { id: "ward_2", name: "Ward 2 - Commercial District", code: "W02" },
    { id: "ward_3", name: "Ward 3 - East Residential", code: "W03" },
    { id: "ward_4", name: "Ward 4 - West Industrial", code: "W04" },
    { id: "ward_5", name: "Ward 5 - North Heartland", code: "W05" },
    { id: "ward_6", name: "Ward 6 - South Highland", code: "W06" },
  ],

  certificates: {
    templates: {
      landscape: {
        id: "demo_landscape_master",
        name: "Demo LGA Statutory Certificate Master",
        defaultTitle: "OFFICIAL STATUTORY CERTIFICATE",
        backgroundImage: "/certificates/templates/template.png",
      },
      portrait: {
        id: "demo_portrait_master",
        name: "Demo Portrait Certificate",
        defaultTitle: "STATUTORY CERTIFICATE",
        backgroundImage: "/certificates/templates/template.png",
      },
      receipt: {
        id: "demo_receipt_master",
        name: "Demo LGA Official Revenue Receipt",
        defaultTitle: "OFFICIAL LOCAL GOVERNMENT TREASURY RECEIPT",
        backgroundImage: "/assets/receipt_template.png",
      },
    },
    numbering: {
      certificatePrefix: "DEMO-CRT",
      permitPrefix: "DEMO-PMT",
      receiptPrefix: "DEMO-RCP",
      invoicePrefix: "DEMO-INV",
      applicationPrefix: "DEMO-APP",
      verificationPrefix: "DEMO-VRF",
    },
    legalWording: {
      statutoryLawNotice: "Issued under the authority of the Demo Local Government Council Laws.",
      originPreamble: "This is to officially certify that the applicant named herein has satisfied the residency and origin verification requirements of Demo Local Government.",
      certificateSubHeader: "OFFICIAL STATUTORY CERTIFICATE OF REGISTRATION",
      reissueDisclaimer: "Any unauthorized erasure, falsification, or mutilation renders this certificate completely invalid.",
      officialSealNotice: "Valid only with the official security QR watermark and executive electronic signature seal.",
      footerDisclaimer: "This statutory certificate remains the official property of Demo Local Government Council.",
    },
  },

  payment: {
    bankName: "Demo Partner Commercial Bank Plc",
    accountName: "Demo Local Government Consolidated Revenue Account",
    accountNumber: "0123456789",
    currency: "NGN",
    currencySymbol: "₦",
  },
};
```

---

## 3. Step 2: Decouple External API Calls to Client Mock Handlers

### A. Environment Configuration (`src/config/env.ts`)
Set the API base URL to Next.js local internal routes or flag demo mode:

```typescript
export const ENV = {
  API_BASE_URL: "/api/demo",
  IS_DEMO_MODE: true,
  IS_DEV: true,
  IS_PROD: false,
};
```

### B. Axios Mock Interceptor (`src/lib/api.ts`)
Add an interceptor in `src/lib/api.ts` to capture outgoing API calls and serve instant mock responses from `localStorage` or `src/lib/mock-data.ts`:

```typescript
// Enable automatic in-memory mock handler for Demo deployment
axiosInstance.interceptors.request.use(async (config) => {
  if (ENV.IS_DEMO_MODE || config.url?.startsWith("/api/demo")) {
    // Intercept client-side and return synthesized demo response without network failure
    return handleDemoMockRequest(config);
  }
  return config;
});
```

---

## 4. Step 3: Standalone Authentication & One-Click Demo Logins

Modify `src/lib/auth.tsx` (and `src/services/apiAuth.ts`) to provide instant demo login without calling a remote auth microservice:

### Demo Accounts Configuration:
```typescript
export const DEMO_PRESET_USERS = {
  citizen: {
    id: "usr_citizen_001",
    email: "citizen@demo.gov.ng",
    name: "Dr. Babatunde Adeleke",
    role: "citizen",
    phone: "+234 803 123 4567",
    token: "demo_citizen_token_jwt",
  },
  admin: {
    id: "usr_admin_001",
    email: "admin@demo.gov.ng",
    name: "Council Admin Officer",
    role: "admin",
    token: "demo_admin_token_jwt",
  },
  treasurer: {
    id: "usr_treasurer_001",
    email: "treasurer@demo.gov.ng",
    name: "Head of Revenue & Treasury",
    role: "treasurer",
    token: "demo_treasurer_token_jwt",
  },
  chairman: {
    id: "usr_chairman_001",
    email: "chairman@demo.gov.ng",
    name: "Hon. (Dr.) Adebayo Adeleke",
    role: "chairman",
    token: "demo_chairman_token_jwt",
  },
};
```

### One-Click Login Buttons on `/auth/login`
On the login screen (`src/app/auth/login/page.tsx` or similar), add a "Quick Demo Access" card:
- Button 1: **"Log In as Citizen / Applicant"** -> logs in as `citizen@demo.gov.ng`
- Button 2: **"Log In as Council Admin"** -> logs in as `admin@demo.gov.ng`
- Button 3: **"Log In as Revenue Officer / Treasurer"** -> logs in as `treasurer@demo.gov.ng`

---

## 5. Step 4: Self-Contained In-App Payment Simulator

In presentations, the audience wants to see an invoice paid and the certificate instantly issued.

### Payment Flow Logic:
1. Citizen fills any application form (e.g. Street Naming or Club Registration).
2. Application submits into `localStorage` / demo store.
3. System creates an Invoice with status `"PENDING"`.
4. User clicks **"Proceed to Payment"**.
5. Display a simulated checkout modal:
   - Shows Demo LGA Revenue Collection Gateway.
   - Shows Invoice ID (e.g. `DEMO-INV-2026-0042`), Service Title, and Amount (e.g., `₦25,000`).
   - Payment Methods: Card, Bank Transfer, USSD.
   - Pre-populated test card: `4084 0840 8408 4084`, Expiry: `12/28`, CVV: `123`.
   - Big CTA: **"Complete Demo Payment (Simulate Success)"**.
6. When clicked:
   - Invoice updates to `"PAID"`.
   - Treasury Receipt generated (`DEMO-RCP-...`).
   - Certificate status updates to `"APPROVED" / "ISSUED"`.
   - System redirects to the **Certificate Viewer** (`/certificate/[token]`) or gives instant PDF download button.

---

## 6. Step 5: Pre-Seeded Presentation Data

Ensure `src/lib/mock-data.ts` has at least 5 realistic pre-seeded records:
1. **Street Naming**: Approved Street Name *"Chief Obafemi Awolowo Crescent"*, Ward 2.
2. **Club Registration**: *"Rising Stars Youth & Sports Development Club"*, Ward 1.
3. **Certificate of Origin**: *"Babatunde Adeleke"*, Family Compound: *Adeleke Quarter*, Ward 3.
4. **Micro-Trade Kiosk Permit**: *"Alhaji Musa Agro Stores"*, Commercial Ward 2.
5. **Tenement Rate Assessment**: *"Plot 14, Commercial District"*, Assessed: *₦35,000*.

---

## 7. Checklist for Verifying the Demo Deployment

- [ ] Navigating to `/` displays "Demo Local Government Area" with zero mentions of "Ijebu North East".
- [ ] One-click demo login works for Citizen, Admin, and Chairman accounts.
- [ ] Submitting an application saves immediately in browser storage.
- [ ] Simulating payment generates a receipt and issues a statutory certificate.
- [ ] Viewing `/certificate/[token]` renders the landscape certificate with the green ribbon, QR code, and executive signature cleanly.
- [ ] Public verification at `/verify` validates demo certificate tokens successfully.
