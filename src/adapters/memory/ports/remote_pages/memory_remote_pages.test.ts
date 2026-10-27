import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/memory_remote_pages";
import { createPost } from "@/testing/post";

function createRemotePages(): MemoryRemotePages {
  return new MemoryRemotePages(new MemoryClient([createPost({ id: "1" })]));
}

describe("MemoryRemotePages", () => {
  test("gives a post's URL as an in-page anchor", () => {
    expect(createRemotePages().postUrl("7")).toBe("#post-7");
  });

  test("gives a search's URL as an in-page anchor", () => {
    expect(createRemotePages().searchUrl("apple banana")).toBe("#search-apple%20banana");
  });

  test("says a post exists only when memory holds it", async() => {
    expect([await createRemotePages().postExists("1"), await createRemotePages().postExists("2")]).toEqual([true, false]);
  });
});
