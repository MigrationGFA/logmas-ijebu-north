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
import { Plus, Trash2, Store, ShoppingBag, ShieldCheck } from "lucide-react";
import { ApplicantSnapshot } from "../ApplicantSelectionStep";

const WARDS = LGA_CONFIG.wards.map((ward) => ward.name);

const productLineSchema = z.object({
  itemCategory: z.string().min(1, "Merchandise category is required"),
  stockValue: z.string().optional().default(""),
  sourceSupplier: z.string().optional().default(""),
});

const kioskAttendantSchema = z.object({
  fullName: z.string().min(1, "Attendant name is required"),
  role: z.string().optional().default("Sales Attendant"),
  phone: z.string().optional().default(""),
});

const safetyFixtureSchema = z.object({
  fixtureType: z.string().min(1, "Fixture type is required"),
  quantity: z.string().optional().default("1"),
});

export const kioskLicenceSchema = z.object({
  operatorName: z.string().min(2, "Operator full name is required"),
  tradingName: z.string().min(2, "Kiosk trading name is required"),
  tradeCategory: z.string().min(1, "Trade category is required"),
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
  residentialAddress: z.string().min(3, "Residential address is required"),
  ward: z.string().min(1, "Ward is required"),
  nin: z.string().regex(/^\d{11}$/, "NIN must be an 11-digit number"),
  proposedLocation: z.string().min(3, "Proposed kiosk location is required"),
  structureType: z.string().min(1, "Structure type is required"),
  dimensions: z.string().optional().default(""),
  setbackFromRoad: z.string().min(1, "Setback distance is required"),
  powerSource: z.string().optional().default(""),
  wasteManagement: z.string().optional().default(""),
  productLines: z
    .array(productLineSchema)
    .min(1, "At least one product line is required"),
  attendants: z.array(kioskAttendantSchema).default([]),
  fixtures: z.array(safetyFixtureSchema).default([]),
});

export type KioskLicenceFormData = z.infer<typeof kioskLicenceSchema>;

interface Props {
  service: ServiceType;
  onSubmit: (formData: Record<string, any>) => void;
  isSubmitting?: boolean;
  initialApplicant?: ApplicantSnapshot;
}

const STEPS: FormStep[] = [
  {
    id: "operator_profile",
    title: "Kiosk Operator & Enterprise Identity",
    shortTitle: "Operator Identity",
    description:
      "Enter kiosk operator personal details, trade category, and residential address in the LGA.",
  },
  {
    id: "structure_setback",
    title: "Kiosk Structure, Setback & Sanitation",
    shortTitle: "Structure & Setback",
    description:
      "Provide physical dimensions, material fabrication, road setback, and waste disposal.",
  },
  {
    id: "products_staff_fixtures",
    title: "Retail Products, Staff & Safety Fixtures",
    shortTitle: "Products & Staff",
    description:
      "Itemize merchandise product lines, sales attendants, and fire safety fixtures.",
  },
  {
    id: "documents",
    title: "Supporting Documents",
    shortTitle: "Documents",
    description:
      "Upload kiosk site photograph, landowner consent letter, passport photo, and ID card.",
  },
  {
    id: "review",
    title: "Review & Submit",
    shortTitle: "Review",
    description:
      "Review kiosk licensing particulars and submit for statutory LGA market permit.",
  },
];

const DOCUMENTS: DocumentSpec[] = [
  {
    id: "kiosk_photo",
    label: "Proposed Kiosk Location / Structure Photograph",
    description:
      "Clear photo showing the kiosk structure and its surrounding roadside environment.",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png",
  },
  {
    id: "landowner_consent",
    label: "Written Consent of Landowner / Space Allottee",
    description:
      "Letter from the property owner, frontage landlord, or market master granting permission.",
    required: true,
  },
  {
    id: "passport_photo",
    label: "Operator Passport Photograph",
    description:
      "Recent color passport photograph of the principal kiosk operator.",
    required: true,
    acceptedFormats: ".jpg,.jpeg,.png",
  },
  {
    id: "operator_id",
    label: "Operator National ID / NIN Slip",
    description: "Valid National Identity Card, NIN Slip, or Voter's Card.",
    required: true,
  },
];

