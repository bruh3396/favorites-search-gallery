import { DensePosting, SparsePosting } from "@/core/domain/search/engines/bit/posting/posting";
import { describe, expect, test } from "vitest";
import { DurablePostings } from "@/core/domain/search/engines/bit/indexes/durable_postings";

const CAPACITY = 64;

function setup(entries: [string, number[]][]): DurablePostings {
  const postings = new DurablePostings();

  postings.materializeFrom(entries, CAPACITY);
  return postings;
}

function collectPostings(postings: DurablePostings): Record<string, number[]> {
  const collected: Record<string, number[]> = {};

  postings.forEachPosting((term, positions) => {
    collected[term] = positions;
  });
  return collected;
}

describe("DurablePostings", () => {
  describe("materializeFrom", () => {
    test("stores a term in more than 1 of 32 positions densely", () => {
      expect(setup([["fruit", [0, 1, 2]]]).findPosting("fruit")).toBeInstanceOf(DensePosting);
    });

    test("stores a rarer term sparsely", () => {
      expect(setup([["sweet", [0, 1]]]).findPosting("sweet")).toBeInstanceOf(SparsePosting);
    });

    test("replaces what was stored before", () => {
      const postings = setup([["fruit", [0, 1, 2]], ["sweet", [0]]]);

      postings.materializeFrom([["sour", [3]]], CAPACITY);
      expect(postings.terms()).toEqual(["sour"]);
    });
  });

  describe("findPosting", () => {
    test("returns a posting with the term's positions", () => {
      const postings = setup([["fruit", [0, 1, 2]], ["sweet", [5]]]);

      expect(postings.findPosting("fruit")?.toBitSet(CAPACITY).positions()).toEqual([0, 1, 2]);
      expect(postings.findPosting("sweet")?.toBitSet(CAPACITY).positions()).toEqual([5]);
    });

    test("returns undefined for an unknown term", () => {
      expect(setup([["sweet", [5]]]).findPosting("sour")).toBeUndefined();
    });
  });

  describe("terms", () => {
    test("lists dense and sparse terms", () => {
      expect(setup([["fruit", [0, 1, 2]], ["sweet", [5]]]).terms().sort()).toEqual(["fruit", "sweet"]);
    });
  });

  describe("forEachPosting", () => {
    test("visits every term with its positions", () => {
      expect(collectPostings(setup([["fruit", [0, 1, 2]], ["sweet", [5]]]))).toEqual({ fruit: [0, 1, 2], sweet: [5] });
    });

    test("hands out positions the visitor may change", () => {
      const postings = setup([["sweet", [5]]]);

      postings.forEachPosting((_, positions) => positions.push(9));
      expect(collectPostings(postings)).toEqual({ sweet: [5] });
    });
  });
});
