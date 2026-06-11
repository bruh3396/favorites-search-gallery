import { describe, expect, test } from "vitest";
import { Favorite } from "@/types/favorite";
import { Post } from "@/types/api";
import { tagsNeedCorrection } from "@/lib/search/tags/tag_corrector";

function favoriteWithTags(tags: string[]): Favorite {
  return { tags: new Set(tags) } as Favorite;
}

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: "123",
    width: 0,
    height: 0,
    score: 0,
    rating: "",
    change: 0,
    tags: "apple banana cherry",
    fileURL: "https://example.com/file.jpg",
    previewURL: "",
    tagCategories: new Map(),
    ...overrides
  };
}

describe("tagsNeedCorrection", () => {
  test("returns false when tags already match (post.id present on favorite)", () => {
    const favorite = favoriteWithTags(["apple", "banana", "cherry", "123"]);

    expect(tagsNeedCorrection(favorite, post())).toBe(false);
  });

  test("returns false when the only difference is post.id", () => {
    const favorite = favoriteWithTags(["apple", "banana", "cherry"]);

    expect(tagsNeedCorrection(favorite, post())).toBe(false);
  });

  test("returns true when a tag is missing on the favorite", () => {
    const favorite = favoriteWithTags(["apple", "banana", "123"]);

    expect(tagsNeedCorrection(favorite, post())).toBe(true);
  });

  test("returns true when the favorite has an extra tag", () => {
    const favorite = favoriteWithTags(["apple", "banana", "cherry", "date", "123"]);

    expect(tagsNeedCorrection(favorite, post())).toBe(true);
  });

  test("writes corrected sorted tags to post.tags when correction is needed", () => {
    const favorite = favoriteWithTags(["apple"]);
    const p = post({ tags: "cherry apple banana", fileURL: "f.jpg" });

    tagsNeedCorrection(favorite, p);
    expect(p.tags).toBe("123 apple banana cherry");
  });

  test("does not mutate post.tags when no correction is needed", () => {
    const favorite = favoriteWithTags(["apple", "banana", "cherry", "123"]);
    const p = post({ tags: "apple banana cherry" });

    tagsNeedCorrection(favorite, p);
    expect(p.tags).toBe("apple banana cherry");
  });

  describe("media tag correction", () => {
    test("adds 'video' for mp4 files", () => {
      const favorite = favoriteWithTags(["apple", "123"]);
      const p = post({ tags: "apple", fileURL: "https://example.com/file.mp4" });

      expect(tagsNeedCorrection(favorite, p)).toBe(true);
      expect(p.tags).toBe("123 apple video");
    });

    test("favorite already carrying 'video' for an mp4 needs no correction", () => {
      const favorite = favoriteWithTags(["apple", "video", "123"]);
      const p = post({ tags: "apple video", fileURL: "https://example.com/file.mp4" });

      expect(tagsNeedCorrection(favorite, p)).toBe(false);
    });

    test("adds 'gif' for gif files", () => {
      const favorite = favoriteWithTags(["apple", "123"]);
      const p = post({ tags: "apple", fileURL: "https://example.com/file.gif" });

      expect(tagsNeedCorrection(favorite, p)).toBe(true);
      expect(p.tags).toBe("123 apple gif");
    });

    test("strips stale 'video' and 'animated' on a static image", () => {
      const favorite = favoriteWithTags(["apple", "video", "animated", "123"]);
      const p = post({ tags: "apple video animated", fileURL: "https://example.com/file.jpg" });

      expect(tagsNeedCorrection(favorite, p)).toBe(true);
      expect(p.tags).toBe("123 apple");
    });

    test("keeps 'video' and 'animated' on a static image tagged animated_png", () => {
      const favorite = favoriteWithTags(["animated_png", "video", "animated", "123"]);
      const p = post({ tags: "animated_png video animated", fileURL: "https://example.com/file.png" });

      expect(tagsNeedCorrection(favorite, p)).toBe(false);
    });
  });
});
