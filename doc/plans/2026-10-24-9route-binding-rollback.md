## Purpose

Migration `0340_n9route_agent_binding.sql` normalizes missing, JSON null, and malformed `runtime_config.aiConnection` values. Those original states cannot be reconstructed from the normalized row, so deployment must capture a scoped snapshot before applying migrations.

## Pre-deploy capture

Use `captureN9routeAgentBindingSnapshot` from `packages/db/src/n9route-agent-binding-rollback.ts` against the target database before the service upgrade. Store the returned JSON beside the encrypted database backup with mode `0600`. The artifact contains only `agents.id`, whether the key existed, and the original `aiConnection` JSON value; it contains no credential material.

Record:

- previous and target application SHAs;
- database backup path and checksum;
- snapshot path, checksum, row count, and exact agent IDs;
- pre-deploy counts/hashes for `connection_grants`, `ai_provider_defaults`, and `ai_connection_defaults`;
- eligible-row count using the same predicate as migration `0340`.

Abort before migration if the snapshot count differs from the eligible-row count.

## Rollback decision

Prefer **application-only rollback** when the previous revision starts successfully and can execute normalized bindings. The previous deployed revision `c3a6640530104b081f967316a31868b1dc2a839f` already validates the same responsible-user 9route binding through `aiRuntimeConnectionBindingSchema` and projects it through the managed AI runtime; therefore normalized rows are backward-compatible with that application revision.

This compatibility is source-verifiable at that exact revision:

```bash
git show c3a6640530104b081f967316a31868b1dc2a839f:server/src/services/heartbeat.ts | rg 'aiRuntimeConnectionBindingSchema.parse'
git show c3a6640530104b081f967316a31868b1dc2a839f:server/src/services/ai-connection-runtime.ts | rg 'N9ROUTE_API_KEY|prepareManagedAiRuntime'
git show c3a6640530104b081f967316a31868b1dc2a839f:packages/shared/src/ai-connections.ts | rg 'responsible_user|N9ROUTE_API_KEY'
```

These checks establish that the previous app accepts the normalized binding shape, selects managed runtime credentials, and knows the 9route environment key. Application-only rollback still requires a startup/health smoke; compatibility does not waive runtime verification.

Use **scoped restore from the captured snapshot** only when normalization itself must be undone, such as an operator-approved requirement to reproduce the exact pre-deploy config or evidence that the previous revision rejects the normalized binding. Do not infer old values from post-migration rows.

## Scoped restore

Call `restoreN9routeAgentBindingSnapshot` with the captured JSON. The restore is fail-closed:

- it rejects duplicate snapshot IDs, locks every captured row with `FOR UPDATE`, and preflights the complete batch before any mutation;
- any missing, out-of-scope, or conflicting row throws inside the transaction, so PostgreSQL rolls back the entire batch and no partial restore commits;
- it updates only captured `agents.id` values that still match `codex_local`, a non-empty `cx/*` model, and the exact normalized responsible-user 9route binding;
- it restores or removes only `runtime_config.aiConnection` and preserves all sibling runtime config added after migration;
- it never reads or writes credential, grant, provider-default, or connection-default tables;
- a second run updates zero rows.

An all-restored snapshot is an idempotent no-op. A mixed batch containing both restored and normalized rows is rejected rather than completing a potentially interrupted or manually altered restore. If any row fails preflight, stop and reconcile manually; do not rely on a short update count or overwrite a later explicit operator choice.

## Rehearsal and verification

Run:

```bash
pnpm exec vitest run packages/db/src/n9route-agent-binding-migration.test.ts
```

The embedded PostgreSQL rehearsal captures missing/null/malformed states, applies `0340`, preserves valid bindings and protected-table counts, and adds an unrelated post-migration runtime key. It proves conflict, deleted-row, and duplicate-ID batches restore zero rows; then verifies the happy path restores only `aiConnection`, preserves JSON null and sibling config, and makes the second restore a no-op.

After any production rollback, verify application health, the restored agent IDs, unchanged sibling config, unchanged protected-table counts/hashes, and that the four withheld default rows remain absent.
