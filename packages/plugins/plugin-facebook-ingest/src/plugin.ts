import type { PluginContext } from "@paperclipai/plugin-sdk";
import { runFacebookExportImport, type FacebookImportStore } from "./import-job.js";

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

export type FacebookImportStoreFactory = (companyId: string) => FacebookImportStore;

export function registerFacebookImportAction(ctx: PluginContext, storeFactory: FacebookImportStoreFactory): void {
  ctx.actions.register("import-facebook-export", async (params, context) => {
    if (!context.companyId) throw new Error("Authenticated company scope is required");
    if (!Array.isArray(params.entries)) throw new Error("entries must be an array");

    const result = await runFacebookExportImport({
      entries: params.entries,
      account: {
        accountId: requiredString(params.accountId, "accountId"),
        accountName: requiredString(params.accountName, "accountName"),
      },
      collectedAt: new Date().toISOString(),
      store: storeFactory(context.companyId),
    });

    // The response intentionally contains only counters; raw export data stays private.
    return { companyId: context.companyId, ...result };
  });
}
