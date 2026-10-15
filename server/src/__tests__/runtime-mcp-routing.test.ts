import { afterEach, describe, expect, it, vi } from "vitest";

import { routeRuntimeMcpUrl } from "../services/runtime-mcp-routing.js";


describe("AutoAgent N9 MCP gateway routing", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps native MCP URLs when the N9 gateway is not configured", () => {
    vi.stubEnv("AUTOAGENT_N9_MCP_GATEWAY_BASE_URL", "");

    expect(
      routeRuntimeMcpUrl(
        "https://autoagent.proj.vn/api/mcp/project-tools",
        "project-tools",
      ),
    ).toBe("https://autoagent.proj.vn/api/mcp/project-tools");
  });

  it.each([
    ["project-tools", "project-tools"],
    ["runtime-tools", "runtime-tools"],
    ["gateways/gw_abc-123", "gateways/gw_abc-123"],
  ])("routes %s through the internal N9 gateway", (target, expectedPath) => {
    vi.stubEnv(
      "AUTOAGENT_N9_MCP_GATEWAY_BASE_URL",
      "http://platform-api:8000/api/platform/connectors/autoagent_runtime/mcp/",
    );

    expect(routeRuntimeMcpUrl("https://autoagent.proj.vn/native", target)).toBe(
      `http://platform-api:8000/api/platform/connectors/autoagent_runtime/mcp/${expectedPath}`,
    );
  });

  it("rejects a gateway base URL with query or credentials", () => {
    vi.stubEnv(
      "AUTOAGENT_N9_MCP_GATEWAY_BASE_URL",
      "https://user:pass@gateway.example/mcp?unsafe=1",
    );

    expect(() => routeRuntimeMcpUrl("https://autoagent.proj.vn/native", "project-tools"))
      .toThrow("AUTOAGENT_N9_MCP_GATEWAY_BASE_URL must not include credentials, query, or fragment");
  });
});
