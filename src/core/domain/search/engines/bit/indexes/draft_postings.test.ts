import { describe, expect, test } from "vitest";
import { DraftPostings } from "@/core/domain/search/engines/bit/indexes/draft_postings";
import { DurablePostings } from "@/core/domain/search/engines/bit/indexes/durable_postings";

const POSITIONS: Record<string, number> = { apple: 0, banana: 1, cherry: 2 };

function setup(entries: [string, number[]][] = []): DraftPostings {
  const draft = new DraftPostings();

  for (const [term, positions] of entries) {
    positions.forEach(position => draft.add(term, position));
  }
  return draft;
}

function collectEntries(draft: DraftPostings): Record<string, number[]> {
  return Object.fromEntries(draft.entries());
}

function findPosition(doc: string): number | undefined {
  return POSITIONS[doc];
}

describe("DraftPostings", () => {
  describe("add", () => {
    test("returns true only for a term's first position", () => {
      const draft = setup();

      expect(draft.add("red", 2)).toBe(true);
      expect(draft.add("red", 0)).toBe(false);
    });

    test("keeps each term's positions sorted", () => {
      expect(collectEntries(setup([["red", [2, 0, 1]]]))).toEqual({ red: [0, 1, 2] });
    });
  });

  describe("reset", () => {
    test("forgets every term", () => {
      const draft = setup([["red", [0]]]);

      draft.reset();
      expect(collectEntries(draft)).toEqual({});
    });
  });

  describe("hydrateFrom", () => {
    test("replaces its terms with the durable postings'", () => {
      const durable = new DurablePostings();
      const draft = setup([["green", [4]]]);

      durable.materializeFrom([["red", [0, 1]]], 64);
      draft.hydrateFrom(durable);
      expect(collectEntries(draft)).toEqual({ red: [0, 1] });
    });
  });

  describe("applyUpdates", () => {
    test("moves a doc from its old terms to its new ones", () => {
      const draft = setup([["red", [0, 1]], ["green", [2]]]);

      draft.applyUpdates([{ doc: "apple", oldTerms: new Set(["red"]), newTerms: new Set(["green"]) }], findPosition);
      expect(collectEntries(draft)).toEqual({ red: [1], green: [0, 2] });
    });

    test("reports terms that gained their first doc or lost their last", () => {
      const draft = setup([["red", [0]], ["green", [2]]]);
      const delta = draft.applyUpdates([{ doc: "apple", oldTerms: new Set(["red"]), newTerms: new Set(["yellow"]) }], findPosition);

      expect(delta).toEqual({ added: ["yellow"], removed: ["red"] });
    });

    test("reports nothing for terms that only change their docs", () => {
      const draft = setup([["red", [0, 1]], ["green", [2]]]);
      const delta = draft.applyUpdates([{ doc: "apple", oldTerms: new Set(["red"]), newTerms: new Set(["green"]) }], findPosition);

      expect(delta).toEqual({ added: [], removed: [] });
    });

    test("ignores a doc without a position", () => {
      const draft = setup([["red", [0]]]);
      const delta = draft.applyUpdates([{ doc: "durian", oldTerms: new Set(["red"]), newTerms: new Set(["green"]) }], findPosition);

      expect(delta).toEqual({ added: [], removed: [] });
      expect(collectEntries(draft)).toEqual({ red: [0] });
    });

    test("ignores removing a term it never held", () => {
      const draft = setup([["red", [0]]]);

      draft.applyUpdates([{ doc: "apple", oldTerms: new Set(["purple"]), newTerms: new Set() }], findPosition);
      expect(collectEntries(draft)).toEqual({ red: [0] });
    });
  });
});
