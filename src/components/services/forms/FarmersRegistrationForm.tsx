"use client";
import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  ServiceType,
} from "@/config/lgaServices";
import { FormWizard, FormStep } from "./FormWizard";
import { DocumentUploadStep, DocumentSpec } from "./DocumentUploadStep";
import {
  ReviewSubmitStep,
  ReviewSection,
  ReviewRepeatableSection,
} from "./ReviewSubmitStep";
import { Plus, Trash2, Sprout, Tractor, Layers } from "lucide-react";
import { ApplicantSnapshot } from "../ApplicantSelectionStep";
import { formatAndValidateNigerianPhoneNumber } from "@/lib/helper";

const WARDS = LGA_CONFIG.wards.map((ward) => ward.name);

interface Props {
  service: ServiceType;
  onSubmit: (formData: Record<string, any>) => void;
  isSubmitting?: boolean;
  mode?: any;
  initialApplicant?: ApplicantSnapshot;
}

const farmParcelSchema = z.object({
  locationName: z.string().min(1, "Location name is required"),
  sizeAcres: z.string().optional(),
  landTenure: z.string().optional(),
  soilTerrain: z.string().optional(),
  nearestLandmark: z.string().optional(),
});

const commodityEnterpriseSchema = z.object({
  commodity: z.string().min(1, "Commodity name is required"),
  scaleType: z.string().optional(),
  annualYield: z.string().optional(),
  unit: z.string().optional(),
});

const farmEquipmentSchema = z.object({
  equipmentType: z.string().optional(),
  quantity: z.string().optional(),
  ownership: z.string().optional(),
  condition: z.string().optional(),
});

export const farmersRegistrationSchema = z.object({
  farmerName: z.string().min(2, "Farmer or enterprise name is required"),
  farmingType: z.string().min(1, "Registration category is required"),
  contactPerson: z.string().optional(),
  phone: z.string().refine((val) => formatAndValidateNigerianPhoneNumber(val).isValid, {
    message: "Valid Nigerian phone number is required",
  }),
  email: z.string().email("Valid email address required").or(z.literal("")).optional(),
  residentialAddress: z.string().min(3, "Residential address is required"),
  ward: z.string().min(1, "Ward is required"),
  nin: z.string().min(11, "NIN must be 11 digits"),
  cacNumber: z.string().optional(),
  yearsFarming: z.string().optional(),
  cooperativeName: z.string().optional(),
  coopRegNo: z.string().optional(),
  extensionZone: z.string().optional(),
  primaryWaterSource: z.string().min(1, "Primary water source is required"),
  storageFacilities: z.string().optional(),
  parcels: z.array(farmParcelSchema).min(1, "At least one farm parcel is required"),
  commodities: z.array(commodityEnterpriseSchema).min(1, "At least one commodity is required"),
  equipment: z.array(farmEquipmentSchema).optional(),
});

export type FarmersRegistrationFormData = z.infer<typeof farmersRegistrationSchema>;

const STEPS: FormStep[] = [
  {
    id: "farmer_identity",
    title: "Farmer & Enterprise Identity",
    shortTitle: "Farmer Identity",
    description:
      "Enter personal/business contact details, ward location, and farming background.",
  },
  {
    id: "cooperative_extension",
    title: "Cooperative & Extension Services",
    shortTitle: "Cooperative & Support",
    description:
      "Provide agricultural cooperative affiliation, water source, and storage infrastructure.",
  },
  {
    id: "parcels_enterprises_machinery",
    title: "Farm Parcels, Produce & Machinery Roster",
    shortTitle: "Parcels & Produce",
    description:
      "Detail farm land parcels, crop/livestock enterprises, and agricultural equipment inventory.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description:
      "Upload farmer passport, NIN slip, farm sketch, and land ownership/lease proof.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description:
      "Verify agricultural census records and submit statutory registration.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "farmer_photo",
    label: "Farmer / Manager Passport Photograph",
    description:
      "Recent color passport photo of the principal farmer or farm manager.",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png",
  },
  {
    id: "farmer_nin",
    label: "NIN Slip / Means of Identification",
    description: "National ID Card, NIN Slip, or Voter's Card.",
    required: true,
  },
  {
    id: "farm_sketch_map",
    label: "Farm Location Sketch / Survey Plan",
    description:
      "Sketch or survey showing farm boundaries and access road from main village.",
    required: true,
  },
  {
    id: "land_tenure_proof",
    label: "Proof of Land Tenure / Lease Agreement",
    description:
      "Deed of gift, family receipt, lease agreement, or C of O for farm land.",
    required: true,
  },
  {
    id: "coop_membership_doc",
    label: "Cooperative Membership Card / CAC",
    description:
      "Membership slip if registered under a farmer group, or CAC certificate for corporate farms.",
    required: false,
  },
];

