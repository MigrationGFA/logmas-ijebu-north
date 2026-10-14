"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/queries/useAuth";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { optional, z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  User,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Home,
  Building2,
  CreditCard,
  Upload,
  Loader2,
  ShieldCheck,
  ArrowRight,
  UserCircle,
  FileText,
} from "lucide-react";
import { uploadsService } from "@/services/uploads";
import { FullPageLoader } from "@/components/ProtectedRoute";
import { formatAndValidateNigerianPhoneNumber } from "@/lib/helper";
import { LGA_CONFIG } from "@/config/lga.config";

// Ward options - sourced from LGA_CONFIG
const WARDS = LGA_CONFIG.wards.map((ward) => ward.name);

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const IDENTIFICATION_TYPES = [
  "NIN",
  "Voter's Card",
  "Driver's License",
  "International Passport",
  "Other",
];

// Base schema for common fields
const baseSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Please enter a valid Nigerian phone number"),
  address: z.string().min(1, "Address is required"),
  town: z.string().optional(),
  // town: z.string().min(1, "Town/Community is required"),
  ward: z.string().optional(),
  // ward: z.string().min(1, "Ward is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  emergencyContact: z.string().optional(),
  avatarUrl: z.string().optional(),
});

// Citizen schema
const citizenSchema = baseSchema.extend({
  occupation: z.string().optional(),
  identificationType: z.string().min(1, "Identification type is required"),
  identificationNumber: z.string().min(1, "Identification number is required"),
  nin: z.string().optional(),
  // Business fields (optional for citizens)
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  cacNumber: z.string().optional(),
  taxIdNumber: z.string().optional(),
  ownerRepresentative: z.string().optional(),
});

// Business schema
const businessSchema = baseSchema.extend({
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  ownerRepresentative: z.string().min(1, "Owner/Representative is required"),
  cacNumber: z.string().optional(),
  taxIdNumber: z.string().optional(),
  // Citizen fields (optional for business)
  occupation: z.string().optional(),
  identificationType: z.string().optional(),
  identificationNumber: z.string().optional(),
  nin: z.string().optional(),
});

