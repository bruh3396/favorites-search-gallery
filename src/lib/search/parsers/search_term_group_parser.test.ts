import { buildSearchTerms, parseTermGroups, sortSearchTerms } from "@/lib/search/parsers/search_term_group_parser";
import { describe, expect, test } from "vitest";
import { isMetadataTerm, isWildcardTerm, parseSearchTerm } from "@/lib/search/parsers/search_term_parser";
import { ExactSearchTerm } from "@/lib/search/terms/exact_search_term";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

const normalTerms = [
  "",
  "m",
  "mango",
  "-",
  "-mango",
  "grape",
  "cherry"
];

const wildcardTerms = [
  "*",
  "*mango",
  "*mango*",
  "man*go",
  "*an*ngo",
  "ch*r*",
  "*pp*e*"
];

describe("predicates", () => {
  test("isWildcardTerm", () => {
    expect(normalTerms.every(term => !isWildcardTerm(term))).toBe(true);
    expect(wildcardTerms.every(term => isWildcardTerm(term))).toBe(true);
  });

  test("isMetadataSearchTerm", () => {
    expect(normalTerms.every(term => !isMetadataTerm(term))).toBe(true);
    expect(wildcardTerms.every(term => !isMetadataTerm(term))).toBe(true);

    for (const metric of ["width", "height", "id", "score", "duration"]) {
      for (const comparator of [":", ":<", ":>"]) {
        expect(isMetadataTerm(`${metric}${comparator}0`)).toBe(true);
        expect(isMetadataTerm(`${metric}${comparator}${metric}`)).toBe(true);
        expect(isMetadataTerm(`apple${comparator}${metric}`)).toBe(false);
        expect(isMetadataTerm(`${metric}${comparator}banana`)).toBe(false);
      }
    }
  });

  test("parseSearchTerm", () => {
    expect(wildcardTerms.every(term => parseSearchTerm(term) instanceof WildcardSearchTerm)).toBe(true);
    expect(normalTerms.every(term => parseSearchTerm(term) instanceof ExactSearchTerm)).toBe(true);
  });

  test("buildSearchTerms", () => {
    expect(buildSearchTerms(["mango", "mango", "mango", "mango"]).length).toBe(1);
    expect(buildSearchTerms(["mango", "mango", "mango", "-mango"]).length).toBe(2);
    expect(buildSearchTerms(["mango", "mango", "*mango", "-mango"]).length).toBe(3);
    expect(buildSearchTerms(["mangoes", "mango", "*mango", "-mango"]).length).toBe(4);
    expect(buildSearchTerms(["mango", "mango", "mango", "mango"])).toStrictEqual([parseSearchTerm("mango")]);
  });

  test("sortSearchTerms", () => {
    const term = parseSearchTerm("mango");
    const negatedTerm = parseSearchTerm("-mango");
    const wildcardTerm = parseSearchTerm("*mango");
    const wildcardNegatedTerm = parseSearchTerm("-*mango");
    const terms = [wildcardTerm, negatedTerm, term, wildcardNegatedTerm];

    expect(term.cost).toBeLessThan(wildcardTerm.cost);
    expect(sortSearchTerms(terms)).toStrictEqual([term, negatedTerm, wildcardTerm, wildcardNegatedTerm]);
  });
});

describe("parseTermGroups", () => {
  function testTermGroups(input: string, expectedOrGroups: string[][], expectedAndTerms: string[]): void {
    const result = parseTermGroups(input);

    expect(result.orGroups).toStrictEqual(expectedOrGroups);
    expect(result.andTerms).toStrictEqual(expectedAndTerms);
  }

  test("empty", () => {
    testTermGroups("", [], []);
    testTermGroups(" ", [], []);
    testTermGroups("\n", [], []);
    testTermGroups("\t", [], []);
  });

  test("only and terms", () => {
    testTermGroups("grape", [], ["grape"]);
    testTermGroups("cherry banana", [], ["cherry", "banana"]);
    testTermGroups("apple orange", [], ["apple", "orange"]);
    testTermGroups("apple orange grape", [], ["apple", "orange", "grape"]);
  });

  test("parenthesis", () => {
    testTermGroups("apple_(red)", [], ["apple_(red)"]);
    testTermGroups("apple_(red) banana", [], ["apple_(red)", "banana"]);
    testTermGroups("apple_(red) banana_(yellow)", [], ["apple_(red)", "banana_(yellow)"]);
    testTermGroups("apple_(red) banana_(yellow) grape", [], ["apple_(red)", "banana_(yellow)", "grape"]);
  });

  test("only groups", () => {
    testTermGroups("( apple )", [["apple"]], []);
    testTermGroups("( apple ) ( banana )", [["apple"], ["banana"]], []);
    testTermGroups("( -apple ) ( banana ) ( -grape )", [["-apple"], ["banana"], ["-grape"]], []);
    testTermGroups("( apple ~ banana )", [["apple", "banana"]], []);
  });

  test("only invalid groups", () => {
    testTermGroups("(apple )", [], ["(apple", ")"]);
    testTermGroups("( apple", [], ["(", "apple"]);
    testTermGroups("apple )", [], ["apple", ")"]);
    testTermGroups("apple (", [], ["apple", "("]);
    testTermGroups("(apple)", [], ["(apple)"]);
  });

  test("both groups", () => {
    testTermGroups("apple ( banana )", [["banana"]], ["apple"]);
    testTermGroups("apple ( banana ) grape", [["banana"]], ["apple", "grape"]);
    testTermGroups("apple ( banana ) grape ( orange )", [["banana"], ["orange"]], ["apple", "grape"]);
    testTermGroups("apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
  });

  test("negated group", () => {
    testTermGroups("-( apple )", [], ["-(", "apple", ")"]);
  });

  test("extra spaces", () => {
    testTermGroups("  apple  ( banana )  grape  ", [["banana"]], ["apple", "grape"]);
    testTermGroups("  apple ( banana ) grape ( orange )  ", [["banana"], ["orange"]], ["apple", "grape"]);
    testTermGroups("  apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi  ", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
    testTermGroups(" apple                  banana    ( cherry )", [["cherry"]], ["apple", "banana"]);
  });
});
