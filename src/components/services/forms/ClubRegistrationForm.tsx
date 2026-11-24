"use client";

import React, { useState } from "react";
import type { Resolver } from "react-hook-form";
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
import { useWards } from "@/hooks/queries/useWards";
import { ServiceType, getConfiguredFeeForService } from "@/config/lgaServices";
import { FormWizard, FormStep } from "./FormWizard";
import { DocumentUploadStep, DocumentSpec, UploadedFileMeta } from "./DocumentUploadStep";
import { ReviewSubmitStep, ReviewSection, ReviewRepeatableSection } from "./ReviewSubmitStep";
import { ApplicantSelectionStep, ApplicantSnapshot } from "../ApplicantSelectionStep";
import { Plus, Trash2, User, Users, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";


const officerSchema = z.object({
  role: z.string().min(1, "Role is required"),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().refine((val) => !val || formatAndValidateNigerianPhoneNumber(val).isValid, {
    message: "Valid Nigerian phone number required",
  }),
  email: z.string().email("Valid email required").or(z.literal("")).optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  nin: z.string().optional(),
});

const memberSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  membershipNo: z.string().optional(),
  joinedYear: z.string().optional(),
});

export const clubRegistrationSchema = z.object({
  clubName: z.string().min(2, "Club Name is required"),
  clubAcronym: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  dateFounded: z.string().min(1, "Date Founded is required"),
  secretariatAddress: z.string().min(3, "Secretariat address is required"),
  ward: z.string().min(1, "Ward is required"),
  phone: z.string().refine((val) => formatAndValidateNigerianPhoneNumber(val).isValid, {
    message: "Valid Nigerian phone number is required",
  }),
  email: z.string().email("Valid email required").or(z.literal("")).optional(),
  patronName: z.string().optional(),
  patronPhone: z.string().optional(),
  patronAddress: z.string().optional(),
  primaryAims: z.string().min(5, "Primary aims are required"),
  communityProjects: z.string().optional(),
  meetingFrequency: z.string().min(1, "Meeting frequency is required"),
  meetingVenue: z.string().min(2, "Meeting venue is required"),
  membershipCriteria: z.string().optional(),
  annualDuesAmount: z.coerce.number().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountSignatories: z.string().optional(),
  officers: z.array(officerSchema).min(1, "At least one officer is required"),
  members: z.array(memberSchema).optional(),
});

export type ClubRegistrationFormData = z.infer<typeof clubRegistrationSchema>;

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

interface OfficerRecord {
  role: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  occupation: string;
  nin: string;
}

interface MemberRecord {
  fullName: string;
  phone: string;
  address: string;
  membershipNo?: string;
  joinedYear?: string;
}

const STEPS: FormStep[] = [
  // {
  //   id: "applicant_info",
  //   title: "Lead Applicant & Contact Details",
  //   shortTitle: "Applicant",
  //   description: "Provide contact details for the submitting officer / club representative.",
  // },
  {
    id: "club_profile",
    title: "Club / Association Profile",
    shortTitle: "Club Profile",
    description: "Enter basic club identity, registration category, and secretariat contact details.",
  },
  {
    id: "aims_operations",
    title: "Aims, Objectives & Operations",
    shortTitle: "Aims & Operations",
    description: "Outline the association's core objectives, meeting schedules, and funding sources.",
  },
  {
    id: "executives_members",
    title: "Executive Officers & Members Roster",
    shortTitle: "Officers & Members",
    description: "Provide complete officer details (President, Secretary, Treasurer, Welfare, and other executives) and members list.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description: "Upload club constitution, inaugural minutes, and executive photographs.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description: "Review all club data, officers, roster, and execute statutory declaration.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "club_constitution",
    label: "Club Constitution & By-Laws",
    description: "Copy of the adopted constitution outlining governance, elections, and disciplinary procedures.",
    required: true,
  },
  {
    id: "inaugural_minutes",
    label: "Minutes of Inaugural Meeting",
    description: "Official signed minutes of the meeting where the club was founded/inaugurated.",
    required: true,
  },
  {
    id: "executives_list_signed",
    label: "Signed Executive Council Roster",
    description: "List of executive members with passport photos, contacts, and authentic signatures.",
    required: true,
  },
  {
    id: "president_passport",
    label: "President / Chairman Passport Photo",
    description: "Clear passport photograph of the presiding officer.",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png",
  },
  {
    id: "secretariat_proof",
    label: "Secretariat Utility / Tenancy Proof",
    description: "Proof of address for club physical meeting venue or registered secretariat in the LGA.",
    required: false,
  },
];

