import { Fruit, FruitName, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { MetricDoc, metricDocs, metricSearchCases, searchCases } from "@/lib/search/testing/search_cases";
import { describe, expect, test } from "vitest";
import { BitmapSearchEngine } from "@/lib/search/engine/bitmap/bitmap_search_engine";
import { Searchable } from "@/types/search";

function bitmapEngine(): BitmapSearchEngine<Fruit> {
  return new BitmapSearchEngine<Fruit>(fruit => fruit.tags, () => 0, fruitDocs);
}

describe("BitmapSearchEngine matches the shared search cases", () => {
  const engine = bitmapEngine();

  function assertMatches(query: string, expectedNames: FruitName[]): void {
    const expected = expectedNames.slice().sort();
    const actual = engine.search(query).map(doc => doc.name).sort();

    expect(actual, query).toEqual(expected);
  }

  for (const group of searchCases) {
    test(group.name, () => {
      group.run(assertMatches);
    });
  }
});

describe("BitmapSearchEngine", () => {
  test("returns the whole corpus for an empty query", () => {
    expect(bitmapEngine().search("")).toEqual(fruitDocs);
  });

  test("returns results in corpus order", () => {
    const result = bitmapEngine().search("sweet");

    expect(result.map(doc => doc.name)).toEqual(fruitDocs.filter(doc => doc.tags.has("sweet")).map(doc => doc.name));
  });

  test("returns nothing when a required term matches no doc", () => {
    expect(bitmapEngine().search("red nonexistenttag")).toEqual([]);
  });

  test("re-indexes on index()", () => {
    const engine = new BitmapSearchEngine<Fruit>(fruit => fruit.tags, () => 0, []);

    expect(engine.search("red")).toEqual([]);
    engine.index(fruitDocs);
    expect(engine.search("red").length).toBeGreaterThan(0);
  });

  test("handles negated OR across a multi-word corpus without phantom matches", () => {
    interface Item extends Searchable { id: number }
    const posts: Item[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      tags: new Set([`n${i}`, i % 2 === 0 ? "even" : "odd", i < 50 ? "low" : "high"])
    }));
    const engine = new BitmapSearchEngine<Item>(post => post.tags, () => 0, posts);
    const result = engine.search("low ( even ~ -high )");

    expect(result.map(p => p.id)).toEqual(posts.filter(p => p.id < 50).map(p => p.id));
    expect(result.every(p => p.id < 50)).toBe(true);
  });
});

interface TaggedItem extends Searchable { id: string }

function taggedItem(id: string, ...tags: string[]): TaggedItem {
  return { id, tags: new Set(tags) };
}

function taggedEngine(items: TaggedItem[]): BitmapSearchEngine<TaggedItem> {
  return new BitmapSearchEngine<TaggedItem>(item => item.tags, () => 0, items);
}

function idsOf(items: TaggedItem[]): string[] {
  return items.map(item => item.id).sort();
}

describe("BitmapSearchEngine incremental mutation", () => {
  test("add makes a new doc matchable, including by wildcard and empty query", () => {
    const engine = taggedEngine([taggedItem("1", "cat")]);

    engine.add(taggedItem("2", "cot"));
    expect(idsOf(engine.search("cot"))).toEqual(["2"]);
    expect(idsOf(engine.search("c*"))).toEqual(["1", "2"]);
    expect(engine.search("").length).toBe(2);
  });

  test("remove stops a doc from matching and drops its unique terms", () => {
    const a = taggedItem("1", "cat");
    const b = taggedItem("2", "cat", "unique");
    const engine = taggedEngine([a, b]);

    engine.remove(b);
    expect(idsOf(engine.search("cat"))).toEqual(["1"]);
    expect(engine.search("unique")).toEqual([]);
    expect(engine.search("uni*")).toEqual([]);
  });

  test("reflects corrected tags after remove-then-add of the same doc", () => {
    const target = taggedItem("1", "ct");
    const engine = taggedEngine([target]);

    engine.remove(target);
    target.tags.clear();
    target.tags.add("cat");
    engine.add(target);

    expect(engine.search("ct")).toEqual([]);
    expect(idsOf(engine.search("cat"))).toEqual(["1"]);
  });

  test("reuses freed positions without leaking phantom matches", () => {
    const items = Array.from({ length: 10 }, (_, i) => taggedItem(String(i), "tag", `u${i}`));
    const engine = taggedEngine(items);

    items.slice(0, 5).forEach(item => engine.remove(item));
    engine.add(taggedItem("new", "tag"));

    expect(idsOf(engine.search("tag"))).toEqual(["5", "6", "7", "8", "9", "new"]);
    expect(engine.search("").length).toBe(6);
  });

  test("grows capacity when adds exceed the initial width", () => {
    const engine = taggedEngine([taggedItem("seed", "tag")]);

    for (let i = 0; i < 200; i += 1) {
      engine.add(taggedItem(`x${i}`, "tag"));
    }
    expect(engine.search("tag").length).toBe(201);
    expect(engine.search("").length).toBe(201);
  });

  test("filters results to the given candidate subset", () => {
    const items = [taggedItem("1", "cat"), taggedItem("2", "cat"), taggedItem("3", "cat")];
    const engine = taggedEngine(items);

    expect(idsOf(engine.search("cat", [items[0], items[2]]))).toEqual(["1", "3"]);
  });

  test("returns only the candidate subset for an empty query", () => {
    const items = [taggedItem("1", "cat"), taggedItem("2", "cat"), taggedItem("3", "cat")];
    const engine = taggedEngine(items);

    expect(idsOf(engine.search("", [items[0], items[2]]))).toEqual(["1", "3"]);
  });

  test("stays correct when a term crosses the sparse/dense threshold via add and remove", () => {
    const engine = taggedEngine([]);
    const items = Array.from({ length: 5 }, (_, i) => taggedItem(String(i), "shared"));

    items.forEach((item, i) => {
      engine.add(item);
      expect(idsOf(engine.search("shared"))).toEqual(items.slice(0, i + 1).map(it => it.id).sort());
    });

    for (let i = items.length - 1; i >= 0; i -= 1) {
      engine.remove(items[i]);
      expect(idsOf(engine.search("shared"))).toEqual(items.slice(0, i).map(it => it.id).sort());
    }
    expect(engine.search("shared")).toEqual([]);
  });
});

describe("BitmapSearchEngine matches the shared metric cases", () => {
  const engine = new BitmapSearchEngine<MetricDoc>(doc => doc.tags, (doc, metric) => doc.getMetric(metric), metricDocs);

  function assertMatches(query: string, expectedNames: string[]): void {
    const expected = expectedNames.slice().sort();
    const actual = engine.search(query).map(doc => doc.name).sort();

    expect(actual, query).toEqual(expected);
  }

  for (const group of metricSearchCases) {
    test(group.name, () => {
      group.run(assertMatches);
    });
  }
});
