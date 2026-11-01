import { describe, expect, test, vi } from "vitest";
import { FrozenCobaltPost } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post";
import { Media } from "@/core/domain/media/media";
import { decodeFrozenCobaltPost } from "@/adapters/frozen_cobalt/client/frozen_cobalt_decoder";

const frozenCobaltPost: FrozenCobaltPost = {
  id: "123",
  width: 1_920,
  height: 1_080,
  score: 100,
  rating: "questionable",
  changedAt: 1_234_567_890,
  directory: 1_234,
  stem: "a1b2c3",
  extension: "jpg",
  tagCategoryByName: { tag1: "general", tag2: "character" }
};

const media: Media = { kind: "image", locator: "1234/a1b2c3.jpg" };

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
      rating: "questionable",
      changedAt: 1_234_567_890_000,
      media,
      tags: "tag1 tag2",
      status: "active"
    });
  });

  test("leaves the duration unknown, so a stored duration survives a refresh", () => {
    expect(decodeFrozenCobaltPost(frozenCobaltPost, mintMedia).post).not.toHaveProperty("durationSeconds");
  });

  test("mints the media from the file's parts and the tags", () => {
    const minted = vi.fn(mintMedia);

    decodeFrozenCobaltPost(frozenCobaltPost, minted);
    expect(minted).toHaveBeenCalledWith({ directory: 1_234, stem: "a1b2c3", extension: "jpg", tags: "tag1 tag2" });
  });

  test("keeps each tag's category", () => {
    expect(decodeFrozenCobaltPost(frozenCobaltPost, mintMedia).tagCategories)
      .toEqual(new Map([["tag1", "general"], ["tag2", "character"]]));
  });
});
