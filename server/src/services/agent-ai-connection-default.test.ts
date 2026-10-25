import { describe, expect, it } from "vitest";
import { ensureModelAiConnectionBinding, resolveUpdatedAiConnectionBinding } from "./agent-ai-connection-default.js";

describe("runtime-default AI connection binding", () => {
  it.each([
    ["N9 DocAI Designer", "document designer"],
    ["Cost Review Worker", "quantity surveyor"],
  ])("leaves %s (%s) on the runtime default for cx models", (_name, _role) => {
    const runtimeConfig = { heartbeat: { enabled: true }, custom: { retained: true } };
    expect(ensureModelAiConnectionBinding(
      "codex_local",
      { model: "cx/gpt-6-sol", reasoningEffort: "high" },
      runtimeConfig,
    )).toBe(runtimeConfig);
  });

  it("preserves an explicit binding instead of replacing credentials or grants", () => {
    const runtimeConfig = {
      heartbeat: { enabled: false },
      aiConnection: {
        mode: "shared",
        method: "api_key",
        provider: "9route",
        connectionId: "11111111-1111-4111-8111-111111111111",
        grantId: "22222222-2222-4222-8222-222222222222",
      },
    };

    expect(ensureModelAiConnectionBinding("codex_local", { model: "cx/gpt-6-sol" }, runtimeConfig))
      .toBe(runtimeConfig);
  });

  it.each([
    null,
    "9route",
    {},
    { mode: "responsible_user", method: "api_key" },
    { mode: "shared", method: "api_key", provider: "9route" },
  ])("does not turn a malformed legacy binding (%j) into a specific provider", (aiConnection) => {
    const runtimeConfig = { heartbeat: { enabled: true }, aiConnection };
    expect(ensureModelAiConnectionBinding(
      "codex_local",
      { model: "cx/gpt-6-sol" },
      runtimeConfig,
    )).toBe(runtimeConfig);
  });

  it.each([
    ["codex_local", { model: "gpt-6-sol" }],
    ["claude_local", { model: "cx/gpt-6-sol" }],
    ["codex_local", { model: "cx/" }],
    ["codex_local", {}],
  ])("does not derive 9route for adapter %s and config %j", (adapterType, adapterConfig) => {
    const runtimeConfig = { heartbeat: { enabled: true } };
    expect(ensureModelAiConnectionBinding(adapterType, adapterConfig, runtimeConfig)).toBe(runtimeConfig);
  });
});

describe("AI connection edit precedence", () => {
  const existing = { mode: "responsible_user", method: "api_key", provider: "9route" } as const;

  it("keeps the existing specific provider when runtimeConfig is omitted", () => {
    expect(resolveUpdatedAiConnectionBinding(null, existing)).toEqual(existing);
  });

  it("clears the specific provider when the replacement runtimeConfig omits aiConnection", () => {
    expect(resolveUpdatedAiConnectionBinding({ heartbeat: { enabled: true } }, existing)).toBeUndefined();
  });

  it("uses the explicitly selected provider", () => {
    const selected = { mode: "responsible_user", method: "subscription", provider: "openai" } as const;
    expect(resolveUpdatedAiConnectionBinding({ aiConnection: selected }, existing)).toEqual(selected);
  });
});