export default function KioskLicenceForm({
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
  } = useForm<KioskLicenceFormData>({
    resolver: zodResolver(kioskLicenceSchema) as Resolver<KioskLicenceFormData>,
    mode: "onBlur",
    defaultValues: {
      operatorName: initialApplicant?.name || "",
      tradingName: initialApplicant?.name
        ? `${initialApplicant.name}'s Kiosk`
        : "",
      tradeCategory: "Provisions, Cold Drinks & Retail FMCG",
      phone: initialApplicant?.phone || "",
      email: initialApplicant?.email || "",
      residentialAddress: initialApplicant?.address || "",
      ward: initialApplicant?.ward || WARDS[0] || "the LGA",
      nin: initialApplicant?.nin || "",
      proposedLocation: "",
      structureType: "Fabricated Metal Container (8ft x 10ft)",
      dimensions: "",
      setbackFromRoad: "",
      powerSource: "",
      wasteManagement: "",
      productLines: [
        {
          itemCategory: "",
          stockValue: "",
          sourceSupplier: "",
        },
      ],
      attendants: [
        {
          fullName: "",
          role: "Sales Attendant",
          phone: "",
        },
      ],
      fixtures: [
        { fixtureType: "", quantity: "1" },
      ],
    },
  });

  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({
    control,
    name: "productLines",
  });

  const {
    fields: attendantFields,
    append: appendAttendant,
    remove: removeAttendant,
  } = useFieldArray({
    control,
    name: "attendants",
  });

  const {
    fields: fixtureFields,
    append: appendFixture,
    remove: removeFixture,
  } = useFieldArray({
    control,
    name: "fixtures",
  });

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

  const handleNext = async () => {
    let isValid = false;
    if (currentStepIndex === 0) {
      isValid = await trigger([
        "tradingName",
        "operatorName",
        "tradeCategory",
        "phone",
        "email",
        "nin",
        "ward",
        "residentialAddress",
      ]);
    } else if (currentStepIndex === 1) {
      isValid = await trigger([
        "proposedLocation",
        "structureType",
        "setbackFromRoad",
      ]);
    } else if (currentStepIndex === 2) {
      isValid = await trigger("productLines");
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

  const currentFee = service.feeConfig?.amount
    ? parseFloat(service.feeConfig.amount)
    : 0;

  const onValidSubmit = (data: KioskLicenceFormData) => {
    if (!declaration) return;

    onSubmit({
      files: uploadedFiles,
      applicant: initialApplicant || null,
      formData: {
        ...data,
        productLines: data.productLines.filter((p) => p.itemCategory.trim()),
        attendants: data.attendants.filter((a) => a.fullName.trim()),
        fixtures: data.fixtures.filter((f) => f.fixtureType.trim()),
      },
    });
  };

  const reviewSections: ReviewSection[] = [
    {
      title: "Kiosk Operator & Enterprise Profile",
      items: [
        { label: "Operator Full Name", value: formValues.operatorName },
        {
          label: "Kiosk / Business Trading Name",
          value: formValues.tradingName,
        },
        { label: "Trade Category", value: formValues.tradeCategory },
        { label: "Contact Phone Number", value: formValues.phone },
        { label: "Email Address", value: formValues.email || "N/A" },
        { label: "National ID (NIN)", value: formValues.nin },
        {
          label: "Residential Address",
          value: formValues.residentialAddress,
        },
        { label: "Ward in the LGA", value: formValues.ward },
      ],
    },
    {
      title: "Structure Fabrication, Setback & Hygiene",
      items: [
        {
          label: "Physical Kiosk Location",
          value: formValues.proposedLocation,
        },
        { label: "Structure Typology", value: formValues.structureType },
        {
          label: "Dimensions / Footprint",
          value: formValues.dimensions || "N/A",
        },
        {
          label: "Roadway Setback Distance",
          value: formValues.setbackFromRoad,
        },
        {
          label: "Power / Lighting Source",
          value: formValues.powerSource || "N/A",
        },
        {
          label: "Refuse Disposal Protocol",
          value: formValues.wasteManagement || "N/A",
        },
      ],
    },
  ];

  const reviewRepeatableSections: ReviewRepeatableSection[] = [
    {
      title: "Retail Merchandise & Inventory Handled",
      countLabel: "Product Lines",
      items: (formValues.productLines || [])
        .filter((p) => p.itemCategory?.trim())
        .map((p) => ({
          "Merchandise Category": p.itemCategory,
          "Estimated Stock Value": p.stockValue || "N/A",
          "Supplier Channel": p.sourceSupplier || "N/A",
        })),
    },
    {
      title: "Kiosk Staff & Sales Attendants",
      countLabel: "Attendants",
      items: (formValues.attendants || [])
        .filter((a) => a.fullName?.trim())
        .map((a) => ({
          "Attendant Name": a.fullName,
          "Role / Duty": a.role || "Sales Attendant",
          "Phone Number": a.phone || "N/A",
        })),
    },
    {
      title: "Installed Safety & Lock Security Fixtures",
      countLabel: "Fixtures",
      items: (formValues.fixtures || [])
        .filter((f) => f.fixtureType?.trim())
        .map((f) => ({
          "Fixture Type": f.fixtureType,
          Quantity: `${f.quantity || "1"} Units`,
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
      submitLabel="Submit Kiosk Licence Application"
    >
      {/* STEP 1: Operator Identity */}
      {currentStepIndex === 0 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Kiosk Operator & Enterprise Identity
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter operator personal credentials and trading enterprise
              identity for statutory kiosk licensing in the LGA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="tradingName">
                Kiosk / Enterprise Business Name *
              </Label>
              <Input
                id="tradingName"
                {...register("tradingName")}
                placeholder="e.g. Mama Funke Mini Provisions & Cold Drinks Kiosk"
                disabled={isSubmitting}
              />
              {errors.tradingName && (
                <p className="text-xs text-red-500">{errors.tradingName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="operatorName">Operator Legal Full Name *</Label>
              <Input
                id="operatorName"
                {...register("operatorName")}
                placeholder="e.g. Mrs. Funke Adebayo"
                disabled={isSubmitting}
              />
              {errors.operatorName && (
                <p className="text-xs text-red-500">{errors.operatorName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tradeCategory">Kiosk Commercial Category *</Label>
              <Controller
                name="tradeCategory"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="tradeCategory">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Provisions, Cold Drinks & Retail FMCG">
                        Provisions, Cold Drinks & Retail FMCG
                      </SelectItem>
                      <SelectItem value="Cooked Food, Snacks & Refreshment Kiosk">
                        Cooked Food, Snacks & Refreshment
                      </SelectItem>
                      <SelectItem value="POS Agency Banking & Financial Services">
                        POS Agency Banking & Financial Services
                      </SelectItem>
                      <SelectItem value="Phone Accessories, Gadgets & Electronics">
                        Phone Accessories, Gadgets & Electronics
                      </SelectItem>
                      <SelectItem value="Tailoring, Fashion & Dry Cleaning Depot">
                        Tailoring, Fashion & Dry Cleaning Depot
                      </SelectItem>
                      <SelectItem value="Barbershop / Hair Salon Kiosk">
                        Barbershop / Hair Salon Kiosk
                      </SelectItem>
                      <SelectItem value="Auto Electrician / Battery Charging Booth">
                        Auto Electrician / Battery Booth
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tradeCategory && (
                <p className="text-xs text-red-500">{errors.tradeCategory.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Contact Phone Number *</Label>
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
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="kiosk@example.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nin">National Identity Number (NIN) *</Label>
              <Input
                id="nin"
                maxLength={11}
                {...register("nin")}
                placeholder="11-digit NIN"
                disabled={isSubmitting}
              />
              {errors.nin && (
                <p className="text-xs text-red-500">{errors.nin.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ward">Ward in the LGA *</Label>
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
              <Label htmlFor="residentialAddress">
                Operator Residential Address *
              </Label>
              <Input
                id="residentialAddress"
                {...register("residentialAddress")}
                placeholder="Residential home address in the LGA"
                disabled={isSubmitting}
              />
              {errors.residentialAddress && (
                <p className="text-xs text-red-500">{errors.residentialAddress.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Structure & Setback */}
      {currentStepIndex === 1 && (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Kiosk Structure, Setback & Sanitation
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ensure compliance with town planning setbacks, drainage clearance,
              and waste disposal bye-laws.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="proposedLocation">
                Physical Kiosk Location / Street Frontage *
              </Label>
              <Input
                id="proposedLocation"
                {...register("proposedLocation")}
                placeholder="e.g. Opposite Community Primary School Gate, the LGA Road"
                disabled={isSubmitting}
              />
              {errors.proposedLocation && (
                <p className="text-xs text-red-500">{errors.proposedLocation.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="structureType">
                Structure Fabrication Material *
              </Label>
              <Controller
                name="structureType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="structureType">
                      <SelectValue placeholder="Select Structure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fabricated Metal Container (8ft x 10ft)">
                        Fabricated Metal Container (8x10)
                      </SelectItem>
                      <SelectItem value="Fabricated Metal Container (6ft x 8ft)">
                        Fabricated Metal Container (6x8)
                      </SelectItem>
                      <SelectItem value="Prefabricated Fiberglass Booth">
                        Prefabricated Fiberglass Booth
                      </SelectItem>
                      <SelectItem value="Movable Wooden Kiosk with Corrugated Roof">
                        Movable Wooden Kiosk
                      </SelectItem>
                      <SelectItem value="Movable Metal Canopy / Lockup Stall">
                        Movable Canopy / Lockup Stall
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.structureType && (
                <p className="text-xs text-red-500">{errors.structureType.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dimensions">
                Footprint Dimensions (Length x Width)
              </Label>
              <Input
                id="dimensions"
                {...register("dimensions")}
                placeholder="e.g. 8ft x 10ft"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="setbackFromRoad">
                Setback from Road Kerb / Public Drainage *
              </Label>
              <Input
                id="setbackFromRoad"
                {...register("setbackFromRoad")}
                placeholder="e.g. Minimum 3.0 Metres clear of gutter"
                disabled={isSubmitting}
              />
              {errors.setbackFromRoad && (
                <p className="text-xs text-red-500">{errors.setbackFromRoad.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="powerSource">Lighting & Power Source</Label>
              <Input
                id="powerSource"
                {...register("powerSource")}
                placeholder="e.g. Solar Lamp / Extension line"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="wasteManagement">
                Sanitation & Waste Disposal Channel
              </Label>
              <Input
                id="wasteManagement"
                {...register("wasteManagement")}
                placeholder="e.g. Covered trash bin with municipal PSP waste collection"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Products, Staff & Fixtures (REPEATABLE UI) */}
      {currentStepIndex === 2 && (
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Retail Products, Staff & Safety Fixtures
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provide complete breakdown of retail goods sold, sales attendants,
              and fire safety equipment.
            </p>
          </div>

          {/* REPEATABLE SECTION: Product Lines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-primary" /> Retail
                  Merchandise & Product Lines *
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record categories of items sold in the kiosk and estimated
                  capital value.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendProduct({
                    itemCategory: "",
                    stockValue: "₦50,000",
                    sourceSupplier: "",
                  })
                }
                className="gap-1 text-xs h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Line
              </Button>
            </div>

            {errors.productLines && (
              <p className="text-xs text-red-500">{errors.productLines.message}</p>
            )}

            {productFields.map((field, idx) => (
              <div
                key={field.id}
                className="bg-muted/10 border rounded-xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-xs text-foreground">
                    Product Line #{idx + 1}: {formValues.productLines?.[idx]?.itemCategory || "New Line"}
                  </span>
                  {productFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(idx)}
                      className="text-red-500 hover:text-red-700 h-7 px-2 text-xs"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Merchandise Category *</Label>
                    <Input
                      {...register(`productLines.${idx}.itemCategory`)}
                      placeholder="e.g. Cold Soft Drinks, Biscuits & Toiletries"
                      disabled={isSubmitting}
                    />
                    {errors.productLines?.[idx]?.itemCategory && (
                      <p className="text-xs text-red-500">
                        {errors.productLines[idx]?.itemCategory?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Estimated Stock Value</Label>
                    <Input
                      {...register(`productLines.${idx}.stockValue`)}
                      placeholder="e.g. ₦100,000"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Supplier Channel</Label>
                    <Input
                      {...register(`productLines.${idx}.sourceSupplier`)}
                      placeholder="e.g. Wholesale Market"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* REPEATABLE SECTION: Attendants */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-primary" /> Kiosk Staff & Sales
                  Attendants
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record sales assistants or apprentices operating the kiosk.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendAttendant({
                    fullName: "",
                    role: "Sales Assistant",
                    phone: "",
                  })
                }
                className="gap-1 text-xs h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" /> Add Attendant
              </Button>
            </div>

            <div className="space-y-2.5">
              {attendantFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">Attendant Name *</Label>
                    <Input
                      {...register(`attendants.${idx}.fullName`)}
                      placeholder="Full Name"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                    {errors.attendants?.[idx]?.fullName && (
                      <p className="text-xs text-red-500">
                        {errors.attendants[idx]?.fullName?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Role / Duty</Label>
                    <Input
                      {...register(`attendants.${idx}.role`)}
                      placeholder="Sales Attendant"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Phone Number</Label>
                    <Input
                      {...register(`attendants.${idx}.phone`)}
                      placeholder="080..."
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttendant(idx)}
                      className="text-red-500 hover:text-red-700 h-8 px-2 text-xs"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REPEATABLE SECTION: Safety Fixtures */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Safety &
                  Security Fixtures
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Record fire extinguishers, security padlocks, and solar lamps
                  installed.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendFixture({
                    fixtureType: "",
                    quantity: "1",
                  })
                }
                className="gap-1 text-xs h-8"
                disabled={isSubmitting}
              >
                <Plus className="w-3.5 h-3.5" /> Add Fixture
              </Button>
            </div>

            <div className="space-y-2.5">
              {fixtureFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="bg-card border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
                >
                  <div className="space-y-1 sm:col-span-3">
                    <Label className="text-[11px]">
                      Fixture / Equipment Type *
                    </Label>
                    <Input
                      {...register(`fixtures.${idx}.fixtureType`)}
                      placeholder="e.g. 2kg Fire Extinguisher / Heavy-Duty Padlocks"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                    {errors.fixtures?.[idx]?.fixtureType && (
                      <p className="text-xs text-red-500">
                        {errors.fixtures[idx]?.fixtureType?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Quantity</Label>
                    <Input
                      {...register(`fixtures.${idx}.quantity`)}
                      placeholder="1"
                      className="h-8 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFixture(idx)}
                      className="text-red-500 hover:text-red-700 h-8 px-2 text-xs"
                      disabled={isSubmitting}
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
          declarationText="I solemnly declare that the kiosk dimensions, location frontage, trade merchandise, and safety equipment conform strictly with the Kiosk Licensing and Market Bye-Laws of the Local Government, Ogun State."
        />
      )}
    </FormWizard>
  );
}
