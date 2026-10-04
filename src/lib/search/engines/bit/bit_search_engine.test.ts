import { Fruit, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { MetricSearchable, Searchable } from "@/types/search";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/lib/search/engines/bit/bit_search_engine";

type MetricDoc = MetricSearchable & { name: string };

interface TaggedItem extends Searchable {
  id: string;
}

function createFruitEngine(): BitSearchEngine<Fruit> {
  return new BitSearchEngine<Fruit>(fruit => fruit.tags, () => 0, fruitDocs);
}

function searchFruitNames(query: string): string[] {
  return createFruitEngine().search(query).map(doc => doc.name).sort();
}

function createTaggedItem(id: string, ...tags: string[]): TaggedItem {
  return { id, tags: new Set(tags) };
}

function createTaggedEngine(items: TaggedItem[]): BitSearchEngine<TaggedItem> {
  return new BitSearchEngine<TaggedItem>(item => item.tags, () => 0, items);
}

function getSortedIds(items: TaggedItem[]): string[] {
  return items.map(item => item.id).sort();
}

function createCorrection(item: TaggedItem, ...newTags: string[]): { doc: TaggedItem; oldTerms: Set<string>; newTerms: Set<string> } {
  const oldTerms = new Set(item.tags);

  item.tags.clear();
  newTags.forEach(tag => item.tags.add(tag));
  return { doc: item, oldTerms, newTerms: item.tags };
}

function createMetricDoc(name: string, metrics: Record<string, number>, tags: string[] = []): MetricDoc {
  return { name, tags: new Set(tags), getMetric: (metric): number => metrics[metric] ?? 0 };
}

function createMetricEngine(docs: MetricDoc[]): BitSearchEngine<MetricDoc> {
  return new BitSearchEngine<MetricDoc>(doc => doc.tags, (doc, metric) => doc.getMetric(metric), docs);
}

function searchMetricNames(engine: BitSearchEngine<MetricDoc>, query: string): string[] {
  return engine.search(query).map(doc => doc.name).sort();
}

// Three favorites, two tagged apple, whose ids are their only metric.
function createIdEngine(): BitSearchEngine<MetricDoc> {
  return createMetricEngine([
    createMetricDoc("a", { id: 100 }, ["apple"]),
    createMetricDoc("b", { id: 200 }, ["apple"]),
    createMetricDoc("c", { id: 300 }, ["banana"])
  ]);
}

const COMPLEMENT_ITEMS = [createTaggedItem("1", "apple"), createTaggedItem("2", "banana"), createTaggedItem("3", "apple"), createTaggedItem("4", "cherry")];

describe("BitSearchEngine", () => {
  describe("search", () => {
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

    test("filters results to the given candidate subset", () => {
      const items = [createTaggedItem("1", "apple"), createTaggedItem("2", "apple"), createTaggedItem("3", "apple")];
      const engine = createTaggedEngine(items);

      expect(getSortedIds(engine.search("apple", [items[0], items[2]]))).toEqual(["1", "3"]);
    });

    test("returns only the candidate subset for an empty query", () => {
      const items = [createTaggedItem("1", "apple"), createTaggedItem("2", "apple"), createTaggedItem("3", "apple")];
      const engine = createTaggedEngine(items);

      expect(getSortedIds(engine.search("", [items[0], items[2]]))).toEqual(["1", "3"]);
    });

    test("returns the same docs for a repeated relative metric query", () => {
      const engine = createMetricEngine([createMetricDoc("wide", { width: 20, height: 10 }), createMetricDoc("tall", { width: 10, height: 20 })]);

      expect(searchMetricNames(engine, "width:>height")).toEqual(["wide"]);
      expect(searchMetricNames(engine, "width:>height")).toEqual(["wide"]);
    });

    test("matches a bare numeric token to the favorite with that id", () => {
      expect(searchMetricNames(createIdEngine(), "200")).toEqual(["b"]);
    });

    test("excludes the favorite a negated bare numeric token names", () => {
      expect(searchMetricNames(createIdEngine(), "-200")).toEqual(["a", "c"]);
    });

    test("matches nothing for an unknown id", () => {
      expect(searchMetricNames(createIdEngine(), "999")).toEqual([]);
    });

    test("combines a bare id with a tag term", () => {
      expect(searchMetricNames(createIdEngine(), "apple 100")).toEqual(["a"]);
      expect(searchMetricNames(createIdEngine(), "apple 300")).toEqual([]);
    });

    test("still matches an explicit id: metric term", () => {
      expect(searchMetricNames(createIdEngine(), "id:300")).toEqual(["c"]);
    });

    test("routes a group nested in a group through the expression path", () => {
      expect(searchFruitNames("red ( sweet ~ ( juicy tropical ) )")).toEqual(["cherry", "strawberry"]);
    });

    test("matches an OR group nesting an AND group", () => {
      expect(searchFruitNames("( sweet ~ ( green tart ) )")).toEqual(["blueberry", "cherry", "grape", "kiwi", "mango", "pear", "strawberry"]);
    });

    test("matches a non-nested single group", () => {
      expect(searchFruitNames("red ( sweet ~ juicy )")).toEqual(["cherry", "strawberry"]);
    });

    test("returns no matches for a malformed query instead of throwing", () => {
      expect(createFruitEngine().search("( a ~ ( b c )")).toEqual([]);
    });
  });

  describe("index", () => {
    test("re-indexes the corpus", () => {
      const engine = new BitSearchEngine<Fruit>(fruit => fruit.tags, () => 0, []);

      expect(engine.search("red")).toEqual([]);
      engine.index(fruitDocs);
      expect(engine.search("red").length).toBeGreaterThan(0);
    });
  });

  describe("add", () => {
    test("makes new docs matchable, including by wildcard and empty query", () => {
      const engine = createTaggedEngine([createTaggedItem("1", "apple")]);

      engine.add([createTaggedItem("2", "cot")]);
      expect(getSortedIds(engine.search("cot"))).toEqual(["2"]);
      expect(getSortedIds(engine.search("( c* ~ a* )"))).toEqual(["1", "2"]);
      expect(engine.search("").length).toBe(2);
    });

    test("grows capacity when adds exceed the initial width", () => {
      const engine = createTaggedEngine([createTaggedItem("seed", "tag")]);

      for (let i = 0; i < 200; i += 1) {
        engine.add([createTaggedItem(`x${i}`, "tag")]);
      }
      expect(engine.search("tag").length).toBe(201);
      expect(engine.search("").length).toBe(201);
    });

    test("stays correct when a term crosses the sparse/dense threshold", () => {
      const engine = createTaggedEngine([]);
      const items = Array.from({ length: 5 }, (_, i) => createTaggedItem(String(i), "shared"));

      items.forEach((item, i) => {
        engine.add([item]);
        expect(getSortedIds(engine.search("shared"))).toEqual(items.slice(0, i + 1).map(it => it.id).sort());
      });
    });

    test("makes added docs visible to a relative metric query already answered", () => {
      const engine = createMetricEngine([createMetricDoc("wide", { width: 20, height: 10 })]);

      expect(searchMetricNames(engine, "width:>height")).toEqual(["wide"]);
      engine.add([createMetricDoc("wider", { width: 30, height: 10 })]);
      expect(searchMetricNames(engine, "width:>height")).toEqual(["wide", "wider"]);
    });
  });

  describe("update", () => {
    test("reflects corrected tags for a doc", () => {
      const target = createTaggedItem("1", "ct");
      const engine = createTaggedEngine([target]);

      engine.update([createCorrection(target, "apple")]);

      expect(engine.search("ct")).toEqual([]);
      expect(getSortedIds(engine.search("apple"))).toEqual(["1"]);
    });

    test("drops a term no doc references and adds a new one, keeping wildcards correct", () => {
      const a = createTaggedItem("1", "apple", "unique");
      const b = createTaggedItem("2", "apple");
      const engine = createTaggedEngine([a, b]);

      engine.update([createCorrection(a, "apple", "fresh")]);

      expect(engine.search("unique")).toEqual([]);
      expect(engine.search("uni*")).toEqual([]);
      expect(getSortedIds(engine.search("fresh"))).toEqual(["1"]);
      expect(getSortedIds(engine.search("fre*"))).toEqual(["1"]);
      expect(getSortedIds(engine.search("apple"))).toEqual(["1", "2"]);
    });

    test("still resolves a wildcard over terms it left untouched", () => {
      const banana = createTaggedItem("3", "banana");
      const engine = createTaggedEngine([
        createTaggedItem("1", "apple"),
        createTaggedItem("2", "apricot"),
        banana
      ]);

      engine.update([createCorrection(banana, "cherry")]);

      expect(getSortedIds(engine.search("ap*"))).toEqual(["1", "2"]);
      expect(getSortedIds(engine.search("apple"))).toEqual(["1"]);
      expect(getSortedIds(engine.search("apricot"))).toEqual(["2"]);
      expect(getSortedIds(engine.search("cherry"))).toEqual(["3"]);
    });

    test("keeps wildcard resolution intact across a batch of docs sharing a term", () => {
      const engine = createTaggedEngine([]);
      const shared = Array.from({ length: 20 }, (_, i) => createTaggedItem(String(i), "shared"));

      engine.add(shared);
      expect(getSortedIds(engine.search("shar*")).length).toBe(20);

      engine.update(shared.map(item => createCorrection(item, "moved")));
      expect(engine.search("shar*")).toEqual([]);
      expect(engine.search("shared")).toEqual([]);
      expect(getSortedIds(engine.search("moved")).length).toBe(20);
    });

    test("ignores old terms that were never indexed", () => {
      const target = createTaggedItem("1", "apple");
      const engine = createTaggedEngine([target, createTaggedItem("2", "apple")]);

      engine.update([{ doc: target, oldTerms: new Set(["apple", "ghost"]), newTerms: new Set(["apple", "fresh"]) }]);

      expect(getSortedIds(engine.search("apple"))).toEqual(["1", "2"]);
      expect(getSortedIds(engine.search("fresh"))).toEqual(["1"]);
      expect(engine.search("ghost")).toEqual([]);
    });

    test("ignores docs that were never indexed", () => {
      const engine = createTaggedEngine([createTaggedItem("1", "apple")]);
      const stranger = createTaggedItem("stranger", "apple");

      engine.update([createCorrection(stranger, "fresh")]);

      expect(engine.search("fresh")).toEqual([]);
      expect(getSortedIds(engine.search("apple"))).toEqual(["1"]);
    });
  });

  describe("complementOf", () => {
    test("returns every indexed doc not in the current set", () => {
      expect(getSortedIds(createTaggedEngine(COMPLEMENT_ITEMS).complementOf([COMPLEMENT_ITEMS[0], COMPLEMENT_ITEMS[1]]))).toEqual(["3", "4"]);
    });

    test("narrows the complement to docs matching the filter", () => {
      expect(getSortedIds(createTaggedEngine(COMPLEMENT_ITEMS).complementOf([COMPLEMENT_ITEMS[0]], "apple"))).toEqual(["3"]);
    });

    test("ignores current docs that were never indexed", () => {
      expect(getSortedIds(createTaggedEngine(COMPLEMENT_ITEMS).complementOf([createTaggedItem("stranger", "apple")]))).toEqual(["1", "2", "3", "4"]);
    });

    test("leaves the complement unfiltered for a malformed filter", () => {
      expect(getSortedIds(createTaggedEngine(COMPLEMENT_ITEMS).complementOf([COMPLEMENT_ITEMS[0]], "( apple"))).toEqual(["2", "3", "4"]);
    });
  });
});
