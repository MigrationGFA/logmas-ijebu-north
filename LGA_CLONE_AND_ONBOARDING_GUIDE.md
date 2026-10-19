# NEW LGA CLONE & ONBOARDING GUIDE (v2)

> **Goal:** clone this repo (and `logmas-back-odeda`) for **any new Local
> Government Area** and have it fully branded in ~15 minutes — config and data
> files only, no logic changes.
>
> After onboarding, run `node scripts/check-lga-swap.mjs` in this repo AND in
> the backend repo — both must pass. The lint proves no trace of the previous
> LGA remains anywhere in code, data, or asset file names.

---

## Part 0 — Deployment topology (read this first)

**Share the code, never the instance.**

```
Logmas template repos (this repo + logmas-back-odeda)
 ├── Odeda  → frontend build (LGA_ID=odeda)  + backend + own Postgres + own GPay merchant
 ├── Kosofe → frontend build (LGA_ID=kosofe) + backend + own Postgres + own GPay merchant
 └── New LGA → clone both repos → follow this guide → deploy
```

Rules:

1. **One LGA = one frontend build, one backend instance, one database.**
   Never point two LGAs at one database or one backend. The backend is
   single-tenant by design (no `lgaId` columns; one merchant/webhook per
   instance).
2. **The frontend repo is shared code** — per-LGA differences live ONLY in
   `src/config/lga.config.ts`, `metadata.json`, `.env`, and `public/` assets.
   Next.js inlines `NEXT_PUBLIC_*` env vars at build time, so each LGA gets
   its own build.
3. **Each LGA gets its own domain** (e.g. `www.kosofe.gov.ng`,
   `api.kosofe.logmas.com.ng`) — verification QR links, payment return URL,
   and the GPay webhook are all domain-specific.
4. **Keep LGA-specific content strictly in data/config files** so
   `git diff` between two clones shows data only. That is what makes future
   merges from the template trivial.

### Syncing core fixes into a clone later

```bash
git remote add template <url-of-canonical-repo>
git fetch template
git merge template/main        # data-only diffs merge cleanly
```

If a merge conflicts, the conflict is in a data file — resolve by keeping the
clone's LGA values.

---

## Part 1 — Frontend onboarding checklist (`logmas-odeda`)

### Step 1: `src/config/lga.config.ts` — the single source of truth

Replace the `identity`, `leadership`, `contact`, `verification`,
`certificates`, `branding`, `wards`, and `content` sections with the new
council's data. Key fields:

- `identity`: `id` (slug, e.g. `"kosofe"`), `name`, `fullName`, `formalTitle`,
  `councilName`, `shortCode`, `acronym`, `state`, `motto`, `establishedYear`,
  `headquarters`
- `leadership`: chairman (name, portrait/signature paths, office email), vice
  chairman, secretary, treasurer, HOLGA, councillor
- `contact`: phones, emails, secretariat address, portal URL, helpdesk title,
  socials
- `verification`: domain + verify URL for QR scans (public certificate lookup host)
- `certificates.numbering`: all prefixes (e.g. `"KOS-CRT"`, `"KOS-INV"`)
- `certificates.legalWording`: statutory notices and preambles — written out
  in full, so replace the previous council's name with the new one
- `branding`: logo/emblem paths, `appTitle`, `appDescription`
- `wards`: the official electoral wards (keep in sync with the wards you
  create in the backend dashboard)
- `content`: **all marketing content** — homepage stats, testimonials, news,
  ward-map dataset (`wardsInfo`), careers, gallery, investment cards, tourism
  cards. Plain data — rewrite for the new LGA.

> `src/config/lgaContent.config.ts` is now only a re-export of
> `LGA_CONFIG.content` — you should not need to edit it.

### Step 2: Swap visual branding assets in `public/`

| Asset Purpose | Default File Location | Notes |
|---|---|---|
| Council Seal/Logo | `public/logo.png` (+ `public/images/*crest*.png`) | Transparent PNG, 512×512 |
| Chairman Portrait | `public/assets/chairman.jpg` | Formal portrait |
| Chairman Signature | `public/certificates/signatures/chairman-signature.png` | Transparent PNG, ~2.7:1 |
| Certificate Template | `public/certificates/templates/template.png` | 1536×1024 landscape |
| Receipt Background | `public/assets/receipt_template.png` | Revenue receipt background |

Rename LGA-specific filenames (e.g. `odeda-crest.png` → `kosofe-crest.png`)
and update the paths in `lga.config.ts` (`branding.councilEmblemPath`). The
swap-lint flags foreign LGA names in any file under `public/`.

### Step 3: `metadata.json`

```json
{
  "name": "LOGMAS Kosofe",
  "description": "Local Government Management and Administration System for Kosofe Local Government Area",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}
```

The swap-lint fails if `metadata.json` doesn't mention the active LGA name.

### Step 4: `.env`

Copy `.env.example` → `.env`:

- `NEXT_PUBLIC_BASE_URL` — the LGA's public site URL (no trailing slash)
- `NEXT_PUBLIC_API_BASE_URL` — this LGA's backend (`https://api.<lga>/api/v1`)
- `NEXT_PUBLIC_PAYMENT_PROVIDER` — `gpay`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — optional

### Step 5: Service fees (frontend defaults)

