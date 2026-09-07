import { describe, expect, it } from "vitest";
import { BitmapIndex } from "@/lib/search/bitmap/bitmap_index";

interface Doc {
  id: string;
  tags: string[];
}

function doc(id: string, ...tags: string[]): Doc {
  return { id, tags };
}

function index(docs: Doc[]): BitmapIndex<Doc> {
  const bitmapIndex = new BitmapIndex<Doc>(d => d.tags);

  bitmapIndex.build(docs);
  return bitmapIndex;
}

// Materialize a term's posting into docs, exercising the real seed + docsFrom path.
function docsForTerm(bitmapIndex: BitmapIndex<Doc>, term: string): Doc[] {
  const posting = bitmapIndex.postingForTerm(term);

  return posting === undefined ? [] : bitmapIndex.docsFrom(posting.seed(bitmapIndex.size));
}

function countForTerm(bitmapIndex: BitmapIndex<Doc>, term: string): number {
  return bitmapIndex.postingForTerm(term)?.count ?? 0;
}

const apple = doc("apple", "red", "fruit", "sweet");
const cherry = doc("cherry", "red", "fruit");
const lemon = doc("lemon", "yellow", "fruit", "sour");
const corpus = [apple, cherry, lemon];

describe("BitmapIndex", () => {
  it("reports the corpus size", () => {
    expect(index(corpus).size).toBe(3);
  });

  it("lists every indexed term", () => {
    expect(index(corpus).indexedTerms().sort()).toEqual(["fruit", "red", "sour", "sweet", "yellow"]);
  });

  it("resolves a term to the docs carrying it", () => {
    expect(docsForTerm(index(corpus), "red")).toEqual([apple, cherry]);
  });

  it("resolves a term shared by all docs", () => {
    expect(docsForTerm(index(corpus), "fruit")).toEqual([apple, cherry, lemon]);
  });

  it("returns undefined for an unknown term", () => {
    expect(index(corpus).postingForTerm("purple")).toBeUndefined();
  });

  it("preserves corpus order when materializing", () => {
    expect(docsForTerm(index(corpus), "fruit").map(d => d.id)).toEqual(["apple", "cherry", "lemon"]);
  });

  it("reports each term's doc count", () => {
    const bitmapIndex = index(corpus);

    expect(countForTerm(bitmapIndex, "fruit")).toBe(3);
    expect(countForTerm(bitmapIndex, "red")).toBe(2);
    expect(countForTerm(bitmapIndex, "sweet")).toBe(1);
  });

  it("everything() matches the whole corpus", () => {
    const bitmapIndex = index(corpus);

    expect(bitmapIndex.docsFrom(bitmapIndex.everything())).toEqual(corpus);
  });

  it("emptyBitSet() matches nothing", () => {
    const bitmapIndex = index(corpus);

    expect(bitmapIndex.docsFrom(bitmapIndex.emptyBitSet())).toEqual([]);
  });

  it("maps a position back to its doc", () => {
    const bitmapIndex = index(corpus);

    expect(bitmapIndex.docAt(0)).toBe(apple);
    expect(bitmapIndex.docAt(2)).toBe(lemon);
  });

  it("handles a corpus larger than one word (word-boundary positions)", () => {
    const many = Array.from({ length: 100 }, (_, i) => doc(`d${i}`, i % 2 === 0 ? "even" : "odd", "all"));
    const bitmapIndex = index(many);

    expect(bitmapIndex.size).toBe(100);
    expect(docsForTerm(bitmapIndex, "even").length).toBe(50);
    expect(docsForTerm(bitmapIndex, "all").length).toBe(100);
  });

  it("rebuilds cleanly, discarding the previous corpus", () => {
    const bitmapIndex = new BitmapIndex<Doc>(d => d.tags);

    bitmapIndex.build([apple]);
    bitmapIndex.build([lemon]);
    expect(bitmapIndex.size).toBe(1);
    expect(bitmapIndex.indexedTerms().sort()).toEqual(["fruit", "sour", "yellow"]);
    expect(bitmapIndex.postingForTerm("red")).toBeUndefined();
  });

  it("handles an empty corpus", () => {
    const bitmapIndex = index([]);

    expect(bitmapIndex.size).toBe(0);
    expect(bitmapIndex.indexedTerms()).toEqual([]);
    expect(bitmapIndex.docsFrom(bitmapIndex.everything())).toEqual([]);
  });

  describe("dense vs sparse postings", () => {
    // With a wide corpus, a common term crosses the dense threshold (size/32)
    // while a rare term stays sparse. Both must resolve to the same docs.
    it("resolves a frequent (dense) term and a rare (sparse) term identically", () => {
      const wide = Array.from({ length: 1000 }, (_, i) => doc(`d${i}`, "common", i === 500 ? "unique" : "other"));
      const bitmapIndex = index(wide);

      expect(countForTerm(bitmapIndex, "common")).toBe(1000);
      expect(countForTerm(bitmapIndex, "unique")).toBe(1);
      expect(docsForTerm(bitmapIndex, "unique").map(d => d.id)).toEqual(["d500"]);
      expect(docsForTerm(bitmapIndex, "common").length).toBe(1000);
    });

    it("a singleton term resolves to its single doc", () => {
      expect(docsForTerm(index(corpus), "sweet")).toEqual([apple]);
    });
  });

  describe("unionOf", () => {
    it("unions the docs of several terms", () => {
      const bitmapIndex = index(corpus);

      expect(bitmapIndex.docsFrom(bitmapIndex.unionOf(["sweet", "sour"]))).toEqual([apple, lemon]);
    });

    it("skips unknown terms", () => {
      const bitmapIndex = index(corpus);

      expect(bitmapIndex.docsFrom(bitmapIndex.unionOf(["red", "purple"]))).toEqual([apple, cherry]);
    });
  });

  describe("orTermInto", () => {
    it("folds a term's docs into the accumulator", () => {
      const bitmapIndex = index(corpus);
      const accumulator = bitmapIndex.emptyBitSet();

      bitmapIndex.orTermInto(accumulator, "red");
      bitmapIndex.orTermInto(accumulator, "sour");
      expect(bitmapIndex.docsFrom(accumulator)).toEqual([apple, cherry, lemon]);
    });

    it("leaves the accumulator untouched for an unknown term", () => {
      const bitmapIndex = index(corpus);
      const accumulator = bitmapIndex.emptyBitSet();

      bitmapIndex.orTermInto(accumulator, "purple");
      expect(bitmapIndex.docsFrom(accumulator)).toEqual([]);
    });
  });
});
