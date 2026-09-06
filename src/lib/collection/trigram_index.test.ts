import { describe, expect, test } from "vitest";
import { TrigramIndex } from "@/lib/collection/trigram_index";

const terms = ["banana", "bandana", "cabana", "canvas", "abandon", "and", "an", "sandbox", "brand", "nan_ana"];

function expectSameTerms(actual: string[], expected: string[]): void {
  expect(actual.slice().sort()).toEqual(expected.slice().sort());
}

describe("TrigramIndex", () => {
  const index = new TrigramIndex(terms);

  test("termsContaining finds every term with the substring", () => {
    expectSameTerms(index.termsContaining("ana", terms), ["banana", "bandana", "cabana", "nan_ana"]);
  });

  test("termsContaining narrows by trigram without false positives", () => {
    expectSameTerms(index.termsContaining("and", terms), ["bandana", "abandon", "and", "sandbox", "brand"]);
  });

  test("a trigram candidate that is not a real substring match is excluded", () => {
    expectSameTerms(index.termsContaining("nana", terms), ["banana"]);
  });

  test("termsContaining returns nothing when no term contains the substring", () => {
    expectSameTerms(index.termsContaining("xyz", terms), []);
  });

  test("termsEndingWith matches only the suffix", () => {
    expectSameTerms(index.termsEndingWith("ana", terms), ["banana", "bandana", "cabana", "nan_ana"]);
    expectSameTerms(index.termsEndingWith("and", terms), ["and", "brand"]);
  });

  test("substrings shorter than a trigram fall back to scanning the corpus", () => {
    expectSameTerms(index.termsContaining("an", terms), terms);
  });

  test("termsMatchingAll requires every fragment via the caller predicate", () => {
    const ordered = /ban.*ana/;

    expectSameTerms(index.termsMatchingAll(["ban", "ana"], terms, term => ordered.test(term)), ["banana", "bandana"]);
  });

  test("termsMatchingAll with a fragment absent from the index yields nothing", () => {
    expectSameTerms(index.termsMatchingAll(["ban", "zzz"], terms, () => true), []);
  });
});

describe("TrigramIndex mutation", () => {
  test("addTerm makes a new term findable", () => {
    const index = new TrigramIndex(terms);

    expectSameTerms(index.termsContaining("mango", terms), []);
    index.addTerm("mango");
    expectSameTerms(index.termsContaining("mango", [...terms, "mango"]), ["mango"]);
  });

  test("removeTerm drops a term from its trigram buckets", () => {
    const index = new TrigramIndex(terms);

    index.removeTerm("banana");
    expectSameTerms(index.termsContaining("ana", terms), ["bandana", "cabana", "nan_ana"]);
  });
});
