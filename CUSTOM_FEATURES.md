# N9 AutoAgent Custom Features

`n9/custom-features.json` is the source of truth for every legacy customization found in `/u01/apps/n9/sources/autoagent-source`.

## Upgrade contract

- `master` mirrors upstream; do not place N9 custom commits on it.
- `n9/custom` is the long-lived integration and production branch.
- Port one feature group per branch and PR, then merge it into `n9/custom`.
- Upgrade by merging the updated upstream mirror into `n9/custom`; never rebase or force-push production history.
- A feature may be released only when its disposition is `ported` or `upstream-replaced`.
- `proposed-drop` is not approval to remove a feature. It requires an explicit user decision and remains release-blocking.
- Every legacy path must occur exactly once in the manifest. Compare it with the preserved source before each upgrade.

## Required checks

```bash
pnpm check:n9-custom
node --test scripts/check-n9-custom-features.test.mjs
pnpm check:n9-custom:release
```

The first two checks validate structure and evidence. The release check intentionally fails while any feature remains unresolved.

## Data safety

The pre-cutover database dump and saved `9route` default rows are rollback evidence. Do not restore the defaults until the new `9route` schema and runtime code are deployed and verified. Never include credentials, grants, tokens, or environment secrets in the manifest or Git history.
