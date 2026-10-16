import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import { createFacebookDatabaseStore } from "./database-store.js";
import { registerFacebookImportAction } from "./plugin.js";

const plugin = definePlugin({
  async setup(ctx) {
    registerFacebookImportAction(ctx, (companyId) => createFacebookDatabaseStore(ctx, companyId));
  },
  async onHealth() {
    return { status: "ok", message: "Facebook export ingest worker is ready" };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
