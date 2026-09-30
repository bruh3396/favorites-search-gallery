import { describe, expect, test } from "vitest";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { createPost } from "@/testing/post";

describe("MemoryLocalPosts", () => {
  test("reads back what it wrote, in the order asked, skipping missing ids", async() => {
    const posts = new MemoryLocalPosts();

    await posts.setMany([createPost({ id: "1", tags: "apple" }), createPost({ id: "2", tags: "banana" })]);

    expect((await posts.getMany(["2", "missing", "1"])).map(post => post.tags)).toEqual(["banana", "apple"]);
  });

  test("overwrites a post with the same id", async() => {
    const posts = new MemoryLocalPosts();

    await posts.setMany([createPost({ id: "1", tags: "old" })]);
    await posts.setMany([createPost({ id: "1", tags: "new" })]);

    expect((await posts.getMany(["1"])).map(post => post.tags)).toEqual(["new"]);
  });

  test("setManyIfAbsent writes only posts it does not hold yet", async() => {
    const posts = new MemoryLocalPosts();

    await posts.setMany([createPost({ id: "1", tags: "complete" })]);
    await posts.setManyIfAbsent([createPost({ id: "1", tags: "scraped" }), createPost({ id: "2", tags: "scraped" })]);

    expect((await posts.getMany(["1", "2"])).map(post => post.tags)).toEqual(["complete", "scraped"]);
  });

  test("is unaffected by mutating a post after writing or reading it", async() => {
    const posts = new MemoryLocalPosts();
    const written = createPost({ id: "1", tags: "apple" });

    await posts.setMany([written]);
    written.tags = "changed";
    (await posts.getMany(["1"]))[0].tags = "changed";

    expect((await posts.getMany(["1"]))[0].tags).toBe("apple");
  });
});
