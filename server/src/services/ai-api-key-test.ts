import type { AiProvider } from "@paperclipai/shared";
import { unprocessable } from "../errors.js";

/** Fixed provider endpoints; credentials are never sent to a caller-supplied URL or through a redirect. */
export async function validateAiApiKey(
  provider: AiProvider,
  key: string,
  request: typeof fetch = fetch,
  runtimeEnv: Record<string, string | undefined> = process.env,
) {
  const n9routeBaseUrl = runtimeEnv.AUTOAGENT_9ROUTE_BASE_URL?.trim();
  if (provider === "9route" && !n9routeBaseUrl)
    throw unprocessable("9route is not configured on this Paperclip instance.");
  let n9routeEndpoint: string | undefined;
  if (provider === "9route") {
    const baseUrl = new URL(n9routeBaseUrl!);
    if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash)
      throw unprocessable("The operator-configured 9route base URL is invalid.");
    baseUrl.pathname = `${baseUrl.pathname.replace(/\/$/, "")}/models`;
    n9routeEndpoint = baseUrl.toString();
  }
  const endpoints = {
    anthropic: "https://api.anthropic.com/v1/models?limit=1",
    openai: "https://api.openai.com/v1/models",
    "9route": n9routeEndpoint!,
    openrouter: "https://openrouter.ai/api/v1/key",
    xai: "https://api.x.ai/v1/models",
    google: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1",
  };
  let response: Response;
  try {
    response = await request(endpoints[provider], {
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers:
        provider === "google" ? { "x-goog-api-key": key } : provider === "anthropic"
          ? { "x-api-key": key, "anthropic-version": "2023-06-01" }
          : { Authorization: `Bearer ${key}` },
    });
  } catch {
    throw unprocessable("Could not verify the account. Try again.", { code: "ai_connection_verification_failed" });
  }
  await response.body?.cancel();
  if (!response.ok)
    throw unprocessable(
      response.status === 401 || response.status === 403
        ? "The provider rejected this API key."
        : "The provider could not verify this account. Try again.",
      { code: response.status === 401 || response.status === 403 ? "ai_connection_api_key_rejected" : "ai_connection_verification_failed" },
    );
}
