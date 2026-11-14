"use client";

import React, { useState } from "react";
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
  Layers,
  FileBadge,
  Sparkles,
  AlertCircle,
  Clock,
  Shield,
} from "lucide-react";
import { useCreateService } from "@/hooks/queries/useServices";
import { toast } from "sonner";

interface CreateServiceModalProps {
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

export function CreateServiceModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateServiceModalProps) {
  const createServiceMutation = useCreateService();

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
  const [requirements, setRequirements] = useState<string[]>([
    "passport_photo",
    "nin_slip",
    "proof_of_residency",
  ]);
  const [newReqInput, setNewReqInput] = useState("");

  // Fee Configuration State (Required & > 0)
  const [feeAmount, setFeeAmount] = useState("");
  const [feeExpiryDate, setFeeExpiryDate] = useState("");
  const [feeNotes, setFeeNotes] = useState("");

  // Error State
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-generate code from name if code is empty or unchanged
  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code === name.toLowerCase().replace(/[^a-z0-9]+/g, "_")) {
      setCode(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
      );
    }
  };

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

  const resetForm = () => {
    setCode("");
    setName("");
    setCategory("Licences & Permits");
    setCustomCategory("");
    setRevenueHead("");
    setDescription("");
    setEstimatedDays("3");
    setCertificateType("CERTIFICATE_OF_REGISTRATION");
    setSupportsRenewal(false);
    setIsActive(true);
    setFoOnly(false);
    setRequirements(["passport_photo", "nin_slip", "proof_of_residency"]);
    setNewReqInput("");
    setFeeAmount("");
    setFeeExpiryDate("");
    setFeeNotes("");
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!name.trim()) {
      setValidationError("Service Name is required.");
      return;
    }
    if (!code.trim()) {
      setValidationError("Service Code (slug) is required.");
      return;
    }
    if (!revenueHead.trim()) {
      setValidationError("Revenue Head code is required.");
      return;
    }

    // FO-only services have no fixed fee and no document checklist: the
    // collecting officer records the amount actually paid per collection.
    const numAmount = parseFloat(feeAmount);
    if (!foOnly) {
      if (isNaN(numAmount) || numAmount <= 0) {
        setValidationError("Statutory Fee Amount is required and must be greater than ₦0.");
        return;
      }

      if (requirements.length === 0) {
        setValidationError("At least one document requirement must be defined.");
        return;
      }
    }

    const finalCategory =
      category === "custom" ? customCategory.trim() || "General Services" : category;

    const payload: any = {
      code: code.trim(),
      name: name.trim(),
      category: foOnly ? "OTHERS" : finalCategory,
      revenueHead: revenueHead.trim().toUpperCase(),
      description: description.trim() || `${name} statutory local government service.`,
      requirements,
      estimatedDays: Math.max(1, parseInt(estimatedDays) || 3),
      certificateType: foOnly ? "NONE" : certificateType,
      supportsRenewal,
      isActive,
      foOnly,
    };

    if (!foOnly) {
      payload.feeConfig = {
        amount: numAmount,
        expiryDate: feeExpiryDate ? new Date(feeExpiryDate).toISOString() : undefined,
        notes: feeNotes.trim() || undefined,
      };
    }

    try {
      await createServiceMutation.mutateAsync(payload);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("Create service failed:", err);
      setValidationError(err?.message || "Failed to create statutory service. Please check your inputs.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Create Statutory Service & Fee Schedule
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Register a new revenue service, configure statutory fees, and define required documents for the LGA citizens.
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

          {/* Section 1: Service Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                1. Service Information
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="service-name" className="text-xs font-semibold">
                  Service Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="service-name"
                  placeholder="e.g. Commercial Motorcycle & Tricycle Operator Permit"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-10 text-sm bg-background"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="service-code" className="text-xs font-semibold">
                  Service Code (Slug) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="service-code"
                  placeholder="e.g. motorcycle_permit"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-9 text-xs font-mono bg-background"
                  required
                />
                <span className="text-[10px] text-muted-foreground">
                  Unique identifier used in system URLs and forms.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="revenue-head" className="text-xs font-semibold">
                  Revenue Head <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="revenue-head"
                  placeholder="e.g. REV-TRAN-004"
                  value={revenueHead}
                  onChange={(e) => setRevenueHead(e.target.value)}
                  className="h-9 text-xs font-mono uppercase bg-background"
                  required
                />
                <span className="text-[10px] text-muted-foreground">
                  Statutory accounting revenue head code.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category-select" className="text-xs font-semibold">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category-select" className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                    {foOnly && (
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
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="certificate-type" className="text-xs font-semibold">
                  Certificate / Document Type <span className="text-destructive">*</span>
                </Label>
                <Select value={certificateType} onValueChange={setCertificateType}>
                  <SelectTrigger id="certificate-type" className="h-9 text-xs bg-background">
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
                <Label htmlFor="service-desc" className="text-xs font-semibold">
                  Public Description & Overview
                </Label>
                <Textarea
                  id="service-desc"
                  placeholder="Describe the service purpose, legal mandate, and who should apply..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs bg-background min-h-[70px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estimated-days" className="text-xs font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Estimated Processing Days
                </Label>
                <Input
                  id="estimated-days"
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
                Dynamic document upload checklist
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
                  <Label htmlFor="supports-renewal" className="text-xs font-semibold cursor-pointer">
                    Supports Periodic Renewal
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Allows citizens to renew yearly without re-registering.
                  </p>
                </div>
                <Switch
                  id="supports-renewal"
                  checked={supportsRenewal}
                  onCheckedChange={setSupportsRenewal}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="is-active" className="text-xs font-semibold cursor-pointer">
                    Service Active Status
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Make visible in public and dashboard service catalogue.
                  </p>
                </div>
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="fo-only" className="text-xs font-semibold cursor-pointer">
                    Field Officer Only
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Never shown to the public. The collecting officer records the amount paid, so no fixed fee is set.
                  </p>
                </div>
                <Switch
                  id="fo-only"
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

          {/* Section 4: Statutory Fee Configuration (Visually Separated) */}
          {foOnly ? (
            <div className="p-4 rounded-xl border bg-muted/20 text-xs text-muted-foreground">
              FO-only service: no fixed fee is set. The collecting officer records the
              amount actually paid on each collection, and the treasurer confirms it.
            </div>
          ) : (
          <div className="p-4 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-1 border-b border-primary/20">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-primary text-primary-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  4. Statutory Fee Configuration (Mandatory)
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                Required &gt; ₦0
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="fee-amount" className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>
                    Statutory Fee Amount (NGN) <span className="text-destructive">*</span>
                  </span>
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
                    id="fee-amount"
                    type="number"
                    min="1"
                    step="500"
                    placeholder="e.g. 15000"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="pl-8 h-10 font-bold text-sm bg-background border-primary/30 focus-visible:ring-primary"
                    required
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
                <Label htmlFor="fee-expiry" className="text-xs font-semibold">
                  Fee Schedule Expiry (Optional)
                </Label>
                <Input
                  id="fee-expiry"
                  type="date"
                  value={feeExpiryDate}
                  onChange={(e) => setFeeExpiryDate(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
                <span className="text-[10px] text-muted-foreground">
                  Leave blank for indefinitely active statutory fee.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fee-notes" className="text-xs font-semibold">
                  Statutory Notes / Council Bye-Law Ref
                </Label>
                <Input
                  id="fee-notes"
                  placeholder="e.g. Approved via 2026 LGA Revenue Schedule Bye-law"
                  value={feeNotes}
                  onChange={(e) => setFeeNotes(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>
          </div>
          )}

          <DialogFooter className="pt-2 border-t flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createServiceMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createServiceMutation.isPending}
              className="text-xs font-semibold bg-primary gap-1.5"
            >
              {createServiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Service...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Create Statutory Service
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