export default function FarmersRegistrationForm({
  service,
  onSubmit,
  isSubmitting,
  initialApplicant,
}: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [declaration, setDeclaration] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FarmersRegistrationFormData>({
    resolver: zodResolver(farmersRegistrationSchema),
    defaultValues: {
      farmerName: initialApplicant?.name || "",
      farmingType: "Individual Smallholder Farmer",
      contactPerson: "",
      phone: initialApplicant?.phone || "",
      email: initialApplicant?.email || "",
      residentialAddress: initialApplicant?.address || "",
      ward: initialApplicant?.ward || WARDS[0] || "Atan-Imuku",
      nin: initialApplicant?.nin || "",
      cacNumber: "",
      yearsFarming: "",
      cooperativeName: "",
      coopRegNo: "",
      extensionZone: "",
      primaryWaterSource: "",
      storageFacilities: "",
      parcels: [
        {
          locationName: "",
          sizeAcres: "",
          landTenure: "Owner (Inherited / Freehold)",
          soilTerrain: "",
          nearestLandmark: "",
        },
      ],
      commodities: [
        {
          commodity: "",
          scaleType: "Arable Crop",
          annualYield: "",
          unit: "Tons",
        },
      ],
      equipment: [
        {
          equipmentType: "",
          quantity: "",
          ownership: "Owned",
          condition: "Good Working Order",
        },
      ],
    },
  });

  const {
    fields: parcelFields,
    append: appendParcel,
    remove: removeParcel,
  } = useFieldArray({
    control,
    name: "parcels",
  });

  const {
    fields: commodityFields,
    append: appendCommodity,
    remove: removeCommodity,
  } = useFieldArray({
    control,
    name: "commodities",
  });

  const {
    fields: equipmentFields,
    append: appendEquipment,
    remove: removeEquipment,
  } = useFieldArray({
    control,
    name: "equipment",
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

  const handleNext = async () => {
    let isValid = false;
    if (currentStepIndex === 0) {
      isValid = await trigger([
        "farmerName",
        "farmingType",
        "phone",
        "email",
        "residentialAddress",
        "ward",
        "nin",
      ]);
    } else if (currentStepIndex === 1) {
      isValid = await trigger(["primaryWaterSource"]);
    } else if (currentStepIndex === 2) {
      isValid = await trigger(["parcels", "commodities"]);
    } else if (currentStepIndex === 3) {
      const missing = DOCUMENTS.filter((d) => d.required && !uploadedFiles[d.id]);
      isValid = missing.length === 0;
    } else {
      isValid = true;
    }

    if (isValid) {
      setCurrentStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const currentFee = service.feeConfig.amount;

  const onValidSubmit = (data: FarmersRegistrationFormData) => {
    if (!declaration) return;

    onSubmit({
      formData: {
        ...data,
        parcels: data.parcels.filter((p) => p.locationName.trim()),
        commodities: data.commodities.filter((c) => c.commodity.trim()),
        equipment: data.equipment?.filter((eq) => eq.equipmentType?.trim()) || [],
      },
      files: uploadedFiles,
      applicant: {
        applicantId: initialApplicant?.applicantId,
      },
    });
  };

  const reviewSections: ReviewSection[] = [
    {
      title: "Farmer & Agricultural Enterprise Profile",
      items: [
        { label: "Farmer / Enterprise Name", value: formValues.farmerName },
        { label: "Registration Type", value: formValues.farmingType },
        {
          label: "Contact Person",
          value: formValues.contactPerson || formValues.farmerName,
        },
        { label: "Phone Number", value: formValues.phone },
        { label: "Email Address", value: formValues.email || "N/A" },
        { label: "NIN / RC Number", value: formValues.nin || formValues.cacNumber || "N/A" },
        { label: "Residential Address", value: formValues.residentialAddress },
        { label: "Ward in Ijebu North East LGA", value: formValues.ward },
        {
          label: "Years in Active Farming",
          value: `${formValues.yearsFarming || "0"} years`,
        },
      ],
    },
    {
      title: "Cooperative Support & Infrastructure",
      items: [
        { label: "Affiliated Cooperative", value: formValues.cooperativeName || "None" },
        { label: "Cooperative Reg Number", value: formValues.coopRegNo || "None" },
        { label: "Extension Officer Zone", value: formValues.extensionZone || "None" },
        { label: "Primary Water Source", value: formValues.primaryWaterSource },
        {
          label: "On-Farm Storage Facilities",
          value: formValues.storageFacilities || "None",
        },
      ],
    },
  ];

  const reviewRepeatableSections: ReviewRepeatableSection[] = [
    {
      title: "Farm Land Parcels & Plots Schedule",
      countLabel: "Parcels",
      items: (formValues.parcels || [])
        .filter((p) => p.locationName?.trim())
        .map((p) => ({
          "Parcel Location": p.locationName,
          "Size (Acres)": `${p.sizeAcres || "0"} Acres`,
          "Land Tenure": p.landTenure || "Standard",
          "Soil / Terrain": p.soilTerrain || "Standard",
          "Nearest Landmark": p.nearestLandmark || "N/A",
        })),
    },
    {
      title: "Crops, Livestock & Fisheries Inventory",
      countLabel: "Enterprises",
      items: (formValues.commodities || [])
        .filter((c) => c.commodity?.trim())
        .map((c) => ({
          "Commodity / Enterprise": c.commodity,
          Category: c.scaleType || "General",
          "Estimated Yield": `${c.annualYield || "0"} ${c.unit || "Units"}`,
        })),
    },
    {
      title: "Agricultural Machinery & Farm Implements",
      countLabel: "Equipment Items",
      items: (formValues.equipment || [])
        .filter((e) => e.equipmentType?.trim())
        .map((e) => ({
          "Equipment Type": e.equipmentType || "",
          Quantity: e.quantity || "1",
          Ownership: e.ownership || "Owned",
          Condition: e.condition || "Good",
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
      submitLabel="Submit Farmer Registration Application"
    >
      {/* STEP 1: Farmer Identity */}
      {currentStepIndex === 0 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Farmer / Agricultural Enterprise Identity
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter official farmer information for agricultural census and LGA
              subsidy/extension registry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="farmerName">
                Farmer Full Name / Enterprise Name *
              </Label>
              <Input
                id="farmerName"
                {...register("farmerName")}
                placeholder="e.g. Chief Johnson Oladele / Oladele Integrated Agro Farms"
                disabled={isSubmitting}
              />
              {errors.farmerName && (
                <p className="text-xs text-red-500">{errors.farmerName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="farmingType">
                Agricultural Registration Category *
              </Label>
              <Controller
                name="farmingType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="farmingType">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual Smallholder Farmer">
                        Individual Smallholder Farmer (&lt; 5 Ha)
                      </SelectItem>
                      <SelectItem value="Medium Commercial Farmer">
                        Medium Commercial Farmer (5 - 20 Ha)
                      </SelectItem>
                      <SelectItem value="Large Commercial Agro-Allied Estate">
                        Large Commercial Agro-Allied Estate (&gt; 20 Ha)
                      </SelectItem>
                      <SelectItem value="Farmers Cooperative / Group">
                        Farmers Cooperative / Group
                      </SelectItem>
                      <SelectItem value="Livestock & Poultry Specialist">
                        Livestock & Poultry Specialist
                      </SelectItem>
                      <SelectItem value="Fisheries & Aquaculture Enterprise">
                        Fisheries & Aquaculture Enterprise
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.farmingType && (
                <p className="text-xs text-red-500">{errors.farmingType.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="yearsFarming">Years in Active Farming</Label>
              <Input
                id="yearsFarming"
                type="number"
                {...register("yearsFarming")}
                placeholder="e.g. 8"
                disabled={isSubmitting}
              />
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
                placeholder="farmer@example.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nin">National Identity Number (NIN) *</Label>
              <Input
                id="nin"
                maxLength={11}
                {...register("nin")}
                placeholder="11-digit NIN"
                disabled={isSubmitting}
              />
              {errors.nin && (
                <p className="text-xs text-red-500">{errors.nin.message}</p>
              )}
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
              <Label htmlFor="residentialAddress">
                Farmer Residential Address *
              </Label>
              <Input
                id="residentialAddress"
                {...register("residentialAddress")}
                placeholder="Home address or primary business address in Ijebu North East LGA"
                disabled={isSubmitting}
              />
              {errors.residentialAddress && (
                <p className="text-xs text-red-500">{errors.residentialAddress.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Cooperative & Support */}
      {currentStepIndex === 1 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Cooperative Affiliation & Infrastructure Support
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Specify agricultural cooperative society memberships, agronomic
              extension zone, and water infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cooperativeName">
                Affiliated Cooperative Society / Commodity Association
              </Label>
              <Input
                id="cooperativeName"
                {...register("cooperativeName")}
                placeholder="e.g. All Farmers Association of Nigeria (AFAN) Ijebu North East LGA"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coopRegNo">Cooperative Registration Number</Label>
              <Input
                id="coopRegNo"
                {...register("coopRegNo")}
                placeholder="e.g. OG/COOP/2022/100"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="extensionZone">LGA Extension Officer Zone</Label>
              <Input
                id="extensionZone"
                {...register("extensionZone")}
                placeholder="e.g. Zone B - Ilugun / Ijebu North East LGA Agricultural Belt"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="primaryWaterSource">
                Primary Farm Water Supply *
              </Label>
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
                      <SelectItem value="Borehole & Seasonal Rainfed">
                        Borehole & Seasonal Rainfed
                      </SelectItem>
                      <SelectItem value="River / Stream / Earth Dam">
                        River / Stream / Earth Dam
                      </SelectItem>
                      <SelectItem value="100% Rainfed Dependent">
                        100% Rainfed Dependent
                      </SelectItem>
                      <SelectItem value="Motorized Deep Tube Well Irrigation">
                        Motorized Deep Tube Well Irrigation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.primaryWaterSource && (
                <p className="text-xs text-red-500">{errors.primaryWaterSource.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="storageFacilities">
                On-Farm Storage & Processing Facilities
              </Label>
              <Input
                id="storageFacilities"
                {...register("storageFacilities")}
                placeholder="e.g. Cassava Processing Mill, Grain Silos, Cold Room, Smoking Kiln"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Parcels, Commodities & Equipment (REPEATABLE UI) */}
      {currentStepIndex === 2 && (
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Farm Parcels, Crops / Livestock & Machinery Roster
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provide complete breakdown of your farmlands, planted
              crops/livestock, and farm machinery.
            </p>
          </div>

          {/* REPEATABLE SECTION: Farm Land Parcels */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" /> Farm Land Parcels
                  & Plots Schedule *
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record all separate parcels/plots of farmland operated in
                  Ijebu North East LGA.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendParcel({
                    locationName: "",
                    sizeAcres: "2",
                    landTenure: "Family / Inherited Land",
                    soilTerrain: "Loamy Topsoil",
                    nearestLandmark: "",
                  })
                }
                className="gap-1 text-xs h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" /> Add Farm Parcel
              </Button>
            </div>

            {errors.parcels && (
              <p className="text-xs text-red-500">{errors.parcels.message}</p>
            )}

            {parcelFields.map((field, idx) => (
              <div
                key={field.id}
                className="bg-muted/10 border rounded-xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-xs text-foreground">
                    Parcel #{idx + 1}: {formValues.parcels?.[idx]?.locationName || "New Farmland"}
                  </span>
                  {parcelFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParcel(idx)}
                      className="text-red-500 hover:text-red-700 h-7 px-2 text-xs"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">
                      Location / Village / Block *
                    </Label>
                    <Input
                      {...register(`parcels.${idx}.locationName`)}
                      placeholder="e.g. Olodo Farm Settlement, Plot 14"
                      disabled={isSubmitting}
                    />
                    {errors.parcels?.[idx]?.locationName && (
                      <p className="text-xs text-red-500">{errors.parcels[idx]?.locationName?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Parcel Size (Acres/Ha) *</Label>
                    <Input
                      {...register(`parcels.${idx}.sizeAcres`)}
                      placeholder="e.g. 10 Acres"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Land Tenure Status</Label>
                    <Controller
                      name={`parcels.${idx}.landTenure`}
                      control={control}
                      render={({ field: tenureField }) => (
                        <Select
                          value={tenureField.value}
                          onValueChange={tenureField.onChange}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="text-xs h-9">
                            <SelectValue placeholder="Tenure" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Freehold / Purchased">
                              Freehold / Purchased
                            </SelectItem>
                            <SelectItem value="Family / Inherited Land">
                              Family / Inherited Land
                            </SelectItem>
                            <SelectItem value="Leased (Short Term)">
                              Leased (Short Term 1-3 Yrs)
                            </SelectItem>
                            <SelectItem value="Leased (Long Term >5 Yrs)">
                              Leased (Long Term &gt;5 Yrs)
                            </SelectItem>
                            <SelectItem value="Government Farm Settlement Allocation">
                              Government Farm Settlement
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Soil / Terrain</Label>
                    <Input
                      {...register(`parcels.${idx}.soilTerrain`)}
                      placeholder="e.g. Rich Loamy, Gentle Slope"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Prominent Landmark</Label>
                    <Input
                      {...register(`parcels.${idx}.nearestLandmark`)}
                      placeholder="e.g. Near Catholic Church"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* REPEATABLE SECTION: Crops & Livestock */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-primary" /> Crops, Livestock &
                  Aquaculture Commodities *
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record all agricultural products cultivated or reared on the
                  farm.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendCommodity({
                    commodity: "",
                    scaleType: "Arable Crop",
                    annualYield: "10",
                    unit: "Tons",
                  })
                }
                className="gap-1 text-xs h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" /> Add Commodity
              </Button>
            </div>

            {errors.commodities && (
              <p className="text-xs text-red-500">{errors.commodities.message}</p>
            )}

            <div className="space-y-2.5">
              {commodityFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">
                      Commodity / Enterprise
                    </Label>
                    <Input
                      {...register(`commodities.${idx}.commodity`)}
                      placeholder="e.g. Cassava, Cocoa, Catfish"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                    {errors.commodities?.[idx]?.commodity && (
                      <p className="text-[10px] text-red-500">{errors.commodities[idx]?.commodity?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Category</Label>
                    <Controller
                      name={`commodities.${idx}.scaleType`}
                      control={control}
                      render={({ field: scaleField }) => (
                        <Select
                          value={scaleField.value}
                          onValueChange={scaleField.onChange}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arable Crop">Arable Crop</SelectItem>
                            <SelectItem value="Grain Crop">Grain Crop</SelectItem>
                            <SelectItem value="Tree Crop / Plantation">
                              Tree Crop
                            </SelectItem>
                            <SelectItem value="Vegetables / Horticulture">
                              Vegetables
                            </SelectItem>
                            <SelectItem value="Livestock (Poultry/Cattle/Goats)">
                              Livestock
                            </SelectItem>
                            <SelectItem value="Aquaculture / Fisheries">
                              Fisheries
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Annual Yield / Unit</Label>
                    <Input
                      {...register(`commodities.${idx}.annualYield`)}
                      placeholder="e.g. 50 Tons"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCommodity(idx)}
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

          {/* REPEATABLE SECTION: Machinery & Implements */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Tractor className="w-4 h-4 text-primary" /> Agricultural
                  Machinery & Equipment Roster
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record tractors, pumps, processing machines, and storage
                  equipment.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendEquipment({
                    equipmentType: "",
                    quantity: "1",
                    ownership: "Owned",
                    condition: "Good Working Order",
                  })
                }
                className="gap-1 text-xs h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" /> Add Equipment
              </Button>
            </div>

            <div className="space-y-2.5">
              {equipmentFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">
                      Equipment Type & Model
                    </Label>
                    <Input
                      {...register(`equipment.${idx}.equipmentType`)}
                      placeholder="e.g. MF 375 Tractor / Irrigation Pump"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Quantity</Label>
                    <Input
                      {...register(`equipment.${idx}.quantity`)}
                      placeholder="e.g. 2 Units"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Ownership</Label>
                    <Controller
                      name={`equipment.${idx}.ownership`}
                      control={control}
                      render={({ field: ownershipField }) => (
                        <Select
                          value={ownershipField.value}
                          onValueChange={ownershipField.onChange}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Ownership" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Owned">Owned</SelectItem>
                            <SelectItem value="Leased / Financed">
                              Leased
                            </SelectItem>
                            <SelectItem value="Cooperative Shared">
                              Cooperative Shared
                            </SelectItem>
                            <SelectItem value="Hired / Commercial Rented">
                              Hired / Rented
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEquipment(idx)}
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
          declarationText="I solemnly declare that the farmland parcels, acreage, crops, livestock, and machinery recorded herein are accurate and verifiable upon physical inspection by the Local Government Agricultural Extension Officers."
        />
      )}
    </FormWizard>
  );
}
