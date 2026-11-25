"use client";

/**
 * The dashboard header quick search.
 *
 * Searches the three things staff look up all day, using endpoints that
 * already exist: services by name (filtered on the services list),
 * applications by applicant name, number, NIN or phone (the server-side
 * list search), and invoices by number, payer or service (filtered on
 * the invoices hub list, the same fields the invoices page matches).
 * Results group by type and link straight to the record. Application
 * results land on the applications page with its search prefilled,
 * because application details open in a modal on that page.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { services } from "@/services/apiServices";
import { apiApplications } from "@/services/apiApplications";
import { invoicesService, type InvoiceList } from "@/services/apiInvoice";
import type { ServiceType } from "@/config/services.config";

interface ApplicationHit {
  id: string;
  number: string;
  title: string;
  sub: string;
}

interface Results {
  services: ServiceType[];
  applications: ApplicationHit[];
  invoices: InvoiceList[];
}

const EMPTY: Results = { services: [], applications: [], invoices: [] };

function applicantName(app: {
  formData?: { fullName?: string } | null;
  applicant?: { firstName?: string; lastName?: string } | null;
}): string {
  if (app.formData?.fullName) return app.formData.fullName;
  const joined = [app.applicant?.firstName, app.applicant?.lastName]
    .filter(Boolean)
    .join(" ");
  return joined || "Applicant";
}

export function GlobalSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const servicesCache = useRef<ServiceType[] | null>(null);
  const invoicesCache = useRef<InvoiceList[] | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results>(EMPTY);

  const hasResults =
    results.services.length > 0 ||
    results.applications.length > 0 ||
    results.invoices.length > 0;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    const run = ++runRef.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        // Cache only a successful, non-empty fetch. The first version
        // cached whatever the first fetch produced, including an empty
        // list from a failed call, for the whole session: one backend
        // restart and every later search found nothing until a reload.
        if (!servicesCache.current || servicesCache.current.length === 0) {
          const list = await services.listServices().catch(() => null);
          if (list && list.length > 0) servicesCache.current = list;
          else if (!servicesCache.current) servicesCache.current = list ?? [];
        }
        if (!invoicesCache.current || invoicesCache.current.length === 0) {
          const hub = await invoicesService
            .getInvoicesHub({})
            .catch(() => null);
          if (hub && hub.invoices.length > 0)
            invoicesCache.current = hub.invoices;
          else if (!invoicesCache.current)
            invoicesCache.current = hub?.invoices ?? [];
        }
        const apps = await apiApplications
          .getApplications({ search: term, limit: 6 })
          .catch(() => []);

        if (runRef.current !== run) return;
        const needle = term.toLowerCase();

        setResults({
          services: (servicesCache.current ?? [])
            .filter((s) =>
              `${s.name} ${s.code} ${s.revenueHead} ${s.category}`
                .toLowerCase()
                .includes(needle),
            )
            .slice(0, 5),
          applications: apps.slice(0, 6).map((app) => ({
            id: app.id,
            number: app.applicationNumber,
            title: applicantName(app),
            sub: `${app.applicationNumber} · ${app.service?.name || "Service"} · ${app.status}`,
          })),
          invoices: (invoicesCache.current ?? [])
            .filter((i) =>
              (
                i.reference +
                (i.customerName ?? "") +
                (i.service?.name ?? "") +
                (i.application?.applicationNumber ?? "")
              )
                .toLowerCase()
                .includes(needle),
            )
            .slice(0, 6),
        });
      } finally {
        if (runRef.current === run) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search name, service, invoice..."
        className="h-9 pl-8 pr-8 w-48 md:w-64 bg-muted/50"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {loading && (
        <Loader2 className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] rounded-md border bg-popover text-popover-foreground shadow-md z-50 max-h-[70vh] overflow-y-auto py-1">
          {!loading && !hasResults && (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">
              No results for &ldquo;{query.trim()}&rdquo;
            </p>
          )}

          {results.services.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Services
              </p>
              {results.services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="block w-full text-left px-3 py-2 hover:bg-muted"
                  onClick={() => go(`/dashboard/services/${s.id}`)}
                >
                  <span className="block text-sm font-medium">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    Service
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.applications.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Applications
              </p>
              {results.applications.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="block w-full text-left px-3 py-2 hover:bg-muted"
                  onClick={() =>
                    go(
                      `/dashboard/applications?search=${encodeURIComponent(a.number)}`,
                    )
                  }
                >
                  <span className="block text-sm font-medium">{a.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {a.sub}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.invoices.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Invoices
              </p>
              {results.invoices.map((i) => (
                <button
                  key={i.reference}
                  type="button"
                  className="block w-full text-left px-3 py-2 hover:bg-muted"
                  onClick={() => go(`/dashboard/invoices/${i.reference}`)}
                >
                  <span className="block text-sm font-medium">
                    {i.customerName || i.reference}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {i.reference} · {i.service?.name ?? "Service"} · ₦
                    {i.amount.toLocaleString()} · {i.paymentStatus}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
