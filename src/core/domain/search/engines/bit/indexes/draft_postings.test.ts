import { describe, expect, test } from "vitest";
import { DraftPostings } from "@/core/domain/search/engines/bit/indexes/draft_postings";
import { DurablePostings } from "@/core/domain/search/engines/bit/indexes/durable_postings";

const POSITIONS: Record<string, number> = { apple: 0, banana: 1, cherry: 2 };

function setup(entries: [string, number[]][] = []): DraftPostings {
  const draftPostings = new DraftPostings();

  for (const [term, positions] of entries) {
    positions.forEach(position => draftPostings.add(term, position));
  }
  return draftPostings;
}

function collectEntries(draftPostings: DraftPostings): Record<string, number[]> {
  return Object.fromEntries(draftPostings.entries());
}

function findPosition(doc: string): number | undefined {
  return POSITIONS[doc];
}

describe("DraftPostings", () => {
  describe("add", () => {
    test("returns true only for a term's first position", () => {
      const draftPostings = setup();

      expect(draftPostings.add("red", 2)).toBe(true);
      expect(draftPostings.add("red", 0)).toBe(false);
    });

    test("keeps each term's positions sorted", () => {
      expect(collectEntries(setup([["red", [2, 0, 1]]]))).toEqual({ red: [0, 1, 2] });
    });
  });

  describe("reset", () => {
    test("forgets every term", () => {
      const draftPostings = setup([["red", [0]]]);

      draftPostings.reset();
      expect(collectEntries(draftPostings)).toEqual({});
    });
  });

  describe("hydrateFrom", () => {
    test("replaces its terms with the durable postings'", () => {
      const durablePostings = new DurablePostings();
      const draftPostings = setup([["green", [4]]]);

      durablePostings.materializeFrom([["red", [0, 1]]], 64);
      draftPostings.hydrateFrom(durablePostings);
      expect(collectEntries(draftPostings)).toEqual({ red: [0, 1] });
    });
  });

  describe("applyUpdates", () => {
    test("moves a doc from its old terms to its new ones", () => {
      const draftPostings = setup([["red", [0, 1]], ["green", [2]]]);

      draftPostings.applyUpdates([{ doc: "apple", oldTerms: new Set(["red"]), newTerms: new Set(["green"]) }], findPosition);
      expect(collectEntries(draftPostings)).toEqual({ red: [1], green: [0, 2] });
    });

    test("reports terms that gained their first doc or lost their last", () => {
      const draftPostings = setup([["red", [0]], ["green", [2]]]);
      const termDelta = draftPostings.applyUpdates([{ doc: "apple", oldTerms: new Set(["red"]), newTerms: new Set(["yellow"]) }], findPosition);

      expect(termDelta).toEqual({ added: ["yellow"], removed: ["red"] });
    });

    test("reports nothing for terms that only change their docs", () => {
      const draftPostings = setup([["red", [0, 1]], ["green", [2]]]);
      const termDelta = draftPostings.applyUpdates([{ doc: "apple", oldTerms: new Set(["red"]), newTerms: new Set(["green"]) }], findPosition);

      expect(termDelta).toEqual({ added: [], removed: [] });
    });

    test("ignores a doc without a position", () => {
      const draftPostings = setup([["red", [0]]]);
      const termDelta = draftPostings.applyUpdates([{ doc: "durian", oldTerms: new Set(["red"]), newTerms: new Set(["green"]) }], findPosition);

      expect(termDelta).toEqual({ added: [], removed: [] });
      expect(collectEntries(draftPostings)).toEqual({ red: [0] });
    });

    test("ignores removing a term it never held", () => {
      const draftPostings = setup([["red", [0]]]);

      draftPostings.applyUpdates([{ doc: "apple", oldTerms: new Set(["purple"]), newTerms: new Set() }], findPosition);
      expect(collectEntries(draftPostings)).toEqual({ red: [0] });
    });
  });
});
