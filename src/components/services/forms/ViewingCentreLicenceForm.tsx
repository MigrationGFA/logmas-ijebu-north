"use client";
import React, { useState, useEffect } from "react";
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
import { ServiceType } from "@/config/lgaServices";
import { FormWizard, FormStep } from "./FormWizard";
import { DocumentUploadStep, DocumentSpec } from "./DocumentUploadStep";
import {
  ReviewSubmitStep,
  ReviewSection,
  ReviewRepeatableSection,
} from "./ReviewSubmitStep";
import { Plus, Trash2, Tv, ShieldCheck, Radio } from "lucide-react";
import { ApplicantSnapshot } from "../ApplicantSelectionStep";
import { formatAndValidateNigerianPhoneNumber } from "@/lib/helper";

const WARDS = LGA_CONFIG.wards.map((ward) => ward.name);

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

const displayScreenSchema = z.object({
  screenType: z.string().min(1, "Display type is required"),
  sizeInches: z.string().default(""),
  hallPosition: z.string().default(""),
});

const broadcastDecoderSchema = z.object({
  platform: z.string().min(1, "Broadcaster / Platform is required"),
  decoderNumber: z.string().default(""),
  subscriptionPlan: z.string().default(""),
});

const hallStaffSchema = z.object({
  fullName: z.string().min(1, "Staff name is required"),
  role: z.string().default(""),
  phone: z.string().default(""),
});

const viewingCentreLicenceSchema = z.object({
  centreName: z.string().min(1, "Viewing centre commercial name is required"),
  operatorName: z.string().min(1, "Operator / Proprietor full name is required"),
  phone: z
    .string()
    .min(1, "Contact phone number is required")
    .refine((val) => formatAndValidateNigerianPhoneNumber(val).isValid, {
      message: "Please enter a valid Nigerian phone number",
    }),
  email: z
    .string()
    .email("Invalid email address")
    .or(z.literal(""))
    .optional(),
  physicalAddress: z.string().min(1, "Viewing hall physical location is required"),
  ward: z.string().min(1, "Ward is required"),
  cacNumber: z.string().optional(),
  standardFee: z.string().optional(),
  seatingCapacity: z.string().min(1, "Hall seating capacity is required"),
  ventilationType: z.string().default(""),
  powerBackup: z.string().default(""),
  fireExtinguishers: z.string().min(1, "Fire extinguishers specification is required"),
  exitDoors: z.string().optional(),
  juvenileSafety: z.string().optional(),
  screens: z.array(displayScreenSchema).min(1, "At least one display screen is required"),
  decoders: z.array(broadcastDecoderSchema).min(1, "At least one broadcast decoder is required"),
  staff: z.array(hallStaffSchema).default([]),
});

type ViewingCentreLicenceFormValues = z.infer<typeof viewingCentreLicenceSchema>;

const STEPS: FormStep[] = [
  {
    id: "centre_profile",
    title: "Viewing Centre & Operator Profile",
    shortTitle: "Centre Profile",
    description:
      "Enter viewing hall enterprise name, operator identity, and physical location in the LGA.",
  },
  {
    id: "hall_safety",
    title: "Hall Specifications & Fire Safety",
    shortTitle: "Hall Specs & Safety",
    description:
      "Provide seating capacity, ventilation, generator backup, and emergency exit standards.",
  },
  {
    id: "screens_decoders_staff",
    title: "Screens, Commercial Decoders & Safety Staff",
    shortTitle: "Screens & Decoders",
    description:
      "Itemize display monitors, commercial sports broadcast subscriptions, and crowd security staff.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description:
      "Upload hall layout sketch, commercial DStv receipt, fire safety certificate, and ID card.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description:
      "Review viewing centre licensing terms and submit for statutory LGA authorization.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "hall_layout",
    label: "Hall Seating & Exit Layout Plan",
    description:
      "Floor diagram indicating viewing bench arrangement, screen mounts, and exit aisles.",
    required: true,
  },
  {
    id: "commercial_broadcast_receipt",
    label: "Commercial Broadcast Subscription Receipt",
    description:
      "Proof of active commercial public viewing subscription (e.g. SuperSport/DStv Commercial).",
    required: true,
  },
  {
    id: "fire_safety_cert",
    label: "Fire Prevention & Extinguisher Clearance",
    description:
      "Inspection pass or receipt of certified fire extinguisher servicing.",
    required: true,
  },
  {
    id: "operator_id",
    label: "Centre Operator Means of ID",
    description: "NIN Slip, Voter's Card, or Driver's Licence.",
    required: true,
  },
  {
    id: "cac_cert",
    label: "CAC Business Name Certificate",
    description:
      "Business name registration document (if enterprise is registered).",
    required: false,
  },
];

