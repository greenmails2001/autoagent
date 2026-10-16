# Task Output Presentation Profiles Implementation Plan

**Goal:** Add server-selected, versioned output profiles while preserving the mandatory core output contract.

**Architecture:** Resolve a per-agent profile from trusted runtime config, snapshot its text/digest/fallback reason, and materialize a content-addressed `SKILL.md` assignment. Codex auto-attaches it as a native skill input; Claude installs it as an isolated skill-plugin and also receives the authoritative system instruction. Unknown profiles fail closed to the core default; no task-level skill invocation is required.

**Files:** `output-profiles.ts`, runtime-context contract/parser/composer, server runtime-context builder/tests, behavioral tests, and migration/canary documentation.

**Verification:** Contract parsing/digest tests, server assignment/fallback tests, Codex/Claude adapter composition tests, behavioral goldens, TypeScript, instruction measurement, and `git diff --check`.
