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
- Live representative-data upgrade/rollback remains an independent Data/DB review gate because this workspace has no authorized production data connection.

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
