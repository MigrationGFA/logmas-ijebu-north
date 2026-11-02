"use client";
import React, { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatAndValidateNigerianPhoneNumber } from "@/lib/helper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LGA_CONFIG } from "@/config/lga.config";
import { ServiceType, getConfiguredFeeForService } from "@/config/lgaServices";
import { FormWizard, FormStep } from "./FormWizard";
import { DocumentUploadStep, DocumentSpec } from "./DocumentUploadStep";
import { ReviewSubmitStep, ReviewSection, ReviewRepeatableSection } from "./ReviewSubmitStep";
import { Plus, Trash2, Building, ShieldCheck, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ApplicantSnapshot } from "../ApplicantSelectionStep";

const WARDS = LGA_CONFIG.wards.map((ward) => ward.name);

const facilityUnitSchema = z.object({
  unitName: z.string().min(1, "Unit name is required"),
  unitType: z.string().optional(),
  restroomsCount: z.string().optional(),
  wasteBinsCount: z.string().optional(),
});

const safetyOfficerSchema = z.object({
  fullName: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().refine((val) => !val || formatAndValidateNigerianPhoneNumber(val).isValid, {
    message: "Valid Nigerian phone number required",
  }).optional(),
  certNumber: z.string().optional(),
});

const wasteStreamSchema = z.object({
  wasteType: z.string().optional(),
  estimatedVolume: z.string().optional(),
  disposalMethod: z.string().optional(),
});

export const environmentalSanitationSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  facilityCategory: z.string().min(1, "Facility category is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  phone: z.string().refine((val) => formatAndValidateNigerianPhoneNumber(val).isValid, {
    message: "Valid Nigerian phone number is required",
  }),
  email: z.string().email("Valid email address required").or(z.literal("")).optional(),
  physicalAddress: z.string().min(3, "Physical address is required"),
  ward: z.string().min(1, "Ward is required"),
  cacNumber: z.string().optional(),
  operatingHours: z.string().optional(),
  totalDailyStaff: z.string().optional(),
  primaryWaterSource: z.string().min(1, "Primary water source is required"),
  drainageType: z.string().min(1, "Drainage type is required"),
  wasteContractor: z.string().min(2, "Waste contractor is required"),
  evacuationFrequency: z.string().optional(),
  fumigationFrequency: z.string().optional(),
  units: z.array(facilityUnitSchema).min(1, "At least one facility unit is required"),
  safetyOfficers: z.array(safetyOfficerSchema).optional(),
  wasteStreams: z.array(wasteStreamSchema).optional(),
});

export type EnvironmentalSanitationFormData = z.infer<typeof environmentalSanitationSchema>;

interface Props {
  service: ServiceType;
  onSubmit: (formData: Record<string, any>) => void;
  isSubmitting?: boolean;
    initialApplicant?: ApplicantSnapshot;
}

interface FacilityUnit {
  unitName: string;
  unitType: string;
  restroomsCount: string;
  wasteBinsCount: string;
}

interface SafetyOfficer {
  fullName: string;
  role: string;
  phone: string;
  certNumber: string;
}

interface WasteStream {
  wasteType: string;
  estimatedVolume: string;
  disposalMethod: string;
}

