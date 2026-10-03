import { CategorizedPost, Post } from "@/core/domain/post/post";
import { FrozenCobaltPost, FrozenCobaltPostResult } from "@/adapters/frozen_cobalt/client/schema";
import { Mock, describe, expect, test, vi } from "vitest";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/error";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/remote_posts";
import { Media } from "@/core/domain/media/media";
import { MemoryRandom } from "@/adapters/memory/ports/random/random";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { PostUnavailableError } from "@/core/boundary/ports/remote_posts";
import { advanceAndSettle } from "@/testing/async";

interface Setup {
  remotePosts: FrozenCobaltRemotePosts;
  frozenCobalt: { fetchPost: Mock<(id: string) => Promise<FrozenCobaltPostResult>> };
  scheduler: MemoryScheduler;
}

function createFrozenCobaltPost(id: string): FrozenCobaltPost {
  const fileURL = `https://example.com/${id}.png`;
  return { id, width: 10, height: 10, score: 0, rating: "e", change: 0, fileURL, tagCategories: { apple: 0 } };
}

function mintMedia({ url }: { url: string; tags: string }): Media | null {
  return url.endsWith(".png") ? { kind: "image", locator: url } : null;
}

function setup(...results: FrozenCobaltPostResult[]): Setup {
  const scheduler = new MemoryScheduler();
  const random = new MemoryRandom([0.5]);
  const nextResult = (id: string): FrozenCobaltPostResult => results.shift() ?? { status: "error", id };
  const frozenCobalt = { fetchPost: vi.fn((id: string) => Promise.resolve(nextResult(id))) };
  const remotePosts = new FrozenCobaltRemotePosts({ frozenCobalt, mintMedia, scheduler, random });
  return { remotePosts, frozenCobalt, scheduler };
}

async function fetchedFor(
  { remotePosts, scheduler }: Setup,
  post: Pick<Post, "id" | "deleted">
): Promise<CategorizedPost> {
  const fetched = remotePosts.fetch(post);

  fetched.catch(() => { });
  await advanceAndSettle(scheduler, 60_000);
  return fetched;
}

describe("FrozenCobaltRemotePosts", () => {
  test("delivers a served post with the media minted from its file", async() => {
    const bundle = setup({ status: "ok", post: createFrozenCobaltPost("1") });
    const media = { kind: "image", locator: "https://example.com/1.png" };

    expect((await fetchedFor(bundle, { id: "1" })).post).toMatchObject({ id: "1", width: 10, media });
  });

  test("rejects at once a post whose file can't be minted", async() => {
    const post = { ...createFrozenCobaltPost("1"), fileURL: "https://example.com/1.webm" };
    const bundle = setup({ status: "ok", post });

    await expect(fetchedFor(bundle, { id: "1" })).rejects.toMatchObject({ reason: "unknown_file" });
    expect(bundle.frozenCobalt.fetchPost).toHaveBeenCalledOnce();
  });

  test("rejects at once as unavailable a post Frozen Cobalt reports deleted", async() => {
    const bundle = setup({ status: "deleted", id: "1" });

    await expect(fetchedFor(bundle, { id: "1" })).rejects.toEqual(new PostUnavailableError("1"));
    expect(bundle.frozenCobalt.fetchPost).toHaveBeenCalledOnce();
  });

  test("rejects as unavailable without asking a post already marked deleted", async() => {
    const bundle = setup({ status: "ok", post: createFrozenCobaltPost("1") });

    await expect(fetchedFor(bundle, { id: "1", deleted: true })).rejects.toEqual(new PostUnavailableError("1"));
    expect(bundle.frozenCobalt.fetchPost).not.toHaveBeenCalled();
  });

  test("rejects at once a malformed result", async() => {
    const bundle = setup();

    bundle.frozenCobalt.fetchPost.mockRejectedValueOnce(new FrozenCobaltError("malformed", { subject: "1" }));

    await expect(fetchedFor(bundle, { id: "1" })).rejects.toMatchObject({ reason: "malformed" });
    expect(bundle.frozenCobalt.fetchPost).toHaveBeenCalledOnce();
  });

  test.each<FrozenCobaltPostResult>([
    { status: "deferred", id: "1" },
    { status: "rate_limited", id: "1" },
    { status: "error", id: "1" }
  ])("asks again after a $status result", async result => {
    const bundle = setup(result, { status: "ok", post: createFrozenCobaltPost("1") });

    expect((await fetchedFor(bundle, { id: "1" })).post.id).toBe("1");
    expect(bundle.frozenCobalt.fetchPost).toHaveBeenCalledTimes(2);
  });

  test("retries a server error, then rejects when Frozen Cobalt keeps failing", async() => {
    const bundle = setup();

    await expect(fetchedFor(bundle, { id: "1" })).rejects.toMatchObject({ reason: "server_error" });
    expect(bundle.frozenCobalt.fetchPost.mock.calls.length).toBeGreaterThan(1);
  });
});
