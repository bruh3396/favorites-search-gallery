import { CompactPost, PostResponse } from "@/types/api";
import { DeletedPostError, RateLimitedError } from "@/types/errors";
import { describe, expect, test } from "vitest";
import { parsePostResponse } from "@/lib/remote/parsers/api_post_parser";

const compactPost: CompactPost = {
  id: 123,
  width: 1920,
  height: 1080,
  score: 100,
  rating: "e",
  change: 1234567890,
  createdAt: "",
  tags: { tag2: 4, tag1: 0 },
  fileURL: "https://example.com/image.jpg",
  previewURL: "https://example.com/preview.jpg"
};

describe("parsePostResponse", () => {
  test("ok maps fields correctly", () => {
    const response: PostResponse = { status: "ok", post: compactPost };
    const post = parsePostResponse(response);

    expect(post.id).toBe("123");
    expect(post.width).toBe(1920);
    expect(post.height).toBe(1080);
    expect(post.score).toBe(100);
    expect(post.rating).toBe("e");
    expect(post.tags).toBe("tag1 tag2");
    expect(post.fileURL).toBe("https://example.com/image.jpg");
    expect(post.previewURL).toBe("https://example.com/preview.jpg");
  });

  test("ok decodes tag categories", () => {
    const response: PostResponse = { status: "ok", post: compactPost };
    const post = parsePostResponse(response);

    expect(post.tagCategories.get("tag1")).toBe("general");
    expect(post.tagCategories.get("tag2")).toBe("character");
  });

  test("deleted throws DeletedPostError", () => {
    expect(() => parsePostResponse({ status: "deleted", id: "foo" })).toThrow(DeletedPostError);
  });

  test("rate_limited throws RateLimitedError", () => {
    expect(() => parsePostResponse({ status: "rate_limited", id: "bar" })).toThrow(RateLimitedError);
  });
});
