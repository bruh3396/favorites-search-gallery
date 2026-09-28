import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiClient } from "@/adapters/api/client/client";

type FetchStub = ReturnType<typeof vi.fn<(url: string, init: RequestInit) => Promise<Response>>>;

function stubFetch(answer: (body: Record<string, string[]>) => unknown = () => ({})): FetchStub {
  const fetch: FetchStub = vi.fn((_url: string, init: RequestInit) => Promise.resolve(new Response(JSON.stringify(answer(JSON.parse(String(init.body)) as Record<string, string[]>)))));

  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function requestsOf(fetch: FetchStub): { url: string; body: unknown }[] {
  return fetch.mock.calls.map(([url, init]) => ({ url, body: JSON.parse(String(init.body)) as unknown }));
}

describe("ApiClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("batches posts asked for together into one request to its origin", async() => {
    const fetch = stubFetch(({ ids }) => Object.fromEntries(ids.map(id => [id, { status: "deleted", id }])));
    const client = new ApiClient("https://api.test");
    const fetched = Promise.all([client.fetchPost("1"), client.fetchPost("2")]);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(await fetched).toEqual([{ status: "deleted", id: "1" }, { status: "deleted", id: "2" }]);
    expect(requestsOf(fetch)).toEqual([{ url: "https://api.test/post", body: { ids: ["1", "2"] } }]);
  });

  test("batches tags asked for together into one request", async() => {
    const fetch = stubFetch(({ tagNames }) => Object.fromEntries(tagNames.map(tagName => [tagName, { status: "ok", category: 0 }])));
    const client = new ApiClient("https://api.test");
    const fetched = Promise.all([client.fetchTag("apple"), client.fetchTag("alice")]);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(await fetched).toHaveLength(2);
    expect(requestsOf(fetch)).toEqual([{ url: "https://api.test/tag", body: { tagNames: ["apple", "alice"] } }]);
  });

  test("identifies every request made after identifying", async() => {
    const fetch = stubFetch();
    const client = new ApiClient("https://api.test");

    client.ping();
    client.identifyAs({ userId: "9", version: "1.0", platform: "mobile" });
    client.ping();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch.mock.calls.map(([url, init]) => [url, init.headers])).toEqual([
      ["https://api.test/ping", { "X-User-Id": "", "X-Version": "", "X-Platform": "" }],
      ["https://api.test/ping", { "X-User-Id": "9", "X-Version": "1.0", "X-Platform": "mobile" }]
    ]);
  });
});
