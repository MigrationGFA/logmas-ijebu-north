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
import { useWards } from "@/hooks/queries/useWards";
import { ServiceType } from "@/config/lgaServices";
import { FormWizard, FormStep } from "./FormWizard";
import { DocumentUploadStep, DocumentSpec } from "./DocumentUploadStep";
import {
  ReviewSubmitStep,
  ReviewSection,
  ReviewRepeatableSection,
} from "./ReviewSubmitStep";
import { Plus, Trash2, Wine, Users, Sparkles } from "lucide-react";
import { ApplicantSnapshot } from "../ApplicantSelectionStep";
import { formatAndValidateNigerianPhoneNumber } from "@/lib/helper";


interface Props {
  service: ServiceType;
  onSubmit: (formData: Record<string, any>) => void;
  isSubmitting?: boolean;
  initialApplicant?: ApplicantSnapshot;
}

const beverageCategorySchema = z.object({
  categoryName: z.string().min(1, "Category name is required"),
  brandsHandled: z.string().default(""),
  monthlyVolume: z.string().default(""),
  supplyDistributor: z.string().default(""),
});

const barStaffSchema = z.object({
  fullName: z.string().default(""),
  role: z.string().default(""),
  phone: z.string().default(""),
  hygieneCert: z.string().default(""),
});

const servingAreaSchema = z.object({
  areaName: z.string().default(""),
  capacity: z.string().default(""),
  safetyExit: z.string().default(""),
});

const liquorLicenceSchema = z.object({
  licenseeName: z.string().min(1, "Licensee legal name is required"),
  tradingName: z.string().min(1, "Trading name is required"),
  licenceType: z.string().min(1, "Licence category is required"),
  contactPerson: z.string().optional(),
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
  premisesAddress: z.string().min(1, "Premises physical address is required"),
  ward: z.string().min(1, "Ward is required"),
  cacNumber: z.string().optional(),
  seatingCapacity: z.string().default(""),
  operatingHours: z.string().default(""),
  distanceFromSchool: z.string().min(1, "Setback distance is required"),
  fireExtinguishersCount: z.string().min(1, "Fire extinguishers count is required"),
  emergencyExitsCount: z.string().default(""),
  soundproofing: z.string().default(""),
  underagePolicy: z.string().default(""),
  beverageCategories: z.array(beverageCategorySchema).min(1, "At least one beverage category is required"),
  staff: z.array(barStaffSchema),
  servingAreas: z.array(servingAreaSchema),
});

type LiquorLicenceFormValues = z.infer<typeof liquorLicenceSchema>;

const STEPS: FormStep[] = [
  {
    id: "licensee_premises",
    title: "Licensee & Premises Identity",
    shortTitle: "Premises Profile",
    description:
      "Enter licensee details, trading establishment name, and physical location in the LGA.",
  },
  {
    id: "fire_zoning",
    title: "Fire Safety, Zoning & Compliance",
    shortTitle: "Safety & Zoning",
    description:
      "Provide statutory setback from educational/religious institutions, exits, and noise controls.",
  },
  {
    id: "inventory_staff_bars",
    title: "Beverage Categories, Bar Staff & Serving Lounges",
    shortTitle: "Inventory & Staff",
    description:
      "Itemize alcoholic product lines, certified bartenders, and serving lounges.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description:
      "Upload premises floor plan, fire safety clearance, police report, and health certificates.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description:
      "Verify statutory liquor licence application and submit for LGA Board inspection.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "premises_plan",
    label: "Bar & Premises Architectural Floor Plan",
    description:
      "Layout showing bar counter, seating area, emergency exits, and restrooms.",
    required: true,
  },
  {
    id: "fire_clearance",
    label: "Fire Service Inspection Clearance Certificate",
    description: "Valid certificate issued by the Ogun State Fire Service.",
    required: true,
  },
  {
    id: "police_clearance",
    label: "Police Character Clearance / Station Report",
    description:
      "Report confirming licensee has no criminal conviction regarding disorderly conduct.",
    required: true,
  },
  {
    id: "hygiene_cert",
    label: "Food & Beverage Handlers Medical Certificate",
    description: "Fitness certificates for bar tenders and kitchen staff.",
    required: true,
  },
  {
    id: "cac_cert",
    label: "CAC Business Registration Certificate",
    description: "Certificate of Incorporation or Business Name Registration.",
    required: false,
  },
];

