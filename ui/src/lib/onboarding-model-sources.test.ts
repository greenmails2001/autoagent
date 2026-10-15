import { describe, expect, it } from "vitest";
import {
  ONBOARDING_MODEL_SOURCES,
  resolveOnboardingModelSource,
} from "./onboarding-model-sources";

describe("onboarding model sources", () => {
  it("exposes the five product choices with independent runtime and provider identities", () => {
    expect(ONBOARDING_MODEL_SOURCES.map((source) => source.id)).toEqual([
      "claude",
      "codex",
      "n9route",
      "hermes",
      "openclaw",
    ]);
    expect(resolveOnboardingModelSource("codex")).toMatchObject({
      adapterType: "codex_local",
      provider: "openai",
      apiKeyEnvKey: "OPENAI_API_KEY",
    });
    expect(resolveOnboardingModelSource("n9route")).toMatchObject({
      adapterType: "codex_local",
      provider: "9route",
      apiKeyEnvKey: "N9ROUTE_API_KEY",
      apiKeyOnly: true,
    });
  });

  it("does not invent AI connection providers for gateway runtimes", () => {
    const hermes = resolveOnboardingModelSource("hermes");
    const openclaw = resolveOnboardingModelSource("openclaw");
    expect(hermes.adapterType).toBe("hermes_local");
    expect(hermes.provider).toBeUndefined();
    expect(openclaw.adapterType).toBe("openclaw_gateway");
    expect(openclaw.provider).toBeUndefined();
  });
});
