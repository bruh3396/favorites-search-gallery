import { PostResponse, ServerPost } from "@/adapters/api/client/post/post";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiPostSource } from "@/adapters/api/ports/post_source/post_source";
import { CategorizedPost } from "@/core/domain/post/post";
import { Media } from "@/core/domain/media/media";
import { PostFetchError } from "@/types/errors";
import { createPost } from "@/testing/post";

const FETCH_ATTEMPTS = 3;

function createServerPost(id: string): ServerPost {
  return { id, width: 10, height: 10, score: 0, rating: "e", change: 0, fileURL: `https://example.com/${id}.png`, previewURL: "", tagCategories: {} };
}

function mintMedia(fileUrl: string): Media | null {
  return fileUrl.endsWith(".png") ? { kind: "image", locator: fileUrl } : null;
}

function setup(...responses: PostResponse[]): { source: ApiPostSource; api: { fetchPost: ReturnType<typeof vi.fn> }; deletedPosts: { fetch: ReturnType<typeof vi.fn> } } {
  const api = { fetchPost: vi.fn((id: string): Promise<PostResponse> => Promise.resolve(responses.shift() ?? { status: "error", id })) };
  const deletedPosts = { fetch: vi.fn((id: string): Promise<CategorizedPost> => Promise.resolve({ post: createPost({ id, width: 10, height: 10, deleted: true }), tagCategories: new Map() })) };
  return { source: new ApiPostSource(api, deletedPosts, mintMedia, FETCH_ATTEMPTS), api, deletedPosts };
}

async function fetchedFor(source: ApiPostSource, id: string): Promise<CategorizedPost> {
  const fetched = source.fetch(id);

  fetched.catch(() => { });
  await vi.runAllTimersAsync();
  return fetched;
}

describe("ApiPostSource", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("delivers a served post with the media minted from its file", async() => {
    const { source } = setup({ status: "ok", post: createServerPost("1") });

    expect((await fetchedFor(source, "1")).post).toMatchObject({ id: "1", width: 10, media: { kind: "image", locator: "https://example.com/1.png" } });
  });

  test("rejects a post whose file can't be minted", async() => {
    const { source } = setup(...Array.from({ length: FETCH_ATTEMPTS }, () => ({ status: "ok" as const, post: { ...createServerPost("1"), fileURL: "https://example.com/1.webm" } })));

    await expect(fetchedFor(source, "1")).rejects.toThrow(PostFetchError);
  });

  test("asks again for a deferred post", async() => {
    const { source, api } = setup({ status: "deferred", id: "1" }, { status: "ok", post: createServerPost("1") });

    expect((await fetchedFor(source, "1")).post.id).toBe("1");
    expect(api.fetchPost).toHaveBeenCalledTimes(2);
  });

  test("asks the site for a post the server reports deleted", async() => {
    const { source, deletedPosts } = setup({ status: "deleted", id: "1" });
    const fetched = await fetchedFor(source, "1");

    expect(deletedPosts.fetch).toHaveBeenCalledWith("1");
    expect(fetched.post.deleted).toBe(true);
  });

  test("retries a failure, then rejects when the server keeps failing", async() => {
    const { source, api } = setup();

    await expect(fetchedFor(source, "1")).rejects.toThrow(PostFetchError);
    expect(api.fetchPost).toHaveBeenCalledTimes(FETCH_ATTEMPTS);
  });
});
