ALTER TABLE plugin_facebook_ingest_c37e6c4382.facebook_ingest_snapshots
  DROP CONSTRAINT facebook_ingest_snapshots_write_status_check,
  DROP CONSTRAINT facebook_ingest_snapshots_operation_uq,
  DROP COLUMN write_status,
  DROP COLUMN operation_id;
