import { describe, expect, test } from "vitest";
import { SortedArray } from "@/lib/collection/sorted_array";
import { TrigramIndex } from "@/lib/search/indexes/trigram_index";
import { compareStrings } from "@/utils/pure/string";

const terms = ["banana", "bandana", "cabana", "canvas", "abandon", "and", "an", "sandbox", "brand", "nan_ana"];
const sortedTerms = new SortedArray<string>((a, b) => compareStrings(a, b), terms);

function expectSameTerms(actual: string[], expected: string[]): void {
  expect(actual.slice().sort()).toEqual(expected.slice().sort());
}

describe("TrigramIndex", () => {
  const index = new TrigramIndex(sortedTerms);

  test("termsMatching returns every term that contains the fragment", () => {
    const candidates = index.termsMatching("ana");

    for (const term of ["banana", "bandana", "cabana", "nan_ana"]) {
      expect(candidates).toContain(term);
    }
  });

  test("termsMatching never drops a real substring match", () => {
    const candidates = index.termsMatching("and");

    for (const term of ["bandana", "abandon", "and", "sandbox", "brand"]) {
      expect(candidates).toContain(term);
    }
  });

  test("termsMatching may return trigram candidates that are not true matches", () => {
    expect(index.termsMatching("nana")).toContain("banana");
  });

  test("a fragment whose trigram is absent returns nothing", () => {
    expectSameTerms(index.termsMatching("xyz"), []);
  });

  test("fragments shorter than a trigram fall back to the corpus", () => {
    expectSameTerms(index.termsMatching("an"), terms);
  });

  test("termsMatchingAll intersects the candidates of every fragment", () => {
    for (const term of ["banana", "bandana"]) {
      expect(index.termsMatchingAll(["ban", "ana"])).toContain(term);
    }
  });

  test("termsMatchingAll with a fragment absent from the index yields nothing", () => {
    expectSameTerms(index.termsMatchingAll(["ban", "zzz"]), []);
  });

  test("termsMatchingAll falls back to the corpus when no fragment is a full trigram", () => {
    expectSameTerms(index.termsMatchingAll(["an", "na"]), terms);
  });
});

describe("TrigramIndex mutation", () => {
  test("addTerm makes a new term findable", () => {
    const index = new TrigramIndex(sortedTerms);

    expectSameTerms(index.termsMatching("mango"), []);
    index.add("mango");
    expect(index.termsMatching("mango")).toContain("mango");
  });

  test("removeTerm drops a term from its trigram buckets", () => {
    const index = new TrigramIndex(sortedTerms);

    index.remove("banana");
    expect(index.termsMatching("ana")).not.toContain("banana");
  });
});
