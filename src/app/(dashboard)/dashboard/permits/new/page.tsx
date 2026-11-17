/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/shared";
import {
  useBusinessProfile,
  useBusinessPermits,
} from "@/hooks/queries/useBusiness";
import { toast } from "sonner";
import { Loader2, Search, X, Plus } from "lucide-react";
import { tokenManager } from "@/services/apiAuth";
import { useEffect, useMemo, useState } from "react";
import { useFieldOfficerBusinesses } from "@/hooks/queries/useFieldOfficer";
import { useRevenueCategories } from "@/hooks/queries/useRevenueCategories";
import { useWards } from "@/hooks/queries/useWards";
import { useAuth } from "@/hooks/queries/useAuth";
import { useRouter } from "next/navigation";
import { Business } from "@/services/apiFieldOfficer";

// Validation schema
const permitSchema = z.object({
  businessId: z.string().min(1, "Please select a business"),
  categoryId: z.string().min(1, "CategoryId is required"),
  validFrom: z.string().optional(),
});

// Business registration schema
const businessRegistrationSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  address: z.string().min(5, "Address is required"),
  phone: z.string().min(10, "Valid phone number is required (min:10)"),
  email: z.string().email("Valid email is required"),
  cacNumber: z.string().optional(),
  category: z.string().min(1, "Business category is required"),
  description: z.string().optional(),
  // wardName: z.string().min(1, "Ward is required"),
  existingUserId: z.string().optional(),
});

type PermitFormData = z.infer<typeof permitSchema>;
type BusinessRegistrationData = z.infer<typeof businessRegistrationSchema>;

