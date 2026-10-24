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
  AND CASE
    WHEN NOT ("runtime_config" ? 'aiConnection') THEN true
    WHEN jsonb_typeof("runtime_config" -> 'aiConnection') <> 'object' THEN true
    WHEN "runtime_config" -> 'aiConnection' ->> 'mode' = 'responsible_user' THEN NOT (
      "runtime_config" -> 'aiConnection' ->> 'provider' IN ('anthropic', 'openai', '9route', 'openrouter', 'xai', 'google')
      AND "runtime_config" -> 'aiConnection' ->> 'method' IN ('subscription', 'api_key')
      AND (SELECT count(*) FROM jsonb_object_keys("runtime_config" -> 'aiConnection')) = 3
    )
    WHEN "runtime_config" -> 'aiConnection' ->> 'mode' IN ('shared', 'delegated') THEN NOT (
      "runtime_config" -> 'aiConnection' ->> 'provider' IN ('anthropic', 'openai', '9route', 'openrouter', 'xai', 'google')
      AND "runtime_config" -> 'aiConnection' ->> 'method' IN ('subscription', 'api_key')
      AND "runtime_config" -> 'aiConnection' ->> 'connectionId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      AND "runtime_config" -> 'aiConnection' ->> 'grantId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      AND (SELECT count(*) FROM jsonb_object_keys("runtime_config" -> 'aiConnection')) = 5
    )
    WHEN "runtime_config" -> 'aiConnection' ->> 'mode' = 'router' THEN NOT (
      "runtime_config" -> 'aiConnection' ->> 'connectionId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      AND (SELECT count(*) FROM jsonb_object_keys("runtime_config" -> 'aiConnection')) = 2
    )
    ELSE true
  END;
