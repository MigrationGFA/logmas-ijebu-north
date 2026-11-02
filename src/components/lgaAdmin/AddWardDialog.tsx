import React, { useEffect } from 'react'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
} from "lucide-react";
import { WardFormData, wardSchema } from "@/lib/schemas/wardSchemas";


function AddWardDialog({ onCreate, isCreating }: { onCreate: (data: WardFormData) => void; isCreating: boolean }) {
  const [open, setOpen] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,      // 👈 Watch the name field value
    setValue,   // 👈 Programmatically inject values into the form state
    formState: { errors },
  } = useForm<WardFormData>({
    resolver: zodResolver(wardSchema),
    defaultValues: { name: "", code: "INEC-", description: "" }, // Default prefix
  });

  // 1. Monitor the live user-typed input string context frames
  const watchedName = watch("name");

  // 2. Compute slug transforms and prefix constraints on-the-fly
  useEffect(() => {
    if (!watchedName) {
      setValue("code", "INEC-", { shouldValidate: true });
      return;
    }

    // Strip out non-alphanumeric symbols and spaces, then capitalize
    const cleanSlug = watchedName
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    // Limit length to keep database unique indexes safe if necessary
    const truncatedSlug = cleanSlug.slice(0, 4);

    setValue("code", `INEC-${truncatedSlug}-${Math.floor(Math.random()*10)+1}`, { shouldValidate: true });
  }, [watchedName, setValue]);

  const onSubmit = (data: WardFormData) => {
    onCreate(data);
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Ward
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Ward</DialogTitle>
          <DialogDescription>Add a new electoral ward to Ijebu North East LGA.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label>Ward Name *</Label>
            <Input 
              {...register("name")} 
              placeholder="e.g., Atan-Imuku" 
              className={errors.name ? "border-red-500" : ""} 
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Ward Code *</Label>
            <Input 
              {...register("code")} 
              placeholder="e.g., INEC-ATAN" 
              className={errors.code ? "border-red-500" : ""} 
              readOnly // 👈 Make it read-only so users don't break convention formats manually
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <Label>Description (Optional)</Label>
            <Textarea {...register("description")} placeholder="Key features, landmarks, etc..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Ward"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddWardDialog;