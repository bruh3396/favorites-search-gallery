import { buildSearchTerms, parseTermGroups, sortSearchTerms } from "@/lib/search/parsers/search_term_group_parser";
import { describe, expect, test } from "vitest";
import { isMetadataTerm, isWildcardTerm, parseSearchTerm } from "@/lib/search/parsers/search_term_parser";
import { ExactSearchTerm } from "@/lib/search/terms/exact_search_term";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

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

describe("extractTagGroups", () => {
  function testTagGroups(input: string, expectedOrGroups: string[][], expectedAndTags: string[]): void {
    const result = parseTermGroups(input);

    expect(result.orGroups).toStrictEqual(expectedOrGroups);
    expect(result.andTerms).toStrictEqual(expectedAndTags);
  }

  test("empty", () => {
    testTagGroups("", [], []);
    testTagGroups(" ", [], []);
    testTagGroups("\n", [], []);
    testTagGroups("\t", [], []);
  });

  test("only and tags", () => {
    testTagGroups("grape", [], ["grape"]);
    testTagGroups("cherry banana", [], ["cherry", "banana"]);
    testTagGroups("apple orange", [], ["apple", "orange"]);
    testTagGroups("apple orange grape", [], ["apple", "orange", "grape"]);
  });

  test("parenthesis", () => {
    testTagGroups("apple_(red)", [], ["apple_(red)"]);
    testTagGroups("apple_(red) banana", [], ["apple_(red)", "banana"]);
    testTagGroups("apple_(red) banana_(yellow)", [], ["apple_(red)", "banana_(yellow)"]);
    testTagGroups("apple_(red) banana_(yellow) grape", [], ["apple_(red)", "banana_(yellow)", "grape"]);
  });

  test("only groups", () => {
    testTagGroups("( apple )", [["apple"]], []);
    testTagGroups("( apple ) ( banana )", [["apple"], ["banana"]], []);
    testTagGroups("( -apple ) ( banana ) ( -grape )", [["-apple"], ["banana"], ["-grape"]], []);
    testTagGroups("( apple ~ banana )", [["apple", "banana"]], []);
  });

  test("only invalid groups", () => {
    testTagGroups("(apple )", [], ["(apple", ")"]);
    testTagGroups("( apple", [], ["(", "apple"]);
    testTagGroups("apple )", [], ["apple", ")"]);
    testTagGroups("apple (", [], ["apple", "("]);
    testTagGroups("(apple)", [], ["(apple)"]);
  });

  test("both groups", () => {
    testTagGroups("apple ( banana )", [["banana"]], ["apple"]);
    testTagGroups("apple ( banana ) grape", [["banana"]], ["apple", "grape"]);
    testTagGroups("apple ( banana ) grape ( orange )", [["banana"], ["orange"]], ["apple", "grape"]);
    testTagGroups("apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
  });

  test("negated group", () => {
    testTagGroups("-( apple )", [], ["-(", "apple", ")"]);
  });

  test("extra spaces", () => {
    testTagGroups("  apple  ( banana )  grape  ", [["banana"]], ["apple", "grape"]);
    testTagGroups("  apple ( banana ) grape ( orange )  ", [["banana"], ["orange"]], ["apple", "grape"]);
    testTagGroups("  apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi  ", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
    testTagGroups(" apple                  banana    ( cherry )", [["cherry"]], ["apple", "banana"]);
  });
});
