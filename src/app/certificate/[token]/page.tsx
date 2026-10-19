"use client";

import React from "react";
import { usePublicCertificate } from "@/hooks/queries/usePublicCertificate";
import { CertificateViewer } from "@/components/certificate/CertificateViewer";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Loader2, AlertCircle, FileQuestion, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { LGA_CONFIG } from "@/config/lga.config";

interface CertificatePublicPageProps {
  params: Promise<{ token: string }>;
}

export default function CertificatePublicPage({ params }: CertificatePublicPageProps) {
  const { token } = React.use(params);
  const { data: certificate, isLoading, error } = usePublicCertificate(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <div className="no-print">
          <SiteHeader />
        </div>
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="relative">
              <div className="w-24 h-24 relative flex items-center justify-center">
                <Image
                  src={LGA_CONFIG.branding.councilEmblemPath || LGA_CONFIG.branding.logoPath}
                  alt={LGA_CONFIG.identity.fullName}
                  width={80}
                  height={80}
                  className="object-contain animate-pulse opacity-80"
                  loading='eager'
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-serif font-bold text-slate-800 dark:text-slate-200">
                Verifying Official Certificate…
              </h2>
              <p className="text-xs text-muted-foreground">
                Retrieving statutory certificate record from {LGA_CONFIG.identity.fullName} registry.
              </p>
            </div>
          </div>
        </main>
        <div className="no-print">
          <SiteFooter />
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <div className="no-print">
          <SiteHeader />
        </div>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center border-2 border-destructive/20 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                  Certificate Not Found
                </h2>
                <p className="text-xs text-muted-foreground">
                  The requested certificate token <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{token}</span> could not be verified in the public registry.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
                <Button asChild variant="outline" className="flex-1 text-xs gap-1.5">
                  <Link href="/verify">
                    <Search className="w-3.5 h-3.5" /> Search Registry
                  </Link>
                </Button>
                <Button asChild className="flex-1 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white">
                  <Link href="/">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </main>
        <div className="no-print">
          <SiteFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/80 dark:bg-slate-950">
      <div className="no-print">
        <SiteHeader />
      </div>
      <main className="flex-1">
        <CertificateViewer certificate={certificate} showBackToDashboard={false} />
      </main>
      <div className="no-print">
        <SiteFooter />
      </div>
    </div>
  );
}
