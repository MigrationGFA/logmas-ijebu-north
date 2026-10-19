"use client";

import React, { useState } from "react";
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
  getConfiguredFeeForService,
} from "@/config/lgaServices";
import { FormWizard, FormStep } from "./FormWizard";
import {
  DocumentUploadStep,
  DocumentSpec,
  UploadedFileMeta,
} from "./DocumentUploadStep";
import { ReviewSubmitStep, ReviewSection } from "./ReviewSubmitStep";
import {
  ApplicantSelectionStep,
  ApplicantSnapshot,
} from "../ApplicantSelectionStep";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const WARDS = LGA_CONFIG.wards.map((ward) => ward.name);

export const certificateOfOriginSchema = z.object({
  fullName: z.string().min(2, "Full legal name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(5, "Residential address must be at least 5 characters"),
  ward: z.string().min(1, "Ward selection is required"),
  nin: z.string().optional(),
  cacNumber: z.string().optional(),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  occupation: z.string().optional(),
  fatherName: z.string().min(2, "Father's name is required"),
  fatherCompound: z.string().min(2, "Father's compound is required"),
  fatherVillage: z.string().optional(),
  motherName: z.string().min(2, "Mother's name is required"),
  motherCompound: z.string().min(2, "Mother's compound is required"),
  motherVillage: z.string().optional(),
  familyBaale: z.string().optional(),
  purpose: z.string().min(1, "Purpose of application is required"),
  previousApplication: z.string().optional(),
});

export type CertificateOfOriginFormData = z.infer<typeof certificateOfOriginSchema>;

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

const STEPS: FormStep[] = [
  {
    id: "applicant_info",
    title: "Applicant & Identity Information",
    shortTitle: "Applicant Info",
    description:
      "Provide personal contact details and the LGA ward residency details.",
  },
  {
    id: "lineage_info",
    title: "Ancestral Lineage & Compounds",
    shortTitle: "Lineage & Roots",
    description:
      "Provide ancestral family compound, village, and traditional lineage information.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description:
      "Upload statutory proof of identity, lineage, and Baale identification letter.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description:
      "Verify all details, sign statutory declaration, and proceed to submission.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "passport_photo",
    label: "Passport Photograph",
    description: "Recent color passport photograph (clear background).",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png",
  },
  {
    id: "nin_slip",
    label: "NIN Slip / National ID",
    description:
      "Official National Identity Management Commission (NIMC) slip or card.",
    required: true,
  },
  {
    id: "proof_of_residency",
    label: "Proof of Residency",
    description:
      "Utility bill, tenancy agreement, or official letter confirming residency in the LGA.",
    required: true,
  },
];

export default function CertificateOfOriginForm({
  service,
  onSubmit,
  isSubmitting = false,
  mode = "citizen",
  initialApplicant,
}: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedFileMeta>
  >({});
  const [declaration, setDeclaration] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm<CertificateOfOriginFormData>({
    resolver: zodResolver(certificateOfOriginSchema),
    defaultValues: {
      fullName: initialApplicant?.fullName || "",
      phone: initialApplicant?.phone || "",
      email: initialApplicant?.email || "",
      address: initialApplicant?.address || "",
      ward: initialApplicant?.ward ?? WARDS[0] ?? "the LGA",
      nin: initialApplicant?.nin ?? "",
      cacNumber: initialApplicant?.cacNumber ?? "",
      dob: "",
      gender: "Male",
      maritalStatus: "Single",
      occupation: "",
      fatherName: "",
      fatherCompound: "",
      fatherVillage: "",
      motherName: "",
      motherCompound: "",
      motherVillage: "",
      familyBaale: "",
      purpose: "Employment / NYSC / Admission",
      previousApplication: "No",
    },
    mode: "onChange",
  });

  const formValues = watch();

  const handleFileUpload = (
    docId: string,
    meta: UploadedFileMeta | string,
    actualFile?: File,
  ) => {
    if (typeof meta === "string") {
      setUploadedFiles((prev) => ({
        ...prev,
        [docId]: { name: meta, file: actualFile },
      }));
    } else {
      setUploadedFiles((prev) => ({
        ...prev,
        [docId]: meta,
      }));
    }
  };

  const handleFileRemove = (docId: string) => {
    setUploadedFiles((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
  };

  const validateStep = (index: number): boolean => {
    if (index === 0) {
      return (
        !!formValues.fullName?.trim() &&
        !!formValues.phone?.trim() &&
        !!formValues.address?.trim() &&
        !!formValues.ward &&
        !!formValues.dob
      );
    }
    if (index === 1) {
      return (
        !!formValues.fatherName?.trim() &&
        !!formValues.fatherCompound?.trim() &&
        !!formValues.motherName?.trim() &&
        !!formValues.motherCompound?.trim() &&
        !!formValues.purpose
      );
    }
    if (index === 2) {
      const missing = DOCUMENTS.filter(
        (d) => d.required && !uploadedFiles[d.id],
      );
      return missing.length === 0;
    }
    if (index === 3) {
      return declaration;
    }
    return true;
  };

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStepIndex);
    const isStepValid = await trigger(fieldsToValidate as any);

    if (isStepValid && validateStep(currentStepIndex)) {
      setCurrentStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1));
    }
  };

  const getFieldsForStep = (stepIndex: number): string[] => {
    switch (stepIndex) {
      case 0:
        return [
          "fullName",
          "phone",
          "address",
          "ward",
          "dob",
          "gender",
          "maritalStatus",
          "occupation",
        ];
      case 1:
        return [
          "fatherName",
          "fatherCompound",
          "motherName",
          "motherCompound",
          "purpose",
        ];
      default:
        return [];
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const onFormSubmit = async (data: CertificateOfOriginFormData) => {
    if (!declaration) return;

    setIsLoading(true);
    try {
      // Collect actual files mapped by machine-readable requirement keys
      const filesPayload: Record<string, any> = {};
      Object.entries(uploadedFiles).forEach(([k, meta]) => {
        if (meta.file) {
          filesPayload[k] = meta.file;
        } else {
          filesPayload[k] = { name: meta.name };
        }
      });

      await onSubmit({
        // applicant here is metadata only  -  used to resolve the applicantId
        // relation on Application. It is NOT persisted as its own JSON blob.
        applicant: {
          applicantId: initialApplicant?.applicantId || null,
          isRegistered: !!initialApplicant?.applicantId,
        },
        // Everything the schema doesn't give its own column for  -  including
        // applicant identity fields  -  belongs in formData, since Application
        // only has applicantId (relation) + formData (Json).
        formData: {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          address: data.address,
          ward: data.ward,
          nin: data.nin,
          cacNumber: data.cacNumber,
          dob: data.dob,
          gender: data.gender,
          maritalStatus: data.maritalStatus,
          occupation: data.occupation,
          fatherName: data.fatherName,
          fatherCompound: data.fatherCompound,
          fatherVillage: data.fatherVillage,
          motherName: data.motherName,
          motherCompound: data.motherCompound,
          motherVillage: data.motherVillage,
          familyBaale: data.familyBaale,
          purpose: data.purpose,
          previousApplication: data.previousApplication,
        },
        files: filesPayload,
      });
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentFee = service.feeConfig?.amount
    ? parseFloat(service.feeConfig.amount)
    : 0;

  const reviewSections: ReviewSection[] = [
    {
      title: "Personal Demographics & Identity",
      items: [
        { label: "Full Legal Name", value: formValues.fullName || "N/A" },
        { label: "Date of Birth", value: formValues.dob || "N/A" },
        { label: "Gender", value: formValues.gender || "N/A" },
        { label: "Marital Status", value: formValues.maritalStatus || "N/A" },
        {
          label: "Occupation / Profession",
          value: formValues.occupation || "N/A",
        },
        { label: "National ID (NIN)", value: formValues.nin || "Not Provided" },
      ],
    },
    {
      title: "Contact & Ward Residency",
      items: [
        { label: "Phone Number", value: formValues.phone || "N/A" },
        { label: "Email Address", value: formValues.email || "N/A" },
        {
          label: "Ward of Origin in the LGA",
          value: `${formValues.ward || "N/A"} Ward`,
        },
        { label: "Residential Address", value: formValues.address || "N/A" },
      ],
    },
    {
      title: "Ancestral & Traditional Lineage",
      items: [
        { label: "Father's Name", value: formValues.fatherName || "N/A" },
        {
          label: "Father's Compound (Agbo-Ile)",
          value: formValues.fatherCompound || "N/A",
        },
        {
          label: "Father's Ancestral Village",
          value: formValues.fatherVillage || "the LGA",
        },
        {
          label: "Mother's Maiden Name",
          value: formValues.motherName || "N/A",
        },
        {
          label: "Mother's Compound",
          value: formValues.motherCompound || "N/A",
        },
        {
          label: "Mother's Ancestral Village",
          value: formValues.motherVillage || "the LGA",
        },
        {
          label: "Quarter Chief / Baale Title",
          value: formValues.familyBaale || "N/A",
        },
        { label: "Purpose of Certificate", value: formValues.purpose || "N/A" },
      ],
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">
          Submitting your application...
        </p>
      </div>
    );
  }

  return (
    <FormWizard
      service={service}
      steps={STEPS}
      currentStepIndex={currentStepIndex}
      onStepChange={setCurrentStepIndex}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit(onFormSubmit)}
      isSubmitting={isSubmitting || isLoading}
      isStepValid={validateStep(currentStepIndex)}
      currentFee={currentFee}
      submitDisabled={!declaration}
      submitLabel="Submit Certificate Application"
    >
      {/* STEP 1: Applicant & Identity Info */}
      {currentStepIndex === 0 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">
                  Full Legal Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                  placeholder="Enter your full legal name"
                  disabled={isSubmitting}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9]{10,15}$/,
                      message: "Invalid phone number",
                    },
                  })}
                  placeholder="08012345678"
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
                  {...register("email", {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ward">
                  Ward <span className="text-red-500">*</span>
                </Label>
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
                  {    WARDS.map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          {ward}
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">
                Residential Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                {...register("address", {
                  required: "Address is required",
                  minLength: {
                    value: 5,
                    message: "Address must be at least 5 characters",
                  },
                })}
                placeholder="Enter your full residential address"
                disabled={isSubmitting}
              />
              {errors.address && (
                <p className="text-xs text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nin">National ID (NIN)</Label>
                <Input
                  id="nin"
                  {...register("nin", {
                    pattern: {
                      value: /^[0-9]{11}$/,
                      message: "NIN must be 11 digits",
                    },
                  })}
                  placeholder="Enter NIN (11 digits)"
                  disabled={isSubmitting}
                />
                {errors.nin && (
                  <p className="text-xs text-red-500">{errors.nin.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cacNumber">CAC Registration Number</Label>
                <Input
                  id="cacNumber"
                  {...register("cacNumber")}
                  placeholder="Enter CAC number (if applicable)"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h5 className="font-bold text-xs uppercase tracking-wider text-primary">
              Personal Demographics
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="dob">
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dob"
                  type="date"
                  {...register("dob", {
                    required: "Date of birth is required",
                  })}
                  disabled={isSubmitting}
                />
                {errors.dob && (
                  <p className="text-xs text-red-500">{errors.dob.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender">Gender *</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Controller
                  name="maritalStatus"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="maritalStatus">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="occupation">Occupation / Profession</Label>
                <Input
                  id="occupation"
                  {...register("occupation")}
                  placeholder="e.g. Civil Servant, Student, Trader, Engineer"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Lineage Info */}
      {currentStepIndex === 1 && (
        <div className="space-y-5">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Ancestral Lineage & Compounds
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              the LGA verification officers cross-examine parental compound
              names with Traditional Council records.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
              <h5 className="font-bold text-xs text-foreground uppercase tracking-wide">
                Paternal Ancestral Lineage (Father&apos;s Side)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fatherName">
                    Father&apos;s Full Name{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fatherName"
                    {...register("fatherName", {
                      required: "Father's name is required",
                    })}
                    placeholder="Father's full name"
                    disabled={isSubmitting}
                  />
                  {errors.fatherName && (
                    <p className="text-xs text-red-500">
                      {errors.fatherName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatherCompound">
                    Father&apos;s Compound / Agbo-Ile{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fatherCompound"
                    {...register("fatherCompound", {
                      required: "Father's compound is required",
                    })}
                    placeholder="e.g. Agbo Compound, the LGA"
                    disabled={isSubmitting}
                  />
                  {errors.fatherCompound && (
                    <p className="text-xs text-red-500">
                      {errors.fatherCompound.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatherVillage">
                    Ancestral Village / Quarter
                  </Label>
                  <Input
                    id="fatherVillage"
                    {...register("fatherVillage")}
                    placeholder="e.g. Olodo, Obantoko, Ilugun"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
              <h5 className="font-bold text-xs text-foreground uppercase tracking-wide">
                Maternal Ancestral Lineage (Mother&apos;s Side)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="motherName">
                    Mother&apos;s Maiden Name{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="motherName"
                    {...register("motherName", {
                      required: "Mother's name is required",
                    })}
                    placeholder="Mother's maiden name"
                    disabled={isSubmitting}
                  />
                  {errors.motherName && (
                    <p className="text-xs text-red-500">
                      {errors.motherName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="motherCompound">
                    Mother&apos;s Compound{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="motherCompound"
                    {...register("motherCompound", {
                      required: "Mother's compound is required",
                    })}
                    placeholder="e.g. Alagbagba Compound"
                    disabled={isSubmitting}
                  />
                  {errors.motherCompound && (
                    <p className="text-xs text-red-500">
                      {errors.motherCompound.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="motherVillage">
                    Ancestral Village / Quarter
                  </Label>
                  <Input
                    id="motherVillage"
                    {...register("motherVillage")}
                    placeholder="e.g. Osiele, Itesi"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="familyBaale">
                  Family Baale / Quarter Chief Title & Name
                </Label>
                <Input
                  id="familyBaale"
                  {...register("familyBaale")}
                  placeholder="e.g. Baale Adeyemi of Camp"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purpose">
                  Purpose of Application <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="purpose"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="purpose">
                        <SelectValue placeholder="Select Purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employment / NYSC / Admission">
                          Employment / NYSC / Admission
                        </SelectItem>
                        <SelectItem value="Military / Police Recruitment">
                          Military / Police Recruitment
                        </SelectItem>
                        <SelectItem value="Scholarship / Bursary">
                          Scholarship / Bursary
                        </SelectItem>
                        <SelectItem value="Visa / International Travel">
                          Visa / International Travel
                        </SelectItem>
                        <SelectItem value="Political / Public Office">
                          Political / Public Office
                        </SelectItem>
                        <SelectItem value="General Identification">
                          General Identification
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.purpose && (
                  <p className="text-xs text-red-500">
                    {errors.purpose.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Documents Upload */}
      {currentStepIndex === 2 && (
        <DocumentUploadStep
          documents={DOCUMENTS}
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
          serviceName={service.name}
          disabled={isSubmitting}
        />
      )}

      {/* STEP 4: Review & Submit */}
      {currentStepIndex === 3 && (
        <ReviewSubmitStep
          serviceName={service.name}
          revenueHead={service.revenueHead}
          feeAmount={currentFee}
          applicant={{
            fullName: formValues.fullName,
            phone: formValues.phone,
            email: formValues.email,
            address: formValues.address,
            ward: formValues.ward,
            nin: formValues.nin,
            cacNumber: formValues.cacNumber,
            applicantId: initialApplicant?.applicantId || null,
            isRegistered: !!initialApplicant?.applicantId,
          }}
          sections={reviewSections}
          documents={DOCUMENTS}
          uploadedFiles={uploadedFiles}
          declarationChecked={declaration}
          onDeclarationChange={setDeclaration}
          declarationText="I solemnly declare that I am a bonafide indigene of the Local Government, Ogun State, and that all personal, parental, and compound lineage details provided in this statutory application are authentic and true. I understand that fraudulent claims carry legal consequences under the laws of Ogun State."
        />
      )}
    </FormWizard>
  );
}

