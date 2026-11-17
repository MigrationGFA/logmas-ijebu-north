"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  CheckCircle2,
  Layers,
  AlertCircle,
  Shield,
} from "lucide-react";
import { useCreateService } from "@/hooks/queries/useServices";

interface CreateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const slugify = (val: string) =>
  val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export function CreateServiceModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateServiceModalProps) {
  const createServiceMutation = useCreateService();

  // Service creation is for field officer services only. Public-facing
  // services are created manually by the GFA team, so this form stays
  // minimal: a name, an optional description, and identifiers that are
  // generated from the name.
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const code = slugify(name);
  const revenueHead = code.toUpperCase();

  const resetForm = () => {
    setName("");
    setDescription("");
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError("Service Name is required.");
      return;
    }
    if (!code) {
      setValidationError(
        "Service Name must contain letters or numbers so a service code can be generated."
      );
      return;
    }

    const payload = {
      code,
      name: name.trim(),
      category: "OTHERS",
      revenueHead,
      description:
        description.trim() || `${name.trim()} field officer revenue service.`,
      requirements: [] as string[],
      estimatedDays: 3,
      certificateType: "NONE",
      supportsRenewal: false,
      isActive: true,
      foOnly: true,
    };

    try {
      await createServiceMutation.mutateAsync(payload);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("Create service failed:", err);
      setValidationError(
        err?.message || "Failed to create service. Please check your inputs."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Create Field Officer Service
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                New services created here are for field officers only and never
                appear on the public portal. Public services are added by the
                GFA team.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {validationError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="service-name" className="text-xs font-semibold">
                Service Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service-name"
                placeholder="e.g. Lock Up Shop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-sm bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="service-desc" className="text-xs font-semibold">
                Description (Optional)
              </Label>
              <Textarea
                id="service-desc"
                placeholder="What is this service for? Officers see this when collecting."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs bg-background min-h-[70px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="service-code" className="text-xs font-semibold">
                  Service Code (Slug)
                </Label>
                <Input
                  id="service-code"
                  value={code}
                  disabled
                  placeholder="Generated from the name"
                  className="h-9 text-xs font-mono bg-muted/40"
                />
                <span className="text-[10px] text-muted-foreground">
                  Generated automatically from the service name.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="revenue-head" className="text-xs font-semibold">
                  Revenue Head
                </Label>
                <Input
                  id="revenue-head"
                  value={revenueHead}
                  disabled
                  placeholder="Generated from the name"
                  className="h-9 text-xs font-mono uppercase bg-muted/40"
                />
                <span className="text-[10px] text-muted-foreground">
                  Generated automatically from the service name.
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-muted/20 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <span>
              This service is filed under Others, has no fixed fee and no
              document checklist. The collecting officer records the amount
              actually paid on each collection, and the treasurer confirms it.
              Only staff and field officers can see it.
            </span>
          </div>

          <DialogFooter className="pt-2 border-t flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createServiceMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createServiceMutation.isPending}
              className="text-xs font-semibold bg-primary gap-1.5"
            >
              {createServiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Service...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Create Service
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
