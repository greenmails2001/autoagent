import { describe, expect, it } from "vitest";
import {
  aiProviderForAdapter,
} from "./AiConnectionField";
import {
  adapterRequiresProviderScopedModel,
  aiProvidersForAdapter,
} from "./model";

describe("AI connection providers by adapter", () => {
  it("offers OpenAI and 9route for the Codex adapter", () => {
    expect(aiProvidersForAdapter("codex_local")).toEqual(["openai", "9route"]);
  });

  it("keeps OpenAI as the legacy Codex default", () => {
    expect(aiProviderForAdapter("codex_local")).toBe("openai");
  });

  it("does not offer unrelated providers for other adapters", () => {
    expect(aiProvidersForAdapter("claude_local")).toEqual(["anthropic"]);
    expect(aiProvidersForAdapter("opencode_local")).toEqual(["openrouter"]);
    expect(aiProvidersForAdapter("grok_local")).toEqual(["xai"]);
  });

  it("recognizes adapters whose model catalog depends on provider", () => {
    expect(adapterRequiresProviderScopedModel("codex_local")).toBe(true);
    expect(adapterRequiresProviderScopedModel("claude_local")).toBe(false);
  });
});
