import { describe, expect, test } from "vitest";
import { TagSuggester } from "@/core/features/autocomplete/tag_suggester";

const TAG_COUNTS: Record<string, number> = { cat: 2, cat_ears: 7, cats: 2, catgirl: 40 };

function createTagSuggester(maxSuggestionCount: number = 10): TagSuggester {
  return new TagSuggester({ maxSuggestionCount }, {
    getTagsStartingWith: prefix => Object.keys(TAG_COUNTS).filter(tag => tag.startsWith(prefix)),
    countFavoritesWithTag: tag => TAG_COUNTS[tag]
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

    test("suggests nothing for an unknown prefix", () => {
      expect(createTagSuggester().suggest("zzz")).toEqual([]);
    });
  });
});
