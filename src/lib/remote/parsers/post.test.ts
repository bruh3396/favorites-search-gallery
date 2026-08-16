import { describe, expect, test } from "vitest";
import { ServerPost } from "@/types/api";
import { parsePost } from "@/lib/remote/parsers/post";

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

describe("parsePost", () => {
  test("maps fields correctly", () => {
    const post = parsePost(serverPost);

    expect(post.id).toBe("123");
    expect(post.width).toBe(1920);
    expect(post.height).toBe(1080);
    expect(post.score).toBe(100);
    expect(post.rating).toBe("e");
    expect(post.change).toBe(1234567890);
    expect(post.tags).toBe("tag1 tag2");
    expect(post.fileURL).toBe("https://example.com/image.jpg");
    expect(post.previewURL).toBe("https://example.com/preview.jpg");
  });

  test("decodes tag categories", () => {
    const post = parsePost(serverPost);

    expect(post.tagCategories.get("tag1")).toBe("general");
    expect(post.tagCategories.get("tag2")).toBe("character");
  });

  test("decodes null tag category to general", () => {
    const post = parsePost({ ...serverPost, tagCategories: { alpha: null } });

    expect(post.tagCategories.get("alpha")).toBe("general");
  });
});
