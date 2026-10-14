# 9route Port Evidence

## Refs

- Upstream/base/target seed: `4a641d0980fdaffc4c4e805f6f0a8809eb5702f2`
- Target branch: `n9/custom`
- Feature branch: `agent/n9-247-runtime-engineer/23629858afe4`

## Review Gates

- Source head `2fec5c1878271b432ece089a3c5c7f976bfdf497`: independent integration gate **PASS** and Data/DB migration/preservation gate **PASS**.
- Reviewed `ported`, `unverified`, and `withheld` row dispositions are retained exactly; gate approval does not promote any `unverified` row.
- Native production health remains pending. No merge, deployment, or four-row default restore is authorized by these source-side verdicts.

## Test Evidence

- RED: 6 files failed, 11 tests failed because 9route modules/helpers/provider entries were absent.
- GREEN: focused suite passed 6 files / 23 tests.
- Typecheck: shared, DB, server (`tsc --noEmit`), and UI passed. The full server wrapper could not build the vendored native runner because `cargo` is unavailable; direct server TypeScript checking passed.

## Migration and Data

- Generated `0339_green_iron_patriot.sql`; it only replaces the two provider CHECK constraints and adds `9route` while retaining all current providers including `google`.
- No credential, grant, reference, or default-row INSERT/UPDATE/DELETE appears in the migration.
- The four saved default rows remain withheld.
- Live disposable PostgreSQL 17 evidence is reproducible with `doc/plans/2026-10-14-9route-live-db.sql`. The run used the exact `0339_green_iron_patriot.sql` from commit `3b86c9a1f13ec96f85d8d203acca4f9ef2b92619`.
- Pre/post `0338 → 0339`: both defaults tables stayed at one row with stable IDs `60000000-0000-0000-0000-000000000001` and `70000000-0000-0000-0000-000000000001`; grant, credential-reference, and reference counts stayed `1/1/1`.
- The upgraded constraints accepted one `9route` row in each defaults table. The test also proved the provider unique constraint rejects a duplicate and the company/grant FK rejects an unknown grant.
- Credential-to-grant and stable-reference joins returned `true` before rollback-forward. No credential values were selected or logged.
- Rollback-forward first deleted both test `9route` rows, then applied new forward constraint definitions without `9route`. Final 9route counts were `0/0`; original stable IDs and `1/1/1` integrity counts remained unchanged; both integrity joins returned `true`.
- This validates representative migration mechanics only. It does not authorize production deployment or restore the four saved defaults.

## Runtime and Health

- Provider/model discovery uses `AUTOAGENT_9ROUTE_BASE_URL`, requires HTTPS, rejects credentials/query/fragment, disables redirects, and sends `N9ROUTE_API_KEY` only to `/models`.
- Managed runtime projects the resolved credential into isolated Codex config using provider id `9router`; OpenAI remains the legacy Codex default.
- Optional N9 MCP gateway routing validates the configured base and target allowlist.
- Native production health is not claimed; it requires the deployment gate and real 9route endpoint/credential without exposing secret values.

## Integration review corrections

- Production heartbeat delivery now routes all three supported MCP targets through the optional N9 gateway: assigned gateways, runtime tools, and project tools. The focused run-preparation test proves the emitted runtime-tools URL; existing gateway integration coverage exercises assigned gateway production output.
- The rendered Codex connection field exposes OpenAI and N9route and emits a `9route` responsible-user binding. The component test failed before the selector was wired and passes after the change.
- CLI execution now applies custom provider configuration to managed connection homes, ACP materializes that configuration before runtime creation, and remote API-key hello probes install the same provider TOML in the disposable probe home. ACP and remote-probe tests failed before these seams were implemented and pass afterward.
- `n9/custom-features.json` accounts for the union of tracked changes and relevant untracked files in the preserved legacy worktree. `.gitnexus/`, `graphify-out/`, and the unrelated `doc/plans/2026-09-30-autoagent-onboarding-recovery.md` are excluded. Paths without sufficient production-equivalent evidence are explicitly `unverified`; no path is silently treated as dropped and there are no `proposed-drop` entries.
- Focused correction verification: 4 files, 73 tests passed; Codex adapter and UI typechecks passed. Server typecheck again reached the native Runner build and stopped only because `cargo` is unavailable on this checkout host.

Reproduce ledger coverage from the repository root. The command exits non-zero and prints every missing tracked or relevant untracked path:

```bash
legacy_source=/u01/apps/n9/sources/autoagent-source
missing="$({
  git -C "$legacy_source" diff --name-only
  git -C "$legacy_source" ls-files --others --exclude-standard \
    | rg -v '^(\.gitnexus/|graphify-out/|doc/plans/2026-09-30-autoagent-onboarding-recovery\.md$)'
} | sort -u | comm -23 - <(jq -r '.groups["9route"].entries[].path' n9/custom-features.json | sort -u))"
test -z "$missing" || { printf '%s\n' "$missing"; exit 1; }
```

The corrected ledger includes the 13 previously omitted untracked paths. `OnboardingWizard.tsx`, its test, `AiConnectionPicker.test.tsx`, and the unconsumed onboarding model-source helper/test remain `unverified`; no helper-only evidence is used to claim production behavior.

## Rollback

1. Before any future default restore, export and verify the exact four-row snapshot plus credential/grant references without secret values.
2. If defaults have been restored, remove or quarantine all `provider='9route'` default rows before contracting CHECK constraints.
3. Revert runtime/UI code and apply a new forward migration that removes `9route` from the checks; never rewrite `0339` or migration history.
4. Verify credential/grant rows and stable references remain unchanged, then run native health on the prior provider configuration.

## Restore Recommendation

Do not restore the four defaults yet. Restore only after deployed schema/journal, model discovery, API-key validation, native routing/health, credential scope, uniqueness, backup, Data/DB verification, and independent review all pass.
