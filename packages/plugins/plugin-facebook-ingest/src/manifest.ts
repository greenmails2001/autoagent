import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

export const FACEBOOK_INGEST_PLUGIN_ID = "paperclipai.plugin-facebook-ingest";

const manifest = {
  id: FACEBOOK_INGEST_PLUGIN_ID,
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Facebook Export Ingest",
  description: "Imports owner-provided Facebook exports and preserves share/original post boundaries.",
  author: "Paperclip",
  categories: ["automation"],
  capabilities: [
    "database.namespace.migrate",
    "database.namespace.read",
    "database.namespace.write",
  ],
  entrypoints: { worker: "./dist/worker.js" },
  database: {
    namespaceSlug: "facebook_ingest",
    migrationsDir: "migrations",
    coreReadTables: ["companies"],
  },
} satisfies PaperclipPluginManifestV1;

export default manifest;
