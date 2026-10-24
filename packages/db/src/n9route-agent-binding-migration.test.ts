import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { describe, expect, it } from "vitest";
import { applyPendingMigrations } from "./client.js";
import { getEmbeddedPostgresTestSupport, startEmbeddedPostgresTestDatabase } from "./test-embedded-postgres.js";

const support = await getEmbeddedPostgresTestSupport();

(support.supported ? describe : describe.skip)("9route agent binding backfill", () => {
  it("backfills only eligible cx agents and is idempotent without changing grants or defaults", async () => {
    const database = await startEmbeddedPostgresTestDatabase("paperclip-9route-agent-binding-");
    const sql = postgres(database.connectionString, { max: 1 });
    try {
      await applyPendingMigrations(database.connectionString);
      const migration = await readFile(new URL("./migrations/0340_n9route_agent_binding.sql", import.meta.url), "utf8");
      const hash = createHash("sha256").update(migration).digest("hex");
      await sql`DELETE FROM drizzle.__drizzle_migrations WHERE hash = ${hash}`;

      const companyId = randomUUID();
      await sql`INSERT INTO companies (id, name, issue_prefix) VALUES (${companyId}, 'N9 regression', 'N9R')`;
      const ids = {
        designer: randomUUID(),
        otherRole: randomUUID(),
        explicit: randomUUID(),
        nullBinding: randomUUID(),
        openAi: randomUUID(),
        claude: randomUUID(),
        barePrefix: randomUUID(),
      };
      await sql`
        INSERT INTO agents (id, company_id, name, role, adapter_type, adapter_config, runtime_config)
        VALUES
          (${ids.designer}, ${companyId}, 'N9 DocAI Designer', 'document designer', 'codex_local', '{"model":"cx/gpt-6-sol","reasoningEffort":"high"}', '{"heartbeat":{"enabled":true},"custom":{"retained":true}}'),
          (${ids.otherRole}, ${companyId}, 'Cost Review Worker', 'quantity surveyor', 'codex_local', '{"model":"cx/gpt-6-sol"}', '{"heartbeat":{"maxConcurrentRuns":2}}'),
          (${ids.explicit}, ${companyId}, 'Explicit Binding', 'engineer', 'codex_local', '{"model":"cx/gpt-6-sol"}', '{"aiConnection":{"mode":"responsible_user","method":"api_key","provider":"openai"},"keep":1}'),
          (${ids.nullBinding}, ${companyId}, 'Manual Review', 'engineer', 'codex_local', '{"model":"cx/gpt-6-sol"}', '{"aiConnection":null,"keep":2}'),
          (${ids.openAi}, ${companyId}, 'OpenAI Agent', 'engineer', 'codex_local', '{"model":"gpt-6-sol"}', '{"keep":3}'),
          (${ids.claude}, ${companyId}, 'Claude Agent', 'engineer', 'claude_local', '{"model":"cx/gpt-6-sol"}', '{"keep":4}'),
          (${ids.barePrefix}, ${companyId}, 'Bare Prefix', 'engineer', 'codex_local', '{"model":"cx/"}', '{"keep":5}')
      `;
      const protectedBefore = await sql`
        SELECT
          (SELECT count(*)::int FROM connection_grants) AS grants,
          (SELECT count(*)::int FROM ai_provider_defaults) AS provider_defaults,
          (SELECT count(*)::int FROM ai_connection_defaults) AS connection_defaults
      `;

      await applyPendingMigrations(database.connectionString);
      const rows = await sql`SELECT id, adapter_config, runtime_config, updated_at FROM agents WHERE company_id = ${companyId} ORDER BY name`;
      const byId = new Map(rows.map((row) => [row.id, row]));
      const expected = { mode: "responsible_user", method: "api_key", provider: "9route" };
      expect(byId.get(ids.designer)?.runtime_config).toEqual({ heartbeat: { enabled: true }, custom: { retained: true }, aiConnection: expected });
      expect(byId.get(ids.otherRole)?.runtime_config).toEqual({ heartbeat: { maxConcurrentRuns: 2 }, aiConnection: expected });
      expect(byId.get(ids.explicit)?.runtime_config).toEqual({ aiConnection: { mode: "responsible_user", method: "api_key", provider: "openai" }, keep: 1 });
      expect(byId.get(ids.nullBinding)?.runtime_config).toEqual({ aiConnection: null, keep: 2 });
      expect(byId.get(ids.openAi)?.runtime_config).toEqual({ keep: 3 });
      expect(byId.get(ids.claude)?.runtime_config).toEqual({ keep: 4 });
      expect(byId.get(ids.barePrefix)?.runtime_config).toEqual({ keep: 5 });
      expect(byId.get(ids.designer)?.adapter_config).toEqual({ model: "cx/gpt-6-sol", reasoningEffort: "high" });

      const firstUpdatedAt = new Map(rows.map((row) => [row.id, row.updated_at]));
      await sql`DELETE FROM drizzle.__drizzle_migrations WHERE hash = ${hash}`;
      await applyPendingMigrations(database.connectionString);
      const afterRerun = await sql`SELECT id, runtime_config, updated_at FROM agents WHERE company_id = ${companyId} ORDER BY name`;
      expect(afterRerun.map((row) => [row.id, row.runtime_config, row.updated_at])).toEqual(
        rows.map((row) => [row.id, row.runtime_config, firstUpdatedAt.get(row.id)]),
      );
      expect(await sql`
        SELECT
          (SELECT count(*)::int FROM connection_grants) AS grants,
          (SELECT count(*)::int FROM ai_provider_defaults) AS provider_defaults,
          (SELECT count(*)::int FROM ai_connection_defaults) AS connection_defaults
      `).toEqual(protectedBefore);
    } finally {
      await sql.end();
      await database.cleanup();
    }
  }, 60_000);
});
