import { Fruit, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { describe, expect, it } from "vitest";
import { BitmapSearchEngine } from "@/lib/search/bitmap/bitmap_search_engine";
import { SearchEngine } from "@/lib/search/engine/search_engine";
import { Searchable } from "@/types/search";

function bitmapEngine(): BitmapSearchEngine<Fruit> {
  return new BitmapSearchEngine<Fruit>(fruit => fruit.tags, fruitDocs);
}

// The existing Set-based engine, used as the correctness oracle. Fruit docs
// carry no metrics, so the metric extractor is never exercised by tag queries.
function referenceEngine(): SearchEngine<Fruit> {
  return new SearchEngine<Fruit>(fruit => fruit.tags, () => 0, fruitDocs);
}

function names(docs: Fruit[]): string[] {
  return docs.map(doc => doc.name).sort();
}

const tagQueries = [
  "red",
  "sweet",
  "red sweet",
  "sweet -red",
  "fiber juicy",
  "-red",
  "( red ~ green )",
  "sweet ( red ~ green )",
  "( red ~ green ) ( sweet ~ tart )",
  "fiber ( snack ~ dessert ) -green",
  "nonexistenttag",
  "red nonexistenttag",
  "( nonexistenttag ~ red )",
  "berry sweet ( vitamin-c ~ antioxidants )",
  "swe*",
  "*erry",
  "*ui*",
  "swe* -red",
  "( swe* ~ tart )",
  "fib* juic*",
  "zzz*",
  "*ui* red",
  "swe* *erry",
  "*e* -red",
  "*e* ( sweet ~ sour )",
  "red -swe*",
  "*ui* *e* sweet"
];

describe("BitmapSearchEngine matches the Set engine on tag queries", () => {
  const reference = referenceEngine();
  const bitmap = bitmapEngine();

  tagQueries.forEach(query => {
    it(`agrees on "${query}"`, () => {
      const expected = names(reference.search(query, fruitDocs));
      const actual = names(bitmap.search(query));

      expect(actual).toEqual(expected);
    });
  });
});

describe("BitmapSearchEngine", () => {
  it("returns the whole corpus for an empty query", () => {
    expect(bitmapEngine().search("")).toEqual(fruitDocs);
  });

  it("returns results in corpus order", () => {
    const result = bitmapEngine().search("sweet");

    expect(result.map(doc => doc.name)).toEqual(fruitDocs.filter(doc => doc.tags.has("sweet")).map(doc => doc.name));
  });

  it("returns nothing when a required term matches no doc", () => {
    expect(bitmapEngine().search("red nonexistenttag")).toEqual([]);
  });

  it("re-indexes on index()", () => {
    const engine = new BitmapSearchEngine<Fruit>(fruit => fruit.tags, []);

    expect(engine.search("red")).toEqual([]);
    engine.index(fruitDocs);
    expect(names(engine.search("red")).length).toBeGreaterThan(0);
  });

  it("rejects metric terms for now", () => {
    expect(() => bitmapEngine().search("id:>5")).toThrow(/metric terms are not supported/);
  });

  // A corpus wider than one 32-bit word, exercising the top-word padding bits
  // that orComplementInPlace sets. If those leaked, a negated-OR group would
  // report phantom matches at positions >= size.
  it("handles negated OR across a multi-word corpus without phantom matches", () => {
    interface Item extends Searchable { id: number }
    const posts: Item[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      tags: new Set([`n${i}`, i % 2 === 0 ? "even" : "odd", i < 50 ? "low" : "high"])
    }));
    const engine = new BitmapSearchEngine<Item>(post => post.tags, posts);

    // "low ( even ~ -high )": low AND (even OR not-high).
    // For low docs (0..49) high is absent, so (even OR not-high) is always true.
    const result = engine.search("low ( even ~ -high )");

    expect(result.map(p => p.id)).toEqual(posts.filter(p => p.id < 50).map(p => p.id));
    expect(result.every(p => p.id < 50)).toBe(true);
  });
});