export default function ClubRegistrationForm({
  service,
  onSubmit,
  isSubmitting = false,
  mode = "citizen",
  initialApplicant,
}: Props) {
  const { wards } = useWards();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFileMeta>>({});
  const [declaration, setDeclaration] = useState(false);

  const [applicant] = useState<ApplicantSnapshot>(
    initialApplicant || {
      fullName: "",
      phone: "",
      email: "",
      address: "",
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
  } = useForm<ClubRegistrationFormData>({
    resolver: zodResolver(clubRegistrationSchema) as Resolver<ClubRegistrationFormData>,
    defaultValues: {
      clubName: "",
      clubAcronym: "",
      category: "Social & Cultural Club",
      dateFounded: "",
      secretariatAddress: "",
      ward: wards[0]?.name || "the LGA",
      phone: "",
      email: "",
      patronName: "",
      patronPhone: "",
      patronAddress: "",
      primaryAims: "",
      communityProjects: "",
      meetingFrequency: "Monthly",
      meetingVenue: "",
      membershipCriteria: "",
      annualDuesAmount: undefined,
      bankName: "",
      accountNumber: "",
      accountSignatories: "",
      officers: [
        {
          role: "President / Chairman",
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
          role: "Treasurer / Financial Secretary",
          fullName: "",
          phone: "",
          email: "",
          address: "",
          occupation: "",
          nin: "",
        },
      ],
      members: [
        { fullName: "", phone: "", address: "", membershipNo: "", joinedYear: "" },
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
    fields: memberFields,
    append: appendMember,
    remove: removeMember,
  } = useFieldArray({
    control,
    name: "members",
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
      role: "Executive Committee Member",
      fullName: "",
      phone: "",
      email: "",
      address: "",
      occupation: "",
      nin: "",
    });
  };

  const addMember = () => {
    appendMember({
      fullName: "",
      phone: "",
      address: "",
      membershipNo: String((formValues.members?.length || 0) + 1).padStart(3, "0"),
      joinedYear: new Date().getFullYear().toString(),
    });
  };

  const validateStep = async (index: number): Promise<boolean> => {
    if (index === 0) {
      return await trigger(["clubName", "category", "dateFounded", "secretariatAddress", "ward", "phone"]);
    }
    if (index === 1) {
      return await trigger(["primaryAims", "meetingFrequency", "meetingVenue"]);
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

  const onValidSubmit = (data: ClubRegistrationFormData) => {
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
    const cleanMembers = (data.members || []).filter((m) => m.fullName.trim().length > 0);

    const { officers: _rawOfficers, members: _rawMembers, ...rest } = data;

    onSubmit({
      applicant,
      formData: {
        ...rest,
        officers: cleanOfficers,
        members: cleanMembers,
        officerCount: cleanOfficers.length,
        memberCount: cleanMembers.length,
      },
      files: filesPayload,
    });
  };

  const currentFee = service.feeConfig?.amount
    ? parseFloat(service.feeConfig.amount)
    : 0;

  const reviewSections: ReviewSection[] = [
    {
      title: "Club Identity & Secretariat",
      items: [
        { label: "Full Association Name", value: formValues.clubName },
        { label: "Acronym / Short Name", value: formValues.clubAcronym || "N/A" },
        { label: "Registration Category", value: formValues.category },
        { label: "Date Established", value: formValues.dateFounded },
        { label: "Secretariat Address", value: formValues.secretariatAddress },
        { label: "Host Ward", value: `${formValues.ward} Ward` },
        { label: "Official Club Phone", value: formValues.phone },
        { label: "Official Email", value: formValues.email || "N/A" },
      ],
    },
    {
      title: "Governance & Operations",
      items: [
        { label: "Primary Aims & Objectives", value: formValues.primaryAims },
        { label: "Community Dev Projects", value: formValues.communityProjects || "N/A" },
        { label: "Meeting Schedule", value: `${formValues.meetingFrequency} at ${formValues.meetingVenue}` },
        { label: "Grand Patron / Matron", value: formValues.patronName || "N/A" },
        { label: "Annual Dues per Member", value: `₦${Number(formValues.annualDuesAmount || 0).toLocaleString()}` },
        { label: "Bank & Account Info", value: formValues.bankName ? `${formValues.bankName} (${formValues.accountNumber || "N/A"})` : "Under Setup" },
      ],
    },
  ];

  const reviewRepeatables: ReviewRepeatableSection[] = [
    {
      title: "Executive Officers Roster",
      countLabel: "Officers Registered",
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
      title: "General Membership Roster",
      countLabel: "Members Recorded",
      items: (formValues.members || [])
        .filter((m) => m?.fullName?.trim())
        .map((m) => ({
          membershipNo: m.membershipNo || "N/A",
          fullName: m.fullName,
          phone: m.phone || "N/A",
          address: m.address || "the LGA",
          joinedYear: m.joinedYear || "2024",
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
      submitLabel="Submit Club Registration Application"
    >
      {/* STEP 1: Club Profile */}
      {currentStepIndex === 0 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Club / Association Profile
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter the registered name and secretariat contact details for the association.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="clubName">Full Name of Club / Association *</Label>
              <Input
                id="clubName"
                {...register("clubName")}
                placeholder="e.g. the LGA Dynamic Elite Club of Nigeria"
                disabled={isSubmitting}
              />
              {errors.clubName && (
                <p className="text-xs text-red-500">{errors.clubName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clubAcronym">Acronym / Abbreviation</Label>
              <Input
                id="clubAcronym"
                {...register("clubAcronym")}
                placeholder="e.g. ODEC"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Club Classification *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Social & Cultural Club">Social & Cultural Club</SelectItem>
                      <SelectItem value="Youth & Sports Association">Youth & Sports Association</SelectItem>
                      <SelectItem value="Women Empowerment Association">Women Empowerment Association</SelectItem>
                      <SelectItem value="Professional & Trade Association">Professional & Trade Association</SelectItem>
                      <SelectItem value="Charitable & Philanthropic Society">Charitable & Philanthropic Society</SelectItem>
                      <SelectItem value="Academic & Alumni Association">Academic & Alumni Association</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-xs text-red-500">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dateFounded">Date Founded / Inaugurated *</Label>
              <Input
                id="dateFounded"
                type="date"
                {...register("dateFounded")}
                disabled={isSubmitting}
              />
              {errors.dateFounded && (
                <p className="text-xs text-red-500">{errors.dateFounded.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ward">Ward of Secretariat *</Label>
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

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="secretariatAddress">Physical Secretariat Address in the LGA *</Label>
              <Input
                id="secretariatAddress"
                {...register("secretariatAddress")}
                placeholder="Suite / House No, Street name, Quarter, the LGA"
                disabled={isSubmitting}
              />
              {errors.secretariatAddress && (
                <p className="text-xs text-red-500">{errors.secretariatAddress.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Official Secretariat Phone *</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="080XXXXXXXX"
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Official Club Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="contact@club.org"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Aims & Operations */}
      {currentStepIndex === 1 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Aims, Objectives & Financial Operations
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Specify the statutory mission, meeting operations, and bank governance details.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="primaryAims">Primary Aims & Objectives *</Label>
              <Textarea
                id="primaryAims"
                rows={3}
                {...register("primaryAims")}
                placeholder="State the core purposes of the association in the LGA..."
                disabled={isSubmitting}
              />
              {errors.primaryAims && (
                <p className="text-xs text-red-500">{errors.primaryAims.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="communityProjects">Community Development Initiatives (Past / Planned)</Label>
              <Textarea
                id="communityProjects"
                rows={2}
                {...register("communityProjects")}
                placeholder="e.g. Annual scholarship for the LGA youth, grading of community link roads, health outreach..."
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="meetingFrequency">Meeting Frequency *</Label>
                <Controller
                  name="meetingFrequency"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="meetingFrequency">
                        <SelectValue placeholder="Select Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Fortnightly (Bi-weekly)">Fortnightly (Bi-weekly)</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.meetingFrequency && (
                  <p className="text-xs text-red-500">{errors.meetingFrequency.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meetingVenue">Designated Meeting Venue *</Label>
                <Input
                  id="meetingVenue"
                  {...register("meetingVenue")}
                  placeholder="e.g. the LGA Town Hall or Club Secretariat"
                  disabled={isSubmitting}
                />
                {errors.meetingVenue && (
                  <p className="text-xs text-red-500">{errors.meetingVenue.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="patronName">Grand Patron / Matron Name</Label>
                <Input
                  id="patronName"
                  {...register("patronName")}
                  placeholder="Chief / High Chief Patron"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="patronPhone">Patron Phone Contact</Label>
                <Input
                  id="patronPhone"
                  {...register("patronPhone")}
                  placeholder="080XXXXXXXX"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bankName">Official Bankers in Nigeria</Label>
                <Input
                  id="bankName"
                  {...register("bankName")}
                  placeholder="e.g. First Bank of Nigeria / Wema Bank"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="annualDuesAmount">Annual Statutory Dues per Member (₦)</Label>
                <Input
                  id="annualDuesAmount"
                  type="number"
                  {...register("annualDuesAmount")}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Executive Officers & Members */}
      {currentStepIndex === 2 && (
        <div className="space-y-6">
          {/* Officers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Executive Officers Council
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record full details for the President, Secretary, Treasurer, and additional executive officers.
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
                Add Officer
              </Button>
            </div>

            <div className="space-y-3">
              {officerFields.map((field, index) => (
                <div
                  key={field.id}
                  className="border rounded-xl p-4 bg-muted/20 space-y-3 relative transition-all shadow-2xs"
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
                    {officerFields.length > 3 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOfficer(index)}
                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-2"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <Label>Official Designation / Title *</Label>
                      <Input
                        {...register(`officers.${index}.role`)}
                        placeholder="e.g. Welfare Director"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <Label>Full Name *</Label>
                      <Input
                        {...register(`officers.${index}.fullName`)}
                        placeholder="Officer full legal name"
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
                        placeholder="officer@email.com"
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

                    <div className="space-y-1 sm:col-span-2 md:col-span-3">
                      <Label>Residential Address in the LGA / Ogun State</Label>
                      <Input
                        {...register(`officers.${index}.address`)}
                        placeholder="Residential address"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members Roster Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Users className="w-4 h-4" /> Foundation Members List
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record the roster of founding members of the club.
                </p>
              </div>
              <Button
                type="button"
                onClick={addMember}
                size="sm"
                variant="outline"
                className="text-xs gap-1 h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </Button>
            </div>

            <div className="space-y-2.5">
              {memberFields.map((field, index) => (
                <div
                  key={field.id}
                  className="border rounded-lg p-3 bg-muted/10 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs"
                >
                  <div className="sm:col-span-1 font-mono font-bold text-muted-foreground text-center">
                    #{index + 1}
                  </div>
                  <div className="sm:col-span-4">
                    <Input
                      {...register(`members.${index}.fullName`)}
                      placeholder="Member Full Name"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      {...register(`members.${index}.phone`)}
                      placeholder="Phone Number"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      {...register(`members.${index}.address`)}
                      placeholder="Address / Town"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    {memberFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(index)}
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
          declarationText="We, the undersigned executive officers of the club/association, hereby declare under oath that the constitution, aims, officer roster, and credentials presented are genuine and enacted according to law. We pledge adherence to the Community Development bye-laws of the Local Government Authority."
        />
      )}
    </FormWizard>
  );
}
