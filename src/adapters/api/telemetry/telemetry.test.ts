import { afterEach, describe, expect, test, vi } from "vitest";
import { ApiTelemetry } from "@/adapters/api/telemetry/telemetry";
import { createEnvironment } from "@/testing/environment";
import { fetchApi } from "@/adapters/api/client/api";

type FetchStub = ReturnType<typeof vi.fn<(url: string, init: RequestInit) => Promise<Response>>>;

function stubFetch(): FetchStub {
  const fetch: FetchStub = vi.fn(() => Promise.resolve(new Response("{}")));

  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("ApiTelemetry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("pings the server and identifies every later request", async() => {
    const fetch = stubFetch();
    const headers = { "X-User-Id": "9", "X-Version": "1.0", "X-Platform": "mobile" };

    new ApiTelemetry("9").announce(createEnvironment({ version: "1.0", device: "mobile" }));
    await fetchApi("post", { ids: ["1"] });

    expect(fetch.mock.calls.map(([url, init]) => [url.split("/").at(-1), init.headers])).toEqual([["ping", headers], ["post", headers]]);
  });
});
