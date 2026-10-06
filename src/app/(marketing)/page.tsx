/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileBadge,
  Store,
  Truck,
  ScrollText,
  Receipt,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Quote,
  Calendar,
  TrendingUp,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Crown,
  Sprout,
  Camera,
  Home,
  Pickaxe,
  Clock,
  ShieldCheck,
  Beer,
  Tv,
} from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { SiteHeader, SiteFooter, NAVBAR_SERVICES } from "@/components/site-chrome";
import { useServices } from "@/hooks/queries/useServices";
import { usePublicNews } from "@/hooks/queries/useNews";
import { LGA_SERVICES } from "@/config/lgaServices";
import { SITE_CONTACT } from "@/config/siteContact";
import { LGA_CONFIG } from "@/config/lga.config";
import {
  STATS,
  SERVICES,
  // REVENUE_CHART,
  TESTIMONIALS,
  NEWS,
  LEADERSHIP,
  INVEST_OPPS,
  TOURISM,
  WARDS_INFO,
} from "@/config/lgaContent.config";
import bannerSecretariat from "@/assets/banner5.png";
import bannerOjudeOba from "@/assets/banner1.png";
import bannerMarket from "@/assets/banner2.png";
import bannerInfra from "@/assets/banner3.png";
import bannerFour from "@/assets/banner4.png";
import Link from "next/link";
import Image from "next/image";
import { Helmet } from "react-helmet-async";
import { PublicServiceApplyWidget } from "@/components/services/PublicServiceApplyWidget";
import { ServiceApplicationGuideSteps } from "@/components/services/ServiceApplicationGuideSteps";

const ICONS: Record<string, any> = {
  FileBadge,
  Store,
  Truck,
  ScrollText,
  Receipt,
  MessageSquare,
  Sprout,
  Home,
  Pickaxe,
};

