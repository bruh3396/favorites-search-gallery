import "fake-indexeddb/auto";
import { beforeEach, describe, expect, test } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalPosts } from "@/adapters/indexed_db/ports/local_posts/local_posts";
import { createPost } from "@/testing/post";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

function createLocalPosts(): IndexedDbLocalPosts {
  return new IndexedDbLocalPosts(new IndexedDbClient());
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

  test("writes only posts it does not hold yet through setManyIfAbsent", async() => {
    const posts = createLocalPosts();

    await posts.setMany([createPost({ id: "1", tags: "complete" })]);
    await posts.setManyIfAbsent([createPost({ id: "1", tags: "scraped" }), createPost({ id: "2", tags: "scraped" })]);

    expect((await posts.getMany(["1", "2"])).map(post => post.tags)).toEqual(["complete", "scraped"]);
  });
});
