import { describe, expect, test } from "vitest";
import { BitIndex } from "@/lib/search/engines/bit/indexes/bit_index";

interface Doc {
  id: string;
  tags: string[];
}

function doc(id: string, ...tags: string[]): Doc {
  return { id, tags };
}

function index(docs: Doc[]): BitIndex<Doc> {
  const bitIndex = new BitIndex<Doc>(d => d.tags);

  bitIndex.build(docs);
  return bitIndex;
}

function docsForTerm(bitIndex: BitIndex<Doc>, term: string): Doc[] {
  const posting = bitIndex.postingFor(term);
  return posting === undefined ? [] : bitIndex.docsFrom(posting.toBitSet(bitIndex.size));
}

function countForTerm(bitIndex: BitIndex<Doc>, term: string): number {
  return bitIndex.postingFor(term)?.cardinality ?? 0;
}

const apple = doc("apple", "red", "fruit", "sweet");
const cherry = doc("cherry", "red", "fruit");
const lemon = doc("lemon", "yellow", "fruit", "sour");
const corpus = [apple, cherry, lemon];

describe("BitIndex", () => {
  test("reports the corpus size", () => {
    expect(index(corpus).size).toBe(3);
  });

  test("lists every indexed term", () => {
    expect(index(corpus).indexedTerms().sort()).toEqual(["fruit", "red", "sour", "sweet", "yellow"]);
  });

  test("resolves a term to the docs carrying it", () => {
    expect(docsForTerm(index(corpus), "red")).toEqual([apple, cherry]);
  });

  test("resolves a term shared by all docs", () => {
    expect(docsForTerm(index(corpus), "fruit")).toEqual([apple, cherry, lemon]);
  });

  test("returns undefined for an unknown term", () => {
    expect(index(corpus).postingFor("purple")).toBeUndefined();
  });

  test("preserves corpus order when materializing", () => {
    expect(docsForTerm(index(corpus), "fruit").map(d => d.id)).toEqual(["apple", "cherry", "lemon"]);
  });

  test("reports each term's doc count", () => {
    const bitIndex = index(corpus);

    expect(countForTerm(bitIndex, "fruit")).toBe(3);
    expect(countForTerm(bitIndex, "red")).toBe(2);
    expect(countForTerm(bitIndex, "sweet")).toBe(1);
  });

  test("everything() matches the whole corpus", () => {
    const bitIndex = index(corpus);

    expect(bitIndex.docsFrom(bitIndex.universe())).toEqual(corpus);
  });

  test("emptyBitSet() matches nothing", () => {
    const bitIndex = index(corpus);

    expect(bitIndex.docsFrom(bitIndex.emptyBitSet())).toEqual([]);
  });

  test("handles a corpus larger than one word (word-boundary positions)", () => {
    const many = Array.from({ length: 100 }, (_, i) => doc(`d${i}`, i % 2 === 0 ? "even" : "odd", "all"));
    const bitIndex = index(many);

    expect(bitIndex.size).toBe(100);
    expect(docsForTerm(bitIndex, "even").length).toBe(50);
    expect(docsForTerm(bitIndex, "all").length).toBe(100);
  });

  test("rebuilds cleanly, discarding the previous corpus", () => {
    const bitIndex = new BitIndex<Doc>(d => d.tags);

    bitIndex.build([apple]);
    bitIndex.build([lemon]);
    expect(bitIndex.size).toBe(1);
    expect(bitIndex.indexedTerms().sort()).toEqual(["fruit", "sour", "yellow"]);
    expect(bitIndex.postingFor("red")).toBeUndefined();
  });

  test("handles an empty corpus", () => {
    const bitIndex = index([]);

    expect(bitIndex.size).toBe(0);
    expect(bitIndex.indexedTerms()).toEqual([]);
    expect(bitIndex.docsFrom(bitIndex.universe())).toEqual([]);
  });

  describe("dense vs sparse postings", () => {
    test("resolves a frequent (dense) term and a rare (sparse) term identically", () => {
      const wide = Array.from({ length: 1000 }, (_, i) => doc(`d${i}`, "common", i === 500 ? "unique" : "other"));
      const bitIndex = index(wide);

      expect(countForTerm(bitIndex, "common")).toBe(1000);
      expect(countForTerm(bitIndex, "unique")).toBe(1);
      expect(docsForTerm(bitIndex, "unique").map(d => d.id)).toEqual(["d500"]);
      expect(docsForTerm(bitIndex, "common").length).toBe(1000);
    });

    test("a singleton term resolves to its single doc", () => {
      expect(docsForTerm(index(corpus), "sweet")).toEqual([apple]);
    });
  });

  describe("unionOfPostings", () => {
    function postingsFor(bitIndex: BitIndex<Doc>, ...terms: string[]): NonNullable<ReturnType<BitIndex<Doc>["postingFor"]>>[] {
      return terms.map(term => bitIndex.postingFor(term)).filter(posting => posting !== undefined);
    }

    test("unions the docs of several postings", () => {
      const bitIndex = index(corpus);

      expect(bitIndex.docsFrom(bitIndex.unionOfPostings(postingsFor(bitIndex, "sweet", "sour")))).toEqual([apple, lemon]);
    });

    test("is empty for no postings", () => {
      const bitIndex = index(corpus);

      expect(bitIndex.docsFrom(bitIndex.unionOfPostings([]))).toEqual([]);
    });
  });
});
