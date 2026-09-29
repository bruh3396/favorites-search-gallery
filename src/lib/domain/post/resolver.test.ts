import { CategorizedPost, Post } from "@/core/domain/post/post";
import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { PostResolver } from "@/lib/domain/post/resolver";
import { createPost } from "@/testing/post";

function setup(sourcePosts: Post[], storedPosts: Post[] = []): { resolver: PostResolver; stored: Post[] } {
  const stored: Post[] = [];
  const resolver = new PostResolver(new MemoryRemotePosts(new MemoryClient(sourcePosts)), {
    readStored: (ids): Promise<Post[]> => Promise.resolve(storedPosts.filter(post => ids.includes(post.id))),
    store: (post): void => {
      stored.push(post);
    }
  });
  return { resolver, stored };
}

async function resolvedFor(resolver: PostResolver, ...stalePosts: Post[]): Promise<CategorizedPost[]> {
  const resolved: CategorizedPost[] = [];

  await resolver.resolveAll(stalePosts, result => resolved.push(result));
  return resolved;
}

describe("PostResolver", () => {
  test("resolves a stored post without asking the source", async() => {
    const { resolver, stored } = setup([createPost({ id: "1", tags: "source" })], [createPost({ id: "1", tags: "stored" })]);
    const resolved = await resolvedFor(resolver, createPost({ id: "1", tags: "stale" }));

    expect(resolved.map(({ post }) => post.tags)).toEqual(["stored"]);
    expect(stored).toEqual([]);
  });

  test("fetches a post it hasn't stored, merged over the stale one, and stores it", async() => {
    const { resolver, stored } = setup([createPost({ id: "1", tags: "source" })]);
    const [resolved] = await resolvedFor(resolver, createPost({ id: "1", tags: "stale", durationSeconds: 5 }));

    expect(resolved.post).toMatchObject({ id: "1", tags: "source" });
    expect(resolved.post.fetchedAt).toBeTypeOf("number");
    expect(stored).toEqual([resolved.post]);
  });

  test("leaves a post unresolved when the source fails", async() => {
    const { resolver, stored } = setup([]);

    expect(await resolvedFor(resolver, createPost({ id: "1" }))).toEqual([]);
    expect(stored).toEqual([]);
  });
});
