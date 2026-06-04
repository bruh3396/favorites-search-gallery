import { Searchable, SearchableMetadataMetric } from "../../../../types/search";
import { createSearchable, fruits, getAllSubstrings, getPrefixes, searchableEmptyDoc, searchableFruitDoc } from "../fixtures/fruit_search";
import { describe, expect, test } from "vitest";
import { parseExactSearchTerm, parseMetadataSearchTerm, parseWildcardSearchTerm } from "../../../../lib/search/parsers/search_term_parser";

const positiveCases = [
  ["banana", true],
  ["kiwi", true],
  ["grape", true],
  ["apple", true],
  ["orange", true],
  ["mango", true],
  ["rose", false],
  ["tulip", false],
  ["daisy", false],
  ["lily", false],
  ["orchid", false],
  ["sunflower", false]
] as const;

const negatedCases = [
  ["-banana", false],
  ["-kiwi", false],
  ["-grape", false],
  ["-apple", false],
  ["-orange", false],
  ["-mango", false],
  ["-rose", true],
  ["-tulip", true],
  ["-daisy", true],
  ["-lily", true],
  ["-orchid", true],
  ["-sunflower", true]
] as const;

const invalidCases = [
  [" ", false],
  ["   ", false],
  ["a", false]
] as const;

describe("exactTag", () => {
  test("empty", () => {
    expect(parseExactSearchTerm("").matches(searchableFruitDoc)).toBe(false);
  });

  test("cost", () => {
    expect(parseExactSearchTerm("foo").cost).toBeLessThan(parseExactSearchTerm("-foo").cost);
  });

  test.each(positiveCases)("matches %s", (tag, expected) => {
    expect(parseExactSearchTerm(tag).matches(searchableFruitDoc)).toBe(expected);
  });

  test.each(negatedCases)("negated %s", (tag, expected) => {
    expect(parseExactSearchTerm(tag).matches(searchableFruitDoc)).toBe(expected);
  });

  test.each(invalidCases)("invalid '%s'", (tag, expected) => {
    expect(parseExactSearchTerm(tag).matches(searchableEmptyDoc)).toBe(expected);
  });

  test("negated matches with empty set", () => {
    expect(parseExactSearchTerm("-banana").matches(searchableEmptyDoc)).toBe(true);
  });
});

