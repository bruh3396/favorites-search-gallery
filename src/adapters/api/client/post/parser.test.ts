import { describe, expect, test } from "vitest";
import { Media } from "@/core/domain/media/media";
import { ServerPost } from "@/adapters/api/client/post/post";
import { parsePost } from "@/adapters/api/client/post/parser";

const serverPost: ServerPost = {
  id: "123",
  width: 1920,
  height: 1080,
  score: 100,
  rating: "e",
  change: 1234567890,
  fileURL: "https://example.com/image.jpg",
  previewURL: "https://example.com/preview.jpg",
  tagCategories: { tag1: 0, tag2: 4 }
};

const MEDIA: Media = { kind: "image", locator: "image.jpg" };

describe("parsePost", () => {
  test("maps fields correctly", () => {
    const { post } = parsePost(serverPost, MEDIA);

    expect(post.id).toBe("123");
    expect(post.width).toBe(1920);
    expect(post.height).toBe(1080);
    expect(post.score).toBe(100);
    expect(post.rating).toBe("e");
    expect(post.change).toBe(1234567890);
    expect(post.tags).toBe("tag1 tag2");
    expect(post.media).toBe(MEDIA);
  });

  test("decodes tag categories", () => {
    const { tagCategories } = parsePost(serverPost, MEDIA);

    expect(tagCategories.get("tag1")).toBe("general");
    expect(tagCategories.get("tag2")).toBe("character");
  });

  test("decodes null tag category to general", () => {
    const { tagCategories } = parsePost({ ...serverPost, tagCategories: { alpha: null } }, MEDIA);

    expect(tagCategories.get("alpha")).toBe("general");
  });
});
