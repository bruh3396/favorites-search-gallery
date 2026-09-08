import { describe, expect, test } from "vitest";
import { TrigramIndex } from "@/lib/search/indexes/trigram_index";

const terms = ["banana", "bandana", "cabana", "canvas", "abandon", "and", "an", "sandbox", "brand", "nan_ana"];

function expectSameTerms(actual: string[], expected: string[]): void {
  expect(actual.slice().sort()).toEqual(expected.slice().sort());
}

describe("TrigramIndex", () => {
  const index = new TrigramIndex(terms);

  test("termsMatching returns every term that contains the fragment", () => {
    const candidates = index.matching("ana", terms);

    for (const term of ["banana", "bandana", "cabana", "nan_ana"]) {
      expect(candidates).toContain(term);
    }
  });

  test("termsMatching never drops a real substring match", () => {
    const candidates = index.matching("and", terms);

    for (const term of ["bandana", "abandon", "and", "sandbox", "brand"]) {
      expect(candidates).toContain(term);
    }
  });

  test("termsMatching may return trigram candidates that are not true matches", () => {
    expect(index.matching("nana", terms)).toContain("banana");
  });

  test("a fragment whose trigram is absent returns nothing", () => {
    expectSameTerms(index.matching("xyz", terms), []);
  });

  test("fragments shorter than a trigram fall back to the corpus", () => {
    expectSameTerms(index.matching("an", terms), terms);
  });

  test("termsMatchingAll intersects the candidates of every fragment", () => {
    for (const term of ["banana", "bandana"]) {
      expect(index.matchingAll(["ban", "ana"], terms)).toContain(term);
    }
  });

  test("termsMatchingAll with a fragment absent from the index yields nothing", () => {
    expectSameTerms(index.matchingAll(["ban", "zzz"], terms), []);
  });

  test("termsMatchingAll falls back to the corpus when no fragment is a full trigram", () => {
    expectSameTerms(index.matchingAll(["an", "na"], terms), terms);
  });
});

describe("TrigramIndex mutation", () => {
  test("addTerm makes a new term findable", () => {
    const index = new TrigramIndex(terms);

    expectSameTerms(index.matching("mango", terms), []);
    index.add("mango");
    expect(index.matching("mango", [...terms, "mango"])).toContain("mango");
  });

  test("removeTerm drops a term from its trigram buckets", () => {
    const index = new TrigramIndex(terms);

    index.remove("banana");
    expect(index.matching("ana", terms)).not.toContain("banana");
  });
});
