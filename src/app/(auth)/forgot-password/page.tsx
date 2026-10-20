"use client"
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useAuth } from "@/hooks/queries/useAuth";

export default function ForgotPassword() {
  const { forgotPassword, isForgotPasswordLoading, forgotPasswordError } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    try {
      await forgotPassword({ email });
      setSent(true);
      toast.success("Password reset link sent to your email");
    } catch (error: any) {
      // Error is handled by the mutation's onError, but we can also catch here
      // The toast is already shown in the mutation's onError
      // We'll just log it
      console.error(error);
    }
  };

  // Show error toast if mutation fails (optional, since mutation already shows toast)
  // We can use useEffect to react to error, but the mutation already shows toast.

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold">IJEJU NORTHEAST PORTAL</span>
        </Link>
        <div className="bg-card border border-border/40 rounded-2xl p-6 md:p-8 shadow-elegant">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sent
              ? "Check your inbox for reset instructions."
              : "Enter your email and we'll send you a reset link."}
          </p>
          {!sent ? (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  disabled={isForgotPasswordLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={isForgotPasswordLoading}
                className="w-full bg-gradient-hero shadow-elegant"
              >
                {isForgotPasswordLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          ) : (
            <div className="mt-6 p-4 rounded-lg bg-success/10 border border-success/30 text-sm">
              If an account exists with that email, a reset link has been sent. 
              <br />
              <span className="text-xs text-muted-foreground mt-1 block">
                (Check your spam folder if you don't see it.)
              </span>
            </div>
          )}
          <Link
            href="/login"
            className="mt-6 inline-flex items-center text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}