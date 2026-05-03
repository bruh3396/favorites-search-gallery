import { Searchable, SearchableMetadataMetric } from "../../types/search";
import { describe, expect, test } from "vitest";
import { parseMetadataTag } from "../../lib/search/parse/tag_parser";

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
      expect(parseMetadataTag("width:1920").matches(hd)).toBe(true);
      expect(parseMetadataTag("height:1080").matches(hd)).toBe(true);
      expect(parseMetadataTag("score:50").matches(hd)).toBe(true);
      expect(parseMetadataTag("id:1000").matches(hd)).toBe(true);
      expect(parseMetadataTag("duration:120").matches(hd)).toBe(true);
    });

    test("does not match different value", () => {
      expect(parseMetadataTag("width:1280").matches(hd)).toBe(false);
      expect(parseMetadataTag("height:720").matches(hd)).toBe(false);
      expect(parseMetadataTag("score:25").matches(hd)).toBe(false);
    });

    test("negated equals", () => {
      expect(parseMetadataTag("-width:1920").matches(hd)).toBe(false);
      expect(parseMetadataTag("-width:1280").matches(hd)).toBe(true);
    });
  });

  describe("greater than operator (:>)", () => {
    test("matches when metric is greater", () => {
      expect(parseMetadataTag("score:>25").matches(hd)).toBe(true);
      expect(parseMetadataTag("width:>1280").matches(hd)).toBe(true);
      expect(parseMetadataTag("id:>999").matches(hd)).toBe(true);
    });

    test("does not match when metric is equal or less", () => {
      expect(parseMetadataTag("score:>50").matches(hd)).toBe(false);
      expect(parseMetadataTag("score:>100").matches(hd)).toBe(false);
    });

    test("negated greater than", () => {
      expect(parseMetadataTag("-score:>25").matches(hd)).toBe(false);
      expect(parseMetadataTag("-score:>100").matches(hd)).toBe(true);
    });
  });

  describe("less than operator (:<)", () => {
    test("matches when metric is less", () => {
      expect(parseMetadataTag("score:<100").matches(hd)).toBe(true);
      expect(parseMetadataTag("width:<1920").matches(sd)).toBe(true);
      expect(parseMetadataTag("id:<9999999").matches(hd)).toBe(true);
    });

    test("does not match when metric is equal or greater", () => {
      expect(parseMetadataTag("score:<50").matches(hd)).toBe(false);
      expect(parseMetadataTag("score:<25").matches(hd)).toBe(false);
    });

    test("negated less than", () => {
      expect(parseMetadataTag("-score:<100").matches(hd)).toBe(false);
      expect(parseMetadataTag("-score:<25").matches(hd)).toBe(true);
    });
  });

  describe("right hand metric comparison", () => {
    test("equals metric", () => {
      expect(parseMetadataTag("width:height").matches(square)).toBe(true);
      expect(parseMetadataTag("width:height").matches(hd)).toBe(false);
    });

    test("greater than metric", () => {
      expect(parseMetadataTag("width:>height").matches(hd)).toBe(true);
      expect(parseMetadataTag("width:>height").matches(square)).toBe(false);
    });

    test("less than metric", () => {
      expect(parseMetadataTag("height:<width").matches(sd)).toBe(true);
      expect(parseMetadataTag("duration:<score").matches(hd)).toBe(false);
    });

    test("negated metric comparison", () => {
      expect(parseMetadataTag("-width:height").matches(square)).toBe(false);
      expect(parseMetadataTag("-width:height").matches(hd)).toBe(true);
    });
  });

  describe("invalid expressions", () => {
    test("invalid metric defaults gracefully", () => {
      expect(() => parseMetadataTag("invalid:100").matches(hd)).not.toThrow();
    });

    test("invalid operator defaults gracefully", () => {
      expect(() => parseMetadataTag("width::100").matches(hd)).not.toThrow();
    });
  });

  describe("edge cases", () => {
    test("zero value", () => {
      expect(parseMetadataTag("duration:0").matches(square)).toBe(true);
      expect(parseMetadataTag("duration:0").matches(hd)).toBe(false);
    });

    test("large id value", () => {
      expect(parseMetadataTag("id:9999999").matches(square)).toBe(true);
      expect(parseMetadataTag("id:<9999999").matches(hd)).toBe(true);
    });
  });
});
