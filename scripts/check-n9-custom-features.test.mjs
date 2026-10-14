import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { manifestLegacyPaths, validateManifest } from "./check-n9-custom-features.mjs";

const feature = (overrides = {}) => ({
  id: "feature-a",
  title: "Feature A",
  disposition: "ported",
  legacyPaths: ["legacy/a.ts"],
  targetPaths: ["src/a.ts"],
  tests: ["test/a.test.ts"],
  reviewers: ["upgrade-auditor"],
  dataNotes: "No persistent data.",
  ...overrides,
});

async function fixtureRoot() {
  const rootDir = await mkdtemp(path.join(tmpdir(), "n9-custom-manifest-"));
  await writeFile(path.join(rootDir, "a.ts"), "export {};\n");
  await writeFile(path.join(rootDir, "a.test.ts"), "export {};\n");
  return rootDir;
}

test("rejects a legacy path assigned to more than one feature", async () => {
  const rootDir = await fixtureRoot();
  const manifest = {
    schemaVersion: 1,
    legacySource: "/legacy",
    features: [
      feature({ targetPaths: ["a.ts"], tests: ["a.test.ts"] }),
      feature({ id: "feature-b", legacyPaths: ["legacy/a.ts"], targetPaths: ["a.ts"], tests: ["a.test.ts"] }),
    ],
  };

  const result = await validateManifest(manifest, { rootDir });

  assert.deepEqual(result.errors, ['legacy path "legacy/a.ts" is declared more than once']);
});

test("rejects declared target and test files that do not exist", async () => {
  const rootDir = await fixtureRoot();
  const manifest = {
    schemaVersion: 1,
    legacySource: "/legacy",
    features: [feature({ targetPaths: ["missing.ts"], tests: ["missing.test.ts"] })],
  };

  const result = await validateManifest(manifest, { rootDir });

  assert.deepEqual(result.errors, [
    'feature "feature-a" target path does not exist: missing.ts',
    'feature "feature-a" test path does not exist: missing.test.ts',
  ]);
});

test("release mode rejects unresolved feature dispositions", async () => {
  const rootDir = await fixtureRoot();
  const manifest = {
    schemaVersion: 1,
    legacySource: "/legacy",
    features: [feature({ disposition: "pending", targetPaths: ["a.ts"], tests: ["a.test.ts"] })],
  };

  const result = await validateManifest(manifest, { rootDir, release: true });

  assert.deepEqual(result.errors, ['feature "feature-a" is not release-ready: pending']);
});

test("exports a stable sorted legacy inventory for source comparisons", () => {
  const manifest = {
    features: [
      feature({ legacyPaths: ["legacy/z.ts", "legacy/a.ts"] }),
      feature({ id: "feature-b", legacyPaths: ["legacy/m.ts"] }),
    ],
  };

  assert.deepEqual(manifestLegacyPaths(manifest), ["legacy/a.ts", "legacy/m.ts", "legacy/z.ts"]);
});
