# N9 Custom Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve and port every legacy N9 AutoAgent customization with machine-enforced inventory and upgrade-safe Git/release gates.

**Architecture:** Keep upstream-only `master`, production `n9/custom`, and one branch/PR per customization group. A versioned JSON manifest is the source of truth; a Node validator runs in CI and release mode. Port groups in dependency order and restore saved production data only after the corresponding feature is live.

**Tech Stack:** Node.js ESM, `node:test`, pnpm, TypeScript, PostgreSQL/Drizzle, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-14-n9-custom-governance-design.md`

## Global Constraints

- Never silently drop a legacy feature.
- Never rewrite an applied migration identity.
- Never expose secrets or production credential values.
- `master` remains an upstream mirror; production customizations land through `n9/custom`.
- Release validation fails while any feature is `pending` or `proposed-drop`.

---

### Task 1: Customization Manifest Validator

**Files:**
- Create: `scripts/check-n9-custom-features.mjs`
- Create: `scripts/check-n9-custom-features.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: manifest object with `schemaVersion`, `legacySource`, `features`, and feature path/test/disposition fields.
- Produces: `validateManifest(manifest, { release, rootDir }) -> { errors: string[] }` and CLI exit code 0/1.

- [ ] Write tests that fail because the validator module does not exist; cover duplicate legacy paths, missing target/test files, and unresolved release dispositions.
- [ ] Run `node --test scripts/check-n9-custom-features.test.mjs` and confirm module-not-found failure.
- [ ] Implement the validator and CLI.
- [ ] Add `check:n9-custom` and `check:n9-custom:release` package scripts.
- [ ] Re-run the focused tests and both manifest commands.
- [ ] Commit as `chore(n9): enforce custom feature manifest`.

### Task 2: Exhaustive Legacy Inventory

**Files:**
- Create: `n9/custom-features.json`
- Create: `CUSTOM_FEATURES.md`

**Interfaces:**
- Consumes: the 60 tracked modifications and 15 relevant untracked files in `/u01/apps/n9/sources/autoagent-source`.
- Produces: every legacy path declared exactly once under a feature group.

- [ ] Generate the legacy path list excluding `.gitnexus/` and `graphify-out/`.
- [ ] Classify every path into the nine approved groups with `pending` disposition.
- [ ] Add target paths, focused tests, data notes, and reviewer gates.
- [ ] Run `pnpm check:n9-custom` and confirm zero errors.
- [ ] Compare sorted source inventory to sorted manifest inventory with `comm`; confirm no missing or extra paths.
- [ ] Commit as `docs(n9): inventory legacy AutoAgent customizations`.

### Task 3: Port 9route Provider

**Files:**
- Create/modify the manifest-declared DB, shared, server, adapter, and UI files for feature `9route`.
- Test: focused legacy `9route` unit/UI tests listed in the manifest.

**Interfaces:**
- Consumes: `AUTOAGENT_9ROUTE_BASE_URL`, `N9ROUTE_API_KEY`, saved provider/default rows.
- Produces: `9route` provider selection, validation, model discovery, Codex routing, and restored defaults.

- [ ] Port focused tests first and confirm they fail on upstream code.
- [ ] Port schema/migration using a new ordinal after the upstream tip; do not reuse legacy `0284`.
- [ ] Port shared provider definitions and generated catalog through the repository generator.
- [ ] Port server/runtime routing and UI selection.
- [ ] Run focused tests, typecheck, and migration checks.
- [ ] On a DB backup, restore saved `9route` defaults after the new constraint exists and verify counts.
- [ ] Mark feature `ported`, run release manifest validation, and commit as `feat(n9): restore 9route provider`.

### Task 4: Port Runtime And Recovery Groups

**Files:**
- Modify only paths declared under `codex-acp-runtime`, `issue-recovery`, and `tool-runtime-mcp`.

**Interfaces:**
- Consumes: current upstream runtime/recovery contracts.
- Produces: behavior-equivalent N9 session, recovery, heartbeat, tool access, and MCP routing.

- [ ] Port each group's focused tests and verify red against upstream behavior.
- [ ] Implement one group at a time with no cross-group commit.
- [ ] Run focused tests and typecheck after every group.
- [ ] Update dispositions and evidence in the manifest.
- [ ] Commit each group independently.

### Task 5: Port UI, CLI, Auth, And Wiki Groups

**Files:**
- Modify only paths declared under `provider-onboarding-ui`, `cli-issue-subresources`, `auth-agent-detail`, and `wiki-plugin`.

**Interfaces:**
- Consumes: server/provider contracts from earlier tasks.
- Produces: legacy-visible UX, CLI endpoints, auth behavior, and packaged wiki plugin.

- [ ] Port focused tests first and verify red.
- [ ] Implement and verify each group independently.
- [ ] Build static UI and staged plugin packages.
- [ ] Update manifest dispositions and commit each group separately.

### Task 6: Release Gate And Upgrade Rehearsal

**Files:**
- Modify: `.github/workflows/pr.yml` or fork-local trusted workflow.
- Create: fork release/rollback evidence under `docs/n9/`.

**Interfaces:**
- Consumes: fully resolved manifest and exact candidate SHA.
- Produces: required CI result, immutable artifact checksums, DB restore rehearsal, cutover and rollback receipts.

- [ ] Add manifest validation to PR CI and release-mode validation to release verification.
- [ ] Run complete tests/typecheck/build on the exact candidate SHA.
- [ ] Rehearse sanitized DB restore/migration and compare invariants.
- [ ] Build immutable artifacts and record SHA-256 values.
- [ ] Verify atomic cutover and previous-release rollback commands.
- [ ] Obtain Upgrade Lead, Auditor, Data Guardian, Integration Reviewer, and conditional Security approval.
- [ ] Tag and deploy only the approved SHA.
