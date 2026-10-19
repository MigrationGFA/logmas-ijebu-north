# LOGMAS Certificate Design & Architecture Guide

This guide is for developers and AI assistants (including Claude) working on the certificate designs, coordinate overlays, typography, and templates in the **LOGMAS Ijebu North East** (Local Government Management and Administration System) application.

---

## 1. Executive Summary & Architecture

The certificate system in LOGMAS uses a **high-precision hybrid canvas/HTML overlay engine**:
1. **Artwork Layer**: High-resolution official vector/raster backgrounds (`.jpg` files in `public/certificates/templates/`).
2. **Text & Data Layer**: Responsive absolute positioning (`x%`, `y%`, `width%`) combined with CSS Container Query Units (`cqw` - Container Query Width). This ensures that whether viewed on a 4K monitor, mobile phone, tablet, or printed to standard A4 physical paper, all text, QR codes, signatures, and seals stay aligned to the millimeter.
3. **Typography Layer**: Curated Nigerian government-standard font package loaded in `src/app/globals.css`.

---

## 2. Master File Directory & Responsibilities

| File Path | Category | Role & Description |
|---|---|---|
| `src/config/certificateFieldConfig.ts` | **Configuration (PRIMARY)** | **The single source of truth for field coordinates, typography, and content formatting.** Defines `x`, `y`, `fontSize` (`cqw`), `fontFamily`, `color`, `textAlign`, and `format()` functions for both Portrait and Landscape templates. |
| `src/config/certificateTemplateMap.ts` | **Configuration** | Maps each of the 12 local council service codes (Origin, Club, CDA, Farmers, Sanitation, etc.) to either `"portrait"` or `"landscape"`. Supports live runtime overrides. |
| `src/config/certificateTemplates.ts` | **Configuration** | Secondary/extended template coordinate registry with sample test datasets and field geometry definitions. |
| `src/config/receiptTemplateConfig.ts` | **Configuration** | Field coordinate definitions and formatting specifically for Local Government Treasury payment receipts. |
| `src/components/certificate/CertificateRenderer.tsx` | **Engine (PRIMARY)** | **The core visual renderer.** Renders the background template image, dynamically maps all configured fields onto the canvas, generates live SVG QR codes, and handles multi-line wrapping and watermarking. |
| `src/components/certificate/CertificateCanvas.tsx` | **Component** | Responsive container wrapper. Automatically resolves the active certificate service to the proper template configuration and sets A4 aspect ratios (`1 / 1.414` portrait or `1.414 / 1` landscape). |
| `src/components/certificate/CertificateViewer.tsx` | **Interactive UI** | Full-screen interactive viewer with zoom controls (`+`, `-`, fit), print action, PDF export triggers, share link copying, and live template switching. |
| `src/components/certificate/templates/CertificateOfOriginTemplate.tsx` | **Template Wrapper** | Preconfigured wrapper component targeting the Certificate of Origin layout. |
| `src/components/certificate/templates/ClubRegistrationTemplate.tsx` | **Template Wrapper** | Preconfigured wrapper component targeting the Club Registration layout. |
| `src/components/certificate/shared/CertificateSignature.tsx` | **Component** | Reusable official signatory block featuring digital signature script, Chairman title, divider, and council seal text. |
| `src/components/certificate/shared/CertificateQRCode.tsx` | **Component** | Official SVG verification QR code linking to the live public verification URL. |
| `src/components/certificate/shared/CertificateSeal.tsx` | **Component** | Official gold/green embossed vector seal of IJEBU NORTH EAST LOCAL GOVERNMENT. |
| `src/components/certificate/shared/CertificateWatermark.tsx` | **Component** | Security background watermark ("AUTHENTIC DOCUMENT - Ijebu North East LGA"). |
| `src/components/certificate/shared/CertificateEmblems.tsx` | **Component** | Nigerian National Coat of Arms and Ogun State Government insignia. |
| `public/certificates/templates/origin-template.jpg` | **Asset (A4 Portrait)** | Master raster artwork for Certificate of Origin, Indigene Letters, and Statutory Permits (aspect ratio `1 : 1.414`). |
| `public/certificates/templates/club-registration-template.jpg` | **Asset (A4 Landscape)** | Master raster artwork for Club Registration, CDA Registration, and NGOs (aspect ratio `1.414 : 1`). |
| `public/certificates/templates/receipt-template.jpg` | **Asset (Receipt)** | Official Council Treasury Payment Receipt background. |
| `src/app/globals.css` | **Styling & Fonts** | Loads Google Fonts (`Cinzel`, `EB Garamond`, `Libertinus Serif`, `Great Vibes`, `Arimo`, `Playfair Display`) and defines `@container` query styles. |
| `src/app/certificate/[token]/page.tsx` | **Public Page** | The public verification page accessed when an official scans the QR code. Renders the certificate and validation security banner. |
| `src/app/certificate/page.tsx` | **Public Page** | Public certificate verification portal where citizens can input certificate numbers or tokens to verify authenticity. |
| `src/app/(dashboard)/dashboard/certificate/[id]/page.tsx` | **Admin Page** | Staff and administrative certificate view inside the dashboard. |
| `src/app/(dashboard)/dashboard/certificate/permit/[id]/page.tsx` | **Permit Page** | Dedicated trade permit certificate view with verification stamps and export options. |
| `src/lib/certificateTokens.ts` | **Utility** | Token hashing, generation, and public verification token decoding. |
| `src/services/apiPublicCertificate.ts` | **API Client** | Client fetching service for public certificate data by token. |

