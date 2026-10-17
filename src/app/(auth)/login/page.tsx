"use client";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, TEST_CREDENTIALS } from "@/lib/auth";
import { useAuth } from "@/hooks/queries/useAuth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FullPageLoader } from "@/components/ProtectedRoute";
import logo from "@/assets/logo.png";
import Image from "next/image";
import { LGA_CONFIG } from "@/config/lga.config";

export default function Page() {
  return (
    <Suspense fallback={<FullPageLoader title="login page" />}>
      <LoginPage />
    </Suspense>
  );
}

function LoginPage() {
  const { login, isLoggingIn, loginError, resendVerification, isVerifying } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const fill = (c: (typeof TEST_CREDENTIALS)[number]) => {
    setEmail(c.email);
    setPassword(c.password);
    login({ email: c.email, password: c.password });
  };

  const searchParams = useSearchParams();
  const reason = searchParams?.get("reason");
  const registered = searchParams?.get("registered");
  const emailParam = searchParams?.get("email");
  const verified = searchParams?.get("verified");

  useEffect(() => {
    if (reason === "suspended") {
      toast.error(
        `Your account has been suspended. Please contact ${LGA_CONFIG.identity.name} LGA Secretariat.`,
      );
    } else if (reason === "unverified") {
      const message = emailParam
        ? `Please verify your email address (${emailParam}) before signing in.`
        : "Please verify your email address before signing in.";
      setVerificationMessage(message);
      if (emailParam) setEmail(emailParam);
      toast.warning("Please verify your email to continue.");
    }
  }, [reason, emailParam]);

  useEffect(() => {
    // Check for registration or email verification messages
    if (registered === "true" && !verified) {
      const message = emailParam
        ? `A verification link has been sent to ${emailParam}. Please verify your email to access your account. If you do not see it in your inbox, please check your spam/junk folder.`
        : "Please verify your email address to access your account. A verification link has been sent to your email. If you do not see it in your inbox, please check your spam/junk folder.";
      setVerificationMessage(message);

      // Auto-fill email if provided
      if (emailParam) {
        setEmail(emailParam);
      }

      // Show toast notification
      toast.info("Verification email sent! Please check your inbox and spam folder.");

      // Clear the URL parameters after displaying the message
      const url = new URL(window.location.href);
      url.searchParams.delete("registered");
      // url.searchParams.delete("email");
      window.history.replaceState({}, "", url.toString());
    }
  }, [registered, emailParam, verified]);

  // Handle email verification success
  useEffect(() => {
    if (verified === "true") {
      const message =
        "Your email has been verified successfully! You can now sign in to your account.";
      setVerificationMessage(message);

      // Show success toast
      toast.success("Email verified successfully!");

      // Clear the verification parameter
      const url = new URL(window.location.href);
      // url.searchParams.delete("verified");
      window.history.replaceState({}, "", url.toString());
    }
  }, [verified]);

  useEffect(() => {
    if (loginError) {
      toast.error(loginError.message || "Invalid email or password");
    }
  }, [loginError]);

  // Clear verification message after 10 seconds or when user starts typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.id === "email") {
      setEmail(e.target.value);
    } else if (e.target.id === "password") {
      setPassword(e.target.value);
    }
    // Clear message when user starts typing
    if (verificationMessage) {
      setVerificationMessage(null);
    }
  };

  // Handle resend verification
  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address to resend verification.");
      return;
    }

    try {
      // Call your API to resend verification email
      await resendVerification({ email });
      toast.success(`Verification email resent to ${email}`);
    } catch (error) {
      toast.error("Failed to resend verification email. Please try again.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-hero text-primary-foreground p-12 flex-col justify-between">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <Link href="/" className="relative flex flex-col items-center gap-2.5 w-fit">
          <Image src={logo} alt="LOGMAS" className="h-12 w-12" />
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-background">
            {LGA_CONFIG.identity.name} Lga
          </div>
        </Link>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Building a Smarter Local Government
          </h1>
          <p className="opacity-90">
            Delivering transparent governance, digital public services, and
            sustainable development for every resident.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              { k: "150K+", v: "Population" },
              { k: "1976", v: "Established" },
              { k: "10", v: "Wards" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-xl bg-white/10 backdrop-blur p-3 border border-white/15"
              >
                <div className="text-xl font-bold">{s.k}</div>
                <div className="text-xs opacity-80">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs opacity-70">
          © {new Date().getFullYear()} {LGA_CONFIG.identity.name} LGA
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-hero flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">LOGMAS</span>
            </Link>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to continue to your dashboard.
            </p>
          </div>

          {/* Verification / Registration Message */}
          {verificationMessage && (
            <div
              className={`rounded-lg p-4 animate-in fade-in slide-in-from-top-3 duration-300 ${
                verified === "true"
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : "bg-amber-500/10 border border-amber-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {verified === "true" ? (
                    <svg
                      className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <MailCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      verified === "true"
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {verificationMessage}
                  </p>
                  {!verified && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                        Didn't receive the email?
                      </p>
                      <button
                        onClick={handleResendVerification}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Resend verification
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setVerificationMessage(null)}
                  className={`${
                    verified === "true"
                      ? "text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200"
                      : "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                  } transition-colors`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={handleInputChange}
                className="mt-1.5"
                disabled={isLoggingIn}
                placeholder="Enter your email address"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={handleInputChange}
                  className="pr-10"
                  disabled={isLoggingIn}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-hero shadow-elegant hover:shadow-glow transition-smooth"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing
                  in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>

          {process.env.NODE_ENV === "development" && (
            <Card className="p-4 bg-secondary/40 border-border/40">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase tracking-wider">
                  Demo accounts
                </div>
                <Badge variant="outline" className="text-[10px]">
                  click to login
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {TEST_CREDENTIALS.map((c) => (
                  <button
                    key={c.role}
                    type="button"
                    onClick={() => fill(c)}
                    className="text-left text-xs p-2 rounded-md bg-background hover:bg-primary hover:text-primary-foreground border border-border/60 transition-smooth"
                  >
                    {ROLE_LABELS[c.role]}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
