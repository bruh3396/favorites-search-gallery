import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { postHasDimensions, postIsStale } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";

const DAY = 24 * 60 * 60 * 1_000;
const NOW = 100 * DAY;

describe("postHasDimensions", () => {
  test("a post with dimensions is complete", () => {
    expect(postHasDimensions(createPost({ width: 800, height: 600 }))).toBe(true);
  });

  test("a post without dimensions is incomplete", () => {
    expect(postHasDimensions(createPost({ width: 0, height: 600 }))).toBe(false);
    expect(postHasDimensions(createPost({ width: 800, height: 0 }))).toBe(false);
  });
});

describe("postIsStale", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("a post never fetched is stale", () => {
    expect(postIsStale(createPost())).toBe(true);
  });

  test("a post fetched within 28 days is fresh", () => {
    expect(postIsStale(createPost({ fetchedAt: NOW - (28 * DAY) }))).toBe(false);
  });

  test("a post fetched over 28 days ago is stale", () => {
    expect(postIsStale(createPost({ fetchedAt: NOW - (28 * DAY) - 1 }))).toBe(true);
  });
});
