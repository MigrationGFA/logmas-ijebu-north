import { useMemo, useState } from "react";
import {
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  Users,
  Building2,
  Sprout,
  Home,
  Truck,
  Beer,
  Tv,
  Pickaxe,
  Store,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import Link from "next/link";
import { tokenManager } from "@/services/apiAuth";
import { SITE_CONTACT } from "@/config/siteContact";
import { LGA_CONFIG } from "@/config/lga.config";
import logo from "@/assets/logo.png";
import { useServices } from "@/hooks/queries/useServices";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const NAVBAR_SERVICES = [
  {
    id: "certificate_of_origin",
    icon: FileBadge,
  },
  {
    id: "club_registration",
    icon: Users,
  },
  {
    id: "cda_registration",
    name: "CDA Registration",
    desc: "Community Development Association recognition",
    icon: Building2,
    category: "Community",
  },
  {
    id: "farmers_registration",
    name: "Farmers Registration",
    desc: "Agricultural registry for LGA farmers",
    icon: Sprout,
    category: "Agriculture",
  },
  {
    id: "environmental_sanitation",
    name: "Sanitation Compliance",
    desc: "Commercial & residential hygiene audit",
    icon: ShieldCheck,
    category: "Certificates",
  },
  {
    id: "tenement_rate",
    name: "Tenement Rate",
    desc: "Property tax and annual rating assessment",
    icon: Home,
    category: "Rates & Levies",
  },
  {
    id: "haulage_fees",
    name: "Haulage Fees",
    desc: "Commercial transport & vehicle permits",
    icon: Truck,
    category: "Rates & Levies",
  },
  {
    id: "liquor_licence",
    name: "Liquor Licence",
    desc: "Alcohol dispensing statutory permit",
    icon: Beer,
    category: "Licences",
  },
  {
    id: "viewing_centre_licence",
    name: "Viewing Centre Licence",
    desc: "Commercial entertainment & video permit",
    icon: Tv,
    category: "Licences",
  },
  {
    id: "quarry_permit",
    name: "Quarry Fees & Permits",
    desc: "Mining, stone and granite extraction",
    icon: Pickaxe,
    category: "Permits",
  },
  {
    id: "street_naming",
    name: "Street Naming & Numbering",
    desc: "Official road naming & address registry",
    icon: MapPin,
    category: "Urban Dev",
  },
  {
    id: "kiosk_licence",
    name: "Kiosk Licence",
    desc: "Temporary retail kiosk and booth permits",
    icon: Store,
    category: "Licences",
  },
];

type NavItem = { to: string; label: string; desc?: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV: (NavItem | NavGroup)[] = [
  { to: "/", label: "Home" } as NavItem,
  {
    label: "Government",
    items: [
      {
        to: "/about",
        label: "About the LGA",
        desc: "History, wards, demographics",
      },
      { to: "/leadership", label: "Leadership", desc: "Chairman & council" },
      {
        to: "/departments",
        label: "Departments",
        desc: "Council departments & units",
      },
      // { to: "/notices", label: "Public Notices", desc: "Official announcements" },
    ],
  },
  {
    label: "Services",
    items: [
      {
        to: "/services",
        label: "All Services",
        desc: "Browse every digital service",
      },
      // { to: "/digital-services", label: "Digital Services", desc: "E-government portal" },
    ],
  },
  {
    label: "Invest & Visit",
    items: [
      {
        to: "/invest",
        label: "Investment Opportunities",
        desc: "Sectors & incentives",
      },
      {
        to: "/tourism",
        label: "Tourism & Culture",
        desc: "Heritage, festivals, places",
      },
      // { to: "/projects", label: "Projects", desc: "Ongoing & completed works" },
    ],
  },
  {
    label: "Resources",
    items: [
      { to: "/news", label: "News & Events", desc: "Updates from the council" },
      { to: "/track", label: "Track Application" } as NavItem,

      {
        to: "/verify",
        label: "Verify Certificate",
        desc: "Authenticate documents",
      },
      // { to: "/gallery", label: "Media Gallery", desc: "Photos & moments" },
      // { to: "/downloads", label: "Downloads", desc: "Official documents" },
      // { to: "/procurement", label: "Procurement", desc: "Open tenders & bids" },
      // { to: "/careers", label: "Careers", desc: "Work with the LGA" },
      { to: "/faq", label: "FAQ", desc: "Common questions" },
    ],
  },
  {
    label: "Contact",
    items: [
      {
        to: "/contact",
        label: "Contact Us",
        desc: "Get in touch with the council",
      },
      {
        to: "/complaints",
        label: "Complaints & Support",
        desc: "Raise an issue",
      },
      // { to: "/gallery", label: "Media Gallery", desc: "Photos & moments" },
      // { to: "/downloads", label: "Downloads", desc: "Official documents" },
      // { to: "/procurement", label: "Procurement", desc: "Open tenders & bids" },
    ],
  },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const isAuthenticated = !!tokenManager.getAccessToken();

  const { services: servicesData, isLoading } = useServices();

  const services = useMemo(() => {
    const list = Array.isArray(servicesData)
      ? servicesData.sort((a: any, b: any) => {
          const aIsCoo = a.id === "state_of_origin" || a.code === "state_of_origin";
          const bIsCoo = b.id === "state_of_origin" || b.code === "state_of_origin";
          if (aIsCoo && !bIsCoo) return -1;
          if (!aIsCoo && bIsCoo) return 1;
          return 0;
        })
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

  return (
    <>
      <div className="hidden md:block bg-primary text-primary-foreground text-xs">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-5 opacity-90">
            <a
              href={SITE_CONTACT.phoneTel}
              className="flex items-center gap-1.5 hover:underline transition-all"
            >
              <Phone className="h-3 w-3" /> {SITE_CONTACT.phone}
            </a>
            <a
              href={SITE_CONTACT.emailMailto}
              className="flex items-center gap-1.5 hover:underline transition-all"
            >
              <Mail className="h-3 w-3" /> {SITE_CONTACT.email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[11px] opacity-80">
              {SITE_CONTACT.operatingDays}
            </div>
            <LanguageSwitcher
              variant="compact"
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
            />
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative flex items-center justify-center rounded-xl bg-white shadow-elegant group-hover:scale-105 transition-bounce w-10 h-10 overflow-hidden">
              <Image
                src={logo}
                alt={`${LGA_CONFIG.identity.name} Logo`}
                className="h-8 w-8"
                fill
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">
                {LGA_CONFIG.identity.name} LGA
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {LGA_CONFIG.identity.state} · Official Portal
              </div>
            </div>
          </Link>

          <nav
            className="hidden lg:flex items-center gap-1"
            onMouseLeave={() => setHovered(null)}
          >
            {NAV.map((n) => {
              if ("to" in n) {
                return (
                  <Link
                    key={n.label}
                    href={n.to}
                    onMouseEnter={() => setHovered(null)}
                    className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-smooth rounded-md"
                  >
                    {n.label}
                  </Link>
                );
              }

              const isOpen = hovered === n.label;
              const isServices = n.label === "Services";

              return (
                <div
                  key={n.label}
                  className="relative"
                  onMouseEnter={() => setHovered(n.label)}
                >
                  <button
                    className={`px-3 py-2 text-sm font-medium rounded-md inline-flex items-center gap-1 transition-smooth ${
                      isOpen
                        ? "text-primary font-semibold"
                        : "text-foreground/70 hover:text-primary"
                    }`}
                  >
                    {n.label}{" "}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Services 2-Column Mega Dropdown */}
                  {isOpen && isServices && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-[680px] xl:w-[720px] animate-fade-in z-50">
                      <div className="rounded-2xl border border-border/70 bg-background/95 backdrop-blur-md shadow-2xl p-4 overflow-hidden">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/50 px-1">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">
                              Statutory Council Services
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Select any LGA service to view requirements, fees,
                              and apply online
                            </p>
                          </div>
                          {/* <Badge
                            variant="outline"
                            className="text-[11px] font-normal"
                          >
                            12 Services
                          </Badge> */}
                        </div>

                        {/* 2-Column List of Services */}
                        <div className="grid grid-cols-2 gap-2">
                          {isLoading ? (
                            <>
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2.5 p-2 rounded-xl"
                                >
                                  <div className="h-8 w-8 rounded-lg bg-muted animate-pulse shrink-0" />
                                  <div className="min-w-0 flex-1 space-y-2">
                                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                                    <div className="h-2 bg-muted rounded animate-pulse w-full" />
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            services?.map((s) => {
                              const Icon = s.icon;
                              return (
                                <Link
                                  key={s.id}
                                  href={`/services/${s.id}`}
                                  onClick={() => setHovered(null)}
                                  className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-muted/80 border border-transparent hover:border-border/60 transition-all"
                                >
                                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                        {s?.name}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                      {s?.description}
                                    </p>
                                  </div>
                                </Link>
                              );
                            })
                          )}
                        </div>

                        {/* Dropdown Footer Action Bar */}
                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between px-2 text-xs">
                          <Link
                            href="/services"
                            onClick={() => setHovered(null)}
                            className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Browse All Services Directory{" "}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                          <Link
                            href="/verify"
                            onClick={() => setHovered(null)}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          >
                            <ShieldCheck className="h-3 w-3 text-primary" />{" "}
                            Verify Certificate
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Standard Dropdown for other groups */}
                  {isOpen && !isServices && (
                    <div className="absolute left-0 top-full pt-2 w-[340px] animate-fade-in z-50">
                      <div className="rounded-xl border border-border/60 bg-background shadow-elegant p-2 grid">
                        {n.items.map((it) => (
                          <Link
                            key={it.to}
                            href={it.to}
                            onClick={() => setHovered(null)}
                            className="rounded-lg px-3 py-2.5 hover:bg-secondary transition-smooth"
                          >
                            <div className="text-sm font-semibold">
                              {it.label}
                            </div>
                            {it.desc && (
                              <div className="text-xs text-muted-foreground">
                                {it.desc}
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher variant="default" />
            {isAuthenticated ? (
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
            <Button
              asChild
              size="sm"
              className="bg-gradient-hero shadow-elegant hover:shadow-glow transition-smooth"
            >
              <Link href="/register">Citizen Portal</Link>
            </Button>
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-border/40 bg-background max-h-[80vh] overflow-y-auto">
            <div className="container mx-auto flex flex-col gap-1 p-4">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/40">
                <span className="text-xs font-semibold text-muted-foreground">
                  Select Language / Yan Èdè
                </span>
                <LanguageSwitcher variant="compact" />
              </div>
              {NAV.flatMap((n) => ("to" in n ? [n] : n.items)).map((l) => (
                <Link
                  key={l.to}
                  href={l.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  {l.label}
                </Link>
              ))}
              <div className="flex gap-2 pt-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild className="flex-1 bg-gradient-hero">
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 px-4 py-14">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white overflow-hidden relative shadow-elegant">
              <Image
                src={logo}
                alt={`${LGA_CONFIG.identity.name} Logo`}
                className="h-8 w-8"
                fill
              />
            </div>
            <div>
              <div className="font-bold">{LGA_CONFIG.identity.fullName}</div>
              <div className="text-[10px] uppercase tracking-wider opacity-70">
                {LGA_CONFIG.identity.state}, {LGA_CONFIG.identity.country}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm opacity-70 max-w-md leading-relaxed">
            The official digital home of {LGA_CONFIG.identity.fullName} -
            bringing transparent governance, modern services and economic
            opportunity to every citizen, business and investor.
          </p>
          <div className="mt-5 space-y-2 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> {SITE_CONTACT.shortAddress}
            </div>
            <a
              href={SITE_CONTACT.phoneTel}
              className="flex items-center gap-2 hover:underline"
            >
              <Phone className="h-3.5 w-3.5" /> {SITE_CONTACT.phone}
            </a>
            <a
              href={SITE_CONTACT.emailMailto}
              className="flex items-center gap-2 hover:underline"
            >
              <Mail className="h-3.5 w-3.5" /> {SITE_CONTACT.email}
            </a>
          </div>
          {/* <div className="mt-5 flex gap-3 opacity-80">
            <FaFacebookF className="h-4 w-4" />
            <FaTwitter className="h-4 w-4" />
            <FaInstagram className="h-4 w-4" />
            <FaYoutube className="h-4 w-4" />
          </div> */}
        </div>
        <FooterCol
          title="Government"
          links={[
            { to: "/about", label: "About" },
            { to: "/leadership", label: "Leadership" },
            { to: "/departments", label: "Departments" },
            // { to: "/notices", label: "Public Notices" },
            // { to: "/projects", label: "Projects" },
          ]}
        />
        <FooterCol
          title="Services"
          links={[
            { to: "/services", label: "All Services" },
            // { to: "/digital-services", label: "Digital Services Portal" },
            { to: "/verify", label: "Verify Certificate" },
            { to: "/complaints", label: "Complaints" },
            // { to: "/login", label: "Sign in" },
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
            { to: "/invest", label: "Invest" },
            { to: "/tourism", label: "Tourism & Culture" },
            { to: "/news", label: "News & Events" },
            // { to: "/gallery", label: "Gallery" },
            // { to: "/downloads", label: "Downloads" },
            // { to: "/careers", label: "Careers" },
            // { to: "/procurement", label: "Procurement" },
            { to: "/faq", label: "FAQ" },
            { to: "/contact", label: "Contact" },
          ]}
        />
      </div>
      <div className="border-t border-sidebar-border/40">
        <div className="container mx-auto px-4 py-5 text-xs opacity-60 flex flex-col md:flex-row justify-between gap-2">
          <span>
            Â© {new Date().getFullYear()} {LGA_CONFIG.identity.fullName},{" "}
            {LGA_CONFIG.identity.state}. All rights reserved.
          </span>
          <span>Official Website · {LGA_CONFIG.identity.fullName}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="font-semibold mb-3 text-sm">{title}</h4>
      <ul className="space-y-2 text-sm opacity-80">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link href={l.to} className="hover:opacity-100 hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
