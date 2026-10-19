# IJEBU NORTH EAST LOCAL GOVERNMENT Area (LOGMAS) — Backend Migration & Architectural Guide (`backend.md`)

This document provides a comprehensive specification of all architectural, database, workflow, and API changes implemented for the **IJEBU NORTH EAST LOCAL GOVERNMENT Area Revenue & Service Management Portal (LOGMAS)**. 

Use this documentation when configuring, refactoring, or updating backend services (such as a cloned Express/Prisma/NestJS backend from Ijebu North or other LGAs) to match the simplified Ijebu North East general services architecture.

---

## 1. Executive Summary & Core Architectural Refactoring

### Legacy Architecture (Single-Purpose / Hardcoded)
In previous LGA implementations:
* Services like **State of Origin** (`StateOfOriginApplication`) and **Trade Permits** (`Permit`, `PermitConfig`, `LevyConfig`) were hardcoded into separate, rigid database models and dedicated controllers.
* Adding new local government revenue services required creating new database tables and custom API routes for each service.
* Separation between Treasury fee configuration, Field Officer inspections, and LGA Admin approvals was scattered or inconsistent across different role views.

### New Ijebu North East Streamlined Services Architecture
1. **Unified Services Engine**: All **12 statutory Ijebu North East LGA services** (Certificates, Rates, Licences, Levies, and Permits) run through a standardized `Service`, `ServiceFeeConfig`, and `Application` model.
2. **Simplified Fee Linkage**: The Treasury configuration is simply the active statutory amount attached to each service (`Service` → `ServiceFeeConfig.amount`). No complex calculation engine or separate manual Treasury assessment table is required.
3. **Dedicated Treasury Fee Portal**: Treasurers configure fee amounts and active/inactive statuses for all 12 services from a single, unified interface. Deletion is forbidden to maintain financial integrity.
4. **Clean Direct Flow**:
   * **Citizen / Business Owner**: Selects statutory service and submits application.
   * **System**: Identifies selected service, retrieves active Treasury-configured amount, creates invoice/payable amount, and citizen completes payment.
   * **LGA Administrator**: Sees all applications regardless of payment status, filters by payment status (Paid, Pending, Failed), reviews application dossier, and Approves or Declines (decline requires mandatory reason).
   * **Automated Document Issuance**: Upon LGA approval, the official QR-coded Certificate or Licence is automatically generated.

---

## 2. The 12 Statutory IJEBU NORTH EAST LOCAL GOVERNMENT Services

The backend service registry and seed scripts must populate these **12 core services**:

### A. Certificate Services (Category: `CERTIFICATE`)
1. **Certificate of Origin** (`certificate_of_origin`) — Ref: `1001 - Statutory Certificate Fees`
2. **Certificate of Club Registration** (`club_registration`) — Ref: `1002 - Social & Club Fees`
3. **Certificate of Community Development Association Registration** (`cda_registration`) — Ref: `1003 - Community Dev. Fees`
4. **Certificate of Farmers Registration** (`farmers_registration`) — Ref: `1004 - Agricultural & Farmers Fees`
5. **Certificate of Environmental Sanitation Compliance** (`environmental_sanitation`) — Ref: `1005 - Environmental Sanitation Fees`

### B. Rates, Licences, Levies & Permits (Category: `RATES_AND_LEVIES` / `LICENCES_AND_PERMITS` / `URBAN_DEVELOPMENT`)
6. **Tenement Rate** (`tenement_rate`) — Ref: `2001 - Tenement & Property Rates`
7. **Haulage Fees** (`haulage_fees`) — Ref: `2002 - Haulage & Transit Levies`
8. **Liquor Licence Fees** (`liquor_licence`) — Ref: `2003 - Liquor & Liquor Outlets`
9. **Viewing Centre Licence Fee** (`viewing_centre_licence`) — Ref: `2004 - Entertainment & Viewing Centres`
10. **Quarry Fees and Permits** (`quarry_permit`) — Ref: `2005 - Mining & Mineral Resources`
11. **Street Naming and Property Numbering** (`street_naming`) — Ref: `2006 - Urban Dev & Street Naming`
12. **Kiosk Licence** (`kiosk_licence`) — Ref: `2007 - Kiosk & Temporary Structures`

---

## 3. Streamlined Application Lifecycle & Logic

The workflow follows a direct 4-stage progression:

```
[1. Citizen Application]
       │
       ▼
Selects Service & Submits Form Details (FormData JSON)
       │
       ▼
[2. Automated Fee Resolution & Invoicing]
       │
       ├─ System retrieves active fee from `ServiceFeeConfig`
       ├─ Creates `Invoice` with payable amount
       └─ Citizen pays (Virtual Account / Bank Transfer / Gateway)
       │
       ▼
[3. LGA Administrator Review]
       │
       ├─ Views all applications (Filterable by payment status: Paid, Pending, Failed)
       ├─ Approves OR Declines (Mandatory reason required for decline)
       │
       ▼
[4. Automated Certificate / Licence Generation]
       │
       └─ Auto-generates official QR-coded PDF document upon approval
```

---

## 4. Role Responsibilities & Access Matrix