describe("wildcardSearchTag", () => {
  test("empty", () => {
    expect(parseWildcardSearchTerm("*").matches(searchableEmptyDoc)).toBe(false);
  });

  test("empty negated", () => {
    expect(parseWildcardSearchTerm("-*").matches(searchableEmptyDoc)).toBe(true);
  });

  test("one tag", () => {
    expect(parseWildcardSearchTerm("*").matches(createSearchable(["apple"]))).toBe(true);
  });

  test("match all", () => {
    expect(parseWildcardSearchTerm("*").matches(searchableFruitDoc)).toBe(true);
  });

  test("match none", () => {
    expect(parseWildcardSearchTerm("-*").matches(searchableFruitDoc)).toBe(false);
  });

  test("matches prefix", () => {
    for (const fruit of fruits) {
      for (const prefix of getPrefixes(fruit)) {
        expect(parseWildcardSearchTerm(`${prefix}*`).matches(searchableFruitDoc)).toBe(true);
      }
    }
  });

  test("matches double asterisk", () => {
    for (const fruit of fruits) {
      for (const substring of getAllSubstrings(fruit)) {
        expect(parseWildcardSearchTerm(`*${substring}*`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardSearchTerm(`**${substring}*`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardSearchTerm(`**${substring}***`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardSearchTerm(`*${substring}_NO_MATCH_*`).matches(searchableFruitDoc)).toBe(false);
      }
    }
  });

  test("matches inside", () => {
    expect(parseWildcardSearchTerm("*b*na*").matches(searchableFruitDoc)).toBe(true);
    expect(parseWildcardSearchTerm("*b*a*").matches(searchableFruitDoc)).toBe(true);
    expect(parseWildcardSearchTerm("*bna*").matches(searchableFruitDoc)).toBe(false);
  });

  test("compare cost", () => {
    const startsWithTag = parseWildcardSearchTerm("banana*");
    const containsTag = parseWildcardSearchTerm("*bana*");
    const containsTag2 = parseWildcardSearchTerm("*bana*****");
    const endsWithTag = parseWildcardSearchTerm("*banana");
    const regexTag = parseWildcardSearchTerm("*b*a*");

    expect(startsWithTag.cost).toBeLessThan(containsTag.cost);
    expect(startsWithTag.cost).toBeLessThan(endsWithTag.cost);
    expect(startsWithTag.cost).toBeLessThan(regexTag.cost);

    expect(containsTag.cost).toBeLessThan(endsWithTag.cost);
    expect(containsTag.cost).toBeLessThan(regexTag.cost);
    expect(containsTag.cost).toBe(containsTag2.cost);

    expect(endsWithTag.cost).toBe(regexTag.cost);
  });
});

type MetadataSearchable = Searchable & { metrics: Record<SearchableMetadataMetric, number> };

function createMetadataSearchable(metrics: Partial<Record<SearchableMetadataMetric, number>>): MetadataSearchable {
  return {
    tags: new Set(),
    metrics: {
      score: 0,
      width: 0,
      height: 0,
      id: 0,
      duration: 0,
      ...metrics
    }
  };
}

const hd = createMetadataSearchable({ width: 1920, height: 1080, score: 50, id: 1000, duration: 120 });
const sd = createMetadataSearchable({ width: 1280, height: 720, score: 25, id: 500, duration: 60 });
const square = createMetadataSearchable({ width: 1080, height: 1080, score: 100, id: 9999999, duration: 0 });

describe("MetadataSearchTag", () => {
  describe("equals operator (:)", () => {
    test("matches exact value", () => {
      expect(parseMetadataSearchTerm("width:1920").matches(hd)).toBe(true);
      expect(parseMetadataSearchTerm("height:1080").matches(hd)).toBe(true);
      expect(parseMetadataSearchTerm("score:50").matches(hd)).toBe(true);
      expect(parseMetadataSearchTerm("id:1000").matches(hd)).toBe(true);
      expect(parseMetadataSearchTerm("duration:120").matches(hd)).toBe(true);
    });

    test("does not match different value", () => {
      expect(parseMetadataSearchTerm("width:1280").matches(hd)).toBe(false);
      expect(parseMetadataSearchTerm("height:720").matches(hd)).toBe(false);
      expect(parseMetadataSearchTerm("score:25").matches(hd)).toBe(false);
    });

    test("negated equals", () => {
      expect(parseMetadataSearchTerm("-width:1920").matches(hd)).toBe(false);
      expect(parseMetadataSearchTerm("-width:1280").matches(hd)).toBe(true);
    });
  });

  describe("greater than operator (:>)", () => {
    test("matches when metric is greater", () => {
      expect(parseMetadataSearchTerm("score:>25").matches(hd)).toBe(true);
      expect(parseMetadataSearchTerm("width:>1280").matches(hd)).toBe(true);
      expect(parseMetadataSearchTerm("id:>999").matches(hd)).toBe(true);
    });

    test("does not match when metric is equal or less", () => {
      expect(parseMetadataSearchTerm("score:>50").matches(hd)).toBe(false);
      expect(parseMetadataSearchTerm("score:>100").matches(hd)).toBe(false);
    });

    test("negated greater than", () => {
      expect(parseMetadataSearchTerm("-score:>25").matches(hd)).toBe(false);
      expect(parseMetadataSearchTerm("-score:>100").matches(hd)).toBe(true);
    });
  });

  describe("less than operator (:<)", () => {
    test("matches when metric is less", () => {
      expect(parseMetadataSearchTerm("score:<100").matches(hd)).toBe(true);
      expect(parseMetadataSearchTerm("width:<1920").matches(sd)).toBe(true);
      expect(parseMetadataSearchTerm("id:<9999999").matches(hd)).toBe(true);
    });

    test("does not match when metric is equal or greater", () => {
      expect(parseMetadataSearchTerm("score:<50").matches(hd)).toBe(false);
      expect(parseMetadataSearchTerm("score:<25").matches(hd)).toBe(false);
    });

    test("negated less than", () => {
      expect(parseMetadataSearchTerm("-score:<100").matches(hd)).toBe(false);
      expect(parseMetadataSearchTerm("-score:<25").matches(hd)).toBe(true);
    });
  });

  describe("right hand metric comparison", () => {
    test("equals metric", () => {
      expect(parseMetadataSearchTerm("width:height").matches(square)).toBe(true);
      expect(parseMetadataSearchTerm("width:height").matches(hd)).toBe(false);
    });

    test("greater than metric", () => {
      expect(parseMetadataSearchTerm("width:>height").matches(hd)).toBe(true);
      expect(parseMetadataSearchTerm("width:>height").matches(square)).toBe(false);
    });

    test("less than metric", () => {
      expect(parseMetadataSearchTerm("height:<width").matches(sd)).toBe(true);
      expect(parseMetadataSearchTerm("duration:<score").matches(hd)).toBe(false);
    });

    test("negated metric comparison", () => {
      expect(parseMetadataSearchTerm("-width:height").matches(square)).toBe(false);
      expect(parseMetadataSearchTerm("-width:height").matches(hd)).toBe(true);
    });
  });

  describe("invalid expressions", () => {
    test("invalid metric defaults gracefully", () => {
      expect(() => parseMetadataSearchTerm("invalid:100").matches(hd)).not.toThrow();
    });

    test("invalid operator defaults gracefully", () => {
      expect(() => parseMetadataSearchTerm("width::100").matches(hd)).not.toThrow();
    });
  });

  describe("edge cases", () => {
    test("zero value", () => {
      expect(parseMetadataSearchTerm("duration:0").matches(square)).toBe(true);
      expect(parseMetadataSearchTerm("duration:0").matches(hd)).toBe(false);
    });

    test("large id value", () => {
      expect(parseMetadataSearchTerm("id:9999999").matches(square)).toBe(true);
      expect(parseMetadataSearchTerm("id:<9999999").matches(hd)).toBe(true);
    });
  });
});
