\set ON_ERROR_STOP on
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE companies (id uuid PRIMARY KEY, name text NOT NULL);
CREATE TABLE company_secrets (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  key text NOT NULL,
  status text NOT NULL,
  external_ref text,
  UNIQUE (company_id, key)
);
CREATE TABLE connection_grants (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  connection_id uuid NOT NULL,
  credential_secret_refs jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL,
  UNIQUE (company_id, id)
);
CREATE TABLE grant_references (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  grant_id uuid NOT NULL,
  stable_ref text NOT NULL UNIQUE,
  FOREIGN KEY (company_id, grant_id) REFERENCES connection_grants(company_id, id)
);
CREATE TABLE ai_connection_defaults (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  provider text NOT NULL,
  method text NOT NULL,
  grant_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_connection_defaults_owner_method_uq UNIQUE (company_id, user_id, provider, method),
  CONSTRAINT ai_connection_defaults_company_grant_fk FOREIGN KEY (company_id, grant_id) REFERENCES connection_grants(company_id, id),
  CONSTRAINT ai_connection_defaults_provider_check CHECK (provider in ('anthropic','openai','openrouter','xai','google')),
  CONSTRAINT ai_connection_defaults_method_check CHECK (method in ('subscription','api_key'))
);
CREATE TABLE ai_provider_defaults (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  provider text NOT NULL,
  grant_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_provider_defaults_owner_provider_uq UNIQUE (company_id, user_id, provider),
  CONSTRAINT ai_provider_defaults_company_grant_fk FOREIGN KEY (company_id, grant_id) REFERENCES connection_grants(company_id, id),
  CONSTRAINT ai_provider_defaults_provider_check CHECK (provider in ('anthropic','openai','openrouter','xai','google'))
);
CREATE TABLE migration_marker (ordinal integer PRIMARY KEY, commit_sha text NOT NULL);

INSERT INTO companies VALUES ('10000000-0000-0000-0000-000000000001', 'representative');
INSERT INTO company_secrets VALUES ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'provider.key.reference', 'active', 'vault://redacted');
INSERT INTO connection_grants VALUES ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '[{"secretId":"20000000-0000-0000-0000-000000000001","version":"latest"}]', 'active');
INSERT INTO grant_references VALUES ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'stable-grant-reference');
INSERT INTO ai_connection_defaults VALUES ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'representative-user', 'openai', 'api_key', '30000000-0000-0000-0000-000000000001', now());
INSERT INTO ai_provider_defaults VALUES ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'representative-user', 'openai', '30000000-0000-0000-0000-000000000001', now());
INSERT INTO migration_marker VALUES (338, '4a641d0980fdaffc4c4e805f6f0a8809eb5702f2');

SELECT 'PRE' AS phase,
  (SELECT count(*) FROM ai_connection_defaults) AS connection_defaults_count,
  (SELECT string_agg(id::text, ',' ORDER BY id) FROM ai_connection_defaults) AS connection_default_ids,
  (SELECT count(*) FROM ai_provider_defaults) AS provider_defaults_count,
  (SELECT string_agg(id::text, ',' ORDER BY id) FROM ai_provider_defaults) AS provider_default_ids,
  (SELECT count(*) FROM connection_grants) AS grant_count,
  (SELECT count(*) FROM company_secrets) AS credential_reference_count,
  (SELECT count(*) FROM grant_references) AS reference_count;

\i packages/db/src/migrations/0339_green_iron_patriot.sql
UPDATE migration_marker SET ordinal = 339, commit_sha = '3b86c9a1f13ec96f85d8d203acca4f9ef2b92619';

SELECT 'POST_0339' AS phase,
  (SELECT count(*) FROM ai_connection_defaults) AS connection_defaults_count,
  (SELECT string_agg(id::text, ',' ORDER BY id) FROM ai_connection_defaults) AS connection_default_ids,
  (SELECT count(*) FROM ai_provider_defaults) AS provider_defaults_count,
  (SELECT string_agg(id::text, ',' ORDER BY id) FROM ai_provider_defaults) AS provider_default_ids,
  (SELECT count(*) FROM connection_grants) AS grant_count,
  (SELECT count(*) FROM company_secrets) AS credential_reference_count,
  (SELECT count(*) FROM grant_references) AS reference_count;

