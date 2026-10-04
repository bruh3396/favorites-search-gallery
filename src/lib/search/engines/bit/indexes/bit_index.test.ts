import { describe, expect, test } from "vitest";
import { BitIndex } from "@/lib/search/engines/bit/indexes/bit_index";

interface Doc {
  id: string;
  tags: string[];
}

function createDoc(id: string, ...tags: string[]): Doc {
  return { id, tags };
}

function createIndex(docs: Doc[]): BitIndex<Doc> {
  const bitIndex = new BitIndex<Doc>(d => d.tags);

  bitIndex.build(docs);
  return bitIndex;
}

function resolveTermDocs(bitIndex: BitIndex<Doc>, term: string): Doc[] {
  const posting = bitIndex.postingFor(term);
  return posting === undefined ? [] : bitIndex.docsFrom(posting.toBitSet(bitIndex.size));
}

function countTermDocs(bitIndex: BitIndex<Doc>, term: string): number {
  return bitIndex.postingFor(term)?.cardinality ?? 0;
}

const apple = createDoc("apple", "red", "fruit", "sweet");
const cherry = createDoc("cherry", "red", "fruit");
const lemon = createDoc("lemon", "yellow", "fruit", "sour");
const corpus = [apple, cherry, lemon];

describe("BitIndex", () => {
  test("reports the corpus size", () => {
    expect(createIndex(corpus).size).toBe(3);
  });

  test("lists every indexed term", () => {
    expect(createIndex(corpus).indexedTerms().sort()).toEqual(["fruit", "red", "sour", "sweet", "yellow"]);
  });

  test("resolves a term to the docs carrying it", () => {
    expect(resolveTermDocs(createIndex(corpus), "red")).toEqual([apple, cherry]);
  });

  test("resolves a term shared by all docs", () => {
    expect(resolveTermDocs(createIndex(corpus), "fruit")).toEqual([apple, cherry, lemon]);
  });

  test("returns undefined for an unknown term", () => {
    expect(createIndex(corpus).postingFor("purple")).toBeUndefined();
  });

  test("preserves corpus order when materializing", () => {
    expect(resolveTermDocs(createIndex(corpus), "fruit").map(d => d.id)).toEqual(["apple", "cherry", "lemon"]);
  });

  test("reports each term's doc count", () => {
    const bitIndex = createIndex(corpus);

    expect(countTermDocs(bitIndex, "fruit")).toBe(3);
    expect(countTermDocs(bitIndex, "red")).toBe(2);
    expect(countTermDocs(bitIndex, "sweet")).toBe(1);
  });

  test("matches the whole corpus with everything()", () => {
    const bitIndex = createIndex(corpus);

    expect(bitIndex.docsFrom(bitIndex.universe())).toEqual(corpus);
  });

  test("matches nothing with emptyBitSet()", () => {
    const bitIndex = createIndex(corpus);

    expect(bitIndex.docsFrom(bitIndex.empty())).toEqual([]);
  });

  test("handles a corpus larger than one word (word-boundary positions)", () => {
    const many = Array.from({ length: 100 }, (_, i) => createDoc(`d${i}`, i % 2 === 0 ? "even" : "odd", "all"));
    const bitIndex = createIndex(many);

    expect(bitIndex.size).toBe(100);
    expect(resolveTermDocs(bitIndex, "even").length).toBe(50);
    expect(resolveTermDocs(bitIndex, "all").length).toBe(100);
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
    const bitIndex = createIndex([]);

    expect(bitIndex.size).toBe(0);
    expect(bitIndex.indexedTerms()).toEqual([]);
    expect(bitIndex.docsFrom(bitIndex.universe())).toEqual([]);
  });

  test("resolves a frequent (dense) term and a rare (sparse) term identically", () => {
    const wide = Array.from({ length: 1_000 }, (_, i) => createDoc(`d${i}`, "common", i === 500 ? "unique" : "other"));
    const bitIndex = createIndex(wide);

    expect(countTermDocs(bitIndex, "common")).toBe(1_000);
    expect(countTermDocs(bitIndex, "unique")).toBe(1);
    expect(resolveTermDocs(bitIndex, "unique").map(d => d.id)).toEqual(["d500"]);
    expect(resolveTermDocs(bitIndex, "common").length).toBe(1_000);
  });

  test("resolves a singleton term to its single doc", () => {
    expect(resolveTermDocs(createIndex(corpus), "sweet")).toEqual([apple]);
  });

  describe("unionOf", () => {
    function getPostings(bitIndex: BitIndex<Doc>, ...terms: string[]): NonNullable<ReturnType<BitIndex<Doc>["postingFor"]>>[] {
      return terms.map(term => bitIndex.postingFor(term)).filter(posting => posting !== undefined);
    }

    test("unions the docs of several postings", () => {
      const bitIndex = createIndex(corpus);

      expect(bitIndex.docsFrom(bitIndex.unionOf(getPostings(bitIndex, "sweet", "sour")))).toEqual([apple, lemon]);
    });

    test("returns nothing for no postings", () => {
      const bitIndex = createIndex(corpus);

      expect(bitIndex.docsFrom(bitIndex.unionOf([]))).toEqual([]);
    });
  });
});
