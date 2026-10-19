# IJEBU NORTH EAST LOCAL GOVERNMENT Area (LOGMAS) — Treasury Module & Simplified Architecture (`treasurer.md`)

This document defines the streamlined database schema, business rules, and application lifecycle for the **Treasury Module** and overall revenue flow of IJEBU NORTH EAST LOCAL GOVERNMENT Area.

---

## 1. Core Philosophy & Simplified Lifecycle Flow

The architecture intentionally avoids complicated assessment engines, intermediate field appraisal layers, and multi-stage tariff calculations. The workflow is direct, robust, and transparent:

```
[1. Citizen / Business Owner]
       │
       ▼
Selects 1 of 12 Statutory Services & Submits Application Form
       │
       ▼
[2. System Automated Pricing]
       │
       ├─ Identifies selected Service
       ├─ Retrieves active Treasury-configured `amount` from `ServiceFeeConfig`
       └─ Generates Invoice with payable amount
       │
       ▼
[3. Citizen Payment]
       │
       └─ Citizen pays via Dedicated Virtual Account, Bank Transfer, or Online Gateway
       │
       ▼
[4. LGA Administrator Review]
       │
       ├─ Views all applications (filter by payment status: Paid, Pending, Failed)
       ├─ Reviews application details and citizen documents
       ├─ Decision:
       │     ├─ APPROVE ──────────────────────────────────┐
       │     └─ DECLINE (Mandatory rejection reason)      │
       │                                                  ▼
                                            [5. Automated Generation]
                                                          │
                                            Generates official QR-coded
                                            Certificate or Licence PDF
```

---

## 2. The 12 Statutory IJEBU NORTH EAST LOCAL GOVERNMENT Services

The `Service` registry and `ServiceFeeConfig` must seed and support exactly these **12 statutory services**:

| # | Service Code / Slug | Statutory Service Name | Category | Default Ref. Fee | Certificate / Licence Issued |
|---|--------------------|------------------------|----------|------------------|------------------------------|
| 1 | `certificate_of_origin` | **Certificate of Origin** | Certificates | ₦3,500 | Certificate of Origin |
| 2 | `club_registration` | **Certificate of Club Registration** | Certificates / Social | ₦15,000 | Certificate of Club Registration |
| 3 | `cda_registration` | **Certificate of Community Development Association Registration** | Community Dev. | ₦10,000 | CDA Registration Certificate |
| 4 | `farmers_registration` | **Certificate of Farmers Registration** | Agriculture | ₦5,000 | Farmers Registration Certificate |
| 5 | `environmental_sanitation` | **Certificate of Environmental Sanitation Compliance** | Environmental Health | ₦25,000 | Environmental Sanitation Compliance Certificate |
| 6 | `tenement_rate` | **Tenement Rate** | Property & Rates | ₦20,000 | Tenement Rate Clearance Certificate |
| 7 | `haulage_fees` | **Haulage Fees** | Transport & Transit | ₦50,000 | Haulage Operation Permit / Clearance |
| 8 | `liquor_licence` | **Liquor Licence Fees** | Trade & Licences | ₦35,000 | Statutory Liquor Licence |
| 9 | `viewing_centre_licence` | **Viewing Centre Licence Fee** | Entertainment & Licences | ₦20,000 | Viewing Centre Operational Licence |
| 10 | `quarry_permit` | **Quarry Fees and Permits** | Mining & Resources | ₦150,000 | Quarry Operation Permit |
| 11 | `street_naming` | **Street Naming and Property Numbering** | Urban Development | ₦100,000 | Official Street Naming & Numbering Certificate |
| 12 | `kiosk_licence` | **Kiosk Licence** | Trade & Licences | ₦12,000 | Commercial Kiosk Operating Licence |

---

## 3. Treasury Database Schema (Prisma ORM)

The Treasury database model is anchored on a **`ServiceFeeConfig`** table.

### Key Rules:
1. **Service Relationship**: Links 1-to-1 with the `Service` record.
2. **Immutable History**: Fee configurations can be queried and updated by Treasury, but records are **never deleted**. Status can be toggled between `ACTIVE` and `INACTIVE`.
3. **No Complex Assessment Table**: There is no separate `TreasuryAssessment` table. The payable fee is directly resolved from `ServiceFeeConfig`.
4. **Audit Trail**: Every fee change records `updatedBy` (Treasury officer user ID) and timestamps.

