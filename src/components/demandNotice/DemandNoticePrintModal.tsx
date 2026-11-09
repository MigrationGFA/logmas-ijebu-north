"use client";

import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, X, Building2, Landmark, ShieldCheck, QrCode } from "lucide-react";
import Image from "next/image";
import { DemandNoticeRecord } from "@/services/apiDemandNotice";
import { LGA_CONFIG } from "@/config/lga.config";

interface DemandNoticePrintModalProps {
  notice: DemandNoticeRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DemandNoticePrintModal({
  notice,
  isOpen,
  onClose,
}: DemandNoticePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!notice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = notice.status === "paid";
  const dueDateFormatted = notice.dueDate
    ? new Date(notice.dueDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "14 Calendar Days";

  const issuedDateFormatted = new Date(notice.issuedDate || notice.createdAt).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-100 max-h-[92vh] flex flex-col">
        {/* Action Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">
              Official Statutory Demand Notice · {notice.demandNoticeNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Notice / Download PDF
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Document Body (Printable Area) */}
        <div className="overflow-y-auto p-4 sm:p-8 flex-1">
          <div
            ref={printRef}
            className="max-w-3xl mx-auto bg-white border border-slate-300 shadow-lg rounded-sm p-6 sm:p-10 text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0"
          >
            {/* Header Emblems & Council Info */}
            <div className="border-b-2 border-emerald-900 pb-5 mb-6 text-center relative">
              <div className="flex items-center justify-between mb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt={`${LGA_CONFIG.identity.name} LGA Crest`}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <div className="text-center flex-1 px-2">
                  <h1 className="text-xl sm:text-2xl font-black text-emerald-950 uppercase tracking-tight">
                    {`${LGA_CONFIG.identity.name} LOCAL GOVERNMENT COUNCIL`.toUpperCase()}
                  </h1>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mt-0.5">
                    INTERNAL REVENUE SERVICE & FINANCE DEPARTMENT
                  </h2>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {LGA_CONFIG.contact.secretariatAddress}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {`Email: ${LGA_CONFIG.contact.email} · Tel: ${LGA_CONFIG.contact.phone}`}
                  </p>
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center">
                  <Image
                    src="/images/ogun-crest.png"
                    alt="Ogun State Emblem"
                    width={80}
                    height={80}
                    className="object-contain"
                    onError={(e: any) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              </div>

              {/* Document Banner */}
              <div className="bg-emerald-900 text-white py-1.5 px-4 mt-3 rounded-sm flex items-center justify-between text-xs font-bold tracking-wider uppercase">
                <span>STATUTORY DEMAND NOTICE & ASSESSMENT</span>
                <span className="font-mono">{notice.demandNoticeNumber}</span>
              </div>
            </div>

            {/* Notice Reference & Dates Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-slate-200 bg-slate-50/70 p-3 rounded mb-6">
              <div>
                <span className="text-slate-500 block uppercase text-[10px]">Notice Reference:</span>
                <strong className="font-mono text-emerald-950 text-xs sm:text-sm">
                  {notice.demandNoticeNumber}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px]">Date of Service:</span>
                <strong className="text-slate-800">{issuedDateFormatted}</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px]">Due Settlement Date:</span>
                <strong className="text-red-700 font-bold">{dueDateFormatted}</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px]">Settlement Status:</span>
                {isPaid ? (
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                    SETTLED / PAID
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">
                    PAYMENT DUE
                  </span>
                )}
              </div>
            </div>

            {/* Payer / Liable Entity Particulars */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                LIABLE ENTITY / PAYER PARTICULARS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs bg-white p-3 border border-slate-200 rounded">
                <div>
                  <span className="text-slate-500 text-[11px] block">Name of Liable Entity / Payer:</span>
                  <strong className="text-slate-900 text-sm block">{notice.payerName}</strong>
                  {notice.tradingName && notice.tradingName !== notice.payerName && (
                    <span className="text-[11px] text-slate-600 block">
                      Trading As: <strong>{notice.tradingName}</strong>
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Payer Capacity & Category:</span>
                  <span className="font-semibold text-slate-800 uppercase">
                    {notice.payerType.replace("_", " ")}
                  </span>
                  {notice.rcNumber && (
                    <span className="text-slate-500 block text-[11px]">
                      CAC / RC Number: <strong className="font-mono text-slate-700">{notice.rcNumber}</strong>
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Premises Physical Location:</span>
                  <span className="font-medium text-slate-800">{notice.address}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">{`Ward Jurisdiction in ${LGA_CONFIG.identity.name} LGA:`}</span>
                  <span className="font-semibold text-emerald-950">{notice.ward}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Contact Telephone:</span>
                  <span className="font-mono text-slate-800">{notice.phone}</span>
                </div>
                {notice.email && (
                  <div>
                    <span className="text-slate-500 text-[11px] block">Registered Email:</span>
                    <span className="text-slate-800">{notice.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assessment Particulars Table */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                STATUTORY ASSESSMENT & TARIFF SCHEDULE
              </h3>
              <table className="w-full text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2 px-3 text-left font-bold w-12">S/N</th>
                    <th className="py-2 px-3 text-left font-bold">Assessment Description</th>
                    <th className="py-2 px-3 text-left font-bold">Revenue Head</th>
                    <th className="py-2 px-3 text-right font-bold w-32">Amount (NGN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {notice.assessmentItems?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800">{item.description}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                        {notice.revenueHead}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₦{Number(item.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50/70 border-t-2 border-emerald-900">
                    <td colSpan={3} className="py-3 px-3 text-right font-sans font-bold text-slate-900">
                      TOTAL STATUTORY DEMAND DUE:
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-950 text-sm sm:text-base">
                      ₦{Number(notice.amountPayable || 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Providus Bank Payment Instructions */}
            <div className="bg-emerald-50 border border-emerald-300 rounded p-4 mb-6 text-xs text-emerald-950">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs sm:text-sm mb-1.5">
                <Landmark className="w-4 h-4 text-emerald-700" />
                STATUTORY PAYMENT INSTRUCTIONS · DEDICATED PROVIDUS BANK ACCOUNT
              </div>
              <p className="text-slate-700 text-[11px] mb-2.5">
                TAKE NOTICE that payment of the sum stated above must be credited within <strong>14 calendar days</strong> of this notice. Payment must be made directly to the dedicated Providus Bank account allocated to this service:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-white p-3 rounded border border-emerald-200 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Designated Bank:</span>
                  <strong className="text-slate-900">Providus Bank</strong>
                  <span className="text-[10px] text-slate-400 block font-sans">Code: 000023</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Account Name:</span>
                  <strong className="text-[11px] block truncate">
                    {notice.statutoryAccount?.accountName || ""}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Account Number:</span>
                  <strong className="text-emerald-800 text-sm block">
                    {notice.statutoryAccount?.accountNumber || "9644698974"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Service Code:</span>
                  <strong className="text-slate-800 text-xs block">
                    {notice.statutoryAccount?.serviceCode || "DEMANDNOTIC"}
                  </strong>
                </div>
              </div>
              <p className="text-[11px] text-emerald-900 mt-2 font-medium">
                <strong>Mandatory Narration:</strong> Quote Notice Number <strong>{notice.demandNoticeNumber}</strong> as transfer narration. Providus automated reconciliation instantly verifies your payment and generates your official receipt.
              </p>
            </div>

            {/* Legal Notice & Statutory Warning */}
            <div className="border border-red-200 bg-red-50/60 rounded p-3 text-[11px] text-red-950 mb-6 leading-relaxed">
              <strong className="text-red-900 uppercase block font-bold text-xs mb-0.5">
                Statutory Notice & Default Warning:
              </strong>
              This demand notice is issued pursuant to the powers vested in the Local Government Council under the Local Government (Establishment) Law of Ogun State, 2006. If the amount demanded is not paid on or before <strong>{dueDateFormatted}</strong>, the Council may proceed to seal the premises, impound movable assets, or institute summary legal proceedings under applicable revenue bye-laws.
              <span className="block mt-1 font-semibold text-slate-700">
                NO CASH SHOULD BE PAID TO ANY INDIVIDUAL. ALL SETTLEMENTS MUST BE EFFECTED DIRECTLY TO THE DESIGNATED COUNCIL ACCOUNT ABOVE.
              </span>
            </div>

            {/* Signatures & Execution Blocks */}
            <div className="border-t border-slate-300 pt-6 mt-6 grid grid-cols-2 gap-8 text-xs text-center">
              <div>
                <div className="h-10 flex items-center justify-center">
                  <span className="font-serif italic text-slate-600 font-bold text-sm">
                    HON. IDRIS OLALEKAN KUSIMO
                  </span>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <strong className="block text-slate-900">HON. IDRIS OLALEKAN KUSIMO</strong>
                  <span className="text-slate-600 text-[11px]">Executive Chairman</span>
                  <span className="text-slate-500 block text-[10px]">{`${LGA_CONFIG.identity.name} Local Government Council`}</span>
                </div>
              </div>
              <div>
                <div className="h-10 flex items-center justify-center">
                  <span className="font-serif italic text-slate-600 font-bold text-sm">
                    HEAD OF LOCAL GOVT ADMIN
                  </span>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <strong className="block text-slate-900">DIRECTOR OF REVENUE & TREASURY</strong>
                  <span className="text-slate-600 text-[11px]">For: Head of Local Government Administration</span>
                  <span className="text-slate-500 block text-[10px]">{`${LGA_CONFIG.identity.name} Local Government Secretariat`}</span>
                </div>
              </div>
            </div>

            {/* Security Barcode Footer */}
            <div className="mt-8 pt-3 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>SECURITY VERIFICATION: {notice.demandNoticeNumber}</span>
              <span>OFFICIAL SEAL OF {`${LGA_CONFIG.identity.name} LOCAL GOVERNMENT COUNCIL`.toUpperCase()} © {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
