import { describe, expect, test } from "vitest";
import { ExactSearchTerm } from "@/core/domain/search/terms/exact_search_term";
import { MetricSearchTerm } from "@/core/domain/search/terms/metric_search_term";
import { NumericSearchTerm } from "@/core/domain/search/terms/numeric_search_term";
import { WildcardSearchTerm } from "@/core/domain/search/terms/wildcard_search_term";
import { parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";

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

  test.each(["invalid:100", "width::100", "--width:100"])("parses %s as an exact term", term => {
    expect(parseSearchTerm(term)).toBeInstanceOf(ExactSearchTerm);
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
