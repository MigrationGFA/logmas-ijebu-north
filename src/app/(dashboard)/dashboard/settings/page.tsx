/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";

// shadcn/ui components
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Your existing imports (adjust paths)
import { useAuth } from "@/hooks/queries/useAuth";
import {
  useBankAccount,
  useSaveBankAccount,
} from "@/hooks/queries/useBankAccount";
import { ROLE_LABELS } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/shared";

// ---------- Profile Schema ----------
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  notifyByEmail: z.boolean(),
  notifyBySms: z.boolean(),
  notifyByInApp: z.boolean(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

// ---------- Password Schema ----------
const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { 
    user, 
    updateProfileAsync, 
    isUpdatingProfile, 
    logout,
    changePasswordAsync,
    isChangePasswordLoading 
  } = useAuth();

  // ---------- Profile form ----------
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
      notifyByEmail: user?.notifyByEmail ?? true,
      notifyBySms: user?.notifyBySms ?? true,
      notifyByInApp: user?.notifyByInApp ?? true,
    },
  });

  // ---------- LGA collection bank account (treasurer / admin only) ----
  const canManageBankAccount = ["treasurer", "lga_admin", "super_admin"].includes(
    user?.role ?? "",
  );
  const { bankAccount } = useBankAccount();
  const { saveBankAccount, isSavingBankAccount } = useSaveBankAccount();
  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
  });
  useEffect(() => {
    if (bankAccount) {
      setBankForm({
        bankName: bankAccount.bankName,
        accountName: bankAccount.accountName,
        accountNumber: bankAccount.accountNumber,
      });
    }
  }, [bankAccount]);
  const onBankAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBankAccount(bankForm);
  };

  const notifyByEmail = watch("notifyByEmail");
  const notifyBySms = watch("notifyBySms");
  const notifyByInApp = watch("notifyByInApp");

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileAsync(data);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  // ---------- Password form ----------
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePasswordAsync({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      toast.success("Password updated successfully");
      resetPassword();
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    }
  };

  if (!user) return null;

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, preferences and security"
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {canManageBankAccount && (
            <TabsTrigger value="bank-account">Bank Account</TabsTrigger>
          )}
        </TabsList>

        {/* ---------- PROFILE TAB ---------- */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Profile form */}
            <Card className="lg:col-span-2 p-6 bg-gradient-card border-border/40 space-y-5">
              <h3 className="font-semibold">Profile</h3>
              <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      {...register("firstName")}
                      className={`mt-1.5 ${errors.firstName ? "border-red-500" : ""}`}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      {...register("lastName")}
                      className={`mt-1.5 ${errors.lastName ? "border-red-500" : ""}`}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="mt-1.5 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <Label>Role</Label>
                  <Input
                    value={
                      ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] ||
                      user?.role ||
                      ""
                    }
                    disabled
                    className="mt-1.5 bg-muted"
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    {...register("phone")}
                    placeholder="+234 801 234 5678"
                    className={`mt-1.5 ${errors.phone ? "border-red-500" : ""}`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="bg-gradient-hero"
                  disabled={isUpdatingProfile || !isDirty}
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </form>
            </Card>

            {/* Right: Notifications + Account */}
            <div className="space-y-4">
              <Card className="p-5 bg-gradient-card border-border/40 space-y-4">
                <h3 className="font-semibold">Notifications</h3>
                <label className="flex items-center justify-between text-sm">
                  <span>Email notifications</span>
                  <Switch
                    checked={notifyByEmail}
                    onCheckedChange={(checked) =>
                      setValue("notifyByEmail", checked, { shouldDirty: true })
                    }
                  />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span>SMS notifications</span>
                  <Switch
                    checked={notifyBySms}
                    onCheckedChange={(checked) =>
                      setValue("notifyBySms", checked, { shouldDirty: true })
                    }
                  />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span>In-app alerts</span>
                  <Switch
                    checked={notifyByInApp}
                    onCheckedChange={(checked) =>
                      setValue("notifyByInApp", checked, { shouldDirty: true })
                    }
                  />
                </label>
              </Card>

              <Card className="p-5 bg-gradient-card border-border/40">
                <h3 className="font-semibold mb-3">Account</h3>
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4 mr-1.5" /> Sign out
                </Button>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ---------- SECURITY TAB ---------- */}
        <TabsContent value="security" className="mt-6">
          <Card className="max-w-md p-6 bg-gradient-card border-border/40 space-y-5">
            <h3 className="font-semibold">Change Password</h3>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  disabled={isChangePasswordLoading}
                  {...registerPassword("oldPassword")}
                  className={`mt-1.5 ${passwordErrors.oldPassword ? "border-red-500" : ""}`}
                />
                {passwordErrors.oldPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {passwordErrors.oldPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  disabled={isChangePasswordLoading}
                  {...registerPassword("newPassword")}
                  className={`mt-1.5 ${passwordErrors.newPassword ? "border-red-500" : ""}`}
                  />
                {passwordErrors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Confirm New Password</Label>
                <Input
                  disabled={isChangePasswordLoading}
                  type="password"
                  {...registerPassword("confirmPassword")}
                  className={`mt-1.5 ${passwordErrors.confirmPassword ? "border-red-500" : ""}`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="bg-gradient-hero"
                disabled={isChangePasswordLoading}
              >
                {isChangePasswordLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* ---------- BANK ACCOUNT TAB (treasurer / admin only) ---------- */}
        {canManageBankAccount && (
          <TabsContent value="bank-account" className="mt-6">
            <Card className="p-6 bg-gradient-card border-border/40 space-y-5 max-w-2xl">
              <div>
                <h3 className="font-semibold">LGA Collection Account</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The account field-officer collections are paid into. It is
                  shown on FO service invoices and sent to payers by SMS with
                  the amount and the officer&apos;s phone number. Keep it
                  current: whatever is saved here is what payers will use.
                </p>
              </div>
              <form onSubmit={onBankAccountSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankForm.bankName}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, bankName: e.target.value })
                    }
                    placeholder="e.g. Providus Bank"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={bankForm.accountName}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, accountName: e.target.value })
                    }
                    placeholder="e.g. Ijebu North East Local Government"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={bankForm.accountNumber}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="e.g. 0123456789"
                    inputMode="numeric"
                    required
                  />
                </div>
                <Button type="submit" disabled={isSavingBankAccount}>
                  {isSavingBankAccount ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : null}
                  Save Account
                </Button>
              </form>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}