export default function ViewingCentreLicenceForm({
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
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ViewingCentreLicenceFormValues>({
    resolver: zodResolver(viewingCentreLicenceSchema) as Resolver<ViewingCentreLicenceFormValues>,
    defaultValues: {
      centreName: "",
      operatorName: initialApplicant?.name || "",
      phone: initialApplicant?.phone || "",
      email: initialApplicant?.email || "",
      physicalAddress: initialApplicant?.address || "",
      ward: initialApplicant?.ward || WARDS[0] || "the LGA",
      cacNumber: "",
      seatingCapacity: "",
      standardFee: "",
      ventilationType: "",
      powerBackup: "",
      fireExtinguishers: "",
      exitDoors: "",
      juvenileSafety: "",
      screens: [
        {
          screenType: "4K UHD Commercial LED Screen",
          sizeInches: "",
          hallPosition: "",
        },
      ],
      decoders: [
        {
          platform: "DStv Commercial (SuperSport Premier League)",
          decoderNumber: "",
          subscriptionPlan: "",
        },
      ],
      staff: [
        {
          fullName: "",
          role: "",
          phone: "",
        },
      ],
    },
    mode: "onChange",
  });

  const {
    fields: screenFields,
    append: appendScreen,
    remove: removeScreen,
  } = useFieldArray({
    control,
    name: "screens",
  });

  const {
    fields: decoderFields,
    append: appendDecoder,
    remove: removeDecoder,
  } = useFieldArray({
    control,
    name: "decoders",
  });

  const {
    fields: staffFields,
    append: appendStaff,
    remove: removeStaff,
  } = useFieldArray({
    control,
    name: "staff",
  });

  useEffect(() => {
    if (initialApplicant) {
      if (initialApplicant.name) setValue("operatorName", initialApplicant.name);
      if (initialApplicant.companyName) setValue("centreName", initialApplicant.companyName);
      if (initialApplicant.phone) setValue("phone", initialApplicant.phone);
      if (initialApplicant.email) setValue("email", initialApplicant.email);
      if (initialApplicant.address) setValue("physicalAddress", initialApplicant.address);
      if (initialApplicant.ward) setValue("ward", initialApplicant.ward);
    }
  }, [initialApplicant, setValue]);

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
      return await trigger([
        "centreName",
        "operatorName",
        "phone",
        "email",
        "physicalAddress",
        "ward",
        "cacNumber",
        "standardFee",
      ]);
    }
    if (index === 1) {
      return await trigger([
        "seatingCapacity",
        "ventilationType",
        "powerBackup",
        "fireExtinguishers",
        "exitDoors",
        "juvenileSafety",
      ]);
    }
    if (index === 2) {
      return await trigger(["screens", "decoders", "staff"]);
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

  const onFormSubmit = (data: ViewingCentreLicenceFormValues) => {
    if (!declaration) return;

    onSubmit({
      formData: {
        ...data,
        screens: data.screens.filter((s) => s.screenType.trim()),
        decoders: data.decoders.filter((d) => d.platform.trim()),
        staff: data.staff.filter((st) => st.fullName.trim()),
      },
      files: uploadedFiles,
      applicant: initialApplicant || null,
    });
  };

  const reviewSections: ReviewSection[] = [
    {
      title: "Viewing Centre & Operator Details",
      items: [
        { label: "Centre Name", value: formValues.centreName },
        { label: "Operator / Owner Name", value: formValues.operatorName },
        { label: "Contact Phone Number", value: formValues.phone },
        { label: "Email Address", value: formValues.email || "N/A" },
        { label: "Physical Location", value: formValues.physicalAddress },
        { label: "Ward in the LGA", value: formValues.ward },
        { label: "CAC Reg Number", value: formValues.cacNumber || "N/A" },
        { label: "Standard Admission Fee", value: formValues.standardFee || "N/A" },
      ],
    },
    {
      title: "Hall Capacity, Safety & Power Standards",
      items: [
        { label: "Total Seating Capacity", value: formValues.seatingCapacity },
        { label: "Hall Ventilation", value: formValues.ventilationType },
        { label: "Backup Generator System", value: formValues.powerBackup },
        {
          label: "Fire Extinguishers Provided",
          value: formValues.fireExtinguishers,
        },
        { label: "Emergency Exits", value: formValues.exitDoors || "N/A" },
        { label: "Juvenile Protection Clause", value: formValues.juvenileSafety || "N/A" },
      ],
    },
  ];

  const reviewRepeatableSections: ReviewRepeatableSection[] = [
    {
      title: "Display Screens & Projection Equipment",
      countLabel: "Screens",
      items: (formValues.screens || [])
        .filter((s) => s.screenType?.trim())
        .map((s) => ({
          "Screen Hardware": s.screenType,
          "Diagonal Size": s.sizeInches || "N/A",
          "Mounting Position": s.hallPosition || "N/A",
        })),
    },
    {
      title: "Commercial Broadcast Decoders & Subscriptions",
      countLabel: "Decoders",
      items: (formValues.decoders || [])
        .filter((d) => d.platform?.trim())
        .map((d) => ({
          "Broadcast Service": d.platform,
          "Smartcard / Box ID": d.decoderNumber || "N/A",
          "Commercial Package": d.subscriptionPlan || "N/A",
        })),
    },
    {
      title: "Hall Supervisory & Crowd Security Personnel",
      countLabel: "Personnel",
      items: (formValues.staff || [])
        .filter((st) => st.fullName?.trim())
        .map((st) => ({
          "Staff Name": st.fullName,
          "Assigned Role": st.role || "N/A",
          "Phone Number": st.phone || "N/A",
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
        !formValues.centreName ||
        !formValues.operatorName ||
        !formValues.phone ||
        !formValues.physicalAddress ||
        !formValues.ward ||
        !formValues.seatingCapacity ||
        !formValues.fireExtinguishers ||
        screenFields.length === 0 ||
        decoderFields.length === 0
      }
    >
      {/* STEP 1: Centre Profile */}
      {currentStepIndex === 0 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Viewing Centre & Operator Profile
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter sports viewing hall details and operator contact credentials
              in the LGA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="centreName">
                Viewing Centre Commercial Name *
              </Label>
              <Input
                id="centreName"
                {...register("centreName")}
                placeholder="e.g. Champions League Arena Viewing Centre"
              />
              {errors.centreName && (
                <p className="text-xs text-red-500">{errors.centreName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="operatorName">
                Operator / Proprietor Full Name *
              </Label>
              <Input
                id="operatorName"
                {...register("operatorName")}
                placeholder="e.g. Mr. Kehinde Adegbite"
              />
              {errors.operatorName && (
                <p className="text-xs text-red-500">{errors.operatorName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Contact Phone Number *</Label>
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
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="viewingcentre@example.com"
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

            <div className="space-y-1.5">
              <Label htmlFor="cacNumber">CAC Registration Number</Label>
              <Input
                id="cacNumber"
                {...register("cacNumber")}
                placeholder="BN-334455"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="standardFee">Standard Match Admission Fee</Label>
              <Input
                id="standardFee"
                {...register("standardFee")}
                placeholder="e.g. ₦200 - ₦300"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="physicalAddress">
                Viewing Hall Physical Location Address *
              </Label>
              <Input
                id="physicalAddress"
                {...register("physicalAddress")}
                placeholder="Building No, Street name, Community in the LGA"
              />
              {errors.physicalAddress && (
                <p className="text-xs text-red-500">{errors.physicalAddress.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Hall Specs & Safety */}
      {currentStepIndex === 1 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Hall Specifications, Safety & Fire Controls
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provide crowd safety specifications, acoustic measures, and
              emergency evacuation exits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="seatingCapacity">Hall Seating Capacity *</Label>
              <Input
                id="seatingCapacity"
                {...register("seatingCapacity")}
                placeholder="e.g. 100 Seats"
              />
              {errors.seatingCapacity && (
                <p className="text-xs text-red-500">{errors.seatingCapacity.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ventilationType">
                Ventilation & Cooling System *
              </Label>
              <Controller
                control={control}
                name="ventilationType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="ventilationType">
                      <SelectValue placeholder="Select Ventilation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Heavy Duty Industrial Wall Fans & Cross Ventilation">
                        Industrial Wall Fans & Cross Ventilation
                      </SelectItem>
                      <SelectItem value="Split-Unit Air Conditioning System">
                        Split-Unit Air Conditioning System
                      </SelectItem>
                      <SelectItem value="Natural Cross Ventilation with Ceiling Fans">
                        Natural Cross Ventilation with Ceiling Fans
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="powerBackup">Alternative Power Backup *</Label>
              <Controller
                control={control}
                name="powerBackup"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="powerBackup">
                      <SelectValue placeholder="Select Power Backup" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15kVA Soundproof Diesel Generator & Inverter">
                        Soundproof Diesel Generator & Inverter
                      </SelectItem>
                      <SelectItem value="10kVA Petrol Generator Set">
                        10kVA Petrol Generator Set
                      </SelectItem>
                      <SelectItem value="Solar PV & Lithium Inverter Backup">
                        Solar PV & Lithium Inverter Backup
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fireExtinguishers">
                Fire Extinguishers Installed *
              </Label>
              <Input
                id="fireExtinguishers"
                {...register("fireExtinguishers")}
                placeholder="e.g. 2 x 6kg Dry Chemical Extinguishers"
              />
              {errors.fireExtinguishers && (
                <p className="text-xs text-red-500">{errors.fireExtinguishers.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exitDoors">Emergency Evacuation Exit Doors</Label>
              <Input
                id="exitDoors"
                {...register("exitDoors")}
                placeholder="e.g. 2 Dedicated Outward-Opening Exit Doors"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="juvenileSafety">Juvenile Protection Policy</Label>
              <Input
                id="juvenileSafety"
                {...register("juvenileSafety")}
                placeholder="No underage gambling or admission in school uniform"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Screens, Decoders & Staff (REPEATABLE UI) */}
      {currentStepIndex === 2 && (
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Display Screens, Commercial Decoders & Safety Staff
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Itemize all visual display units, commercial sports broadcasting
              decoders, and security attendants.
            </p>
          </div>

          {/* REPEATABLE SECTION: Display Screens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-primary" /> Display Screens &
                  Projectors *
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record all TVs, laser projectors, and display monitors
                  installed in the viewing centre.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendScreen({
                    screenType: "Smart LED TV",
                    sizeInches: "65 Inches",
                    hallPosition: "Rear Hall Wing",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Screen
              </Button>
            </div>

            {screenFields.map((fieldItem, idx) => (
              <div
                key={fieldItem.id}
                className="bg-muted/10 border rounded-xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-xs text-foreground">
                    Screen #{idx + 1}: {formValues.screens?.[idx]?.screenType || "Screen"} ({formValues.screens?.[idx]?.sizeInches || "Size"})
                  </span>
                  {screenFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScreen(idx)}
                      className="text-red-500 hover:text-red-700 h-7 px-2 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Display Type *</Label>
                    <Input
                      {...register(`screens.${idx}.screenType`)}
                      placeholder="e.g. 4K UHD Smart TV / Laser Projector"
                    />
                    {errors.screens?.[idx]?.screenType && (
                      <p className="text-xs text-red-500">
                        {errors.screens[idx]?.screenType?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Screen Size (Inches)</Label>
                    <Input
                      {...register(`screens.${idx}.sizeInches`)}
                      placeholder="e.g. 75 Inches / 120 Inches"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hall Mounting Position</Label>
                    <Input
                      {...register(`screens.${idx}.hallPosition`)}
                      placeholder="e.g. Front Stage / Side Wing"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* REPEATABLE SECTION: Commercial Decoders */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-primary" /> Commercial
                  Broadcast Decoders *
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record commercial sports decoders and smartcard numbers.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendDecoder({
                    platform: "DStv Commercial",
                    decoderNumber: "",
                    subscriptionPlan: "Commercial HD",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Decoder
              </Button>
            </div>

            <div className="space-y-2.5">
              {decoderFields.map((fieldItem, idx) => (
                <div
                  key={fieldItem.id}
                  className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">
                      Broadcaster / Platform *
                    </Label>
                    <Input
                      {...register(`decoders.${idx}.platform`)}
                      placeholder="e.g. DStv Commercial / StarTimes"
                      className="h-8 text-xs"
                    />
                    {errors.decoders?.[idx]?.platform && (
                      <p className="text-xs text-red-500">
                        {errors.decoders[idx]?.platform?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">
                      Smartcard / IUC Number
                    </Label>
                    <Input
                      {...register(`decoders.${idx}.decoderNumber`)}
                      placeholder="10-digit number"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Commercial Plan</Label>
                    <Input
                      {...register(`decoders.${idx}.subscriptionPlan`)}
                      placeholder="Commercial Sports"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDecoder(idx)}
                      className="text-red-500 hover:text-red-700 h-8 px-2 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REPEATABLE SECTION: Staff */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Hall
                  Supervisory & Crowd Security Personnel
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record staff responsible for ticketing, electrical safety, and
                  crowd control.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendStaff({
                    fullName: "",
                    role: "Security / Attendant",
                    phone: "",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Staff
              </Button>
            </div>

            <div className="space-y-2.5">
              {staffFields.map((fieldItem, idx) => (
                <div
                  key={fieldItem.id}
                  className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">Staff Name *</Label>
                    <Input
                      {...register(`staff.${idx}.fullName`)}
                      placeholder="Full Name"
                      className="h-8 text-xs"
                    />
                    {errors.staff?.[idx]?.fullName && (
                      <p className="text-xs text-red-500">
                        {errors.staff[idx]?.fullName?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Role / Duty</Label>
                    <Input
                      {...register(`staff.${idx}.role`)}
                      placeholder="Security / Cashier"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Phone Number</Label>
                    <Input
                      {...register(`staff.${idx}.phone`)}
                      placeholder="080..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStaff(idx)}
                      className="text-red-500 hover:text-red-700 h-8 px-2 text-xs"
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
          declarationText="I solemnly declare that the viewing hall seating layout, electrical wiring safety, commercial broadcast subscriptions, and crowd control measures comply strictly with the Public Entertainment & Viewing Centre Regulations of the Local Government, Ogun State."
        />
      )}
    </FormWizard>
  );
}
