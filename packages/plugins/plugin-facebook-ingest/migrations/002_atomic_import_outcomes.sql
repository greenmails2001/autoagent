ALTER TABLE plugin_facebook_ingest_c37e6c4382.facebook_ingest_snapshots
  ADD COLUMN operation_id uuid,
  ADD COLUMN write_status text;

UPDATE plugin_facebook_ingest_c37e6c4382.facebook_ingest_snapshots
SET operation_id = id,
    write_status = 'inserted'
WHERE operation_id IS NULL;

ALTER TABLE plugin_facebook_ingest_c37e6c4382.facebook_ingest_snapshots
  ALTER COLUMN operation_id SET NOT NULL,
  ALTER COLUMN write_status SET NOT NULL,
  ADD CONSTRAINT facebook_ingest_snapshots_operation_uq UNIQUE (operation_id),
  ADD CONSTRAINT facebook_ingest_snapshots_write_status_check
    CHECK (write_status IN ('inserted', 'updated', 'unchanged'));
