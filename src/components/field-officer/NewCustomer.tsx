import React from 'react';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useFieldOfficerBusinesses } from "@/hooks/queries/useFieldOfficer";
import { useWards } from "@/hooks/queries/useWards";
import { toast } from "sonner";

// Zod validation schema
const businessSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  category: z.string().min(1, "Business category is required"),
  description: z.string().optional(),
  cacNumber: z.string().optional(),
  wardId: z.string().min(1, "Please select a ward"),
});

type BusinessFormData = z.infer<typeof businessSchema>;

function AddCustomerDialog() {
  const [open, setOpen] = useState(false);
  const { registerBusinessAsync, isRegistering } = useFieldOfficerBusinesses(false);
  const { wards } = useWards();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: "",
      ownerName: "",
      phone: "",
      email: "",
      address: "",
      category: "",
      description: "",
      cacNumber: "",
      wardId: "",
    },
  });

  const wardId = watch("wardId");

  const onSubmit = (data: BusinessFormData) => {
    registerBusinessAsync(data, {
      onSuccess: () => {
        setOpen(false);
        reset();
        toast.success("Business registered successfully");
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to register business");
      },
    });
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-hero">
          <Plus className="h-4 w-4 mr-1.5" /> Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Business</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Business Name *</Label>
              <Input
                {...register("businessName")}
                className={errors.businessName ? "border-red-500 mt-1.5" : "mt-1.5"}
              />
              {errors.businessName && (
                <p className="text-xs text-red-500 mt-1">{errors.businessName.message}</p>
              )}
            </div>
            
            <div>
              <Label>Owner Name *</Label>
              <Input
                {...register("ownerName")}
                className={errors.ownerName ? "border-red-500 mt-1.5" : "mt-1.5"}
              />
              {errors.ownerName && (
                <p className="text-xs text-red-500 mt-1">{errors.ownerName.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Phone Number *</Label>
              <Input
                {...register("phone")}
                className={errors.phone ? "border-red-500 mt-1.5" : "mt-1.5"}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>
            
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                {...register("email")}
                className={errors.email ? "border-red-500 mt-1.5" : "mt-1.5"}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Business Category *</Label>
              <Input
                {...register("category")}
                placeholder="e.g., Retail, Manufacturing, Services"
                className={errors.category ? "border-red-500 mt-1.5" : "mt-1.5"}
              />
              {errors.category && (
                <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
              )}
            </div>
            
            <div>
              <Label>CAC Number (Optional)</Label>
              <Input
                {...register("cacNumber")}
                placeholder="RC 1234567"
                className="mt-1.5"
              />
            </div>
          </div>
          
          <div>
            <Label>Ward *</Label>
            <Select
              value={wardId}
              onValueChange={(value) => setValue("wardId", value)}
            >
              <SelectTrigger className={errors.wardId ? "border-red-500 mt-1.5" : "mt-1.5"}>
                <SelectValue placeholder="Select ward" />
              </SelectTrigger>
              <SelectContent>
                {wards.map((ward) => (
                  <SelectItem key={ward.id} value={ward.id}>
                    {ward.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.wardId && (
              <p className="text-xs text-red-500 mt-1">{errors.wardId.message}</p>
            )}
          </div>
          
          <div>
            <Label>Address *</Label>
            <Input
              {...register("address")}
              className={errors.address ? "border-red-500 mt-1.5" : "mt-1.5"}
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>
          
          <div>
            <Label>Description (Optional)</Label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1.5"
              placeholder="Brief description of the business"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isRegistering} className="bg-gradient-hero">
              {isRegistering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isRegistering ? "Registering..." : "Register Business"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddCustomerDialog;