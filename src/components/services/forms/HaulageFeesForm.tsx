"use client";
import React, { useState, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatAndValidateNigerianPhoneNumber } from "@/lib/helper";
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
import { ServiceType } from "@/config/lgaServices";
import { FormWizard, FormStep } from "./FormWizard";
import { DocumentUploadStep, DocumentSpec } from "./DocumentUploadStep";
import {
  ReviewSubmitStep,
  ReviewSection,
  ReviewRepeatableSection,
} from "./ReviewSubmitStep";
import { Plus, Trash2, Truck, Gauge } from "lucide-react";
import { ApplicantSnapshot } from "../ApplicantSelectionStep";

const WARDS = LGA_CONFIG.wards.map((ward) => ward.name);

const vehicleSchema = z.object({
  plateNumber: z.string().min(1, "Plate / Reg number is required"),
  chassisNumber: z.string().optional().default(""),
  vehicleMakeModel: z.string().min(1, "Make & model is required"),
  tonnageCapacity: z.string().default("30"),
  driverName: z.string().min(1, "Driver name is required"),
  driverLicence: z.string().optional().default(""),
  driverPhone: z.string().optional().default(""),
});

export const haulageFeesSchema = z.object({
  companyName: z.string().min(2, "Transport company/operator name is required"),
  rcNumber: z.string().optional().default(""),
  managingDirector: z
    .string()
    .min(2, "Managing Director / Fleet Manager name is required"),
  phone: z.string().refine(
    (val) => {
      const res = formatAndValidateNigerianPhoneNumber(val);
      return res.isValid;
    },
    { message: "Please enter a valid Nigerian phone number" }
  ),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  officeAddress: z.string().min(3, "Office / Garage address is required"),
  ward: z.string().min(1, "Ward is required"),
  primaryCargo: z.string().min(1, "Primary cargo material is required"),
  loadingPoints: z.string().min(2, "Loading points / quarry sites are required"),
  destinationCorridor: z.string().optional().default(""),
  paymentPlan: z.string().min(1, "Payment plan is required"),
  vehicles: z
    .array(vehicleSchema)
    .min(1, "At least one fleet vehicle is required"),
});

export type HaulageFeesFormData = z.infer<typeof haulageFeesSchema>;

interface Props {
  service: ServiceType;
  onSubmit: (formData: Record<string, any>) => void;
  isSubmitting?: boolean;
  initialApplicant?: ApplicantSnapshot;
}

const STEPS: FormStep[] = [
  {
    id: "operator_profile",
    title: "Transport Operator & Fleet Enterprise",
    shortTitle: "Operator Profile",
    description:
      "Enter transport company or logistics operator identity and corporate contacts.",
  },
  {
    id: "haulage_logistics",
    title: "Logistics Operations & Cargo Corridors",
    shortTitle: "Operations & Routes",
    description:
      "Specify primary cargo categories, loading quarries, and transit corridors.",
  },
  {
    id: "fleet_registry",
    title: "Fleet Vehicles & Drivers Roster",
    shortTitle: "Fleet Vehicles",
    description:
      "Itemize heavy-duty trucks, tippers, trailers, chassis numbers, and assigned drivers.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description:
      "Upload vehicle registration documents, roadworthiness certificates, and driver licences.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description:
      "Review fleet tonnage schedule, axle load declaration, and statutory haulage permit.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "vehicle_reg_papers",
    label: "Vehicle Registration & Ownership Proof",
    description:
      "Copies of vehicle licences, CMR certificates, or allocation papers for fleet vehicles.",
    required: true,
  },
  {
    id: "roadworthiness_cert",
    label: "State Roadworthiness Certificates",
    description:
      "Valid Computerized Vehicle Inspection Service (VIS) roadworthiness certificates.",
    required: true,
  },
  {
    id: "drivers_licences",
    label: "Commercial Drivers' Licences (Class G/Heavy Duty)",
    description:
      "Copies of valid FRSC commercial driver's licences for assigned fleet drivers.",
    required: true,
  },
  {
    id: "quarry_loading_pass",
    label: "Quarry Loading Point Pass / Waybill",
    description:
      "Recent loading manifest from Ijebu North East LGA granite quarries or sand extraction sites.",
    required: false,
  },
  {
    id: "cac_cert",
    label: "CAC Certificate of Incorporation",
    description:
      "For corporate haulage companies and logistics transport enterprises.",
    required: false,
  },
];

