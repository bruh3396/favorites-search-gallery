import { Searchable, SearchableMetadataMetric } from "../types/common_types";
import { describe, expect, test } from "vitest";
import { parseMetadataSearchTag } from "../lib/search/tag/search_tag_parser";

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

const HD = createMetadataSearchable({ width: 1920, height: 1080, score: 50, id: 1000, duration: 120 });
const SD = createMetadataSearchable({ width: 1280, height: 720, score: 25, id: 500, duration: 60 });
const SQUARE = createMetadataSearchable({ width: 1080, height: 1080, score: 100, id: 9999999, duration: 0 });

describe("MetadataSearchTag", () => {
  describe("equals operator (:)", () => {
    test("matches exact value", () => {
      expect(parseMetadataSearchTag("width:1920").matches(HD)).toBe(true);
      expect(parseMetadataSearchTag("height:1080").matches(HD)).toBe(true);
      expect(parseMetadataSearchTag("score:50").matches(HD)).toBe(true);
      expect(parseMetadataSearchTag("id:1000").matches(HD)).toBe(true);
      expect(parseMetadataSearchTag("duration:120").matches(HD)).toBe(true);
    });

    test("does not match different value", () => {
      expect(parseMetadataSearchTag("width:1280").matches(HD)).toBe(false);
      expect(parseMetadataSearchTag("height:720").matches(HD)).toBe(false);
      expect(parseMetadataSearchTag("score:25").matches(HD)).toBe(false);
    });

    test("negated equals", () => {
      expect(parseMetadataSearchTag("-width:1920").matches(HD)).toBe(false);
      expect(parseMetadataSearchTag("-width:1280").matches(HD)).toBe(true);
    });
  });

  describe("greater than operator (:>)", () => {
    test("matches when metric is greater", () => {
      expect(parseMetadataSearchTag("score:>25").matches(HD)).toBe(true);
      expect(parseMetadataSearchTag("width:>1280").matches(HD)).toBe(true);
      expect(parseMetadataSearchTag("id:>999").matches(HD)).toBe(true);
    });

    test("does not match when metric is equal or less", () => {
      expect(parseMetadataSearchTag("score:>50").matches(HD)).toBe(false);
      expect(parseMetadataSearchTag("score:>100").matches(HD)).toBe(false);
    });

    test("negated greater than", () => {
      expect(parseMetadataSearchTag("-score:>25").matches(HD)).toBe(false);
      expect(parseMetadataSearchTag("-score:>100").matches(HD)).toBe(true);
    });
  });

  describe("less than operator (:<)", () => {
    test("matches when metric is less", () => {
      expect(parseMetadataSearchTag("score:<100").matches(HD)).toBe(true);
      expect(parseMetadataSearchTag("width:<1920").matches(SD)).toBe(true);
      expect(parseMetadataSearchTag("id:<9999999").matches(HD)).toBe(true);
    });

    test("does not match when metric is equal or greater", () => {
      expect(parseMetadataSearchTag("score:<50").matches(HD)).toBe(false);
      expect(parseMetadataSearchTag("score:<25").matches(HD)).toBe(false);
    });

    test("negated less than", () => {
      expect(parseMetadataSearchTag("-score:<100").matches(HD)).toBe(false);
      expect(parseMetadataSearchTag("-score:<25").matches(HD)).toBe(true);
    });
  });

  describe("right hand metric comparison", () => {
    test("equals metric", () => {
      expect(parseMetadataSearchTag("width:height").matches(SQUARE)).toBe(true);
      expect(parseMetadataSearchTag("width:height").matches(HD)).toBe(false);
    });

    test("greater than metric", () => {
      expect(parseMetadataSearchTag("width:>height").matches(HD)).toBe(true);
      expect(parseMetadataSearchTag("width:>height").matches(SQUARE)).toBe(false);
    });

    test("less than metric", () => {
      expect(parseMetadataSearchTag("height:<width").matches(SD)).toBe(true);
      expect(parseMetadataSearchTag("duration:<score").matches(HD)).toBe(false);
    });

    test("negated metric comparison", () => {
      expect(parseMetadataSearchTag("-width:height").matches(SQUARE)).toBe(false);
      expect(parseMetadataSearchTag("-width:height").matches(HD)).toBe(true);
    });
  });

  describe("invalid expressions", () => {
    test("invalid metric defaults gracefully", () => {
      expect(() => parseMetadataSearchTag("invalid:100").matches(HD)).not.toThrow();
    });

    test("invalid operator defaults gracefully", () => {
      expect(() => parseMetadataSearchTag("width::100").matches(HD)).not.toThrow();
    });
  });

  describe("edge cases", () => {
    test("zero value", () => {
      expect(parseMetadataSearchTag("duration:0").matches(SQUARE)).toBe(true);
      expect(parseMetadataSearchTag("duration:0").matches(HD)).toBe(false);
    });

    test("large id value", () => {
      expect(parseMetadataSearchTag("id:9999999").matches(SQUARE)).toBe(true);
      expect(parseMetadataSearchTag("id:<9999999").matches(HD)).toBe(true);
    });
  });
});
