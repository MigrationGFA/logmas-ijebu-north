"use client";
import React, { useState, useMemo, useEffect } from "react";
import type { Resolver } from "react-hook-form";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LGA_CONFIG } from "@/config/lga.config";
import { useWards } from "@/hooks/queries/useWards";
import { ServiceType } from "@/config/lgaServices";
import { FormWizard, FormStep } from "./FormWizard";
import { DocumentUploadStep, DocumentSpec } from "./DocumentUploadStep";
import {
  ReviewSubmitStep,
  ReviewSection,
  ReviewRepeatableSection,
} from "./ReviewSubmitStep";
import { Plus, Trash2, Calculator, Building2 } from "lucide-react";
import { ApplicantSnapshot } from "../ApplicantSelectionStep";
import { formatAndValidateNigerianPhoneNumber } from "@/lib/helper";


interface Props {
  service: ServiceType;
  onSubmit: (payload: {
    applicant: ApplicantSnapshot | null;
    formData: Record<string, any>;
    files: Record<string, any>;
  }) => void;
  isSubmitting?: boolean;
  initialApplicant?: ApplicantSnapshot;
}

const tenementUnitSchema = z.object({
  unitIdentifier: z.string().min(1, "Unit identifier is required"),
  unitType: z.string().default("2-Bedroom Flat"),
  occupancyStatus: z.string().default("Tenant-Occupied"),
  occupantName: z.string().default(""),
  annualRent: z.string().min(1, "Annual rent is required"),
});

const tenementRateSchema = z.object({
  ownerName: z.string().min(1, "Owner full legal name is required"),
  isCorporate: z.string().default("No"),
  corporateName: z.string().optional(),
  phone: z
    .string()
    .min(1, "Owner phone number is required")
    .refine((val) => formatAndValidateNigerianPhoneNumber(val).isValid, {
      message: "Please enter a valid Nigerian phone number",
    }),
  email: z
    .string()
    .email("Invalid email address")
    .or(z.literal(""))
    .optional(),
  ward: z.string().min(1, "Ward is required"),
  cadastralPlotNo: z.string().optional(),
  propertyAddress: z.string().min(1, "Physical property address is required"),
  ownerAddress: z.string().optional(),
  propertyType: z.string().min(1, "Property classification is required"),
  numberOfFloors: z.string().min(1, "Number of floors is required"),
  constructionYear: z.string().optional(),
  buildingMaterials: z.string().optional(),
  accessRoadStatus: z.string().default("Tarred / Paved Access Road"),
  utilitiesAvailable: z.string().optional(),
  units: z.array(tenementUnitSchema).min(1, "At least one tenement unit is required"),
});

type TenementRateFormValues = z.infer<typeof tenementRateSchema>;

const STEPS: FormStep[] = [
  {
    id: "property_owner",
    title: "Property Ownership & Location",
    shortTitle: "Owner & Location",
    description:
      "Enter property owner contact details and physical address in the LGA.",
  },
  {
    id: "building_specs",
    title: "Building Specifications & Structural Profile",
    shortTitle: "Building Specs",
    description:
      "Specify building type, storeys, construction year, and infrastructure access.",
  },
  {
    id: "units_tenancy",
    title: "Tenement Units & Tenancy Schedule",
    shortTitle: "Units & Tenancies",
    description:
      "Itemize individual flats, shops, and suites with occupancy and annual valuation.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description:
      "Upload title deeds, building elevation photos, and previous clearance receipts.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description:
      "Review tenement valuation assessment and submit for statutory LGA billing.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "title_document",
    label: "Title Deed / Survey Plan / C of O",
    description:
      "Deed of Conveyance, Certificate of Occupancy, or Registered Cadastral Survey Plan.",
    required: true,
  },
  {
    id: "building_photos",
    label: "Building Elevation & Street Photographs",
    description:
      "Clear photograph of the front elevation and street approach of the tenement property.",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png",
  },
  {
    id: "previous_receipt",
    label: "Previous Tenement Rate Clearance Receipt",
    description:
      "Proof of payment for previous year (if applicable for existing tenement renewal).",
    required: false,
  },
  {
    id: "owner_id",
    label: "Owner / Estate Manager Means of ID",
    description:
      "National ID Card (NIN), Voter's Card, or International Passport.",
    required: true,
  },
];

