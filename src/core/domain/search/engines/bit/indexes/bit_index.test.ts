import { describe, expect, test } from "vitest";
import { BitIndex } from "@/core/domain/search/engines/bit/indexes/bit_index";
import { StringInterner } from "@/core/utils/string/string_interner";

interface Doc {
  id: string;
  tags: string[];
}

function createDoc(id: string, ...tags: string[]): Doc {
  return { id, tags };
}

function createIndex(docs: readonly Doc[]): BitIndex<Doc> {
  const bitIndex = new BitIndex<Doc>({ getTerms: doc => doc.tags, stringInterner: new StringInterner() });

  bitIndex.build(docs);
  return bitIndex;
}

function resolveTermDocs(bitIndex: BitIndex<Doc>, term: string): readonly Doc[] {
  const posting = bitIndex.findPosting(term);
  return posting === undefined ? [] : bitIndex.docsFrom(posting.toBitSet(bitIndex.size));
}

function countTermDocs(bitIndex: BitIndex<Doc>, term: string): number {
  return bitIndex.findPosting(term)?.cardinality ?? 0;
}

const appleDoc = createDoc("apple", "red", "fruit", "sweet");
const cherryDoc = createDoc("cherry", "red", "fruit");
const lemonDoc = createDoc("lemon", "yellow", "fruit", "sour");
const docs = [appleDoc, cherryDoc, lemonDoc];

describe("BitIndex", () => {
  test("reports the corpus size", () => {
    expect(createIndex(docs).size).toBe(3);
  });

  test("lists every indexed term", () => {
    expect(createIndex(docs).indexedTerms().sort()).toEqual(["fruit", "red", "sour", "sweet", "yellow"]);
  });

  test("resolves a term to the docs carrying it", () => {
    expect(resolveTermDocs(createIndex(docs), "red")).toEqual([appleDoc, cherryDoc]);
  });

  test("resolves a term shared by all docs", () => {
    expect(resolveTermDocs(createIndex(docs), "fruit")).toEqual([appleDoc, cherryDoc, lemonDoc]);
  });

  test("returns undefined for an unknown term", () => {
    expect(createIndex(docs).findPosting("purple")).toBeUndefined();
  });

  test("preserves corpus order when materializing", () => {
    expect(resolveTermDocs(createIndex(docs), "fruit").map(doc => doc.id)).toEqual(["apple", "cherry", "lemon"]);
  });

  test("reports each term's doc count", () => {
    const bitIndex = createIndex(docs);

    expect(countTermDocs(bitIndex, "fruit")).toBe(3);
    expect(countTermDocs(bitIndex, "red")).toBe(2);
    expect(countTermDocs(bitIndex, "sweet")).toBe(1);
  });

  test("matches the whole corpus with everything()", () => {
    const bitIndex = createIndex(docs);

    expect(bitIndex.docsFrom(bitIndex.universe())).toEqual(docs);
  });

  test("matches nothing with emptyBitSet()", () => {
    const bitIndex = createIndex(docs);

    expect(bitIndex.docsFrom(bitIndex.empty())).toEqual([]);
  });

  test("handles a corpus larger than one word (word-boundary positions)", () => {
    const manyDocs = Array.from({ length: 100 }, (_, i) => createDoc(`d${i}`, i % 2 === 0 ? "even" : "odd", "all"));
    const bitIndex = createIndex(manyDocs);

    expect(bitIndex.size).toBe(100);
    expect(resolveTermDocs(bitIndex, "even").length).toBe(50);
    expect(resolveTermDocs(bitIndex, "all").length).toBe(100);
  });

  test("rebuilds cleanly, discarding the previous corpus", () => {
    const bitIndex = new BitIndex<Doc>({ getTerms: doc => doc.tags, stringInterner: new StringInterner() });

    bitIndex.build([appleDoc]);
    bitIndex.build([lemonDoc]);
    expect(bitIndex.size).toBe(1);
    expect(bitIndex.indexedTerms().sort()).toEqual(["fruit", "sour", "yellow"]);
    expect(bitIndex.findPosting("red")).toBeUndefined();
  });

  test("handles an empty corpus", () => {
    const bitIndex = createIndex([]);

    expect(bitIndex.size).toBe(0);
    expect(bitIndex.indexedTerms()).toEqual([]);
    expect(bitIndex.docsFrom(bitIndex.universe())).toEqual([]);
  });

  test("resolves a frequent (dense) term and a rare (sparse) term identically", () => {
    const wideDocs = Array.from({ length: 1_000 }, (_, i) => createDoc(`d${i}`, "common", i === 500 ? "unique" : "other"));
    const bitIndex = createIndex(wideDocs);

    expect(countTermDocs(bitIndex, "common")).toBe(1_000);
    expect(countTermDocs(bitIndex, "unique")).toBe(1);
    expect(resolveTermDocs(bitIndex, "unique").map(doc => doc.id)).toEqual(["d500"]);
    expect(resolveTermDocs(bitIndex, "common").length).toBe(1_000);
  });

  test("resolves a singleton term to its single doc", () => {
    expect(resolveTermDocs(createIndex(docs), "sweet")).toEqual([appleDoc]);
  });

  describe("unionOf", () => {
    function getPostings(bitIndex: BitIndex<Doc>, ...terms: string[]): NonNullable<ReturnType<BitIndex<Doc>["findPosting"]>>[] {
      return terms.map(term => bitIndex.findPosting(term)).filter(posting => posting !== undefined);
    }

    test("unions the docs of several postings", () => {
      const bitIndex = createIndex(docs);

      expect(bitIndex.docsFrom(bitIndex.unionOf(getPostings(bitIndex, "sweet", "sour")))).toEqual([appleDoc, lemonDoc]);
    });

    test("returns nothing for no postings", () => {
      const bitIndex = createIndex(docs);

      expect(bitIndex.docsFrom(bitIndex.unionOf([]))).toEqual([]);
    });
  });
});
