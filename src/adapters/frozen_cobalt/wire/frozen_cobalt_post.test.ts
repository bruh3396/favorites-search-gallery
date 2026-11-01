import { describe, expect, test } from "vitest";
import { isFrozenCobaltPost } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post";

const frozenCobaltPost = {
  id: "1",
  width: 10,
  height: 10,
  score: 0,
  rating: "explicit",
  changedAt: 0,
  directory: 1_234,
  stem: "a1b2c3",
  extension: "jpg",
  tagCategoryByName: { apple: "general", alice: "character" }
};

describe("isFrozenCobaltPost", () => {
  test("accepts a post with every field it reads", () => {
    expect(isFrozenCobaltPost(frozenCobaltPost)).toBe(true);
  });

  test("ignores fields it doesn't read", () => {
    expect(isFrozenCobaltPost({ ...frozenCobaltPost, source: "" })).toBe(true);
  });

  test("rejects a post missing a field", () => {
    expect(isFrozenCobaltPost({ ...frozenCobaltPost, width: undefined })).toBe(false);
  });

  test("rejects an unknown rating", () => {
    expect(isFrozenCobaltPost({ ...frozenCobaltPost, rating: "e" })).toBe(false);
  });

  test("rejects an unknown tag category", () => {
    expect(isFrozenCobaltPost({ ...frozenCobaltPost, tagCategoryByName: { apple: "unknown" } })).toBe(false);
  });

  test("rejects a non-object", () => {
    expect(isFrozenCobaltPost(null)).toBe(false);
  });
});
