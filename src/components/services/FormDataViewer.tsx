"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Check, X, Building2, User, FileText, MapPin, Tag } from "lucide-react";

interface FormDataViewerProps {
  formData: Record<string, any>;
  className?: string;
}

// Convert camelCase or snake_case to Human Readable Title Case
function formatLabel(key: string): string {
  const customMap: Record<string, string> = {
    nin: "National ID (NIN)",
    cacNumber: "CAC Registration No.",
    cdaName: "CDA Name",
    dob: "Date of Birth",
    dateOfBirth: "Date of Birth",
    fatherName: "Father's Full Name",
    fatherCompound: "Father's Compound / Agbo-Ile",
    fatherVillage: "Father's Ancestral Village",
    motherName: "Mother's Maiden Name",
    motherCompound: "Mother's Compound",
    motherVillage: "Mother's Ancestral Village",
    familyBaale: "Quarter Chief / Family Baale",
    farmSizeHectares: "Farm Size (Hectares)",
    cadastreLeaseNo: "Mining Cadastre Lease No.",
    eiaRef: "EIA Approval Reference",
    annualRentalValue: "Annual Rental Value (₦)",
    dailyWasteVolume: "Daily Waste Volume",
    kioskDimensions: "Kiosk Dimensions",
    regNo: "Registration No.",
    plateNumber: "Plate Number",
    chassisNumber: "Chassis Number",
    vehicleType: "Vehicle Type",
    engineCapacity: "Engine Capacity",
    tonnage: "Tonnage Capacity",
    hostCommunity: "Host Community / Village",
    councillorNotes: "Ward Councillor Notes",
    correctionNotes: "Correction Notice",
    rejectionReason: "Decline Justification",
  };

  if (customMap[key]) return customMap[key];

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function formatValue(value: any): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground italic text-[11px] font-normal"> - </span>;
  }

  if (typeof value === "boolean") {
    return value ? (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px] border-emerald-300">
        <Check className="h-3 w-3 mr-1" /> Yes
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
        <X className="h-3 w-3 mr-1" /> No
      </Badge>
    );
  }

  if (typeof value === "number") {
    return <span className="font-semibold text-foreground">{value.toLocaleString()}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic text-[11px]">None recorded</span>;
    }

    // Check if array of primitives
    if (typeof value[0] !== "object") {
      return (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {value.map((item, idx) => (
            <Badge key={idx} variant="secondary" className="text-[11px] font-normal">
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    }

    // Array of objects (e.g. executives, vehicles, trustees, units)
    return (
      <div className="space-y-2.5 w-full pt-1">
        {value.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg border bg-background/80 text-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 shadow-2xs"
          >
            <div className="col-span-full pb-1 border-b text-[11px] font-bold text-primary flex items-center justify-between">
              <span>Item #{idx + 1}</span>
              {item.role || item.title || item.type || item.designation ? (
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                  {item.role || item.title || item.type || item.designation}
                </Badge>
              ) : null}
            </div>
            {Object.entries(item).map(([subK, subV]) => (
              <div key={subK} className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium block">
                  {formatLabel(subK)}:
                </span>
                <div className="font-semibold text-foreground text-xs">{formatValue(subV)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="p-3 rounded-lg border bg-background/70 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium block">
              {formatLabel(k)}:
            </span>
            <div className="font-semibold text-foreground text-xs">{formatValue(v)}</div>
          </div>
        ))}
      </div>
    );
  }

  // String check if date
  const str = String(value);
  if (str.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return <span className="font-semibold text-foreground">{str}</span>;
  }

  return <span className="font-semibold text-foreground break-words">{str}</span>;
}

export function FormDataViewer({ formData, className = "" }: FormDataViewerProps) {
  if (!formData || Object.keys(formData).length === 0) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 border rounded-xl">
        No additional custom form data recorded for this application.
      </div>
    );
  }

  // Separate primitives from complex repeatable collections
  const simpleEntries: Array<[string, any]> = [];
  const complexEntries: Array<[string, any]> = [];

  Object.entries(formData).forEach(([k, v]) => {
    // Ignore internal keys, including underscore-prefixed flags such as
    // _foCollection that exist for the system, not for readers.
    if (
      ["applicantId", "createdById", "feeAmount", "isDraft"].includes(k) ||
      k.startsWith("_")
    )
      return;

    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object") {
      complexEntries.push([k, v]);
    } else {
      simpleEntries.push([k, v]);
    }
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Details Grid */}
      {simpleEntries.length > 0 && (
        <div className="border rounded-xl p-4 bg-muted/10 space-y-3">
          <h5 className="font-bold text-xs uppercase tracking-wider text-primary border-b pb-1.5">
            Service Specific Details
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
            {simpleEntries.map(([k, v]) => (
              <div key={k} className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground font-medium block">
                  {formatLabel(k)}:
                </span>
                <div className="text-foreground">{formatValue(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complex Repeatable Collections (e.g. Executives, Members, Vehicles, Equipment) */}
      {complexEntries.map(([k, v]) => (
        <div key={k} className="border rounded-xl p-4 bg-muted/10 space-y-3">
          <div className="flex items-center justify-between border-b pb-1.5">
            <h5 className="font-bold text-xs uppercase tracking-wider text-primary">
              {formatLabel(k)}
            </h5>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {v.length} Records
            </Badge>
          </div>
          {formatValue(v)}
        </div>
      ))}
    </div>
  );
}

