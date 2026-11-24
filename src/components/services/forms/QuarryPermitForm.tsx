"use client";
import React, { useState, useEffect } from "react";
import type { Resolver } from "react-hook-form";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LGA_CONFIG } from "@/config/lga.config";
import { useWards } from "@/hooks/queries/useWards";
import { ServiceType } from "@/config/lgaServices";
import { FormWizard, FormStep } from "./FormWizard";
import { DocumentUploadStep, DocumentSpec } from "./DocumentUploadStep";
import { ReviewSubmitStep, ReviewSection, ReviewRepeatableSection } from "./ReviewSubmitStep";
import { Plus, Trash2, Mountain, HardHat, Cog } from "lucide-react";
import { ApplicantSnapshot } from "../ApplicantSelectionStep";
import { formatAndValidateNigerianPhoneNumber } from "@/lib/helper";


interface Props {
  service: ServiceType;
  onSubmit: (formData: Record<string, any>) => void;
  isSubmitting?: boolean;
  initialApplicant?: ApplicantSnapshot;
}

const miningMachinerySchema = z.object({
  equipmentType: z.string().min(1, "Equipment type is required"),
  makeModel: z.string().default(""),
  quantity: z.string().default("1"),
  ratedCapacity: z.string().default(""),
});

const blastingEngineerSchema = z.object({
  fullName: z.string().default(""),
  licenseNumber: z.string().default(""),
  ministryRef: z.string().default(""),
  phone: z.string().default(""),
});

const extractionPitSchema = z.object({
  pitIdentifier: z.string().default(""),
  mineralOre: z.string().default("Granite Aggregate"),
  pitDepth: z.string().default("10 Metres"),
  dailyTonnage: z.string().default("500 Tons/Day"),
});

const quarryPermitSchema = z.object({
  companyName: z.string().min(1, "Mining enterprise name is required"),
  rcNumber: z.string().optional(),
  miningCadastreNo: z.string().min(1, "Mining Cadastre Lease (QL) number is required"),
  managingDirector: z.string().min(1, "Managing Director is required"),
  residentEngineer: z.string().optional(),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine((val) => formatAndValidateNigerianPhoneNumber(val).isValid, {
      message: "Please enter a valid Nigerian phone number",
    }),
  email: z
    .string()
    .email("Invalid email address")
    .or(z.literal(""))
    .optional(),
  siteLocation: z.string().min(1, "Site location description is required"),
  ward: z.string().min(1, "Ward is required"),
  concessionAcreage: z.string().default(""),
  blastingFrequency: z.string().min(1, "Blasting schedule is required"),
  setbackDistance: z.string().min(1, "Buffer distance is required"),
  dustSuppression: z.string().default(""),
  cdaStatus: z.string().default(""),
  machinery: z.array(miningMachinerySchema).min(1, "At least one machinery item is required"),
  engineers: z.array(blastingEngineerSchema),
  pits: z.array(extractionPitSchema),
});

type QuarryPermitFormValues = z.infer<typeof quarryPermitSchema>;

