import { Fruit, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { MetricSearchable, Searchable } from "@/types/search";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/lib/search/engines/bit/bit_search_engine";

type MetricDoc = MetricSearchable & { name: string };

function bitmapEngine(): BitSearchEngine<Fruit> {
  return new BitSearchEngine<Fruit>(fruit => fruit.tags, () => 0, fruitDocs);
}

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

function taggedItem(id: string, ...tags: string[]): TaggedItem {
  return { id, tags: new Set(tags) };
}

function taggedEngine(items: TaggedItem[]): BitSearchEngine<TaggedItem> {
  return new BitSearchEngine<TaggedItem>(item => item.tags, () => 0, items);
}

function idsOf(items: TaggedItem[]): string[] {
  return items.map(item => item.id).sort();
}

function correct(item: TaggedItem, ...newTags: string[]): { doc: TaggedItem; oldTerms: Set<string>; newTerms: Set<string> } {
  const oldTerms = new Set(item.tags);

  item.tags.clear();
  newTags.forEach(tag => item.tags.add(tag));
  return { doc: item, oldTerms, newTerms: item.tags };
}

describe("BitmapSearchEngine incremental mutation", () => {
  test("add makes new docs matchable, including by wildcard and empty query", () => {
    const engine = taggedEngine([taggedItem("1", "cat")]);

    engine.add([taggedItem("2", "cot")]);
    expect(idsOf(engine.search("cot"))).toEqual(["2"]);
    expect(idsOf(engine.search("c*"))).toEqual(["1", "2"]);
    expect(engine.search("").length).toBe(2);
  });

  test("update reflects corrected tags for a doc", () => {
    const target = taggedItem("1", "ct");
    const engine = taggedEngine([target]);

    engine.update([correct(target, "cat")]);

    expect(engine.search("ct")).toEqual([]);
    expect(idsOf(engine.search("cat"))).toEqual(["1"]);
  });

  test("update drops a term no doc references and adds a new one, keeping wildcards correct", () => {
    const a = taggedItem("1", "cat", "unique");
    const b = taggedItem("2", "cat");
    const engine = taggedEngine([a, b]);

    engine.update([correct(a, "cat", "fresh")]);

    expect(engine.search("unique")).toEqual([]);
    expect(engine.search("uni*")).toEqual([]);
    expect(idsOf(engine.search("fresh"))).toEqual(["1"]);
    expect(idsOf(engine.search("fre*"))).toEqual(["1"]);
    expect(idsOf(engine.search("cat"))).toEqual(["1", "2"]);
  });

  test("a wildcard over terms untouched by an update still resolves correctly", () => {
    const banana = taggedItem("3", "banana");
    const engine = taggedEngine([
      taggedItem("1", "apple"),
      taggedItem("2", "apricot"),
      banana
    ]);

    engine.update([correct(banana, "cherry")]);

    expect(idsOf(engine.search("ap*"))).toEqual(["1", "2"]);
    expect(idsOf(engine.search("apple"))).toEqual(["1"]);
    expect(idsOf(engine.search("apricot"))).toEqual(["2"]);
    expect(idsOf(engine.search("cherry"))).toEqual(["3"]);
  });

  test("a batch of docs sharing a term does not corrupt wildcard resolution", () => {
    const engine = taggedEngine([]);
    const shared = Array.from({ length: 20 }, (_, i) => taggedItem(String(i), "shared"));

    engine.add(shared);
    expect(idsOf(engine.search("shar*")).length).toBe(20);

    engine.update(shared.map(item => correct(item, "moved")));
    expect(engine.search("shar*")).toEqual([]);
    expect(engine.search("shared")).toEqual([]);
    expect(idsOf(engine.search("moved")).length).toBe(20);
  });

  test("grows capacity when adds exceed the initial width", () => {
    const engine = taggedEngine([taggedItem("seed", "tag")]);

    for (let i = 0; i < 200; i += 1) {
      engine.add([taggedItem(`x${i}`, "tag")]);
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

  test("stays correct when a term crosses the sparse/dense threshold via add", () => {
    const engine = taggedEngine([]);
    const items = Array.from({ length: 5 }, (_, i) => taggedItem(String(i), "shared"));

    items.forEach((item, i) => {
      engine.add([item]);
      expect(idsOf(engine.search("shared"))).toEqual(items.slice(0, i + 1).map(it => it.id).sort());
    });
  });
});

describe("BitmapSearchEngine resolves bare numeric queries as favorite ids", () => {
  const withId = (name: string, tags: string[], id: number): MetricDoc => ({
    name,
    tags: new Set(tags),
    getMetric: (metric): number => (metric === "id" ? id : 0)
  });
  const docs: MetricDoc[] = [
    withId("a", ["cat"], 100),
    withId("b", ["cat"], 200),
    withId("c", ["dog"], 300)
  ];
  const engine = new BitSearchEngine<MetricDoc>(doc => doc.tags, (doc, metric) => doc.getMetric(metric), docs);

  function namesOf(query: string): string[] {
    return engine.search(query).map(doc => doc.name).sort();
  }

  test("a bare numeric token matches the favorite with that id", () => {
    expect(namesOf("200")).toEqual(["b"]);
  });

  test("a negated bare numeric token excludes that favorite", () => {
    expect(namesOf("-200")).toEqual(["a", "c"]);
  });

  test("an unknown id matches nothing", () => {
    expect(namesOf("999")).toEqual([]);
  });

  test("a bare id combines with a tag term", () => {
    expect(namesOf("cat 100")).toEqual(["a"]);
    expect(namesOf("cat 300")).toEqual([]);
  });

  test("an explicit id: metric term still works", () => {
    expect(namesOf("id:300")).toEqual(["c"]);
  });
});

describe("BitmapSearchEngine nested-group queries", () => {
  function namesOf(query: string): string[] {
    return bitmapEngine().search(query).map(doc => doc.name).sort();
  }

  test("routes a group nested in a group through the expression path", () => {
    expect(namesOf("red ( sweet ~ ( juicy tropical ) )")).toEqual(["cherry", "strawberry"]);
  });

  test("an OR group nesting an AND group", () => {
    expect(namesOf("( sweet ~ ( green tart ) )"))
      .toEqual(["blueberry", "cherry", "grape", "kiwi", "mango", "pear", "strawberry"]);
  });

  test("a non-nested single group", () => {
    expect(namesOf("red ( sweet ~ juicy )")).toEqual(["cherry", "strawberry"]);
  });

  test("a malformed query returns no matches instead of throwing", () => {
    expect(bitmapEngine().search("( a ~ ( b c )")).toEqual([]);
  });
});
