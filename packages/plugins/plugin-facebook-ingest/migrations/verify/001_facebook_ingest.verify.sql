SELECT 'plugin_facebook_ingest_c37e6c4382.facebook_shared_posts'::regclass AS shared_posts_table;
SELECT 'plugin_facebook_ingest_c37e6c4382.facebook_ingest_snapshots'::regclass AS snapshots_table;
SELECT 1 / ((count(*) = 5)::integer) AS required_indexes_present
FROM pg_indexes
WHERE schemaname = 'plugin_facebook_ingest_c37e6c4382'
  AND indexname IN (
    'facebook_shared_posts_company_source_dedup_uq',
    'facebook_shared_posts_company_sort_idx',
    'facebook_shared_posts_company_status_sort_idx',
    'facebook_shared_posts_company_sharer_sort_idx',
    'facebook_ingest_snapshots_company_dedup_idx'
  );