```prisma
// ============================================================
// PRISMA SCHEMA: TREASURY & SERVICE FEE CONFIGURATION
// ============================================================

enum FeeStatus {
  ACTIVE
  INACTIVE
}

enum ServiceCategory {
  CERTIFICATE
  RATES_AND_LEVIES
  LICENCES_AND_PERMITS
  URBAN_DEVELOPMENT
}

enum CertificateType {
  CERTIFICATE_OF_ORIGIN
  CLUB_REGISTRATION
  CDA_REGISTRATION
  FARMERS_REGISTRATION
  ENVIRONMENTAL_SANITATION_COMPLIANCE
  TENEMENT_RATE_CLEARANCE
  HAULAGE_PERMIT
  LIQUOR_LICENCE
  VIEWING_CENTRE_LICENCE
  QUARRY_PERMIT
  STREET_NAMING_CERTIFICATE
  KIOSK_LICENCE
}

enum ApplicationStatus {
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  DECLINED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

// ------------------------------------------------------------
// 1. Central Statutory Services Registry (12 Services)
// ------------------------------------------------------------
model Service {
  id               String            @id @default(uuid())
  code             String            @unique // e.g. "certificate_of_origin", "tenement_rate"
  name             String            // e.g. "Certificate of Origin"
  category         ServiceCategory
  description      String?
  revenueHead      String            // e.g. "1001 - Statutory Certificate Fees"
  certificateType  CertificateType   // Target certificate/licence generated upon approval
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  // 1-to-1 link with active Treasury Fee Configuration
  feeConfig        ServiceFeeConfig?
  applications     Application[]

  @@map("services")
}

// ------------------------------------------------------------
// 2. Treasury Service Fee Configuration Table
// ------------------------------------------------------------
model ServiceFeeConfig {
  id          String     @id @default(uuid())
  serviceId   String     @unique
  service     Service    @relation(fields: [serviceId], references: [id], onDelete: Restrict)
  
  amount      Decimal    @db.Decimal(12, 2) // Configured fee in NGN
  status      FeeStatus  @default(ACTIVE)   // ACTIVE or INACTIVE
  
  updatedById String?    // User ID of the Treasury Officer who updated this fee
  updatedBy   User?      @relation("TreasuryFeeUpdates", fields: [updatedById], references: [id])
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Historical audit log of fee adjustments
  history     ServiceFeeAuditLog[]

  @@map("service_fee_configs")
}

// ------------------------------------------------------------
// 3. Fee Audit Trail (Read-only historical changes)
// ------------------------------------------------------------
model ServiceFeeAuditLog {
  id                 String            @id @default(uuid())
  serviceFeeConfigId String
  serviceFeeConfig   ServiceFeeConfig  @relation(fields: [serviceFeeConfigId], references: [id], onDelete: Restrict)
  
  previousAmount     Decimal           @db.Decimal(12, 2)
  newAmount          Decimal           @db.Decimal(12, 2)
  previousStatus     FeeStatus
  newStatus          FeeStatus
  
  changedById        String
  changedBy          User              @relation(fields: [changedById], references: [id])
  reason             String?
  
  createdAt          DateTime          @default(now())

  @@map("service_fee_audit_logs")
}

// ------------------------------------------------------------
// 4. Simplified Application Model
// ------------------------------------------------------------
model Application {
  id                String            @id @default(uuid())
  applicationNumber String            @unique // e.g. "ODE-APP-2026-000101"
  
  serviceId         String
  service           Service           @relation(fields: [serviceId], references: [id], onDelete: Restrict)
  
  applicantId       String
  applicant         User              @relation("ApplicantApplications", fields: [applicantId], references: [id])
  
  // Snapshot of fee retrieved from Treasury configuration at application time
  feeAmount         Decimal           @db.Decimal(12, 2)
  
  // Custom form inputs stored as JSON payload
  formData          Json
  
  status            ApplicationStatus @default(SUBMITTED)
  
  // LGA Administrator Review Decision
  reviewedById      String?
  reviewedBy        User?             @relation("AdminReviews", fields: [reviewedById], references: [id])
  reviewedAt        DateTime?
  declineReason     String?           // Mandatory when status == DECLINED
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  // Linked Payment & Issued Document
  invoice           Invoice?
  certificate       Certificate?

  @@index([serviceId])
  @@index([applicantId])
  @@index([status])
  @@map("applications")
}

// ------------------------------------------------------------
// 5. Invoicing & Payment
// ------------------------------------------------------------
model Invoice {
  id                  String        @id @default(uuid())
  invoiceNumber       String        @unique // e.g. "ODE/INV/2026/000101"
  
  applicationId       String        @unique
  application         Application   @relation(fields: [applicationId], references: [id], onDelete: Restrict)
  
  amount              Decimal       @db.Decimal(12, 2)
  paymentStatus       PaymentStatus @default(PENDING)
  
  // Virtual account for direct settlement
  virtualBankName     String?       // e.g. "Zenith Bank / Ijebu North East LGA"
  virtualAccountNumber String?      // e.g. "1012398401"
  
  paidAt              DateTime?
  transactionReference String?
  
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([paymentStatus])
  @@map("invoices")
}

// ------------------------------------------------------------
// 6. Issued Certificate / Licence Table
// ------------------------------------------------------------
model Certificate {
  id                String          @id @default(uuid())
  certificateNumber String          @unique // e.g. "ODE/CERT/2026/000101"
  verificationCode  String          @unique // e.g. "ODE-VRF-8934-2026"
  
  applicationId     String          @unique
  application       Application     @relation(fields: [applicationId], references: [id], onDelete: Restrict)
  
  certificateType   CertificateType
  holderName        String
  serviceName       String
  ward              String?
  
  issuedAt          DateTime        @default(now())
  expiresAt         DateTime?       // Nullable for non-expiring certificates like Origin
  
  qrCodeUrl         String?
  documentPdfUrl    String?
  
  isValid           Boolean         @default(true)

  @@index([verificationCode])
  @@map("certificates")
}
```

