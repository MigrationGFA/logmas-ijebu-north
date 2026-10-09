"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  ClipboardList,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Clock,
    title: "Live Progress",
    desc: "Follow every stage from submission to document issuance.",
  },
  {
    icon: ShieldCheck,
    title: "No Sign-in Needed",
    desc: "Track instantly with the application number on your receipt.",
  },
  {
    icon: CheckCircle2,
    title: "Decisions at a Glance",
    desc: "See approvals, declines and payment status in one place.",
  },
];

export default function TrackIndexPage() {
  const router = useRouter();
  const [reference, setReference] = useState("");

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const next = reference.trim();
    if (next) router.push(`/track/${encodeURIComponent(next)}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="space-y-1.5 text-center">
          <Badge variant="outline" className="mx-auto text-xs gap-1">
            <ClipboardList className="h-3 w-3" /> Track My Application
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Follow Your Application
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Enter your application number to see live status — submitted, under
            review, decision and document issuance.
          </p>
        </div>

        <Card className="p-5 bg-gradient-card border-border/40 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="e.g. ODE-APP-2026-000101"
              className="font-mono text-sm"
              aria-label="Application reference"
            />
            <Button type="submit" className="bg-primary font-semibold shrink-0">
              <Search className="h-4 w-4 mr-1.5" /> Track
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Find this number on your payment receipt or application summary.
          </p>
        </Card>

        <div className="grid sm:grid-cols-3 gap-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-4 bg-gradient-card border-border/40">
              <Icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button asChild variant="outline" className="text-xs">
            <Link href="/services">
              Browse Services
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
