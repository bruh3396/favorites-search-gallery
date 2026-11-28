import { describe, expect, test, vi } from "vitest";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/memory_local_tag_categories";
import { TagCategory } from "@/core/domain/tag_category/tag_category";
import { TagCategoryResolver } from "@/core/features/tag_categories/tag_category_resolver";

async function setup(storedTagCategories: ReadonlyMap<string, TagCategory>): Promise<{
  tagCategoryResolver: TagCategoryResolver; localTagCategories: MemoryLocalTagCategories;
}> {
  const localTagCategories = new MemoryLocalTagCategories();

  await localTagCategories.setMany(storedTagCategories);
  return { tagCategoryResolver: new TagCategoryResolver({ localTagCategories }), localTagCategories };
}

describe("TagCategoryResolver", () => {
  describe("resolve", () => {
    test("prefers the dictionary's category over a stored one", async() => {
      const { tagCategoryResolver } = await setup(new Map([["mileena", "general"]]));

      tagCategoryResolver.prime(new Map([["mileena", "character"]]));
      expect(await tagCategoryResolver.resolve(["mileena"])).toEqual(new Map([["mileena", "character"]]));
    });

    test("falls back to the stored category for a tag the dictionary lacks, and leaves out a tag neither knows", async() => {
      const { tagCategoryResolver } = await setup(new Map([["rare_artist", "artist"]]));

      tagCategoryResolver.prime(new Map([["female", "general"]]));
      expect(await tagCategoryResolver.resolve(["female", "rare_artist", "unseen"])).toEqual(new Map([
        ["female", "general"],
        ["rare_artist", "artist"]
      ]));
    });

    test("reads only the stored categories until it is primed", async() => {
      const { tagCategoryResolver } = await setup(new Map([["mileena", "general"]]));

      expect(await tagCategoryResolver.resolve(["mileena"])).toEqual(new Map([["mileena", "general"]]));
    });

    test("skips the stored categories when the dictionary has every tag", async() => {
      const { tagCategoryResolver, localTagCategories } = await setup(new Map());
      const getMany = vi.spyOn(localTagCategories, "getMany");

      tagCategoryResolver.prime(new Map([["female", "general"]]));
      await tagCategoryResolver.resolve(["female"]);
      expect(getMany).not.toHaveBeenCalled();
    });
  });

  describe("resolveCommon", () => {
    test("returns nothing until it is primed", async() => {
      const { tagCategoryResolver } = await setup(new Map());

      expect(tagCategoryResolver.resolveCommon("mileena")).toBeUndefined();
    });

    test("returns the dictionary's category once primed", async() => {
      const { tagCategoryResolver } = await setup(new Map());

      tagCategoryResolver.prime(new Map([["mileena", "character"]]));
      expect(tagCategoryResolver.resolveCommon("mileena")).toBe("character");
    });

    test("ignores the stored categories", async() => {
      const { tagCategoryResolver } = await setup(new Map([["rare_artist", "artist"]]));

      tagCategoryResolver.prime(new Map());
      expect(tagCategoryResolver.resolveCommon("rare_artist")).toBeUndefined();
    });
  });
});
