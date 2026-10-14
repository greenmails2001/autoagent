import { describe, expect, it } from "vitest";
import { providerUsesApiKeyOnly } from "./model";

describe("AI connection credential method", () => {
  it("routes N9route and OpenRouter through API key credentials", () => {
    expect(providerUsesApiKeyOnly("9route")).toBe(true);
    expect(providerUsesApiKeyOnly("openrouter")).toBe(true);
  });

  it("keeps subscription-capable providers on their managed login flow", () => {
    expect(providerUsesApiKeyOnly("openai")).toBe(false);
    expect(providerUsesApiKeyOnly("anthropic")).toBe(false);
    expect(providerUsesApiKeyOnly("xai")).toBe(false);
  });
});
