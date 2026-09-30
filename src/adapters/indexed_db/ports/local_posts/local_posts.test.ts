import "fake-indexeddb/auto";
import { describe, expect, test } from "vitest";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalPosts } from "@/adapters/indexed_db/ports/local_posts/local_posts";
import { createPost } from "@/testing/post";

let counter = 0;

function createLocalPosts(): IndexedDbLocalPosts {
  counter += 1;
  return new IndexedDbLocalPosts(new IndexedDbClient(`local_posts_test_${counter}`));
}

describe("IndexedDbLocalPosts", () => {
  test("reads back what it wrote, skipping missing ids", async() => {
    const posts = createLocalPosts();

    await posts.setMany([createPost({ id: "1", tags: "apple" }), createPost({ id: "2", tags: "banana" })]);

    expect((await posts.getMany(["2", "missing", "1"])).map(post => post.tags)).toEqual(["banana", "apple"]);
  });

  test("overwrites a post with the same id", async() => {
    const posts = createLocalPosts();

    await posts.setMany([createPost({ id: "1", tags: "old" })]);
    await posts.setMany([createPost({ id: "1", tags: "new" })]);

    expect((await posts.getMany(["1"])).map(post => post.tags)).toEqual(["new"]);
  });

  test("setManyIfAbsent writes only posts it does not hold yet", async() => {
    const posts = createLocalPosts();

    await posts.setMany([createPost({ id: "1", tags: "complete" })]);
    await posts.setManyIfAbsent([createPost({ id: "1", tags: "scraped" }), createPost({ id: "2", tags: "scraped" })]);

    expect((await posts.getMany(["1", "2"])).map(post => post.tags)).toEqual(["complete", "scraped"]);
  });

  test("keeps namespaces apart", async() => {
    const first = createLocalPosts();
    const second = createLocalPosts();

    await first.setMany([createPost({ id: "1" })]);

    expect(await second.getMany(["1"])).toEqual([]);
  });
});
