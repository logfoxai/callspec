#!/usr/bin/env node
/**
 * Fail if package.json declares file: or file:// dependency specs.
 * Canonical copy: infra/ci-cd/check-no-file-deps.mjs
 * Service repos ship an identical copy at scripts/check-no-file-deps.mjs for CI.
 *
 * Local monorepo dev uses npm link — never commit file: paths.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "overrides",
];

const pkgPath = join(process.cwd(), "package.json");
let pkg;
try {
  pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
} catch (err) {
  console.error(`check-no-file-deps: failed to read ${pkgPath}: ${err.message}`);
  process.exit(1);
}

const violations = [];

function isFileSpec(value) {
  return typeof value === "string" && (value.startsWith("file:") || value.startsWith("file://"));
}

function checkDeps(deps, path) {
  if (!deps || typeof deps !== "object" || Array.isArray(deps)) {
    return;
  }
  for (const [name, version] of Object.entries(deps)) {
    if (isFileSpec(version)) {
      violations.push(`${path}.${name}: ${JSON.stringify(version)}`);
    } else if (version && typeof version === "object") {
      checkDeps(version, `${path}.${name}`);
    }
  }
}

for (const field of DEP_FIELDS) {
  checkDeps(pkg[field], field);
}

if (violations.length > 0) {
  console.error("package.json must not use file: or file:// dependency specs.");
  console.error("Use npm link for local development instead.");
  for (const v of violations) {
    console.error(`  ${v}`);
  }
  process.exit(1);
}

console.log("check-no-file-deps: ok");