export default function TenementRateForm({
  service,
  onSubmit,
  isSubmitting,
  initialApplicant,
}: Props) {
  const { wards } = useWards();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>(
    {},
  );
  const [declaration, setDeclaration] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TenementRateFormValues>({
    resolver: zodResolver(tenementRateSchema) as Resolver<TenementRateFormValues>,
    defaultValues: {
      ownerName: initialApplicant?.name || "",
      isCorporate: "No",
      corporateName: initialApplicant?.companyName || "",
      phone: initialApplicant?.phone || "",
      email: initialApplicant?.email || "",
      ownerAddress: initialApplicant?.address || "",
      propertyAddress: initialApplicant?.address || "",
      ward: initialApplicant?.ward || wards[0]?.name || "the LGA",
      cadastralPlotNo: "",
      propertyType: "Multi-Flat Block / Storey Building",
      numberOfFloors: "",
      constructionYear: "",
      buildingMaterials: "",
      accessRoadStatus: "Tarred / Paved Access Road",
      utilitiesAvailable: "",
      units: [
        {
          unitIdentifier: "",
          unitType: "2-Bedroom Flat",
          occupancyStatus: "Tenant-Occupied",
          occupantName: "",
          annualRent: "",
        },
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

  useEffect(() => {
    if (initialApplicant) {
      if (initialApplicant.name) setValue("ownerName", initialApplicant.name);
      if (initialApplicant.companyName) {
        setValue("isCorporate", "Yes");
        setValue("corporateName", initialApplicant.companyName);
      }
      if (initialApplicant.phone) setValue("phone", initialApplicant.phone);
      if (initialApplicant.email) setValue("email", initialApplicant.email);
      if (initialApplicant.address) {
        setValue("propertyAddress", initialApplicant.address);
        setValue("ownerAddress", initialApplicant.address);
      }
      if (initialApplicant.ward) setValue("ward", initialApplicant.ward);
    }
  }, [initialApplicant, setValue]);

  const formValues = watch();
  const isCorporateValue = watch("isCorporate");
  const unitsWatch = watch("units");

  const totalAnnualRent = useMemo(() => {
    return (unitsWatch || []).reduce((acc, u) => acc + (parseFloat(u?.annualRent) || 0), 0);
  }, [unitsWatch]);

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
      return await trigger([
        "ownerName",
        "isCorporate",
        "corporateName",
        "phone",
        "email",
        "ward",
        "cadastralPlotNo",
        "propertyAddress",
        "ownerAddress",
      ]);
    }
    if (index === 1) {
      return await trigger([
        "propertyType",
        "numberOfFloors",
        "constructionYear",
        "buildingMaterials",
        "accessRoadStatus",
        "utilitiesAvailable",
      ]);
    }
    if (index === 2) {
      return await trigger(["units"]);
    }
    if (index === 3) {
      const missing = DOCUMENTS.filter(
        (d) => d.required && !uploadedFiles[d.id],
      );
      return missing.length === 0;
    }
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStepIndex);
    if (isValid) {
      setCurrentStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const currentFee = service.feeConfig?.amount
    ? parseFloat(service.feeConfig.amount)
    : 0;

  const onFormSubmit = (data: TenementRateFormValues) => {
    if (!declaration) return;

    const cleanedUnits = data.units.filter((u) => u.unitIdentifier.trim());
    onSubmit({
      formData: {
        ...data,
        units: cleanedUnits,
        totalValuation: totalAnnualRent,
        unitsCount: cleanedUnits.length,
      },
      files: uploadedFiles,
      applicant: initialApplicant || null,
    });
  };

  const reviewSections: ReviewSection[] = [
    {
      title: "Property Ownership & Physical Cadastre",
      items: [
        { label: "Property Owner Full Name", value: formValues.ownerName },
        {
          label: "Corporate Owner Entity",
          value:
            formValues.isCorporate === "Yes"
              ? formValues.corporateName || "N/A"
              : "Private Individual",
        },
        { label: "Owner Contact Phone", value: formValues.phone },
        { label: "Owner Email Address", value: formValues.email || "N/A" },
        { label: "Physical Property Address", value: formValues.propertyAddress },
        { label: "Ward in the LGA", value: formValues.ward },
        { label: "Cadastral / Plot Number", value: formValues.cadastralPlotNo || "N/A" },
        { label: "Owner Mailing Address", value: formValues.ownerAddress || "N/A" },
      ],
    },
    {
      title: "Structural Specifications & Amenities",
      items: [
        { label: "Property Classification", value: formValues.propertyType },
        {
          label: "Number of Storeys/Floors",
          value: `${formValues.numberOfFloors} Floors`,
        },
        { label: "Total Assessment Units", value: `${unitFields.length} Units` },
        { label: "Year of Construction", value: formValues.constructionYear || "N/A" },
        { label: "Building Materials", value: formValues.buildingMaterials || "N/A" },
        { label: "Access Road Condition", value: formValues.accessRoadStatus },
        { label: "Available Utilities", value: formValues.utilitiesAvailable || "N/A" },
      ],
    },
  ];

  const reviewRepeatableSections: ReviewRepeatableSection[] = [
    {
      title: "Tenement Units & Rental Valuation Schedule",
      countLabel: "Tenement Units",
      items: (formValues.units || [])
        .filter((u) => u.unitIdentifier?.trim())
        .map((u) => ({
          "Unit Identifier": u.unitIdentifier,
          "Unit Type": u.unitType,
          "Occupancy Status": u.occupancyStatus,
          "Current Occupant": u.occupantName || "N/A",
          "Annual Rental Value": `₦${(parseFloat(u.annualRent) || 0).toLocaleString()}`,
        })),
    },
  ];

  return (
    <FormWizard
      service={service}
      steps={STEPS}
      currentStepIndex={currentStepIndex}
      onStepChange={(idx) => setCurrentStepIndex(idx)}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit(onFormSubmit)}
      isSubmitting={isSubmitting}
      isStepValid={true}
      currentFee={currentFee}
      submitDisabled={
        !declaration ||
        !formValues.ownerName ||
        !formValues.phone ||
        !formValues.propertyAddress ||
        !formValues.ward ||
        !formValues.propertyType ||
        !formValues.numberOfFloors ||
        unitFields.length === 0
      }
    >
      {/* STEP 1: Property Owner & Location */}
      {currentStepIndex === 0 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Property Ownership & Physical Cadastre
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter official property ownership records and physical address
              within the LGA rating jurisdiction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="ownerName">
                Property Landlord / Owner Full Legal Name *
              </Label>
              <Input
                id="ownerName"
                {...register("ownerName")}
                placeholder="e.g. Chief Babatunde O. Adeleke"
              />
              {errors.ownerName && (
                <p className="text-xs text-red-500">{errors.ownerName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="isCorporate">
                Is property owned by a Corporate Body / Trust?
              </Label>
              <Controller
                control={control}
                name="isCorporate"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="isCorporate">
                      <SelectValue placeholder="Corporate Ownership?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No">
                        No - Individual / Family Owned
                      </SelectItem>
                      <SelectItem value="Yes">
                        Yes - Registered Company / Trust
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {isCorporateValue === "Yes" && (
              <div className="space-y-1.5">
                <Label htmlFor="corporateName">
                  Company / Corporate Entity Name
                </Label>
                <Input
                  id="corporateName"
                  {...register("corporateName")}
                  placeholder="e.g. the LGA Properties & Investments Ltd"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="phone">Owner / Agent Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="+234 800 000 0000"
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Owner / Agent Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="landlord@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ward">Ward in the LGA *</Label>
              <Controller
                control={control}
                name="ward"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="ward">
                      <SelectValue placeholder="Select Ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((w) => (
                        <SelectItem key={w.id} value={w.name}>
                          {w.name} Ward
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

            <div className="space-y-1.5">
              <Label htmlFor="cadastralPlotNo">
                Cadastral Plot / Survey Beacon Number
              </Label>
              <Input
                id="cadastralPlotNo"
                {...register("cadastralPlotNo")}
                placeholder="e.g. Plot 15, Block D, Layout 2"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="propertyAddress">
                Physical Property Location Address *
              </Label>
              <Input
                id="propertyAddress"
                {...register("propertyAddress")}
                placeholder="House number, Street name, Community/Town in the LGA"
              />
              {errors.propertyAddress && (
                <p className="text-xs text-red-500">{errors.propertyAddress.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="ownerAddress">
                Owner Residential / Correspondence Address
              </Label>
              <Input
                id="ownerAddress"
                {...register("ownerAddress")}
                placeholder="Mailing address for official assessment notices"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Building Specs */}
      {currentStepIndex === 1 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Building Specifications & Structural Profile
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Specify building typology, age, structural components, and
              neighborhood utility access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="propertyType">
                Property Building Classification *
              </Label>
              <Controller
                control={control}
                name="propertyType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="propertyType">
                      <SelectValue placeholder="Select Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Multi-Flat Block / Storey Building">
                        Multi-Flat Block / Storey Building
                      </SelectItem>
                      <SelectItem value="Single Detached Duplex / Bungalow">
                        Single Detached Duplex / Bungalow
                      </SelectItem>
                      <SelectItem value="Tenement Multi-Room (Face-me-I-face-you)">
                        Tenement Multi-Room House
                      </SelectItem>
                      <SelectItem value="Commercial Shopping Complex / Plaza">
                        Commercial Shopping Complex / Plaza
                      </SelectItem>
                      <SelectItem value="Industrial Factory / Warehouse">
                        Industrial Factory / Warehouse
                      </SelectItem>
                      <SelectItem value="Mixed Residential / Commercial Property">
                        Mixed Residential / Commercial Property
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.propertyType && (
                <p className="text-xs text-red-500">{errors.propertyType.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="numberOfFloors">
                Number of Floors / Storeys *
              </Label>
              <Controller
                control={control}
                name="numberOfFloors"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="numberOfFloors">
                      <SelectValue placeholder="Select Storeys" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">
                        Bungalow (Ground Floor Only)
                      </SelectItem>
                      <SelectItem value="2">
                        2 Floors (One Storey Building)
                      </SelectItem>
                      <SelectItem value="3">
                        3 Floors (Two Storey Building)
                      </SelectItem>
                      <SelectItem value="4">
                        4+ Floors (Multi-Storey Complex)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.numberOfFloors && (
                <p className="text-xs text-red-500">{errors.numberOfFloors.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="constructionYear">Year of Construction</Label>
              <Input
                id="constructionYear"
                {...register("constructionYear")}
                placeholder="e.g. 2018"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buildingMaterials">
                Primary Building Materials
              </Label>
              <Input
                id="buildingMaterials"
                {...register("buildingMaterials")}
                placeholder="e.g. Sandcrete blockwall, corrugated aluminium roof"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accessRoadStatus">Access Road Quality</Label>
              <Controller
                control={control}
                name="accessRoadStatus"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="accessRoadStatus">
                      <SelectValue placeholder="Select Road Access" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tarred / Paved Access Road">
                        Tarred / Paved Access Road
                      </SelectItem>
                      <SelectItem value="Graded Earth Road with Concrete Gutters">
                        Graded Earth Road with Gutters
                      </SelectItem>
                      <SelectItem value="Seasonal Unpaved Dirt Track">
                        Seasonal Unpaved Dirt Track
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="utilitiesAvailable">Installed Utilities</Label>
              <Input
                id="utilitiesAvailable"
                {...register("utilitiesAvailable")}
                placeholder="e.g. PHCN Electricity, Dedicated Transformer, Borehole"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Units & Tenancy Schedule (REPEATABLE UI) */}
      {currentStepIndex === 2 && (
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Tenement Units & Tenancy Schedule
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Statutory rating assessment requires itemizing all habitable
              flats, rooms, shops, or suites in the building.
            </p>
          </div>

          {/* Valuation Summary Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block">
                  Cumulative Annual Rental Valuation
                </span>
                <h4 className="text-lg font-bold text-foreground">
                  ₦{totalAnnualRent.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({unitFields.length} Habitable Units)
                  </span>
                </h4>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendUnit({
                  unitIdentifier: `Unit ${unitFields.length + 1}`,
                  unitType: "2-Bedroom Flat",
                  occupancyStatus: "Tenant-Occupied",
                  occupantName: "",
                  annualRent: "300000",
                })
              }
              className="gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tenement Unit
            </Button>
          </div>

          {/* REPEATABLE SECTION: Tenement Units */}
          <div className="space-y-4">
            {unitFields.map((fieldItem, idx) => (
              <div
                key={fieldItem.id}
                className="bg-muted/10 border rounded-xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-bold text-xs text-foreground">
                      Unit #{idx + 1}: {formValues.units?.[idx]?.unitIdentifier || "Tenement Unit"}
                    </span>
                  </div>
                  {unitFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUnit(idx)}
                      className="text-red-500 hover:text-red-700 h-7 px-2 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">
                      Unit Identifier / Flat Name *
                    </Label>
                    <Input
                      {...register(`units.${idx}.unitIdentifier`)}
                      placeholder="e.g. Flat 1 (Ground Floor Right) / Shop 3"
                    />
                    {errors.units?.[idx]?.unitIdentifier && (
                      <p className="text-xs text-red-500">
                        {errors.units[idx]?.unitIdentifier?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Type</Label>
                    <Controller
                      control={control}
                      name={`units.${idx}.unitType`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="text-xs h-9">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3-Bedroom Flat">
                              3-Bedroom Flat
                            </SelectItem>
                            <SelectItem value="2-Bedroom Flat">
                              2-Bedroom Flat
                            </SelectItem>
                            <SelectItem value="1-Bedroom Mini Flat">
                              1-Bedroom Mini Flat
                            </SelectItem>
                            <SelectItem value="Self-Contained Studio">
                              Self-Contained Studio
                            </SelectItem>
                            <SelectItem value="Single Room (Tenement)">
                              Single Room (Tenement)
                            </SelectItem>
                            <SelectItem value="Retail Shop / Store">
                              Retail Shop / Store
                            </SelectItem>
                            <SelectItem value="Office Suite">
                              Office Suite
                            </SelectItem>
                            <SelectItem value="Warehouse / Storage Bay">
                              Warehouse
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Occupancy</Label>
                    <Controller
                      control={control}
                      name={`units.${idx}.occupancyStatus`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="text-xs h-9">
                            <SelectValue placeholder="Occupancy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tenant-Occupied">
                              Tenant-Occupied
                            </SelectItem>
                            <SelectItem value="Owner-Occupied">
                              Owner-Occupied
                            </SelectItem>
                            <SelectItem value="Vacant / Unoccupied">
                              Vacant
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Annual Rent (₦) *</Label>
                    <Input
                      type="number"
                      {...register(`units.${idx}.annualRent`)}
                      placeholder="e.g. 400000"
                    />
                    {errors.units?.[idx]?.annualRent && (
                      <p className="text-xs text-red-500">
                        {errors.units[idx]?.annualRent?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Current Occupant / Tenant Name
                    </Label>
                    <Input
                      {...register(`units.${idx}.occupantName`)}
                      placeholder="e.g. Mr. S. O. Balogun"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
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
          declarationText="I solemnly declare that the property specifications, number of tenements, and rental values stated herein are truthful and in full compliance with the Tenement Rate and Valuation Edict of the Local Government, Ogun State."
        />
      )}
    </FormWizard>
  );
}
