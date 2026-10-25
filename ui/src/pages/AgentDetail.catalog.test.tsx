// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { ConfigurationTab } from "./AgentDetail";
import { TooltipProvider } from "../components/ui/tooltip";
import { ConfigurationTab as ProductionConfigurationTab } from "./AgentDetail.production";

const api = vi.hoisted(() => ({ adapterModels: vi.fn(async () => []) }));
const form = vi.hoisted(() => vi.fn());
vi.mock("../api/agents", () => ({ agentsApi: api }));
vi.mock("@/lib/router", () => ({ useNavigate: () => vi.fn(), useParams: () => ({}) }));
vi.mock("../context/ToastContext", () => ({ useToastActions: () => ({ pushToast: vi.fn() }) }));
vi.mock("../components/AgentConfigForm", () => ({ AgentConfigForm: (props: unknown) => { form(props); return null; } }));

describe("Agent Detail model catalog ownership", () => {
  describe.each([["active", ConfigurationTab], ["production", ProductionConfigurationTab]] as const)("%s", (_surface, Tab) => {
  it.each([undefined, { mode: "responsible_user", provider: "9route", method: "api_key" }])(
    "delegates the effective binding and model to the config form without a stale parent catalog request (%j)", async (aiConnection) => {
      api.adapterModels.mockClear();
      const agent = { id: "a1", companyId: "c1", adapterType: "codex_local", adapterConfig: { model: "vendor/canonical" }, runtimeConfig: aiConnection ? { aiConnection } : {}, permissions: {} } as unknown as ComponentProps<typeof ConfigurationTab>["agent"];
      const container = document.createElement("div");
      const root = createRoot(container);
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      try {
        await act(async () => root.render(<QueryClientProvider client={client}>
          <TooltipProvider><Tab agent={agent} companyId="c1" onDirtyChange={vi.fn()} onSaveActionChange={vi.fn()} onCancelActionChange={vi.fn()} onSavingChange={vi.fn()} updatePermissions={{ mutate: vi.fn(), isPending: false }} /></TooltipProvider>
        </QueryClientProvider>));
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
        expect(api.adapterModels).not.toHaveBeenCalled();
        expect(form).toHaveBeenLastCalledWith(expect.objectContaining({ agent }));
      } finally { await act(async () => root.unmount()); client.clear(); }
    },
  );
  });
});