---

## 4. Treasury Operations & API Specifications

### 1. Retrieve All Configured Service Fees
* **Route**: `GET /api/v1/treasury/fees`
* **Access**: Treasury, LGA Admin, Super Admin
* **Response**:
```json
[
  {
    "serviceId": "uuid-1",
    "serviceCode": "certificate_of_origin",
    "serviceName": "Certificate of Origin",
    "category": "CERTIFICATE",
    "revenueHead": "1001 - Statutory Certificate Fees",
    "amount": 3500.00,
    "status": "ACTIVE",
    "lastUpdated": "2026-08-16T10:00:00Z"
  }
]
```

### 2. Update a Service Fee
* **Route**: `PUT /api/v1/treasury/fees/:serviceId`
* **Access**: Treasury, Super Admin
* **Payload**:
```json
{
  "amount": 4000.00,
  "status": "ACTIVE"
}
```
* **Backend Rules**:
  * Fee cannot be negative.
  * System records changes into `ServiceFeeAuditLog`.
  * Hard deletion is **forbidden** (`DELETE /api/v1/treasury/fees/:id` will return HTTP 405 Method Not Allowed). To disable a fee, update `status: "INACTIVE"`.

### 3. Application Submission with Dynamic Fee Resolution
* **Route**: `POST /api/v1/applications`
* **Access**: Citizen / Business Owner
* **Logic**:
  1. Look up `ServiceFeeConfig` for requested `serviceId`.
  2. If `status !== "ACTIVE"`, reject submission (Service temporarily suspended).
  3. Create `Application` snapshot with `feeAmount = ServiceFeeConfig.amount`.
  4. Create `Invoice` with matching amount and generated dedicated virtual account.

### 4. LGA Admin Review Decision
* **Route**: `POST /api/v1/admin/applications/:id/decision`
* **Access**: LGA Admin, Chairman
* **Payload (Approve)**:
```json
{
  "decision": "APPROVE"
}
```
* **Payload (Decline)**:
```json
{
  "decision": "DECLINE",
  "reason": "Provided passport photograph and utility bill are illegible."
}
```
* **Backend Rules**:
  * If `decision == "APPROVE"`, the backend automatically generates a `Certificate` record with a unique `certificateNumber`, `verificationCode`, and QR payload.
  * If `decision == "DECLINE"`, `reason` is required.

---

## 5. Summary Checklist for Backend Implementation

1. **Run Database Migration**: Create the `Service`, `ServiceFeeConfig`, `ServiceFeeAuditLog`, `Application`, `Invoice`, and `Certificate` tables.
2. **Seed 12 Statutory Services**: Pre-populate the 12 services with their corresponding `CertificateType` and default statutory fees.
3. **Connect Frontend**: The frontend UI is already configured at `/dashboard/levies` with the general `ServiceFeeConfigurationTab` to query and update these 12 service fees.
