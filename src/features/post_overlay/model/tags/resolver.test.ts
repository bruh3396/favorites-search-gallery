import * as PostOverlayTagsResolver from "@/features/post_overlay/model/tags/resolver";
import { afterEach, describe, expect, test, vi } from "vitest";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories/remote_tag_categories";
import { TagCategory } from "@/core/domain/tag/tag";

type Fetch = RemoteTagCategories["fetch"];

function setup(fetch: Fetch = (tagNames): ReturnType<Fetch> => Promise.resolve(new Map(tagNames.map(tagName => [tagName, "artist"])))): {
  localTagCategories: MemoryLocalTagCategories;
  remoteTagCategories: { fetch: ReturnType<typeof vi.fn<Fetch>> };
} {
  return { localTagCategories: new MemoryLocalTagCategories(), remoteTagCategories: { fetch: vi.fn<Fetch>(fetch) } };
}

function createCategoryMap(entries: [string, TagCategory][]): Map<string, TagCategory> {
  return new Map(entries);
}

describe("resolveAll", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("skips the post's own id among its tags", async() => {
    const ports = setup();

    expect(await PostOverlayTagsResolver.resolveAll(ports, "123", new Set(["123", "alice"]))).toEqual(createCategoryMap([["alice", "artist"]]));
  });

  test("fetches only tags it has not stored, and stores them", async() => {
    const ports = setup();

    await ports.localTagCategories.setMany(createCategoryMap([["alice", "character"]]));

    expect(await PostOverlayTagsResolver.resolveAll(ports, "1", new Set(["alice", "bob"])))
      .toEqual(createCategoryMap([["alice", "character"], ["bob", "artist"]]));
    expect(ports.remoteTagCategories.fetch).toHaveBeenCalledWith(["bob"]);
    expect(await ports.localTagCategories.getMany(["bob"])).toEqual(createCategoryMap([["bob", "artist"]]));
  });

  test("does not fetch when every tag is stored", async() => {
    const ports = setup();

    await ports.localTagCategories.setMany(createCategoryMap([["alice", "character"]]));
    await PostOverlayTagsResolver.resolveAll(ports, "1", new Set(["alice"]));

    expect(ports.remoteTagCategories.fetch).not.toHaveBeenCalled();
  });

  test("files tags as general when the fetch fails, without storing them", async() => {
    vi.spyOn(console, "error").mockImplementation(() => { });
    const ports = setup(() => Promise.reject(new Error("offline")));

    expect(await PostOverlayTagsResolver.resolveAll(ports, "1", new Set(["alice"]))).toEqual(createCategoryMap([["alice", "general"]]));
    expect(await ports.localTagCategories.getMany(["alice"])).toEqual(new Map());
  });
});
