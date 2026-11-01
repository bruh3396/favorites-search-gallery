import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { Post } from "@/core/domain/post/post";
import { PostStatus } from "@/core/domain/post/post_status";
import { FrozenCobaltPost } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post";
import { FrozenCobaltPostResult } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post_result";
import { Mock, describe, expect, test, vi } from "vitest";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/frozen_cobalt_error";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/frozen_cobalt_remote_posts";
import { Media } from "@/core/domain/media/media";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { PostUnavailableError } from "@/core/boundary/ports/remote_posts/post_unavailable_error";
import { advanceAndSettle } from "@/testing/async";

interface Setup {
  remotePosts: FrozenCobaltRemotePosts;
  frozenCobaltClient: { fetchPost: Mock<(postId: string) => Promise<FrozenCobaltPostResult>> };
  scheduler: MemoryScheduler;
}

function createFrozenCobaltPost(postId: string): FrozenCobaltPost {
  return {
    id: postId,
    width: 10,
    height: 10,
    score: 0,
    rating: "explicit",
    changedAt: 0,
    directory: 1234,
    stem: postId,
    extension: "png",
    tagCategoryByName: { apple: "general" }
  };
}

function mintMedia({ directory, stem, extension }: { directory: number; stem: string; extension: string; tags: string }): Media {
  return { kind: "image", locator: `${directory}/${stem}.${extension}` };
}

function setup(...frozenCobaltPostResults: FrozenCobaltPostResult[]): Setup {
  const scheduler = new MemoryScheduler();
  const randomSource = new MemoryRandomSource([0.5]);
  const nextResult = (): FrozenCobaltPostResult => frozenCobaltPostResults.shift() ?? { status: "retry" };
  const frozenCobaltClient = { fetchPost: vi.fn(() => Promise.resolve(nextResult())) };
  const remotePosts = new FrozenCobaltRemotePosts({ frozenCobaltClient, mintMedia, scheduler, randomSource });
  return { remotePosts, frozenCobaltClient, scheduler };
}

async function fetchRemotePost(
  { remotePosts, scheduler }: Pick<Setup, "remotePosts" | "scheduler">,
  post: Pick<Post, "id" | "status">
): Promise<CategorizedPost> {
  const fetched = remotePosts.fetch(post);

  fetched.catch(() => { });
  await advanceAndSettle(scheduler, 60_000);
  return fetched;
}

describe("FrozenCobaltRemotePosts", () => {
  test("delivers a served post with the media minted from its file", async() => {
    const { remotePosts, scheduler } = setup({ status: "ok", post: createFrozenCobaltPost("1") });
    const media = { kind: "image", locator: "1234/1.png" };

    expect((await fetchRemotePost({ remotePosts, scheduler }, { id: "1", status: "active" })).post).toMatchObject({ id: "1", width: 10, media });
  });

  test("rejects at once as unavailable a post Frozen Cobalt reports deleted", async() => {
    const { remotePosts, frozenCobaltClient, scheduler } = setup({ status: "deleted" });

    await expect(fetchRemotePost({ remotePosts, scheduler }, { id: "1", status: "active" })).rejects.toEqual(new PostUnavailableError("1"));
    expect(frozenCobaltClient.fetchPost).toHaveBeenCalledOnce();
  });

  test.each<PostStatus>(["deleted", "purged"])("rejects as unavailable without asking a post already marked %s", async status => {
    const { remotePosts, frozenCobaltClient, scheduler } = setup({ status: "ok", post: createFrozenCobaltPost("1") });

    await expect(fetchRemotePost({ remotePosts, scheduler }, { id: "1", status })).rejects.toEqual(new PostUnavailableError("1"));
    expect(frozenCobaltClient.fetchPost).not.toHaveBeenCalled();
  });

  test("rejects at once a malformed result", async() => {
    const { remotePosts, frozenCobaltClient, scheduler } = setup();

    frozenCobaltClient.fetchPost.mockRejectedValueOnce(new FrozenCobaltError("malformed", { subject: "1" }));

    await expect(fetchRemotePost({ remotePosts, scheduler }, { id: "1", status: "active" })).rejects.toMatchObject({ reason: "malformed" });
    expect(frozenCobaltClient.fetchPost).toHaveBeenCalledOnce();
  });

  test("asks again after a retry result", async() => {
    const { remotePosts, frozenCobaltClient, scheduler } = setup({ status: "retry" }, { status: "ok", post: createFrozenCobaltPost("1") });

    expect((await fetchRemotePost({ remotePosts, scheduler }, { id: "1", status: "active" })).post.id).toBe("1");
    expect(frozenCobaltClient.fetchPost).toHaveBeenCalledTimes(2);
  });

  test("rejects a result of an unknown status", async() => {
    const { remotePosts, scheduler } = setup({ status: "bogus" } as unknown as FrozenCobaltPostResult);

    await expect(fetchRemotePost({ remotePosts, scheduler }, { id: "1", status: "active" })).rejects.toThrow("Unexpected value");
  });

  test("rejects when Frozen Cobalt keeps asking for a retry", async() => {
    const { remotePosts, frozenCobaltClient, scheduler } = setup();

    await expect(fetchRemotePost({ remotePosts, scheduler }, { id: "1", status: "active" })).rejects.toMatchObject({ reason: "retry", subject: "1" });
    expect(frozenCobaltClient.fetchPost.mock.calls.length).toBeGreaterThan(1);
  });
});
