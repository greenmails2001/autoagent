import { createHash, randomUUID } from "node:crypto";
import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { FacebookImportStore } from "./import-job.js";

function table(ctx: PluginContext, name: string): string {
  return `${ctx.db.namespace}.${name}`;
}

export function createFacebookDatabaseStore(ctx: PluginContext, companyId: string): FacebookImportStore {
  return {
    async upsert(record, rawPayload) {
      const rawPayloadHash = createHash("sha256").update(JSON.stringify(rawPayload)).digest("hex");
      const operationId = randomUUID();

      await ctx.db.execute(
        `WITH upserted AS (
           INSERT INTO ${table(ctx, "facebook_shared_posts")}
             (company_id, schema_version, source, dedup_key, content_hash, relationship_type,
              shared_post, original_post, crawl_status, collected_at)
           VALUES ($1, $2, 'facebook', $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9::timestamptz)
           ON CONFLICT (company_id, source, dedup_key) DO UPDATE SET
             content_hash = EXCLUDED.content_hash,
             relationship_type = EXCLUDED.relationship_type,
             shared_post = EXCLUDED.shared_post,
             original_post = EXCLUDED.original_post,
             crawl_status = EXCLUDED.crawl_status,
             collected_at = EXCLUDED.collected_at,
             last_seen_at = now(),
             revision = CASE
               WHEN ${table(ctx, "facebook_shared_posts")}.content_hash <> EXCLUDED.content_hash
               THEN ${table(ctx, "facebook_shared_posts")}.revision + 1
               ELSE ${table(ctx, "facebook_shared_posts")}.revision
             END
           RETURNING WITH (OLD AS previous, NEW AS current)
             CASE
               WHEN previous.id IS NULL THEN 'inserted'
               WHEN previous.content_hash = current.content_hash THEN 'unchanged'
               ELSE 'updated'
             END AS write_status
         )
         INSERT INTO ${table(ctx, "facebook_ingest_snapshots")}
           (company_id, dedup_key, payload_hash, raw_payload_ref, collected_at, collector_version,
            operation_id, write_status)
         SELECT $1, $3, $10, NULL, $9::timestamptz, $2, $11::uuid, write_status
         FROM upserted`,
        [
          companyId,
          record.schemaVersion,
          record.dedupKey,
          record.contentHash,
          record.relationshipType,
          record.sharedPost,
          record.originalPost,
          record.crawlStatus,
          record.collectedAt,
          rawPayloadHash,
          operationId,
        ],
      );
      const outcomes = await ctx.db.query<{ write_status: "inserted" | "updated" | "unchanged" }>(
        `SELECT write_status FROM ${table(ctx, "facebook_ingest_snapshots")}
         WHERE company_id = $1 AND operation_id = $2::uuid
         LIMIT 1`,
        [companyId, operationId],
      );
      const outcome = outcomes[0]?.write_status;
      if (!outcome) throw new Error("Facebook import outcome was not recorded");
      return outcome;
    },
  };
}