const STEPS: FormStep[] = [
  {
    id: "operator_lease",
    title: "Mining Operator & Cadastre Lease Profile",
    shortTitle: "Operator Profile",
    description: "Enter mining corporate credentials, Federal Mining Cadastre Lease ID, and physical quarry site.",
  },
  {
    id: "eia_blasting_safety",
    title: "EIA, Blasting Schedule & Community Agreement",
    shortTitle: "Blasting & EIA",
    description: "Provide blasting frequencies, setback from host communities, dust suppression, and CDA status.",
  },
  {
    id: "machinery_pits_engineers",
    title: "Heavy Equipment, Extraction Pits & Certified Engineers",
    shortTitle: "Pits & Machinery",
    description: "Itemize heavy crushers, rotary drill rigs, quarry extraction pits, and certified blasting engineers.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description: "Upload Federal Mining Lease, Ministry of Mines clearance, Police explosives permit, and EIA report.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description: "Review quarry operating permits and submit for the LGA Natural Resources assessment.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "mining_cadastre_lease",
    label: "Federal Mining Cadastre Quarry Lease (QL)",
    description: "Official grant letter and cadastral map from Mining Cadastre Office (MCO), Abuja.",
    required: true,
  },
  {
    id: "police_explosives_permit",
    label: "Police Explosives & Blasting Permit",
    description: "Valid magazine storage and blasting approval from the Nigerian Police Explosives Ordinance Department.",
    required: true,
  },
  {
    id: "eia_approval",
    label: "Environmental Impact Assessment (EIA) Approval",
    description: "Federal Ministry of Environment / Ogun State Environmental Protection Agency EIA report.",
    required: true,
  },
  {
    id: "cda_agreement",
    label: "Community Development Agreement (CDA)",
    description: "Executed host community agreement endorsed by the traditional council and LGA Chairman.",
    required: true,
  },
  {
    id: "coren_mining_cert",
    label: "Resident Mining Engineer COREN / COMEG Licence",
    description: "Professional practicing licence of the resident mining engineer on site.",
    required: true,
  },
];

