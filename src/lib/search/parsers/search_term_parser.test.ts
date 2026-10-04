import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";
import { describe, expect, test } from "vitest";
import { isMetricTerm, isNumericTerm, isWildcardTerm, parseSearchTerm, parseWildcardSearchTerm } from "@/lib/search/parsers/search_term_parser";
import { ExactSearchTerm } from "@/lib/search/terms/exact_search_term";
import { MetricSearchTerm } from "@/lib/search/terms/metric_search_term";
import { NumericSearchTerm } from "@/lib/search/terms/numeric_search_term";

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

describe("isWildcardTerm", () => {
  test("distinguishes wildcard terms from normal terms", () => {
    expect(normalTerms.every(term => !isWildcardTerm(term))).toBe(true);
    expect(wildcardTerms.every(term => isWildcardTerm(term))).toBe(true);
  });
});

describe("isMetricTerm", () => {
  test("rejects normal and wildcard terms", () => {
    expect(normalTerms.every(term => !isMetricTerm(term))).toBe(true);
    expect(wildcardTerms.every(term => !isMetricTerm(term))).toBe(true);
  });

  test("accepts every metric and comparator, and nothing else around them", () => {
    for (const metric of ["width", "height", "id", "score", "duration"]) {
      for (const comparator of [":", ":<", ":>"]) {
        expect(isMetricTerm(`${metric}${comparator}0`)).toBe(true);
        expect(isMetricTerm(`${metric}${comparator}${metric}`)).toBe(true);
        expect(isMetricTerm(`apple${comparator}${metric}`)).toBe(false);
        expect(isMetricTerm(`${metric}${comparator}banana`)).toBe(false);
      }
    }
  });
});

describe("isNumericTerm", () => {
  test("accepts bare numerics, negated or not", () => {
    expect(["0", "7", "200", "-200"].every(term => isNumericTerm(term))).toBe(true);
  });

  test("rejects non-numerics", () => {
    expect(["", "-", "a12345", "100cal", "200*", "id:200", "mango"].every(term => !isNumericTerm(term))).toBe(true);
  });
});

describe("parseSearchTerm", () => {
  test("classifies terms into wildcard and exact", () => {
    expect(wildcardTerms.every(term => parseSearchTerm(term) instanceof WildcardSearchTerm)).toBe(true);
    expect(normalTerms.every(term => parseSearchTerm(term) instanceof ExactSearchTerm)).toBe(true);
  });

  test("parses a bare numeric as a numeric term", () => {
    expect(parseSearchTerm("200")).toBeInstanceOf(NumericSearchTerm);
    expect(parseSearchTerm("-200")).toBeInstanceOf(NumericSearchTerm);
  });

  test("keeps an explicit id metric a metric term, without expanding it to the tag", () => {
    const term = parseSearchTerm("id:200");

    expect(term).toBeInstanceOf(MetricSearchTerm);
    expect(term).not.toBeInstanceOf(NumericSearchTerm);
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
    const term = parseWildcardSearchTerm("*[");

    expect(term.matches({ tags: new Set(["[", "a["]) })).toBe(false);
  });
});