const STEPS: FormStep[] = [
  {
    id: "facility_profile",
    title: "Facility & Business Profile",
    shortTitle: "Facility Profile",
    description: "Enter commercial/industrial facility details and physical location within Ijebu North East LGA.",
  },
  {
    id: "drainage_waste",
    title: "Water Supply, Drainage & Waste Management",
    shortTitle: "Sanitation Systems",
    description: "Provide details on water sources, drainage conduits, and accredited waste evacuation contractors.",
  },
  {
    id: "units_officers_waste",
    title: "Facility Units, Safety Officers & Waste Streams",
    shortTitle: "Units & Officers",
    description: "Itemize facility operational units, designated sanitation officers, and hazardous/solid waste streams.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description: "Upload facility sanitation layout, fumigation certificate, and accredited waste contract.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description: "Review environmental hygiene specifications and submit for statutory LGA inspection.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "sanitation_layout",
    label: "Facility Sanitation Layout Plan",
    description: "Architectural/floor plan showing location of restrooms, drainage lines, and waste disposal bins.",
    required: true,
  },
  {
    id: "fumigation_cert",
    label: "Current Pest Control & Fumigation Certificate",
    description: "Official certificate from an accredited environmental pest control company (within last 6 months).",
    required: true,
  },
  {
    id: "waste_contract_agreement",
    label: "Accredited PSP / Waste Evacuation Agreement",
    description: "Service contract with an authorized Ogun State / Ijebu North East LGA waste management contractor.",
    required: true,
  },
  {
    id: "facility_restroom_photos",
    label: "Restrooms & Refuse Storage Photographs",
    description: "Clear photographic evidence of sanitary facilities, handwashing stations, and bin storage.",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png",
  },
  {
    id: "cac_cert",
    label: "CAC Business Registration Certificate",
    description: "Corporate Affairs Commission certificate for corporate and commercial entities.",
    required: false,
  },
];

