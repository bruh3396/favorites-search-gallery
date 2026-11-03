import { describe, expect, test } from "vitest";
import { ServerPost } from "@/types/api";
import { parsePost } from "@/lib/remote/parsers/post_parser";

const serverPost: ServerPost = {
  id: "123",
  width: 1920,
  height: 1080,
  score: 100,
  rating: "explicit",
  changedAt: 1234567890,
  directory: 1234,
  stem: "a1b2c3",
  extension: "png",
  tagCategoryByName: { tag1: "general", tag2: "character" }
};

describe("parsePost", () => {
  test("maps fields correctly", () => {
    const { post } = parsePost(serverPost);

    expect(post.id).toBe("123");
    expect(post.width).toBe(1920);
    expect(post.height).toBe(1080);
    expect(post.score).toBe(100);
    expect(post.rating).toBe("explicit");
    expect(post.change).toBe(1234567890);
    expect(post.tags).toBe("tag1 tag2");
  });

  test("builds file and preview urls from the media parts", () => {
    const { post } = parsePost(serverPost);

    expect(post.fileURL).toBe("https://api-cdn.rule34.xxx/images/1234/a1b2c3.png");
    expect(post.previewURL).toBe("https://api-cdn.rule34.xxx/thumbnails/1234/thumbnail_a1b2c3.jpg");
  });

  test("serves videos from the mp4 host", () => {
    const { post } = parsePost({ ...serverPost, extension: "mp4" });

    expect(post.fileURL).toBe("https://api-cdn-mp4.rule34.xxx/images/1234/a1b2c3.mp4");
  });

  test("keeps tag categories", () => {
    const { tagCategories } = parsePost(serverPost);

    expect(tagCategories.get("tag1")).toBe("general");
    expect(tagCategories.get("tag2")).toBe("character");
  });
});
