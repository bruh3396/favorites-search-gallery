import { describe, expect, test } from "vitest";
import { WildcardIndex } from "@/lib/search/indexes/wildcard_index";
import { parseWildcardSearchTerm } from "@/lib/search/parsers/search_term_parser";

const terms = ["banana", "band", "bandana", "brand", "grand", "island", "orange", "sand"].slice().sort();

function matches(index: WildcardIndex, pattern: string): string[] {
  return index.matchingTerms(parseWildcardSearchTerm(pattern)).slice().sort();
}

describe("WildcardIndex", () => {
  const index = new WildcardIndex(terms);

  test("prefix pattern matches terms starting with the fragment", () => {
    expect(matches(index, "ban*")).toEqual(["banana", "band", "bandana"]);
  });

  test("suffix pattern matches terms ending with the fragment", () => {
    expect(matches(index, "*and")).toEqual(["band", "brand", "grand", "island", "sand"]);
  });

  test("substring pattern matches terms containing the fragment", () => {
    expect(matches(index, "*an*")).toEqual(["banana", "band", "bandana", "brand", "grand", "island", "orange", "sand"]);
  });

  test("multi-star pattern matches terms against the regex", () => {
    expect(matches(index, "b*d*a")).toEqual(["bandana"]);
  });

  test("a pattern with no matches returns nothing", () => {
    expect(matches(index, "zzz*")).toEqual([]);
  });

  test("empty index returns nothing", () => {
    expect(matches(new WildcardIndex(), "ban*")).toEqual([]);
  });
});

describe("WildcardIndex mutation", () => {
  test("add makes a new term matchable", () => {
    const index = new WildcardIndex(terms);

    index.add("bandit");
    expect(matches(index, "ban*")).toEqual(["banana", "band", "bandana", "bandit"]);
  });

  test("remove drops a term from matches", () => {
    const index = new WildcardIndex(terms);

    index.remove("band");
    expect(matches(index, "ban*")).toEqual(["banana", "bandana"]);
  });

  test("index replaces the corpus", () => {
    const index = new WildcardIndex(terms);

    index.index(["kiwi", "kumquat"]);
    expect(matches(index, "ban*")).toEqual([]);
    expect(matches(index, "k*")).toEqual(["kiwi", "kumquat"]);
  });
});
