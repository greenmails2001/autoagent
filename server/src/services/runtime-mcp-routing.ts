function configuredGatewayBaseUrl(): string | null {
  const configured = process.env.AUTOAGENT_N9_MCP_GATEWAY_BASE_URL?.trim();
  if (!configured) return null;
  const parsed = new URL(configured);
  if (parsed.username || parsed.password || parsed.search || parsed.hash)
    throw new Error("AUTOAGENT_N9_MCP_GATEWAY_BASE_URL must not include credentials, query, or fragment");
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
    throw new Error("AUTOAGENT_N9_MCP_GATEWAY_BASE_URL must use HTTP or HTTPS");
  return configured.replace(/\/+$/, "");
}

export function routeRuntimeMcpUrl(nativeUrl: string, target: string): string {
  const gatewayBaseUrl = configuredGatewayBaseUrl();
  if (!gatewayBaseUrl) return nativeUrl;
  if (!/^(project-tools|runtime-tools|gateways\/[A-Za-z0-9_-]+)$/.test(target))
    throw new Error(`Unsupported AutoAgent runtime MCP gateway target: ${target}`);
  return `${gatewayBaseUrl}/${target}`;
}
