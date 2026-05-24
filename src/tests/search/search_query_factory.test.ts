import { buildSearchTerms, sortSearchTerms } from "../../lib/search/parsers/search_term_group_parser";
import { describe, expect, test } from "vitest";
import { isMetadataTerm, isWildcardTerm, parseSearchTerm } from "../../lib/search/parsers/search_term_parser";
import { ExactSearchTerm } from "../../lib/search/terms/exact_search_term";
import { WildcardSearchTerm } from "../../lib/search/terms/wildcard_search_term";

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
    expect(normalSearchTags.every(tag => !isWildcardTerm(tag))).toBe(true);
    expect(wildcardSearchTags.every(tag => isWildcardTerm(tag))).toBe(true);
  });

  test("isMetadataSearchTag", () => {
    expect(normalSearchTags.every(tag => !isMetadataTerm(tag))).toBe(true);
    expect(wildcardSearchTags.every(tag => !isMetadataTerm(tag))).toBe(true);

    for (const metric of ["width", "height", "id", "score", "duration"]) {
      for (const comparator of [":", ":<", ":>"]) {
        expect(isMetadataTerm(`${metric}${comparator}0`)).toBe(true);
        expect(isMetadataTerm(`${metric}${comparator}${metric}`)).toBe(true);
        expect(isMetadataTerm(`apple${comparator}${metric}`)).toBe(false);
        expect(isMetadataTerm(`${metric}${comparator}banana`)).toBe(false);
      }
    }
  });

  test("createSearchTag", () => {
    expect(wildcardSearchTags.every(tag => parseSearchTerm(tag) instanceof WildcardSearchTerm)).toBe(true);
    expect(normalSearchTags.every(tag => parseSearchTerm(tag) instanceof ExactSearchTerm)).toBe(true);
  });

  test("createSearchTagGroup", () => {
    expect(buildSearchTerms(["mango", "mango", "mango", "mango"]).length).toBe(1);
    expect(buildSearchTerms(["mango", "mango", "mango", "-mango"]).length).toBe(2);
    expect(buildSearchTerms(["mango", "mango", "*mango", "-mango"]).length).toBe(3);
    expect(buildSearchTerms(["mangoes", "mango", "*mango", "-mango"]).length).toBe(4);
    expect(buildSearchTerms(["mango", "mango", "mango", "mango"])).toStrictEqual([parseSearchTerm("mango")]);
  });

  test("and tags", () => {
    const searchTag = parseSearchTerm("mango");
    const negatedSearchTag = parseSearchTerm("-mango");
    const wildcardSearchTag = parseSearchTerm("*mango");
    const wildcardNegatedSearchTag = parseSearchTerm("-*mango");
    const searchTagGroup = [wildcardSearchTag, negatedSearchTag, searchTag, wildcardNegatedSearchTag];

    expect(searchTag.cost).toBeLessThan(wildcardSearchTag.cost);
    expect(sortSearchTerms(searchTagGroup)).toStrictEqual([searchTag, negatedSearchTag, wildcardSearchTag, wildcardNegatedSearchTag]);
  });
});
