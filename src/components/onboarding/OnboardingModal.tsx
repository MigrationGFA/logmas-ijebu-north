"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/queries/useAuth";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  ShieldCheck,
} from "lucide-react";
import { uploadsService } from "@/services/uploads";
import { LGA_CONFIG } from "@/config/lga.config";
import Image from "next/image";



const GENDER_OPTIONS = ["Male", "Female", "Other"];
const IDENTIFICATION_TYPES = [
  "NIN (National Identity Number)",
  "Voter's Card (VIN)",
  "Driver's License",
  "International Passport",
  "Other Valid ID",
];

const onboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(1, "Residential address is required"),
  // town: z.string().min(1, "Town or community is required"),
  // ward: z.string().min(1, "Ward selection is required"),
  emergencyContact: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender selection is required"),
  avatarUrl: z.string().optional(),
  // Citizen specific
  occupation: z.string().optional(),
  identificationType: z.string().optional(),
  identificationNumber: z.string().optional(),
  // Business specific
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  ownerRepresentative: z.string().optional(),
  cacNumber: z.string().optional(),
  taxIdNumber: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function OnboardingModal({ isOpen, onClose, onCompleted }: OnboardingModalProps) {
  const { user, updateProfileAsync: updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const isCitizen = user?.role === "citizen";
  const isBusinessOwner = user?.role === "business_owner";

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      // town: "",
      // ward: "",
      emergencyContact: "",
      dateOfBirth: "",
      gender: "",
      avatarUrl: "",
      occupation: "",
      identificationType: "NIN (National Identity Number)",
      identificationNumber: "",
      businessName: "",
      businessType: "",
      ownerRepresentative: "",
      cacNumber: "",
      taxIdNumber: "",
    },
  });

  // Pre-populate with existing user data when modal opens
  useEffect(() => {
    if (user && isOpen) {
      const u = user as any;
      setValue("firstName", u.firstName || "");
      setValue("lastName", u.lastName || "");
      setValue("email", u.email || "");
      setValue("phone", u.phone || "");
      setValue("address", u.address || "");
      // setValue("town", u.town || "");
      // setValue("ward", u.ward || "");
      setValue("emergencyContact", u.emergencyContact || "");
      setValue(
        "dateOfBirth",
        u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split("T")[0] : ""
      );
      setValue("gender", u.gender || "");
      setValue("avatarUrl", u.avatarUrl || "");
      if (u.avatarUrl) setAvatarPreview(u.avatarUrl);

      if (isCitizen) {
        setValue("occupation", u.occupation || "");
        setValue("identificationType", u.identificationType || "NIN (National Identity Number)");
        setValue("identificationNumber", u.identificationNumber || u.nin || "");
      }

      if (isBusinessOwner) {
        setValue("businessName", u.businessName || "");
        setValue("businessType", u.businessType || "");
        setValue("ownerRepresentative", u.ownerRepresentative || `${u.firstName || ""} ${u.lastName || ""}`.trim());
        setValue("cacNumber", u.cacNumber || "");
        setValue("taxIdNumber", u.taxIdNumber || "");
      }
    }
  }, [user, isOpen, setValue, isCitizen, isBusinessOwner]);

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size must be under 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG/PNG)");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadsService.uploadFile(file, "passports");
      setAvatarPreview(result.url);
      setValue("avatarUrl", result.url);
      toast.success("Passport photo uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        // town: data.town,
        // ward: data.ward,
        emergencyContact: data.emergencyContact,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        gender: data.gender,
        avatarUrl: data.avatarUrl || avatarPreview || undefined,
        onboardingCompleted: true,
      };

      if (isCitizen) {
        payload.occupation = data.occupation;
        payload.identificationType = data.identificationType;
        payload.identificationNumber = data.identificationNumber;
        payload.nin = data.identificationNumber;
      } else if (isBusinessOwner) {
        payload.businessName = data.businessName;
        payload.businessType = data.businessType;
        payload.ownerRepresentative = data.ownerRepresentative;
        payload.cacNumber = data.cacNumber;
        payload.taxIdNumber = data.taxIdNumber;
      }

      await updateProfile(payload);
      toast.success("Profile updated successfully! Official council services are now ready.");
      onCompleted?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile. Please check your network.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs uppercase tracking-wider font-semibold">
              Odeda LGA Citizen Registry
            </span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Provide your ward, emergency contact, identification and passport photo to facilitate swift verification and certificate processing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Passport Photo / Avatar Section */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center shrink-0">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Passport preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-sm font-semibold">Passport Photograph</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clear portrait photo required for statutory certificates & identity permits (Max 5MB).
              </p>
              <div className="mt-2.5 flex justify-center sm:justify-start">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePassportUpload}
                    disabled={isUploading}
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-secondary transition-colors">
                    <Camera className="h-3.5 w-3.5 text-primary" />
                    {avatarPreview ? "Change Photo" : "Upload Passport Photo"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Names & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-xs font-semibold">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <Input {...field} id="firstName" placeholder="e.g. Olawale" className="mt-1.5" />
                )}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName" className="text-xs font-semibold">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <Input {...field} id="lastName" placeholder="e.g. Adebayo" className="mt-1.5" />
                )}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone" className="text-xs font-semibold">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input {...field} id="phone" placeholder="+234 800 000 0000" className="mt-1.5" />
                )}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="emergencyContact" className="text-xs font-semibold">
                Emergency Contact
              </Label>
              <Controller
                name="emergencyContact"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="emergencyContact"
                    placeholder="Next of Kin / Relative Phone"
                    className="mt-1.5"
                  />
                )}
              />
              {errors.emergencyContact && (
                <p className="text-xs text-destructive mt-1">
                  {errors.emergencyContact.message}
                </p>
              )}
            </div>
          </div>

          {/* Location & Ward */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
            <div>
              <Label htmlFor="ward" className="text-xs font-semibold">
                {LGA_CONFIG.identity.name} Ward <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="ward"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger id="ward" className="mt-1.5">
                      <SelectValue placeholder="Select your political ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {LGA_WARD_NAMES.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.ward && (
                <p className="text-xs text-destructive mt-1">{errors.ward.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="town" className="text-xs font-semibold">
                Town / Community <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="town"
                control={control}
                render={({ field }) => (
                  <Input {...field} id="town" placeholder="e.g. Osiele, Odeda, Ilugun" className="mt-1.5" />
                )}
              />
              {errors.town && (
                <p className="text-xs text-destructive mt-1">{errors.town.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="address" className="text-xs font-semibold">
                Residential / Operating Address <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="address"
                    placeholder="Street name, landmark and house number"
                    className="mt-1.5"
                  />
                )}
              />
              {errors.address && (
                <p className="text-xs text-destructive mt-1">{errors.address.message}</p>
              )}
            </div>
          </div> */}

          {/* Demographic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
            <div>
              <Label htmlFor="dateOfBirth" className="text-xs font-semibold">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <Input {...field} id="dateOfBirth" type="date" className="mt-1.5" />
                )}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive mt-1">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="gender" className="text-xs font-semibold">
                Gender <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger id="gender" className="mt-1.5">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && (
                <p className="text-xs text-destructive mt-1">{errors.gender.message}</p>
              )}
            </div>
          </div>

          {/* Citizen: ID & Occupation */}
          {isCitizen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div>
                <Label htmlFor="identificationType" className="text-xs font-semibold">
                  Identification Type
                </Label>
                <Controller
                  name="identificationType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || "NIN (National Identity Number)"}>
                      <SelectTrigger id="identificationType" className="mt-1.5">
                        <SelectValue placeholder="Select ID Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {IDENTIFICATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="identificationNumber" className="text-xs font-semibold">
                  ID / NIN Number
                </Label>
                <Controller
                  name="identificationNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="identificationNumber"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={11}
                      placeholder="e.g. 11-digit NIN"
                      className="mt-1.5"
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        field.onChange(digitsOnly);
                      }}
                    />
                  )}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="occupation" className="text-xs font-semibold">
                  Occupation / Trade
                </Label>
                <Controller
                  name="occupation"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="occupation"
                      placeholder="e.g. Civil Servant, Farmer, Trader, Artisan"
                      className="mt-1.5"
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* Business Owner specifics */}
          {isBusinessOwner && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div className="sm:col-span-2">
                <Label htmlFor="businessName" className="text-xs font-semibold">
                  Registered Business Name
                </Label>
                <Controller
                  name="businessName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="businessName"
                      placeholder="e.g. Odeda LGA Agro Allied Enterprises"
                      className="mt-1.5"
                    />
                  )}
                />
              </div>

              <div>
                <Label htmlFor="cacNumber" className="text-xs font-semibold">
                  CAC Registration Number
                </Label>
                <Controller
                  name="cacNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="cacNumber"
                      placeholder="e.g. RC / BN 1234567"
                      className="mt-1.5"
                    />
                  )}
                />
              </div>

              <div>
                <Label htmlFor="taxIdNumber" className="text-xs font-semibold">
                  Tax Identification Number (TIN)
                </Label>
                <Controller
                  name="taxIdNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="taxIdNumber"
                      placeholder="State or Federal TIN"
                      className="mt-1.5"
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground min-w-32 shadow-sm"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save & Complete
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
