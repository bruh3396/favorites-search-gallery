import { Mock, describe, expect, test, vi } from "vitest";
import { CategorizedPost } from "@/core/domain/post/post";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Rule34Error } from "@/adapters/rule34/client/error";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/remote_posts";
import { advanceAndSettle } from "@/testing/async";
import { createPost } from "@/testing/post";

type FetchPostPage = Mock<(id: string) => Promise<CategorizedPost>>;

const PAGE = {
  post: createPost({ id: "42", deleted: true }),
  tagCategories: new Map([["alice", "character" as const]])
};

function setup(fetchPostPage: FetchPostPage): { remotePosts: Rule34RemotePosts; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  const rule34 = { fetchPostPage };
  return { remotePosts: new Rule34RemotePosts({ rule34, scheduler, randomSource: new MemoryRandomSource([1]) }), scheduler };
}

async function fetchRemotePost(fetchPostPage: FetchPostPage): Promise<CategorizedPost> {
  const { remotePosts, scheduler } = setup(fetchPostPage);
  const fetched = remotePosts.fetch({ id: "42" });

  fetched.catch(() => { });
  await advanceAndSettle(scheduler, 10_000);
  return fetched;
}

describe("Rule34RemotePosts", () => {
  test("reads a post and its tag categories from the post's page", async() => {
    const fetchPostPage: FetchPostPage = vi.fn(() => Promise.resolve(PAGE));

    expect(await fetchRemotePost(fetchPostPage)).toBe(PAGE);
    expect(fetchPostPage).toHaveBeenCalledWith("42");
  });

  test("retries a transient failure", async() => {
    const fetchPostPage: FetchPostPage = vi.fn<(id: string) => Promise<CategorizedPost>>()
      .mockRejectedValueOnce(new Rule34Error("http", { status: 503 }))
      .mockResolvedValue(PAGE);

    expect(await fetchRemotePost(fetchPostPage)).toBe(PAGE);
    expect(fetchPostPage).toHaveBeenCalledTimes(2);
  });

  test("gives up after three transient failures", async() => {
    const fetchPostPage: FetchPostPage = vi.fn(() => Promise.reject(new Rule34Error("network")));

    await expect(fetchRemotePost(fetchPostPage)).rejects.toThrow(Rule34Error);
    expect(fetchPostPage).toHaveBeenCalledTimes(3);
  });

  test("never retries a page it can't read", async() => {
    const fetchPostPage: FetchPostPage = vi.fn(() => Promise.reject(new Rule34Error("malformed")));

    await expect(fetchRemotePost(fetchPostPage)).rejects.toThrow(Rule34Error);
    expect(fetchPostPage).toHaveBeenCalledOnce();
  });
});
