"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Plus, KeyRound, ShieldOff, Loader2, UserX, Power } from "lucide-react";
import {
  useAccountManagement,
  useGetWards,
  useStaffManagement,
} from "@/hooks/queries/useLgaAdmin";
import { ROLE_LABELS, MANAGEABLE_ROLES, Role } from "@/lib/auth";
import { Textarea } from "../ui/textarea";
import { Account } from "@/services/apiLgaAdmin";

// Account Creation Schema
const createAccountSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    role: z.string().min(1, "Role is required"),
    wardId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // A field officer's phone is required: the payment SMS tells payers
    // to send their transfer receipt to the officer's number.
    if (data.role === "field_officer" && !data.phone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required for field officers",
        path: ["phone"],
      });
    }
  });
  // .refine(
  //   (data) => {
  //     const requiresWard = ["ward_councillor", "field_officer"].includes(
  //       data.role,
  //     );
  //     return !requiresWard || !!data.wardId;
  //   },
  //   {
  //     message: "Ward is required for this role",
  //     path: ["wardId"],
  //   },
  // );

type CreateAccountFormData = z.infer<typeof createAccountSchema>;

export function CreateAccountDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { createStaffAsync, isCreating } = useStaffManagement();
  const { data: wardsData } = useGetWards({ limit: 100 });
  const wardList = wardsData ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema) as Resolver<CreateAccountFormData>,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "field_officer",
      wardId: "",
    },
  });

  const selectedRole = watch("role");
  const showWardField = ["ward_councillor", "field_officer"].includes(
    selectedRole,
  );

  const onSubmit = async (data: CreateAccountFormData) => {
    // console.log(showWardField, "showWardField");
    // if (showWardField && !data.wardId) {
    //   toast.error("Please select a ward for the selected role.");
    //   return;
    // }
    const res = await createStaffAsync({
      ...data,
      role: data.role as any,
    });

    if (res) {
      setOpen(false);
      reset();
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-hero shadow-elegant">
          <Plus className="h-4 w-4 mr-1.5" /> New Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Principal Officer Account</DialogTitle>
          <DialogDescription>
            Provision a new account. Login credentials will be emailed to the
            user.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input
                {...register("firstName")}
                className={
                  errors.firstName ? "border-red-500 mt-1.5" : "mt-1.5"
                }
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                {...register("lastName")}
                className={errors.lastName ? "border-red-500 mt-1.5" : "mt-1.5"}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              {...register("email")}
              className={errors.email ? "border-red-500 mt-1.5" : "mt-1.5"}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <Label>
              {selectedRole === "field_officer" ? "Phone *" : "Phone (Optional)"}
            </Label>
            <Input {...register("phone")} className="mt-1.5" />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Role *</Label>
              <Select
                onValueChange={(v) => setValue("role", v)}
                defaultValue="field_officer"
              >
                <SelectTrigger
                  className={errors.role ? "border-red-500 mt-1.5" : "mt-1.5"}
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {MANAGEABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r as keyof typeof ROLE_LABELS] || r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>
            {/* {showWardField && (
              <div>
                <Label>Ward</Label>
                <Select onValueChange={(v) => setValue("wardId", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select ward" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="l">None</SelectItem>
                    {wardList?.map((ward) => (
                      <SelectItem key={ward.id} value={ward.id}>
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.wardId && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.wardId.message}
                  </p>
                )}
              </div>
            )} */}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-gradient-hero"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1.5" />
              )}
              {isCreating ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ResetPasswordDialog({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);

  const { resetPasswordAsync, isResetting } = useAccountManagement();

  const handleResetPassword = async (id: string) => {
    await resetPasswordAsync(id, {
      onSuccess: () => {
        toast.success(
          "Password reset successfully. The user will receive an email with instructions.",
        );
        setOpen(false);

        // refetch();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={account.isReset}
        >
          <KeyRound className="h-3.5 w-3.5 mr-1" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for {account.name}?</DialogTitle>
          <DialogDescription>
            A secure password-reset link will be emailed to{" "}
            <span className="font-medium">{account.email}</span>. The user must
            set a new password before signing in again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button
            className="bg-gradient-hero"
            onClick={() => handleResetPassword(account.id)}
            disabled={isResetting}
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4 mr-1.5" />
            )}
            Send reset link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SuspendAccountDialog({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { toggleStaffStatusAsync, isToggling: isSuspending } =
    useStaffManagement();

  const handleSuspend = async (id: string, reason?: string) => {
    if (account.status === "active" && !reason?.trim()) {
      toast.warning("Provide a reason for suspension");
      return;
    }

    try {
      await toggleStaffStatusAsync(
        { id, reason },
        {
          onSuccess() {
            setOpen(false);
            setReason("");
          },
        },
      );
      // toast.success(`Account suspended: ${reason}`);
    } catch (error) {
      toast.error("Failed to suspend account");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason("");
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          // disabled={account.status === "suspended"}
        >
          {account.status === "active" ? (
            <>
              <ShieldOff className="h-3.5 w-3.5 mr-1" />
            </>
          ) : (
            <>
              <Power className="h-3.5 w-3.5 mr-1" />
            </>
          )}
          {/* Suspend */}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {account.status === "active"
              ? `Suspend account for ${account.name}?`
              : `Reactivate account for ${account.name}?`}
          </DialogTitle>
          <DialogDescription>
            {account.status === "active"
              ? "This will immediately suspend the account and prevent the user from accessing the system. The user will receive a notification about this action."
              : "This will reactivate the account and restore the user's access to the system."}
          </DialogDescription>
        </DialogHeader>

        {account.status === "active" && (
          <div className="space-y-2 mt-2">
            <Label htmlFor="reason">
              Reason for suspension <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Violation of terms, non-payment, fraudulent activity..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be recorded and visible to auditors.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={
              isSuspending || (account.status === "active" && !reason.trim())
            }
          >
            Cancel
          </Button>
          <Button
            variant={account.status === "active" ? "destructive" : "default"}
            onClick={() => handleSuspend(account.id, reason)}
            disabled={
              isSuspending || (account.status === "active" && !reason.trim())
            }
            className={account.status === "active" ? "" : "bg-gradient-hero"}
          >
            {isSuspending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : account.status === "active" ? (
              <UserX className="h-4 w-4 mr-1.5" />
            ) : (
              <Power className="h-4 w-4 mr-1.5" />
            )}
            {isSuspending
              ? account.status === "active"
                ? "Suspending..."
                : "Reactivating..."
              : account.status === "active"
                ? "Suspend Account"
                : "Reactivate Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


import { Mail, MailCheck } from "lucide-react"; // add Mail/MailCheck to your existing lucide import
import { useAuth } from "@/hooks/queries/useAuth";

export function ResendVerificationDialog({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const { resendVerification, isResending } = useAuth();

  const handleResend = async () => {
    try {
      await resendVerification({ email: account.email });
      toast.success(`Verification email sent to ${account.email}`);
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to resend verification email");
    }
  };

  const isNOtCitizenOrBo = account.role ==="citizen" as Role || account.role === "business_owner" as Role

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={!isNOtCitizenOrBo || !!account.emailVerified}>
          <MailCheck className="h-3.5 w-3.5 mr-1" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resend verification email to {account.name}?</DialogTitle>
          <DialogDescription>
            A new verification link will be emailed to{" "}
            <span className="font-medium">{account.email}</span>. Any previous
            link will still work until it expires.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isResending}
          >
            Cancel
          </Button>
          <Button
            className="bg-gradient-hero"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-1.5" />
            )}
            {isResending ? "Sending..." : "Send email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}