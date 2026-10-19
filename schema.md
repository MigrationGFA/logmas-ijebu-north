# IJEBU NORTH EAST LOCAL GOVERNMENT Revenue & Service Management Portal (LOGMAS)
## Database Schema Specification (`schema.md`)

This document defines the production-ready Prisma schema designed for the streamlined **IJEBU NORTH EAST LOCAL GOVERNMENT Area (LGA) LOGMAS Portal**.

---

### Key Schema Architecture
1. **Unified Services & Treasury Fee Configuration**: Replaced fragmented legacy tables with a standardized `Service`, `ServiceFeeConfig`, and `ServiceFeeAuditLog` architecture. Treasury can query and adjust fees, but records are never deleted.
2. **Simplified, Direct Application Flow**:
   * **Citizen/Business Owner**: Selects 1 of the 12 statutory services and submits the application.
   * **System**: Identifies service, retrieves Treasury-configured `amount` from `ServiceFeeConfig`, and creates payable invoice.
   * **Citizen**: Pays via dedicated virtual account, bank transfer, or card.
   * **LGA Administrator**: Views all applications with payment status filtering, reviews documents, and approves or declines (decline requires a reason).
   * **Automated Generation**: Certificate or licence document is generated automatically upon LGA approval.
3. **No Unnecessary Assessment Tables**: Eliminates separate manual Treasury assessment bottlenecks and complex multi-stage tariff pipelines.

---

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

// ============================================================
// ENUMS
// ============================================================

enum Role {
  super_admin
  lga_admin
  chairman
  treasurer
  auditor
  ward_councillor
  contractor
  agent
  field_officer
  business_owner
  citizen
}

enum ServiceCategory {
  CERTIFICATE
  RATES_AND_LEVIES
  LICENCES_AND_PERMITS
  URBAN_DEVELOPMENT
}

enum FeeStatus {
  ACTIVE
  INACTIVE
}

enum ApplicationStatus {
  draft
  submitted
  under_review
  approved
  declined
  cancelled
}

enum PaymentStatus {
  pending
  paid
  failed
  reversed
  refunded
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

enum PaymentMethod {
  virtual_account
  bank_transfer
  online_gateway
  pos
  cash
}

// ============================================================
// USERS & IDENTITY
// ============================================================

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  phone        String?  @unique
  password     String
  firstName    String
  lastName     String
  role         Role     @default(citizen)
  tokenVersion Int      @default(0)

  // Profile Information
  avatarUrl       String?
  dateOfBirth     DateTime?
  gender          String?
  address         String?
  town            String?
  occupation      String?
  nin             String?   @unique
  cacNumber       String?   @unique
  businessName    String?
  businessType    String?
  taxIdNumber     String?

  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Ward association
  wardId String?
  ward   Ward?   @relation("UserWard", fields: [wardId], references: [id])

  // Relational Collections
  applications             Application[]         @relation("ApplicantApplications")
  reviewedApplications     Application[]         @relation("AdminReviews")
  feeUpdatesMade           ServiceFeeConfig[]    @relation("TreasuryFeeUpdates")
  feeAuditLogs             ServiceFeeAuditLog[]  @relation("TreasuryAuditLogs")
  invoicesAssigned         Invoice[]
  payments                 Payment[]
  certificatesIssued       Certificate[]         @relation("CertificateIssuedBy")
  auditLogs                AuditLog[]

  @@map("users")
}

// ============================================================
// GEOGRAPHY
// ============================================================

model Ward {
  id          String    @id @default(uuid())
  name        String    @unique
  code        String    @unique // e.g. "WARD_01"
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  users       User[]    @relation("UserWard")

  @@map("wards")
}

// ============================================================
// 1. STATUTORY SERVICES REGISTRY (12 Services)
// ============================================================

model Service {
  id               String          @id @default(uuid())
  code             String          @unique // e.g. "certificate_of_origin", "tenement_rate"
  name             String
  category         ServiceCategory
  revenueHead      String          // e.g. "1001 - Statutory Certificate Fees"
  description      String
  requirements     String[]
  estimatedDays    Int             @default(3)
  certificateType  CertificateType // Target certificate/licence generated upon approval
  supportsRenewal  Boolean         @default(false)
  isActive         Boolean         @default(true)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  feeConfig        ServiceFeeConfig?
  applications     Application[]

  @@map("services")
}

// ============================================================
// 2. TREASURY SERVICE FEE CONFIGURATION
// ============================================================

model ServiceFeeConfig {
  id          String     @id @default(uuid())
  serviceId   String     @unique
  service     Service    @relation(fields: [serviceId], references: [id], onDelete: Restrict)
  
  amount      Decimal    @db.Decimal(12, 2) // Configured fee in NGN
  status      FeeStatus  @default(ACTIVE)   // ACTIVE or INACTIVE
  
  updatedById String?
  updatedBy   User?      @relation("TreasuryFeeUpdates", fields: [updatedById], references: [id])
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  history     ServiceFeeAuditLog[]

  @@map("service_fee_configs")
}

