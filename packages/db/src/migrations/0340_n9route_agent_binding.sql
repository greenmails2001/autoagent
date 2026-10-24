UPDATE "agents"
SET "runtime_config" = jsonb_set(
  "runtime_config",
  '{aiConnection}',
  '{"mode":"responsible_user","method":"api_key","provider":"9route"}'::jsonb,
  true
)
WHERE "adapter_type" = 'codex_local'
  AND "adapter_config" ->> 'model' LIKE 'cx/%'
  AND length("adapter_config" ->> 'model') > 3
  AND NOT ("runtime_config" ? 'aiConnection');
