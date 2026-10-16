import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import postgres from "postgres";
import {
  getEmbeddedPostgresTestSupport,
  startEmbeddedPostgresTestDatabase,
} from "./test-embedded-postgres.js";

const NAMESPACE = "plugin_facebook_ingest_c37e6c4382";
const cleanups: Array<() => Promise<void>> = [];
const support = await getEmbeddedPostgresTestSupport();
const describeEmbeddedPostgres = support.supported ? describe : describe.skip;

afterEach(async () => {
  while (cleanups.length > 0) await cleanups.pop()?.();
});

async function sqlFile(relativePath: string): Promise<string> {
  return readFile(
    fileURLToPath(
      new URL(`../../plugins/plugin-facebook-ingest/migrations/${relativePath}`, import.meta.url),
    ),
    "utf8",
  );
}

async function applyStatements(
  sql: ReturnType<typeof postgres>,
  relativePath: string,
): Promise<void> {
  for (const statement of (await sqlFile(relativePath)).split(";").map((value) => value.trim()).filter(Boolean)) {
    await sql.unsafe(statement);
  }
}

describeEmbeddedPostgres("Facebook ingest plugin migration", () => {
  it("enforces tenant-scoped deduplication and supports concurrent upserts", async () => {
    const database = await startEmbeddedPostgresTestDatabase("facebook-ingest-plugin-");
    cleanups.push(database.cleanup);
    const sql = postgres(database.connectionString, { max: 4, onnotice: () => {} });
    cleanups.push(async () => sql.end());

    await sql.unsafe(`CREATE SCHEMA ${NAMESPACE}`);
    await applyStatements(sql, "001_facebook_ingest.sql");

    const [{ id: companyId }] = await sql<{ id: string }[]>`
      INSERT INTO public.companies (name, issue_prefix)
      VALUES ('Facebook Ingest Test', 'FBIT')
      RETURNING id
    `;
    const [{ id: secondCompanyId }] = await sql<{ id: string }[]>`
      INSERT INTO public.companies (name, issue_prefix)
      VALUES ('Facebook Ingest Tenant Two', 'FBTT')
      RETURNING id
    `;

    const upsert = async (contentHash: string, text: string) => sql.unsafe(
      `INSERT INTO ${NAMESPACE}.facebook_shared_posts
        (company_id, schema_version, source, dedup_key, content_hash, relationship_type,
         shared_post, original_post, crawl_status, collected_at)
       VALUES ($1, 'facebook_shared_post.v1', 'facebook', 'post:shared-1', $2, 'share',
         $3::jsonb, NULL, 'complete', '2026-10-16T00:00:00.000Z'::timestamptz)
       ON CONFLICT (company_id, source, dedup_key) DO UPDATE SET
         content_hash = EXCLUDED.content_hash,
         shared_post = EXCLUDED.shared_post,
         last_seen_at = now(),
         revision = CASE
           WHEN ${NAMESPACE}.facebook_shared_posts.content_hash <> EXCLUDED.content_hash
           THEN ${NAMESPACE}.facebook_shared_posts.revision + 1
           ELSE ${NAMESPACE}.facebook_shared_posts.revision
         END`,
      [companyId, contentHash, { text }],
    );

    await Promise.all([
      upsert("a".repeat(64), "first"),
      upsert("b".repeat(64), "second"),
    ]);

    const [current] = await sql<{ content_hash: string; shared_post: { text: string } }[]>`
      SELECT content_hash, shared_post
      FROM ${sql(NAMESPACE)}.facebook_shared_posts
      WHERE company_id = ${companyId} AND dedup_key = 'post:shared-1'
    `;
    await upsert(current!.content_hash, current!.shared_post.text);

    await sql.unsafe(
      `INSERT INTO ${NAMESPACE}.facebook_shared_posts
        (company_id, schema_version, source, dedup_key, content_hash, relationship_type,
         shared_post, original_post, crawl_status, collected_at)
       VALUES ($1, 'facebook_shared_post.v1', 'facebook', 'post:shared-1', $2, 'original',
         '{}'::jsonb, $3::jsonb, 'complete', now())`,
      [secondCompanyId, "d".repeat(64), JSON.stringify(null)],
    );

    const rows = await sql<{ count: string; revision: number }[]>`
      SELECT count(*)::text AS count, max(revision)::integer AS revision
      FROM ${sql(NAMESPACE)}.facebook_shared_posts
      WHERE company_id = ${companyId} AND dedup_key = 'post:shared-1'
    `;
    expect(rows[0]).toEqual({ count: "1", revision: 2 });

    const tenantRows = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count
      FROM ${sql(NAMESPACE)}.facebook_shared_posts
      WHERE source = 'facebook' AND dedup_key = 'post:shared-1'
    `;
    expect(tenantRows[0]?.count).toBe("2");

    await expect(
      sql.unsafe(
        `INSERT INTO ${NAMESPACE}.facebook_shared_posts
          (company_id, schema_version, source, dedup_key, content_hash, relationship_type,
           shared_post, crawl_status, collected_at)
         VALUES ($1, 'facebook_shared_post.v1', 'facebook', 'post:bad', $2, 'invalid',
           '{}'::jsonb, 'complete', now())`,
        [companyId, "c".repeat(64)],
      ),
    ).rejects.toMatchObject({ code: "23514" });

    const indexes = await sql<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = ${NAMESPACE}
    `;
    const requiredIndexes = [
      "facebook_shared_posts_company_source_dedup_uq",
      "facebook_shared_posts_company_sort_idx",
      "facebook_shared_posts_company_status_sort_idx",
      "facebook_shared_posts_company_sharer_sort_idx",
      "facebook_ingest_snapshots_company_dedup_idx",
    ];
    expect(indexes.map((row) => row.indexname).filter((name) => requiredIndexes.includes(name))).toEqual(
      expect.arrayContaining(requiredIndexes),
    );

    await applyStatements(sql, "verify/001_facebook_ingest.verify.sql");
    await applyStatements(sql, "rollback/001_facebook_ingest.rollback.sql");

    const tables = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count
      FROM information_schema.tables
      WHERE table_schema = ${NAMESPACE}
        AND table_name IN ('facebook_shared_posts', 'facebook_ingest_snapshots')
    `;
    expect(tables[0]?.count).toBe("0");
  }, 90_000);
});
