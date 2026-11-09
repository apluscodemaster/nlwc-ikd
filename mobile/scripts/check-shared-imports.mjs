#!/usr/bin/env node
/**
 * Guard for code shared with the web app (see docs/ARCHITECTURE.md §5.3).
 *
 * The mobile app value-imports a few framework-free modules from the web
 * app's `src/` through `src/shared.ts`. This script walks every web module
 * reachable from there (following value imports only — `import type` is
 * erased at compile time) and fails if any of them:
 *   - imports a package other than the small allowlist below
 *     (React, Next, Node built-ins, server SDKs, lucide-react… would either
 *     not run on React Native or pull in a second copy of React);
 *   - touches the DOM (`document`, `DOMParser`, …).
 *
 * Usage: node scripts/check-shared-imports.mjs [--list]
 *   --list  also prints every web module that ends up in the app bundle.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MOBILE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEB_SRC = resolve(MOBILE_ROOT, "..", "src");
const ENTRY = join(MOBILE_ROOT, "src", "shared.ts");

/** Packages a shared web module may import. Keep this short. */
const ALLOWED_PACKAGES = new Set(["zod", "zod/v4"]);

/** Source patterns that mean "this only runs in a browser or on a server". */
const FORBIDDEN_SOURCE = [
  [/\bdocument\s*\./, "uses `document` (DOM)"],
  [/\bnew\s+DOMParser\b/, "uses DOMParser (DOM)"],
  [/\bnavigator\.serviceWorker\b/, "uses service workers"],
  [/^\s*["']use server["']/m, "is a server action module"],
  [/^\s*["']use client["']/m, "is a React client component module"],
];

const IMPORT_RE =
  /(?:^|[\n;])\s*(import|export)\s+(type\s+)?(?:[\s\S]*?\sfrom\s+)?["']([^"']+)["']/g;
const DYNAMIC_IMPORT_RE = /\bimport\(\s*["']([^"']+)["']\s*\)/g;

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

function valueSpecifiers(src) {
  const out = [];
  const code = stripComments(src);
  for (const m of code.matchAll(IMPORT_RE)) {
    const [, kind, typeOnly, spec] = m;
    if (typeOnly) continue;
    // `export { a } ` without a `from` is not an import; the regex requires a
    // quoted specifier, so only re-exports and imports reach here.
    if (kind === "export" && !/from\s+["']/.test(m[0])) continue;
    out.push(spec);
  }
  for (const m of code.matchAll(DYNAMIC_IMPORT_RE)) out.push(m[1]);
  return out;
}

function resolveFile(base) {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  return candidates.find((p) => existsSync(p) && statSync(p).isFile());
}

/** Map a specifier seen in `fromFile` to a web file, a package, or a mobile file. */
function classify(spec, fromFile) {
  if (spec.startsWith("@web/") || spec.startsWith("@/")) {
    const rest = spec.replace(/^@web\/|^@\//, "");
    return { kind: "web", file: resolveFile(join(WEB_SRC, rest)), spec };
  }
  if (spec.startsWith(".")) {
    const file = resolveFile(resolve(dirname(fromFile), spec));
    const isWeb = file && !relative(WEB_SRC, file).startsWith("..");
    return { kind: isWeb ? "web" : "local", file, spec };
  }
  return { kind: "package", spec };
}

const errors = [];
const visited = new Set();

function visitWeb(file, chain) {
  if (visited.has(file)) return;
  visited.add(file);
  const src = readFileSync(file, "utf8");
  const where = [...chain, relative(WEB_SRC, file)].join(" → ");

  for (const [re, why] of FORBIDDEN_SOURCE) {
    if (re.test(stripComments(src))) errors.push(`${where}: ${why}`);
  }
  for (const spec of valueSpecifiers(src)) {
    const dep = classify(spec, file);
    if (dep.kind === "package") {
      if (!ALLOWED_PACKAGES.has(spec)) {
        errors.push(`${where}: imports package "${spec}" (not allowed in shared code)`);
      }
    } else if (!dep.file) {
      errors.push(`${where}: cannot resolve "${spec}"`);
    } else if (dep.kind === "web") {
      visitWeb(dep.file, [...chain, relative(WEB_SRC, file)]);
    }
  }
}

const entrySrc = readFileSync(ENTRY, "utf8");
for (const spec of valueSpecifiers(entrySrc)) {
  const dep = classify(spec, ENTRY);
  if (dep.kind !== "web") continue;
  if (!dep.file) {
    errors.push(`shared.ts: cannot resolve "${spec}"`);
    continue;
  }
  visitWeb(dep.file, []);
}

/* ── Type-check reachability ───────────────────────────────────────────────
 * `import type` is erased from the bundle, but TypeScript still type-checks
 * the whole imported file. So every web file reachable from shared.ts by ANY
 * import (value or type) must only use packages the app itself has installed;
 * otherwise `tsc` passes only on machines that also have the web app's
 * node_modules (and fails in CI). Paths stubbed in tsconfig.json are skipped.
 */
const MOBILE_NM = join(MOBILE_ROOT, "node_modules");
const tsconfig = JSON.parse(readFileSync(join(MOBILE_ROOT, "tsconfig.json"), "utf8"));
const STUBBED = new Set(
  Object.keys(tsconfig.compilerOptions?.paths ?? {}).filter((k) => !k.includes("*")),
);

function allSpecifiers(src) {
  const code = stripComments(src);
  const out = [];
  for (const m of code.matchAll(IMPORT_RE)) {
    if (m[1] === "export" && !/from\s+["']/.test(m[0])) continue;
    out.push(m[3]);
  }
  for (const m of code.matchAll(DYNAMIC_IMPORT_RE)) out.push(m[1]);
  return out;
}

function packageInstalled(spec) {
  const parts = spec.split("/");
  const name = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
  if (name.startsWith("node:")) return false;
  const typesName = name.startsWith("@") ? name.slice(1).replace("/", "__") : name;
  return (
    existsSync(join(MOBILE_NM, name, "package.json")) ||
    existsSync(join(MOBILE_NM, "@types", typesName, "package.json"))
  );
}

const typeVisited = new Set();
function visitForTypes(file, chain) {
  if (typeVisited.has(file)) return;
  typeVisited.add(file);
  const where = [...chain, relative(WEB_SRC, file)].join(" → ");
  for (const spec of allSpecifiers(readFileSync(file, "utf8"))) {
    if (STUBBED.has(spec)) continue;
    const dep = classify(spec, file);
    if (dep.kind === "package") {
      if (!packageInstalled(spec)) {
        errors.push(
          `${where}: type-checking needs package "${spec}", which the app doesn't have ` +
            `(mirror the type in mobile/src/types instead of importing it)`,
        );
      }
    } else if (dep.kind === "web" && dep.file) {
      visitForTypes(dep.file, [...chain, relative(WEB_SRC, file)]);
    }
  }
}

if (existsSync(MOBILE_NM)) {
  for (const spec of allSpecifiers(entrySrc)) {
    const dep = classify(spec, ENTRY);
    if (dep.kind === "web" && dep.file) visitForTypes(dep.file, []);
  }
} else {
  console.warn("! mobile/node_modules not installed: skipped the type-reachability check.");
}

if (process.argv.includes("--list")) {
  console.log("Web modules bundled into the app:");
  for (const f of [...visited].sort()) console.log(`  src/${relative(WEB_SRC, f).replace(/\\/g, "/")}`);
}

if (errors.length) {
  console.error(`\n✖ Shared-code guard failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e.replace(/\\/g, "/")}`);
  console.error("\nSee mobile/docs/ARCHITECTURE.md §5.3 for the rules.");
  process.exit(1);
}
console.log(`✔ Shared-code guard passed (${visited.size} web modules checked).`);
