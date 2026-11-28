import { describe, expect, test, vi } from "vitest";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/memory_local_tag_categories";
import { MemoryRemoteTagDictionary } from "@/adapters/memory/ports/remote_tag_dictionary/memory_remote_tag_dictionary";
import { TagCategory } from "@/core/domain/tag_category/tag_category";
import { TagCategoryResolver } from "@/core/features/tag_categories/tag_category_resolver";

async function setup(
  tagDictionary: ReadonlyMap<string, TagCategory>,
  storedTagCategories: ReadonlyMap<string, TagCategory>
): Promise<{ tagCategoryResolver: TagCategoryResolver; localTagCategories: MemoryLocalTagCategories }> {
  const localTagCategories = new MemoryLocalTagCategories();

  await localTagCategories.setMany(storedTagCategories);
  return {
    tagCategoryResolver: new TagCategoryResolver({ remoteTagDictionary: new MemoryRemoteTagDictionary(tagDictionary), localTagCategories }),
    localTagCategories
  };
}

describe("TagCategoryResolver", () => {
  describe("resolve", () => {
    test("prefers the dictionary's category over a stored one", async() => {
      const { tagCategoryResolver } = await setup(new Map([["mileena", "character"]]), new Map([["mileena", "general"]]));

      await tagCategoryResolver.load();
      expect(await tagCategoryResolver.resolve(["mileena"])).toEqual(new Map([["mileena", "character"]]));
    });

    test("falls back to the stored category for a tag the dictionary lacks, and leaves out a tag neither knows", async() => {
      const { tagCategoryResolver } = await setup(new Map([["female", "general"]]), new Map([["rare_artist", "artist"]]));

      await tagCategoryResolver.load();
      expect(await tagCategoryResolver.resolve(["female", "rare_artist", "unseen"])).toEqual(new Map([
        ["female", "general"],
        ["rare_artist", "artist"]
      ]));
    });

    test("reads only the stored categories until the dictionary has loaded", async() => {
      const { tagCategoryResolver } = await setup(new Map([["mileena", "character"]]), new Map([["mileena", "general"]]));

      expect(await tagCategoryResolver.resolve(["mileena"])).toEqual(new Map([["mileena", "general"]]));
    });

    test("skips the stored categories when the dictionary has every tag", async() => {
      const { tagCategoryResolver, localTagCategories } = await setup(new Map([["female", "general"]]), new Map());
      const getMany = vi.spyOn(localTagCategories, "getMany");

      await tagCategoryResolver.load();
      await tagCategoryResolver.resolve(["female"]);
      expect(getMany).not.toHaveBeenCalled();
    });
  });

  describe("resolveCommon", () => {
    test("returns nothing until the dictionary has loaded", async() => {
      const { tagCategoryResolver } = await setup(new Map([["mileena", "character"]]), new Map());

      expect(tagCategoryResolver.resolveCommon("mileena")).toBeUndefined();
    });

    test("returns the dictionary's category once loaded", async() => {
      const { tagCategoryResolver } = await setup(new Map([["mileena", "character"]]), new Map());

      await tagCategoryResolver.load();
      expect(tagCategoryResolver.resolveCommon("mileena")).toBe("character");
    });

    test("ignores the stored categories", async() => {
      const { tagCategoryResolver } = await setup(new Map(), new Map([["rare_artist", "artist"]]));

      await tagCategoryResolver.load();
      expect(tagCategoryResolver.resolveCommon("rare_artist")).toBeUndefined();
    });
  });

  describe("load", () => {
    test("keeps reading the stored categories when the dictionary can't be fetched", async() => {
      const localTagCategories = new MemoryLocalTagCategories();
      const tagCategoryResolver = new TagCategoryResolver({
        remoteTagDictionary: { fetch: (): Promise<never> => Promise.reject(new Error("offline")) },
        localTagCategories
      });

      await localTagCategories.setMany(new Map([["mileena", "general"]]));
      await expect(tagCategoryResolver.load()).rejects.toThrow("offline");
      expect(await tagCategoryResolver.resolve(["mileena"])).toEqual(new Map([["mileena", "general"]]));
    });
  });
});
