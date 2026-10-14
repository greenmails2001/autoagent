#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dispositions = new Set(["pending", "ported", "upstream-replaced", "proposed-drop"]);

async function exists(rootDir, relativePath) {
  try {
    await access(path.join(rootDir, relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function validateManifest(manifest, { release = false, rootDir = process.cwd() } = {}) {
  const errors = [];
  if (manifest?.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (typeof manifest?.legacySource !== "string" || manifest.legacySource.length === 0)
    errors.push("legacySource must be a non-empty string");
  if (!Array.isArray(manifest?.features) || manifest.features.length === 0) {
    errors.push("features must be a non-empty array");
    return { errors };
  }

  const ids = new Set();
  const legacyPaths = new Set();
  for (const feature of manifest.features) {
    const id = typeof feature?.id === "string" ? feature.id : "<missing>";
    if (ids.has(id)) errors.push(`feature id "${id}" is declared more than once`);
    ids.add(id);

    if (typeof feature?.title !== "string" || feature.title.length === 0)
      errors.push(`feature "${id}" must declare a title`);
    if (!dispositions.has(feature?.disposition))
      errors.push(`feature "${id}" has invalid disposition: ${feature?.disposition ?? "<missing>"}`);
    if (release && !["ported", "upstream-replaced"].includes(feature?.disposition))
      errors.push(`feature "${id}" is not release-ready: ${feature?.disposition ?? "<missing>"}`);

    for (const field of ["legacyPaths", "targetPaths", "tests", "reviewers"]) {
      if (!Array.isArray(feature?.[field]) || feature[field].length === 0)
        errors.push(`feature "${id}" must declare at least one ${field}`);
    }
    if (typeof feature?.dataNotes !== "string" || feature.dataNotes.length === 0)
      errors.push(`feature "${id}" must declare dataNotes`);

    for (const legacyPath of feature?.legacyPaths ?? []) {
      if (legacyPaths.has(legacyPath)) errors.push(`legacy path "${legacyPath}" is declared more than once`);
      legacyPaths.add(legacyPath);
    }

    if (["ported", "upstream-replaced"].includes(feature?.disposition)) {
      for (const targetPath of feature?.targetPaths ?? []) {
        if (!(await exists(rootDir, targetPath)))
          errors.push(`feature "${id}" target path does not exist: ${targetPath}`);
      }
      for (const testPath of feature?.tests ?? []) {
        if (!(await exists(rootDir, testPath)))
          errors.push(`feature "${id}" test path does not exist: ${testPath}`);
      }
    }
  }

  return { errors };
}

export function manifestLegacyPaths(manifest) {
  return (manifest?.features ?? []).flatMap((feature) => feature.legacyPaths ?? []).sort();
}

async function main() {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, "n9/custom-features.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const result = await validateManifest(manifest, {
    release: process.argv.includes("--release"),
    rootDir,
  });
  if (result.errors.length > 0) {
    for (const error of result.errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`N9 custom feature manifest valid (${manifest.features.length} features).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
