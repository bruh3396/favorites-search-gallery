import { describe, expect, test } from "vitest";
import { MediaType } from "@/types/media";
import { resolveMediaType } from "@/lib/media/media_type_resolver";

describe("resolveMediaType", () => {
  describe("image", () => {
    test.each([
      "",
      "tag1",
      "tag1 ",
      "tag1 tag2",
      "tag1 tag2 tag3"
    ])("resolves %j to image", (tags) => {
      expect(resolveMediaType(tags)).toBe("image");
    });
  });

  describe("video", () => {
    test.each([
      "video",
      "mp4",
      "tag1 video",
      "video tag2",
      "tag1 video more_tags tag20",
      "tag1 mp4 tag2"
    ])("resolves %j to video", (tags) => {
      expect(resolveMediaType(tags)).toBe("video");
    });
  });

  describe("gif", () => {
    test.each([
      "gif",
      "animated",
      "animated_gif",
      "tag1 gif",
      "tag1 tag2 animated",
      "tag1 animated_gif tag2"
    ])("resolves %j to gif", (tags) => {
      expect(resolveMediaType(tags)).toBe("gif");
    });
  });

  describe("video takes precedence over gif", () => {
    test.each([
      "video gif",
      "gif video",
      "mp4 animated",
      "animated_gif video"
    ])("resolves %j to video", (tags) => {
      expect(resolveMediaType(tags)).toBe("video");
    });
  });

  describe("set input", () => {
    test.each<[string[], MediaType]>([
      [[], "image"],
      [["tag1", "tag2"], "image"],
      [["tag1", "video"], "video"],
      [["tag1", "mp4"], "video"],
      [["tag1", "gif"], "gif"],
      [["tag1", "animated"], "gif"],
      [["tag1", "animated_gif"], "gif"],
      [["gif", "video"], "video"]
    ])("resolves %j to \"%s\"", (tags, expected) => {
      expect(resolveMediaType(new Set(tags))).toBe(expected);
    });
  });
});
