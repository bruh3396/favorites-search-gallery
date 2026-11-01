import { MetricSearchable, Searchable } from "@/core/domain/search/searchable";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/core/domain/search/engines/bit/bit_search_engine";
import { FRUIT_CORPUS } from "@/core/domain/search/testing/fruit_corpus";
import { Fruit } from "@/core/domain/search/testing/fruit";
import { StringInterner } from "@/core/utils/string/string_interner";
import { TermUpdate } from "@/core/domain/search/engines/term_update";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";

type MetricDoc = MetricSearchable & { name: string };

interface TaggedItem extends Searchable {
  id: string;
  tags: Set<string>;
}

function createFruitEngine(): BitSearchEngine<Fruit> {
  return new BitSearchEngine<Fruit>({ getTerms: fruit => fruit.tags, getMetric: () => 0, stringInterner: new StringInterner() }, FRUIT_CORPUS.fruits);
}

function searchFruitNames(query: string): string[] {
  return createFruitEngine().search(parseSearchExpression(query)).map(fruit => fruit.name).sort();
}

function createTaggedItem(id: string, ...tags: string[]): TaggedItem {
  return { id, tags: new Set(tags) };
}

function createTaggedEngine(taggedItems: TaggedItem[]): BitSearchEngine<TaggedItem> {
  return new BitSearchEngine<TaggedItem>({ getTerms: taggedItem => taggedItem.tags, getMetric: () => 0, stringInterner: new StringInterner() }, taggedItems);
}

function getSortedIds(taggedItems: readonly TaggedItem[]): string[] {
  return taggedItems.map(taggedItem => taggedItem.id).sort();
}

function createCorrection(taggedItem: TaggedItem, ...newTags: string[]): TermUpdate<TaggedItem> {
  const oldTerms = new Set(taggedItem.tags);

  taggedItem.tags.clear();
  newTags.forEach(tag => taggedItem.tags.add(tag));
  return { doc: taggedItem, oldTerms, newTerms: taggedItem.tags };
}

function createMetricDoc(name: string, metrics: Record<string, number>, tags: string[] = []): MetricDoc {
  return { name, tags: new Set(tags), getMetric: (metric): number => metrics[metric] ?? 0 };
}

function createMetricEngine(metricDocs: MetricDoc[]): BitSearchEngine<MetricDoc> {
  return new BitSearchEngine<MetricDoc>({
    getTerms: metricDoc => metricDoc.tags,
    getMetric: (metricDoc, metric) => metricDoc.getMetric(metric),
    stringInterner: new StringInterner()
  }, metricDocs);
}

