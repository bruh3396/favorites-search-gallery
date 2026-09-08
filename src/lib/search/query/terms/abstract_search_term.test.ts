import { describe, expect, test } from "vitest";
import { parseExactSearchTerm, parseWildcardSearchTerm } from "@/lib/search/query/parsers/search_term_parser";

describe("AbstractSearchTerm", () => {
  describe("literal", () => {
    test("returns the bare value for a positive term", () => {
      expect(parseExactSearchTerm("banana").literal).toBe("banana");
    });

    test("restores the leading dash for a negated term", () => {
      expect(parseExactSearchTerm("-banana").literal).toBe("-banana");
    });

    test("preserves wildcard syntax", () => {
      expect(parseWildcardSearchTerm("ban*").literal).toBe("ban*");
      expect(parseWildcardSearchTerm("-ban*").literal).toBe("-ban*");
    });
  });

  describe("cost", () => {
    test("a negated term costs more than its positive form", () => {
      expect(parseExactSearchTerm("-banana").cost).toBeGreaterThan(parseExactSearchTerm("banana").cost);
    });
  });
});
