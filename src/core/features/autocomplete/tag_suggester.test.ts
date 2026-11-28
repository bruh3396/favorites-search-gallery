import { TagSuggester, TagSuggesterClass } from "@/core/features/autocomplete/tag_suggester";
import { describe, expect, test } from "vitest";
import TAG_SUGGESTER_CSS from "@/core/features/autocomplete/tag_suggester.css?inline";
import { TagCategory } from "@/core/domain/tag_category/tag_category";
import { expectClassesStyled } from "@/testing/css_utilities";

const TAG_COUNTS: Record<string, number> = { cat: 2, cat_ears: 7, cats: 2, catgirl: 40 };
const TAG_CATEGORY_BY_TAG: Record<string, TagCategory> = { cats: "character", cat: "general" };

function createTagSuggester(maxSuggestionCount: number = 10): TagSuggester {
  return new TagSuggester({ maxSuggestionCount }, {
    getTagsStartingWith: prefix => Object.keys(TAG_COUNTS).filter(tag => tag.startsWith(prefix)),
    countFavoritesWithTag: tag => TAG_COUNTS[tag],
    tagCategoryResolver: { resolveCommon: tag => TAG_CATEGORY_BY_TAG[tag] }
  });
}

function listTexts(tagSuggester: TagSuggester, prefix: string): string[] {
  return tagSuggester.suggest(prefix).map(suggestion => suggestion.text);
}

describe("TagSuggester", () => {
  describe("suggest", () => {
    test("puts the most used tags first", () => {
      expect(listTexts(createTagSuggester(), "cat")).toEqual(["catgirl", "cat_ears", "cat", "cats"]);
    });

    test("stops at the maximum", () => {
      expect(listTexts(createTagSuggester(2), "cat")).toEqual(["catgirl", "cat_ears"]);
    });

    test("describes a tag with its count and finishes the word on accepting", () => {
      expect(createTagSuggester().suggest("catg")).toEqual([{ text: "catgirl", acceptedText: "catgirl ", icon: "tag", detail: "40" }]);
    });

    test.each(["artist", "character", "copyright", "metadata"] as const)("tints a %s tag by its category", tagCategory => {
      const tagSuggester = new TagSuggester({ maxSuggestionCount: 10 }, {
        getTagsStartingWith: (): string[] => ["cats"],
        countFavoritesWithTag: (): number => 1,
        tagCategoryResolver: { resolveCommon: (): TagCategory => tagCategory }
      });

      expect(tagSuggester.suggest("cats").map(suggestion => suggestion.textClassName)).toEqual([TagSuggesterClass[tagCategory]]);
    });

    test("leaves general tags and tags the dictionary lacks untinted", () => {
      const textClassNames = createTagSuggester().suggest("cat").map(suggestion => suggestion.textClassName);

      expect(textClassNames).toEqual([undefined, undefined, undefined, TagSuggesterClass.character]);
    });

    test("suggests nothing for an unknown prefix", () => {
      expect(createTagSuggester().suggest("zzz")).toEqual([]);
    });
  });
});

describe("TagSuggesterClass", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(TagSuggesterClass, TAG_SUGGESTER_CSS);
  });
});