---

## 3. How the Coordinate System Works

Every text element, seal, signature, and QR code is positioned using percentage coordinates relative to the template container:

```typescript
// In src/config/certificateFieldConfig.ts:
fieldName: {
  key: "nameOfApplicant",
  x: 52.0,            // % from left border of the certificate
  y: 44.0,            // % from top border of the certificate
  width: 34.0,        // maximum % width allocated for text before wrapping/truncation
  textAlign: "left",  // "left" | "center" | "right"
  fontFamily: CERTIFICATE_FONTS.EB_GARAMOND,
  fontSize: "1.05cqw",// Container Query Width unit (auto-scales with certificate size!)
  fontWeight: 700,
  color: "#0D3B1E",   // Deep forest green or slate
  textTransform: "uppercase",
  format: (c) => c.applicant.name || "Adebayo Olawale Babatunde",
}
```

### Why `cqw` Units?
Using `cqw` (Container Query Width) ensures that **1cqw = 1% of the certificate canvas width**. When the viewer resizes the certificate, zooms in, views on mobile, or prints in high-res A4, the font sizes scale proportionally without layout shifts.

---

## 4. Typography Standards & Font Mapping

The typography follows official local council standards:

| Font Constant (`CERTIFICATE_FONTS`) | Actual Font Family | Intended Use in Certificate |
|---|---|---|
| `CINZEL_BOLD` | `'Cinzel', 'Trajan Pro', serif` | Main Council Header ("IJEBU NORTH EAST LOCAL GOVERNMENT"), Certificate Titles ("CERTIFICATE OF ORIGIN"), Title Banners. |
| `EB_GARAMOND` | `'EB Garamond', 'Garamond', serif` | Preamble narrative ("This is to certify that..."), dynamic field values, general body clauses. |
| `LIBERTINUS_SERIF_BOLD` | `'Libertinus Serif', serif` | Formal field labels ("Name of Applicant", "Ward", "Date of Issue"), Signatory Chairman Name. |
| `ARIMO` | `'Arimo', Arial, sans-serif` | Council postal address, certificate reference numbers, security codes, regulatory footers, QR instructions. |
| `GREAT_VIBES` | `'Great Vibes', cursive` | Executive Chairman authentic cursive signature overlay. |
| `EB_GARAMOND_ITALIC` | `'EB Garamond', italic` | Statutory enactment notices ("Issued under the provisions of Local Government Law..."), Chairman office title. |

All fonts are imported via `src/app/globals.css`.

---

## 5. Step-by-Step: How to Make Common Changes

### A. Adjusting the Position of an Existing Field
1. Open `src/config/certificateFieldConfig.ts`.
2. Locate either `MASTER_ORIGIN_CONFIG` (for Portrait / Certificate of Origin) or `MASTER_CLUB_CONFIG` (for Landscape / Club Registration).
3. Find the field object (e.g., `applicantName`, `dateOfIssue`, `ward`, `signerName`).
4. Modify `x` (horizontal position 0–100%) or `y` (vertical position 0–100%).
5. Save the file. The changes will immediately reflect in the preview.

### B. Changing Font Size, Font Family, or Color
In `src/config/certificateFieldConfig.ts`, update the field properties:
- `fontSize: "1.1cqw"` (increase or decrease size)
- `fontFamily: CERTIFICATE_FONTS.CINZEL_BOLD` (switch font family)
- `color: "#0D3B1E"` (change text color)
- `textAlign: "center"` (align `left`, `center`, or `right`)

### C. Adding a New Dynamic Field to a Certificate
1. Add the field definition to `fields` in `src/config/certificateFieldConfig.ts`:
   ```typescript
   myNewField: {
     key: "myNewField",
     x: 50.0,
     y: 60.0,
     width: 40.0,
     textAlign: "center",
     fontFamily: CERTIFICATE_FONTS.EB_GARAMOND,
     fontSize: "0.95cqw",
     fontWeight: 600,
     color: "#1E293B",
     format: (c) => c.certificateData?.customProperty || "Default Value",
   },
   ```
2. `CertificateRenderer.tsx` automatically iterates over all entries in `config.fields` and renders them with absolute positioning. No changes to JSX are required!

### D. Updating Background Template Artwork
To replace the background image:
1. Place the new high-resolution `.jpg` or `.png` into `/public/certificates/templates/`.
2. In `src/config/certificateFieldConfig.ts`, update the `backgroundImage` URL in `MASTER_ORIGIN_CONFIG` or `MASTER_CLUB_CONFIG`.

### E. Mapping a New Council Service to a Template
Open `src/config/certificateTemplateMap.ts` and add the service slug or ID:
```typescript
export const SERVICE_TEMPLATE_MAP: Record<string, MasterTemplateType> = {
  my_new_service: "portrait", // or "landscape"
};
```

---

## 6. How to Test & Preview Certificates

- **Public Verification Route**: Navigate to `/certificate/ODE-TEST-TOKEN` or inspect any active certificate token.
- **Admin Dashboard Certificate Route**: Navigate to `/dashboard/certificate/[id]`.
- **Trade Permit Route**: Navigate to `/dashboard/certificate/permit/[id]`.
- **Live Template Switcher**: Inside the Certificate Viewer (`CertificateViewer.tsx`), use the template dropdown in the top action bar to toggle between Portrait and Landscape layouts in real-time.
