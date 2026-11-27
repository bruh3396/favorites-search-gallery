import { describe, expect, test } from "vitest";
import { ExactSearchTerm } from "@/core/domain/search/terms/exact_search_term";
import { parseExactSearchTerm } from "@/core/domain/search/parsers/exact_search_term_parser";

describe("parseExactSearchTerm", () => {
  test("parses a plain term as a positive exact term", () => {
    const exactSearchTerm = parseExactSearchTerm("mango");

    expect(exactSearchTerm).toBeInstanceOf(ExactSearchTerm);
    expect([exactSearchTerm.value, exactSearchTerm.isNegated]).toEqual(["mango", false]);
  });

  test("parses a leading minus as a negated exact term", () => {
    const exactSearchTerm = parseExactSearchTerm("-mango");

    expect([exactSearchTerm.value, exactSearchTerm.isNegated]).toEqual(["mango", true]);
  });
});
