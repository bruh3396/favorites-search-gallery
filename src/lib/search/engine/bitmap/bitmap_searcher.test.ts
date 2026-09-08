import { describe, expect, test } from "vitest";
import { BitmapIndex } from "@/lib/search/engine/bitmap/bitmap_index";
import { BitmapSearcher } from "@/lib/search/engine/bitmap/bitmap_searcher";
import { MetricBitmapIndex } from "@/lib/search/engine/bitmap/metric_bitmap_index";
import { Searchable } from "@/types/search";
import { WildcardTermResolver } from "@/lib/search/engine/set/wildcard_term_resolver";
import { parseSearchQuery } from "@/lib/search/parsers/search_term_group_parser";

interface Item extends Searchable { id: string }

function item(id: string, ...tags: string[]): Item {
  return { id, tags: new Set(tags) };
}

function searcherFor(items: Item[]): BitmapSearcher<Item> {
  const bitmapIndex = new BitmapIndex<Item>(doc => doc.tags);

  bitmapIndex.build(items);
  const metricIndex = new MetricBitmapIndex<Item>(doc => doc.id.length);

  metricIndex.build(bitmapIndex.width, bitmapIndex.positionalDocs());
  const wildcardResolver = new WildcardTermResolver();

  wildcardResolver.index(bitmapIndex.indexedTerms().sort());
  return new BitmapSearcher<Item>(bitmapIndex, metricIndex, wildcardResolver);
}

function idsFor(items: Item[], query: string): string[] {
  return searcherFor(items).search(parseSearchQuery<Item>(query)).map(doc => doc.id).sort();
}

const corpus: Item[] = [
  item("1", "red", "sweet", "small"),
  item("2", "red", "sour", "big"),
  item("3", "green", "sweet", "big"),
  item("4", "green", "sour", "small"),
  item("5", "blue", "sweet", "small")
];

describe("BitmapSearcher AND folding", () => {
  test("intersects multiple positive terms", () => {
    expect(idsFor(corpus, "red sweet")).toEqual(["1"]);
  });

  test("returns nothing when a required term is absent from the index", () => {
    expect(idsFor(corpus, "red nonexistent")).toEqual([]);
  });

  test("returns nothing when two present terms never co-occur", () => {
    expect(idsFor(corpus, "red green")).toEqual([]);
  });

  test("returns results in corpus (position) order", () => {
    expect(searcherFor(corpus).search(parseSearchQuery<Item>("sweet")).map(d => d.id))
      .toEqual(["1", "3", "5"]);
  });
});

describe("BitmapSearcher negation folding", () => {
  test("excludes a negated term", () => {
    expect(idsFor(corpus, "sweet -small")).toEqual(["3"]);
  });

  test("ignores a negated term that matches no doc (nothing to subtract)", () => {
    expect(idsFor(corpus, "sweet -nonexistent")).toEqual(["1", "3", "5"]);
  });

  test("returns the whole corpus for a lone negation of an absent term", () => {
    expect(idsFor(corpus, "-nonexistent")).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("empties the result when negation removes every seed match", () => {
    expect(idsFor(corpus, "blue -sweet")).toEqual([]);
  });
});

describe("BitmapSearcher OR-group folding", () => {
  test("keeps docs matching any term in the group", () => {
    expect(idsFor(corpus, "small ( red ~ blue )")).toEqual(["1", "5"]);
  });

  test("returns UNMATCHABLE when an OR group resolves to no docs", () => {
    expect(idsFor(corpus, "sweet ( nonexistentA ~ nonexistentB )")).toEqual([]);
  });

  test("intersects multiple OR groups against the seed", () => {
    expect(idsFor(corpus, "( red ~ green ) ( sweet ~ sour )"))
      .toEqual(["1", "2", "3", "4"]);
  });

  test("handles a negated term inside an OR group", () => {
    expect(idsFor(corpus, "small ( -red ~ sweet )")).toEqual(["1", "4", "5"]);
  });

  test("does not build OR groups when the AND seed is already empty", () => {
    expect(idsFor(corpus, "red green ( sweet ~ sour )")).toEqual([]);
  });
});

describe("BitmapSearcher wildcard resolution", () => {
  test("resolves a prefix wildcard to the union of matching terms", () => {
    const items = [item("1", "cat"), item("2", "car"), item("3", "dog")];

    expect(idsFor(items, "ca*")).toEqual(["1", "2"]);
  });

  test("returns nothing when a wildcard matches no indexed term", () => {
    const items = [item("1", "cat"), item("2", "dog")];

    expect(idsFor(items, "z*")).toEqual([]);
  });
});

describe("BitmapSearcher metric folding", () => {
  test("folds a metric term into the AND intersection", () => {
    const items = [item("aa", "x"), item("bbbb", "x"), item("cccccc", "x")];

    expect(idsFor(items, "x id:>3")).toEqual(["bbbb", "cccccc"]);
  });
});