### 1. Treasury Administrator (`treasurer`)
* **Fee Configuration**: View, update fee amounts, and toggle active/inactive status across all 12 services.
* **Auditability**: Cannot delete fee records; all updates create timestamped audit logs.
* **Reconciliation**: Monitor incoming virtual account settlements, revenue head breakdowns, and payment reconciliation.

### 2. LGA Administrator (`lga_admin`)
* View all submitted applications across all 12 services with payment status filters (`Paid`, `Pending`, `Failed`).
* Review citizen application details and uploaded verification documents.
* Issue final **Approval** (which auto-triggers certificate generation) or **Decline** (with required explanation).

### 3. Citizen / Business Owner (`citizen` / `business_owner`)
* Apply for any of the 12 statutory Ijebu North East services.
* View exact payable statutory fee configured by Treasury.
* Pay via dedicated virtual bank transfer or online gateway.
* Download QR-verified Certificate/Licence upon LGA approval.

---

## 5. Database Schema Reference

Refer to `/treasurer.md` and `/schema.md` for complete Prisma models:
* `Service` — Catalog of 12 statutory services.
* `ServiceFeeConfig` — 1-to-1 fee configuration per service (`amount`, `status`, `updatedAt`, `updatedById`).
* `ServiceFeeAuditLog` — Historical audit trail of fee modifications.
* `Application` — Unified application store with `formData` JSON, `feeAmount`, and LGA decision fields.
* `Invoice` — Payment record with virtual bank account details and settlement status.
* `Certificate` — Issued certificates and licences with verification codes and QR tokens.

---

## 6. Key API Route Mapping

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/services` | List all 12 statutory services | Public / Citizen |
| `GET` | `/api/v1/treasury/fees` | List all configured service fees | `treasurer`, `lga_admin` |
| `PUT` | `/api/v1/treasury/fees/:serviceId` | Update fee amount and active status | `treasurer`, `super_admin` |
| `POST` | `/api/v1/applications` | Create application (resolves active fee from Treasury) | `citizen`, `business_owner` |
| `GET` | `/api/v1/admin/applications` | List applications (supports `?paymentStatus=PAID` filter) | `lga_admin`, `super_admin` |
| `POST` | `/api/v1/admin/applications/:id/decision` | Approve or Decline application | `lga_admin`, `chairman` |
| `GET` | `/api/v1/verify/:code` | Public QR / Certificate / Receipt verification | Public |

```bash
# 1. Generate new Prisma Client
npx prisma generate

# 2. Create and run migration
npx prisma migrate dev --name init_lga_general_services

# 3. Seed 12 statutory Ijebu North East services and default Treasury fee schedules
npx prisma db seed
```

---

## 6. Key API Route Mapping for Backend Developers

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/services` | List all 12 Ijebu North East statutory services | Public / Citizen |
| `GET` | `/api/v1/treasurer/fee-schedules?category=certificates` | List Certificate fee schedules | `treasurer`, `super_admin` |
| `GET` | `/api/v1/treasurer/fee-schedules?category=levies_permits` | List Rates, Levies & Permits fee schedules | `treasurer`, `super_admin` |
| `POST` | `/api/v1/treasurer/fee-schedules` | Create or update fee schedule | `treasurer` |
| `POST` | `/api/v1/applications` | Create draft application for any service | `citizen`, `business_owner` |
| `PUT` | `/api/v1/applications/:id/declaration` | Accept statutory declaration | Applicant |
| `POST` | `/api/v1/applications/:id/submit` | Submit application | Applicant |
| `POST` | `/api/v1/applications/:id/inspection` | Log Field Officer inspection report | `field_officer` |
| `POST` | `/api/v1/treasurer/assess` | Authorize Treasury assessment & issue invoice | `treasurer` |
| `POST` | `/api/v1/treasurer/invoices/:id/adjust` | Adjust invoice amount | `treasurer` |
| `POST` | `/api/v1/treasurer/invoices/:id/cancel` | Cancel unpaid invoice with reason | `treasurer` |
| `GET` | `/api/v1/treasurer/reconciliation` | Get real-time bank settlement & arrears report | `treasurer`, `auditor` |
| `POST` | `/api/v1/admin/applications/:id/decision` | Final LGA Admin Approval/Return/Reject | `lga_admin`, `chairman` |
| `GET` | `/api/v1/verify/:code` | Public QR / Certificate / Receipt verification | Public |

---

## 7. Frontend Alignment Verification

The frontend UI running at `src/` is fully compiled and configured to consume these exact models:
* **Treasurer Portal** (`/dashboard/levies`): Contains 4 dedicated tabs — Certificate Fee Schedules, Rates/Levies Fee Schedules, Assessments & Invoice Authorisation, and Real-Time Bank Reconciliation.
* **Field Officer Portal** (`/dashboard/page` as `field_officer`): Interactive Field Inspection queue with instant findings & recommendation submission.
* **Services Portal** (`/dashboard/services`): Displays all 12 Ijebu North East services with dynamic 13-step submission forms.
* **Applications Hub** (`/dashboard/applications`): Full state-machine view across all 15 application status stages.

This completes the architectural reference for updating your cloned backend codebase!
