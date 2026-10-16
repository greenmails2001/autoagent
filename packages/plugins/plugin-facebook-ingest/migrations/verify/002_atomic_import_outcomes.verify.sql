SELECT 1 / ((count(*) = 2)::integer) AS atomic_outcome_columns_present
FROM information_schema.columns
WHERE table_schema = 'plugin_facebook_ingest_c37e6c4382'
  AND table_name = 'facebook_ingest_snapshots'
  AND is_nullable = 'NO'
  AND (
    (column_name = 'operation_id' AND data_type = 'uuid')
    OR column_name = 'write_status'
  );

SELECT 1 / ((count(*) = 2)::integer) AS atomic_outcome_constraints_present
FROM information_schema.table_constraints
WHERE table_schema = 'plugin_facebook_ingest_c37e6c4382'
  AND table_name = 'facebook_ingest_snapshots'
  AND constraint_name IN (
    'facebook_ingest_snapshots_operation_uq',
    'facebook_ingest_snapshots_write_status_check'
  );
