import { PostResponse, ServerPost } from "@/adapters/api/client/responses";
import { ParsedPost } from "@/core/boundary/ports";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiPostSource } from "@/adapters/api/post_source/post_source";
import { PostFetchError } from "@/types/errors";
import { createPost } from "@/testing/post";

type FetchStub = ReturnType<typeof vi.fn<(url: string, init: RequestInit) => Promise<Response>>>;

function createServerPost(id: string): ServerPost {
  return { id, width: 10, height: 10, score: 0, rating: "e", change: 0, fileURL: `https://example.com/${id}.png`, previewURL: "", tagCategories: {} };
}

function setup(...responses: PostResponse[]): { source: ApiPostSource; fetch: FetchStub; deletedPosts: { fetch: ReturnType<typeof vi.fn> } } {
  const fetch: FetchStub = vi.fn((_url: string, init: RequestInit) => {
    const { ids } = JSON.parse(String(init.body)) as { ids: string[] };
    return Promise.resolve(new Response(JSON.stringify(Object.fromEntries(ids.map(id => [id, responses.shift() ?? { status: "error", id }])))));
  });
  const deletedPosts = { fetch: vi.fn((id: string): Promise<ParsedPost> => Promise.resolve({ post: createPost({ id, width: 10, height: 10, deleted: true }), tagCategories: new Map() })) };

  vi.stubGlobal("fetch", fetch);
  return { source: new ApiPostSource(deletedPosts), fetch, deletedPosts };
}

function requestsOf(fetch: FetchStub): { route: string; body: unknown }[] {
  return fetch.mock.calls.map(([url, init]) => ({ route: url.split("/").at(-1) ?? "", body: JSON.parse(String(init.body)) as unknown }));
}

async function fetchedFor(source: ApiPostSource, ...ids: string[]): Promise<ParsedPost[]> {
  const fetched = Promise.all(ids.map(id => source.fetch(id)));

  fetched.catch(() => { });
  await vi.advanceTimersByTimeAsync(60_000);
  return fetched;
}

describe("ApiPostSource", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("delivers a served post with its extension", async() => {
    const { source } = setup({ status: "ok", post: createServerPost("1") });
    const [fetched] = await fetchedFor(source, "1");

    expect(fetched?.post).toMatchObject({ id: "1", width: 10, extension: "png" });
  });

  test("batches posts requested together into one request", async() => {
    const { source, fetch } = setup({ status: "ok", post: createServerPost("1") }, { status: "ok", post: createServerPost("2") });

    expect(await fetchedFor(source, "1", "2")).toHaveLength(2);
    expect(requestsOf(fetch)).toEqual([{ route: "post", body: { ids: ["1", "2"] } }]);
  });

  test("asks again for a deferred post", async() => {
    const { source, fetch } = setup({ status: "deferred", id: "1" }, { status: "ok", post: createServerPost("1") });

    expect(await fetchedFor(source, "1")).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("asks the site for a post the server reports deleted", async() => {
    const { source, deletedPosts } = setup({ status: "deleted", id: "1" });
    const [fetched] = await fetchedFor(source, "1");

    expect(deletedPosts.fetch).toHaveBeenCalledWith("1");
    expect(fetched?.post.deleted).toBe(true);
  });

  test("rejects when the server keeps failing", async() => {
    const { source } = setup();

    await expect(fetchedFor(source, "1")).rejects.toThrow(PostFetchError);
  });
});
