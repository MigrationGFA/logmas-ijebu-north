#!/usr/bin/env node
/**
 * Swap-lint for the LOGMAS frontend (see LGA_CLONE_AND_ONBOARDING_GUIDE.md).
 *
 * Fails (exit 1) when traces of ANOTHER Local Government Area remain anywhere
 * outside the allowlisted LGA-config files. Run it after cloning this repo
 * for a new LGA — it proves the swap is complete.
 *
 * Usage:
 *   node scripts/check-lga-swap.mjs
 *   EXTRA_TOKENS="ward-name,street-name" node scripts/check-lga-swap.mjs
 *
 * Checks:
 *   1. No foreign-LGA tokens in src/**, package.json, or public/** filenames.
 *   2. metadata.json references the ACTIVE LGA name (catches a forgotten
 *      metadata.json edit on a clone).
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ─── Active LGA (parsed from the identity block of the config file) ──────────
const config = readFileSync(join(ROOT, "src", "config", "lga.config.ts"), "utf8");
const identityBlock = (config.match(/identity:\s*\{[\s\S]*?\}/) || [""])[0];
const activeId = (identityBlock.match(/\bid:\s*"([^"]+)"/) || [])[1] || "unknown";
const activeName = (identityBlock.match(/\bname:\s*"([^"]+)"/) || [])[1] || "unknown";

// Baseline of LGA identities this codebase has ever shipped with, plus any
// extra tokens supplied by the operator. Anything NOT belonging to the
// active LGA is treated as a leftover.
const KNOWN_LGA_TOKENS = ["odeda", "odedalga"];
const extra = (process.env.EXTRA_TOKENS || "")
  .split(",")
  .map((t) => t.trim().toLowerCase())
  .filter(Boolean);

const activeTokens = [activeId.toLowerCase(), activeName.toLowerCase()];
const foreignTokens = [...new Set([...KNOWN_LGA_TOKENS, ...extra])].filter(
  (t) => !activeTokens.some((a) => a.includes(t) || t.includes(a)),
);

// Paths where LGA config / docs legitimately mention LGAs.
const ALLOWED = new Set([
  join("src", "config", "lga.config.ts").split(sep).join("/"),
  "LGA_CLONE_AND_ONBOARDING_GUIDE.md",
  "scripts/check-lga-swap.mjs",
  ".env.example",
]);

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "out", "build", ".git"]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) yield* walk(abs);
    else yield abs;
  }
}

function relPosix(abs) {
  return relative(ROOT, abs).split(sep).join("/");
}

const violations = [];

function scanTextFile(absPath, patterns) {
  const rel = relPosix(absPath);
  if (ALLOWED.has(rel)) return;
  const lines = readFileSync(absPath, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    const token = patterns.find((t) => line.toLowerCase().includes(t));
    if (token) {
      violations.push(`${rel}:${i + 1}  contains "${token}": ${line.trim().slice(0, 120)}`);
    }
  });
}

if (foreignTokens.length > 0) {
  // 1. Source files
  for (const file of walk(join(ROOT, "src"))) {
    if (/\.(ts|tsx|js|jsx|json|css|mjs)$/.test(file)) scanTextFile(file, foreignTokens);
  }
  for (const name of ["package.json", "metadata.json"]) {
    const p = join(ROOT, name);
    if (existsSync(p)) scanTextFile(p, foreignTokens);
  }

  // 2. public/ — flag foreign tokens in FILE NAMES (assets must be renamed)
  if (existsSync(join(ROOT, "public"))) {
    for (const file of walk(join(ROOT, "public"))) {
      const rel = relPosix(file);
      const token = foreignTokens.find((t) => rel.toLowerCase().includes(t));
      if (token) violations.push(`${rel}  file name contains "${token}" (rename the asset)`);
    }
  }
}

// metadata.json must reference the ACTIVE LGA (catches a forgotten edit).
const metaPath = join(ROOT, "metadata.json");
if (existsSync(metaPath)) {
  const meta = readFileSync(metaPath, "utf8").toLowerCase();
  if (!meta.includes(activeName.toLowerCase())) {
    violations.push(
      `metadata.json  does not mention the active LGA name "${activeName}" — update it (see guide, metadata step)`,
    );
  }
}

console.log(`swap-lint: active LGA = "${activeName}" (${activeId})`);
if (foreignTokens.length === 0) {
  console.log("swap-lint: no foreign LGA tokens known for this active LGA — nothing to flag.");
} else {
  console.log(`swap-lint: foreign tokens checked: ${foreignTokens.join(", ")}`);
}

if (violations.length > 0) {
  console.error(`\n❌ swap-lint FAILED — ${violations.length} leftover(s) from another LGA:\n`);
  for (const v of violations) console.error(`  ${v}`);
  console.error(
    "\nFix: replace these with the active LGA's values (or move them into src/config/lga.config.ts).",
  );
  process.exit(1);
}

console.log("✅ swap-lint passed — no foreign LGA traces outside the allowlist.");