`src/config/services.config.ts` holds the default tariff table
(`defaultFee`, `revenueHead`, requirements). Adjust amounts if the new LGA's
bye-law differs. Live fees are managed in the backend treasury dashboard and
override these defaults at runtime.

---

## Part 2 — Backend onboarding checklist (`logmas-back-odeda`)

Each LGA runs its **own** backend instance + Postgres database. Detailed
version: `LGA_ONBOARDING_BACKEND.md` in that repo. Summary:

1. **`.env`** — copy `.env.example`; set:
   - the **LGA block**: `LGA_ID`, `LGA_NAME`, `LGA_SHORT_CODE`,
     `LGA_ACCOUNT_PREFIX` (e.g. `kosofe` / `Kosofe` / `KOS` / `KOSOFE`)
   - a **fresh `DATABASE_URL`** (new database per LGA) + JWT secrets
   - `FRONTEND_URL` / `BACKEND_URL` / `API_BASE_URL` for the new domains
   - the LGA's own `GPAY_*` merchant credentials, its webhook URL
     (`https://api.<lga-domain>/api/v1/payments/gpay/webhook`) and
     `GPAY_RETURN_URL` (site root, no trailing `/payment/result`)
2. **Services catalog** — drop `prisma/data/<LGA_ID>.services.json`
   (format in Part 3). Descriptions may use `{lgaName}` / `{lgaFullName}`
   tokens which the seed interpolates.
3. **Migrate + seed** — `npm run prisma:migrate`, then `npx prisma db seed`.
4. Optionally register the LGA as a preset in `src/config/lga.config.ts`
   (backend) so values live in version control instead of only `.env`.
5. **Wards + users** — wards and admin accounts are runtime data: create them
   from the LGA admin dashboard after first login (`AddWardDialog`), matching
   the ward list you put in the frontend config.

Payment labels (payer defaults, gateway descriptions, `PREFIX/REF` account
labels) and all notification/SMS/email branding now read from `LGA_CONFIG`
(`src/config/lga.config.ts`) + the `LGA_NAME` env var — no code edits.

---

## Part 3 — Services data file format

`prisma/data/<LGA_ID>.services.json` is the drop-in catalog (see
`prisma/data/services.template.json` for the live example). It is a JSON array:

| Field | Type | Notes |
|---|---|---|
| `code` | string | Stable service code (snake_case). Drives renewals & links. |
| `certificateType` | string | Prisma enum value, e.g. `CERTIFICATE_OF_ORIGIN`, `LIQUOR_LICENCE` |
| `name` | string | Display name |
| `description` | string | May use `{lgaName}` / `{lgaFullName}` tokens |
| `category` | string | `CERTIFICATE`, `RATES_AND_LEVIES`, `LICENCES_AND_PERMITS`, `URBAN_DEVELOPMENT` |
| `revenueHead` | string | Treasury revenue head, e.g. `"1001 - Statutory Certificate Fees"` |
| `requirements` | string[] | Document requirement keys |
| `estimatedDays` | number | Processing days |
| `fee` | number | Default fee in NGN (treasury can adjust live) |

The frontend tariff defaults live separately in
`src/config/services.config.ts` (Step 5) — keep the two in sync when the new
LGA's schedule differs from the template.

---

## Part 4 — Verification checklist

Run these after the swap, in order:

1. **Swap-lint (both repos):**
   ```bash
   node scripts/check-lga-swap.mjs     # frontend — parses active LGA from lga.config.ts
   LGA_ID=<new-id> LGA_NAME=<New Name> node scripts/check-lga-swap.mjs   # backend
   ```
   Both must print `✅ swap-lint passed`. Any hit = a leftover from the
   previous LGA (code, data, or asset file name).
2. **Type checks:** `npx tsc --noEmit` in both repos — no *new* errors vs the
   pre-existing baseline (both repos carry historical errors in untouched
   files).
3. **Frontend build:** `npm run build` succeeds.
4. **Backend migrate + seed:** fresh DB → `npm run prisma:migrate` →
   `npx prisma db seed` → expect `✅ <LGA> (<id>) services and service fees
   seeded successfully`.
5. **Smoke test the running app:**
   - Landing page shows the new name, crest, wards, stats, testimonials
   - Login page footer + suspended-account message show the new council name
   - Apply & pay an invoice end-to-end (GPay checkout labels show
     `<PREFIX>/...`, webhook confirms, receipt shows the new council)
   - `/verify` + certificate QR resolve on the new verification domain
   - A notification email/SMS (e.g. password reset) carries the new LGA name

---

## Appendix — file map

| Concern | Frontend file | Backend file |
|---|---|---|
| Identity, wards, certificates, marketing content | `src/config/lga.config.ts` | — |
| Identity labels (payments, notifications, seed) | — | `src/config/lga.config.ts` + `LGA_*` env |
| Services catalog & fees | `src/config/services.config.ts` | `prisma/data/<id>.services.json` (seeded to DB) |
| HTML metadata | `metadata.json` | — |
| Env / domains / merchant | `.env` (NEXT_PUBLIC_*) | `.env` (LGA_*, GPAY_*, DATABASE_URL…) |
| Assets | `public/**` | — |
| Swap verification | `scripts/check-lga-swap.mjs` | `scripts/check-lga-swap.mjs` |


