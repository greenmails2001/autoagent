import { aiProviderSchema } from "./ai-connections.js";

/** Allowlisted display metadata; excludes credential and connection references. */
export interface BuiltInAgentSetupMetadata {
  model: string | null;
  binding: { mode: string; provider?: string };
}
export function projectBuiltInAgentSetup(agent: {
  adapterConfig: Record<string, unknown>;
  runtimeConfig?: Record<string, unknown>;
}): BuiltInAgentSetupMetadata {
  const value = agent.runtimeConfig?.aiConnection;
  const binding = value && typeof value === "object" ? value as Record<string, unknown> : null;
  const provider = aiProviderSchema.safeParse(binding?.provider);
  return {
    model: typeof agent.adapterConfig.model === "string" ? agent.adapterConfig.model : null,
    binding: binding ? {
      mode: ["responsible_user", "shared", "delegated", "router"].includes(String(binding.mode)) ? String(binding.mode) : "unknown",
      ...(provider.success ? { provider: provider.data } : {}),
    } : { mode: "runtime_default" },
  };
}

/** Used by every built-in response and by UI wire-contract regression tests. */
export function redactBuiltInAgentSetup<T extends {
  adapterConfig: Record<string, unknown>;
  runtimeConfig?: Record<string, unknown>;
}>(agent: T) {
  return {
    setupMetadata: projectBuiltInAgentSetup(agent),
    agent: { ...agent, adapterConfig: {}, runtimeConfig: {} },
  };
}
