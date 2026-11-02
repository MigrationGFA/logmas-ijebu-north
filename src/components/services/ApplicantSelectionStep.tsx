"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserCheck, UserPlus, ShieldCheck, CheckCircle2, User, Phone, MapPin, Building2, AlertCircle } from "lucide-react";
import { LGA_CONFIG } from "@/config/lga.config";
import { ApplicantSearchResult } from "@/types/application";
import { useSearchApplicants } from "@/hooks/queries/useApplications";

const WARDS = LGA_CONFIG.wards.map((ward) => ward.name);

export interface ApplicantSnapshot {
  applicantId?: string | null;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  ward?: string;
  nin?: string;
  cacNumber?: string;
  isRegistered?: boolean;
}

interface ApplicantSelectionStepProps {
  mode: "field_officer" | "citizen" | "business_owner" | "admin";
  value: ApplicantSnapshot;
  onChange: (val: ApplicantSnapshot) => void;
  serviceCategory?: string;
  serviceName?: string;
}

export function ApplicantSelectionStep({
  mode,
  value,
  onChange,
  serviceCategory,
  serviceName,
}: ApplicantSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults = [], isFetching } = useSearchApplicants(debouncedQuery);

  const handleSelectApplicant = (applicant: ApplicantSearchResult) => {
    onChange({
      applicantId: applicant.id,
      fullName: applicant.name,
      phone: applicant.phone,
      email: applicant.email || "",
      address: applicant.address || "Ijebu North East LGA, Ogun State",
      ward: applicant.ward || "Atan-Imuku",
      nin: applicant.nin || "",
      cacNumber: applicant.cacNumber || "",
      isRegistered: true,
    });
    setIsCreatingNew(false);
  };

  const handleCreateNewMode = () => {
    setIsCreatingNew(true);
    onChange({
      applicantId: null,
      fullName: "",
      phone: "",
      email: "",
      address: "",
      ward: "Atan-Imuku",
      nin: "",
      cacNumber: "",
      isRegistered: false,
    });
  };

  const handleClearSelection = () => {
    onChange({
      applicantId: null,
      fullName: "",
      phone: "",
      email: "",
      address: "",
      ward: "Atan-Imuku",
      nin: "",
      cacNumber: "",
      isRegistered: false,
    });
    setIsCreatingNew(false);
  };

  const isFieldOfficer = mode === "field_officer";

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h4 className="text-base font-bold text-foreground">
          {isFieldOfficer ? "Applicant Verification & Contact Information" : "Applicant Contact & Residency Information"}
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          {isFieldOfficer
            ? `Search for an existing registered citizen / business owner in Ijebu North East LGA or record a new unregistered applicant applying for ${serviceName || "this service"}.`
            : "Review and confirm your statutory contact and residency details for this application."}
        </p>
      </div>

      {/* Field Officer: Search & Selection Mode */}
      {isFieldOfficer && (
        <div className="space-y-4">
          {!value.fullName && !isCreatingNew ? (
            <div className="bg-muted/20 border border-border/80 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Step 1: Locate Registered Citizen / Business
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCreateNewMode}
                  className="text-xs gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Create New / Unregistered Applicant
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by NIN, Phone Number, Full Name, or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-card text-xs sm:text-sm"
                />
              </div>

              {isFetching && (
                <div className="text-xs text-muted-foreground py-2 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Searching Ijebu North East LGA citizen & business registry...
                </div>
              )}

              {/* Search Results List */}
              {debouncedQuery.length >= 2 && !isFetching && searchResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Matching Registered Citizens / Businesses ({searchResults.length}):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {searchResults.map((res) => (
                      <div
                        key={res.id}
                        className="bg-card border rounded-lg p-3 hover:border-primary transition-all flex flex-col justify-between gap-2 shadow-xs"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-foreground truncate">{res.name}</span>
                            <Badge variant="outline" className="text-[10px] capitalize shrink-0 bg-primary/5 text-primary border-primary/20">
                              {res.role.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {res.phone}
                          </div>
                          {res.nin && (
                            <div className="text-[11px] text-muted-foreground">
                              NIN: <span className="font-mono">{res.nin}</span>
                            </div>
                          )}
                          {res.address && (
                            <div className="text-[11px] text-muted-foreground truncate">
                              {res.address}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSelectApplicant(res)}
                          className="w-full text-xs h-7 gap-1 bg-primary text-primary-foreground"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Select This Applicant
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {debouncedQuery.length >= 2 && !isFetching && searchResults.length === 0 && (
                <div className="text-center py-5 bg-background/50 border rounded-lg space-y-2">
                  <p className="text-xs text-muted-foreground">
                    No registered citizen or business matches &quot;{debouncedQuery}&quot;.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCreateNewMode}
                    className="text-xs gap-1.5"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Record as New / Unregistered Applicant
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">
                      {value.fullName || "Unregistered Walk-in Applicant"}
                    </span>
                    {value.applicantId ? (
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] border-emerald-400">
                        Registered User (ID: {value.applicantId})
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] border-amber-400">
                        Unregistered Applicant
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Phone: {value.phone || " - "} • Ward: {value.ward || " - "}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                className="text-xs h-8 shrink-0"
              >
                Change Applicant
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Snapshot Information Form */}
      {(mode !== "field_officer" || value.fullName || isCreatingNew) && (
        <div className="space-y-4 bg-muted/10 border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between border-b pb-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-primary">
              Applicant Profile & Contact Details
            </h5>
            <span className="text-[11px] text-muted-foreground">
              Statutory verification reference
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="applicant_fullName">
                Full Name / Legal Identity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="applicant_fullName"
                required
                value={value.fullName}
                onChange={(e) => onChange({ ...value, fullName: e.target.value })}
                placeholder="e.g. Chief Olufemi Adebayo"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="applicant_phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="applicant_phone"
                required
                value={value.phone}
                onChange={(e) => onChange({ ...value, phone: e.target.value })}
                placeholder="e.g. 08031234567"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="applicant_email">Email Address (Optional)</Label>
              <Input
                id="applicant_email"
                type="email"
                value={value.email || ""}
                onChange={(e) => onChange({ ...value, email: e.target.value })}
                placeholder="e.g. applicant@domain.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="applicant_ward">
                Ward of Residence in Ijebu North East LGA <span className="text-red-500">*</span>
              </Label>
              <Select
                value={value.ward || "Atan-Imuku"}
                onValueChange={(val) => onChange({ ...value, ward: val })}
              >
                <SelectTrigger id="applicant_ward">
                  <SelectValue placeholder="Select Ward" />
                </SelectTrigger>
                <SelectContent>
                  {WARDS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w} Ward
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="applicant_address">
                Residential / Operational Address in Ijebu North East LGA <span className="text-red-500">*</span>
              </Label>
              <Input
                id="applicant_address"
                required
                value={value.address}
                onChange={(e) => onChange({ ...value, address: e.target.value })}
                placeholder="Street address, Village / Quarter, Ijebu North East LGA"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="applicant_nin">
                National Identification Number (NIN)
              </Label>
              <Input
                id="applicant_nin"
                value={value.nin || ""}
                onChange={(e) => onChange({ ...value, nin: e.target.value })}
                placeholder="11-digit NIN (e.g. 98765432101)"
                maxLength={11}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="applicant_cacNumber">
                CAC Business Registration No. (If Applicable)
              </Label>
              <Input
                id="applicant_cacNumber"
                value={value.cacNumber || ""}
                onChange={(e) => onChange({ ...value, cacNumber: e.target.value })}
                placeholder="e.g. RC-123456 or BN-789012"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

