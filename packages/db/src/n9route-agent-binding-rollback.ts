import type { Sql } from "postgres";

export type N9routeAgentBindingSnapshotRow = {
  agentId: string;
  hadAiConnection: boolean;
  aiConnection: unknown;
};

export async function captureN9routeAgentBindingSnapshot(
  sql: Sql,
): Promise<N9routeAgentBindingSnapshotRow[]> {
  const rows = await sql`
    SELECT
      id AS "agentId",
      runtime_config ? 'aiConnection' AS "hadAiConnection",
      runtime_config -> 'aiConnection' AS "aiConnection"
    FROM agents
    WHERE adapter_type = 'codex_local'
      AND adapter_config ->> 'model' LIKE 'cx/%'
      AND length(adapter_config ->> 'model') > 3
      AND ${invalidAiConnectionSql(sql)}
    ORDER BY id
  `;
  return rows as unknown as N9routeAgentBindingSnapshotRow[];
}

export async function restoreN9routeAgentBindingSnapshot(
  sql: Sql,
  snapshot: N9routeAgentBindingSnapshotRow[],
): Promise<number> {
  let restored = 0;
  await sql.begin(async (transaction) => {
    for (const row of snapshot) {
      const serializedAiConnection = JSON.stringify(row.aiConnection);
      if (row.hadAiConnection && serializedAiConnection === undefined) {
        throw new Error(`Snapshot row ${row.agentId} has an unserializable aiConnection value`);
      }
      const originalAiConnection = transaction`${serializedAiConnection ?? "null"}::text::jsonb`;
      const runtimeConfig = row.hadAiConnection
        ? transaction`jsonb_set(runtime_config, '{aiConnection}', ${originalAiConnection}, true)`
        : transaction`runtime_config - 'aiConnection'`;
      const result = await transaction`
        UPDATE agents
        SET runtime_config = ${runtimeConfig}
        WHERE id = ${row.agentId}
          AND adapter_type = 'codex_local'
          AND adapter_config ->> 'model' LIKE 'cx/%'
          AND length(adapter_config ->> 'model') > 3
          AND runtime_config -> 'aiConnection' = '{"mode":"responsible_user","method":"api_key","provider":"9route"}'::jsonb
      `;
      restored += result.count;
    }
  });
  return restored;
}

function invalidAiConnectionSql(sql: Sql) {
  return sql`
    CASE
      WHEN NOT (runtime_config ? 'aiConnection') THEN true
      WHEN jsonb_typeof(runtime_config -> 'aiConnection') <> 'object' THEN true
      WHEN runtime_config -> 'aiConnection' ->> 'mode' = 'responsible_user' THEN NOT (
        runtime_config -> 'aiConnection' ->> 'provider' IN ('anthropic', 'openai', '9route', 'openrouter', 'xai', 'google')
        AND runtime_config -> 'aiConnection' ->> 'method' IN ('subscription', 'api_key')
        AND (SELECT count(*) FROM jsonb_object_keys(runtime_config -> 'aiConnection')) = 3
      )
      WHEN runtime_config -> 'aiConnection' ->> 'mode' IN ('shared', 'delegated') THEN NOT (
        runtime_config -> 'aiConnection' ->> 'provider' IN ('anthropic', 'openai', '9route', 'openrouter', 'xai', 'google')
        AND runtime_config -> 'aiConnection' ->> 'method' IN ('subscription', 'api_key')
        AND runtime_config -> 'aiConnection' ->> 'connectionId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        AND runtime_config -> 'aiConnection' ->> 'grantId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        AND (SELECT count(*) FROM jsonb_object_keys(runtime_config -> 'aiConnection')) = 5
      )
      WHEN runtime_config -> 'aiConnection' ->> 'mode' = 'router' THEN NOT (
        runtime_config -> 'aiConnection' ->> 'connectionId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        AND (SELECT count(*) FROM jsonb_object_keys(runtime_config -> 'aiConnection')) = 2
      )
      ELSE true
    END
  `;
}
