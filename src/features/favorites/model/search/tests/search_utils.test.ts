import {createSearchTag, createSearchTagGroup, isWildcardSearchTag, sortSearchTagGroup} from "../search_command/search_command_utils";
import {describe, expect, test} from "vitest";
import {SearchTag} from "../search_tags/search_tag";
import {WildcardSearchTag} from "../search_tags/wildcard_search_tag";

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

  test("createSearchTag", () => {
    expect(WILDCARD_SEARCH_TAGS.every(tag => createSearchTag(tag) instanceof WildcardSearchTag)).toBe(true);
    expect(NORMAL_SEARCH_TAGS.every(tag => createSearchTag(tag) instanceof SearchTag)).toBe(true);
  });

  test("createSearchTagGroup", () => {
    expect(createSearchTagGroup(["mango", "mango", "mango", "mango"]).length).toBe(1);
    expect(createSearchTagGroup(["mango", "mango", "mango", "-mango"]).length).toBe(2);
    expect(createSearchTagGroup(["mango", "mango", "*mango", "-mango"]).length).toBe(3);
    expect(createSearchTagGroup(["mangoes", "mango", "*mango", "-mango"]).length).toBe(4);
    expect(createSearchTagGroup(["mango", "mango", "mango", "mango"])).toStrictEqual([createSearchTag("mango")]);
  });

  test("remaining tags", () => {
    const searchTag = createSearchTag("mango");
    const negatedSearchTag = createSearchTag("-mango");
    const wildcardSearchTag = createSearchTag("*mango");
    const wildcardNegatedSearchTag = createSearchTag("-*mango");
    const searchTagGroup = [wildcardSearchTag, negatedSearchTag, searchTag, wildcardNegatedSearchTag];

    expect(searchTag.finalCost).toBeLessThan(wildcardSearchTag.finalCost);
    expect(sortSearchTagGroup(searchTagGroup)).toStrictEqual([searchTag, negatedSearchTag, wildcardSearchTag, wildcardNegatedSearchTag]);
  });
});
