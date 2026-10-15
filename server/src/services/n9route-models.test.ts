import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listN9routeModels,
  resetN9routeModelsCacheForTests,
} from "./n9route-models.js";

describe("N9route model discovery", () => {
  beforeEach(() => resetN9routeModelsCacheForTests());

  it("loads and sorts models from the configured N9route endpoint", async () => {
    const request = vi.fn(async (_input: URL | RequestInfo, _init?: RequestInit) => new Response(JSON.stringify({
      data: [{ id: "model-z" }, { id: "model-a" }, { id: "model-a" }],
    }), { status: 200 }));
    await expect(listN9routeModels(false, request as typeof fetch, {
      AUTOAGENT_9ROUTE_BASE_URL: "https://route.proj.vn/v1",
      N9ROUTE_API_KEY: "test-key",
    })).resolves.toEqual([
      { id: "model-a", label: "model-a" },
      { id: "model-z", label: "model-z" },
    ]);
    expect(request).toHaveBeenCalledTimes(1);
    const [requestUrl, rawRequestOptions] = request.mock.calls[0] ?? [];
    expect(String(requestUrl)).toBe("https://route.proj.vn/v1/models");
    const requestOptions = rawRequestOptions as RequestInit | undefined;
    expect(requestOptions?.redirect).toBe("error");
    expect(requestOptions?.headers).toEqual({ Authorization: "Bearer test-key" });
    expect(requestOptions?.signal).toBeDefined();
    expect(requestOptions?.signal?.aborted).toBe(false);
  });

  it("returns no OpenAI fallback when N9route is not configured", async () => {
    await expect(listN9routeModels(false, vi.fn() as typeof fetch, {})).resolves.toEqual([]);
  });
});
