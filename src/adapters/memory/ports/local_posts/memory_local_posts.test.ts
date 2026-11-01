import { describe, expect, test } from "vitest";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/memory_local_posts";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";

function mutateTags(post: Readonly<Post>, tags: string): void {
  Object.assign(post, { tags });
}

describe("MemoryLocalPosts", () => {
  test("reads back what it wrote, in the order asked, skipping missing ids", async() => {
    const localPosts = new MemoryLocalPosts();

    await localPosts.setMany([createPost({ id: "1", tags: "apple" }), createPost({ id: "2", tags: "banana" })]);

    expect((await localPosts.getMany(["2", "missing", "1"])).map(post => post.tags)).toEqual(["banana", "apple"]);
  });

  test("overwrites a post with the same id", async() => {
    const localPosts = new MemoryLocalPosts();

    await localPosts.setMany([createPost({ id: "1", tags: "old" })]);
    await localPosts.setMany([createPost({ id: "1", tags: "new" })]);

    expect((await localPosts.getMany(["1"])).map(post => post.tags)).toEqual(["new"]);
  });

  test("writes only posts it does not hold yet through setManyIfAbsent", async() => {
    const localPosts = new MemoryLocalPosts();

    await localPosts.setMany([createPost({ id: "1", tags: "complete" })]);
    await localPosts.setManyIfAbsent([createPost({ id: "1", tags: "scraped" }), createPost({ id: "2", tags: "scraped" })]);

    expect((await localPosts.getMany(["1", "2"])).map(post => post.tags)).toEqual(["complete", "scraped"]);
  });

  test("is unaffected by mutating a post after writing or reading it", async() => {
    const localPosts = new MemoryLocalPosts();
    const writtenPost = createPost({ id: "1", tags: "apple" });

    await localPosts.setMany([writtenPost]);
    mutateTags(writtenPost, "changed");
    mutateTags((await localPosts.getMany(["1"]))[0], "changed");

    expect((await localPosts.getMany(["1"]))[0].tags).toBe("apple");
  });
});
