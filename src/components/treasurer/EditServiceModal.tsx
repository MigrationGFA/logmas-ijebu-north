"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  X,
  Loader2,
  CheckCircle2,
  DollarSign,
  Edit3,
  AlertCircle,
  Clock,
  Save,
} from "lucide-react";
import { useUpdateService } from "@/hooks/queries/useServices";
import { toast } from "sonner";

interface EditServiceModalProps {
  service: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PRESET_CATEGORIES = [
  "Certificates",
  "Community & Agriculture",
  "Rates & Levies",
  "Licences & Permits",
  "Urban Development",
];

const PRESET_CERT_TYPES = [
  { value: "CERTIFICATE_OF_ORIGIN", label: "Certificate of Origin" },
  { value: "CERTIFICATE_OF_REGISTRATION", label: "Certificate of Registration" },
  { value: "TENEMENT_RATE_ASSESSMENT", label: "Tenement Rate Assessment" },
  { value: "ENVIRONMENTAL_HEALTH_CERTIFICATE", label: "Environmental Health Certificate" },
  { value: "TRADE_PERMIT", label: "Trade / Business Permit" },
  { value: "LIQUOR_LICENCE", label: "Liquor Licence" },
  { value: "VIEWING_CENTRE_LICENCE", label: "Viewing Centre Licence" },
  { value: "QUARRY_PERMIT", label: "Quarry Operation Permit" },
  { value: "STREET_NAMING_CERTIFICATE", label: "Street Naming Approval Certificate" },
  { value: "KIOSK_PERMIT", label: "Kiosk / Temporary Structure Permit" },
  { value: "HAULAGE_PERMIT", label: "Haulage & Loading Permit" },
  { value: "NONE", label: "None / Statutory Receipt Only" },
];

const COMMON_REQUIREMENTS = [
  { key: "passport_photo", label: "Passport Photo" },
  { key: "nin_slip", label: "NIN Slip" },
  { key: "proof_of_residency", label: "Proof of Residency" },
  { key: "cac_certificate", label: "CAC Certificate" },
  { key: "tax_clearance", label: "Tax Clearance" },
  { key: "site_plan", label: "Site Inspection Plan" },
  { key: "health_clearance", label: "Health Clearance" },
  { key: "police_report", label: "Police Report / Character" },
];

export function EditServiceModal({
  service,
  open,
  onOpenChange,
  onSuccess,
}: EditServiceModalProps) {
  const updateServiceMutation = useUpdateService();

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Licences & Permits");
  const [customCategory, setCustomCategory] = useState("");
  const [revenueHead, setRevenueHead] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("3");
  const [certificateType, setCertificateType] = useState("CERTIFICATE_OF_REGISTRATION");
  const [supportsRenewal, setSupportsRenewal] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [foOnly, setFoOnly] = useState(false);

  // Requirements Dynamic List
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newReqInput, setNewReqInput] = useState("");

