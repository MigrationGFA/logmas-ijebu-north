"use client"
import { Printer, ArrowLeft, ShieldCheck, Loader2, FileQuestion, AlertCircle, Building2, Calendar, MapPin, CheckCircle2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "@/components/dashboard/qr-code";
import React from "react";
import Link from "next/link";
import { useBusinessPermits } from "@/hooks/queries/useBusiness";
import { format, parseISO } from "date-fns";
import { LGA_CONFIG } from "@/config/lga.config";
interface PermitCertificatePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Design notes:
 * For best results, load two fonts in your root layout / globals.css:
 *   - "Spectral" (display serif)  -  https://fonts.google.com/specimen/Spectral
 *   - "IBM Plex Sans" + "IBM Plex Mono" (body / data)
 * The component falls back to system serif/sans if they aren't present, so it
 * still renders correctly without the import.
 */

// Repeating adire-inspired eyelet motif used as the top/bottom border band.
// Adire is the indigo resist-dye cloth tradition native to Ogun State (Abeokuta),
// so it grounds the "security border" in the LGA's own visual vocabulary
// rather than a generic guilloche or rope border.
function AdireBorder({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 240 16"
      preserveAspectRatio="xMidYMid meet"
      className={`w-full h-4 ${flip ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <defs>
        <pattern id="adireMotif" width="24" height="16" patternUnits="userSpaceOnUse">
          <rect width="24" height="16" fill="#1E2A54" />
          <circle cx="12" cy="8" r="4.2" fill="none" stroke="#C9A94A" strokeWidth="1" />
          <circle cx="12" cy="8" r="1.3" fill="#C9A94A" />
          <path d="M0 8 L4.2 8 M19.8 8 L24 8" stroke="#C9A94A" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="240" height="16" fill="url(#adireMotif)" />
    </svg>
  );
}

// Wax-seal style medallion replacing the generic gradient badge.
function SealMedallion() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20 drop-shadow-md" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="#1E2A54" stroke="#AE8A2E" strokeWidth="2" />
      <circle cx="60" cy="60" r="49" fill="none" stroke="#C9A94A" strokeWidth="1" strokeDasharray="2 3" />
      <circle cx="60" cy="60" r="40" fill="#233260" stroke="#AE8A2E" strokeWidth="1.5" />
      <g stroke="#C9A94A" strokeWidth="1" opacity="0.9">
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          const x2 = 60 + 40 * Math.cos((angle * Math.PI) / 180);
          const y2 = 60 + 40 * Math.sin((angle * Math.PI) / 180);
          const x1 = 60 + 33 * Math.cos((angle * Math.PI) / 180);
          const y1 = 60 + 33 * Math.sin((angle * Math.PI) / 180);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      <foreignObject x="34" y="34" width="52" height="52">
        <div className="h-full w-full flex items-center justify-center">
          <ShieldCheck className="h-7 w-7 text-[#C9A94A]" strokeWidth={1.75} />
        </div>
      </foreignObject>
    </svg>
  );
}

function DataField({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-[#AE8A2E] mt-0.5 shrink-0" strokeWidth={2} />
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#6B6558]">{label}</div>
        <div className={`text-[13.5px] font-semibold text-[#221D17] ${mono ? "font-mono tracking-tight" : ""}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function PermitCertificatePage({ params }: PermitCertificatePageProps) {
  const { id: permitId } = React.use(params);

  const { useGetPermit } = useBusinessPermits();
  const hasValidId = !!permitId;
  const { data: certResponse, isLoading, error } = useGetPermit(permitId);
  const cert = certResponse;

  if (!hasValidId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md p-8 text-center border-[#1E2A54]/15">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#1E2A54]/8 flex items-center justify-center">
              <FileQuestion className="h-8 w-8 text-[#1E2A54]" />
            </div>
            <h2 className="text-xl font-semibold">No Permit ID Provided</h2>
            <p className="text-muted-foreground">
              A valid permit ID is required to view this certificate. Please check the link or go back to your permits.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/dashboard/permits">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Permits
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading permit certificateâ€¦
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md p-8 text-center border-[#1E2A54]/15">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Permit Certificate Not Found</h2>
            <p className="text-muted-foreground">
              {error ? "Unable to load certificate data." : "No certificate found for this permit."}
              <br />
              Please ensure the permit has been issued and a certificate is available.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/dashboard/permits">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Permits
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

const issuedDate = cert.updatedAt
    ? format(parseISO(cert.updatedAt), "d MMMM yyyy")
    : "Not Issued";
  const validFrom = cert.validFrom
    ? format(parseISO(cert.validFrom), "d MMMM yyyy")
    : "Not Specified";
  const validTo = cert.validTo
    ? format(parseISO(cert.validTo), "d MMMM yyyy"  )
    : "Not Specified";
  const categoryDisplay = cert.config.name ||"Trade Permit";

  return (
    <div className="cert-page">
      {/* Toolbar  -  hidden on print */}
      <div className="no-print flex items-center justify-between mb-5">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/permits">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Permits
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="bg-[#1E2A54] hover:bg-[#233260] text-white shadow-md">
          <Printer className="h-4 w-4 mr-2" /> Download PDF / Print
        </Button>
      </div>

      {/* Certificate document */}
      <div
        className="print-area cert-document mx-auto bg-[#F8F2E3] text-[#221D17] shadow-2xl relative overflow-hidden"
        style={{ maxWidth: "1100px", aspectRatio: "1.414 / 1", fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui" }}
      >
        {/* Faint diagonal security watermark */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="text-[#1E2A54]/[0.05] font-bold whitespace-nowrap"
            style={{ fontSize: "170px", transform: "rotate(-28deg)", fontFamily: "'Spectral', Georgia, serif" }}
          >
            OGUN STATE · OGUN STATE
          </span>
        </div>

        <div className="relative h-full w-full flex flex-col">
          <AdireBorder />

          <div className="relative flex-1 px-12 py-7 flex flex-col">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <SealMedallion />
              <div className="mt-3 text-[10.5px] tracking-[0.34em] text-[#8C3E23] font-semibold">
                FEDERAL REPUBLIC OF NIGERIA
              </div>
              <h1
                className="mt-1 text-[32px] leading-tight font-bold text-[#1E2A54]"
                style={{ fontFamily: "'Cinzel', 'Trajan Pro', serif" }}
              >
                the Local Government
              </h1>
              <div className="text-sm text-[#6B6558] italic" style={{ fontFamily: "'EB Garamond', serif" }}>Office of the Local Government Chairman  -  Ogun State</div>

              <div className="mt-4 flex items-center gap-3">
                <span className="h-px w-10 bg-[#AE8A2E]" />
                <h2
                  className="text-xl font-bold tracking-[0.22em] text-[#8C3E23]"
                  style={{ fontFamily: "'Cinzel', 'Trajan Pro', serif" }}
                >
                  TRADE PERMIT CERTIFICATE
                </h2>
                <span className="h-px w-10 bg-[#AE8A2E]" />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 mt-6 text-center">
              <p className="text-[15px] text-[#6B6558]" style={{ fontFamily: "'EB Garamond', serif" }}>
                This is to certify that
              </p>

              <p
                className="mt-3 text-[38px] font-bold uppercase tracking-wide text-[#1E2A54] leading-tight"
                style={{ fontFamily: "'Cinzel', 'Trajan Pro', serif" }}
              >
                {cert.business.businessName}
              </p>
              <div className="mx-auto mt-1 h-[3px] w-24 bg-[#AE8A2E] rounded-full" />

              <p className="mt-3 text-[15px] text-[#4A453B]" style={{ fontFamily: "'EB Garamond', serif" }}>
                Owned by <span className="font-semibold text-[#221D17]">{cert.business.owner.firstName} {cert.business.owner.lastName}</span>
              </p>

              <div
                className="mt-5 max-w-2xl mx-auto text-[15px] leading-relaxed text-[#3D382E]"
                style={{ fontFamily: "'EB Garamond', serif" }}
              >
                <p>
                  is a registered business operating in <span className="font-semibold">{cert.business.ward?.name || LGA_CONFIG.identity.name}</span>{" "}
                  Ward, within the <span className="font-semibold">Local Government Area</span> of{" "}
                  <span className="font-semibold">Ogun State</span>, and is duly licensed to engage in{" "}
                  <span className="font-semibold">{categoryDisplay}</span> activities in accordance with the Local
                  Government Bye-Laws and Trade Regulations.
                </p>
              </div>

              <div className="mt-6 max-w-2xl mx-auto grid grid-cols-4 gap-x-4 gap-y-4 border-y border-[#1E2A54]/12 py-4">
                <DataField icon={Fingerprint} label="Permit No." value={cert.permitNumber} mono />
                <DataField icon={ShieldCheck} label="Verification" value={cert.verificationCode} mono />
                <DataField icon={Calendar} label="Valid From" value={validFrom} />
                <DataField icon={Calendar} label="Valid Until" value={validTo} />
              </div>

              <p className="mt-4 text-[12px] text-[#6B6558]">
                Issued this {issuedDate} · Certificate No.{" "}
                <span className="font-mono font-semibold text-[#221D17]">{cert.certificateNumber || cert.permitNumber}</span>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-auto grid grid-cols-3 gap-6 items-end pt-5">
              <div className="text-center">
                <div className="border-t-2 border-[#1E2A54] pt-2">
                  <div className="font-semibold text-[13px]" style={{ fontFamily: "'Libertinus Serif', serif" }}>
                    Hon. Local Government Chairman
                  </div>
                  <div className="text-[11px] text-[#6B6558] italic" style={{ fontFamily: "'EB Garamond', serif" }}>{LGA_CONFIG.identity.name}</div>
                </div>
              </div>

              <div className="text-center text-[10.5px] text-[#6B6558]" style={{ fontFamily: "'Arimo', sans-serif" }}>
                <span className="italic">
                  This certificate is electronically issued and remains the property of {LGA_CONFIG.identity.name} Council.
                </span>
                <span className="flex items-center justify-center gap-1 mt-1 text-[#8C3E23] font-semibold not-italic">
                  <CheckCircle2 className="h-3 w-3" />
                  Digitally Verified
                </span>
              </div>

              <div className="flex flex-col items-end">
                <div className="p-1.5 bg-white border-2 border-[#1E2A54]/20 rounded">
                  <QRCodeSVG
                    value={`${process.env.NEXT_PUBLIC_BASE_URL}/verify?id=${cert.permitNumber}`}
                    size={104}
                  />
                </div>
                <div className="mt-1.5 text-[9px] text-[#6B6558] font-mono max-w-[140px] text-right truncate">
                  Scan to verify · {cert.qrToken || cert.permitNumber.slice(-8)}
                </div>
              </div>
            </div>
          </div>

          <AdireBorder flip />
        </div>
      </div>
    </div>
  );
}
