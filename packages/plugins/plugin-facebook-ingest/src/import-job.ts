import { normalizeFacebookExport, type FacebookExportAccount } from "./facebook-export.js";
import type { FacebookSharedPostRecord } from "./contract.js";

export type FacebookImportStore = {
  upsert(
    record: FacebookSharedPostRecord,
    rawPayload: unknown,
  ): Promise<"inserted" | "updated" | "unchanged">;
};

export async function runFacebookExportImport(input: {
  entries: unknown[];
  account: Omit<FacebookExportAccount, "collectedAt">;
  collectedAt: string;
  store: FacebookImportStore;
}) {
  const result = { processed: input.entries.length, inserted: 0, updated: 0, unchanged: 0, rejected: 0 };
  for (const entry of input.entries) {
    try {
      const record = normalizeFacebookExport(entry, { ...input.account, collectedAt: input.collectedAt });
      const status = await input.store.upsert(record, entry);
      result[status] += 1;
    } catch {
      result.rejected += 1;
    }
  }
  return result;
}
