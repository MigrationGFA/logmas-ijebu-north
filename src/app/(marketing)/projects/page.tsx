"use client";

import React, { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Building2,
  Hammer,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  category: "Roads & Transport" | "Health & Sanitation" | "Agriculture & Markets" | "Education & Youth" | "Power & Infrastructure";
  ward: string;
  location: string;
  status: "Completed" | "Ongoing" | "Planning";
  completionDate: string;
  description: string;
  impact: string;
}

const PROJECTS: Project[] = [
  {
    id: "proj-1",
    title: "the LGA - Olodo Agrarian Corridor Road Grading & Culvert Construction",
    category: "Roads & Transport",
    ward: "Ward 1 (the LGA)",
    location: "the LGA Town - Olodo Farm Junction",
    status: "Completed",
    completionDate: "Q2 2026",
    description: "Full grading, drainage expansion, and reinforced concrete culvert installation to facilitate agricultural produce transport from rural farmlands to regional markets.",
    impact: "Reduces farm produce transit time by 45% for over 2,500 local farmers.",
  },
  {
    id: "proj-2",
    title: "Modernized Grain & Cassava Processing Depot and Cold Storage",
    category: "Agriculture & Markets",
    ward: "Ward 3 (Alabata)",
    location: "Alabata Central Market Area",
    status: "Ongoing",
    completionDate: "Q3 2026",
    description: "Construction of solar-powered grain storage facilities, automated cassava chipping machines, and hygienic produce drying sheds.",
    impact: "Prevents post-harvest losses and empowers local cooperative farmers.",
  },
  {
    id: "proj-3",
    title: "Solar Street Lighting Project across 10 Council Wards",
    category: "Power & Infrastructure",
    ward: "All 10 Wards",
    location: "Major Junctions, Markets & Secretariat Corridors",
    status: "Completed",
    completionDate: "Q1 2026",
    description: "Deployment of 350 integrated standalone all-in-one solar LED streetlights to illuminate key trading posts, police posts, and transit junctions.",
    impact: "Boosted nighttime economic activities and improved communal security.",
  },
  {
    id: "proj-4",
    title: "Rehabilitation & Solar Electrification of Itesi Primary Healthcare Centre",
    category: "Health & Sanitation",
    ward: "Ward 7 (Itesi / Camp)",
    location: "Itesi Healthcare Facility Complex",
    status: "Completed",
    completionDate: "Q2 2026",
    description: "Comprehensive structural overhaul, maternity ward refitting, installation of 5kVA solar inverter system, and provision of essential cold chain vaccine refrigerators.",
    impact: "Provides 24/7 reliable maternal and emergency pediatric care.",
  },
  {
    id: "proj-5",
    title: "Youth Digital Innovation & Technical Vocational Skill Centre",
    category: "Education & Youth",
    ward: "Ward 4 (Obantoko)",
    location: "Obantoko Youth Centre",
    status: "Ongoing",
    completionDate: "Q4 2026",
    description: "State-of-the-art computer training lab, coding bootcamps, automotive diagnostics workshops, and solar installation training facility.",
    impact: "Trains 1,200 youth annually in high-demand technological and trade crafts.",
  },
  {
    id: "proj-6",
    title: "Quarry Corridor Heavy-Duty Bypass Road Rehabilitation",
    category: "Roads & Transport",
    ward: "Ward 5 (Ilugun)",
    location: "Ilugun Mining Corridor",
    status: "Ongoing",
    completionDate: "Q3 2026",
    description: "Reinforced crushed-rock base and heavy-duty asphalt resurfacing to support granite haulage vehicles while protecting inner residential roads.",
    impact: "Eliminates heavy truck traffic through residential neighbourhoods.",
  },
];

export default function ProjectsPage() {
  const [filter, setFilter] = useState<string>("All");

  const categories = [
    "All",
    "Roads & Transport",
    "Health & Sanitation",
    "Agriculture & Markets",
    "Education & Youth",
    "Power & Infrastructure",
  ];

  const filtered = PROJECTS.filter((p) => filter === "All" || p.category === filter);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-mesh border-b border-border/40">
          <div className="container mx-auto px-4 py-16 md:py-20 text-center">
            <Badge variant="outline" className="mb-3">
              Infrastructure & Development
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Capital Projects in the Local Government
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-base">
              Tracking completed and ongoing public infrastructure projects, road rehabilitations, healthcare interventions, and agrarian empowerments across our 10 wards.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2 pb-3 mb-8">
            {categories.map((c) => (
              <Button
                key={c}
                variant={filter === c ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(c)}
                className="whitespace-nowrap text-xs font-medium"
              >
                {c}
              </Button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((proj) => (
              <Card key={proj.id} className="p-6 bg-gradient-card border-border/40 hover:shadow-elegant transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      variant={proj.status === "Completed" ? "default" : proj.status === "Ongoing" ? "secondary" : "outline"}
                      className={
                        proj.status === "Completed"
                          ? "bg-emerald-600 text-white"
                          : proj.status === "Ongoing"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          : ""
                      }
                    >
                      {proj.status === "Completed" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1 inline" />
                      )}
                      {proj.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">{proj.completionDate}</span>
                  </div>

                  <h3 className="font-bold text-base text-foreground leading-snug">{proj.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{proj.description}</p>

                  <div className="mt-4 pt-3 border-t border-border/40 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{proj.location} · <strong className="text-foreground">{proj.ward}</strong></span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 text-xs">
                      <div className="font-semibold text-foreground flex items-center gap-1 mb-0.5">
                        <TrendingUp className="h-3 w-3 text-emerald-600" /> Community Impact:
                      </div>
                      <div className="text-muted-foreground leading-relaxed">{proj.impact}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-border/40 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{proj.category}</span>
                  <Link href="/contact" className="text-primary font-medium inline-flex items-center gap-1 hover:underline">
                    Inquire <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
