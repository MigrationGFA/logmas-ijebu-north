# Certificate Subsystem File Inventory & Architecture

This document provides a comprehensive inventory of every file involved in certificate generation, rendering, coordinate configuration, heraldic security elements, public viewing, download/print flows, and service mapping across the application.

---

## 1. Master File Inventory Table

| Full Relative Path | Description / Role | Current Line Count |
|---|---|---|
| `src/config/certificateFieldConfig.ts` | Master coordinate & layout configuration engine for Portrait and Landscape certificates | 917 lines |
| `src/config/certificateTemplates.ts` | [DEPRECATED] Unused legacy coordinate definitions & duplicate mappings, superseded by canonical config | 815 lines |
| `src/config/certificateTemplateMap.ts` | Service-to-template mapping registry linking statutory service codes to layouts | 213 lines |
| `src/components/certificate/CertificateRenderer.tsx` | Core vector/HTML canvas renderer executing percentage coordinate positioning and container typography | 175 lines |
| `src/components/certificate/CertificateViewer.tsx` | Interactive certificate viewing shell with template switching, zoom, share, print, and PDF download | 327 lines |
| `src/components/certificate/CertificateCanvas.tsx` | Higher-order wrapper automatically resolving service codes to master template configurations | 36 lines |
| `src/components/certificate/templates/CertificateOfOriginTemplate.tsx` | Specialized template wrapper binding certificates to the Portrait master layout | 22 lines |
| `src/components/certificate/templates/ClubRegistrationTemplate.tsx` | Specialized template wrapper binding certificates to the Landscape master layout | 22 lines |
| `src/components/certificate/shared/CertificateSignature.tsx` | [DEPRECATED] Legacy signature block; replaced by config-driven signature image in CertificateRenderer | 65 lines |
| `src/components/certificate/shared/CertificateQRCode.tsx` | Cryptographic verification QR code widget pointing to the official verification endpoint | 39 lines |
| `src/app/certificate/page.tsx` | Public certificate portal landing page with token lookup and verification search | 88 lines |
| `src/app/certificate/[...token]/page.tsx` | Public certificate viewer route supporting slash-safe certificate numbers and tokens | 115 lines |
| `src/app/(dashboard)/dashboard/certificates/page.tsx` | Administrative certificates registry ledger with KPI metrics, filters, and modal preview | 674 lines |
| `src/app/(dashboard)/dashboard/certificate/[id]/page.tsx` | Internal dashboard single-certificate detail and preview view | 209 lines |
| `src/app/(dashboard)/dashboard/certificate/permit/[id]/page.tsx` | Internal dashboard trade permit and business licence viewer | 320 lines |
| `src/types/certificate.ts` | TypeScript contract schema for backend certificates, issuance, and audit trail | 67 lines |
| `src/types/publicCertificate.ts` | Presentation model for rendering certificates, applicants, and verification data | 91 lines |
| `src/services/apiCertificates.ts` | Service for backend certificate endpoints (`/api/v1/certificates` and `/:id`) with parser | 241 lines |
| `src/services/apiPublicCertificate.ts` | Multi-tiered public certificate resolver (backend API, seeded registry, and local cache) | 361 lines |
| `src/services/apiVerification.ts` | Multi-document verification client for certificates, permits, and revenue receipts | 260 lines |
| `src/hooks/queries/useCertificates.ts` | React Query hook for authenticated certificates listing | 33 lines |
| `src/hooks/queries/usePublicCertificate.ts` | React Query hook for public certificate retrieval by token or certificate number | 18 lines |
| `src/lib/certificateTokens.ts` | Hashing, public verification URL generation, and official government date formatters | 71 lines |
| `src/app/globals.css` | Google Fonts imports (`Cinzel`, `EB Garamond`, `Pinyon Script`, etc.) and print styles | 333 lines |
| `src/app/layout.tsx` | Root layout configuring Geist variable fonts and global DOM structure | 42 lines |
| `public/certificates/signatures/chairman-signature.png` | Official signature asset for Executive Chairman Hon. Dr. Waliat Folasade Adeyemo | PNG Asset |
| `public/certificates/templates/origin-template.jpg` | Official blank high-res master portrait artwork (State of Origin & Indigene) | Binary Asset (353 KB) |
| `public/certificates/templates/club-registration-template.jpg` | Official blank high-res master landscape artwork (Clubs, NGOs & Associations) | Binary Asset (356 KB) |
| `public/certificates/templates/receipt-template.jpg` | Official blank high-res revenue receipt master artwork | Binary Asset (514 KB) |

---

## 2. In-Depth Component & File Descriptions

### A. Coordinate & Field Configuration
- **`src/config/certificateFieldConfig.ts`**  
  The primary configuration engine. Defines two complete master templates: `PORTRAIT_TEMPLATE_CONFIG` and `LANDSCAPE_TEMPLATE_CONFIG`. Specifies exact x/y percentage coordinates, bounding boxes (`width`, `height`), text alignments, container-query font sizes (`cqw`), font families, font weights, colors, and dynamic formatters for every field (e.g. LGA title, certificate number, citizen name, ward, date of issuance, and QR code placement).
- **`src/config/certificateTemplates.ts`**  
  Provides alternative and extended coordinate sets (`IJEBU_NORTH_EAST_CERTIFICATE_TEMPLATES`), detailed layout metadata, boundary calibrations, and fallback configurations for Club Registrations and State of Origin certificates.
- **`src/config/certificateTemplateMap.ts`**  
  The routing bridge between statutory services and visual templates. Maps service codes (such as `LG-COO-01`, `LG-CR-01`, `LG-BL-01`) to either `portrait` or `landscape`, defining display titles, categories, and orientation settings.

