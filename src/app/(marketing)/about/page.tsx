
"use client"
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell, PageHero } from "@/components/page-shell";
import { LGA_CONFIG } from "@/config/lga.config";
import { useWards } from "@/hooks/queries/useWards";
import { Building2, Users, Target, Award, MapPin, Calendar, Crown, ScrollText } from "lucide-react";
import Link from "next/link";




const TIMELINE = [
  {
    year: "1976",
    title: "LGA Creation",
    desc: "the LGA created as a distinct administrative hub, headquartered in the LGA town.",
  },
  {
    year: "1992",
    title: "Institutional Growth",
    desc: "Expansion of federal institutions, agricultural research stations, and quarry mining.",
  },
  {
    year: "2018",
    title: "ICT & Revenue Modernization",
    desc: "First steps toward digital revenue collection, haulage tracking, and citizen services.",
  },
  {
    year: "2024",
    title: "LOGMAS Launch",
    desc: "Council goes fully digital across certificates, haulage passes, building permits, and complaints.",
  },
  {
    year: "2026",
    title: "Phase 2 Rollout",
    desc: "Digital demand notices, dynamic virtual accounts, online certificate verification and ward portals go live.",
  },
];

export default function AboutPage() {
  const { wards, count: wardCount } = useWards();
  return (
    <PageShell>
      <PageHero
        eyebrow="About the LGA"
        title="Rooted in agriculture & industry, building the future"
        subtitle={`${LGA_CONFIG.identity.fullName}  -  proudly headquartered in ${LGA_CONFIG.identity.headquarters}, ${LGA_CONFIG.identity.state}  -  combines rich cultural heritage with agricultural productivity, solid minerals, and modern digital public service.`}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-gradient-hero shadow-elegant">
            <Link href="/leadership">Meet our leadership</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/invest">Investor brief</Link>
          </Button>
        </div>
      </PageHero>

      <section className="container mx-auto px-4 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Building2,
              title: `${wardCount} Wards`,
              desc: "Politically organized for grassroots impact",
            },
            { icon: Users, title: "320K+ Citizens", desc: "Vibrant and industrious community" },
            { icon: Calendar, title: `Est. ${LGA_CONFIG.identity.establishedYear}`, desc: "Premier agricultural & quarry hub" },
            { icon: MapPin, title: `HQ: ${LGA_CONFIG.identity.headquarters}`, desc: "Central secretariat & council chamber" },
          ].map((s) => (
            <Card
              key={s.title}
              className="p-5 bg-gradient-card border-border/40 hover:shadow-elegant transition-smooth"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-bold text-xl">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-14 grid md:grid-cols-2 gap-10 items-start">
        <div>
          <Badge variant="outline">Our Story</Badge>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            A history of community pride & industrious growth
          </h2>
          <div className="mt-4 space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
            <p>
              {LGA_CONFIG.identity.fullName} was created in <b>{LGA_CONFIG.identity.establishedYear}</b> with its administrative headquarters in <b>{LGA_CONFIG.identity.headquarters}</b>. The LGA spans <b>{wardCount} political wards</b> and is home to a warm, industrious population.
            </p>
            <p>
              The LGA's economy is anchored by vast agricultural production (cassava, maize, poultry, cocoa), extensive granite quarrying and solid mineral processing, haulage corridors, tertiary education institutions, and a fast-growing digital SME ecosystem.
            </p>
            <p>
              Traditional institutions and royal obas remain strong pillars of community life, working hand-in-hand with the elected council to foster peace, security, and sustainable municipal development.
            </p>
          </div>
        </div>
        <Card className="p-6 bg-gradient-hero text-primary-foreground border-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Target className="h-5 w-5" /> Vision & Mission
          </h3>
          <div className="mt-4 space-y-4 text-sm opacity-95">
            <div>
              <div className="font-semibold">Vision</div>
              <p className="opacity-90">
                To create a better {LGA_CONFIG.identity.name} where every citizen has access to quality public services, economic opportunities and an enabling environment to live, work and prosper.
              </p>
            </div>
            {/* <div>
              <div className="font-semibold">Mission</div>
              <p className="opacity-90">
                Deliver every public service with dignity, speed and accountability  -  empowering citizens, farmers, businesses and investors to thrive across the LGA.
              </p>
            </div> */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { i: Award, t: "Integrity" },
                { i: Crown, t: "Heritage" },
                { i: ScrollText, t: "Transparency" },
                { i: Users, t: "Citizen-first" },
              ].map((v) => (
                <div
                  key={v.t}
                  className="p-3 rounded-lg bg-white/10 flex items-center gap-2 text-sm"
                >
                  <v.i className="h-4 w-4 text-gold" /> {v.t}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* <section className="bg-secondary/40 py-14">
        <div className="container mx-auto px-4">
          <Badge variant="outline">Timeline</Badge>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight mb-8">
            Milestones of progress
          </h2>
          <div className="relative pl-6 border-l-2 border-primary/30 space-y-6">
            {TIMELINE.map((t) => (
              <div key={t.year} className="relative">
                <div className="absolute -left-[31px] h-5 w-5 rounded-full bg-gradient-hero shadow-elegant" />
                <Card className="p-5 bg-background border-border/40">
                  <Badge className="bg-gold/15 text-gold-foreground border-gold/30">{t.year}</Badge>
                  <h3 className="mt-2 font-semibold">{t.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      <section className="container mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
          The {wardCount} political wards of {LGA_CONFIG.identity.name} LGA
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {wards.map((w) => (
            <Card
              key={w.id}
              className="p-4 bg-gradient-card border-border/40 hover:shadow-elegant transition-smooth flex items-center gap-3"
            >
              <MapPin className="h-4 w-4 text-primary" />{" "}
              <span className="font-medium text-sm">{w.name}</span>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

