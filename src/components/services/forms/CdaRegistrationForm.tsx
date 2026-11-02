 "use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LGA_CONFIG } from "@/config/lga.config";
import { ServiceType, getConfiguredFeeForService } from "@/config/lgaServices";
import { FormWizard, FormStep } from "./FormWizard";
import { DocumentUploadStep, DocumentSpec, UploadedFileMeta } from "./DocumentUploadStep";
import { ReviewSubmitStep, ReviewSection, ReviewRepeatableSection } from "./ReviewSubmitStep";
import { ApplicantSelectionStep, ApplicantSnapshot } from "../ApplicantSelectionStep";
import { Plus, Trash2, Shield, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const WARDS = LGA_CONFIG.wards.map((ward) => ward.name);

const cdaOfficerSchema = z.object({
  role: z.string().min(1, "Role is required"),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  nin: z.string().optional().or(z.literal("")),
});

const communityStreetSchema = z.object({
  streetName: z.string().optional().or(z.literal("")),
  estimatedHouses: z.string().optional().or(z.literal("")),
  zoneLeader: z.string().optional().or(z.literal("")),
  leaderPhone: z.string().optional().or(z.literal("")),
});

export const cdaRegistrationSchema = z.object({
  cdaName: z.string().min(2, "Full name of CDA is required"),
  cdaAcronym: z.string().optional().or(z.literal("")),
  ward: z.string().min(1, "Ward location is required"),
  hostVillage: z.string().min(1, "Host village / community is required"),
  baaleName: z.string().min(1, "Community Baale name is required"),
  baalePhone: z.string().optional().or(z.literal("")),
  estimatedPopulation: z.union([z.number(), z.string()]).optional(),
  estimatedHouseholds: z.union([z.number(), z.string()]).optional(),
  primarySecurityArrangement: z.string().min(1, "Security arrangement is required"),
  securityPostLocation: z.string().optional().or(z.literal("")),
  primaryWaterSource: z.string().optional().or(z.literal("")),
  electricityStatus: z.string().optional().or(z.literal("")),
  priorityProject1: z.string().min(1, "Priority community project 1 is required"),
  priorityProject2: z.string().optional().or(z.literal("")),
  priorityProject3: z.string().optional().or(z.literal("")),
  bankName: z.string().optional().or(z.literal("")),
  accountNumber: z.string().optional().or(z.literal("")),
  officers: z.array(cdaOfficerSchema),
  streets: z.array(communityStreetSchema),
});

export type CdaRegistrationFormData = z.infer<typeof cdaRegistrationSchema>;

interface Props {
  service: ServiceType;
  onSubmit: (payload: {
    applicant: ApplicantSnapshot;
    formData: Record<string, any>;
    files: Record<string, any>;
  }) => void;
  isSubmitting?: boolean;
  mode?: "citizen" | "business_owner" | "field_officer" | "admin";
  initialApplicant?: ApplicantSnapshot;
}

interface CdaOfficer {
  role: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  occupation: string;
  nin: string;
}

interface CommunityStreet {
  streetName: string;
  estimatedHouses: string;
  zoneLeader: string;
  leaderPhone: string;
}

const STEPS: FormStep[] = [
  // {
  //   id: "applicant_info",
  //   title: "Lead CDA Representative & Contact",
  //   shortTitle: "Representative",
  //   description: "Provide contact details for the submitting CDA Chairman / Secretary.",
  // },
  {
    id: "cda_profile",
    title: "CDA Identity & Community Profile",
    shortTitle: "CDA Profile",
    description: "Enter community development association name, boundaries, and traditional leadership.",
  },
  {
    id: "projects_development",
    title: "Community Projects & Development Priorities",
    shortTitle: "Projects & Focus",
    description: "Outline community infrastructure projects (security, roads, electrification, water).",
  },
  {
    id: "executives_streets",
    title: "Executive Officers & Street Zones",
    shortTitle: "Officers & Zones",
    description: "Record CDA Chairman, Secretary, Treasurer, Security Officer, and street/zone leaders.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description: "Upload CDA constitution, Baale consent letter, minutes, and sketch map.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description: "Review CDA data, officers, zones, and execute statutory declaration.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "cda_constitution",
    label: "CDA Constitution & Bye-laws",
    description: "Adopted constitution specifying governance, election tenure, and community security codes.",
    required: true,
  },
  {
    id: "baale_letter",
    label: "Baale / Traditional Council Consent Letter",
    description: "Letter of endorsement signed by the Village Head or Baale of the community.",
    required: true,
  },
  {
    id: "inaugural_minutes",
    label: "Inaugural Community Assembly Minutes",
    description: "Signed attendance and minutes of the general meeting where the CDA was formed.",
    required: true,
  },
  {
    id: "boundary_sketch",
    label: "Community Boundary Sketch / Map",
    description: "Sketch plan indicating major streets, landmarks, and contiguous borders.",
    required: true,
  },
  {
    id: "chairman_passport",
    label: "CDA Chairman Passport Photo",
    description: "Clear passport photograph of the presiding CDA Chairman.",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png",
  },
];

export default function CdaRegistrationForm({
  service,
  onSubmit,
  isSubmitting = false,
  mode = "citizen",
  initialApplicant,
}: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFileMeta>>({});
  const [declaration, setDeclaration] = useState(false);

  const [applicant] = useState<ApplicantSnapshot>(
    initialApplicant || {
      fullName: "test",
      phone: "08031234567",
      email: "",
      address: "knknvkrvkvr",
      ward: "Ward 7 (Itesi / Camp)",
      nin: "",
      cacNumber: "",
      applicantId: null,
      isRegistered: false,
    }
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CdaRegistrationFormData>({
    resolver: zodResolver(cdaRegistrationSchema),
    defaultValues: {
      cdaName: "",
      cdaAcronym: "",
      ward: WARDS[0] || "Atan-Imuku",
      hostVillage: "",
      baaleName: "",
      baalePhone: "",
      estimatedPopulation: undefined,
      estimatedHouseholds: undefined,
      primarySecurityArrangement: "",
      securityPostLocation: "",
      primaryWaterSource: "",
      electricityStatus: "",
      priorityProject1: "",
      priorityProject2: "",
      priorityProject3: "",
      bankName: "",
      accountNumber: "",
      officers: [
        {
          role: "CDA Chairman",
          fullName: "",
          phone: "",
          email: "",
          address: "",
          occupation: "",
          nin: "",
        },
        {
          role: "General Secretary",
          fullName: "",
          phone: "",
          email: "",
          address: "",
          occupation: "",
          nin: "",
        },
        {
          role: "Treasurer",
          fullName: "",
          phone: "",
          email: "",
          address: "",
          occupation: "",
          nin: "",
        },
        {
          role: "Chief Security Officer (CSO)",
          fullName: "",
          phone: "",
          email: "",
          address: "",
          occupation: "",
          nin: "",
        },
      ],
      streets: [
        { streetName: "", estimatedHouses: "", zoneLeader: "", leaderPhone: "" },
      ],
    },
    mode: "onChange",
  });

  const {
    fields: officerFields,
    append: appendOfficer,
    remove: removeOfficer,
  } = useFieldArray({
    control,
    name: "officers",
  });

  const {
    fields: streetFields,
    append: appendStreet,
    remove: removeStreet,
  } = useFieldArray({
    control,
    name: "streets",
  });

  const formValues = watch();

  const handleFileUpload = (docId: string, meta: UploadedFileMeta | string, actualFile?: File) => {
    if (typeof meta === "string") {
      setUploadedFiles((prev) => ({ ...prev, [docId]: { name: meta, file: actualFile } }));
    } else {
      setUploadedFiles((prev) => ({ ...prev, [docId]: meta }));
    }
  };

  const handleFileRemove = (docId: string) => {
    setUploadedFiles((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
  };

  const addOfficer = () => {
    appendOfficer({
      role: "Executive Member (PRO / Welfare)",
      fullName: "",
      phone: "",
      email: "",
      address: "",
      occupation: "",
      nin: "",
    });
  };

  const addStreet = () => {
    appendStreet({
      streetName: "",
      estimatedHouses: "20",
      zoneLeader: "",
      leaderPhone: "",
    });
  };

  const validateStep = async (index: number): Promise<boolean> => {
    if (index === 0) {
      return await trigger(["cdaName", "hostVillage", "baaleName", "ward"]);
    }
    if (index === 1) {
      return await trigger(["primarySecurityArrangement", "priorityProject1"]);
    }
    if (index === 2) {
      return await trigger(["officers"]);
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
      setCurrentStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const onValidSubmit = (data: CdaRegistrationFormData) => {
    if (!declaration) return;

    const filesPayload: Record<string, any> = {};
    Object.entries(uploadedFiles).forEach(([k, meta]) => {
      if (meta.file) {
        filesPayload[k] = meta.file;
      } else {
        filesPayload[k] = { name: meta.name };
      }
    });

    const cleanOfficers = (data.officers || []).filter((o) => o.fullName.trim().length > 0);
    const cleanStreets = (data.streets || []).filter((s) => (s.streetName || "").trim().length > 0);

    const { officers: _rawOfficers, streets: _rawStreets, ...rest } = data;

    onSubmit({
      applicant,
      formData: {
        ...rest,
        officers: cleanOfficers,
        streets: cleanStreets,
        officerCount: cleanOfficers.length,
        streetCount: cleanStreets.length,
      },
      files: filesPayload,
    });
  };

   const currentFee = service.feeConfig.amount;

  const reviewSections: ReviewSection[] = [
    {
      title: "CDA Community Identity",
      items: [
        { label: "Full CDA Name", value: formValues.cdaName },
        { label: "Acronym", value: formValues.cdaAcronym || "N/A" },
        { label: "Host Ward", value: `${formValues.ward} Ward` },
        { label: "Host Village / Area", value: formValues.hostVillage },
        { label: "Traditional Baale / Head", value: formValues.baaleName },
        { label: "Baale Contact Phone", value: formValues.baalePhone || "N/A" },
        { label: "Est. Households / Population", value: `${formValues.estimatedHouseholds} Houses / ~${Number(formValues.estimatedPopulation || 0).toLocaleString()} Residents` },
      ],
    },
    {
      title: "Community Infrastructure & Security",
      items: [
        { label: "Security Apparatus", value: formValues.primarySecurityArrangement },
        { label: "Security Post Location", value: formValues.securityPostLocation || "Central Junction" },
        { label: "Water Infrastructure", value: formValues.primaryWaterSource || "N/A" },
        { label: "Electricity Infrastructure", value: formValues.electricityStatus || "N/A" },
        { label: "Priority Project #1", value: formValues.priorityProject1 },
        { label: "Priority Project #2", value: formValues.priorityProject2 || "N/A" },
        { label: "Priority Project #3", value: formValues.priorityProject3 || "N/A" },
      ],
    },
  ];

  const reviewRepeatables: ReviewRepeatableSection[] = [
    {
      title: "CDA Executive Committee",
      countLabel: "Executive Officers",
      items: (formValues.officers || [])
        .filter((o) => o?.fullName?.trim())
        .map((o) => ({
          role: o.role,
          name: o.fullName,
          phone: o.phone,
          email: o.email || "N/A",
          occupation: o.occupation || "N/A",
          nin: o.nin || "N/A",
        })),
    },
    {
      title: "Street & Zone Register",
      countLabel: "Streets Listed",
      items: (formValues.streets || [])
        .filter((s) => s?.streetName?.trim())
        .map((s) => ({
          streetName: s.streetName || "",
          estHouses: s.estimatedHouses || "0",
          zoneLeader: s.zoneLeader || "N/A",
          leaderPhone: s.leaderPhone || "N/A",
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
      submitLabel="Submit CDA Registration Application"
    >
      {/* STEP 1: CDA Profile */}
      {currentStepIndex === 0 && (
        <div className="space-y-4 text-xs">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              CDA Identity & Traditional Domain
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter official Community Development Association particulars in the Local Government.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cdaName">Full Name of CDA *</Label>
              <Input
                id="cdaName"
                {...register("cdaName")}
                placeholder="e.g. Ifelodun Community Development Association, Itesi"
                disabled={isSubmitting}
              />
              {errors.cdaName && (
                <p className="text-xs text-red-500">{errors.cdaName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cdaAcronym">CDA Short Name / Acronym</Label>
              <Input
                id="cdaAcronym"
                {...register("cdaAcronym")}
                placeholder="e.g. IFELODUN CDA"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ward">Ward Location *</Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="hostVillage">Host Village / Quarter / Community *</Label>
              <Input
                id="hostVillage"
                {...register("hostVillage")}
                placeholder="e.g. Camp Village / Alabata Road"
                disabled={isSubmitting}
              />
              {errors.hostVillage && (
                <p className="text-xs text-red-500">{errors.hostVillage.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="baaleName">Community Baale / Traditional Ruler *</Label>
              <Input
                id="baaleName"
                {...register("baaleName")}
                placeholder="Chief / Baale of Community"
                disabled={isSubmitting}
              />
              {errors.baaleName && (
                <p className="text-xs text-red-500">{errors.baaleName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="baalePhone">Baale Contact Phone</Label>
              <Input
                id="baalePhone"
                {...register("baalePhone")}
                placeholder="080XXXXXXXX"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="estimatedHouseholds">Estimated Number of Buildings / Households</Label>
              <Input
                id="estimatedHouseholds"
                type="number"
                {...register("estimatedHouseholds")}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Projects & Focus */}
      {currentStepIndex === 1 && (
        <div className="space-y-4 text-xs">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Security, Infrastructure & Development Priorities
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Specify the community security architecture, utilities, and development roadmap.
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="primarySecurityArrangement">Community Security / Vigilante System *</Label>
              <Controller
                name="primarySecurityArrangement"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="primarySecurityArrangement">
                      <SelectValue placeholder="Select Security Architecture" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ogun State So-Safe Corps / Local Hunters Vigilante">
                        Ogun State So-Safe Corps / Local Hunters Vigilante
                      </SelectItem>
                      <SelectItem value="Nigeria Police Force (Ijebu North East LGA Div) & Community Patrol">
                        Nigeria Police Force (Ijebu North East LGA Div) & Community Patrol
                      </SelectItem>
                      <SelectItem value="Licensed Private Security Guards">
                        Licensed Private Security Guards
                      </SelectItem>
                      <SelectItem value="Amotekun Corps / Joint Vigilante">
                        Amotekun Corps / Joint Vigilante
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.primarySecurityArrangement && (
                <p className="text-xs text-red-500">{errors.primarySecurityArrangement.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="primaryWaterSource">Community Water Infrastructure</Label>
                <Input
                  id="primaryWaterSource"
                  {...register("primaryWaterSource")}
                  placeholder="e.g. Solar powered public boreholes"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="electricityStatus">Electricity / Grid Connection Status</Label>
                <Input
                  id="electricityStatus"
                  {...register("electricityStatus")}
                  placeholder="e.g. IBEDC 33KV line with 300KVA Transformer"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priorityProject1">Priority Community Project #1 *</Label>
              <Input
                id="priorityProject1"
                {...register("priorityProject1")}
                placeholder="e.g. Culvert construction across Main Stream"
                disabled={isSubmitting}
              />
              {errors.priorityProject1 && (
                <p className="text-xs text-red-500">{errors.priorityProject1.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priorityProject2">Priority Community Project #2</Label>
              <Input
                id="priorityProject2"
                {...register("priorityProject2")}
                placeholder="e.g. Street numbering and solar street lighting"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Officers & Street Zones */}
      {currentStepIndex === 2 && (
        <div className="space-y-6">
          {/* Officers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Shield className="w-4 h-4" /> CDA Executive Committee
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  CDA Chairman, Secretary, Treasurer, and CSO details are required by Ijebu North East LGA Community Dev Dept.
                </p>
              </div>
              <Button
                type="button"
                onClick={addOfficer}
                size="sm"
                variant="outline"
                className="text-xs gap-1 h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Executive
              </Button>
            </div>

            <div className="space-y-3">
              {officerFields.map((field, index) => (
                <div
                  key={field.id}
                  className="border rounded-xl p-4 bg-muted/20 space-y-3 shadow-2xs text-xs"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-semibold">
                        Officer #{index + 1}
                      </Badge>
                      <span className="font-bold text-xs text-foreground">
                        {formValues.officers?.[index]?.role || "Executive Member"}
                      </span>
                    </div>
                    {officerFields.length > 4 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOfficer(index)}
                        className="h-7 text-xs text-red-600 hover:text-red-700 px-2"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Executive Designation *</Label>
                      <Input
                        {...register(`officers.${index}.role`)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Full Name *</Label>
                      <Input
                        {...register(`officers.${index}.fullName`)}
                        placeholder="Legal Full Name"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Phone Number *</Label>
                      <Input
                        {...register(`officers.${index}.phone`)}
                        placeholder="080XXXXXXXX"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        {...register(`officers.${index}.email`)}
                        placeholder="officer@domain.com"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>National ID (NIN)</Label>
                      <Input
                        {...register(`officers.${index}.nin`)}
                        placeholder="11-digit NIN"
                        maxLength={11}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streets */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Street / Zone Registry
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record all streets/zones within this CDA boundary.
                </p>
              </div>
              <Button
                type="button"
                onClick={addStreet}
                size="sm"
                variant="outline"
                className="text-xs gap-1 h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Street Zone
              </Button>
            </div>

            <div className="space-y-2.5">
              {streetFields.map((field, index) => (
                <div
                  key={field.id}
                  className="border rounded-lg p-3 bg-muted/10 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs"
                >
                  <div className="sm:col-span-4">
                    <Input
                      {...register(`streets.${index}.streetName`)}
                      placeholder="Street / Close Name"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      {...register(`streets.${index}.estimatedHouses`)}
                      placeholder="Est. Houses"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      {...register(`streets.${index}.zoneLeader`)}
                      placeholder="Zone Leader Name"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      {...register(`streets.${index}.leaderPhone`)}
                      placeholder="Leader Phone"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    {streetFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStreet(index)}
                        className="h-7 w-7 text-red-600 hover:text-red-700"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Documents */}
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
          applicant={applicant}
          sections={reviewSections}
          repeatableSections={reviewRepeatables}
          documents={DOCUMENTS}
          uploadedFiles={uploadedFiles}
          declarationChecked={declaration}
          onDeclarationChange={setDeclaration}
          declarationText="We, the principal executive officers of this Community Development Association, swear that the bounds, officers, streets, and resolution submitted represent the collective decision of our residents. We pledge cooperation with Ijebu North East Local Government Authority for peace, security, and orderly development."
        />
      )}
    </FormWizard>
  );
}
