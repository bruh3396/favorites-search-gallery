import { describe, expect, test } from "vitest";
import { WildcardMatchType } from "@/core/domain/search/terms/wildcard_match_type";
import { parseWildcardSearchTerm } from "@/core/domain/search/parsers/wildcard_search_term_parser";

function parseMatchType(term: string): WildcardMatchType {
  return parseWildcardSearchTerm(term).matchType;
}

describe("parseWildcardSearchTerm", () => {
  test("classifies a single trailing star as a prefix match", () => {
    expect(parseMatchType("mango*")).toBe(WildcardMatchType.Prefix);
    expect(parseMatchType("m*")).toBe(WildcardMatchType.Prefix);
  });

  test("classifies a single leading star as a suffix match", () => {
    expect(parseMatchType("*mango")).toBe(WildcardMatchType.Suffix);
    expect(parseMatchType("*o")).toBe(WildcardMatchType.Suffix);
  });

  test("classifies a leading and trailing star as a substring match", () => {
    expect(parseMatchType("*mango*")).toBe(WildcardMatchType.Substring);
    expect(parseMatchType("*a*")).toBe(WildcardMatchType.Substring);
  });

  test("classifies internal stars as a multi star match", () => {
    expect(parseMatchType("man*go")).toBe(WildcardMatchType.MultiStar);
    expect(parseMatchType("*an*ngo")).toBe(WildcardMatchType.MultiStar);
    expect(parseMatchType("ch*r*")).toBe(WildcardMatchType.MultiStar);
    expect(parseMatchType("*pp*e*")).toBe(WildcardMatchType.MultiStar);
    expect(parseMatchType("a*b*c")).toBe(WildcardMatchType.MultiStar);
  });

  test("collapses duplicate stars before classifying", () => {
    expect(parseMatchType("mango**")).toBe(WildcardMatchType.Prefix);
    expect(parseMatchType("**mango")).toBe(WildcardMatchType.Suffix);
    expect(parseMatchType("**mango**")).toBe(WildcardMatchType.Substring);
  });

  test("classifies a bare star as a prefix match on the empty prefix", () => {
    expect(parseMatchType("*")).toBe(WildcardMatchType.Prefix);
  });

  test("matches nothing for a pattern that is not a valid regex", () => {
    const wildcardSearchTerm = parseWildcardSearchTerm("*[");

    expect(wildcardSearchTerm.matches({ tags: new Set(["[", "a["]) })).toBe(false);
  });
});
