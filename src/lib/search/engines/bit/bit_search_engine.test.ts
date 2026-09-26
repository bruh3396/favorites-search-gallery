import { Fruit, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { MetricSearchable, Searchable } from "@/types/search";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/lib/search/engines/bit/bit_search_engine";

type MetricDoc = MetricSearchable & { name: string };

function createFruitEngine(): BitSearchEngine<Fruit> {
  return new BitSearchEngine<Fruit>(fruit => fruit.tags, () => 0, fruitDocs);
}

describe("BitmapSearchEngine", () => {
  test("returns the whole corpus for an empty query", () => {
    expect(createFruitEngine().search("")).toEqual(fruitDocs);
  });

  test("returns results in corpus order", () => {
    const result = createFruitEngine().search("sweet");

    expect(result.map(doc => doc.name)).toEqual(fruitDocs.filter(doc => doc.tags.has("sweet")).map(doc => doc.name));
  });

  test("returns nothing when a required term matches no doc", () => {
    expect(createFruitEngine().search("red nonexistenttag")).toEqual([]);
  });

  test("re-indexes on index()", () => {
    const engine = new BitSearchEngine<Fruit>(fruit => fruit.tags, () => 0, []);

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
    const engine = new BitSearchEngine<Item>(post => post.tags, () => 0, posts);
    const result = engine.search("low ( even ~ -high )");

    expect(result.map(p => p.id)).toEqual(posts.filter(p => p.id < 50).map(p => p.id));
    expect(result.every(p => p.id < 50)).toBe(true);
  });
});

interface TaggedItem extends Searchable { id: string }

function createTaggedItem(id: string, ...tags: string[]): TaggedItem {
  return { id, tags: new Set(tags) };
}

function createTaggedEngine(items: TaggedItem[]): BitSearchEngine<TaggedItem> {
  return new BitSearchEngine<TaggedItem>(item => item.tags, () => 0, items);
}

function idsOf(items: TaggedItem[]): string[] {
  return items.map(item => item.id).sort();
}

function createCorrection(item: TaggedItem, ...newTags: string[]): { doc: TaggedItem; oldTerms: Set<string>; newTerms: Set<string> } {
  const oldTerms = new Set(item.tags);

  item.tags.clear();
  newTags.forEach(tag => item.tags.add(tag));
  return { doc: item, oldTerms, newTerms: item.tags };
}

describe("BitmapSearchEngine incremental mutation", () => {
  test("add makes new docs matchable, including by wildcard and empty query", () => {
    const engine = createTaggedEngine([createTaggedItem("1", "apple")]);

    engine.add([createTaggedItem("2", "cot")]);
    expect(idsOf(engine.search("cot"))).toEqual(["2"]);
    expect(idsOf(engine.search("( c* ~ a* )"))).toEqual(["1", "2"]);
    expect(engine.search("").length).toBe(2);
  });

  test("update reflects corrected tags for a doc", () => {
    const target = createTaggedItem("1", "ct");
    const engine = createTaggedEngine([target]);

    engine.update([createCorrection(target, "apple")]);

    expect(engine.search("ct")).toEqual([]);
    expect(idsOf(engine.search("apple"))).toEqual(["1"]);
  });

  test("update drops a term no doc references and adds a new one, keeping wildcards correct", () => {
    const a = createTaggedItem("1", "apple", "unique");
    const b = createTaggedItem("2", "apple");
    const engine = createTaggedEngine([a, b]);

    engine.update([createCorrection(a, "apple", "fresh")]);

    expect(engine.search("unique")).toEqual([]);
    expect(engine.search("uni*")).toEqual([]);
    expect(idsOf(engine.search("fresh"))).toEqual(["1"]);
    expect(idsOf(engine.search("fre*"))).toEqual(["1"]);
    expect(idsOf(engine.search("apple"))).toEqual(["1", "2"]);
  });

  test("a wildcard over terms untouched by an update still resolves correctly", () => {
    const banana = createTaggedItem("3", "banana");
    const engine = createTaggedEngine([
      createTaggedItem("1", "apple"),
      createTaggedItem("2", "apricot"),
      banana
    ]);

    engine.update([createCorrection(banana, "cherry")]);

    expect(idsOf(engine.search("ap*"))).toEqual(["1", "2"]);
    expect(idsOf(engine.search("apple"))).toEqual(["1"]);
    expect(idsOf(engine.search("apricot"))).toEqual(["2"]);
    expect(idsOf(engine.search("cherry"))).toEqual(["3"]);
  });

  test("a batch of docs sharing a term does not corrupt wildcard resolution", () => {
    const engine = createTaggedEngine([]);
    const shared = Array.from({ length: 20 }, (_, i) => createTaggedItem(String(i), "shared"));

    engine.add(shared);
    expect(idsOf(engine.search("shar*")).length).toBe(20);

    engine.update(shared.map(item => createCorrection(item, "moved")));
    expect(engine.search("shar*")).toEqual([]);
    expect(engine.search("shared")).toEqual([]);
    expect(idsOf(engine.search("moved")).length).toBe(20);
  });

  test("grows capacity when adds exceed the initial width", () => {
    const engine = createTaggedEngine([createTaggedItem("seed", "tag")]);

    for (let i = 0; i < 200; i += 1) {
      engine.add([createTaggedItem(`x${i}`, "tag")]);
    }
    expect(engine.search("tag").length).toBe(201);
    expect(engine.search("").length).toBe(201);
  });

  test("filters results to the given candidate subset", () => {
    const items = [createTaggedItem("1", "apple"), createTaggedItem("2", "apple"), createTaggedItem("3", "apple")];
    const engine = createTaggedEngine(items);

    expect(idsOf(engine.search("apple", [items[0], items[2]]))).toEqual(["1", "3"]);
  });

  test("returns only the candidate subset for an empty query", () => {
    const items = [createTaggedItem("1", "apple"), createTaggedItem("2", "apple"), createTaggedItem("3", "apple")];
    const engine = createTaggedEngine(items);

    expect(idsOf(engine.search("", [items[0], items[2]]))).toEqual(["1", "3"]);
  });

  test("update ignores old terms that were never indexed", () => {
    const target = createTaggedItem("1", "apple");
    const engine = createTaggedEngine([target, createTaggedItem("2", "apple")]);

    engine.update([{ doc: target, oldTerms: new Set(["apple", "ghost"]), newTerms: new Set(["apple", "fresh"]) }]);

    expect(idsOf(engine.search("apple"))).toEqual(["1", "2"]);
    expect(idsOf(engine.search("fresh"))).toEqual(["1"]);
    expect(engine.search("ghost")).toEqual([]);
  });

  test("update ignores docs that were never indexed", () => {
    const engine = createTaggedEngine([createTaggedItem("1", "apple")]);
    const stranger = createTaggedItem("stranger", "apple");

    engine.update([createCorrection(stranger, "fresh")]);

    expect(engine.search("fresh")).toEqual([]);
    expect(idsOf(engine.search("apple"))).toEqual(["1"]);
  });

  test("stays correct when a term crosses the sparse/dense threshold via add", () => {
    const engine = createTaggedEngine([]);
    const items = Array.from({ length: 5 }, (_, i) => createTaggedItem(String(i), "shared"));

    items.forEach((item, i) => {
      engine.add([item]);
      expect(idsOf(engine.search("shared"))).toEqual(items.slice(0, i + 1).map(it => it.id).sort());
    });
  });
});

describe("BitmapSearchEngine complementOf", () => {
  const items = [createTaggedItem("1", "apple"), createTaggedItem("2", "banana"), createTaggedItem("3", "apple"), createTaggedItem("4", "cherry")];

  test("returns every indexed doc not in the current set", () => {
    expect(idsOf(createTaggedEngine(items).complementOf([items[0], items[1]]))).toEqual(["3", "4"]);
  });

  test("narrows the complement to docs matching the filter", () => {
    expect(idsOf(createTaggedEngine(items).complementOf([items[0]], "apple"))).toEqual(["3"]);
  });

  test("ignores current docs that were never indexed", () => {
    expect(idsOf(createTaggedEngine(items).complementOf([createTaggedItem("stranger", "apple")]))).toEqual(["1", "2", "3", "4"]);
  });

  test("a malformed filter leaves the complement unfiltered", () => {
    expect(idsOf(createTaggedEngine(items).complementOf([items[0]], "( apple"))).toEqual(["2", "3", "4"]);
  });
});

describe("BitmapSearchEngine relative metric queries", () => {
  const createSizedDoc = (name: string, width: number, height: number): MetricDoc => {
    const metrics: Record<string, number> = { width, height };
    return { name, tags: new Set(), getMetric: (metric): number => metrics[metric] ?? 0 };
  };

  function namesFor(engine: BitSearchEngine<MetricDoc>, query: string): string[] {
    return engine.search(query).map(doc => doc.name).sort();
  }

  test("a repeated relative query returns the same docs", () => {
    const engine = new BitSearchEngine<MetricDoc>(doc => doc.tags, (doc, metric) => doc.getMetric(metric), [createSizedDoc("wide", 20, 10), createSizedDoc("tall", 10, 20)]);

    expect(namesFor(engine, "width:>height")).toEqual(["wide"]);
    expect(namesFor(engine, "width:>height")).toEqual(["wide"]);
  });

  test("a relative query sees docs added after it was first answered", () => {
    const engine = new BitSearchEngine<MetricDoc>(doc => doc.tags, (doc, metric) => doc.getMetric(metric), [createSizedDoc("wide", 20, 10)]);

    expect(namesFor(engine, "width:>height")).toEqual(["wide"]);
    engine.add([createSizedDoc("wider", 30, 10)]);
    expect(namesFor(engine, "width:>height")).toEqual(["wide", "wider"]);
  });
});

describe("BitmapSearchEngine resolves bare numeric queries as favorite ids", () => {
  const createMetricDoc = (name: string, tags: string[], id: number): MetricDoc => ({
    name,
    tags: new Set(tags),
    getMetric: (metric): number => (metric === "id" ? id : 0)
  });
  const docs: MetricDoc[] = [
    createMetricDoc("a", ["apple"], 100),
    createMetricDoc("b", ["apple"], 200),
    createMetricDoc("c", ["banana"], 300)
  ];
  const engine = new BitSearchEngine<MetricDoc>(doc => doc.tags, (doc, metric) => doc.getMetric(metric), docs);

  function namesFor(query: string): string[] {
    return engine.search(query).map(doc => doc.name).sort();
  }

  test("a bare numeric token matches the favorite with that id", () => {
    expect(namesFor("200")).toEqual(["b"]);
  });

  test("a negated bare numeric token excludes that favorite", () => {
    expect(namesFor("-200")).toEqual(["a", "c"]);
  });

  test("an unknown id matches nothing", () => {
    expect(namesFor("999")).toEqual([]);
  });

  test("a bare id combines with a tag term", () => {
    expect(namesFor("apple 100")).toEqual(["a"]);
    expect(namesFor("apple 300")).toEqual([]);
  });

  test("an explicit id: metric term still works", () => {
    expect(namesFor("id:300")).toEqual(["c"]);
  });
});

describe("BitmapSearchEngine nested-group queries", () => {
  function namesFor(query: string): string[] {
    return createFruitEngine().search(query).map(doc => doc.name).sort();
  }

  test("routes a group nested in a group through the expression path", () => {
    expect(namesFor("red ( sweet ~ ( juicy tropical ) )")).toEqual(["cherry", "strawberry"]);
  });

  test("an OR group nesting an AND group", () => {
    expect(namesFor("( sweet ~ ( green tart ) )"))
      .toEqual(["blueberry", "cherry", "grape", "kiwi", "mango", "pear", "strawberry"]);
  });

  test("a non-nested single group", () => {
    expect(namesFor("red ( sweet ~ juicy )")).toEqual(["cherry", "strawberry"]);
  });

  test("a malformed query returns no matches instead of throwing", () => {
    expect(createFruitEngine().search("( a ~ ( b c )")).toEqual([]);
  });
});
