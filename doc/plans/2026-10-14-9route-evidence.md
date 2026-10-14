# 9route Port Evidence

## Refs

- Upstream/base/target seed: `4a641d0980fdaffc4c4e805f6f0a8809eb5702f2`
- Target branch: `n9/custom`
- Feature branch: `agent/n9-247-runtime-engineer/23629858afe4`

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

## Rollback

1. Before any future default restore, export and verify the exact four-row snapshot plus credential/grant references without secret values.
2. If defaults have been restored, remove or quarantine all `provider='9route'` default rows before contracting CHECK constraints.
3. Revert runtime/UI code and apply a new forward migration that removes `9route` from the checks; never rewrite `0339` or migration history.
4. Verify credential/grant rows and stable references remain unchanged, then run native health on the prior provider configuration.

## Restore Recommendation

Do not restore the four defaults yet. Restore only after deployed schema/journal, model discovery, API-key validation, native routing/health, credential scope, uniqueness, backup, Data/DB verification, and independent review all pass.