function HomePage() {
  return (
    <>
      <Helmet>
        <title>
          {`Welcome to the Official Website of ${LGA_CONFIG.identity.fullName}, ${LGA_CONFIG.identity.state}, ${LGA_CONFIG.identity.country}.`}
        </title>
        <link rel="canonical" href={LGA_CONFIG.contact.portalUrl} />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">
          <HeroBanner />
          <ChairmanSection />
          <StatsSection />
          <ServicesSection />
          <WardsMap />
          {/* <QuickServicePaymentSection /> */}

          <FeaturedServices />
          <InvestSection />
          {/* <LeadershipPreview /> */}
          <NewsSection />
          {/* <Testimonials /> */}
          <CTASection />
          <ContactSection />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}

function HeroBanner() {
  const slides = [
    {
      img: bannerSecretariat,
      eyebrow: "Official Government Platform",
      title: `Building a Smarter ${LGA_CONFIG.identity.name} Local Government`,
      subtitle:
        "Delivering transparent governance, digital public services, and sustainable development for every resident",
      cta: { label: "Explore Our Local Government", to: "/dashboard" as const },
      alt: `${LGA_CONFIG.identity.fullName} Secretariat Complex, ${LGA_CONFIG.identity.state}`,
    },
    {
      img: bannerOjudeOba,
      eyebrow: "Agriculture & Rural Prosperity",
      title: "Growing Agriculture, Growing Prosperity",
      subtitle:
        `Supporting farmers, agribusinesses, food production, and rural development across ${LGA_CONFIG.identity.name} LGA.`,
      cta: { label: "Investment Opportunities", to: "/tourism" as const },
      alt: "Cultural parade and harvest celebrations",
    },
    {
      img: bannerInfra,
      eyebrow: "Education & Youth Development",
      title: "Empowering the Next Generation",
      subtitle:
        "Creating opportunities for education, digital skills, entrepreneurship, innovation, and youth empowerment.",
      cta: { label: "Youth Programs", to: "/projects" as const },
      alt: "Newly paved road with solar streetlights",
    },
    {
      img: bannerMarket,
      eyebrow: "Culture & Heritage",
      title: "Proud Heritage. Bright Future.",
      subtitle:
        "Celebrating our rich Egba Yoruba culture while embracing innovation, education, and economic growth.",
      cta: { label: "Discover Our Communities", to: "/invest" as const },
      alt: `Bustling ${LGA_CONFIG.identity.name} markets with traders and produce`,
    },
    {
      img: bannerFour,
      eyebrow: "Together We Move Forward",
      title: `One Community.
One Vision.
One Future.
`,
      subtitle:
        `Working together to build an inclusive, transparent, innovative, and prosperous ${LGA_CONFIG.identity.fullName}.`,
      cta: { label: `Meet the ${LGA_CONFIG.leadership.chairman.title}`, to: "/invest" as const },
      alt: `Bustling ${LGA_CONFIG.identity.name} market with traders and produce`,
    },
  ];

  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <section className="relative">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: 6000,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {slides.map((s, i) => (
            <CarouselItem key={s.title} className="pl-0 relative">
              <div className="relative h-[78vh] min-h-[520px] max-h-[760px] w-full overflow-hidden">
                <Image
                  src={s.img}
                  alt={s.alt}
                  width={1920}
                  height={1080}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="absolute inset-0 h-full w-full object-cover scale-105 animate-[fade-in_1s_ease-out]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-background/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="container mx-auto relative h-full px-4 flex items-center">
                  <div className="max-w-2xl space-y-5 animate-fade-up">
                    <Badge className="bg-secondary/90 text-primary border border-primary/30 backdrop-blur">
                      <Sparkles className="h-3 w-3 mr-1.5" />
                      {s.eyebrow}
                    </Badge>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                      {/* {s.title.includes("the LGA") ? (
                        <>
                          Modern public services for{" "}
                          <span className="text-gradient-primary">the LGA</span>
                        </>
                      ) : (
                        s.title
                      )} */}
                      {s.title}
                    </h1>
                    <p className="text-lg text-foreground/85 max-w-xl leading-relaxed">
                      {s.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button
                        asChild
                        size="lg"
                        className="bg-gradient-hero shadow-elegant hover:shadow-glow"
                      >
                        <Link href={s.cta.to}>
                          {s.cta.label}{" "}
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Link>
                      </Button>
                      {/* <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="bg-background/70 backdrop-blur"
                      >
                        <Link href="/login">Sign in</Link>
                      </Button> */}
                      <Button asChild size="lg" variant="ghost">
                        <Link href="/verify">Verify Certificate</Link>
                      </Button>
                    </div>
                    <div className="flex items-center gap-5 pt-3 text-sm text-foreground/80">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-success" /> Secure
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-success" />{" "}
                        Instant Receipts
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-success" /> 24/7
                        Access
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${current === i ? "w-8 bg-primary" : "w-2.5 bg-foreground/30 hover:bg-foreground/50"}`}
            />
          ))}
        </div>
      </Carousel>
    </section>
  );
}

function StatsSection() {
  const icons = [Icons.LandPlot, Icons.MapPinned, Building2];
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STATS.map((s, i) => {
          const Icon = icons[i];
          return (
            <Card
              key={s.label}
              className="p-5 bg-gradient-card border-border/40 hover:shadow-elegant transition-smooth"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                {/* <span className="text-xs font-semibold text-success">
                  {s.trend}
                </span> */}
              </div>
              <div className="mt-4 text-2xl md:text-3xl font-bold tracking-tight">
                {s.value}
              </div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

const SERVICE_ICON_MAP: Record<string, any> = {
  certificate_of_origin: FileBadge,
  club_registration: Users,
  cda_registration: Building2,
  farmers_registration: Sprout,
  environmental_sanitation: ShieldCheck,
  tenement_rate: Home,
  haulage_fees: Truck,
  liquor_licence: Beer,
  viewing_centre_licence: Tv,
  quarry_permit: Pickaxe,
  street_naming: MapPin,
  kiosk_licence: Store,
};

function ServicesSection() {
  
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

    const { services: servicesData, isLoading } = useServices();
  
    const displayServices = useMemo(() => {
      const list = Array.isArray(servicesData)
        ? servicesData
        : (servicesData as any)?.data || [];
      if (list && list.length > 0) {
        // i want to add icons to the list
        return list.map((s) => {
          const navService = NAVBAR_SERVICES.find((ns) => ns.id === s.code);
          return {
            ...s,
            icon: navService?.icon || Building2,
          };
        });
      }
      return [];
    }, [servicesData]);


  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    onSelect();
    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
      carouselApi.off("reInit", onSelect);
    };
  }, [carouselApi]);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background via-muted/20 to-background border-b border-border/40 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="mb-3 bg-primary/10 text-primary border-primary/20"
            >
              <Sparkles className="h-3 w-3 mr-1.5" /> Statutory Council Services
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything your council does  -  online
            </h2>
            <p className="mt-2.5 text-muted-foreground text-sm sm:text-base leading-relaxed">
              Explore all active local government statutory services. Apply,
              view required documents, pay official fees and track issuance in
              real time.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-end shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              disabled={!canScrollPrev}
              onClick={() => carouselApi?.scrollPrev()}
              aria-label="Previous services"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              disabled={!canScrollNext}
              onClick={() => carouselApi?.scrollNext()}
              aria-label="Next services"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              asChild
              size="sm"
              variant="default"
              className="ml-2 gap-1.5 shadow-sm"
            >
              <Link href="/services">
                All Services <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Carousel / Marquee Track */}
        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          plugins={[
            Autoplay({
              delay: 3200,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-3 sm:-ml-4">
            {displayServices.map((s) => {
              const Icon = SERVICE_ICON_MAP[s.id] || FileBadge;

               const processingTime =
                s.processingTime || (s.estimatedDays ? `${s.estimatedDays} Business Days` : "1 - 3 Business Days");
                  const fee = Number(
                                s.feeConfig?.amount ?? 0
                              );
              return (
                <CarouselItem
                  key={s.id}
                  className="pl-3 sm:pl-4 basis-[280px] sm:basis-[320px] lg:basis-[360px]"
                >
                  <Link
                    href={`/services/${s.id}`}
                    className="block h-full group"
                  >
                    <Card className="h-full flex flex-col justify-between p-5 sm:p-6 bg-card hover:bg-card/90 border-border/60 hover:border-primary/50 shadow-xs hover:shadow-elegant transition-all duration-300 rounded-2xl group-hover:-translate-y-1">
                      <div>
                        {/* Header: Icon & Category */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-xs">
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-medium bg-muted text-muted-foreground group-hover:text-foreground"
                          >
                            {s.category}
                          </Badge>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {s.name}
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {s.description}
                        </p>
                      </div>

                      {/* Footer: Timeline & Nav */}
                      <div className="mt-6 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-primary/70" />
                            {processingTime}
                          </span>
                          <span className="font-semibold text-foreground">
                            {fee > 0 ? `₦${fee.toLocaleString()}` : s.feeDescription || "Variable Tariff"}
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                          Apply & View Guide{" "}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

function QuickServicePaymentSection() {
  return (
    <section
      id="first-timer-apply"
      className="bg-muted/20 border-y border-border/40 py-16 md:py-20"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <Badge
            variant="outline"
            className="mb-3 bg-primary/10 text-primary border-primary/20"
          >
            <Sparkles className="h-3 w-3 mr-1" /> First-Timer Fast Application &
            Payment
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Apply & Pay for Any Council Service Online
          </h2>
          <p className="mt-3 text-muted-foreground text-sm">
            First-time applicants: Select your required statutory service, enter
            your details, see the fee, and make payment online. Your citizen
            portal account will be automatically created with login credentials
            sent to your email to continue your application on the dashboard.
          </p>
        </div>

        <PublicServiceApplyWidget
          initialServiceId="certificate_of_origin"
          showStepGuide={true}
        />
      </div>
    </section>
  );
}

function FeaturedServices() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="relative overflow-hidden p-8 md:p-10 bg-gradient-hero text-primary-foreground border-0">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
          <Badge className="bg-white/15 text-white border-white/20 backdrop-blur">
            Featured
          </Badge>
          <h3 className="mt-4 text-2xl md:text-3xl font-bold">
            State of Origin Certificate
          </h3>
          <p className="mt-2 opacity-90 max-w-md">
            Apply, pay, get reviewed by your LGA Admin and Ward Councillor, then
            download a QR-verified certificate  -  all online.
          </p>
          <Button
            asChild
            variant="secondary"
            className="mt-6 bg-gold text-gold-foreground hover:bg-gold/90"
          >
            <Link href="/services">
              Apply now <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </Card>
        <Card className="relative overflow-hidden p-8 md:p-10 bg-gradient-gold text-gold-foreground border-0">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <Badge className="bg-black/10 text-gold-foreground border-black/10">
            For Businesses
          </Badge>
          <h3 className="mt-4 text-2xl md:text-3xl font-bold">
            Demand Notices & Permits
          </h3>
          <p className="mt-2 opacity-90 max-w-md">
            Receive official demand notices in your dashboard, settle them
            online, and download verifiable digital receipts instantly.
          </p>
          <Button
            asChild
            className="mt-6 bg-foreground text-background hover:bg-foreground/90"
          >
            <Link href="/services">
              Register your business <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>
    </section>
  );
}

function NewsSection() {
  const { data, isLoading } = usePublicNews({ limit: 3 });
  const apiArticles = data?.data ?? [];
  const newsItems =
    apiArticles.length > 0
      ? apiArticles.map((a) => ({
          title: a.title,
          tag: a.tag,
          href: `/news/${a.slug}`,
          date: a.publishedAt
            ? new Date(a.publishedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—",
        }))
      : !isLoading
        ? NEWS.map((n) => ({ ...n, href: "/news" }))
        : [];

  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          <Badge variant="outline" className="mb-3">
            News & Events
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Latest from your council
          </h2>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {newsItems.map((n) => (
          <Card
            key={n.title}
            className="p-6 bg-gradient-card border-border/40 hover:shadow-elegant transition-smooth"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> {n.date}
              <Badge variant="outline" className="ml-auto">
                {n.tag}
              </Badge>
            </div>
            <h3 className="mt-3 font-semibold leading-snug">{n.title}</h3>
            <Link
              href={n.href}
              className="mt-4 inline-flex items-center text-sm text-primary font-medium gap-1 hover:gap-2 transition-all"
            >
              Read more <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-secondary/40 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="mb-3">
            Testimonials
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Trusted by citizens and businesses
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <Card
              key={t.name}
              className="p-6 bg-background border-border/40 hover:shadow-elegant transition-smooth"
            >
              <Quote className="h-6 w-6 text-gold" />
              <p className="mt-3 text-sm leading-relaxed">"{t.quote}"</p>
              <div className="mt-5 pt-5 border-t border-border/60">
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <Card className="relative overflow-hidden p-10 md:p-16 text-center bg-gradient-hero border-0 text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Ready to access government services online?
          </h2>
          <p className="mt-3 opacity-90 max-w-xl mx-auto">
            Create your account in under a minute. Citizens, businesses and
            council staff are all welcome.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold"
            >
              <Link href="/register">Create account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="container mx-auto px-4 py-16 md:py-20">
      <div className="grid md:grid-cols-3 gap-5">
        {[
          {
            icon: MapPin,
            title: "Visit us",
            lines: [SITE_CONTACT.secretariatAddress],
          },
          {
            icon: Phone,
            title: "Call us",
            lines: [SITE_CONTACT.phone, SITE_CONTACT.operatingDays],
          },
          {
            icon: Mail,
            title: "Email us",
            lines: [SITE_CONTACT.email, SITE_CONTACT.supportEmail],
          },
        ].map((c) => (
          <Card key={c.title} className="p-6 bg-gradient-card border-border/40">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <c.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold">{c.title}</h3>
            {c.lines.map((l) => (
              <div key={l} className="text-sm text-muted-foreground">
                {l}
              </div>
            ))}
          </Card>
        ))}
      </div>
    </section>
  );
}

function ChairmanSection() {
  const c = LEADERSHIP[0];
  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Badge variant="outline" className="mb-3">
          Welcome Address
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          A message from our Executive Chairman
        </h2>
      </div>
      <Card className="overflow-hidden border-border/40 bg-gradient-card shadow-elegant">
        <div className="grid md:grid-cols-5">
          {/* Executive Chairman Image: order-2 on mobile (shows below message), md:order-1 on desktop (left col) */}
          <div className="order-2 md:order-1 md:col-span-2 relative min-h-[380px] sm:min-h-[460px] md:min-h-[520px] bg-gradient-hero text-primary-foreground">
            {c.image && (
              <Image
                src={c.image}
                alt={`${c.name}, ${c.role}`}
                className="w-full h-full object-cover object-top absolute inset-0"
                loading="lazy"
                fill
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 text-white">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-gold" />
                <span className="text-xs uppercase tracking-wider opacity-90 font-medium">
                  {LGA_CONFIG.leadership.chairman.title}
                </span>
              </div>
              <div className="mt-1 font-bold text-lg leading-tight">
                {LGA_CONFIG.leadership.chairman.name}
              </div>
              <div className="text-xs text-white/80 mt-0.5">
                {LGA_CONFIG.identity.fullName} · {LGA_CONFIG.identity.state}
              </div>
            </div>
          </div>
          {/* Welcome Message Text: order-1 on mobile (shows before image), md:order-2 on desktop (right cols) */}
          <div className="order-1 md:order-2 md:col-span-3 p-6 sm:p-8 md:p-10">
            <Quote className="h-7 w-7 text-gold" />
            <div className="mt-3 space-y-4 text-sm md:text-base leading-relaxed text-foreground/90">
              <p>
                Dear citizens, residents, farmers, investors and friends of{" "}
                {LGA_CONFIG.identity.fullName},
              </p>
              <p>
                It is with profound humility and gratitude to Almighty God that
                I welcome you to the official digital home of {LGA_CONFIG.identity.fullName}, {LGA_CONFIG.identity.state}.
              </p>
              <p>
                Our administration is committed to building an {LGA_CONFIG.identity.name} where every
                community across our {LGA_CONFIG.wards.length} wards feels the impact of purposeful,
                people-centred governance. We remain focused on improving
                infrastructure, supporting our farmers, traders and youths,
                strengthening grassroots development and making government more
                accessible to all.
              </p>
              <p>
                This platform is part of our commitment to open, transparent and
                accessible governance. Here, you can learn about who we are,
                what we do, our leadership, communities, programmes and
                projects, while also accessing essential Local Government
                services such as Certificate of Origin, Business Permit, Haulage
                Pass, Building-related services, Demand Notices, payments,
                official receipts, complaints and other services.
              </p>
              <p>
                Through technology and initiatives like this platform, we are
                bringing government services closer to you - making them easier to
                access, more transparent and more convenient.
              </p>
              <p>
                I invite you to explore this portal, stay informed, access our
                services, engage with us and join us in building a greater{" "}
                {LGA_CONFIG.identity.name}.
              </p>
              <p>
                Together, with God&apos;s guidance and your support, {LGA_CONFIG.identity.fullName}{" "}
                will continue to rise.
              </p>
            </div>
            <div className="mt-6 pt-5 border-t border-border/40">
              <div className="font-semibold">
                {LGA_CONFIG.leadership.chairman.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {LGA_CONFIG.leadership.chairman.title}, {LGA_CONFIG.identity.fullName} · {LGA_CONFIG.identity.state}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-gradient-hero shadow-elegant">
                <Link href="/leadership">
                  Meet the leadership <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/about">About the LGA</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

function InvestSection() {
  return (
    <section className="bg-secondary/40 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <Badge variant="outline" className="mb-3">
              Invest in {LGA_CONFIG.identity.name} LGA
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              High-yield opportunities in Solid Minerals, Agro-processing & Real
              Estate
            </h2>
          </div>
          <Button asChild className="bg-gradient-hero shadow-elegant">
            <Link href="/invest">
              Explore all sectors <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INVEST_OPPS.slice(0, 6).map((o) => {
            const Icon = (Icons as any)[o.icon] ?? Sprout;
            return (
              <Card
                key={o.sector}
                className="p-6 bg-background border-border/40 hover:shadow-elegant transition-smooth"
              >
                <div className="h-11 w-11 rounded-xl bg-gold/15 text-gold-foreground flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{o.sector}</h3>
                  <Badge className="bg-success/10 text-success border-success/30">
                    ROI {o.roi}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{o.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CultureSection() {
  const palette = ["primary", "gold", "info"];
  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="grid lg:grid-cols-5 gap-8 items-center">
        <div className="lg:col-span-2">
          <Badge variant="outline" className="mb-3">
            Culture & Tourism
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            A living heritage worth visiting
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            From Arakanga Forest Reserve to traditional chieftaincy heritage,
            historic landmarks and unforgettable Egba cuisine  -  the LGA
            invites you to experience Yoruba culture at its richest.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild className="bg-gradient-hero shadow-elegant">
              <Link href="/tourism">Explore tourism</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/gallery">
                <Camera className="h-4 w-4 mr-1.5" /> Gallery
              </Link>
            </Button>
          </div>
        </div>
        <div className="lg:col-span-3 grid sm:grid-cols-3 gap-4">
          {TOURISM.slice(0, 3).map((t, i) => (
            <Card
              key={t.title}
              className="overflow-hidden border-border/40 bg-gradient-card"
            >
              <div
                className="h-32"
                style={{
                  background: `linear-gradient(135deg, color-mix(in oklab, var(--${palette[i]}) 70%, transparent), color-mix(in oklab, var(--gold) 40%, transparent))`,
                }}
              />
              <div className="p-4">
                <Badge variant="outline" className="text-xs">
                  {t.tag}
                </Badge>
                <h4 className="mt-2 font-semibold text-sm">{t.title}</h4>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function LeadershipPreview() {
  return (
    <section className="bg-secondary/40 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <Badge variant="outline" className="mb-3">
              Council Leadership
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              A team committed to service
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/leadership">
              View full council <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEADERSHIP.slice(0, 4).map((m) => (
            <Card
              key={m.name}
              className="p-5 bg-background border-border/40 hover:shadow-elegant transition-smooth text-center"
            >
              <div className="h-20 w-20 rounded-2xl bg-gradient-hero text-primary-foreground flex items-center justify-center font-bold text-xl mx-auto">
                {m.initials}
              </div>
              <div className="mt-3 font-semibold">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.role}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function WardsMap() {
  const [active, setActive] = useState(0);
  const ward = WARDS_INFO[active];
  return (
    <section className="bg-gradient-mesh border-y border-border/40 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="mb-3">
            Our {LGA_CONFIG.wards.length} Wards
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Explore {LGA_CONFIG.identity.fullName}
          </h2>
          <p className="mt-3 text-muted-foreground">
            A council of {LGA_CONFIG.wards.length} unique wards  -  each with its own agricultural,
            mineral, educational and cultural assets. Tap a ward to learn more.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-center">
          {/* Map */}
          <Card className="lg:col-span-3 p-4 md:p-6 bg-gradient-card border-border/40 shadow-elegant">
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[color-mix(in_oklab,var(--success)_8%,var(--background))]">
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="lgaFill" x1="0" y1="0" x2="1" y2="1">
                    <stop
                      offset="0%"
                      stopColor="color-mix(in oklab, var(--primary) 35%, transparent)"
                    />
                    <stop
                      offset="100%"
                      stopColor="color-mix(in oklab, var(--gold) 35%, transparent)"
                    />
                  </linearGradient>
                  <pattern
                    id="grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="color-mix(in oklab, var(--border) 50%, transparent)"
                      strokeWidth="0.2"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
                {/* Stylized LGA boundary */}
                <path
                  d="M 14,38 Q 18,18 38,16 Q 60,10 78,18 Q 92,26 90,46 Q 94,64 82,80 Q 66,92 46,90 Q 24,90 14,72 Q 8,56 14,38 Z"
                  fill="url(#lgaFill)"
                  stroke="var(--primary)"
                  strokeWidth="0.6"
                />
                {/* Internal ward boundary hints */}
                <g
                  stroke="color-mix(in oklab, var(--primary) 35%, transparent)"
                  strokeWidth="0.25"
                  fill="none"
                  strokeDasharray="1 1"
                >
                  <path d="M 50,16 L 50,90" />
                  <path d="M 14,48 L 90,48" />
                  <path d="M 30,16 L 38,90" />
                  <path d="M 70,16 L 62,90" />
                </g>
                {/* Ward markers */}
                {WARDS_INFO.map((w, i) => (
                  <g
                    key={w.name}
                    transform={`translate(${w.x} ${w.y})`}
                    className="cursor-pointer"
                    onClick={() => setActive(i)}
                  >
                    <circle
                      r={active === i ? 4.4 : 2.6}
                      fill={`var(--${w.accent})`}
                      opacity={active === i ? 0.25 : 0.18}
                    >
                      {active === i && (
                        <animate
                          attributeName="r"
                          values="3.2;5.4;3.2"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      )}
                    </circle>
                    <circle
                      r={active === i ? 2 : 1.6}
                      fill={`var(--${w.accent})`}
                      stroke="white"
                      strokeWidth="0.4"
                    />
                    <text
                      x={0}
                      y={-3}
                      textAnchor="middle"
                      fontSize={active === i ? "3" : "2.4"}
                      fontWeight={active === i ? 700 : 500}
                      fill="var(--foreground)"
                      style={{
                        paintOrder: "stroke",
                        stroke:
                          "color-mix(in oklab, var(--background) 80%, transparent)",
                        strokeWidth: 0.6,
                      }}
                    >
                      {w.name}
                    </text>
                  </g>
                ))}
                {/* Compass */}
                <g
                  transform="translate(90 10)"
                  fontSize="3"
                  fill="var(--muted-foreground)"
                >
                  <circle
                    r="3.6"
                    fill="color-mix(in oklab, var(--background) 80%, transparent)"
                    stroke="var(--border)"
                    strokeWidth="0.3"
                  />
                  <text textAnchor="middle" y="-1.2">
                    N
                  </text>
                  <path
                    d="M 0,-3 L 0,3"
                    stroke="var(--primary)"
                    strokeWidth="0.4"
                  />
                </g>
              </svg>
              <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-wider text-muted-foreground bg-background/70 backdrop-blur rounded-md px-2 py-1 border border-border/40">
                {LGA_CONFIG.identity.name} LGA · {LGA_CONFIG.identity.state}
              </div>
            </div>
          </Card>

          {/* Ward info panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 bg-gradient-card border-border/40 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(--${ward.accent}) 15%, transparent)`,
                    color: `var(--${ward.accent})`,
                  }}
                >
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Ward
                  </div>
                  <div className="text-xl font-bold">{ward.name}</div>
                </div>
                <Badge className="ml-auto" variant="outline">
                  {ward.population} residents
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ward.feature}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/leadership">Ward leadership</Link>
                </Button>
                {/* <Button asChild size="sm" variant="outline">
                  <Link href="/projects">Projects here</Link>
                </Button> */}
              </div>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
              {WARDS_INFO.map((w, i) => (
                <button
                  key={w.name}
                  onClick={() => setActive(i)}
                  className={`text-left px-3 py-2 rounded-lg border transition-smooth text-sm ${active === i ? "border-primary bg-primary/5 font-semibold" : "border-border/60 hover:border-primary/40 hover:bg-secondary/40"}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: `var(--${w.accent})` }}
                    />
                    {w.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePage;