export default function QuarryPermitForm({ service, onSubmit, isSubmitting, initialApplicant }: Props) {
  const { wards } = useWards();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [declaration, setDeclaration] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuarryPermitFormValues>({
    resolver: zodResolver(quarryPermitSchema) as Resolver<QuarryPermitFormValues>,
    defaultValues: {
      companyName: initialApplicant?.companyName || initialApplicant?.name || "",
      rcNumber: "",
      miningCadastreNo: "",
      managingDirector: initialApplicant?.name || "",
      residentEngineer: "",
      phone: initialApplicant?.phone || "",
      email: initialApplicant?.email || "",
      siteLocation: initialApplicant?.address || "",
      ward: initialApplicant?.ward || wards[0]?.name || "the LGA",
      concessionAcreage: "",
      blastingFrequency: "",
      setbackDistance: "",
      dustSuppression: "",
      cdaStatus: "",
      machinery: [
        { equipmentType: "", makeModel: "", quantity: "1", ratedCapacity: "" },
      ],
      engineers: [
        { fullName: "", licenseNumber: "", ministryRef: "", phone: "" },
      ],
      pits: [
        { pitIdentifier: "", mineralOre: "", pitDepth: "", dailyTonnage: "" },
      ],
    },
    mode: "onChange",
  });

  const {
    fields: machineryFields,
    append: appendMachinery,
    remove: removeMachinery,
  } = useFieldArray({
    control,
    name: "machinery",
  });

  const {
    fields: engineerFields,
    append: appendEngineer,
    remove: removeEngineer,
  } = useFieldArray({
    control,
    name: "engineers",
  });

  const {
    fields: pitFields,
    append: appendPit,
    remove: removePit,
  } = useFieldArray({
    control,
    name: "pits",
  });

  useEffect(() => {
    if (initialApplicant) {
      if (initialApplicant.companyName) setValue("companyName", initialApplicant.companyName);
      else if (initialApplicant.name) setValue("companyName", initialApplicant.name);
      if (initialApplicant.name) setValue("managingDirector", initialApplicant.name);
      if (initialApplicant.phone) setValue("phone", initialApplicant.phone);
      if (initialApplicant.email) setValue("email", initialApplicant.email);
      if (initialApplicant.address) setValue("siteLocation", initialApplicant.address);
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
        "companyName",
        "miningCadastreNo",
        "managingDirector",
        "phone",
        "email",
        "siteLocation",
        "ward",
      ]);
    }
    if (index === 1) {
      return await trigger([
        "blastingFrequency",
        "setbackDistance",
        "dustSuppression",
        "cdaStatus",
      ]);
    }
    if (index === 2) {
      return await trigger(["machinery"]);
    }
    if (index === 3) {
      const missing = DOCUMENTS.filter((d) => d.required && !uploadedFiles[d.id]);
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

  const onFormSubmit = (data: QuarryPermitFormValues) => {
    if (!declaration) return;

    onSubmit({
      formData: {
        ...data,
        machinery: data.machinery.filter((m) => m.equipmentType.trim()),
        engineers: data.engineers.filter((eng) => eng.fullName.trim()),
        pits: data.pits.filter((p) => p.pitIdentifier.trim()),
      },
      files: uploadedFiles,
      applicant: initialApplicant || null,
    });
  };

  const reviewSections: ReviewSection[] = [
    {
      title: "Mining Operator & Cadastre Concession",
      items: [
        { label: "Mining Company Name", value: formValues.companyName },
        { label: "RC / Corporate Registration", value: formValues.rcNumber || "N/A" },
        { label: "Mining Cadastre Lease (QL) No", value: formValues.miningCadastreNo },
        { label: "Managing Director", value: formValues.managingDirector },
        { label: "Resident Mining Engineer", value: formValues.residentEngineer || "N/A" },
        { label: "Contact Phone Number", value: formValues.phone },
        { label: "Email Address", value: formValues.email || "N/A" },
        { label: "Quarry Site Location", value: formValues.siteLocation },
        { label: "Ward in the LGA", value: formValues.ward },
        { label: "Total Concession Size", value: formValues.concessionAcreage },
      ],
    },
    {
      title: "Blasting Protocol, EIA & Host Community Agreement",
      items: [
        { label: "Designated Blasting Schedule", value: formValues.blastingFrequency },
        { label: "Community Buffer Distance", value: formValues.setbackDistance },
        { label: "Environmental Dust Control", value: formValues.dustSuppression },
        { label: "Community Development Agreement", value: formValues.cdaStatus },
      ],
    },
  ];

  const reviewRepeatableSections: ReviewRepeatableSection[] = [
    {
      title: "Heavy Extraction Machinery & Rock Crushers",
      countLabel: "Equipment",
      items: (formValues.machinery || [])
        .filter((m) => m.equipmentType?.trim())
        .map((m) => ({
          "Equipment Type": m.equipmentType,
          "Make & Model": m.makeModel || "N/A",
          Quantity: `${m.quantity} Units`,
          "Rated Capacity": m.ratedCapacity || "N/A",
        })),
    },
    {
      title: "Certified Blasting Engineers & Explosives Officers",
      countLabel: "Engineers",
      items: (formValues.engineers || [])
        .filter((e) => e.fullName?.trim())
        .map((e) => ({
          "Engineer Name": e.fullName,
          "COMEG / COREN Reg No": e.licenseNumber || "N/A",
          "Mines Ministry Ref": e.ministryRef || "N/A",
          "Phone Number": e.phone || "N/A",
        })),
    },
    {
      title: "Quarry Extraction Pits & Geological Benches",
      countLabel: "Extraction Pits",
      items: (formValues.pits || [])
        .filter((p) => p.pitIdentifier?.trim())
        .map((p) => ({
          "Pit Identifier": p.pitIdentifier,
          "Mineral Rock Type": p.mineralOre || "N/A",
          "Depth of Pit": p.pitDepth || "N/A",
          "Daily Output": p.dailyTonnage || "N/A",
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
        !formValues.companyName ||
        !formValues.miningCadastreNo ||
        !formValues.managingDirector ||
        !formValues.phone ||
        !formValues.siteLocation ||
        !formValues.ward ||
        !formValues.blastingFrequency ||
        !formValues.setbackDistance ||
        machineryFields.length === 0
      }
    >
      {/* STEP 1: Operator & Concession */}
      {currentStepIndex === 0 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Mining Operator & Cadastre Lease Profile
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter Federal Mining Cadastre Lease credentials, corporate directors, and physical quarry site in the LGA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="companyName">Mining / Quarry Enterprise Name *</Label>
              <Input
                id="companyName"
                {...register("companyName")}
                placeholder="e.g. the LGA Granite Quarries & Mining Nigeria Limited"
              />
              {errors.companyName && (
                <p className="text-xs text-red-500">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="miningCadastreNo">Mining Cadastre Lease (QL) Number *</Label>
              <Input
                id="miningCadastreNo"
                {...register("miningCadastreNo")}
                placeholder="e.g. QL-2022-OG-089"
                className="font-mono uppercase font-bold"
              />
              {errors.miningCadastreNo && (
                <p className="text-xs text-red-500">{errors.miningCadastreNo.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rcNumber">CAC Registration (RC Number)</Label>
              <Input
                id="rcNumber"
                {...register("rcNumber")}
                placeholder="RC-554433"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="managingDirector">Managing Director / Concession Holder *</Label>
              <Input
                id="managingDirector"
                {...register("managingDirector")}
                placeholder="e.g. Alhaji Mustapha Danladi"
              />
              {errors.managingDirector && (
                <p className="text-xs text-red-500">{errors.managingDirector.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="residentEngineer">Resident Mining Engineer (COMEG / COREN)</Label>
              <Input
                id="residentEngineer"
                {...register("residentEngineer")}
                placeholder="e.g. Engr. O. Balogun, COMEG No: 1429"
              />
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
                placeholder="operations@quarry.com"
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
                  <Select value={field.value} onValueChange={field.onChange}>
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
              <Label htmlFor="concessionAcreage">Concession Area Size (Hectares)</Label>
              <Input
                id="concessionAcreage"
                {...register("concessionAcreage")}
                placeholder="e.g. 40 Hectares"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="siteLocation">Quarry Site Physical GPS / Route Description *</Label>
              <Input
                id="siteLocation"
                {...register("siteLocation")}
                placeholder="Ridge Name, Village Corridor, the LGA"
              />
              {errors.siteLocation && (
                <p className="text-xs text-red-500">{errors.siteLocation.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Blasting, EIA & CDA */}
      {currentStepIndex === 1 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              EIA, Blasting Schedule & Community Agreement
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ensure strict environmental safety, community development trust adherence, and explosive ordinance compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="blastingFrequency">Authorized Blasting Schedule & Timing *</Label>
              <Input
                id="blastingFrequency"
                {...register("blastingFrequency")}
                placeholder="e.g. Tuesdays & Thursdays, 1:00 PM - 3:00 PM Only"
              />
              {errors.blastingFrequency && (
                <p className="text-xs text-red-500">{errors.blastingFrequency.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="setbackDistance">Distance to Nearest Human Settlement *</Label>
              <Controller
                control={control}
                name="setbackDistance"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="setbackDistance">
                      <SelectValue placeholder="Select Setback" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Over 2.0 Kilometers">Over 2.0 Kilometers (Highly Safe)</SelectItem>
                      <SelectItem value="1.0 to 2.0 Kilometers">1.0 to 2.0 Kilometers (Standard)</SelectItem>
                      <SelectItem value="500m to 1.0 Kilometer (Special Blast Mats Required)">500m - 1.0 km (Blast Mats Required)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.setbackDistance && (
                <p className="text-xs text-red-500">{errors.setbackDistance.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dustSuppression">Dust & Vibration Suppression System</Label>
              <Input
                id="dustSuppression"
                {...register("dustSuppression")}
                placeholder="e.g. Water bowsers on haul roads, wet crushing screens"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cdaStatus">Community Development Agreement (CDA) Status</Label>
              <Input
                id="cdaStatus"
                {...register("cdaStatus")}
                placeholder="e.g. 5-Year CDA Signed with Baale and Elders in Council"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Machinery, Pits & Engineers (REPEATABLE UI) */}
      {currentStepIndex === 2 && (
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Heavy Equipment, Extraction Pits & Certified Engineers
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provide complete inventory of heavy mining machinery, extraction pits, and licensed blasting engineers.
            </p>
          </div>

          {/* REPEATABLE SECTION: Machinery */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Cog className="w-4 h-4 text-primary" /> Heavy Mining Machinery & Rock Crushers *
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record all primary/secondary rock crushers, crawler excavators, and drilling rigs.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendMachinery({
                    equipmentType: "",
                    makeModel: "",
                    quantity: "1",
                    ratedCapacity: "",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Equipment
              </Button>
            </div>

            {machineryFields.map((fieldItem, idx) => (
              <div key={fieldItem.id} className="bg-muted/10 border rounded-xl p-4 space-y-3 relative group">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-xs text-foreground">
                    Machinery #{idx + 1}: {formValues.machinery?.[idx]?.equipmentType || "New Machinery"}
                  </span>
                  {machineryFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMachinery(idx)}
                      className="text-red-500 hover:text-red-700 h-7 px-2 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Equipment Type *</Label>
                    <Input
                      {...register(`machinery.${idx}.equipmentType`)}
                      placeholder="e.g. Jaw Crusher / Hydraulic Excavator"
                    />
                    {errors.machinery?.[idx]?.equipmentType && (
                      <p className="text-xs text-red-500">
                        {errors.machinery[idx]?.equipmentType?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Make & Model</Label>
                    <Input
                      {...register(`machinery.${idx}.makeModel`)}
                      placeholder="e.g. CAT 349D"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      {...register(`machinery.${idx}.quantity`)}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-4">
                    <Label className="text-xs">Rated Output Capacity</Label>
                    <Input
                      {...register(`machinery.${idx}.ratedCapacity`)}
                      placeholder="e.g. 200 Tons/Hour / 3.0 mÂ³ Bucket"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* REPEATABLE SECTION: Certified Engineers */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <HardHat className="w-4 h-4 text-primary" /> Certified Blasting Engineers & Explosives Officers
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record COMEG/COREN registered mining engineers and licensed explosives handlers.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendEngineer({
                    fullName: "",
                    licenseNumber: "",
                    ministryRef: "",
                    phone: "",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Engineer
              </Button>
            </div>

            <div className="space-y-2.5">
              {engineerFields.map((fieldItem, idx) => (
                <div key={fieldItem.id} className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">Engineer Name</Label>
                    <Input
                      {...register(`engineers.${idx}.fullName`)}
                      placeholder="Full Name"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">COMEG / Licence No</Label>
                    <Input
                      {...register(`engineers.${idx}.licenseNumber`)}
                      placeholder="COMEG No"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Phone / Ministry Ref</Label>
                    <Input
                      {...register(`engineers.${idx}.phone`)}
                      placeholder="080... / MMSD Ref"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEngineer(idx)}
                      className="text-red-500 hover:text-red-700 h-8 px-2 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REPEATABLE SECTION: Extraction Pits */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Mountain className="w-4 h-4 text-primary" /> Active Extraction Pits & Geological Faces
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record pit depths, rock formations, and estimated daily tonnage.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendPit({
                    pitIdentifier: "",
                    mineralOre: "Granite Aggregate",
                    pitDepth: "10 Metres",
                    dailyTonnage: "500 Tons/Day",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Extraction Pit
              </Button>
            </div>

            <div className="space-y-2.5">
              {pitFields.map((fieldItem, idx) => (
                <div key={fieldItem.id} className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">Pit Face Identifier</Label>
                    <Input
                      {...register(`pits.${idx}.pitIdentifier`)}
                      placeholder="e.g. Pit Alpha (North Face)"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Mineral Ore</Label>
                    <Input
                      {...register(`pits.${idx}.mineralOre`)}
                      placeholder="Granite Aggregate"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Daily Output</Label>
                    <Input
                      {...register(`pits.${idx}.dailyTonnage`)}
                      placeholder="e.g. 1000 Tons/Day"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePit(idx)}
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
          declarationText="I solemnly declare that the Federal Mining Cadastre Lease particulars, certified blasting engineer credentials, heavy machinery inventory, and environmental safeguards comply strictly with the Local Government Quarry Bye-Laws and the Nigerian Minerals and Mining Act."
        />
      )}
    </FormWizard>
  );
}
