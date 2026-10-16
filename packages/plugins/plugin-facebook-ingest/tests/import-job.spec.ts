import { describe, expect, it } from "vitest";
import { runFacebookExportImport } from "../src/import-job.js";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "../src/manifest.js";
import { registerFacebookImportAction } from "../src/plugin.js";

describe("runFacebookExportImport", () => {
  it("imports valid entries idempotently and reports rejected entries", async () => {
    const written: Array<{ dedupKey: string; rawPayload: unknown }> = [];
    const result = await runFacebookExportImport({
      entries: [
        { timestamp: 1_700_000_000, data: [{ post: "Same post" }] },
        { timestamp: 1_700_000_000, data: [{ post: "Same post" }] },
        { title: "invalid" },
      ],
      account: { accountId: "lan", accountName: "Lan" },
      collectedAt: "2026-10-16T00:00:00.000Z",
      store: {
        async upsert(record, rawPayload) {
          written.push({ dedupKey: record.dedupKey, rawPayload });
          return written.filter((item) => item.dedupKey === record.dedupKey).length === 1 ? "inserted" : "unchanged";
        },
      },
    });

    expect(result).toEqual({ processed: 3, inserted: 1, updated: 0, unchanged: 1, rejected: 1 });
    expect(written).toHaveLength(2);
    expect(written[0]?.rawPayload).toEqual({ timestamp: 1_700_000_000, data: [{ post: "Same post" }] });
  });
});

describe("Facebook import plugin action", () => {
  it("uses authenticated company scope and never returns raw export data", async () => {
    const harness = createTestHarness({ manifest });
    registerFacebookImportAction(harness.ctx, () => ({
      async upsert() {
        return "inserted";
      },
    }));

    const result = await harness.performAction<Record<string, unknown>>(
      "import-facebook-export",
      {
        accountId: "lan",
        accountName: "Lan",
        entries: [{ timestamp: 1_700_000_000, data: [{ post: "Private export text" }] }],
      },
      { companyId: "company-1", actor: { type: "user", userId: "user-1" } },
    );

    expect(result).toMatchObject({ companyId: "company-1", processed: 1, inserted: 1 });
    expect(JSON.stringify(result)).not.toContain("Private export text");
  });
});