model ServiceFeeAuditLog {
  id                 String            @id @default(uuid())
  serviceFeeConfigId String
  serviceFeeConfig   ServiceFeeConfig  @relation(fields: [serviceFeeConfigId], references: [id], onDelete: Restrict)
  
  previousAmount     Decimal           @db.Decimal(12, 2)
  newAmount          Decimal           @db.Decimal(12, 2)
  previousStatus     FeeStatus
  newStatus          FeeStatus
  
  changedById        String
  changedBy          User              @relation("TreasuryAuditLogs", fields: [changedById], references: [id])
  reason             String?
  
  createdAt          DateTime          @default(now())

  @@map("service_fee_audit_logs")
}

// ============================================================
// 3. SERVICE APPLICATIONS (Streamlined Flow)
// ============================================================

model Application {
  id                String            @id @default(uuid())
  applicationNumber String            @unique // e.g. "ODE-APP-2026-000101"
  status            ApplicationStatus @default(submitted)

  serviceId         String
  service           Service           @relation(fields: [serviceId], references: [id], onDelete: Restrict)

  applicantId       String
  applicant         User              @relation("ApplicantApplications", fields: [applicantId], references: [id])
  
  fullName          String
  phone             String
  email             String?
  address           String
  ward              String?
  nin               String?
  cacNumber         String?

  // Snapshot of fee retrieved from Treasury configuration at application time
  feeAmount         Decimal           @db.Decimal(12, 2)

  // Dynamic form payload JSON
  formData          Json

  // LGA Administrator Review Decision
  reviewedById      String?
  reviewedBy        User?             @relation("AdminReviews", fields: [reviewedById], references: [id])
  reviewedAt        DateTime?
  declineReason     String?           // Mandatory when status == declined

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  invoice           Invoice?
  certificate       Certificate?

  @@index([serviceId])
  @@index([applicantId])
  @@index([status])
  @@map("applications")
}

// ============================================================
// 4. INVOICING & PAYMENT
// ============================================================

model Invoice {
  id                  String        @id @default(uuid())
  invoiceNumber       String        @unique // e.g. "ODE/INV/2026/000101"
  
  applicationId       String        @unique
  application         Application   @relation(fields: [applicationId], references: [id], onDelete: Restrict)
  
  amount              Decimal       @db.Decimal(12, 2)
  paymentStatus       PaymentStatus @default(pending)
  
  // Dedicated Virtual Bank Account for direct settlement
  virtualBankName     String?       @default("Zenith Bank / Ijebu North East Treasury")
  virtualAccountNumber String?
  virtualAccountRef   String?       @unique
  
  paidAt              DateTime?
  transactionRef      String?
  
  assignedOfficerId   String?
  assignedOfficer     User?         @relation(fields: [assignedOfficerId], references: [id])

  payments            Payment[]

  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([paymentStatus])
  @@map("invoices")
}

model Payment {
  id         String        @id @default(uuid())
  amount     Decimal       @db.Decimal(12, 2)
  method     PaymentMethod @default(virtual_account)
  status     PaymentStatus @default(pending)
  reference  String        @unique
  gatewayRef String?
  narration  String?

  confirmedAt DateTime?
  invoiceId   String
  invoice     Invoice       @relation(fields: [invoiceId], references: [id])
  paidById    String?
  paidBy      User?         @relation(fields: [paidById], references: [id])

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("payments")
}

// ============================================================
// 5. ISSUED CERTIFICATES & LICENCES
// ============================================================

model Certificate {
  id                String          @id @default(uuid())
  certificateNumber String          @unique // e.g. "ODE/CERT/2026/000101"
  verificationCode  String          @unique // e.g. "ODE-VRF-8934-2026"
  qrToken           String          @unique @default(cuid())
  
  applicationId     String          @unique
  application       Application     @relation(fields: [applicationId], references: [id], onDelete: Restrict)
  
  certificateType   CertificateType
  holderName        String
  serviceName       String
  ward              String?
  
  issuedAt          DateTime        @default(now())
  expiresAt         DateTime?       // Null for non-expiring certificates like Origin
  
  pdfUrl            String?
  isValid           Boolean         @default(true)

  issuedById        String?
  issuedBy          User?           @relation("CertificateIssuedBy", fields: [issuedById], references: [id])

  @@index([verificationCode])
  @@map("certificates")
}

// ============================================================
// 6. SYSTEM AUDIT LOGS
// ============================================================

model AuditLog {
  id        String    @id @default(uuid())
  action    String
  entity    String?
  entityId  String?
  details   Json?
  ipAddress String?
  createdAt DateTime  @default(now())

  userId    String?
  user      User?     @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}
```
