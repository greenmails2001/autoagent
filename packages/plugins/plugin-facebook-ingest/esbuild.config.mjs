import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/manifest.ts", "src/worker.ts"],
  outdir: "dist",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  sourcemap: true,
  external: ["@paperclipai/plugin-sdk"],
});
