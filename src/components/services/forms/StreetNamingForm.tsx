"use client";
import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { LGA_CONFIG } from "@/config/lga.config";
import { ServiceType } from "@/config/lgaServices";
import { FormWizard, FormStep } from "./FormWizard";
import { DocumentUploadStep, DocumentSpec } from "./DocumentUploadStep";
import {
  ReviewSubmitStep,
  ReviewSection,
  ReviewRepeatableSection,
} from "./ReviewSubmitStep";
import { Plus, Trash2, MapPin, Building, Users } from "lucide-react";
import { ApplicantSnapshot } from "../ApplicantSelectionStep";
import { formatAndValidateNigerianPhoneNumber } from "@/lib/helper";

const WARDS = LGA_CONFIG.wards.map((ward) => ward.name);

interface Props {
  service: ServiceType;
  onSubmit: (payload: {
    applicant: ApplicantSnapshot;
    formData: Record<string, any>;
    files: Record<string, any>;
  }) => void;
  isSubmitting?: boolean;
  initialApplicant?: ApplicantSnapshot;
}

const propertyNumberingSchema = z.object({
  plotHouseNumber: z.string().min(1, "House number is required"),
  buildingType: z.string().default("Residential Building"),
  ownerName: z.string().default(""),
  ownerPhone: z.string().default(""),
});

const signpostSpecSchema = z.object({
  junctionLocation: z.string().default(""),
  postType: z.string().default("Reflective Steel Pole"),
  quantity: z.string().default("1"),
});

const elderEndorsementSchema = z.object({
  elderName: z.string().default(""),
  titleRole: z.string().default("Community Elder / Executive"),
  phone: z.string().default(""),
});

const streetNamingSchema = z.object({
  applicantName: z.string().min(1, "Sponsoring body / applicant name is required"),
  applicantType: z.string().min(1, "Applicant category is required"),
  contactPerson: z.string().min(1, "Lead representative name is required"),
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
  address: z.string().min(1, "Applicant address is required"),
  ward: z.string().min(1, "Ward is required"),
  proposedStreetName: z.string().min(1, "Proposed primary street name is required"),
  alternativeStreetName: z.string().optional(),
  streetLength: z.string().default(""),
  justification: z.string().min(1, "Historical/civic justification is required"),
  cdaEndorsement: z.string().default(""),
  properties: z.array(propertyNumberingSchema).min(1, "At least one property must be listed"),
  signposts: z.array(signpostSpecSchema),
  elders: z.array(elderEndorsementSchema),
});

type StreetNamingFormValues = z.infer<typeof streetNamingSchema>;

const STEPS: FormStep[] = [
  {
    id: "applicant_sponsor",
    title: "Applicant & Sponsor Identity",
    shortTitle: "Applicant Identity",
    description:
      "Enter sponsoring CDA, family representative, or estate developer details.",
  },
  {
    id: "street_justification",
    title: "Street Nomenclature & Historical Justification",
    shortTitle: "Street Name & Justification",
    description:
      "Provide proposed street nomenclature, alternative names, route length, and public significance.",
  },
  {
    id: "properties_signposts_elders",
    title: "Properties Schedule, Signposts & Endorsements",
    shortTitle: "Properties & Plaque",
    description:
      "Itemize consecutive property numbers, reflective signposts, and community elder signatories.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description:
      "Upload cadastral survey layout, CDA resolution minutes, and Baale's endorsement letter.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description:
      "Review street naming proposal and submit for the LGA Statutory Gazette approval.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "survey_layout_plan",
    label: "Approved Cadastral Survey / Street Layout Plan",
    description:
      "Survey plan showing exact street coordinates, junctions, connecting roads, and plot layout.",
    required: true,
  },
  {
    id: "cda_resolution",
    label: "CDA General Meeting Resolution / Minutes",
    description:
      "Signed minutes of the community meeting approving the proposed street naming.",
    required: true,
  },
  {
    id: "traditional_ruler_letter",
    label: "Traditional Ruler / Baale Endorsement Letter",
    description:
      "Letter from the recognized Baale, Kabiyesi, or Village Head supporting the nomenclature.",
    required: true,
  },
  {
    id: "applicant_id",
    label: "Applicant / Sponsor Means of ID",
    description:
      "National ID Card (NIN), Voter's Card, or International Passport.",
    required: true,
  },
];

