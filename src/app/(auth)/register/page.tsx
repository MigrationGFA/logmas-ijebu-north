"use client";

import { toast } from "sonner";
import {
  ShieldCheck,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROLE_LABELS, type Role } from "@/lib/auth";
import { useAuth } from "@/hooks/queries/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import logo from "@/assets/logo.png";
import { formatAndValidateNigerianPhoneNumber } from "@/lib/helper";
import Image from "next/image";
import { LGA_CONFIG } from "@/config/lga.config";
// Form schema with validation including confirm password
const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    role: z.enum(["citizen", "business_owner"] as const),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { registerAsync: registerUser } = useAuth();
  const navigate = useRouter();
  const [isAnimating, setIsAnimating] = useState(null);
  const [step, setStep] = useState(1);
  const isAnimatingRef = useRef(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const dot1Ref = useRef<HTMLDivElement>(null);
  const dot2Ref = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setValue,
    watch,
    trigger,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      // phone: "",
      password: "",
      confirmPassword: "",
      role: "citizen",
    },
    mode: "onChange",
  });

  const selectedRole = watch("role");
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // ---- Initial mount: card entrance + set up step 1/2 layering ----
  useLayoutEffect(() => {
    if (!step1Ref.current || !step2Ref.current || !containerRef.current) return;

    // Both steps are stacked absolutely so we can crossfade/slide without a layout jump
    gsap.set(step2Ref.current, {
      autoAlpha: 0,
      x: 40,
      position: "absolute",
      inset: 0,
    });
    gsap.set(step1Ref.current, { autoAlpha: 1, x: 0, position: "relative" });

    // Lock the container to step 1's natural height, then let it animate from there
    const h = step1Ref.current.scrollHeight;
    gsap.set(containerRef.current, { height: h });

    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { autoAlpha: 0, y: 24, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" },
      );
    }
  }, []);

  const animateProgress = (toStep: number) => {
    if (progressFillRef.current) {
      gsap.to(progressFillRef.current, {
        width: toStep === 1 ? "0%" : "100%",
        duration: 0.5,
        ease: "power2.inOut",
      });
    }
    const activeDot = toStep === 1 ? dot1Ref.current : dot2Ref.current;
    if (activeDot) {
      gsap.fromTo(
        activeDot,
        { scale: 1 },
        {
          scale: 1.15,
          duration: 0.2,
          ease: "power2.out",
          yoyo: true,
          repeat: 1,
        },
      );
    }
  };

  // ---- Premium overlap transition between steps ----
  const animateStepTransition = (fromStep: number, toStep: number) => {
    const fromEl = fromStep === 1 ? step1Ref.current : step2Ref.current;
    const toEl = toStep === 1 ? step1Ref.current : step2Ref.current;
    const container = containerRef.current;
    if (!fromEl || !toEl || !container) return;

    setIsAnimating(true);
    const direction = toStep > fromStep ? 1 : -1;

    // Measure target height before it's visible so the container can grow/shrink smoothly
    gsap.set(toEl, {
      position: "absolute",
      inset: 0,
      autoAlpha: 0,
      x: direction * 40,
      scale: 0.99,
    });
    const targetHeight = toEl.scrollHeight;

    const tl = gsap.timeline({
      onComplete: () => {
        // Settle: outgoing step becomes the absolutely-positioned one, incoming becomes relative
        gsap.set(fromEl, { position: "absolute", inset: 0, autoAlpha: 0 });
        gsap.set(toEl, { position: "relative", clearProps: "transform" });
        setIsAnimating(false);
      },
    });

    tl.to(
      container,
      { height: targetHeight, duration: 0.45, ease: "power3.inOut" },
      0,
    );

    tl.to(
      fromEl,
      {
        autoAlpha: 0,
        x: -direction * 40,
        scale: 0.99,
        filter: "blur(4px)",
        duration: 0.35,
        ease: "power2.in",
      },
      0,
    );

    tl.to(
      toEl,
      {
        autoAlpha: 1,
        x: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.5,
        ease: "power3.out",
      },
      0.15,
    );

    // Gentle stagger-in for the fields of the incoming step
    const fields = toEl.querySelectorAll("[data-field]");
    if (fields.length) {
      tl.fromTo(
        fields,
        { autoAlpha: 0, y: 10 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          ease: "power2.out",
          stagger: 0.06,
        },
        0.2,
      );
    }

    animateProgress(toStep);
  };

  const handleNext = async () => {
    if (isAnimating) return;
    // Validate step 1 fields
    const step1Fields = ["firstName", "lastName", "email", "role"] as const;
    const valid = await trigger(step1Fields);

    if (valid) {
      setStep(2);
      animateStepTransition(1, 2);
    } else {
      toast.error("Please fill in all required fields correctly");
      if (step1Ref.current) {
        gsap.fromTo(
          step1Ref.current,
          { x: -6 },
          { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" },
        );
      }
    }
  };

  const handleBack = () => {
    if (isAnimating) return;
    setStep(1);
    animateStepTransition(2, 1);
  };

  const onSubmit = async (data: RegisterFormData) => {
    await registerUser(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
      },
      {
        onSuccess: () => {
          toast.success(
            "Account created successfully! Please verify your email.",
          );
          navigate.push(
            `/login?registered=true&email=${encodeURIComponent(data.email)}`,
          );
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create account");
        },
      },
    );
  };

  // Helper component for error tooltip
  const ErrorTooltip = ({ error }: { error?: { message?: string } }) => {
    if (!error?.message) return null;

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-help">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            className="max-w-[200px] bg-destructive text-destructive-foreground border-destructive"
          >
            <p className="text-xs">{error.message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh p-6">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="flex flex-col items-center justify-center gap-2 mb-2"
        >
          <Image src={logo} alt="LOGMAS" className="h-12 w-12" />
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            {LGA_CONFIG.identity.name}
          </div>
        </Link>

        <div
          ref={cardRef}
          className="bg-card border border-border/40 rounded-2xl p-6 md:p-8 shadow-elegant"
        >
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div
                  ref={dot1Ref}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors duration-300 ${
                    step >= 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  1
                </div>
                <div className="relative h-0.5 flex-1 bg-muted overflow-hidden rounded-full">
                  <div
                    ref={progressFillRef}
                    className="absolute inset-y-0 left-0 bg-primary rounded-full"
                    style={{ width: step >= 2 ? "100%" : "0%" }}
                  />
                </div>
                <div
                  ref={dot2Ref}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors duration-300 ${
                    step >= 2
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground ml-4">
              Step {step} of 2
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Animated height wrapper  -  no layout jump between steps */}
            <div ref={containerRef} className="relative overflow-hidden">
              {/* Step 1: Personal Information */}
              <div ref={step1Ref} className="space-y-4">
                <div data-field>
                  <h2 className="text-xl font-bold tracking-tight">
                    Personal Information
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tell us about yourself
                  </p>
                </div>

                <div data-field className="relative">
                  <Label htmlFor="firstName">First name *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      className={`transition-shadow focus:shadow-elegant ${
                        errors.firstName ? "border-destructive pr-10" : ""
                      }`}
                      aria-invalid={errors.firstName ? "true" : "false"}
                      placeholder="Enter your first name"
                    />
                    <ErrorTooltip error={errors.firstName} />
                  </div>
                </div>

                <div data-field className="relative">
                  <Label htmlFor="lastName">Last name *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      className={`transition-shadow focus:shadow-elegant ${
                        errors.lastName ? "border-destructive pr-10" : ""
                      }`}
                      aria-invalid={errors.lastName ? "true" : "false"}
                      placeholder="Enter your last name"
                    />
                    <ErrorTooltip error={errors.lastName} />
                  </div>
                </div>

                <div data-field className="relative">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className={`transition-shadow focus:shadow-elegant ${
                        errors.email ? "border-destructive pr-10" : ""
                      }`}
                      aria-invalid={errors.email ? "true" : "false"}
                      placeholder="Enter your email address"
                    />
                    <ErrorTooltip error={errors.email} />
                  </div>
                </div>

                <div data-field className="relative">
                  <Label>I am registering as *</Label>
                  <div className="relative mt-1.5">
                    <Select
                      value={selectedRole}
                      onValueChange={(v) =>
                        setValue("role", v as RegisterFormData["role"])
                      }
                    >
                      <SelectTrigger
                        className={`${errors.role ? "border-destructive" : ""}`}
                      >
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROLE_LABELS) as Role[])
                          .filter(
                            (ele) =>
                              ele === "citizen" || ele === "business_owner",
                          )
                          .map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <ErrorTooltip error={errors.role} />
                  </div>
                </div>

                <div data-field>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full gap-2 bg-gradient-hero shadow-elegant transition-transform duration-200 hover:scale-[1.015] active:scale-[0.98]"
                  >
                    Next Step <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Step 2: Password & Confirmation */}
              <div ref={step2Ref} className="space-y-4">
                <div data-field>
                  <h2 className="text-xl font-bold tracking-tight">
                    Secure Your Account
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Create a strong password
                  </p>
                </div>

                <div data-field className="relative">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      className={`transition-shadow focus:shadow-elegant ${
                        errors.password ? "border-destructive pr-10" : ""
                      }`}
                      aria-invalid={errors.password ? "true" : "false"}
                      placeholder="Create a strong password"
                    />
                    <ErrorTooltip error={errors.password} />
                  </div>
                  {password && password.length > 0 && password.length < 8 && (
                    <p className="text-sm text-amber-500 mt-1 animate-in fade-in duration-200">
                      Password must be at least 8 characters
                    </p>
                  )}
                  {password && password.length >= 8 && (
                    <p className="text-sm text-emerald-500 mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                      <CheckCircle2 className="h-3 w-3" /> Strong password
                    </p>
                  )}
                </div>

                <div data-field className="relative">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword")}
                      className={`transition-shadow focus:shadow-elegant ${
                        errors.confirmPassword ? "border-destructive pr-10" : ""
                      }`}
                      aria-invalid={errors.confirmPassword ? "true" : "false"}
                      placeholder="Confirm your password"
                    />
                    <ErrorTooltip error={errors.confirmPassword} />
                  </div>
                  {confirmPassword &&
                    password &&
                    confirmPassword === password && (
                      <p className="text-sm text-emerald-500 mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                        <CheckCircle2 className="h-3 w-3" /> Passwords match
                      </p>
                    )}
                </div>

                <div data-field className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 gap-2 transition-transform duration-200 hover:scale-[1.015] active:scale-[0.98]"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    className="flex-[2] gap-2 bg-gradient-hero shadow-elegant transition-transform duration-200 hover:scale-[1.015] active:scale-[0.98] disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        Create Account <ShieldCheck className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

