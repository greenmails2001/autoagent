import { describe, expect, it } from "vitest";
import { ensureModelAiConnectionBinding } from "./agent-ai-connection-default.js";

describe("model-derived AI connection binding", () => {
  it.each([
    ["N9 DocAI Designer", "document designer"],
    ["Cost Review Worker", "quantity surveyor"],
  ])("binds %s (%s) to the responsible user's 9route connection for cx models", (_name, _role) => {
    expect(ensureModelAiConnectionBinding(
      "codex_local",
      { model: "cx/gpt-6-sol", reasoningEffort: "high" },
      { heartbeat: { enabled: true }, custom: { retained: true } },
    )).toEqual({
      heartbeat: { enabled: true },
      custom: { retained: true },
      aiConnection: { mode: "responsible_user", method: "api_key", provider: "9route" },
    });
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
  ])("normalizes a missing or malformed binding (%j) for cx models", (aiConnection) => {
    expect(ensureModelAiConnectionBinding(
      "codex_local",
      { model: "cx/gpt-6-sol" },
      { heartbeat: { enabled: true }, aiConnection },
    )).toEqual({
      heartbeat: { enabled: true },
      aiConnection: { mode: "responsible_user", method: "api_key", provider: "9route" },
    });
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
