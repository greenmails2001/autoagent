import type { AiProvider } from "@paperclipai/shared";

export type OnboardingModelSource = {
  id: "claude" | "codex" | "n9route" | "hermes" | "openclaw";
  adapterType: string;
  provider?: AiProvider;
  apiKeyEnvKey?: string;
  apiKeyOnly?: boolean;
};

export const ONBOARDING_MODEL_SOURCES: OnboardingModelSource[] = [
  { id: "claude", adapterType: "claude_local", provider: "anthropic", apiKeyEnvKey: "ANTHROPIC_API_KEY" },
  { id: "codex", adapterType: "codex_local", provider: "openai", apiKeyEnvKey: "OPENAI_API_KEY" },
  { id: "n9route", adapterType: "codex_local", provider: "9route", apiKeyEnvKey: "N9ROUTE_API_KEY", apiKeyOnly: true },
  { id: "hermes", adapterType: "hermes_local" },
  { id: "openclaw", adapterType: "openclaw_gateway" },
];

export function resolveOnboardingModelSource(id: OnboardingModelSource["id"]): OnboardingModelSource {
  return ONBOARDING_MODEL_SOURCES.find((source) => source.id === id)!;
}
