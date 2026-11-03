/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useEffect, useState } from "react";

// ============== Types ==============
export type LevyCategory =
  | "Trade Permit Fees"
  | "Market Levy"
  | "Environmental Levy"
  | "Signage Permit"
  | "Shop Permit"
  | "Parking Levy"
  | "Haulage Levy"
  | "Lockup Store Levy"
  | "Business Levy"
  | "Mobile Trader Levy"
  | "Event Permit Fees"
  | "State of Origin Fee"
  | "Other";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly" | "one-off";
export type PaymentMethod = "online" | "transfer" | "pos" | "cash";
export type InvoiceStatus = "unpaid" | "paid" | "overdue" | "pending";
export type OfficerStatus = "active" | "suspended" | "deactivated";

export type PermitType =
  | "General Trade Permit"
  | "Shop Permit"
  | "Market Trader Permit"
  | "Food Vendor Permit"
  | "Commercial Operator Permit"
  | "SME Permit"
  | "Corporate Business Permit"
  | "Mobile Trader Permit"
  | "Artisan Permit"
  | "Temporary Event Permit";

export const PERMIT_TYPES: { type: PermitType; fee: number; validity: number /* months */ }[] = [
  { type: "General Trade Permit", fee: 10000, validity: 12 },
  { type: "Shop Permit", fee: 12000, validity: 12 },
  { type: "Market Trader Permit", fee: 7500, validity: 12 },
  { type: "Food Vendor Permit", fee: 9000, validity: 12 },
  { type: "Commercial Operator Permit", fee: 25000, validity: 12 },
  { type: "SME Permit", fee: 20000, validity: 12 },
  { type: "Corporate Business Permit", fee: 75000, validity: 12 },
  { type: "Mobile Trader Permit", fee: 5000, validity: 6 },
  { type: "Artisan Permit", fee: 6000, validity: 12 },
  { type: "Temporary Event Permit", fee: 15000, validity: 1 },
];

export type PermitStatus = "draft" | "pending_payment" | "paid" | "issued" | "expired";

export interface TradePermit {
  id: string;
  permitNumber: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  ward?: string;
  category: string;
  permitType: PermitType;
  cacNumber?: string;
  description?: string;
  status: PermitStatus;
  fee: number;
  invoiceId?: string;
  invoiceRef?: string;
  qrToken: string;
  verificationCode: string;
  issuedBy?: string;
  issueDate?: string;
  expiryDate?: string;
  createdAt: string;
}


export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  businessName?: string;
  ward?: string;
  createdAt: string;
}

export interface LevyPrice {
  id: string;
  category: LevyCategory;
  description: string;
  mode: "fixed" | "variable";
  unitPrice: number;
  frequency: Frequency;
  active: boolean;
  code?: string;
}

export type RevenueCategory =
  | "trade_permit"
  | "event_permit"
  | "market_levy"
  | "environmental_levy"
  | "haulage_levy"
  | "parking_levy"
  | "signage_permit"
  | "business_levy"
  | "lockup_levy"
  | "shop_permit"
  | "other";

export const REVENUE_CATEGORIES: { value: RevenueCategory; label: string }[] = [
  { value: "trade_permit", label: "Trade Permit" },
  { value: "event_permit", label: "Event Permit" },
  { value: "shop_permit", label: "Shop Permit" },
  { value: "signage_permit", label: "Signage Permit" },
  { value: "market_levy", label: "Market Levy" },
  { value: "environmental_levy", label: "Environmental Levy" },
  { value: "haulage_levy", label: "Haulage Levy" },
  { value: "parking_levy", label: "Parking Levy" },
  { value: "business_levy", label: "Business Levy" },
  { value: "lockup_levy", label: "Lockup Levy" },
  { value: "other", label: "Other" },
];

export interface PermitConfig {
  id: string;
  name: string;
  code: string;
  baseAmount: number;
  category: RevenueCategory;
  isActive: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  businessName?: string;
  levyType: LevyCategory;
  purpose: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  frequency: Frequency;
  dueDate: string;
  status: InvoiceStatus;
  virtualAccount: string;
  qrToken: string;
  paymentLink: string;
  officerId?: string;
  officerName?: string;
  contractorId?: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceRef: string;
  customerName: string;
  phone: string;
  amount: number;
  levyType: LevyCategory;
  paymentMethod: PaymentMethod;
  officerId?: string;
  officerName?: string;
  qrToken: string;
  verificationCode: string;
  paidAt: string;
}

export interface FieldOfficer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ward: string;
  levies: LevyCategory[];
  status: OfficerStatus;
  createdBy: string;
  createdByRole: string;
  contractorId?: string;
  totalCollected: number;
  invoicesIssued: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string; // undefined = broadcast
  title: string;
  body: string;
  type: "success" | "warning" | "info" | "error";
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  meta?: Record<string, any>;
  createdAt: string;
}

interface Store {
  customers: Customer[];
  levies: LevyPrice[];
  invoices: Invoice[];
  receipts: Receipt[];
  officers: FieldOfficer[];
  notifications: Notification[];
  audits: AuditLog[];
  permits: TradePermit[];
  permitConfigs: PermitConfig[];
}



/** Payload shapes the API service layer uses when creating records. */
export interface CreateInvoiceInput {
  customerId?: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  businessName?: string;
  levyType: LevyCategory;
  purpose: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  frequency: Frequency;
  dueDate: string;
  officerId?: string;
  officerName?: string;
  actor: string;
  actorRole: string;
}

export interface CreatePermitInput {
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  ward?: string;
  category: string;
  permitType: PermitType;
  cacNumber?: string;
  description?: string;
  actor: string;
  actorRole: string;
}

/**
 * NOTE (Nov 2026 cleanup): this module used to also contain a complete
 * in-browser business store: seeded customers, invoices, permits and
 * officers persisted to localStorage, with functions to create invoices,
 * mark them paid and issue permits entirely on the client. Nothing in
 * the app called those functions (every importer uses the types and
 * constants above), but leaving a seeded fake database inside the
 * bundle invited exactly the class of bug where screens quietly read
 * invented records instead of the API. The engine is deleted. All data
 * in this app comes from the backend; this file is types and reference
 * constants only.
 */
