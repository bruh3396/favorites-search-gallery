import { describe, expect, test } from "vitest";
import { TrigramIndex } from "@/lib/collection/trigram_index";

const terms = ["banana", "bandana", "cabana", "canvas", "abandon", "and", "an", "sandbox", "brand", "nan_ana"];

function expectSameTerms(actual: string[], expected: string[]): void {
  expect(actual.slice().sort()).toEqual(expected.slice().sort());
}

describe("TrigramIndex", () => {
  const index = new TrigramIndex(terms);

  test("termsMatching returns every term that contains the fragment", () => {
    const candidates = index.termsMatching("ana", terms);

    for (const term of ["banana", "bandana", "cabana", "nan_ana"]) {
      expect(candidates).toContain(term);
    }
  });

  test("termsMatching never drops a real substring match", () => {
    const candidates = index.termsMatching("and", terms);

    for (const term of ["bandana", "abandon", "and", "sandbox", "brand"]) {
      expect(candidates).toContain(term);
    }
  });

  test("termsMatching may return trigram candidates that are not true matches", () => {
    expect(index.termsMatching("nana", terms)).toContain("banana");
  });

  test("a fragment whose trigram is absent returns nothing", () => {
    expectSameTerms(index.termsMatching("xyz", terms), []);
  });

  test("fragments shorter than a trigram fall back to the corpus", () => {
    expectSameTerms(index.termsMatching("an", terms), terms);
  });

  test("termsMatchingAll intersects the candidates of every fragment", () => {
    for (const term of ["banana", "bandana"]) {
      expect(index.termsMatchingAll(["ban", "ana"], terms)).toContain(term);
    }
  });

  test("termsMatchingAll with a fragment absent from the index yields nothing", () => {
    expectSameTerms(index.termsMatchingAll(["ban", "zzz"], terms), []);
  });

  test("termsMatchingAll falls back to the corpus when no fragment is a full trigram", () => {
    expectSameTerms(index.termsMatchingAll(["an", "na"], terms), terms);
  });
});

describe("TrigramIndex mutation", () => {
  test("addTerm makes a new term findable", () => {
    const index = new TrigramIndex(terms);

    expectSameTerms(index.termsMatching("mango", terms), []);
    index.addTerm("mango");
    expect(index.termsMatching("mango", [...terms, "mango"])).toContain("mango");
  });

  test("removeTerm drops a term from its trigram buckets", () => {
    const index = new TrigramIndex(terms);

    index.removeTerm("banana");
    expect(index.termsMatching("ana", terms)).not.toContain("banana");
  });
});
