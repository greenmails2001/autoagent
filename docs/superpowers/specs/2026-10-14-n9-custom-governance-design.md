# N9 Custom Governance Design

## Goal

Preserve every legacy N9 AutoAgent customization while keeping upstream upgrades reviewable, testable, and reversible.

## Branch Model

- `master` mirrors upstream and contains no N9-only behavior.
- `n9/custom` is the long-lived production integration branch.
- `custom/<feature>` branches contain one independently reviewable customization group and target `n9/custom`.
- `upgrade/<date>` branches merge a new upstream `master` into `n9/custom`; production history is never rebased or force-pushed.
- Every deployed revision receives an immutable tag and artifact checksum manifest.

## Customization Source Of Truth

`n9/custom-features.json` records every legacy changed or added file exactly once. Each feature records its status, legacy paths, target paths, tests, data migration notes, and disposition. Legal dispositions are `pending`, `ported`, `upstream-replaced`, and `proposed-drop`. Only a human-approved decision may move an item to `proposed-drop`; release validation rejects both `pending` and `proposed-drop`.

`CUSTOM_FEATURES.md` is the human-readable companion. Generated caches such as `.gitnexus/` and `graphify-out/` are explicitly excluded.

## Enforcement

`scripts/check-n9-custom-features.mjs` validates manifest structure, unique feature ids, unique legacy paths, declared target/test files, migration identity metadata, and release readiness. Normal CI validates structure; release mode additionally rejects unresolved dispositions.

The fork must configure required PR checks and CODEOWNER review outside the repository. Database changes additionally require Data Guardian approval; auth/network changes require Security & IAM review.

## Port Order

1. `9route` provider and saved default restoration.
2. Codex ACP/runtime behavior.
3. Issue continuation/recovery/heartbeat.
4. Tool access/gateway/runtime MCP.
5. Onboarding and provider UI.
6. CLI issue subresources.
7. Auth/sign-out and Agent Detail behavior.
8. Wiki plugin packaging/runtime.
9. Deploy/runtime contracts and full release rehearsal.

No feature is retired silently. Upstream replacement requires behavior-equivalence evidence and focused tests.