  // Fee Configuration State
  const [feeAmount, setFeeAmount] = useState("");
  const [feeExpiryDate, setFeeExpiryDate] = useState("");
  const [feeStatus, setFeeStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [feeNotes, setFeeNotes] = useState("");

  // Error State
  const [validationError, setValidationError] = useState<string | null>(null);

  // Populate when service prop changes
  useEffect(() => {
    if (!service) return;

    setCode(service.code || service.slug || "");
    setName(service.name || "");
    if (PRESET_CATEGORIES.includes(service.category)) {
      setCategory(service.category);
      setCustomCategory("");
    } else if (service.category) {
      setCategory("custom");
      setCustomCategory(service.category);
    } else {
      setCategory("Licences & Permits");
      setCustomCategory("");
    }

    setRevenueHead(service.revenueHead || "");
    setDescription(service.description || "");
    setEstimatedDays(String(service.estimatedDays || 3));
    setCertificateType(service.certificateType || "CERTIFICATE_OF_REGISTRATION");
    setSupportsRenewal(Boolean(service.supportsRenewal));
    setIsActive(service.isActive !== false);
    setFoOnly(Boolean(service.foOnly));
    if (service.category === "OTHERS") {
      setCategory("OTHERS");
      setCustomCategory("");
    }

    // Requirements
    if (Array.isArray(service.requirements)) {
      setRequirements([...service.requirements]);
    } else {
      setRequirements(["passport_photo", "nin_slip", "proof_of_residency"]);
    }

    // Fee Config
    const fee = service.feeConfig || service.fee || {};
    const amountVal = fee.amount ?? service.currentFee ?? "";
    setFeeAmount(amountVal !== "" ? String(amountVal) : "");
    if (fee.expiryDate) {
      setFeeExpiryDate(new Date(fee.expiryDate).toISOString().split("T")[0]);
    } else {
      setFeeExpiryDate("");
    }
    setFeeStatus(fee.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
    setFeeNotes(fee.notes || "");
    setValidationError(null);
  }, [service, open]);

  const handleAddRequirement = (reqKey?: string) => {
    const raw = reqKey || newReqInput;
    const clean = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!clean) return;

    if (requirements.includes(clean)) {
      toast.info(`Requirement "${clean}" is already in the list.`);
      setNewReqInput("");
      return;
    }

    setRequirements([...requirements, clean]);
    setNewReqInput("");
  };

  const handleRemoveRequirement = (reqToRemove: string) => {
    setRequirements(requirements.filter((r) => r !== reqToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    setValidationError(null);

    // Validation
    if (!name.trim()) {
      setValidationError("Service Name is required.");
      return;
    }

    const numAmount = parseFloat(feeAmount);
    if (feeAmount && (isNaN(numAmount) || numAmount < 0)) {
      setValidationError("Statutory Fee Amount must be a valid non-negative number.");
      return;
    }

    const finalCategory =
      category === "custom" ? customCategory.trim() || "General Services" : category;

    const payload: any = {
      code: code.trim(),
      name: name.trim(),
      category: foOnly ? "OTHERS" : finalCategory,
      revenueHead: revenueHead.trim().toUpperCase(),
      description: description.trim(),
      requirements,
      estimatedDays: Math.max(1, parseInt(estimatedDays) || 3),
      certificateType: foOnly ? "NONE" : certificateType,
      supportsRenewal,
      isActive,
      foOnly,
    };

    if (!foOnly && feeAmount && !isNaN(numAmount)) {
      payload.feeConfig = {
        amount: numAmount,
        expiryDate: feeExpiryDate ? new Date(feeExpiryDate).toISOString() : null,
        status: feeStatus,
        notes: feeNotes.trim() || undefined,
      };
    }

    const serviceId = service.id || service.code;

    try {
      await updateServiceMutation.mutateAsync({
        serviceId,
        data: payload,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("Update service failed:", err);
      setValidationError(err?.message || "Failed to update statutory service.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Edit Statutory Service: {service?.name || "Service"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Modify service specifications, document requirements, and update the active statutory fee schedule.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {validationError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Core Service Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                1. Service Information
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-service-name" className="text-xs font-semibold">
                  Service Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-service-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-sm bg-background"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-service-code" className="text-xs font-semibold">
                  Service Code (Slug)
                </Label>
                <Input
                  id="edit-service-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-9 text-xs font-mono bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-revenue-head" className="text-xs font-semibold">
                  Revenue Head Code
                </Label>
                <Input
                  id="edit-revenue-head"
                  value={revenueHead}
                  onChange={(e) => setRevenueHead(e.target.value)}
                  className="h-9 text-xs font-mono uppercase bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-category-select" className="text-xs font-semibold">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="edit-category-select" className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                    {(foOnly || category === "OTHERS") && (
                      <SelectItem value="OTHERS" className="text-xs">
                        Others
                      </SelectItem>
                    )}
                    <SelectItem value="custom" className="text-xs italic text-primary">
                      + Custom Category...
                    </SelectItem>
                  </SelectContent>
                </Select>
                {category === "custom" && (
                  <Input
                    placeholder="Type custom category name..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="h-8 text-xs mt-1 bg-background"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-certificate-type" className="text-xs font-semibold">
                  Certificate / Document Type
                </Label>
                <Select value={certificateType} onValueChange={setCertificateType}>
                  <SelectTrigger id="edit-certificate-type" className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_CERT_TYPES.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value} className="text-xs">
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-service-desc" className="text-xs font-semibold">
                  Public Description & Overview
                </Label>
                <Textarea
                  id="edit-service-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs bg-background min-h-[70px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-estimated-days" className="text-xs font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Estimated Processing Days
                </Label>
                <Input
                  id="edit-estimated-days"
                  type="number"
                  min="1"
                  max="60"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dynamic Requirements */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                2. Required Documents ({requirements.length})
              </span>
              <span className="text-[11px] text-muted-foreground">
                Document requirements checklist
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. proof_of_address, tax_clearance"
                  value={newReqInput}
                  onChange={(e) => setNewReqInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRequirement();
                    }
                  }}
                  className="h-9 text-xs font-mono bg-background flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleAddRequirement()}
                  className="h-9 text-xs gap-1 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Key
                </Button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-muted-foreground mr-1">
                  Quick Add:
                </span>
                {COMMON_REQUIREMENTS.map((req) => (
                  <button
                    key={req.key}
                    type="button"
                    onClick={() => handleAddRequirement(req.key)}
                    disabled={requirements.includes(req.key)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      requirements.includes(req.key)
                        ? "bg-muted text-muted-foreground/50 border-border/40 cursor-not-allowed"
                        : "bg-muted/60 hover:bg-muted text-foreground border-border/80 cursor-pointer"
                    }`}
                  >
                    + {req.label}
                  </button>
                ))}
              </div>

              {/* Active Requirements Badges */}
              <div className="flex flex-wrap gap-2 pt-2 p-3 rounded-lg bg-muted/30 border border-border/60 min-h-[50px]">
                {requirements.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">
                    No document requirements added yet. Click preset buttons or type above.
                  </span>
                ) : (
                  requirements.map((req) => (
                    <Badge
                      key={req}
                      variant="secondary"
                      className="text-xs font-mono py-1 px-2.5 flex items-center gap-1.5 bg-background border shadow-2xs"
                    >
                      <span>{req}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(req)}
                        className="hover:text-destructive text-muted-foreground transition-colors p-0.5 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Service Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                3. Service Settings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-muted/20 border">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-supports-renewal" className="text-xs font-semibold cursor-pointer">
                    Supports Periodic Renewal
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Allows citizens to renew without re-registering.
                  </p>
                </div>
                <Switch
                  id="edit-supports-renewal"
                  checked={supportsRenewal}
                  onCheckedChange={setSupportsRenewal}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-is-active" className="text-xs font-semibold cursor-pointer">
                    Service Active Status
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Make visible in public and dashboard catalogue.
                  </p>
                </div>
                <Switch
                  id="edit-is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-fo-only" className="text-xs font-semibold cursor-pointer">
                    Field Officer Only
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Never shown to the public. The collecting officer records the amount paid, so no fixed fee applies.
                  </p>
                </div>
                <Switch
                  id="edit-fo-only"
                  checked={foOnly}
                  onCheckedChange={(v) => {
                    setFoOnly(v);
                    if (v) {
                      setCertificateType("NONE");
                      setCategory("OTHERS");
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Visually Separated Fee Configuration Section */}
          <div className="p-4 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-1 border-b border-primary/20">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-primary text-primary-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  4. Statutory Fee Configuration
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                Treasurer Authority
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-fee-amount" className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Statutory Fee Amount (NGN)</span>
                  {feeAmount && !isNaN(Number(feeAmount)) && Number(feeAmount) > 0 && (
                    <span className="text-primary font-mono text-xs">
                      ₦{Number(feeAmount).toLocaleString()}
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
                    ₦
                  </div>
                  <Input
                    id="edit-fee-amount"
                    type="number"
                    min="0"
                    step="500"
                    placeholder="e.g. 15000"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="pl-8 h-10 font-bold text-sm bg-background border-primary/30 focus-visible:ring-primary"
                  />
                </div>

                {/* Quick fee presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground self-center mr-1">
                    Presets:
                  </span>
                  {[3500, 5000, 10000, 15000, 25000, 50000, 100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFeeAmount(String(preset))}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        Number(feeAmount) === preset
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "bg-background hover:bg-muted text-muted-foreground border-border/80"
                      }`}
                    >
                      ₦{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-fee-expiry" className="text-xs font-semibold">
                  Fee Schedule Expiry Date
                </Label>
                <Input
                  id="edit-fee-expiry"
                  type="date"
                  value={feeExpiryDate}
                  onChange={(e) => setFeeExpiryDate(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-fee-status" className="text-xs font-semibold">
                  Fee Schedule Status
                </Label>
                <Select
                  value={feeStatus}
                  onValueChange={(val: "ACTIVE" | "INACTIVE") => setFeeStatus(val)}
                >
                  <SelectTrigger id="edit-fee-status" className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE" className="text-xs font-semibold text-emerald-600">
                      ACTIVE (Enforced)
                    </SelectItem>
                    <SelectItem value="INACTIVE" className="text-xs font-semibold text-destructive">
                      INACTIVE (Suspended)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-fee-notes" className="text-xs font-semibold">
                  Statutory Notes / Council Bye-Law Justification
                </Label>
                <Input
                  id="edit-fee-notes"
                  placeholder="e.g. Revised statutory schedule ratified by Legislative Council"
                  value={feeNotes}
                  onChange={(e) => setFeeNotes(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateServiceMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateServiceMutation.isPending}
              className="text-xs font-semibold bg-primary gap-1.5"
            >
              {updateServiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Service Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