---

### B. Core Certificate Rendering Engine
- **`src/components/certificate/CertificateRenderer.tsx`**  
  The core rendering canvas. It mounts the official master artwork as an exact-fit background layer (`img`), creates a CSS container query context (`container-type: inline-size`), and renders each data field as an absolutely positioned element based on the percentage coordinates from `certificateFieldConfig.ts`. It also handles cryptographic QR code placement and print color adjustments.
- **`src/components/certificate/CertificateViewer.tsx`**  
  The top-level interactive viewer for certificate display. Features a sticky toolbar with template layout switching (Portrait vs. Landscape), zoom adjustments (70%–130%), one-click link sharing, public verification routing, and twin print/download actions (**"Download PDF"** and **"Print Official"**) with specialized `@media print` CSS rules.
- **`src/components/certificate/CertificateCanvas.tsx`**  
  A lightweight helper component that wraps `CertificateRenderer` and automatically looks up the service code in `certificateTemplateMap.ts` if no custom config is passed.

---

### C. Template Wrappers
- **`src/components/certificate/templates/CertificateOfOriginTemplate.tsx`**  
  A specialized wrapper that binds a `PublicCertificate` object directly to `PORTRAIT_TEMPLATE_CONFIG` for Indigene, Origin, and single-sheet statutory certificates.
- **`src/components/certificate/templates/ClubRegistrationTemplate.tsx`**  
  A specialized wrapper that binds a `PublicCertificate` object to `LANDSCAPE_TEMPLATE_CONFIG` for Clubs, Societies, NGOs, and Association Registrations.

---

### D. Shared Security & Dynamic Elements
- **`src/components/certificate/shared/CertificateQRCode.tsx`**  
  Renders an SVG QR code pointing to the public verification endpoint, decorated with corner security brackets for tamper-evident validation. Remains fully dynamic.
- **`src/components/certificate/shared/CertificateSignature.tsx`**  
  Renders authentic executive calligraphy signatures using script typography (`Pinyon Script` / `Great Vibes`), sign-off rules, dates, and official government titles.
*(Note: Static seals, guilloche borders, watermarks, and national/LGA emblems were baked directly into the master artwork `origin-template.jpg` and `club-registration-template.jpg`, allowing removal of redundant code components `CertificateSeal.tsx`, `CertificateEmblems.tsx`, `CertificateWatermark.tsx`, and `GuillocheBorder.tsx`.)*

---

### E. Fonts & Print CSS Definitions
- **`src/app/globals.css`**  
  Imports Google Web Fonts used across certificate typography:
  - **`Cinzel`**: Used for authoritative titles, headings, and state headers.
  - **`EB Garamond`**: Classical serif used for legal certification statements.
  - **`Pinyon Script` & `Great Vibes`**: Calligraphic fonts used for executive signatures.
  - **`Arimo` & `Playfair Display`**: Clean body and secondary display typography.  
  Also configures strict `@media print` rules (`-webkit-print-color-adjust: exact`, `@page` margins, toolbar hiding) for pixel-perfect PDF export.
- **`src/app/layout.tsx`**  
  Injects Geist Sans and Geist Mono variable fonts at the root HTML layout level.

---

### F. Master Background Artwork (Public Assets)
- **`public/certificates/templates/origin-template.jpg`** (353 KB)  
  High-resolution portrait master background containing pre-printed borders, state headers, and seals for State of Origin certificates.
- **`public/certificates/templates/club-registration-template.jpg`** (356 KB)  
  High-resolution landscape master background containing pre-printed frames for Club & Association Registration certificates.
- **`public/certificates/templates/receipt-template.jpg`** (514 KB)  
  High-resolution background for statutory revenue collection receipts.

---

### G. Public & Dashboard Routes
- **`src/app/certificate/page.tsx`**  
  Public certificate portal where citizens or third parties can input a certificate number or verification code to look up a document.
- **`src/app/certificate/[...token]/page.tsx`**  
  Public catch-all viewer route that resolves slash-containing certificate numbers (e.g. `ODE/CERT/2026/00101`) or UUID tokens and renders `CertificateViewer`.
- **`src/app/(dashboard)/dashboard/certificates/page.tsx`**  
  Back-office certificate registry for administrators, field officers, and citizens to view issued certificates, download documents, and filter records.
- **`src/app/(dashboard)/dashboard/certificate/[id]/page.tsx`**  
  Internal dashboard viewer for single certificate records.
- **`src/app/(dashboard)/dashboard/certificate/permit/[id]/page.tsx`**  
  Internal dashboard viewer for trade permits and business licenses.

---

### H. Data Models & API Services
- **`src/types/certificate.ts`**  
  Type definitions for the backend API certificate schema (`BackendCertificate`, `ServiceDetails`, etc.).
- **`src/types/publicCertificate.ts`**  
  Type definitions for the presentation model (`PublicCertificate`) consumed by `CertificateRenderer`.
- **`src/services/apiCertificates.ts`**  
  Consumes `/api/v1/certificates` and `/api/v1/certificates/:id` and maps backend responses to presentation models via `transformBackendToPublicCertificate`.
- **`src/services/apiPublicCertificate.ts`**  
  Resolves certificates across multiple tiers: backend API, seeded offline registry, and local browser cache.
- **`src/services/apiVerification.ts`**  
  Verification service resolving queries across certificate numbers, verification codes, and permit tokens.
- **`src/lib/certificateTokens.ts`**  
  Token generation utilities, date formatting, and public URL construction (`getPublicCertificateUrl`).
