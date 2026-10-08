import { describe, expect, test } from "vitest";
import { Post } from "@/types/api";
import { daysToMilliseconds } from "@/utils/pure/number";
import { postIsStale } from "@/lib/domain/post/status";

function createPost(overrides: Partial<Post>): Post {
  return { id: "1", tags: "", width: 100, height: 100, score: 0, rating: "e", change: 0, fileURL: "", previewURL: "0123_abc", fetchedAt: Date.now(), ...overrides };
}

describe("postIsStale", () => {
  test("returns false for a recently fetched post", () => {
    expect(postIsStale(createPost({}))).toBe(false);
  });

  test("returns true for a post never fetched", () => {
    expect(postIsStale(createPost({ fetchedAt: undefined }))).toBe(true);
  });

  test("returns true for a post fetched over 28 days ago", () => {
    expect(postIsStale(createPost({ fetchedAt: Date.now() - daysToMilliseconds(29) }))).toBe(true);
  });

  test("returns true for a recently fetched post without a preview", () => {
    expect(postIsStale(createPost({ previewURL: "" }))).toBe(true);
  });
});
