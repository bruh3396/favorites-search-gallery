import { buildSearchTagGroup, sortSearchTagGroup } from "../lib/search/query/search_tag_group";
import { describe, expect, test } from "vitest";
import { isMetadataSearchTag, isWildcardSearchTag, parseSearchTag } from "../lib/search/tag/search_tag_parser";
import { ExactSearchTag } from "../lib/search/tag/exact_search_tag";
import { WildcardSearchTag } from "../lib/search/tag/wildcard_search_tag";

const NORMAL_SEARCH_TAGS = [
  "",
  "m",
  "mango",
  "-",
  "-mango",
  "grape",
  "cherry"
];

const WILDCARD_SEARCH_TAGS = [
  "*",
  "*mango",
  "*mango*",
  "man*go",
  "*an*ngo",
  "ch*r*",
  "*pp*e*"
];

describe("utils", () => {
  test("isWildcardSearchTag", () => {
    expect(NORMAL_SEARCH_TAGS.every(tag => !isWildcardSearchTag(tag))).toBe(true);
    expect(WILDCARD_SEARCH_TAGS.every(tag => isWildcardSearchTag(tag))).toBe(true);
  });

  test("isMetadataSearchTag", () => {
    expect(NORMAL_SEARCH_TAGS.every(tag => !isMetadataSearchTag(tag))).toBe(true);
    expect(WILDCARD_SEARCH_TAGS.every(tag => !isMetadataSearchTag(tag))).toBe(true);

    for (const metric of ["width", "height", "id", "score", "duration"]) {
      for (const comparator of [":", ":<", ":>"]) {
        expect(isMetadataSearchTag(`${metric}${comparator}0`)).toBe(true);
        expect(isMetadataSearchTag(`${metric}${comparator}${metric}`)).toBe(true);
        expect(isMetadataSearchTag(`apple${comparator}${metric}`)).toBe(false);
        expect(isMetadataSearchTag(`${metric}${comparator}banana`)).toBe(false);
      }
    }
  });

  test("createSearchTag", () => {
    expect(WILDCARD_SEARCH_TAGS.every(tag => parseSearchTag(tag) instanceof WildcardSearchTag)).toBe(true);
    expect(NORMAL_SEARCH_TAGS.every(tag => parseSearchTag(tag) instanceof ExactSearchTag)).toBe(true);
  });

  test("createSearchTagGroup", () => {
    expect(buildSearchTagGroup(["mango", "mango", "mango", "mango"]).length).toBe(1);
    expect(buildSearchTagGroup(["mango", "mango", "mango", "-mango"]).length).toBe(2);
    expect(buildSearchTagGroup(["mango", "mango", "*mango", "-mango"]).length).toBe(3);
    expect(buildSearchTagGroup(["mangoes", "mango", "*mango", "-mango"]).length).toBe(4);
    expect(buildSearchTagGroup(["mango", "mango", "mango", "mango"])).toStrictEqual([parseSearchTag("mango")]);
  });

  test("and tags", () => {
    const searchTag = parseSearchTag("mango");
    const negatedSearchTag = parseSearchTag("-mango");
    const wildcardSearchTag = parseSearchTag("*mango");
    const wildcardNegatedSearchTag = parseSearchTag("-*mango");
    const searchTagGroup = [wildcardSearchTag, negatedSearchTag, searchTag, wildcardNegatedSearchTag];

    expect(searchTag.cost).toBeLessThan(wildcardSearchTag.cost);
    expect(sortSearchTagGroup(searchTagGroup)).toStrictEqual([searchTag, negatedSearchTag, wildcardSearchTag, wildcardNegatedSearchTag]);
  });
});