INSERT INTO ai_connection_defaults VALUES ('60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '9route-test-user', '9route', 'api_key', '30000000-0000-0000-0000-000000000001', now());
INSERT INTO ai_provider_defaults VALUES ('70000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '9route-test-user', '9route', '30000000-0000-0000-0000-000000000001', now());

DO $$ BEGIN
  BEGIN
    INSERT INTO ai_provider_defaults VALUES (gen_random_uuid(), '10000000-0000-0000-0000-000000000001', '9route-test-user', '9route', '30000000-0000-0000-0000-000000000001', now());
    RAISE EXCEPTION 'unique constraint did not reject duplicate';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO ai_connection_defaults VALUES (gen_random_uuid(), '10000000-0000-0000-0000-000000000001', 'bad-fk', '9route', 'api_key', '30000000-0000-0000-0000-000000000099', now());
    RAISE EXCEPTION 'foreign key did not reject invalid grant';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;

SELECT '9ROUTE_INSERT' AS phase,
  (SELECT count(*) FROM ai_connection_defaults WHERE provider='9route') AS connection_9route_count,
  (SELECT count(*) FROM ai_provider_defaults WHERE provider='9route') AS provider_9route_count,
  (SELECT count(*) FROM connection_grants g JOIN company_secrets s ON s.id = (g.credential_secret_refs->0->>'secretId')::uuid WHERE g.id='30000000-0000-0000-0000-000000000001' AND s.status='active') = 1 AS credential_grant_integrity,
  (SELECT count(*) FROM grant_references r JOIN connection_grants g ON (g.company_id,g.id)=(r.company_id,r.grant_id) WHERE r.stable_ref='stable-grant-reference') = 1 AS reference_integrity;

DELETE FROM ai_connection_defaults WHERE provider='9route';
DELETE FROM ai_provider_defaults WHERE provider='9route';
ALTER TABLE ai_connection_defaults DROP CONSTRAINT ai_connection_defaults_provider_check;
ALTER TABLE ai_provider_defaults DROP CONSTRAINT ai_provider_defaults_provider_check;
ALTER TABLE ai_connection_defaults ADD CONSTRAINT ai_connection_defaults_provider_check CHECK (provider in ('anthropic','openai','openrouter','xai','google'));
ALTER TABLE ai_provider_defaults ADD CONSTRAINT ai_provider_defaults_provider_check CHECK (provider in ('anthropic','openai','openrouter','xai','google'));
UPDATE migration_marker SET ordinal = 340, commit_sha = 'rollback-forward-test';

SELECT 'ROLLBACK_FORWARD' AS phase,
  (SELECT count(*) FROM ai_connection_defaults WHERE provider='9route') AS connection_9route_count,
  (SELECT count(*) FROM ai_provider_defaults WHERE provider='9route') AS provider_9route_count,
  (SELECT count(*) FROM ai_connection_defaults) AS connection_defaults_count,
  (SELECT string_agg(id::text, ',' ORDER BY id) FROM ai_connection_defaults) AS connection_default_ids,
  (SELECT count(*) FROM ai_provider_defaults) AS provider_defaults_count,
  (SELECT string_agg(id::text, ',' ORDER BY id) FROM ai_provider_defaults) AS provider_default_ids,
  (SELECT count(*) FROM connection_grants) AS grant_count,
  (SELECT count(*) FROM company_secrets) AS credential_reference_count,
  (SELECT count(*) FROM grant_references) AS reference_count,
  (SELECT count(*) FROM connection_grants g JOIN company_secrets s ON s.id = (g.credential_secret_refs->0->>'secretId')::uuid WHERE g.id='30000000-0000-0000-0000-000000000001' AND s.status='active') = 1 AS credential_grant_integrity,
  (SELECT count(*) FROM grant_references r JOIN connection_grants g ON (g.company_id,g.id)=(r.company_id,r.grant_id) WHERE r.stable_ref='stable-grant-reference') = 1 AS reference_integrity;
