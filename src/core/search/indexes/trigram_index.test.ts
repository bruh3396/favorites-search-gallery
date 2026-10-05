import { describe, expect, test } from "vitest";
import { SortedArray } from "@/core/utils/collection/sorted_array";
import { TrigramIndex } from "@/core/search/indexes/trigram_index";
import { compareStrings } from "@/core/utils/string/string";

const terms = ["banana", "bandana", "cabana", "canvas", "abandon", "and", "an", "sandbox", "brand", "nan_ana"];
const sortedTerms = new SortedArray<string>((a, b) => compareStrings(a, b), terms);

function expectSameTerms(actual: string[], expected: string[]): void {
  expect([...actual].sort()).toEqual([...expected].sort());
}

function createIndex(): TrigramIndex {
  return new TrigramIndex(sortedTerms);
}

describe("TrigramIndex", () => {
  describe("termsMatching", () => {
    test("returns every term that contains the fragment", () => {
      const candidates = createIndex().termsMatching("ana");

      for (const term of ["banana", "bandana", "cabana", "nan_ana"]) {
        expect(candidates).toContain(term);
      }
    });

    test("never drops a real substring match", () => {
      const candidates = createIndex().termsMatching("and");

      for (const term of ["bandana", "abandon", "and", "sandbox", "brand"]) {
        expect(candidates).toContain(term);
      }
    });

    test("may return trigram candidates that are not true matches", () => {
      expect(createIndex().termsMatching("nana")).toContain("banana");
    });

    test("returns nothing for a fragment whose trigram is absent", () => {
      expectSameTerms(createIndex().termsMatching("xyz"), []);
    });

    test("falls back to the corpus for a fragment shorter than a trigram", () => {
      expectSameTerms(createIndex().termsMatching("an"), terms);
    });

    test("returns nothing for a fragment whose trigrams exist but never co-occur", () => {
      expectSameTerms(new TrigramIndex(sortedTerms).termsMatching("banvas"), []);
    });
  });

  describe("termsMatchingAll", () => {
    test("intersects the candidates of every fragment", () => {
      for (const term of ["banana", "bandana"]) {
        expect(createIndex().termsMatchingAll(["ban", "ana"])).toContain(term);
      }
    });

    test("returns nothing when a fragment is absent from the index", () => {
      expectSameTerms(createIndex().termsMatchingAll(["ban", "zzz"]), []);
    });

    test("falls back to the corpus when no fragment is a full trigram", () => {
      expectSameTerms(createIndex().termsMatchingAll(["an", "na"]), terms);
    });
  });

  describe("add", () => {
    test("makes a new term findable", () => {
      const index = new TrigramIndex(sortedTerms);

      expectSameTerms(index.termsMatching("mango"), []);
      index.add("mango");
      expect(index.termsMatching("mango")).toContain("mango");
    });
  });

  describe("remove", () => {
    test("drops a term from its trigram buckets", () => {
      const index = new TrigramIndex(sortedTerms);

      index.remove("banana");
      expect(index.termsMatching("ana")).not.toContain("banana");
    });

    test("leaves a trigram unmatched once its last term is removed", () => {
      const index = new TrigramIndex(new SortedArray<string>((a, b) => compareStrings(a, b), ["kiwi"]));

      index.remove("kiwi");
      expectSameTerms(index.termsMatching("kiwi"), []);
    });

    test("changes nothing for an unindexed term", () => {
      const index = new TrigramIndex(sortedTerms);

      index.remove("zzzz");
      index.remove("bananas");
      expect(index.termsMatching("ana")).toContain("banana");
    });
  });
});
