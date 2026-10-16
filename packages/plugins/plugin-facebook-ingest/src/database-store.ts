import { createHash } from "node:crypto";
import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { FacebookImportStore } from "./import-job.js";

function table(ctx: PluginContext, name: string): string {
  return `${ctx.db.namespace}.${name}`;
}

export function createFacebookDatabaseStore(ctx: PluginContext, companyId: string): FacebookImportStore {
  return {
    async upsert(record, rawPayload) {
      const rawPayloadHash = createHash("sha256").update(JSON.stringify(rawPayload)).digest("hex");
      const existing = await ctx.db.query<{ content_hash: string }>(
        `SELECT content_hash FROM ${table(ctx, "facebook_shared_posts")}
          WHERE company_id = $1 AND source = 'facebook' AND dedup_key = $2
          LIMIT 1`,
        [companyId, record.dedupKey],
      );
      const status = existing.length === 0
        ? "inserted"
        : existing[0]?.content_hash === record.contentHash ? "unchanged" : "updated";

      await ctx.db.execute(
        `INSERT INTO ${table(ctx, "facebook_shared_posts")}
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
           END`,
        [
          companyId,
          record.schemaVersion,
          record.dedupKey,
          record.contentHash,
          record.relationshipType,
          JSON.stringify(record.sharedPost),
          JSON.stringify(record.originalPost),
          record.crawlStatus,
          record.collectedAt,
        ],
      );
      await ctx.db.execute(
        `INSERT INTO ${table(ctx, "facebook_ingest_snapshots")}
          (company_id, dedup_key, payload_hash, raw_payload_ref, collected_at, collector_version)
         VALUES ($1, $2, $3, NULL, $4::timestamptz, $5)`,
        [companyId, record.dedupKey, rawPayloadHash, record.collectedAt, record.schemaVersion],
      );
      return status;
    },
  };
}
