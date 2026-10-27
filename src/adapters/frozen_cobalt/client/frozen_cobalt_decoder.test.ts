import { FrozenCobaltPost } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post";
import { FrozenCobaltTagCategoryCode } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_category_code";
import { decodeFrozenCobaltPost, decodeFrozenCobaltTagCategory } from "@/adapters/frozen_cobalt/client/frozen_cobalt_decoder";
import { describe, expect, test, vi } from "vitest";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/frozen_cobalt_error";
import { Media } from "@/core/domain/media/media";

const frozenCobaltPost: FrozenCobaltPost = {
  id: "123",
  width: 1_920,
  height: 1_080,
  score: 100,
  rating: "e",
  change: 1_234_567_890,
  fileURL: "https://example.com/image.jpg",
  tagCategories: { tag1: 0, tag2: 4 }
};

const media: Media = { kind: "image", locator: "image.jpg" };

function mintMedia(): Media {
  return media;
}

describe("decodeFrozenCobaltPost", () => {
  test("decodes a post's fields into the domain", () => {
    expect(decodeFrozenCobaltPost(frozenCobaltPost, mintMedia).post).toEqual({
      id: "123",
      width: 1_920,
      height: 1_080,
      score: 100,
      rating: "explicit",
      changedAt: 1_234_567_890_000,
      media,
      tags: "tag1 tag2",
      status: "active"
    });
  });

  test.each([
    ["q", "questionable"],
    ["Safe", "safe"],
    ["x", "explicit"]
  ])("decodes rating %s as %s", (rating, expected) => {
    expect(decodeFrozenCobaltPost({ ...frozenCobaltPost, rating }, mintMedia).post.rating).toBe(expected);
  });

  test("leaves the duration unknown, so a stored duration survives a refresh", () => {
    expect(decodeFrozenCobaltPost(frozenCobaltPost, mintMedia).post).not.toHaveProperty("durationSeconds");
  });

  test("mints the media from the file and the decoded tags", () => {
    const minted = vi.fn(mintMedia);

    decodeFrozenCobaltPost(frozenCobaltPost, minted);
    expect(minted).toHaveBeenCalledWith({ url: "https://example.com/image.jpg", tags: "tag1 tag2" });
  });

  test("rejects a file it can't mint media for", () => {
    const unknownFile = new FrozenCobaltError("unknown_file", { subject: "https://example.com/image.jpg" });

    expect(() => decodeFrozenCobaltPost(frozenCobaltPost, () => null)).toThrow(unknownFile);
  });

  test("decodes tag categories", () => {
    const { tagCategories } = decodeFrozenCobaltPost(frozenCobaltPost, mintMedia);

    expect(tagCategories.get("tag1")).toBe("general");
    expect(tagCategories.get("tag2")).toBe("character");
  });

  test("unescapes HTML entities in tag names", () => {
    const escaped: FrozenCobaltPost = { ...frozenCobaltPost, tagCategories: { "rock&amp;roll": 0 } };

    expect(decodeFrozenCobaltPost(escaped, mintMedia).post.tags).toBe("rock&roll");
  });
});

describe("decodeFrozenCobaltTagCategory", () => {
  test("decodes known codes", () => {
    const codes: FrozenCobaltTagCategoryCode[] = [0, 1, 2, 3, 4, 5];
    const categories = ["general", "artist", "unknown", "copyright", "character", "metadata"];

    expect(codes.map(decodeFrozenCobaltTagCategory)).toEqual(categories);
  });

  test("defaults to general for null", () => {
    expect(decodeFrozenCobaltTagCategory(null)).toBe("general");
  });
});
