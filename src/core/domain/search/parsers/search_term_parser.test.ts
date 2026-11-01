import { WildcardMatchType } from "@/core/domain/search/terms/wildcard_match_type";
import { WildcardSearchTerm } from "@/core/domain/search/terms/wildcard_search_term";
import { describe, expect, test } from "vitest";
import { parseSearchTerm, parseWildcardSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { ExactSearchTerm } from "@/core/domain/search/terms/exact_search_term";
import { MetricSearchTerm } from "@/core/domain/search/terms/metric_search_term";
import { NumericSearchTerm } from "@/core/domain/search/terms/numeric_search_term";

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

function parseMatchType(term: string): WildcardMatchType {
  return parseWildcardSearchTerm(term).matchType;
}

describe("parseSearchTerm", () => {
  test("classifies terms into wildcard and exact", () => {
    expect(wildcardTerms.every(term => parseSearchTerm(term) instanceof WildcardSearchTerm)).toBe(true);
    expect(normalTerms.every(term => parseSearchTerm(term) instanceof ExactSearchTerm)).toBe(true);
  });

  test("parses every metric and comparator as a metric term, and nothing else around them", () => {
    for (const metric of ["width", "height", "id", "score", "duration"]) {
      for (const comparator of [":", ":<", ":>"]) {
        expect(parseSearchTerm(`${metric}${comparator}0`)).toBeInstanceOf(MetricSearchTerm);
        expect(parseSearchTerm(`${metric}${comparator}${metric}`)).toBeInstanceOf(MetricSearchTerm);
        expect(parseSearchTerm(`apple${comparator}${metric}`)).toBeInstanceOf(ExactSearchTerm);
        expect(parseSearchTerm(`${metric}${comparator}banana`)).toBeInstanceOf(ExactSearchTerm);
      }
    }
  });

  test("parses a bare numeric as a numeric term, negated or not", () => {
    expect(["0", "7", "200", "-200"].every(term => parseSearchTerm(term) instanceof NumericSearchTerm)).toBe(true);
  });

  test("parses nothing else as a numeric term", () => {
    expect(["", "-", "a12345", "100cal", "200*", "id:200", "mango"].every(term => !(parseSearchTerm(term) instanceof NumericSearchTerm))).toBe(true);
  });

  test("keeps an explicit id metric a metric term, without expanding it to the tag", () => {
    const searchTerm = parseSearchTerm("id:200");

    expect(searchTerm).toBeInstanceOf(MetricSearchTerm);
    expect(searchTerm).not.toBeInstanceOf(NumericSearchTerm);
  });
});

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
