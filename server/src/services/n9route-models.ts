import type { AdapterModel } from "../adapters/types.js";

const CACHE_TTL_MS = 60_000;
let cached: { expiresAt: number; models: AdapterModel[] } | null = null;

function configuredEndpoint(env: NodeJS.ProcessEnv = process.env): URL | null {
  const rawBaseUrl = env.AUTOAGENT_9ROUTE_BASE_URL?.trim();
  if (!rawBaseUrl) return null;
  const url = new URL(rawBaseUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
  url.pathname = `${url.pathname.replace(/\/$/, "")}/models`;
  return url;
}

function parseModels(payload: unknown): AdapterModel[] {
  const data = payload && typeof payload === "object" ? (payload as { data?: unknown }).data : undefined;
  if (!Array.isArray(data)) return [];
  const ids = new Set<string>();
  for (const item of data) {
    const id = item && typeof item === "object" ? (item as { id?: unknown }).id : undefined;
    if (typeof id === "string" && id.trim()) ids.add(id.trim());
  }
  return [...ids].sort().map((id) => ({ id, label: id }));
}

export async function listN9routeModels(refresh = false, request: typeof fetch = fetch, env: NodeJS.ProcessEnv = process.env): Promise<AdapterModel[]> {
  if (!refresh && cached && cached.expiresAt > Date.now()) return cached.models;
  const endpoint = configuredEndpoint(env);
  const apiKey = env.N9ROUTE_API_KEY?.trim();
  if (!endpoint || !apiKey) return [];
  try {
    const response = await request(endpoint, { redirect: "error", signal: AbortSignal.timeout(15_000), headers: { Authorization: `Bearer ${apiKey}` } });
    if (!response.ok) return [];
    const models = parseModels(await response.json());
    cached = { expiresAt: Date.now() + CACHE_TTL_MS, models };
    return models;
  } catch { return []; }
}

export function resetN9routeModelsCacheForTests(): void { cached = null; }