export default function EnvironmentalSanitationForm({ service, onSubmit, isSubmitting, initialApplicant }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [declaration, setDeclaration] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<EnvironmentalSanitationFormData>({
    resolver: zodResolver(environmentalSanitationSchema),
    defaultValues: {
      businessName: "",
      facilityCategory: "Hospitality / Hotel / Event Centre",
      contactPerson: "",
      phone: "",
      email: "",
      physicalAddress: "",
      ward: WARDS[0] || "Atan-Imuku",
      cacNumber: "",
      operatingHours: "",
      totalDailyStaff: "",
      primaryWaterSource: "",
      drainageType: "",
      wasteContractor: "",
      evacuationFrequency: "",
      fumigationFrequency: "",
      units: [
        { unitName: "", unitType: "", restroomsCount: "", wasteBinsCount: "" },
      ],
      safetyOfficers: [
        { fullName: "", role: "", phone: "", certNumber: "" },
      ],
      wasteStreams: [
        { wasteType: "", estimatedVolume: "", disposalMethod: "" },
      ],
    },
    mode: "onChange",
  });

  const {
    fields: unitFields,
    append: appendUnit,
    remove: removeUnit,
  } = useFieldArray({
    control,
    name: "units",
  });

  const {
    fields: safetyOfficerFields,
    append: appendSafetyOfficer,
    remove: removeSafetyOfficer,
  } = useFieldArray({
    control,
    name: "safetyOfficers",
  });

  const {
    fields: wasteStreamFields,
    append: appendWasteStream,
    remove: removeWasteStream,
  } = useFieldArray({
    control,
    name: "wasteStreams",
  });

  const formValues = watch();

  const handleFileUpload = (docId: string, fileName: string) => {
    setUploadedFiles((prev) => ({ ...prev, [docId]: fileName }));
  };

  const handleFileRemove = (docId: string) => {
    setUploadedFiles((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
  };

  const validateStep = async (index: number): Promise<boolean> => {
    if (index === 0) {
      return await trigger(["businessName", "facilityCategory", "contactPerson", "phone", "physicalAddress", "ward"]);
    }
    if (index === 1) {
      return await trigger(["primaryWaterSource", "drainageType", "wasteContractor"]);
    }
    if (index === 2) {
      return await trigger(["units"]);
    }
    if (index === 3) {
      const missing = DOCUMENTS.filter((d) => d.required && !uploadedFiles[d.id]);
      return missing.length === 0;
    }
    if (index === 4) {
      return declaration;
    }
    return true;
  };

  const handleNext = async () => {
    const isStepValid = await validateStep(currentStepIndex);
    if (isStepValid) {
      setCurrentStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const currentFee = service.feeConfig.amount;

  const onValidSubmit = (data: EnvironmentalSanitationFormData) => {
    if (!declaration) return;

    const cleanUnits = (data.units || []).filter((u) => u.unitName.trim());
    const cleanOfficers = (data.safetyOfficers || []).filter((o) => o.fullName?.trim());
    const cleanWasteStreams = (data.wasteStreams || []).filter((w) => w.wasteType?.trim());

    const { units: _u, safetyOfficers: _so, wasteStreams: _ws, ...rest } = data;

    onSubmit({
      formData: {
        ...rest,
        units: cleanUnits,
        safetyOfficers: cleanOfficers,
        wasteStreams: cleanWasteStreams,
      },
      files: uploadedFiles,
      applicant: initialApplicant || null,
    });
  };

  const reviewSections: ReviewSection[] = [
    {
      title: "Commercial Facility Profile",
      items: [
        { label: "Business / Facility Name", value: formValues.businessName },
        { label: "Facility Classification", value: formValues.facilityCategory },
        { label: "Contact Representative", value: formValues.contactPerson },
        { label: "Phone Number", value: formValues.phone },
        { label: "Email Address", value: formValues.email || "N/A" },
        { label: "Physical Facility Address", value: formValues.physicalAddress },
        { label: "Ward in Ijebu North East LGA", value: formValues.ward },
        { label: "CAC Reg Number", value: formValues.cacNumber || "N/A" },
        { label: "Operating Hours", value: formValues.operatingHours || "N/A" },
        { label: "Daily Staff & Occupants", value: `${formValues.totalDailyStaff || "0"} persons` },
      ],
    },
    {
      title: "Drainage, Water & Evacuation Protocols",
      items: [
        { label: "Water Supply System", value: formValues.primaryWaterSource },
        { label: "Drainage & Sewerage", value: formValues.drainageType },
        { label: "Accredited PSP Waste Contractor", value: formValues.wasteContractor },
        { label: "Waste Evacuation Frequency", value: formValues.evacuationFrequency || "N/A" },
        { label: "Mandatory Fumigation Schedule", value: formValues.fumigationFrequency || "N/A" },
      ],
    },
  ];

  const reviewRepeatableSections: ReviewRepeatableSection[] = [
    {
      title: "Facility Operational Units & Restrooms",
      countLabel: "Facility Units",
      items: (formValues.units || [])
        .filter((u) => u?.unitName?.trim())
        .map((u) => ({
          "Unit Name": u.unitName,
          "Unit Function": u.unitType || "Operational Unit",
          "Restrooms Count": `${u.restroomsCount || 0} Units`,
          "Waste Bins Installed": `${u.wasteBinsCount || 0} Bins`,
        })),
    },
    {
      title: "Designated Health & Safety Officers",
      countLabel: "Safety Personnel",
      items: (formValues.safetyOfficers || [])
        .filter((o) => o?.fullName?.trim())
        .map((o) => ({
          "Officer Name": o.fullName || "",
          "Designation / Role": o.role || "Hygiene Officer",
          "Phone Number": o.phone || "N/A",
          "Certification / License": o.certNumber || "N/A",
        })),
    },
    {
      title: "Waste Stream Classification & Disposal",
      countLabel: "Waste Streams",
      items: (formValues.wasteStreams || [])
        .filter((w) => w?.wasteType?.trim())
        .map((w) => ({
          "Waste Stream Type": w.wasteType || "",
          "Estimated Volume": w.estimatedVolume || "N/A",
          "Disposal Protocol": w.disposalMethod || "N/A",
        })),
    },
  ];

  return (
    <FormWizard
      service={service}
      steps={STEPS}
      currentStepIndex={currentStepIndex}
      onStepChange={setCurrentStepIndex}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit(onValidSubmit)}
      isSubmitting={isSubmitting}
      isStepValid={true}
      currentFee={currentFee}
      submitDisabled={!declaration}
      submitLabel="Submit Environmental Sanitation Application"
    >
      {/* STEP 1: Facility Profile */}
      {currentStepIndex === 0 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Commercial / Industrial Facility Profile
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter facility location and operational parameters for Ijebu North East LGA Environmental Health Officers inspection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="businessName">Facility / Business Trading Name *</Label>
              <Input
                id="businessName"
                {...register("businessName")}
                placeholder="e.g. Obantoko Royal Grand Suites & Events Centre"
                disabled={isSubmitting}
              />
              {errors.businessName && (
                <p className="text-xs text-red-500">{errors.businessName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="facilityCategory">Facility Classification *</Label>
              <Controller
                name="facilityCategory"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="facilityCategory">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hospitality / Hotel / Event Centre">Hospitality / Hotel / Event Centre</SelectItem>
                      <SelectItem value="Food Processing / Restaurant / Bakery">Food Processing / Restaurant / Bakery</SelectItem>
                      <SelectItem value="Healthcare Facility / Private Clinic / Lab">Healthcare Facility / Private Clinic / Lab</SelectItem>
                      <SelectItem value="Educational Institution / School">Educational Institution / School</SelectItem>
                      <SelectItem value="Commercial Shopping Plaza / Supermarket">Commercial Shopping Plaza / Supermarket</SelectItem>
                      <SelectItem value="Industrial Factory / Manufacturing Plant">Industrial Factory / Manufacturing Plant</SelectItem>
                      <SelectItem value="Petrol Station / Auto Workshop">Petrol Station / Auto Workshop</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.facilityCategory && (
                <p className="text-xs text-red-500">{errors.facilityCategory.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPerson">Designated Manager / Contact Person *</Label>
              <Input
                id="contactPerson"
                {...register("contactPerson")}
                placeholder="e.g. Mr. Olawale Davies"
                disabled={isSubmitting}
              />
              {errors.contactPerson && (
                <p className="text-xs text-red-500">{errors.contactPerson.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="+234 800 000 0000"
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="info@facility.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cacNumber">CAC Registration (RC/BN Number)</Label>
              <Input
                id="cacNumber"
                {...register("cacNumber")}
                placeholder="RC-123456"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ward">Ward in Ijebu North East LGA *</Label>
              <Controller
                name="ward"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="ward">
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
                )}
              />
              {errors.ward && (
                <p className="text-xs text-red-500">{errors.ward.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="physicalAddress">Facility Physical Premises Address *</Label>
              <Input
                id="physicalAddress"
                {...register("physicalAddress")}
                placeholder="Plot/Building No, Street name, Village/Town in Ijebu North East LGA"
                disabled={isSubmitting}
              />
              {errors.physicalAddress && (
                <p className="text-xs text-red-500">{errors.physicalAddress.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="operatingHours">Daily Operating Hours</Label>
              <Input
                id="operatingHours"
                {...register("operatingHours")}
                placeholder="e.g. 24 Hours / 8am - 8pm"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="totalDailyStaff">Estimated Daily Staff & Visitors Count</Label>
              <Input
                id="totalDailyStaff"
                type="number"
                {...register("totalDailyStaff")}
                placeholder="e.g. 50"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Sanitation Systems */}
      {currentStepIndex === 1 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Water Supply, Drainage & Waste Management
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Specify plumbing standards, septic/drainage infrastructure, and accredited waste disposal channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="primaryWaterSource">Potable Water Supply *</Label>
              <Controller
                name="primaryWaterSource"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="primaryWaterSource">
                      <SelectValue placeholder="Select Water Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Treated Motorized Borehole & Overhead Storage">Treated Motorized Borehole & Overhead Storage</SelectItem>
                      <SelectItem value="Public Water Corporation Main">Public Water Corporation Main</SelectItem>
                      <SelectItem value="Certified Commercial Water Tanker Supply">Certified Commercial Water Tanker Supply</SelectItem>
                      <SelectItem value="Deep Protected Hand-Pump Well">Deep Protected Hand-Pump Well</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.primaryWaterSource && (
                <p className="text-xs text-red-500">{errors.primaryWaterSource.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="drainageType">Drainage & Liquid Waste System *</Label>
              <Controller
                name="drainageType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="drainageType">
                      <SelectValue placeholder="Select Drainage System" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Concrete Covered Drainage Gutter to Central Soakaway">Concrete Covered Gutter to Soakaway</SelectItem>
                      <SelectItem value="Underground Septic Tank & Bio-Digester">Underground Septic Tank & Bio-Digester</SelectItem>
                      <SelectItem value="Central Sewage Line Connection">Central Sewage Line Connection</SelectItem>
                      <SelectItem value="Effluent Treatment Plant (ETP)">Effluent Treatment Plant (ETP)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.drainageType && (
                <p className="text-xs text-red-500">{errors.drainageType.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="wasteContractor">Accredited PSP / Refuse Evacuation Contractor *</Label>
              <Input
                id="wasteContractor"
                {...register("wasteContractor")}
                placeholder="e.g. OGWAMA / CleanCity Waste Management Ltd"
                disabled={isSubmitting}
              />
              {errors.wasteContractor && (
                <p className="text-xs text-red-500">{errors.wasteContractor.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evacuationFrequency">Refuse Evacuation Schedule</Label>
              <Controller
                name="evacuationFrequency"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="evacuationFrequency">
                      <SelectValue placeholder="Select Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily Evacuation">Daily Evacuation</SelectItem>
                      <SelectItem value="Twice Weekly">Twice Weekly</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fumigationFrequency">Periodic Fumigation & Pest Control Routine</Label>
              <Controller
                name="fumigationFrequency"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="fumigationFrequency">
                      <SelectValue placeholder="Select Fumigation Schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly (High Risk Food/Hospitality)">Monthly (High Risk)</SelectItem>
                      <SelectItem value="Bi-Monthly (Every 2 Months)">Bi-Monthly</SelectItem>
                      <SelectItem value="Quarterly (Every 3 Months)">Quarterly (Standard)</SelectItem>
                      <SelectItem value="Bi-Annually (Every 6 Months)">Bi-Annually</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Units, Officers & Waste (REPEATABLE UI) */}
      {currentStepIndex === 2 && (
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Facility Operational Units, Safety Officers & Waste Streams
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provide complete itemization of internal facility sections, designated sanitation officers, and waste classifications.
            </p>
          </div>

          {/* REPEATABLE SECTION: Facility Units */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-primary" /> Facility Units & Sanitation Fixtures *
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record all functional sections (e.g. Guest Rooms, Dining Halls, Restrooms, Production Floors).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendUnit({
                    unitName: "",
                    unitType: "Operational Unit",
                    restroomsCount: "1",
                    wasteBinsCount: "2",
                  })
                }
                className="gap-1 text-xs h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" /> Add Facility Unit
              </Button>
            </div>

            {errors.units && (
              <p className="text-xs text-red-500">{errors.units.message}</p>
            )}

            {unitFields.map((field, idx) => (
              <div key={field.id} className="bg-muted/10 border rounded-xl p-4 space-y-3 relative group">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-xs text-foreground">
                    Unit #{idx + 1}: {formValues.units?.[idx]?.unitName || "New Unit"}
                  </span>
                  {unitFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUnit(idx)}
                      className="text-red-500 hover:text-red-700 h-7 px-2 text-xs"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Unit Name / Department *</Label>
                    <Input
                      {...register(`units.${idx}.unitName`)}
                      placeholder="e.g. Main Kitchen / Public Restroom Wing"
                      disabled={isSubmitting}
                    />
                    {errors.units?.[idx]?.unitName && (
                      <p className="text-xs text-red-500">{errors.units[idx]?.unitName?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Function / Description</Label>
                    <Input
                      {...register(`units.${idx}.unitType`)}
                      placeholder="e.g. Food Prep & Service"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Restroom Fixtures</Label>
                    <Input
                      type="number"
                      {...register(`units.${idx}.restroomsCount`)}
                      placeholder="e.g. 4"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Waste Bins Stationed</Label>
                    <Input
                      type="number"
                      {...register(`units.${idx}.wasteBinsCount`)}
                      placeholder="e.g. 6"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* REPEATABLE SECTION: Safety Officers */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Designated Environmental Health & Safety Officers
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record trained staff responsible for daily hygiene, PPE compliance, and chemical handling.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendSafetyOfficer({
                    fullName: "",
                    role: "Designated Sanitation Officer",
                    phone: "",
                    certNumber: "",
                  })
                }
                className="gap-1 text-xs h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" /> Add Officer
              </Button>
            </div>

            <div className="space-y-2.5">
              {safetyOfficerFields.map((field, idx) => (
                <div key={field.id} className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">Officer Full Name</Label>
                    <Input
                      {...register(`safetyOfficers.${idx}.fullName`)}
                      placeholder="e.g. Mrs. Funke Adeleke"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Role / Designation</Label>
                    <Input
                      {...register(`safetyOfficers.${idx}.role`)}
                      placeholder="Hygiene Officer"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Phone / Cert No</Label>
                    <Input
                      {...register(`safetyOfficers.${idx}.phone`)}
                      placeholder="080... / Reg No"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                    {errors.safetyOfficers?.[idx]?.phone && (
                      <p className="text-[10px] text-red-500">{errors.safetyOfficers[idx]?.phone?.message}</p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSafetyOfficer(idx)}
                      className="text-red-500 hover:text-red-700 h-8 px-2 text-xs"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REPEATABLE SECTION: Waste Streams */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Trash className="w-4 h-4 text-primary" /> Hazardous & Solid Waste Stream Classification
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record all segregated waste streams produced on premises.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendWasteStream({
                    wasteType: "",
                    estimatedVolume: "50 kg/week",
                    disposalMethod: "PSP Evacuation",
                  })
                }
                className="gap-1 text-xs h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" /> Add Waste Stream
              </Button>
            </div>

            <div className="space-y-2.5">
              {wasteStreamFields.map((field, idx) => (
                <div key={field.id} className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">Waste Stream / Material Type</Label>
                    <Input
                      {...register(`wasteStreams.${idx}.wasteType`)}
                      placeholder="e.g. Organic, Medical, Scraps"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Estimated Volume</Label>
                    <Input
                      {...register(`wasteStreams.${idx}.estimatedVolume`)}
                      placeholder="e.g. 100 kg/week"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Disposal Protocol</Label>
                    <Input
                      {...register(`wasteStreams.${idx}.disposalMethod`)}
                      placeholder="e.g. PSP Evacuation"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWasteStream(idx)}
                      className="text-red-500 hover:text-red-700 h-8 px-2 text-xs"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Documents Upload */}
      {currentStepIndex === 3 && (
        <DocumentUploadStep
          documents={DOCUMENTS}
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
          serviceName={service.name}
        />
      )}

      {/* STEP 5: Review & Submit */}
      {currentStepIndex === 4 && (
        <ReviewSubmitStep
          serviceName={service.name}
          revenueHead={service.revenueHead}
          feeAmount={currentFee}
          sections={reviewSections}
          repeatableSections={reviewRepeatableSections}
          documents={DOCUMENTS}
          uploadedFiles={uploadedFiles}
          declarationChecked={declaration}
          onDeclarationChange={setDeclaration}
          declarationText="I solemnly declare that the environmental sanitation facilities, drainage systems, pest control schedules, and waste evacuation contracts described herein comply strictly with the Public Health Laws and Environmental Sanitation Bye-Laws of the Local Government, Ogun State."
        />
      )}
    </FormWizard>
  );
}