export default function HaulageFeesForm({
  service,
  onSubmit,
  isSubmitting,
  initialApplicant,
}: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>(
    {},
  );
  const [declaration, setDeclaration] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors },
  } = useForm<HaulageFeesFormData>({
    resolver: zodResolver(haulageFeesSchema),
    mode: "onBlur",
    defaultValues: {
      companyName: initialApplicant?.name || "",
      rcNumber: "",
      managingDirector: initialApplicant?.name || "",
      phone: initialApplicant?.phone || "",
      email: initialApplicant?.email || "",
      officeAddress: initialApplicant?.address || "",
      ward: initialApplicant?.ward || WARDS[0] || "Atan-Imuku",
      primaryCargo: "Granite & Quarry Stone Aggregates",
      loadingPoints: "",
      destinationCorridor: "",
      paymentPlan: "Monthly Fleet Haulage Permit Pass",
      vehicles: [
        {
          plateNumber: "",
          chassisNumber: "",
          vehicleMakeModel: "",
          tonnageCapacity: "",
          driverName: "",
          driverLicence: "",
          driverPhone: "",
        },
      ],
    },
  });

  const {
    fields: vehicleFields,
    append: appendVehicle,
    remove: removeVehicle,
  } = useFieldArray({
    control,
    name: "vehicles",
  });

  const formValues = watch();

  const totalFleetTonnage = useMemo(() => {
    return (formValues.vehicles || []).reduce(
      (acc, v) => acc + (parseFloat(v.tonnageCapacity) || 0),
      0,
    );
  }, [formValues.vehicles]);

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
        "companyName",
        "managingDirector",
        "phone",
        "email",
        "officeAddress",
        "ward",
      ]);
    } else if (currentStepIndex === 1) {
      isValid = await trigger([
        "primaryCargo",
        "loadingPoints",
        "paymentPlan",
      ]);
    } else if (currentStepIndex === 2) {
      isValid = await trigger("vehicles");
    } else if (currentStepIndex === 3) {
      const missing = DOCUMENTS.filter(
        (d) => d.required && !uploadedFiles[d.id],
      );
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

  const onValidSubmit = (data: HaulageFeesFormData) => {
    if (!declaration) return;

    onSubmit({
      formData: {
        ...data,
        vehicles: data.vehicles.filter((v) => v.plateNumber.trim()),
        totalFleetTonnage,
        fleetCount: data.vehicles.length,
      },
      files: uploadedFiles,
      applicant: initialApplicant || null,
    });
  };

  const reviewSections: ReviewSection[] = [
    {
      title: "Transport Operator & Fleet Profile",
      items: [
        { label: "Company / Operator Name", value: formValues.companyName },
        {
          label: "CAC / RC Number",
          value: formValues.rcNumber || "Private Carrier",
        },
        {
          label: "Managing Director / Manager",
          value: formValues.managingDirector,
        },
        { label: "Contact Phone", value: formValues.phone },
        { label: "Email Address", value: formValues.email || "N/A" },
        { label: "Operating Office Address", value: formValues.officeAddress },
        { label: "Ward in Ijebu North East LGA", value: formValues.ward },
        {
          label: "Active Fleet Count",
          value: `${vehicleFields.length} Heavy Commercial Vehicles`,
        },
      ],
    },
    {
      title: "Haulage Logistics & Transit Corridors",
      items: [
        { label: "Primary Cargo Material", value: formValues.primaryCargo },
        { label: "Loading Points / Quarries", value: formValues.loadingPoints },
        {
          label: "Destination Route Corridor",
          value: formValues.destinationCorridor || "Standard Regional Corridors",
        },
        { label: "Haulage Fee Permit Plan", value: formValues.paymentPlan },
        {
          label: "Cumulative Fleet Capacity",
          value: `${totalFleetTonnage} Metric Tons`,
        },
      ],
    },
  ];

  const reviewRepeatableSections: ReviewRepeatableSection[] = [
    {
      title: "Fleet Vehicles & Driver Particulars",
      countLabel: "Vehicles",
      items: (formValues.vehicles || [])
        .filter((v) => v.plateNumber?.trim())
        .map((v) => ({
          "Plate Number": v.plateNumber,
          "Chassis Number": v.chassisNumber || "N/A",
          "Make & Model": v.vehicleMakeModel,
          Capacity: `${v.tonnageCapacity || "30"} Tons`,
          "Assigned Driver": v.driverName,
          "Driver Licence": v.driverLicence || "N/A",
          "Driver Phone": v.driverPhone || "N/A",
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
      submitLabel="Submit Haulage Permit Application"
    >
      {/* STEP 1: Operator Profile */}
      {currentStepIndex === 0 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Transport Operator & Fleet Enterprise Profile
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter official credentials for commercial haulage transit
              licensing in Ijebu North East LGA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="companyName">
                Transport Company / Enterprise Name *
              </Label>
              <Input
                id="companyName"
                {...register("companyName")}
                placeholder="e.g. Ijebu North East LGA Heavy Haulage & Logistics Limited"
                disabled={isSubmitting}
              />
              {errors.companyName && (
                <p className="text-xs text-red-500">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="managingDirector">
                Managing Director / Fleet Manager *
              </Label>
              <Input
                id="managingDirector"
                {...register("managingDirector")}
                placeholder="e.g. Alhaji Rasheed Adeyemi"
                disabled={isSubmitting}
              />
              {errors.managingDirector && (
                <p className="text-xs text-red-500">{errors.managingDirector.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rcNumber">
                CAC Registration (RC / BN Number)
              </Label>
              <Input
                id="rcNumber"
                {...register("rcNumber")}
                placeholder="RC-984321"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Official Contact Phone *</Label>
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
              <Label htmlFor="email">Official Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="fleet@company.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ward">Ward Operating Base in Ijebu North East LGA *</Label>
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
              <Label htmlFor="officeAddress">
                Physical Operating Office / Transport Garage Address *
              </Label>
              <Input
                id="officeAddress"
                {...register("officeAddress")}
                placeholder="Garage / Terminal Address, Highway Corridor, Ijebu North East LGA"
                disabled={isSubmitting}
              />
              {errors.officeAddress && (
                <p className="text-xs text-red-500">{errors.officeAddress.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Logistics & Operations */}
      {currentStepIndex === 1 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Logistics Operations & Cargo Transit Corridors
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Specify transported materials, extraction quarries, transit
              permits, and payment plan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="primaryCargo">Primary Cargo Material *</Label>
              <Controller
                name="primaryCargo"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="primaryCargo">
                      <SelectValue placeholder="Select Cargo Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Granite & Quarry Stone Aggregates">
                        Granite & Quarry Stone Aggregates
                      </SelectItem>
                      <SelectItem value="Sand & Laterite Earth Fill">
                        Sand & Laterite Earth Fill
                      </SelectItem>
                      <SelectItem value="Timber, Hardwood & Logs">
                        Timber, Hardwood & Logs
                      </SelectItem>
                      <SelectItem value="Agricultural Produce & Cocoa/Cassava">
                        Agricultural Produce & Cocoa/Cassava
                      </SelectItem>
                      <SelectItem value="Cement & Manufactured Building Materials">
                        Cement & Manufactured Building Materials
                      </SelectItem>
                      <SelectItem value="Petroleum & Industrial Chemicals">
                        Petroleum & Industrial Chemicals
                      </SelectItem>
                      <SelectItem value="General Merchandise & Freight">
                        General Merchandise & Freight
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.primaryCargo && (
                <p className="text-xs text-red-500">{errors.primaryCargo.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paymentPlan">Haulage Permit Schedule *</Label>
              <Controller
                name="paymentPlan"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="paymentPlan">
                      <SelectValue placeholder="Select Permit Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly Fleet Haulage Permit Pass">
                        Monthly Fleet Haulage Permit Pass
                      </SelectItem>
                      <SelectItem value="Quarterly Fleet Transit Sticker">
                        Quarterly Fleet Transit Sticker
                      </SelectItem>
                      <SelectItem value="Annual Heavy Haulage Operating Licence">
                        Annual Heavy Haulage Operating Licence
                      </SelectItem>
                      <SelectItem value="Single-Trip Statutory Haulage Ticket">
                        Single-Trip Statutory Haulage Ticket
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentPlan && (
                <p className="text-xs text-red-500">{errors.paymentPlan.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="loadingPoints">
                Primary Loading Points / Quarry Sites in Ijebu North East LGA *
              </Label>
              <Input
                id="loadingPoints"
                {...register("loadingPoints")}
                placeholder="e.g. Alagbagba Granite Quarries, Olodo Stone Site, Camp Sand Beach"
                disabled={isSubmitting}
              />
              {errors.loadingPoints && (
                <p className="text-xs text-red-500">{errors.loadingPoints.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="destinationCorridor">
                Primary Destination Highways & Corridors
              </Label>
              <Input
                id="destinationCorridor"
                {...register("destinationCorridor")}
                placeholder="e.g. Abeokuta - Ibadan Expressway to Lagos State / Sagamu Interchange"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Fleet Vehicles (REPEATABLE UI) */}
      {currentStepIndex === 2 && (
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Fleet Vehicles & Drivers Roster
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Statutory regulations require itemizing all trucks, tippers,
              tankers, and assigned heavy-duty drivers.
            </p>
          </div>

          {/* Fleet Summary Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block">
                  Total Active Fleet Tonnage
                </span>
                <h4 className="text-lg font-bold text-foreground">
                  {totalFleetTonnage} Metric Tons{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({vehicleFields.length} Trucks Enrolled)
                  </span>
                </h4>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendVehicle({
                  plateNumber: "",
                  chassisNumber: "",
                  vehicleMakeModel: "Sinotruk Howo 371 (30 Tons)",
                  tonnageCapacity: "30",
                  driverName: "",
                  driverLicence: "",
                  driverPhone: "",
                })
              }
              className="gap-1 text-xs"
              disabled={isSubmitting}
            >
              <Plus className="w-3.5 h-3.5" /> Add Fleet Truck
            </Button>
          </div>

          {errors.vehicles && (
            <p className="text-xs text-red-500">{errors.vehicles.message}</p>
          )}

          {/* REPEATABLE SECTION: Vehicles */}
          <div className="space-y-4">
            {vehicleFields.map((field, idx) => (
              <div
                key={field.id}
                className="bg-muted/10 border rounded-xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <span className="font-bold text-xs text-foreground">
                      Truck #{idx + 1}: {formValues.vehicles?.[idx]?.plateNumber || "New Vehicle"} (
                      {formValues.vehicles?.[idx]?.vehicleMakeModel})
                    </span>
                  </div>
                  {vehicleFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVehicle(idx)}
                      className="text-red-500 hover:text-red-700 h-7 px-2 text-xs"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Plate / Reg Number *</Label>
                    <Input
                      {...register(`vehicles.${idx}.plateNumber`)}
                      placeholder="e.g. OG-482-A01"
                      className="font-mono uppercase font-bold"
                      disabled={isSubmitting}
                    />
                    {errors.vehicles?.[idx]?.plateNumber && (
                      <p className="text-xs text-red-500">{errors.vehicles[idx]?.plateNumber?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Chassis / VIN Number</Label>
                    <Input
                      {...register(`vehicles.${idx}.chassisNumber`)}
                      placeholder="Chassis Number"
                      className="font-mono text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Make & Model *</Label>
                    <Input
                      {...register(`vehicles.${idx}.vehicleMakeModel`)}
                      placeholder="e.g. Mack 10-Tyre Tipper"
                      disabled={isSubmitting}
                    />
                    {errors.vehicles?.[idx]?.vehicleMakeModel && (
                      <p className="text-xs text-red-500">{errors.vehicles[idx]?.vehicleMakeModel?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tonnage Capacity (Tons) *</Label>
                    <Controller
                      name={`vehicles.${idx}.tonnageCapacity`}
                      control={control}
                      render={({ field: tonnageField }) => (
                        <Select
                          value={tonnageField.value}
                          onValueChange={tonnageField.onChange}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="text-xs h-9">
                            <SelectValue placeholder="Tonnage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">
                              10 Tons (Light Tipper)
                            </SelectItem>
                            <SelectItem value="20">
                              20 Tons (6-Tyre Truck)
                            </SelectItem>
                            <SelectItem value="30">
                              30 Tons (10-Tyre Tipper)
                            </SelectItem>
                            <SelectItem value="45">
                              45 Tons (Articulated Trailer)
                            </SelectItem>
                            <SelectItem value="60">
                              60+ Tons (Heavy Multi-Axle)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-dashed">
                  <div className="space-y-1">
                    <Label className="text-xs">Assigned Driver Name *</Label>
                    <Input
                      {...register(`vehicles.${idx}.driverName`)}
                      placeholder="Driver Full Name"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                    {errors.vehicles?.[idx]?.driverName && (
                      <p className="text-xs text-red-500">{errors.vehicles[idx]?.driverName?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Driver's Licence No</Label>
                    <Input
                      {...register(`vehicles.${idx}.driverLicence`)}
                      placeholder="FRSC Licence No"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Driver Phone</Label>
                    <Input
                      {...register(`vehicles.${idx}.driverPhone`)}
                      placeholder="Driver Phone No"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
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
          declarationText="I solemnly declare that the registered fleet vehicles, driver licences, tonnage capacities, and loading point declarations comply strictly with the Local Government Haulage Regulations, Highway Axle-Load Limits, and Traffic Safety Bye-laws."
        />
      )}
    </FormWizard>
  );
}
