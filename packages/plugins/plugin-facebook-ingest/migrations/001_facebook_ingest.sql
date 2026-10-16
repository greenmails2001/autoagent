CREATE TABLE plugin_facebook_ingest_c37e6c4382.facebook_shared_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  schema_version text NOT NULL,
  source text NOT NULL DEFAULT 'facebook',
  dedup_key text NOT NULL,
  content_hash text NOT NULL,
  relationship_type text NOT NULL,
  shared_post jsonb NOT NULL,
  original_post jsonb,
  crawl_status text NOT NULL,
  collected_at timestamptz NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revision integer NOT NULL DEFAULT 1,
  CONSTRAINT facebook_shared_posts_schema_version_check
    CHECK (schema_version = 'facebook_shared_post.v1'),
  CONSTRAINT facebook_shared_posts_source_check
    CHECK (source = 'facebook'),
  CONSTRAINT facebook_shared_posts_dedup_key_check
    CHECK (dedup_key ~ '^(post|url|content):.+$'),
  CONSTRAINT facebook_shared_posts_content_hash_check
    CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT facebook_shared_posts_relationship_type_check
    CHECK (relationship_type IN ('share', 'original')),
  CONSTRAINT facebook_shared_posts_crawl_status_check
    CHECK (crawl_status IN ('complete', 'partial', 'deleted', 'inaccessible')),
  CONSTRAINT facebook_shared_posts_revision_check
    CHECK (revision > 0),
  CONSTRAINT facebook_shared_posts_original_shape_check
    CHECK (
      original_post IS NULL
      OR original_post = 'null'::jsonb
      OR jsonb_typeof(original_post) = 'object'
    ),
  CONSTRAINT facebook_shared_posts_shared_shape_check
    CHECK (jsonb_typeof(shared_post) = 'object')
);

CREATE UNIQUE INDEX facebook_shared_posts_company_source_dedup_uq
  ON plugin_facebook_ingest_c37e6c4382.facebook_shared_posts
  (company_id, source, dedup_key);

CREATE INDEX facebook_shared_posts_company_sort_idx
  ON plugin_facebook_ingest_c37e6c4382.facebook_shared_posts
  (company_id, (shared_post ->> 'publishedAt') DESC, collected_at DESC, id DESC);

CREATE INDEX facebook_shared_posts_company_status_sort_idx
  ON plugin_facebook_ingest_c37e6c4382.facebook_shared_posts
  (company_id, crawl_status, collected_at DESC, id DESC);

CREATE INDEX facebook_shared_posts_company_sharer_sort_idx
  ON plugin_facebook_ingest_c37e6c4382.facebook_shared_posts
  (company_id, (shared_post -> 'sharer' ->> 'id'), collected_at DESC, id DESC);

CREATE TABLE plugin_facebook_ingest_c37e6c4382.facebook_ingest_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  dedup_key text NOT NULL,
  payload_hash text NOT NULL,
  raw_payload_ref text,
  collected_at timestamptz NOT NULL,
  collector_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facebook_ingest_snapshots_dedup_key_check
    CHECK (dedup_key ~ '^(post|url|content):.+$'),
  CONSTRAINT facebook_ingest_snapshots_payload_hash_check
    CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT facebook_ingest_snapshots_raw_ref_check
    CHECK (raw_payload_ref IS NULL OR length(btrim(raw_payload_ref)) > 0)
);

CREATE INDEX facebook_ingest_snapshots_company_dedup_idx
  ON plugin_facebook_ingest_c37e6c4382.facebook_ingest_snapshots
  (company_id, dedup_key, collected_at DESC);
