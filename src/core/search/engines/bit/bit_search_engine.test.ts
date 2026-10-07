import { Fruit, fruitDocs } from "@/core/search/testing/fruit_corpus";
import { MetricSearchable, Searchable } from "@/core/search/searchable";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/core/search/engines/bit/bit_search_engine";
import { parseSearchExpression } from "@/core/search/parsers/search_expression_parser";

type MetricDoc = MetricSearchable & { name: string };

interface TaggedItem extends Searchable {
  id: string;
}

function createFruitEngine(): BitSearchEngine<Fruit> {
  return new BitSearchEngine<Fruit>(fruit => fruit.tags, () => 0, fruitDocs);
}

function searchFruitNames(query: string): string[] {
  return createFruitEngine().search(parseSearchExpression(query)).map(doc => doc.name).sort();
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
  return engine.search(parseSearchExpression(query)).map(doc => doc.name).sort();
}

// Three favorites, two tagged apple, whose ids are their only metric.
function createIdEngine(): BitSearchEngine<MetricDoc> {
  return createMetricEngine([
    createMetricDoc("a", { id: 100 }, ["apple"]),
    createMetricDoc("b", { id: 200 }, ["apple"]),
    createMetricDoc("c", { id: 300 }, ["banana"])
  ]);
}

describe("BitSearchEngine", () => {
  describe("search", () => {
    test("returns the whole corpus for an empty query", () => {
      expect(createFruitEngine().search(parseSearchExpression(""))).toEqual(fruitDocs);
    });

    test("returns results in corpus order", () => {
      const result = createFruitEngine().search(parseSearchExpression("sweet"));

      expect(result.map(doc => doc.name)).toEqual(fruitDocs.filter(doc => doc.tags.has("sweet")).map(doc => doc.name));
    });

    test("returns nothing when a required term matches no doc", () => {
      expect(createFruitEngine().search(parseSearchExpression("red nonexistenttag"))).toEqual([]);
    });

    test("handles negated OR across a multi-word corpus without phantom matches", () => {
      interface Item extends Searchable { id: number }
      const posts: Item[] = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        tags: new Set([`n${i}`, i % 2 === 0 ? "even" : "odd", i < 50 ? "low" : "high"])
      }));
      const engine = new BitSearchEngine<Item>(post => post.tags, () => 0, posts);
      const result = engine.search(parseSearchExpression("low ( even ~ -high )"));

      expect(result.map(p => p.id)).toEqual(posts.filter(p => p.id < 50).map(p => p.id));
      expect(result.every(p => p.id < 50)).toBe(true);
    });

    test("filters results to the given candidate subset", () => {
      const items = [createTaggedItem("1", "apple"), createTaggedItem("2", "apple"), createTaggedItem("3", "apple")];
      const engine = createTaggedEngine(items);

      expect(getSortedIds(engine.search(parseSearchExpression("apple"), [items[0], items[2]]))).toEqual(["1", "3"]);
    });

    test("returns only the candidate subset for an empty query", () => {
      const items = [createTaggedItem("1", "apple"), createTaggedItem("2", "apple"), createTaggedItem("3", "apple")];
      const engine = createTaggedEngine(items);

      expect(getSortedIds(engine.search(parseSearchExpression(""), [items[0], items[2]]))).toEqual(["1", "3"]);
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
  });

  describe("index", () => {
    test("re-indexes the corpus", () => {
      const engine = new BitSearchEngine<Fruit>(fruit => fruit.tags, () => 0, []);

      expect(engine.search(parseSearchExpression("red"))).toEqual([]);
      engine.rebuild(fruitDocs);
      expect(engine.search(parseSearchExpression("red")).length).toBeGreaterThan(0);
    });
  });

  describe("add", () => {
    test("makes new docs matchable, including by wildcard and empty query", () => {
      const engine = createTaggedEngine([createTaggedItem("1", "apple")]);

      engine.add([createTaggedItem("2", "cot")]);
      expect(getSortedIds(engine.search(parseSearchExpression("cot")))).toEqual(["2"]);
      expect(getSortedIds(engine.search(parseSearchExpression("( c* ~ a* )")))).toEqual(["1", "2"]);
      expect(engine.search(parseSearchExpression("")).length).toBe(2);
    });

    test("grows capacity when adds exceed the initial width", () => {
      const engine = createTaggedEngine([createTaggedItem("seed", "tag")]);

      for (let i = 0; i < 200; i += 1) {
        engine.add([createTaggedItem(`x${i}`, "tag")]);
      }
      expect(engine.search(parseSearchExpression("tag")).length).toBe(201);
      expect(engine.search(parseSearchExpression("")).length).toBe(201);
    });

    test("stays correct when a term crosses the sparse/dense threshold", () => {
      const engine = createTaggedEngine([]);
      const items = Array.from({ length: 5 }, (_, i) => createTaggedItem(String(i), "shared"));

      items.forEach((item, i) => {
        engine.add([item]);
        expect(getSortedIds(engine.search(parseSearchExpression("shared")))).toEqual(items.slice(0, i + 1).map(it => it.id).sort());
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

      expect(engine.search(parseSearchExpression("ct"))).toEqual([]);
      expect(getSortedIds(engine.search(parseSearchExpression("apple")))).toEqual(["1"]);
    });

    test("drops a term no doc references and adds a new one, keeping wildcards correct", () => {
      const a = createTaggedItem("1", "apple", "unique");
      const b = createTaggedItem("2", "apple");
      const engine = createTaggedEngine([a, b]);

      engine.update([createCorrection(a, "apple", "fresh")]);

      expect(engine.search(parseSearchExpression("unique"))).toEqual([]);
      expect(engine.search(parseSearchExpression("uni*"))).toEqual([]);
      expect(getSortedIds(engine.search(parseSearchExpression("fresh")))).toEqual(["1"]);
      expect(getSortedIds(engine.search(parseSearchExpression("fre*")))).toEqual(["1"]);
      expect(getSortedIds(engine.search(parseSearchExpression("apple")))).toEqual(["1", "2"]);
    });

    test("still resolves a wildcard over terms it left untouched", () => {
      const banana = createTaggedItem("3", "banana");
      const engine = createTaggedEngine([
        createTaggedItem("1", "apple"),
        createTaggedItem("2", "apricot"),
        banana
      ]);

      engine.update([createCorrection(banana, "cherry")]);

      expect(getSortedIds(engine.search(parseSearchExpression("ap*")))).toEqual(["1", "2"]);
      expect(getSortedIds(engine.search(parseSearchExpression("apple")))).toEqual(["1"]);
      expect(getSortedIds(engine.search(parseSearchExpression("apricot")))).toEqual(["2"]);
      expect(getSortedIds(engine.search(parseSearchExpression("cherry")))).toEqual(["3"]);
    });

    test("keeps wildcard resolution intact across a batch of docs sharing a term", () => {
      const engine = createTaggedEngine([]);
      const shared = Array.from({ length: 20 }, (_, i) => createTaggedItem(String(i), "shared"));

      engine.add(shared);
      expect(getSortedIds(engine.search(parseSearchExpression("shar*"))).length).toBe(20);

      engine.update(shared.map(item => createCorrection(item, "moved")));
      expect(engine.search(parseSearchExpression("shar*"))).toEqual([]);
      expect(engine.search(parseSearchExpression("shared"))).toEqual([]);
      expect(getSortedIds(engine.search(parseSearchExpression("moved"))).length).toBe(20);
    });

    test("ignores old terms that were never indexed", () => {
      const target = createTaggedItem("1", "apple");
      const engine = createTaggedEngine([target, createTaggedItem("2", "apple")]);

      engine.update([{ doc: target, oldTerms: new Set(["apple", "ghost"]), newTerms: new Set(["apple", "fresh"]) }]);

      expect(getSortedIds(engine.search(parseSearchExpression("apple")))).toEqual(["1", "2"]);
      expect(getSortedIds(engine.search(parseSearchExpression("fresh")))).toEqual(["1"]);
      expect(engine.search(parseSearchExpression("ghost"))).toEqual([]);
    });

    test("ignores docs that were never indexed", () => {
      const engine = createTaggedEngine([createTaggedItem("1", "apple")]);
      const stranger = createTaggedItem("stranger", "apple");

      engine.update([createCorrection(stranger, "fresh")]);

      expect(engine.search(parseSearchExpression("fresh"))).toEqual([]);
      expect(getSortedIds(engine.search(parseSearchExpression("apple")))).toEqual(["1"]);
    });
  });
});
