/* eslint-disable camelcase */
import { DeletedPostError, PostFetchError } from "@/types/errors";
import { describe, expect, test } from "vitest";
import { PostResponse } from "@/types/api";
import { parsePostResponse } from "@/lib/remote/parsers/post";

function ok(raw: string): PostResponse {
  return { status: "ok", raw };
}

const rawPost = JSON.stringify([
{
  id: 123,
  width: 1920,
  height: 1080,
  score: 100,
  rating: "e",
  change: 1234567890,
  tags: "tag1 tag2",
  tag_info: [
    { tag: "tag1", type: "tag", count: 5 },
    { tag: "tag2", type: "character", count: 3 }
  ],
  file_url: "https://example.com/image.jpg",
  preview_url: "https://example.com/preview.jpg"
}
]);

describe("parsePostResponse", () => {
  test("ok maps fields correctly", () => {
    const post = parsePostResponse(ok(rawPost));

    expect(post.id).toBe("123");
    expect(post.width).toBe(1920);
    expect(post.height).toBe(1080);
    expect(post.score).toBe(100);
    expect(post.rating).toBe("e");
    expect(post.tags).toBe("tag1 tag2");
    expect(post.fileURL).toBe("https://example.com/image.jpg");
    expect(post.previewURL).toBe("https://example.com/preview.jpg");
  });

  test("ok decodes tag categories from tag_info", () => {
    const post = parsePostResponse(ok(rawPost));

    expect(post.tagCategories.get("tag1")).toBe("general");
    expect(post.tagCategories.get("tag2")).toBe("character");
  });

  test("ok falls back to space-split tags when tag_info is absent", () => {
    const raw = JSON.stringify([
{
      id: 1, width: 0, height: 0, score: 0, rating: "e", change: 0,
      tags: "alpha beta", file_url: "f", preview_url: "p"
    }
]);
    const post = parsePostResponse(ok(raw));

    expect(post.tags).toBe("alpha beta");
    expect(post.tagCategories.get("alpha")).toBe("general");
    expect(post.tagCategories.get("beta")).toBe("general");
  });

  test("ok decodes html entities in tag names", () => {
    const raw = JSON.stringify([
{
      id: 1, width: 0, height: 0, score: 0, rating: "e", change: 0,
      tags: "a", tag_info: [{ tag: "rock_&amp;_roll", type: "tag", count: 1 }],
      file_url: "f", preview_url: "p"
    }
]);
    const post = parsePostResponse(ok(raw));

    expect(post.tagCategories.has("rock_&_roll")).toBe(true);
  });

  test("empty array raw throws DeletedPostError", () => {
    expect(() => parsePostResponse(ok("[]"))).toThrow(DeletedPostError);
  });

  test("malformed raw throws DeletedPostError", () => {
    expect(() => parsePostResponse(ok("not json"))).toThrow(DeletedPostError);
  });

  test("rate_limited throws PostFetchError", () => {
    expect(() => parsePostResponse({ status: "rate_limited", id: "bar" })).toThrow(PostFetchError);
  });

  test("error throws PostFetchError", () => {
    expect(() => parsePostResponse({ status: "error", id: "bar" })).toThrow(PostFetchError);
  });
});
