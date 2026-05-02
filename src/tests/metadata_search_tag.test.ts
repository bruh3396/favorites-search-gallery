import { Searchable, SearchableMetadataMetric } from "../types/search";
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

const hd = createMetadataSearchable({ width: 1920, height: 1080, score: 50, id: 1000, duration: 120 });
const sd = createMetadataSearchable({ width: 1280, height: 720, score: 25, id: 500, duration: 60 });
const square = createMetadataSearchable({ width: 1080, height: 1080, score: 100, id: 9999999, duration: 0 });

describe("MetadataSearchTag", () => {
  describe("equals operator (:)", () => {
    test("matches exact value", () => {
      expect(parseMetadataSearchTag("width:1920").matches(hd)).toBe(true);
      expect(parseMetadataSearchTag("height:1080").matches(hd)).toBe(true);
      expect(parseMetadataSearchTag("score:50").matches(hd)).toBe(true);
      expect(parseMetadataSearchTag("id:1000").matches(hd)).toBe(true);
      expect(parseMetadataSearchTag("duration:120").matches(hd)).toBe(true);
    });

    test("does not match different value", () => {
      expect(parseMetadataSearchTag("width:1280").matches(hd)).toBe(false);
      expect(parseMetadataSearchTag("height:720").matches(hd)).toBe(false);
      expect(parseMetadataSearchTag("score:25").matches(hd)).toBe(false);
    });

    test("negated equals", () => {
      expect(parseMetadataSearchTag("-width:1920").matches(hd)).toBe(false);
      expect(parseMetadataSearchTag("-width:1280").matches(hd)).toBe(true);
    });
  });

  describe("greater than operator (:>)", () => {
    test("matches when metric is greater", () => {
      expect(parseMetadataSearchTag("score:>25").matches(hd)).toBe(true);
      expect(parseMetadataSearchTag("width:>1280").matches(hd)).toBe(true);
      expect(parseMetadataSearchTag("id:>999").matches(hd)).toBe(true);
    });

    test("does not match when metric is equal or less", () => {
      expect(parseMetadataSearchTag("score:>50").matches(hd)).toBe(false);
      expect(parseMetadataSearchTag("score:>100").matches(hd)).toBe(false);
    });

    test("negated greater than", () => {
      expect(parseMetadataSearchTag("-score:>25").matches(hd)).toBe(false);
      expect(parseMetadataSearchTag("-score:>100").matches(hd)).toBe(true);
    });
  });

  describe("less than operator (:<)", () => {
    test("matches when metric is less", () => {
      expect(parseMetadataSearchTag("score:<100").matches(hd)).toBe(true);
      expect(parseMetadataSearchTag("width:<1920").matches(sd)).toBe(true);
      expect(parseMetadataSearchTag("id:<9999999").matches(hd)).toBe(true);
    });

    test("does not match when metric is equal or greater", () => {
      expect(parseMetadataSearchTag("score:<50").matches(hd)).toBe(false);
      expect(parseMetadataSearchTag("score:<25").matches(hd)).toBe(false);
    });

    test("negated less than", () => {
      expect(parseMetadataSearchTag("-score:<100").matches(hd)).toBe(false);
      expect(parseMetadataSearchTag("-score:<25").matches(hd)).toBe(true);
    });
  });

  describe("right hand metric comparison", () => {
    test("equals metric", () => {
      expect(parseMetadataSearchTag("width:height").matches(square)).toBe(true);
      expect(parseMetadataSearchTag("width:height").matches(hd)).toBe(false);
    });

    test("greater than metric", () => {
      expect(parseMetadataSearchTag("width:>height").matches(hd)).toBe(true);
      expect(parseMetadataSearchTag("width:>height").matches(square)).toBe(false);
    });

    test("less than metric", () => {
      expect(parseMetadataSearchTag("height:<width").matches(sd)).toBe(true);
      expect(parseMetadataSearchTag("duration:<score").matches(hd)).toBe(false);
    });

    test("negated metric comparison", () => {
      expect(parseMetadataSearchTag("-width:height").matches(square)).toBe(false);
      expect(parseMetadataSearchTag("-width:height").matches(hd)).toBe(true);
    });
  });

  describe("invalid expressions", () => {
    test("invalid metric defaults gracefully", () => {
      expect(() => parseMetadataSearchTag("invalid:100").matches(hd)).not.toThrow();
    });

    test("invalid operator defaults gracefully", () => {
      expect(() => parseMetadataSearchTag("width::100").matches(hd)).not.toThrow();
    });
  });

  describe("edge cases", () => {
    test("zero value", () => {
      expect(parseMetadataSearchTag("duration:0").matches(square)).toBe(true);
      expect(parseMetadataSearchTag("duration:0").matches(hd)).toBe(false);
    });

    test("large id value", () => {
      expect(parseMetadataSearchTag("id:9999999").matches(square)).toBe(true);
      expect(parseMetadataSearchTag("id:<9999999").matches(hd)).toBe(true);
    });
  });
});