export default function LiquorLicenceForm({
  service,
  onSubmit,
  isSubmitting,
  initialApplicant,
}: Props) {
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
  } = useForm<LiquorLicenceFormValues>({
    resolver: zodResolver(liquorLicenceSchema) as Resolver<LiquorLicenceFormValues>,
    defaultValues: {
      licenseeName: initialApplicant?.name || "",
      tradingName: initialApplicant?.companyName || "",
      licenceType: "Retail Liquor Bar & Lounge",
      contactPerson: initialApplicant?.name || "",
      phone: initialApplicant?.phone || "",
      email: initialApplicant?.email || "",
      premisesAddress: initialApplicant?.address || "",
      ward: initialApplicant?.ward || wards[0]?.name || "the LGA",
      cacNumber: "",
      seatingCapacity: "",
      operatingHours: "",
      distanceFromSchool: "",
      fireExtinguishersCount: "",
      emergencyExitsCount: "",
      soundproofing: "",
      underagePolicy: "",
      beverageCategories: [
        {
          categoryName: "",
          brandsHandled: "",
          monthlyVolume: "",
          supplyDistributor: "",
        },
      ],
      staff: [
        {
          fullName: "",
          role: "",
          phone: "",
          hygieneCert: "",
        },
      ],
      servingAreas: [
        {
          areaName: "",
          capacity: "",
          safetyExit: "",
        },
      ],
    },
    mode: "onChange",
  });

  const {
    fields: categoryFields,
    append: appendCategory,
    remove: removeCategory,
  } = useFieldArray({
    control,
    name: "beverageCategories",
  });

  const {
    fields: staffFields,
    append: appendStaff,
    remove: removeStaff,
  } = useFieldArray({
    control,
    name: "staff",
  });

  const {
    fields: servingAreaFields,
    append: appendServingArea,
    remove: removeServingArea,
  } = useFieldArray({
    control,
    name: "servingAreas",
  });

  useEffect(() => {
    if (initialApplicant) {
      if (initialApplicant.name) {
        setValue("licenseeName", initialApplicant.name);
        setValue("contactPerson", initialApplicant.name);
      }
      if (initialApplicant.companyName) {
        setValue("tradingName", initialApplicant.companyName);
      }
      if (initialApplicant.phone) setValue("phone", initialApplicant.phone);
      if (initialApplicant.email) setValue("email", initialApplicant.email);
      if (initialApplicant.address) setValue("premisesAddress", initialApplicant.address);
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
        "licenseeName",
        "tradingName",
        "licenceType",
        "phone",
        "email",
        "premisesAddress",
        "ward",
      ]);
    }
    if (index === 1) {
      return await trigger([
        "distanceFromSchool",
        "fireExtinguishersCount",
        "emergencyExitsCount",
        "soundproofing",
        "underagePolicy",
      ]);
    }
    if (index === 2) {
      return await trigger(["beverageCategories"]);
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

  const onFormSubmit = (data: LiquorLicenceFormValues) => {
    if (!declaration) return;

    onSubmit({
      formData: {
        ...data,
        beverageCategories: data.beverageCategories.filter((b) => b.categoryName.trim()),
        staff: data.staff.filter((s) => s.fullName.trim()),
        servingAreas: data.servingAreas.filter((a) => a.areaName.trim()),
      },
      files: uploadedFiles,
      applicant: initialApplicant || null,
    });
  };

  const reviewSections: ReviewSection[] = [
    {
      title: "Licensee & Commercial Establishment",
      items: [
        { label: "Licensee Legal Name", value: formValues.licenseeName },
        { label: "Bar / Lounge Trading Name", value: formValues.tradingName },
        { label: "Liquor Licence Classification", value: formValues.licenceType },
        { label: "Contact Phone Number", value: formValues.phone },
        { label: "Email Address", value: formValues.email || "N/A" },
        { label: "Premises Physical Address", value: formValues.premisesAddress },
        { label: "Ward in the LGA", value: formValues.ward },
        { label: "CAC Registration", value: formValues.cacNumber || "N/A" },
        { label: "Total Seating Capacity", value: formValues.seatingCapacity },
        { label: "Operating Hours", value: formValues.operatingHours },
      ],
    },
    {
      title: "Fire Safety, Zoning & Juvenile Protection",
      items: [
        {
          label: "Setback from Schools/Churches",
          value: formValues.distanceFromSchool,
        },
        {
          label: "Fire Extinguishers Installed",
          value: formValues.fireExtinguishersCount,
        },
        {
          label: "Dedicated Emergency Exits",
          value: formValues.emergencyExitsCount,
        },
        { label: "Acoustic / Decibel Control", value: formValues.soundproofing },
        { label: "Underage Prohibition", value: formValues.underagePolicy },
      ],
    },
  ];

  const reviewRepeatableSections: ReviewRepeatableSection[] = [
    {
      title: "Alcoholic Product Lines & Wholesale Suppliers",
      countLabel: "Beverage Lines",
      items: (formValues.beverageCategories || [])
        .filter((b) => b.categoryName?.trim())
        .map((b) => ({
          "Product Category": b.categoryName,
          "Brands Handled": b.brandsHandled || "N/A",
          "Monthly Inventory": b.monthlyVolume || "N/A",
          "Authorized Supplier": b.supplyDistributor || "N/A",
        })),
    },
    {
      title: "Certified Bartending & Service Staff",
      countLabel: "Staff Members",
      items: (formValues.staff || [])
        .filter((s) => s.fullName?.trim())
        .map((s) => ({
          "Staff Name": s.fullName,
          "Designation / Role": s.role || "N/A",
          "Phone Number": s.phone || "N/A",
          "Hygiene / Medical Cert": s.hygieneCert || "N/A",
        })),
    },
    {
      title: "Internal Serving Lounges & Decks",
      countLabel: "Lounges",
      items: (formValues.servingAreas || [])
        .filter((a) => a.areaName?.trim())
        .map((a) => ({
          "Lounge / Area": a.areaName,
          "Seating Capacity": a.capacity || "N/A",
          "Emergency Evacuation Route": a.safetyExit || "N/A",
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
        !formValues.licenseeName ||
        !formValues.tradingName ||
        !formValues.phone ||
        !formValues.premisesAddress ||
        !formValues.ward ||
        !formValues.distanceFromSchool ||
        !formValues.fireExtinguishersCount ||
        categoryFields.length === 0
      }
    >
      {/* STEP 1: Licensee & Premises */}
      {currentStepIndex === 0 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Licensee & Premises Identity
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter bar operator details, licensed premises location, and
              trading category in the LGA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="tradingName">
                Bar / Lounge / Establishment Trading Name *
              </Label>
              <Input
                id="tradingName"
                {...register("tradingName")}
                placeholder="e.g. Obantoko Oasis Lounge & Bar"
              />
              {errors.tradingName && (
                <p className="text-xs text-red-500">{errors.tradingName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="licenseeName">
                Licensee Legal Name / Proprietor *
              </Label>
              <Input
                id="licenseeName"
                {...register("licenseeName")}
                placeholder="e.g. Mr. Femi Alabi"
              />
              {errors.licenseeName && (
                <p className="text-xs text-red-500">{errors.licenseeName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="licenceType">Liquor Licence Category *</Label>
              <Controller
                control={control}
                name="licenceType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="licenceType">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retail Liquor Bar & Lounge">
                        Retail Liquor Bar & Lounge
                      </SelectItem>
                      <SelectItem value="Hotel / Resort Bar Licence">
                        Hotel / Resort Bar Licence
                      </SelectItem>
                      <SelectItem value="Wholesale Liquor Depot / Distributor">
                        Wholesale Liquor Depot / Distributor
                      </SelectItem>
                      <SelectItem value="Nightclub & Entertainment Lounge">
                        Nightclub & Entertainment Lounge
                      </SelectItem>
                      <SelectItem value="Supermarket / Wine Store Retail Off-Licence">
                        Supermarket / Wine Store Off-Licence
                      </SelectItem>
                      <SelectItem value="Restaurant Table Wine & Beer Licence">
                        Restaurant Table Wine & Beer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.licenceType && (
                <p className="text-xs text-red-500">{errors.licenceType.message}</p>
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
                placeholder="lounge@example.com"
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
              <Label htmlFor="cacNumber">CAC Registration Number</Label>
              <Input
                id="cacNumber"
                {...register("cacNumber")}
                placeholder="BN-789012"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="premisesAddress">
                Premises Physical Location Address *
              </Label>
              <Input
                id="premisesAddress"
                {...register("premisesAddress")}
                placeholder="Building No, Street name, Town in the LGA"
              />
              {errors.premisesAddress && (
                <p className="text-xs text-red-500">{errors.premisesAddress.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seatingCapacity">Customer Seating Capacity</Label>
              <Input
                id="seatingCapacity"
                {...register("seatingCapacity")}
                placeholder="e.g. 100 Persons"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="operatingHours">Daily Operating Hours</Label>
              <Input
                id="operatingHours"
                {...register("operatingHours")}
                placeholder="e.g. 2:00 PM - 12:00 AM"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Safety & Zoning */}
      {currentStepIndex === 1 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Fire Safety, Zoning & Juvenile Protection
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ensure statutory compliance regarding minimum setbacks, fire
              preparedness, and sound control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="distanceFromSchool">
                Setback from Nearest School or Place of Worship *
              </Label>
              <Controller
                control={control}
                name="distanceFromSchool"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="distanceFromSchool">
                      <SelectValue placeholder="Select Distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="More than 500 Meters">
                        More than 500 Meters (Compliant)
                      </SelectItem>
                      <SelectItem value="250 to 500 Meters">
                        250 to 500 Meters (Buffer Compliant)
                      </SelectItem>
                      <SelectItem value="Special Commercial Zone / Mall">
                        Special Commercial Zone / Shopping Complex
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.distanceFromSchool && (
                <p className="text-xs text-red-500">
                  {errors.distanceFromSchool.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fireExtinguishersCount">
                Fire Fighting Equipment *
              </Label>
              <Input
                id="fireExtinguishersCount"
                {...register("fireExtinguishersCount")}
                placeholder="e.g. 4 Cylinders (CO2 & Dry Powder)"
              />
              {errors.fireExtinguishersCount && (
                <p className="text-xs text-red-500">
                  {errors.fireExtinguishersCount.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emergencyExitsCount">
                Dedicated Emergency Exits
              </Label>
              <Input
                id="emergencyExitsCount"
                {...register("emergencyExitsCount")}
                placeholder="e.g. 2 Clear Emergency Exit Doors"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="soundproofing">
                Acoustic & Noise Control Measures
              </Label>
              <Input
                id="soundproofing"
                {...register("soundproofing")}
                placeholder="e.g. Soundproof enclosure, decibel limiter"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="underagePolicy">Underage Protection Policy</Label>
              <Input
                id="underagePolicy"
                {...register("underagePolicy")}
                placeholder="e.g. Prominent warning signage & mandatory ID check at entry"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Inventory, Staff & Lounges (REPEATABLE UI) */}
      {currentStepIndex === 2 && (
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Beverage Categories, Bar Staff & Serving Lounges
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provide complete breakdown of liquor inventory types, certified
              bartending personnel, and customer serving sections.
            </p>
          </div>

          {/* REPEATABLE SECTION: Product Lines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Wine className="w-4 h-4 text-primary" /> Liquor Beverage
                  Product Lines *
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record categories of alcohol sold and authorized distributors.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendCategory({
                    categoryName: "",
                    brandsHandled: "",
                    monthlyVolume: "20 Crates",
                    supplyDistributor: "",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Line
              </Button>
            </div>

            {categoryFields.map((fieldItem, idx) => (
              <div
                key={fieldItem.id}
                className="bg-muted/10 border rounded-xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-xs text-foreground">
                    Category #{idx + 1}:{" "}
                    {formValues.beverageCategories?.[idx]?.categoryName ||
                      "New Product Line"}
                  </span>
                  {categoryFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCategory(idx)}
                      className="text-red-500 hover:text-red-700 h-7 px-2 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Category Name *</Label>
                    <Input
                      {...register(`beverageCategories.${idx}.categoryName`)}
                      placeholder="e.g. Spirits, Whiskies, Beers, Wines"
                    />
                    {errors.beverageCategories?.[idx]?.categoryName && (
                      <p className="text-xs text-red-500">
                        {errors.beverageCategories[idx]?.categoryName?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Brands Handled</Label>
                    <Input
                      {...register(`beverageCategories.${idx}.brandsHandled`)}
                      placeholder="e.g. Jameson, Hennessy"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Est. Monthly Volume</Label>
                    <Input
                      {...register(`beverageCategories.${idx}.monthlyVolume`)}
                      placeholder="e.g. 50 Cartons"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-4">
                    <Label className="text-xs">
                      Distributor / Source of Supply
                    </Label>
                    <Input
                      {...register(`beverageCategories.${idx}.supplyDistributor`)}
                      placeholder="e.g. Authorized Major Distributor, Abeokuta"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* REPEATABLE SECTION: Staff */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> Certified
                  Bartending & Supervisory Staff
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record personnel with medical hygiene certificates serving
                  alcohol.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendStaff({
                    fullName: "",
                    role: "Bartender",
                    phone: "",
                    hygieneCert: "",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Staff Member
              </Button>
            </div>

            <div className="space-y-2.5">
              {staffFields.map((fieldItem, idx) => (
                <div
                  key={fieldItem.id}
                  className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">Staff Full Name</Label>
                    <Input
                      {...register(`staff.${idx}.fullName`)}
                      placeholder="Staff Name"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Role / Position</Label>
                    <Input
                      {...register(`staff.${idx}.role`)}
                      placeholder="Mixologist / Manager"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Phone / Medical Cert</Label>
                    <Input
                      {...register(`staff.${idx}.phone`)}
                      placeholder="080... / Cert No"
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

          {/* REPEATABLE SECTION: Serving Lounges */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" /> Internal Serving
                  Lounges & Open Bars
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Itemize distinct service lounges, outdoor gardens, and VIP
                  rooms.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendServingArea({
                    areaName: "",
                    capacity: "20 Persons",
                    safetyExit: "Fire Door",
                  })
                }
                className="gap-1 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Lounge Section
              </Button>
            </div>

            <div className="space-y-2.5">
              {servingAreaFields.map((fieldItem, idx) => (
                <div
                  key={fieldItem.id}
                  className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">Lounge / Section Name</Label>
                    <Input
                      {...register(`servingAreas.${idx}.areaName`)}
                      placeholder="e.g. VIP Champagne Lounge"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Seating Capacity</Label>
                    <Input
                      {...register(`servingAreas.${idx}.capacity`)}
                      placeholder="e.g. 40 Persons"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Emergency Evacuation</Label>
                    <Input
                      {...register(`servingAreas.${idx}.safetyExit`)}
                      placeholder="e.g. Direct Fire Exit"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeServingArea(idx)}
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
          declarationText="I solemnly declare that the liquor licence specifications, safety compliance, age-restriction policies, and premises floor plans stated herein are accurate and comply with the Liquor Licensing Laws of the Local Government, Ogun State."
        />
      )}
    </FormWizard>
  );
}