export default function NewPermitPage() {
  const user = tokenManager.getUser();

  const { user: loggedUser } = useAuth();

  const userWardId = loggedUser?.wardId ?? "";
  const userWardName = loggedUser?.ward?.name;
  const navigate = useRouter();
  const [businessSearch, setBusinessSearch] = useState("");
  const [showBusinessSearch, setShowBusinessSearch] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isOwnerRegisterDialogOpen, setIsOwnerRegisterDialogOpen] =
    useState(false);

  // Role-based data fetching
  const isBusinessOwner = user?.role === "business_owner";
  const isFieldOfficer =
    user?.role === "field_officer" || user?.role === "super_admin";

  // Business owner hooks
  const {
    business,
    isLoading: businessLoading,
    createBusinessAsync: registerBusinessAsync,
    isCreating: isRegistering,
  } = useBusinessProfile(isBusinessOwner);
  const { applyForPermitAsync, isApplying } = useBusinessPermits();

  // Field officer hooks
  const { useGetBusinesses } = useFieldOfficerBusinesses(isFieldOfficer);
  const {
    data: businessesData,
    isLoading: businessesLoading,
    refetch: refetchBusinesses,
  } = useGetBusinesses();
  
  const businesses = useMemo(() => businessesData ?? [], [businessesData]);

  const { categories = [], isLoading: categoriesLoading } =
    useRevenueCategories("PERMIT");
  // const { wards } = useWards();

  // Business registration

  const PERMIT_TYPES = categories.map((ele) => ({
    type: ele.permitConfigs[0]?.name || ele.name,
    category: ele.permitConfigs[0]?.name?.split(" ")?.join("_") || ele.name,
    fee: ele.permitConfigs[0]?.baseAmount || 0,
    validity: 12,
    categoryId: ele.id,
  }));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PermitFormData>({
    resolver: zodResolver(permitSchema),
    defaultValues: {
      businessId: isBusinessOwner && business ? business.id : "",
      categoryId: "",
      validFrom: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    setValue("businessId", isBusinessOwner && business ? business.id : "");
  }, [isBusinessOwner, business, setValue]);

  // Business registration form
  const {
    register: registerBusiness,
    handleSubmit: handleRegisterBusiness,
    formState: { errors: registerErrors },
    reset: resetRegisterForm,
    setValue: setRegisterValue,
  } = useForm<BusinessRegistrationData>({
    resolver: zodResolver(businessRegistrationSchema),
    defaultValues: {
      businessName: "",
      ownerName: "",
      address: "",
      phone: "",
      email: "",
      category: "",
    }
  });

  const selectedCategory = watch("categoryId")
  const selectedBusinessId = watch("businessId");

  // Find selected business for field officer
  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId);

  // Find permit config based on selected type or category
  const permitConfig = PERMIT_TYPES.find(
    (p) => p.categoryId === selectedCategory,
  );

  // Filter businesses for field officer
  const filteredBusinesses = useMemo(() => {
    const q = businessSearch.trim().toLowerCase();
    if (!q) return [];
    return businesses.filter((b: Business) =>
      b.businessName?.toLowerCase().includes(q) ||
      b.ownerName?.toLowerCase().includes(q) ||
      b.phone.includes(businessSearch),
    );
  }, [businesses, businessSearch]);

  console.log(filteredBusinesses,"filteredBusinesses",businesses);
  

  const handleSelectBusiness = (business: Business) => {
    setValue("businessId", business.id);
    setBusinessSearch("");
    setShowBusinessSearch(false);
  };

  const handleClearBusiness = () => {
    setValue("businessId", "");
    setBusinessSearch("");
  };

  const onSubmit = async (data: PermitFormData) => {
    // For business owners, ensure they have a business
    // console.log(data,"here");
    if (isBusinessOwner && !business) {
      toast.error("Please register a business first");
      return;
    }

    // For field officers, ensure a business is selected
    if (isFieldOfficer && !data.businessId) {
      toast.error("Please select a business");
      return;
    }
    const res = await applyForPermitAsync({
      businessId: data.businessId,
      categoryId: data.categoryId as string,
      validFrom: data.validFrom,
    });

    if (res) {
      // toast.success("Permit application submitted. Proceed to payment.");
      // navigate({ to: "/dashboard/permits",res.data.id});
      navigate.push(`/dashboard/permits/${res.permit.id}`);
    }
  };

  const onRegisterBusiness = async (
    data: BusinessRegistrationData,
    e?: React.BaseSyntheticEvent,
  ) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      const result = await registerBusinessAsync({
        ...data,
        wardId: userWardId,
      });
      if (result) {
        // toast.success("Business registered successfully!");
        setIsRegisterDialogOpen(false);
        resetRegisterForm();
        // Refetch businesses list
        await refetchBusinesses();
        // Auto-select the newly registered business
        setValue("businessId", result.id);
        setBusinessSearch(result.businessName);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to register business");
    }
  };

  // Handle permit type change
  const handlePermitTypeChange = (categoryId: string) => {
    const permit = PERMIT_TYPES.find((p) => p.categoryId === categoryId);
    if (permit) {
      setValue("categoryId", categoryId);
    }
  };

  // Loading state
  if (businessLoading || businessesLoading || categoriesLoading) {
    return (
      <div>
        <PageHeader
          title="New Trade Permit Application"
          subtitle={`Submitting as ${user?.role || "user"}`}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Business owner without business
  // Add this state near the other useState declarations

  // Business owner without business - show registration dialog instead of redirect
  if (isBusinessOwner && !business) {
    return (
      <div>
        <PageHeader
          title="New Trade Permit Application"
          subtitle="Register your business first"
        />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            You need to register a business before applying for a permit.
          </p>
          <Dialog
            open={isOwnerRegisterDialogOpen}
            onOpenChange={setIsOwnerRegisterDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-gradient-hero">Register Business</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register Your Business</DialogTitle>
                <DialogDescription>
                  Register your business to start applying for permits.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleRegisterBusiness(onRegisterBusiness)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Business Name *</Label>
                    <Input
                      placeholder="Enter business name"
                      {...registerBusiness("businessName")}
                      className={
                        registerErrors.businessName ? "border-red-500" : ""
                      }
                    />
                    {registerErrors.businessName && (
                      <p className="text-xs text-red-500 mt-1">
                        {registerErrors.businessName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Owner Name *</Label>
                    <Input
                      placeholder="Full name of owner"
                      {...registerBusiness("ownerName")}
                      className={
                        registerErrors.ownerName ? "border-red-500" : ""
                      }
                    />
                    {registerErrors.ownerName && (
                      <p className="text-xs text-red-500 mt-1">
                        {registerErrors.ownerName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      placeholder="Phone number"
                      {...registerBusiness("phone")}
                      className={registerErrors.phone ? "border-red-500" : ""}
                    />
                    {registerErrors.phone && (
                      <p className="text-xs text-red-500 mt-1">
                        {registerErrors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Email Address *</Label>
                    <Input
                      placeholder="youremail@address.com"
                      type="email"
                      {...registerBusiness("email")}
                      className={registerErrors.email ? "border-red-500" : ""}
                    />
                    {registerErrors.email && (
                      <p className="text-xs text-red-500 mt-1">
                        {registerErrors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Business Address *</Label>
                    <Input
                      placeholder="Full business address"
                      {...registerBusiness("address")}
                      className={registerErrors.address ? "border-red-500" : ""}
                    />
                    {registerErrors.address && (
                      <p className="text-xs text-red-500 mt-1">
                        {registerErrors.address.message}
                      </p>
                    )}
                  </div>
                  {/* <div>
                    <Label>Ward *</Label>
                    <Input
                      value={userWardName || "Not assigned"}
                      disabled
                      className="bg-muted"
                    />
                  </div> */}
                  <div>
                    <Label>Business Category *</Label>
                    <Input
                      placeholder="e.g. Retail, Food, Services"
                      {...registerBusiness("category")}
                      className={
                        registerErrors.category ? "border-red-500" : ""
                      }
                    />
                    {registerErrors.category && (
                      <p className="text-xs text-red-500 mt-1">
                        {registerErrors.category.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>CAC Number</Label>
                    <Input
                      placeholder="CAC registration (optional)"
                      {...registerBusiness("cacNumber")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Brief description of the business"
                      {...registerBusiness("description")}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsOwnerRegisterDialogOpen(false);
                      resetRegisterForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isRegistering}>
                    {isRegistering ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Register Business"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="New Trade Permit Application"
        subtitle={
          isBusinessOwner
            ? `Applying as ${business?.businessName}`
            : "Apply for permit on behalf of a business"
        }
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <Card className="p-6 lg:col-span-2 space-y-4">
          <h3 className="font-semibold">Business Information</h3>

          {isBusinessOwner && business ? (
            // Business Owner View - Read-only business details
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Business Name">
                <Input
                  value={business.businessName}
                  disabled
                  className="bg-muted"
                />
                <input
                  type="hidden"
                  {...register("businessId")}
                  value={business.id}
                />
              </Field>
              <Field label="Owner Name">
                <Input
                  value={business.ownerName}
                  disabled
                  className="bg-muted"
                />
              </Field>
              <Field label="Phone Number">
                <Input value={business.phone} disabled className="bg-muted" />
              </Field>
              <Field label="Email Address">
                <Input value={business.email} disabled className="bg-muted" />
              </Field>
              <Field label="Business Address" className="md:col-span-2">
                <Input value={business.address} disabled className="bg-muted" />
              </Field>
              <Field label="Ward">
                <Input
                  value={business.ward?.name || "Not specified"}
                  disabled
                  className="bg-muted"
                />
              </Field>
              <Field label="Business Category">
                <Input
                  value={business.category}
                  disabled
                  className="bg-muted"
                />
              </Field>
              <Field label="CAC Number">
                <Input
                  value={business.cacNumber || "Not provided"}
                  disabled
                  className="bg-muted"
                />
              </Field>
              {business.description && (
                <Field label="Business Description" className="md:col-span-2">
                  <Textarea
                    value={business.description}
                    disabled
                    className="bg-muted"
                    rows={2}
                  />
                </Field>
              )}
            </div>
          ) : (
            // Field Officer View - Business search/selection with register option
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Search & Select Business *</Label>
                  <Dialog
                    open={isRegisterDialogOpen}
                    onOpenChange={setIsRegisterDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Register New Business
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Register New Business</DialogTitle>
                        <DialogDescription>
                          Register a new business in your ward before applying
                          for a permit.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={handleRegisterBusiness(onRegisterBusiness)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label>Business Name *</Label>
                            <Input
                              placeholder="Enter business name"
                              {...registerBusiness("businessName")}
                              className={
                                registerErrors.businessName
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {registerErrors.businessName && (
                              <p className="text-xs text-red-500 mt-1">
                                {registerErrors.businessName.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Owner Name *</Label>
                            <Input
                              placeholder="Full name of owner"
                              {...registerBusiness("ownerName")}
                              className={
                                registerErrors.ownerName ? "border-red-500" : ""
                              }
                            />
                            {registerErrors.ownerName && (
                              <p className="text-xs text-red-500 mt-1">
                                {registerErrors.ownerName.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Phone Number *</Label>
                            <Input
                              placeholder="Phone number"
                              {...registerBusiness("phone")}
                              className={
                                registerErrors.phone ? "border-red-500" : ""
                              }
                            />
                            {registerErrors.phone && (
                              <p className="text-xs text-red-500 mt-1">
                                {registerErrors.phone.message}
                              </p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <Label>Email Address *</Label>
                            <Input
                              placeholder="youremail@address.com"
                              type="email"
                              {...registerBusiness("email")}
                              className={
                                registerErrors.email ? "border-red-500" : ""
                              }
                            />
                            {registerErrors.email && (
                              <p className="text-xs text-red-500 mt-1">
                                {registerErrors.email.message}
                              </p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <Label>Business Address *</Label>
                            <Input
                              placeholder="Full business address"
                              {...registerBusiness("address")}
                              className={
                                registerErrors.address ? "border-red-500" : ""
                              }
                            />
                            {registerErrors.address && (
                              <p className="text-xs text-red-500 mt-1">
                                {registerErrors.address.message}
                              </p>
                            )}
                          </div>
                       
                          <div>
                            <Label>Business Category *</Label>
                            <Input
                              placeholder="e.g. Retail, Food, Services"
                              {...registerBusiness("category")}
                              className={
                                registerErrors.category ? "border-red-500" : ""
                              }
                            />
                            {registerErrors.category && (
                              <p className="text-xs text-red-500 mt-1">
                                {registerErrors.category.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>CAC Number</Label>
                            <Input
                              placeholder="CAC registration (optional)"
                              {...registerBusiness("cacNumber")}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Description</Label>
                            <Textarea
                              placeholder="Brief description of the business"
                              {...registerBusiness("description")}
                              rows={2}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setIsRegisterDialogOpen(false);
                              resetRegisterForm();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isRegistering}>
                            {isRegistering ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Registering...
                              </>
                            ) : (
                              "Register Business"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="relative mt-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by business name, owner, or phone..."
                        value={businessSearch}
                        onChange={(e) => {
                          setBusinessSearch(e.target.value);
                          setShowBusinessSearch(true);
                        }}
                        onFocus={() => setShowBusinessSearch(true)}
                        className="pl-9"
                      />
                    </div>
                    {selectedBusinessId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearBusiness}
                        className="h-10 px-3"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {showBusinessSearch &&
                    businessSearch &&
                    filteredBusinesses.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredBusinesses.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-0"
                            onClick={() => handleSelectBusiness(b)}
                          >
                            <div className="font-medium">{b.businessName}</div>
                            <div className="text-xs text-muted-foreground">
                              {b.ownerName} • {b.phone} • {b.address}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                  {showBusinessSearch &&
                    businessSearch &&
                    filteredBusinesses.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
                        No businesses found.
                        <button
                          type="button"
                          className="text-primary font-medium ml-1 hover:underline"
                          onClick={() => setIsRegisterDialogOpen(true)}
                        >
                          Register a new business?
                        </button>
                      </div>
                    )}
                </div>

                <input type="hidden" {...register("businessId")} />
                {errors.businessId && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.businessId.message}
                  </p>
                )}
              </div>

              {/* Selected business details */}
              {selectedBusiness && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Business Name
                      </p>
                      <p className="font-medium">
                        {selectedBusiness.businessName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <p className="font-medium">
                        {selectedBusiness.ownerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedBusiness.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium">{selectedBusiness.category}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedBusiness.address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4 h-fit">
          <h3 className="font-semibold">Permit Type</h3>

          <div>
            <Label>Select Permit Type *</Label>
            <Select onValueChange={handlePermitTypeChange}>
              <SelectTrigger
                className={errors.categoryId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Choose permit type" />
              </SelectTrigger>
              <SelectContent>
                {PERMIT_TYPES.map((p) => (
                  <SelectItem key={p.type} value={p.categoryId}>
                    {p.type}  -  ₦{p.fee.toLocaleString()}/year
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-xs text-red-500 mt-1">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <input type="hidden" {...register("categoryId")} />

          <div>
            <Label>Valid From (Optional)</Label>
            <Input type="date" {...register("validFrom")} className="mt-1.5" />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to start from today
            </p>
          </div>

          {permitConfig && (
            <div className="rounded-lg border border-border/50 p-4 bg-muted/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Permit Type</span>
                <span className="font-medium">{permitConfig.type}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Validity</span>
                <span>{permitConfig.validity} months</span>
              </div>
              <div className="flex justify-between text-lg mt-3 pt-3 border-t">
                <span className="font-semibold">Permit Fee</span>
                <span className="font-bold">
                  ₦{permitConfig.fee.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isApplying}
            className="w-full bg-gradient-hero shadow-elegant"
          >
            {isApplying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {isApplying
              ? "Submitting..."
              : "Submit Application & Generate Invoice"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            An invoice is generated immediately. Permit is issued automatically
            once payment is confirmed.
          </p>
        </Card>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
    </div>
  );
}

