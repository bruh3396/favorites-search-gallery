import { describe, expect, test } from "vitest";
import { WildcardExpander } from "@/lib/search/engine/wildcard/expander";
import { WildcardResolver } from "@/lib/search/engine/wildcard/types";

class FakeResolver implements WildcardResolver {
  constructor(private readonly byFragment: Record<string, string[]>) { }

  public termsStartingWith(fragment: string): string[] {
    return this.byFragment[fragment] ?? [];
  }

  public termsContaining(fragment: string): string[] {
    return this.byFragment[fragment] ?? [];
  }

  public termsEndingWith(fragment: string): string[] {
    return this.byFragment[fragment] ?? [];
  }

  public termsMatching(fragments: string[], matches: (term: string) => boolean): string[] {
    return (this.byFragment[fragments.join("*")] ?? []).filter(matches);
  }

  public addTerm(): void { }

  public removeTerm(): void { }
}

function expand(query: string, byFragment: Record<string, string[]>): { query: string; isUnmatchable: boolean } {
  return new WildcardExpander(new FakeResolver(byFragment)).expand(query);
}

describe("WildcardExpander", () => {
  test("a query with no wildcard passes through unchanged", () => {
    expect(expand("cat dog", {})).toEqual({ query: "cat dog", isUnmatchable: false });
  });

  test("a prefix wildcard becomes an or group of matching terms", () => {
    expect(expand("cat*", { cat: ["cat", "catgirl"] })).toEqual({ query: "( cat ~ catgirl )", isUnmatchable: false });
  });

  test("a single matching term needs no or group", () => {
    expect(expand("cat*", { cat: ["catgirl"] })).toEqual({ query: "( catgirl )", isUnmatchable: false });
  });

  test("a substring wildcard expands via containing terms", () => {
    expect(expand("*an*", { an: ["banana", "canvas"] })).toEqual({ query: "( banana ~ canvas )", isUnmatchable: false });
  });

  test("a suffix wildcard expands via ending terms", () => {
    expect(expand("*girl", { girl: ["catgirl", "doggirl"] })).toEqual({ query: "( catgirl ~ doggirl )", isUnmatchable: false });
  });

  test("a positive wildcard matching nothing marks the query unmatchable", () => {
    expect(expand("cat*", {})).toEqual({ query: "cat*", isUnmatchable: true });
  });

  test("a negated wildcard matching nothing is left untouched and stays matchable", () => {
    expect(expand("-cat*", {})).toEqual({ query: "-cat*", isUnmatchable: false });
  });

  test("a negated wildcard expands to negated terms", () => {
    expect(expand("-cat*", { cat: ["cat", "catgirl"] })).toEqual({ query: "-cat -catgirl", isUnmatchable: false });
  });

  test("a wildcard inside an or group expands to or alternatives, not a nested group", () => {
    expect(expand("( cat* ~ dog )", { cat: ["cat", "catgirl"] })).toEqual({ query: "( cat ~ catgirl ~ dog )", isUnmatchable: false });
  });

  test("a substring wildcard inside an or group expands to or alternatives, not a nested group", () => {
    expect(expand("( *cat* ~ dog )", { cat: ["cat", "catgirl"] })).toEqual({ query: "( cat ~ catgirl ~ dog )", isUnmatchable: false });
  });

  test("multiple wildcard kinds inside an or group all flatten to or alternatives", () => {
    expect(expand("( *cat* ~ dog* )", { cat: ["cat", "catgirl"], dog: ["dog", "doghouse"] })).toEqual({ query: "( cat ~ catgirl ~ dog ~ doghouse )", isUnmatchable: false });
  });

  test("a second wildcard in an or group still flattens when an earlier expansion contains parens", () => {
    expect(expand("( *word* ~ dog* )", {
      word: ["morgan_tylle_(word2)", "word"],
      dog: ["dog", "doghouse"]
    })).toEqual({ query: "( morgan_tylle_(word2) ~ word ~ dog ~ doghouse )", isUnmatchable: false });
  });

  test("a trailing paren term before a second wildcard does not break or group flattening", () => {
    expect(expand("( *word* ~ dog* )", {
      word: ["word", "dragonslayer_(sword)"],
      dog: ["dog", "doghouse"]
    })).toEqual({ query: "( word ~ dragonslayer_(sword) ~ dog ~ doghouse )", isUnmatchable: false });
  });

  test("a zero-match wildcard inside an or group does not mark unmatchable", () => {
    expect(expand("( cat* ~ dog )", {})).toEqual({ query: "( cat* ~ dog )", isUnmatchable: false });
  });

  test("keeps a required exact term alongside an expanded wildcard", () => {
    expect(expand("solo cat*", { cat: ["cat", "catgirl"] })).toEqual({ query: "solo ( cat ~ catgirl )", isUnmatchable: false });
  });
});
