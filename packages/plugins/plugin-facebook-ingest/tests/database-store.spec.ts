import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import postgres from "postgres";
import type { PluginContext } from "@paperclipai/plugin-sdk";
import { getEmbeddedPostgresTestSupport, startEmbeddedPostgresTestDatabase } from "@paperclipai/db";
import { createFacebookDatabaseStore } from "../src/database-store.js";
import { normalizeFacebookExport } from "../src/facebook-export.js";

const NAMESPACE = "plugin_facebook_ingest_c37e6c4382";
const cleanups: Array<() => Promise<void>> = [];
const support = await getEmbeddedPostgresTestSupport();
const describeEmbeddedPostgres = support.supported ? describe : describe.skip;

afterEach(async () => {
  while (cleanups.length > 0) await cleanups.pop()?.();
});

async function applyMigration(sql: ReturnType<typeof postgres>, filename: string): Promise<void> {
  const { readFile } = await import("node:fs/promises");
  const contents = await readFile(new URL(`../migrations/${filename}`, import.meta.url), "utf8");
  for (const statement of contents.split(";").map((value) => value.trim()).filter(Boolean)) {
    await sql.unsafe(statement);
  }
}

describeEmbeddedPostgres("Facebook ingest database store", () => {
  it("verifies and rolls back the atomic outcome migration", async () => {
    const { sql } = await fixture();

    await applyMigration(sql, "verify/002_atomic_import_outcomes.verify.sql");
    await applyMigration(sql, "rollback/002_atomic_import_outcomes.rollback.sql");

    const columns = await sql<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ${NAMESPACE}
        AND table_name = 'facebook_ingest_snapshots'
        AND column_name IN ('operation_id', 'write_status')
    `;
    expect(columns).toEqual([]);
  }, 90_000);

  it("reports one insert and one unchanged outcome for concurrent identical imports", async () => {
    const { sql, store } = await fixture();
    const record = normalized("same content");

    const outcomes = await Promise.all([
      store.upsert(record, { export: 1 }),
      store.upsert(record, { export: 1 }),
    ]);

    expect(outcomes.sort()).toEqual(["inserted", "unchanged"]);
    const snapshots = await sql<{ write_status: string }[]>`
      SELECT write_status FROM ${sql(NAMESPACE)}.facebook_ingest_snapshots
      ORDER BY created_at, id
    `;
    expect(snapshots.map((row) => row.write_status).sort()).toEqual(["inserted", "unchanged"]);
  }, 90_000);

  it("rolls back the main row when snapshot insertion fails", async () => {
    const { sql, store, companyId } = await fixture();
    await sql.unsafe(`
      CREATE FUNCTION ${NAMESPACE}.reject_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'snapshot rejected'; END $$
    `);
    await sql.unsafe(`
      CREATE TRIGGER reject_snapshot BEFORE INSERT ON ${NAMESPACE}.facebook_ingest_snapshots
      FOR EACH ROW EXECUTE FUNCTION ${NAMESPACE}.reject_snapshot()
    `);

    await expect(store.upsert(normalized("must roll back"), { export: 2 })).rejects.toThrow("snapshot rejected");

    const rows = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM ${sql(NAMESPACE)}.facebook_shared_posts
      WHERE company_id = ${companyId}
    `;
    expect(rows[0]?.count).toBe("0");
  }, 90_000);
});

async function fixture() {
  const database = await startEmbeddedPostgresTestDatabase("facebook-ingest-store-");
  cleanups.push(database.cleanup);
  const sql = postgres(database.connectionString, { max: 4, onnotice: () => {} });
  cleanups.push(async () => sql.end());
  await sql.unsafe(`CREATE SCHEMA ${NAMESPACE}`);
  await applyMigration(sql, "001_facebook_ingest.sql");
  await applyMigration(sql, "002_atomic_import_outcomes.sql");
  const companyId = randomUUID();
  await sql`INSERT INTO public.companies (id, name, issue_prefix) VALUES (${companyId}, 'Store Test', 'FBST')`;

  const db = {
    namespace: NAMESPACE,
    async query<T>(statement: string, params?: unknown[]) {
      return sql.unsafe<T[]>(statement, params as never[] | undefined);
    },
    async execute(statement: string, params?: unknown[]) {
      const result = await sql.unsafe(statement, params as never[] | undefined);
      return { rowCount: result.count };
    },
  };
  const ctx = { db } as unknown as PluginContext;
  return { sql, companyId, store: createFacebookDatabaseStore(ctx, companyId) };
}

function normalized(text: string) {
  return normalizeFacebookExport(
    { timestamp: 1_700_000_000, data: [{ post: text }] },
    { accountId: "lan", accountName: "Lan", collectedAt: "2026-10-16T00:00:00.000Z" },
  );
}