function searchMetricNames(bitSearchEngine: BitSearchEngine<MetricDoc>, query: string): string[] {
  return bitSearchEngine.search(parseSearchExpression(query)).map(metricDoc => metricDoc.name).sort();
}

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
      expect(createFruitEngine().search(parseSearchExpression(""))).toEqual(FRUIT_CORPUS.fruits);
    });

    test("returns results in corpus order", () => {
      const matchedFruits = createFruitEngine().search(parseSearchExpression("sweet"));

      expect(matchedFruits.map(fruit => fruit.name)).toEqual(FRUIT_CORPUS.fruits.filter(fruit => fruit.tags.has("sweet")).map(fruit => fruit.name));
    });

    test("returns nothing when a required term matches no doc", () => {
      expect(createFruitEngine().search(parseSearchExpression("red nonexistenttag"))).toEqual([]);
    });

    test("handles negated OR across a multi-word corpus without phantom matches", () => {
      interface Item extends Searchable { id: number }
      const postItems: Item[] = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        tags: new Set([`n${i}`, i % 2 === 0 ? "even" : "odd", i < 50 ? "low" : "high"])
      }));
      const bitSearchEngine = new BitSearchEngine<Item>(
        { getTerms: (item): Iterable<string> => item.tags, getMetric: (): number => 0, stringInterner: new StringInterner() },
        postItems
      );
      const items = bitSearchEngine.search(parseSearchExpression("low ( even ~ -high )"));

      expect(items.map(item => item.id)).toEqual(postItems.filter(item => item.id < 50).map(item => item.id));
      expect(items.every(item => item.id < 50)).toBe(true);
    });

    test("filters results to the given candidate subset", () => {
      const taggedItems = [createTaggedItem("1", "apple"), createTaggedItem("2", "apple"), createTaggedItem("3", "apple")];
      const bitSearchEngine = createTaggedEngine(taggedItems);

      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("apple"), [taggedItems[0], taggedItems[2]]))).toEqual(["1", "3"]);
    });

    test("returns only the candidate subset for an empty query", () => {
      const taggedItems = [createTaggedItem("1", "apple"), createTaggedItem("2", "apple"), createTaggedItem("3", "apple")];
      const bitSearchEngine = createTaggedEngine(taggedItems);

      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression(""), [taggedItems[0], taggedItems[2]]))).toEqual(["1", "3"]);
    });

    test("returns the same docs for a repeated relative metric query", () => {
      const bitSearchEngine = createMetricEngine([createMetricDoc("wide", { width: 20, height: 10 }), createMetricDoc("tall", { width: 10, height: 20 })]);

      expect(searchMetricNames(bitSearchEngine, "width:>height")).toEqual(["wide"]);
      expect(searchMetricNames(bitSearchEngine, "width:>height")).toEqual(["wide"]);
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
      const bitSearchEngine = new BitSearchEngine<Fruit>(
        { getTerms: (fruit): Iterable<string> => fruit.tags, getMetric: (): number => 0, stringInterner: new StringInterner() },
        []
      );

      expect(bitSearchEngine.search(parseSearchExpression("red"))).toEqual([]);
      bitSearchEngine.rebuild(FRUIT_CORPUS.fruits);
      expect(bitSearchEngine.search(parseSearchExpression("red")).length).toBeGreaterThan(0);
    });
  });

  describe("add", () => {
    test("makes new docs matchable, including by wildcard and empty query", () => {
      const bitSearchEngine = createTaggedEngine([createTaggedItem("1", "apple")]);

      bitSearchEngine.add([createTaggedItem("2", "cot")]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("cot")))).toEqual(["2"]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("( c* ~ a* )")))).toEqual(["1", "2"]);
      expect(bitSearchEngine.search(parseSearchExpression("")).length).toBe(2);
    });

    test("grows capacity when adds exceed the initial width", () => {
      const bitSearchEngine = createTaggedEngine([createTaggedItem("seed", "tag")]);

      for (let i = 0; i < 200; i += 1) {
        bitSearchEngine.add([createTaggedItem(`x${i}`, "tag")]);
      }
      expect(bitSearchEngine.search(parseSearchExpression("tag")).length).toBe(201);
      expect(bitSearchEngine.search(parseSearchExpression("")).length).toBe(201);
    });

    test("stays correct when a term crosses the sparse/dense threshold", () => {
      const bitSearchEngine = createTaggedEngine([]);
      const taggedItems = Array.from({ length: 5 }, (_, i) => createTaggedItem(String(i), "shared"));

      taggedItems.forEach((taggedItem, i) => {
        bitSearchEngine.add([taggedItem]);
        expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("shared"))))
          .toEqual(taggedItems.slice(0, i + 1).map(({ id }) => id).sort());
      });
    });

    test("makes added docs visible to a relative metric query already answered", () => {
      const bitSearchEngine = createMetricEngine([createMetricDoc("wide", { width: 20, height: 10 })]);

      expect(searchMetricNames(bitSearchEngine, "width:>height")).toEqual(["wide"]);
      bitSearchEngine.add([createMetricDoc("wider", { width: 30, height: 10 })]);
      expect(searchMetricNames(bitSearchEngine, "width:>height")).toEqual(["wide", "wider"]);
    });
  });

  describe("update", () => {
    test("reflects corrected tags for a doc", () => {
      const taggedItem = createTaggedItem("1", "ct");
      const bitSearchEngine = createTaggedEngine([taggedItem]);

      bitSearchEngine.update([createCorrection(taggedItem, "apple")]);

      expect(bitSearchEngine.search(parseSearchExpression("ct"))).toEqual([]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("apple")))).toEqual(["1"]);
    });

    test("drops a term no doc references and adds a new one, keeping wildcards correct", () => {
      const firstTaggedItem = createTaggedItem("1", "apple", "unique");
      const secondTaggedItem = createTaggedItem("2", "apple");
      const bitSearchEngine = createTaggedEngine([firstTaggedItem, secondTaggedItem]);

      bitSearchEngine.update([createCorrection(firstTaggedItem, "apple", "fresh")]);

      expect(bitSearchEngine.search(parseSearchExpression("unique"))).toEqual([]);
      expect(bitSearchEngine.search(parseSearchExpression("uni*"))).toEqual([]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("fresh")))).toEqual(["1"]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("fre*")))).toEqual(["1"]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("apple")))).toEqual(["1", "2"]);
    });

    test("still resolves a wildcard over terms it left untouched", () => {
      const bananaTaggedItem = createTaggedItem("3", "banana");
      const bitSearchEngine = createTaggedEngine([
        createTaggedItem("1", "apple"),
        createTaggedItem("2", "apricot"),
        bananaTaggedItem
      ]);

      bitSearchEngine.update([createCorrection(bananaTaggedItem, "cherry")]);

      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("ap*")))).toEqual(["1", "2"]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("apple")))).toEqual(["1"]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("apricot")))).toEqual(["2"]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("cherry")))).toEqual(["3"]);
    });

    test("keeps wildcard resolution intact across a batch of docs sharing a term", () => {
      const bitSearchEngine = createTaggedEngine([]);
      const sharedTaggedItems = Array.from({ length: 20 }, (_, i) => createTaggedItem(String(i), "shared"));

      bitSearchEngine.add(sharedTaggedItems);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("shar*"))).length).toBe(20);

      bitSearchEngine.update(sharedTaggedItems.map(taggedItem => createCorrection(taggedItem, "moved")));
      expect(bitSearchEngine.search(parseSearchExpression("shar*"))).toEqual([]);
      expect(bitSearchEngine.search(parseSearchExpression("shared"))).toEqual([]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("moved"))).length).toBe(20);
    });

    test("ignores old terms that were never indexed", () => {
      const taggedItem = createTaggedItem("1", "apple");
      const bitSearchEngine = createTaggedEngine([taggedItem, createTaggedItem("2", "apple")]);

      bitSearchEngine.update([{ doc: taggedItem, oldTerms: new Set(["apple", "ghost"]), newTerms: new Set(["apple", "fresh"]) }]);

      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("apple")))).toEqual(["1", "2"]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("fresh")))).toEqual(["1"]);
      expect(bitSearchEngine.search(parseSearchExpression("ghost"))).toEqual([]);
    });

    test("ignores docs that were never indexed", () => {
      const bitSearchEngine = createTaggedEngine([createTaggedItem("1", "apple")]);
      const strangerTaggedItem = createTaggedItem("stranger", "apple");

      bitSearchEngine.update([createCorrection(strangerTaggedItem, "fresh")]);

      expect(bitSearchEngine.search(parseSearchExpression("fresh"))).toEqual([]);
      expect(getSortedIds(bitSearchEngine.search(parseSearchExpression("apple")))).toEqual(["1"]);
    });
  });
});
