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

describe("isWildcardTerm", () => {
  test("distinguishes wildcard terms from normal terms", () => {
    expect(normalTerms.every(term => !isWildcardTerm(term))).toBe(true);
    expect(wildcardTerms.every(term => isWildcardTerm(term))).toBe(true);
  });
});

describe("isMetricTerm", () => {
  test("normal and wildcard terms are not metric terms", () => {
    expect(normalTerms.every(term => !isMetricTerm(term))).toBe(true);
    expect(wildcardTerms.every(term => !isMetricTerm(term))).toBe(true);
  });

  test("every metric and comparator", () => {
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
  test("bare numerics, negated or not, are numeric terms", () => {
    expect(["0", "7", "200", "-200"].every(term => isNumericTerm(term))).toBe(true);
  });

  test("non-numerics are not numeric terms", () => {
    expect(["", "-", "a12345", "100cal", "200*", "id:200", "mango"].every(term => !isNumericTerm(term))).toBe(true);
  });
});

describe("parseSearchTerm", () => {
  test("classifies terms into wildcard and exact", () => {
    expect(wildcardTerms.every(term => parseSearchTerm(term) instanceof WildcardSearchTerm)).toBe(true);
    expect(normalTerms.every(term => parseSearchTerm(term) instanceof ExactSearchTerm)).toBe(true);
  });

  test("a bare numeric is a numeric term", () => {
    expect(parseSearchTerm("200")).toBeInstanceOf(NumericSearchTerm);
    expect(parseSearchTerm("-200")).toBeInstanceOf(NumericSearchTerm);
  });

  test("an explicit id metric stays a metric term and does not expand to the tag", () => {
    const term = parseSearchTerm("id:200");

    expect(term).toBeInstanceOf(MetricSearchTerm);
    expect(term).not.toBeInstanceOf(NumericSearchTerm);
  });
});

describe("wildcard match type", () => {
  function matchType(term: string): WildcardMatchType {
    return parseWildcardSearchTerm(term).matchType;
  }

  test("a single trailing star is a prefix match", () => {
    expect(matchType("mango*")).toBe(WildcardMatchType.Prefix);
    expect(matchType("m*")).toBe(WildcardMatchType.Prefix);
  });

  test("a single leading star is a suffix match", () => {
    expect(matchType("*mango")).toBe(WildcardMatchType.Suffix);
    expect(matchType("*o")).toBe(WildcardMatchType.Suffix);
  });

  test("a leading and trailing star is a substring match", () => {
    expect(matchType("*mango*")).toBe(WildcardMatchType.Substring);
    expect(matchType("*a*")).toBe(WildcardMatchType.Substring);
  });

  test("internal stars are a multi star match", () => {
    expect(matchType("man*go")).toBe(WildcardMatchType.MultiStar);
    expect(matchType("*an*ngo")).toBe(WildcardMatchType.MultiStar);
    expect(matchType("ch*r*")).toBe(WildcardMatchType.MultiStar);
    expect(matchType("*pp*e*")).toBe(WildcardMatchType.MultiStar);
    expect(matchType("a*b*c")).toBe(WildcardMatchType.MultiStar);
  });

  test("collapses duplicate stars before classifying", () => {
    expect(matchType("mango**")).toBe(WildcardMatchType.Prefix);
    expect(matchType("**mango")).toBe(WildcardMatchType.Suffix);
    expect(matchType("**mango**")).toBe(WildcardMatchType.Substring);
  });

  test("a bare star is a prefix match on the empty prefix", () => {
    expect(matchType("*")).toBe(WildcardMatchType.Prefix);
  });
});
