"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/queries/useAuth";
import { FullPageLoader } from "@/components/ProtectedRoute";


export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<FullPageLoader title="password reset page" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

 function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { resetPasswordAsync, isResetPasswordLoading } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Redirect if token is missing
  useEffect(() => {
    if (!token) {
      toast.error("Missing reset token. Please request a new password reset.");
      // Optionally redirect after a delay
      // router.push("/forgot-password");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Token is missing. Please restart the reset process.");
      return;
    }

    try {
      await resetPasswordAsync({
        token,
        newPassword,
        confirmPassword,
      });
      // Success toast and navigation are handled inside the mutation's onSuccess
      // No need to manually navigate here; it redirects to login.
    } catch (err: any) {
      // Error toast is already shown by the mutation's onError
      // Set local error for UI feedback (optional)
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh p-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 mb-6"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold">IJEJU NORTHEAST PORTAL</span>
        </Link>

        <div className="bg-card border border-border/40 rounded-2xl p-6 md:p-8 shadow-elegant">
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter a new password for your account.
          </p>

          {!token && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              No reset token found. Please use the link from your email.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5"
                disabled={isResetPasswordLoading || !token}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5"
                disabled={isResetPasswordLoading || !token}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isResetPasswordLoading || !token}
              className="w-full bg-gradient-hero shadow-elegant"
            >
              {isResetPasswordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}