export default function StreetNamingForm({
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
  } = useForm<StreetNamingFormValues>({
    resolver: zodResolver(streetNamingSchema),
    defaultValues: {
      applicantName: initialApplicant?.companyName || initialApplicant?.name || "",
      applicantType: "Community Development Association (CDA)",
      contactPerson: initialApplicant?.name || "",
      phone: initialApplicant?.phone || "",
      email: initialApplicant?.email || "",
      address: initialApplicant?.address || "",
      ward: initialApplicant?.ward || WARDS[0] || "the LGA",
      proposedStreetName: "",
      alternativeStreetName: "",
      streetLength: "",
      justification: "",
      cdaEndorsement: "",
      properties: [
        {
          plotHouseNumber: "",
          buildingType: "Detached 4-Bedroom Bungalow",
          ownerName: "",
          ownerPhone: "",
        },
      ],
      signposts: [
        {
          junctionLocation: "",
          postType: "Galvanized Steel Pole with Reflective Aluminum Blade",
          quantity: "1",
        },
      ],
      elders: [
        {
          elderName: "",
          titleRole: "Community Elder / Executive",
          phone: "",
        },
      ],
    },
    mode: "onChange",
  });

  const {
    fields: propertyFields,
    append: appendProperty,
    remove: removeProperty,
  } = useFieldArray({
    control,
    name: "properties",
  });

  const {
    fields: signpostFields,
    append: appendSignpost,
    remove: removeSignpost,
  } = useFieldArray({
    control,
    name: "signposts",
  });

  const {
    fields: elderFields,
    append: appendElder,
    remove: removeElder,
  } = useFieldArray({
    control,
    name: "elders",
  });

  useEffect(() => {
    if (initialApplicant) {
      if (initialApplicant.companyName) {
        setValue("applicantName", initialApplicant.companyName);
      } else if (initialApplicant.name) {
        setValue("applicantName", initialApplicant.name);
      }
      if (initialApplicant.name) setValue("contactPerson", initialApplicant.name);
      if (initialApplicant.phone) setValue("phone", initialApplicant.phone);
      if (initialApplicant.email) setValue("email", initialApplicant.email);
      if (initialApplicant.address) setValue("address", initialApplicant.address);
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
        "applicantName",
        "applicantType",
        "contactPerson",
        "phone",
        "email",
        "address",
        "ward",
      ]);
    }
    if (index === 1) {
      return await trigger([
        "proposedStreetName",
        "alternativeStreetName",
        "streetLength",
        "justification",
        "cdaEndorsement",
      ]);
    }
    if (index === 2) {
      return await trigger(["properties", "signposts", "elders"]);
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

  const currentFee = service.feeConfig.amount;

  const onFormSubmit = (data: StreetNamingFormValues) => {
    if (!declaration) return;

    onSubmit({
      formData: {
        ...data,
        properties: data.properties.filter((p) => p.plotHouseNumber.trim()),
        signposts: data.signposts.filter((s) => s.junctionLocation.trim()),
        elders: data.elders.filter((el) => el.elderName.trim()),
      },
      files: uploadedFiles,
      applicant: initialApplicant || null,
    });
  };

  const reviewSections: ReviewSection[] = [
    {
      title: "Applicant & Sponsoring Entity",
      items: [
        { label: "Sponsoring Body Name", value: formValues.applicantName },
        { label: "Applicant Category", value: formValues.applicantType },
        { label: "Lead Representative", value: formValues.contactPerson },
        { label: "Contact Phone Number", value: formValues.phone },
        { label: "Email Address", value: formValues.email || "N/A" },
        { label: "Physical Address", value: formValues.address },
        { label: "Ward in the LGA", value: formValues.ward },
      ],
    },
    {
      title: "Street Nomenclature & Public Justification",
      items: [
        {
          label: "Proposed Primary Street Name",
          value: formValues.proposedStreetName,
        },
        {
          label: "Alternative Backup Name",
          value: formValues.alternativeStreetName || "N/A",
        },
        {
          label: "Estimated Street Route Length",
          value: formValues.streetLength,
        },
        {
          label: "Historical / Civic Justification",
          value: formValues.justification,
        },
        { label: "Community Consensus", value: formValues.cdaEndorsement },
      ],
    },
  ];

  const reviewRepeatableSections: ReviewRepeatableSection[] = [
    {
      title: "Properties & House Numbering Schedule",
      countLabel: "Properties Numbered",
      items: (formValues.properties || [])
        .filter((p) => p.plotHouseNumber?.trim())
        .map((p) => ({
          "Assigned House Number": p.plotHouseNumber,
          "Building Type": p.buildingType || "N/A",
          "Property Owner": p.ownerName || "N/A",
          "Owner Contact Phone": p.ownerPhone || "N/A",
        })),
    },
    {
      title: "Reflective Signpost / Plaque Installation",
      countLabel: "Signposts",
      items: (formValues.signposts || [])
        .filter((s) => s.junctionLocation?.trim())
        .map((s) => ({
          "Junction / Location": s.junctionLocation,
          "Plaque Hardware Specification": s.postType || "N/A",
          Quantity: `${s.quantity} Units`,
        })),
    },
    {
      title: "Community Elders & Baale Endorsements",
      countLabel: "Signatories",
      items: (formValues.elders || [])
        .filter((el) => el.elderName?.trim())
        .map((el) => ({
          "Elder / Signatory Name": el.elderName,
          "Title / Traditional Office": el.titleRole || "N/A",
          "Phone Number": el.phone || "N/A",
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
        !formValues.applicantName ||
        !formValues.contactPerson ||
        !formValues.phone ||
        !formValues.address ||
        !formValues.ward ||
        !formValues.proposedStreetName ||
        !formValues.justification ||
        propertyFields.length === 0
      }
    >
      {/* STEP 1: Applicant & Sponsor */}
      {currentStepIndex === 0 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Applicant & Sponsor Identity
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter sponsoring CDA, family council, or estate developer details
              for statutory street naming in the LGA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="applicantName">
                Sponsoring Body / Applicant Name *
              </Label>
              <Input
                id="applicantName"
                {...register("applicantName")}
                placeholder="e.g. Obantoko Peace Community Development Association (CDA)"
              />
              {errors.applicantName && (
                <p className="text-xs text-red-500">{errors.applicantName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="applicantType">Applicant Category *</Label>
              <Controller
                control={control}
                name="applicantType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="applicantType">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Community Development Association (CDA)">
                        Community Development Association (CDA)
                      </SelectItem>
                      <SelectItem value="Private Residential Estate Developer">
                        Private Residential Estate Developer
                      </SelectItem>
                      <SelectItem value="Family / Descendants Heritage Council">
                        Family / Descendants Heritage Council
                      </SelectItem>
                      <SelectItem value="Corporate / Institutional Sponsor">
                        Corporate / Institutional Sponsor
                      </SelectItem>
                      <SelectItem value="Individual Philanthropist / Sponsor">
                        Individual Philanthropist / Sponsor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.applicantType && (
                <p className="text-xs text-red-500">{errors.applicantType.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPerson">
                Lead Representative / Chairman *
              </Label>
              <Input
                id="contactPerson"
                {...register("contactPerson")}
                placeholder="e.g. Elder David Ojo"
              />
              {errors.contactPerson && (
                <p className="text-xs text-red-500">{errors.contactPerson.message}</p>
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
                placeholder="cda@example.com"
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

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address">Applicant / Secretariat Address *</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Secretariat or residential address in the LGA"
              />
              {errors.address && (
                <p className="text-xs text-red-500">{errors.address.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Street Name & Justification */}
      {currentStepIndex === 1 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Street Nomenclature & Historical Justification
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Specify proposed street name, alternative choice, estimated road
              length, and historical justification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="proposedStreetName">
                Proposed Primary Street Name *
              </Label>
              <Input
                id="proposedStreetName"
                {...register("proposedStreetName")}
                placeholder="e.g. Chief Obafemi Awolowo Crescent"
                className="font-semibold"
              />
              {errors.proposedStreetName && (
                <p className="text-xs text-red-500">{errors.proposedStreetName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="alternativeStreetName">
                Alternative Backup Street Name
              </Label>
              <Input
                id="alternativeStreetName"
                {...register("alternativeStreetName")}
                placeholder="e.g. Unity Crescent"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="streetLength">
                Estimated Street Length (Metres / Km)
              </Label>
              <Input
                id="streetLength"
                {...register("streetLength")}
                placeholder="e.g. 750 Metres"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cdaEndorsement">Community Consensus Status</Label>
              <Input
                id="cdaEndorsement"
                {...register("cdaEndorsement")}
                placeholder="e.g. Unanimously ratified at general congress"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="justification">
                Historical / Civic Justification *
              </Label>
              <Textarea
                id="justification"
                rows={3}
                {...register("justification")}
                placeholder="Provide biographical or civic background justifying the honour of naming this public thoroughfare..."
              />
              {errors.justification && (
                <p className="text-xs text-red-500">{errors.justification.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Properties, Signposts & Elders (REPEATABLE UI) */}
      {currentStepIndex === 2 && (
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Properties Schedule, Signposts & Endorsements
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Itemize all properties and buildings along the street for
              numbering, plus signpost specifications.
            </p>
          </div>

          {/* REPEATABLE SECTION: Properties */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-primary" /> Properties &
                  House Numbering Schedule *
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record all consecutive plots and houses along the street
                  corridor.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendProperty({
                    plotHouseNumber: `No. ${propertyFields.length + 1}`,
                    buildingType: "Residential Building",
                    ownerName: "",
                    ownerPhone: "",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Property
              </Button>
            </div>

            {propertyFields.map((fieldItem, idx) => (
              <div
                key={fieldItem.id}
                className="bg-muted/10 border rounded-xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-xs text-foreground">
                    Property #{idx + 1}: {formValues.properties?.[idx]?.plotHouseNumber || "New Property"} (
                    {formValues.properties?.[idx]?.buildingType || "Residential"})
                  </span>
                  {propertyFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProperty(idx)}
                      className="text-red-500 hover:text-red-700 h-7 px-2 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Assigned House No *</Label>
                    <Input
                      {...register(`properties.${idx}.plotHouseNumber`)}
                      placeholder="e.g. No. 1 / Plot 14"
                      className="font-bold"
                    />
                    {errors.properties?.[idx]?.plotHouseNumber && (
                      <p className="text-xs text-red-500">
                        {errors.properties[idx]?.plotHouseNumber?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Building Typology</Label>
                    <Input
                      {...register(`properties.${idx}.buildingType`)}
                      placeholder="e.g. Bungalow / 4-Flat Block"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Landlord / Owner Name</Label>
                    <Input
                      {...register(`properties.${idx}.ownerName`)}
                      placeholder="Landlord Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Owner Phone</Label>
                    <Input
                      {...register(`properties.${idx}.ownerPhone`)}
                      placeholder="080..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* REPEATABLE SECTION: Signposts */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" /> Reflective
                  Signposts & Plaque Specifications
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record junction locations and hardware specifications for
                  street nameplates.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendSignpost({
                    junctionLocation: "",
                    postType: "Reflective Steel Pole",
                    quantity: "1",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Signpost
              </Button>
            </div>

            <div className="space-y-2.5">
              {signpostFields.map((fieldItem, idx) => (
                <div
                  key={fieldItem.id}
                  className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">
                      Junction / Intersection Location
                    </Label>
                    <Input
                      {...register(`signposts.${idx}.junctionLocation`)}
                      placeholder="e.g. Main Road Entry Junction"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">Plaque Specification</Label>
                    <Input
                      {...register(`signposts.${idx}.postType`)}
                      placeholder="e.g. Reflective Aluminum Blade on Steel Pole"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSignpost(idx)}
                      className="text-red-500 hover:text-red-700 h-8 px-2 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REPEATABLE SECTION: Elders */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> Community Elders &
                  Baale Endorsements
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record endorsing traditional rulers and community council
                  signatories.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendElder({
                    elderName: "",
                    titleRole: "Community Elder / Executive",
                    phone: "",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Endorser
              </Button>
            </div>

            <div className="space-y-2.5">
              {elderFields.map((fieldItem, idx) => (
                <div
                  key={fieldItem.id}
                  className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">
                      Elder / Ruler Full Name
                    </Label>
                    <Input
                      {...register(`elders.${idx}.elderName`)}
                      placeholder="Chief / Elder Name"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Title / Role</Label>
                    <Input
                      {...register(`elders.${idx}.titleRole`)}
                      placeholder="Baale / Chairman"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Phone Number</Label>
                    <Input
                      {...register(`elders.${idx}.phone`)}
                      placeholder="080..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeElder(idx)}
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
          declarationText="I solemnly declare that the street layout plan, property numbering schedule, community endorsements, and historical justification submitted herein represent the authentic consensus of the community and comply with the Local Government Street Naming Bye-laws."
        />
      )}
    </FormWizard>
  );
}

// Default street naming rates (ported from the Ifo implementation).
// Defaults only; each LGA can change these figures.
export const DEFAULT_STREET_NAMING_RATES: Record<string, { naming: number; renewal: number; objection: number; unit: string }> = {
  "Road":      { naming: 200000,  renewal: 200000,  objection: 600000,  unit: "Per road / application" },
  "Street":    { naming: 150000,  renewal: 150000,  objection: 450000,  unit: "Per street / application" },
  "Avenue":    { naming: 150000,  renewal: 150000,  objection: 450000,  unit: "Per avenue / application" },
  "Close":     { naming: 150000,  renewal: 150000,  objection: 450000,  unit: "Per close / application" },
  "Crescent":  { naming: 150000,  renewal: 150000,  objection: 450000,  unit: "Per crescent / application" },
  "Drive":     { naming: 150000,  renewal: 150000,  objection: 450000,  unit: "Per drive / application" },
  "Lane":      { naming: 150000,  renewal: 150000,  objection: 450000,  unit: "Per lane / application" },
  "Way":       { naming: 200000,  renewal: 200000,  objection: 600000,  unit: "Per way / application" },
  "Boulevard": { naming: 150000,  renewal: 150000,  objection: 450000,  unit: "Per boulevard / application" },
  "Bus Stop":  { naming: 1500000, renewal: 1500000, objection: 4500000, unit: "Per bus stop / application" },
};
