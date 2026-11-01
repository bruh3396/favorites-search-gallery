import "fake-indexeddb/auto";
import { DEFAULT_INDEXED_DB_CONFIGURATION, IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { beforeEach, describe, expect, test } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/indexed_db_local_posts";
import { createPost } from "@/testing/post";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

function createLocalPosts(): IndexedDbLocalPosts {
  return new IndexedDbLocalPosts(new IndexedDbClient(DEFAULT_INDEXED_DB_CONFIGURATION, () => null));
}

describe("IndexedDbLocalPosts", () => {
  test("reads back what it wrote, skipping missing ids", async() => {
    const localPosts = createLocalPosts();

    await localPosts.setMany([createPost({ id: "1", tags: "apple" }), createPost({ id: "2", tags: "banana" })]);

    expect((await localPosts.getMany(["2", "missing", "1"])).map(post => post.tags)).toEqual(["banana", "apple"]);
  });

  test("overwrites a post with the same id", async() => {
    const localPosts = createLocalPosts();

    await localPosts.setMany([createPost({ id: "1", tags: "old" })]);
    await localPosts.setMany([createPost({ id: "1", tags: "new" })]);

    expect((await localPosts.getMany(["1"])).map(post => post.tags)).toEqual(["new"]);
  });

  test("writes only posts it does not hold yet through setManyIfAbsent", async() => {
    const localPosts = createLocalPosts();

    await localPosts.setMany([createPost({ id: "1", tags: "complete" })]);
    await localPosts.setManyIfAbsent([createPost({ id: "1", tags: "scraped" }), createPost({ id: "2", tags: "scraped" })]);

    expect((await localPosts.getMany(["1", "2"])).map(post => post.tags)).toEqual(["complete", "scraped"]);
  });
});
