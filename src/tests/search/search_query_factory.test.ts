import { buildTagGroup, sortTagGroup } from "../../lib/search/parse/tag_group_parser";
import { describe, expect, test } from "vitest";
import { isMetadataTag, isWildcardTag, parseTag } from "../../lib/search/parse/tag_parser";
import { ExactTag } from "../../lib/search/tag/exact_tag";
import { WildcardTag } from "../../lib/search/tag/wildcard_tag";

const normalSearchTags = [
  "",
  "m",
  "mango",
  "-",
  "-mango",
  "grape",
  "cherry"
];

const wildcardSearchTags = [
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
    expect(normalSearchTags.every(tag => !isWildcardTag(tag))).toBe(true);
    expect(wildcardSearchTags.every(tag => isWildcardTag(tag))).toBe(true);
  });

  test("isMetadataSearchTag", () => {
    expect(normalSearchTags.every(tag => !isMetadataTag(tag))).toBe(true);
    expect(wildcardSearchTags.every(tag => !isMetadataTag(tag))).toBe(true);

    for (const metric of ["width", "height", "id", "score", "duration"]) {
      for (const comparator of [":", ":<", ":>"]) {
        expect(isMetadataTag(`${metric}${comparator}0`)).toBe(true);
        expect(isMetadataTag(`${metric}${comparator}${metric}`)).toBe(true);
        expect(isMetadataTag(`apple${comparator}${metric}`)).toBe(false);
        expect(isMetadataTag(`${metric}${comparator}banana`)).toBe(false);
      }
    }
  });

  test("createSearchTag", () => {
    expect(wildcardSearchTags.every(tag => parseTag(tag) instanceof WildcardTag)).toBe(true);
    expect(normalSearchTags.every(tag => parseTag(tag) instanceof ExactTag)).toBe(true);
  });

  test("createSearchTagGroup", () => {
    expect(buildTagGroup(["mango", "mango", "mango", "mango"]).length).toBe(1);
    expect(buildTagGroup(["mango", "mango", "mango", "-mango"]).length).toBe(2);
    expect(buildTagGroup(["mango", "mango", "*mango", "-mango"]).length).toBe(3);
    expect(buildTagGroup(["mangoes", "mango", "*mango", "-mango"]).length).toBe(4);
    expect(buildTagGroup(["mango", "mango", "mango", "mango"])).toStrictEqual([parseTag("mango")]);
  });

  test("and tags", () => {
    const searchTag = parseTag("mango");
    const negatedSearchTag = parseTag("-mango");
    const wildcardSearchTag = parseTag("*mango");
    const wildcardNegatedSearchTag = parseTag("-*mango");
    const searchTagGroup = [wildcardSearchTag, negatedSearchTag, searchTag, wildcardNegatedSearchTag];

    expect(searchTag.cost).toBeLessThan(wildcardSearchTag.cost);
    expect(sortTagGroup(searchTagGroup)).toStrictEqual([searchTag, negatedSearchTag, wildcardSearchTag, wildcardNegatedSearchTag]);
  });
});