// Dynamic schema based on role
// Keep the form type aligned with the union of all possible onboarding fields so
// the selected Zod schema can be passed to react-hook-form without type conflicts.
type FormValues = z.infer<typeof baseSchema> & {
  occupation?: string;
  identificationType?: string;
  identificationNumber?: string;
  nin?: string;
  businessName?: string;
  businessType?: string;
  cacNumber?: string;
  taxIdNumber?: string;
  ownerRepresentative?: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const {
    user,
    updateProfileAsync: updateProfile,
    isUpdatingProfile,
    isLoadingUser,
  } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Determine if user is citizen or business owner
  const isCitizen = user?.role === "citizen";
  const isBusinessOwner = user?.role === "business_owner";
  const isCitizenOrBusiness = isCitizen || isBusinessOwner;

  // Get the appropriate schema based on role
  const getSchema = () => {
    if (isCitizen) return citizenSchema;
    if (isBusinessOwner) return businessSchema;
    return baseSchema;
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    setValue,
    getValues,
    trigger,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      town: "",
      ward: "",
      dateOfBirth: "",
      gender: "Male",
      emergencyContact: "",
      avatarUrl: "",
      occupation: "",
      identificationType: "NIN",
      identificationNumber: "",
      nin: "",
      businessName: "",
      businessType: "",
      cacNumber: "",
      taxIdNumber: "",
      ownerRepresentative: "",
    },
    mode: "onChange",
  });

  const watchedFields = watch();

  useEffect(() => {
    // Check if user is authenticated and needs onboarding
    if (!user) {
      router.push("/login");
      return;
    }

    // If onboarding is already completed, redirect to dashboard
    if (user.onboardingCompleted) {
      router.push("/dashboard");
      return;
    }

    // If user is not citizen or business owner, redirect to dashboard
    if (!isCitizenOrBusiness) {
      router.push("/dashboard");
      toast.error(
        "Only citizens and business owners need to complete onboarding.",
      );
      return;
    }

    // Pre-fill existing user data
    if (user) {
      const formFields: Partial<FormValues> = {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        town: user.town || "",
        ward: user.ward?.name || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: user.gender || "",
        occupation: user.occupation || "",
        nin: user.nin || "",
        businessName: user.businessName || "",
        businessType: user.businessType || "",
        cacNumber: user.cacNumber || "",
        taxIdNumber: user.taxIdNumber || "",
        emergencyContact: user.emergencyContact || "",
        identificationType: user.identificationType || "",
        identificationNumber: user.identificationNumber || "",
        ownerRepresentative: user.ownerRepresentative || "",
        avatarUrl: user.avatarUrl || "",
      };

      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      }

      // Set all values
      Object.entries(formFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setValue(key as keyof FormValues, value as any);
        }
      });
    }
  }, [user, router, isCitizenOrBusiness, setValue]);

  const [isUploading, setIsUploading] = useState(false);

  if (isLoadingUser) return <FullPageLoader />;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      e.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadsService.uploadFile(file, "passports");
      setAvatarPreview(result.url);
      setValue("avatarUrl", result.url);
      toast.success("Photo uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload photo",
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const validateStep1 = async () => {
    const fieldsToValidate: (keyof FormValues)[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "town",
      "ward",
      "dateOfBirth",
      "gender",
      "emergencyContact",
    ];

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const validateStep2 = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];

    if (isCitizen) {
      fieldsToValidate = [
        // "occupation",
        "identificationType",
        "identificationNumber",
      ];
    } else if (isBusinessOwner) {
      fieldsToValidate = [
        "businessName",
        "businessType",
        "ownerRepresentative",
      ];
    }

    if (fieldsToValidate.length === 0) return true;

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep1();
    if (isValid) {
      setStep(2);
    } else {
      toast.error("Please fill in all required fields correctly");
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Prepare data for submission based on role
      const profileData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        town: data.town,
        ward: data.ward,
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString()
          : undefined,
        gender: data.gender,
        emergencyContact: data.emergencyContact,
        avatarUrl: data.avatarUrl || avatarPreview,
        onboardingCompleted: true,
      };

      // Add role-specific fields
      if (isCitizen) {
        profileData.occupation = data.occupation;
        profileData.identificationType = data.identificationType;
        profileData.identificationNumber = data.identificationNumber;
        profileData.nin = data.identificationNumber; // Use identification number as NIN if provided
      } else if (isBusinessOwner) {
        profileData.businessName = data.businessName;
        profileData.businessType = data.businessType;
        profileData.ownerRepresentative = data.ownerRepresentative;
        if (data.cacNumber) profileData.cacNumber = data.cacNumber;
        if (data.taxIdNumber) profileData.taxIdNumber = data.taxIdNumber;
      }
      console.log(data, "data");

      await updateProfile(profileData, {
        onSuccess: () => {
          toast.success("Profile completed successfully!");
          router.push("/dashboard");
        },
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if step 1 is valid
  const isStep1Valid = () => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "dateOfBirth",
      "gender",
      // "avatarUrl",
      // "ward",
      // "town",
      // "emergencyContact",
    ];
    return required.every((field) =>
      watchedFields[field as keyof FormValues]?.trim(),
    );
  };

  // Check if step 2 is valid
  const isStep2Valid = () => {
    if (isCitizen) {
      const required = [
        // "occupation",
        "identificationType",
        "identificationNumber",
      ];
      return required.every((field) =>
        watchedFields[field as keyof FormValues]?.trim(),
      );
    }
    if (isBusinessOwner) {
      const required = ["businessName", "businessType", "ownerRepresentative"];
      return required.every((field) =>
        watchedFields[field as keyof FormValues]?.trim(),
      );
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-6 md:p-8 space-y-6 bg-gradient-card border-border/40">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            {isCitizen
              ? "Provide your personal information to access statutory services"
              : "Provide your business information to access statutory services"}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span
                className={`h-2 w-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`}
              />
              Step 1
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="flex items-center gap-1">
              <span
                className={`h-2 w-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`}
              />
              Step 2
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Personal Information
              </div>

              {/* Photo Upload */}
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/10">
                <div className="flex-shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover border-2 border-primary/30"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label>Passport Photograph</Label>
                  <p className="text-xs text-muted-foreground">
                    Upload a recent passport photo (max 5MB)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      document.getElementById("photo-upload")?.click()
                    }
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="firstName"
                        {...field}
                        className="mt-1.5"
                        placeholder="Enter first name"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="lastName"
                        {...field}
                        className="mt-1.5"
                        placeholder="Enter last name"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="dateOfBirth"
                        type="date"
                        {...field}
                        className="mt-1.5"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        defaultValue="Male"
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.gender && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.gender.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="email"
                        type="email"
                        {...field}
                        className="mt-1.5"
                        placeholder="Enter email address"
                        disabled
                      />
                    )}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Telephone Number *</Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="phone"
                        type="tel"
                        {...field}
                        className="mt-1.5"
                        placeholder="08012345678"
                        disabled
                      />
                    )}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address">
                    Residential/Business Address *
                  </Label>
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="address"
                        {...field}
                        className="mt-1.5"
                        placeholder="Enter address"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="town">Town/Community</Label>
                  <Controller
                    name="town"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="town"
                        {...field}
                        className="mt-1.5"
                        placeholder="Enter town"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.town && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.town.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ward">Ward</Label>
                  <Controller
                    name="ward"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select ward" />
                        </SelectTrigger>
                        <SelectContent>
                          {WARDS.map((ward) => (
                            <SelectItem key={ward} value={ward}>
                              {ward}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.ward && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.ward.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="emergencyContact">
                    Emergency/Alternative Contact
                  </Label>
                  <Controller
                    name="emergencyContact"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="emergencyContact"
                        type="tel"
                        {...field}
                        className="mt-1.5"
                        placeholder="08012345678"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.emergencyContact && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.emergencyContact.message}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleNext}
                className="w-full gap-2"
                disabled={!isStep1Valid() || isSubmitting}
              >
                Next Step <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Role-Specific Information */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                {isCitizen ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                {isCitizen ? "Citizen Information" : "Business Information"}
              </div>

              {isCitizen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Controller
                      name="occupation"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="occupation"
                          {...field}
                          className="mt-1.5"
                          placeholder="Enter occupation"
                          disabled={isSubmitting}
                        />
                      )}
                    />
                    {errors.occupation && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.occupation.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="identificationType">
                      Identification Type *
                    </Label>
                    <Controller
                      name="identificationType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                          <SelectContent>
                            {IDENTIFICATION_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.identificationType && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.identificationType.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="identificationNumber">
                      Identification Number *
                    </Label>
                    <Controller
                      name="identificationNumber"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="identificationNumber"
                          {...field}
                          className="mt-1.5"
                          placeholder="Enter ID number"
                          disabled={isSubmitting}
                        />
                      )}
                    />
                    {errors.identificationNumber && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.identificationNumber.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isBusinessOwner && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">
                      Business/Organisation Name *
                    </Label>
                    <Controller
                      name="businessName"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="businessName"
                          {...field}
                          className="mt-1.5"
                          placeholder="Enter business name"
                          disabled={isSubmitting}
                        />
                      )}
                    />
                    {errors.businessName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.businessName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Controller
                      name="businessType"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="businessType"
                          {...field}
                          className="mt-1.5"
                          placeholder="e.g., Sole Proprietorship, LLC, etc."
                          disabled={isSubmitting}
                        />
                      )}
                    />
                    {errors.businessType && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.businessType.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cacNumber">Registration Number (CAC)</Label>
                    <Controller
                      name="cacNumber"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="cacNumber"
                          {...field}
                          className="mt-1.5"
                          placeholder="Enter CAC registration number"
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="taxIdNumber">
                      Tax Identification Number
                    </Label>
                    <Controller
                      name="taxIdNumber"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="taxIdNumber"
                          {...field}
                          className="mt-1.5"
                          placeholder="Enter TIN"
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownerRepresentative">
                      Owner/Representative *
                    </Label>
                    <Controller
                      name="ownerRepresentative"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="ownerRepresentative"
                          {...field}
                          className="mt-1.5"
                          placeholder="Enter owner or representative name"
                          disabled={isSubmitting}
                        />
                      )}
                    />
                    {errors.ownerRepresentative && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.ownerRepresentative.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !isStep2Valid() || isSubmitting || isUpdatingProfile
                  }
                  className="flex-1 gap-2 bg-gradient-hero"
                >
                  {isSubmitting || isUpdatingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Profile <ShieldCheck className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
