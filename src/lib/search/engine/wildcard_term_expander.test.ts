import { describe, expect, test } from "vitest";
import { Fruit } from "@/lib/search/testing/fruit_corpus";
import { WildcardResolver } from "@/lib/search/engine/wildcard_resolver";
import { WildcardTermExpander } from "@/lib/search/engine/wildcard_term_expander";
import { parseSearchQuery } from "@/lib/search/parsers/search_term_group_parser";

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

function expand(query: string, byFragment: Record<string, string[]>): { andTerms: string[]; orGroups: string[][]; isUnmatchable: boolean } {
  const expander = new WildcardTermExpander<Fruit>(new FakeResolver(byFragment));
  const result = expander.expand(parseSearchQuery<Fruit>(query));
  return {
    andTerms: result.searchQuery.andTerms.map(term => term.literal),
    orGroups: result.searchQuery.orGroups.map(orGroup => orGroup.map(term => term.literal)),
    isUnmatchable: result.isUnmatchable
  };
}

describe("expandWildcards", () => {
  test("a query with no wildcard passes through unchanged", () => {
    expect(expand("cat dog", {})).toEqual({ andTerms: ["cat", "dog"], orGroups: [], isUnmatchable: false });
  });

  test("a prefix wildcard becomes an or group of matching terms", () => {
    expect(expand("cat*", { cat: ["cat", "catgirl"] })).toEqual({ andTerms: [], orGroups: [["cat", "catgirl"]], isUnmatchable: false });
  });

  test("a single matching term flattens to an and term", () => {
    expect(expand("cat*", { cat: ["catgirl"] })).toEqual({ andTerms: ["catgirl"], orGroups: [], isUnmatchable: false });
  });

  test("a substring wildcard expands via containing terms", () => {
    expect(expand("*an*", { an: ["banana", "canvas"] })).toEqual({ andTerms: [], orGroups: [["banana", "canvas"]], isUnmatchable: false });
  });

  test("a suffix wildcard expands via ending terms", () => {
    expect(expand("*girl", { girl: ["catgirl", "doggirl"] })).toEqual({ andTerms: [], orGroups: [["catgirl", "doggirl"]], isUnmatchable: false });
  });

  test("a multi star wildcard expands via matching terms", () => {
    expect(expand("c*t*", { "c*t": ["cat", "carrot"] })).toEqual({ andTerms: [], orGroups: [["cat", "carrot"]], isUnmatchable: false });
  });

  test("a positive wildcard matching nothing marks the query unmatchable", () => {
    expect(expand("cat*", {}).isUnmatchable).toBe(true);
  });

  test("a negated wildcard matching nothing stays matchable and adds no terms", () => {
    expect(expand("-cat*", {})).toEqual({ andTerms: [], orGroups: [], isUnmatchable: false });
  });

  test("a negated wildcard expands to negated and terms", () => {
    expect(expand("-cat*", { cat: ["cat", "catgirl"] })).toEqual({ andTerms: ["-cat", "-catgirl"], orGroups: [], isUnmatchable: false });
  });

  test("a wildcard inside an or group flattens into the group", () => {
    expect(expand("( cat* ~ dog )", { cat: ["cat", "catgirl"] })).toEqual({ andTerms: [], orGroups: [["dog", "cat", "catgirl"]], isUnmatchable: false });
  });

  test("multiple wildcard kinds inside an or group all flatten", () => {
    expect(expand("( *cat* ~ dog* )", { cat: ["cat", "catgirl"], dog: ["dog", "doghouse"] })).toEqual({ andTerms: [], orGroups: [["dog", "doghouse", "cat", "catgirl"]], isUnmatchable: false });
  });

  test("keeps a required exact term alongside an expanded wildcard", () => {
    expect(expand("solo cat*", { cat: ["cat", "catgirl"] })).toEqual({ andTerms: ["solo"], orGroups: [["cat", "catgirl"]], isUnmatchable: false });
  });

  test("a negated wildcard inside an or group is dropped from the group", () => {
    expect(expand("( -cat* ~ dog )", { cat: ["cat", "catgirl"] })).toEqual({ andTerms: ["dog"], orGroups: [], isUnmatchable: false });
  });

  test("an or group of only a negated wildcard is unmatchable", () => {
    expect(expand("( -cat* ~ -dog* )", { cat: ["cat"], dog: ["dog"] }).isUnmatchable).toBe(true);
  });
});
