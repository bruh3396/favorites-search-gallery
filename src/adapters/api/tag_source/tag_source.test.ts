import { TagResponse } from "@/adapters/api/client/responses";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiTagSource } from "@/adapters/api/tag_source/tag_source";
import { PostFetchError } from "@/types/errors";
import { TagCategory } from "@/types/search";

type FetchStub = ReturnType<typeof vi.fn<(url: string, init: RequestInit) => Promise<Response>>>;

function setup(responses: Record<string, TagResponse>): { source: ApiTagSource; fetch: FetchStub } {
  const fetch: FetchStub = vi.fn((_url: string, init: RequestInit) => {
    const { tagNames } = JSON.parse(String(init.body)) as { tagNames: string[] };
    return Promise.resolve(new Response(JSON.stringify(Object.fromEntries(tagNames.map(tagName => [tagName, responses[tagName]])))));
  });

  vi.stubGlobal("fetch", fetch);
  return { source: new ApiTagSource(), fetch };
}

function requestsOf(fetch: FetchStub): { route: string; body: unknown }[] {
  return fetch.mock.calls.map(([url, init]) => ({ route: url.split("/").at(-1) ?? "", body: JSON.parse(String(init.body)) as unknown }));
}

async function fetchFlushed(fetched: Promise<TagCategory[]>): Promise<TagCategory[]> {
  fetched.catch(() => { });
  await vi.advanceTimersByTimeAsync(10_000);
  return fetched;
}

describe("ApiTagSource", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("batches tags requested together and decodes their categories", async() => {
    const { source, fetch } = setup({ apple: { status: "ok", category: 0 }, alice: { status: "ok", category: 4 } });

    expect(await fetchFlushed(Promise.all([source.fetch("apple"), source.fetch("alice")]))).toEqual(["general", "character"]);
    expect(requestsOf(fetch)).toEqual([{ route: "tag", body: { tagNames: ["apple", "alice"] } }]);
  });

  test("rejects when rate limited", async() => {
    const { source } = setup({ apple: { status: "rate_limited" } });

    await expect(fetchFlushed(Promise.all([source.fetch("apple")]))).rejects.toThrow(PostFetchError);
  });
});
