import { Fruit, FruitName, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { Metric, Searchable } from "@/types/search";
import { MetricDoc, metricDocs, metricSearchCases, searchCases } from "@/lib/search/testing/search_cases";
import { describe, expect, test } from "vitest";
import { SetSearchEngine } from "@/lib/search/engine/set/set_search_engine";

type Doc = Searchable & { name: string; metrics: Partial<Record<Metric, number>>; getMetric: (metric: Metric) => number };

function doc(name: string, tags: string[], metrics: Partial<Record<Metric, number>> = {}): Doc {
  return {
    name,
    tags: new Set(tags),
    metrics,
    getMetric(metric: Metric): number {
      return this.metrics[metric] ?? 0;
    }
  };
}

const apple = doc("apple", ["red", "sweet", "fruit"], { score: 10 });
const banana = doc("banana", ["yellow", "sweet", "fruit"], { score: 20 });
const cherry = doc("cherry", ["red", "tart", "fruit"], { score: 30 });
const docs = [apple, banana, cherry];

function engine(seed: Doc[] = docs): SetSearchEngine<Doc> {
  return new SetSearchEngine<Doc>(item => item.tags, (item, metric) => item.getMetric(metric), seed);
}

function search(query: string, engineToSearch: SetSearchEngine<Doc> = engine(), candidates: Doc[] = docs): string[] {
  return engineToSearch.search(query, candidates).map(item => item.name).sort();
}

describe("SearchEngine", () => {
  test("empty query returns every candidate", () => {
    expect(search("")).toEqual(["apple", "banana", "cherry"]);
  });

  test("exact term", () => {
    expect(search("red")).toEqual(["apple", "cherry"]);
  });

  test("negated exact term", () => {
    expect(search("fruit -red")).toEqual(["banana"]);
  });

  test("and terms", () => {
    expect(search("red sweet")).toEqual(["apple"]);
  });

  test("or group", () => {
    expect(search("( red ~ yellow )")).toEqual(["apple", "banana", "cherry"]);
  });

  test("prefix wildcard", () => {
    expect(search("swe*")).toEqual(["apple", "banana"]);
  });

  test("suffix wildcard", () => {
    expect(search("*eet")).toEqual(["apple", "banana"]);
  });

  test("a positive wildcard matching nothing yields nothing", () => {
    expect(search("zzz*")).toEqual([]);
  });
});

describe("SearchEngine end-to-end", () => {
  const fruitEngine = new SetSearchEngine<Fruit>(fruit => fruit.tags, () => 0, fruitDocs);

  function assertMatches(query: string, expectedNames: FruitName[]): void {
    const expected = expectedNames.slice().sort();
    const actual = fruitEngine.search(query, fruitDocs).map(item => item.name).sort();

    expect(actual, query).toEqual(expected);
  }

  for (const group of searchCases) {
    test(group.name, () => {
      group.run(assertMatches);
    });
  }
});

describe("SearchEngine mutation", () => {
  test("add makes a new doc and its terms searchable, including by wildcard", () => {
    const searchEngine = engine();
    const mango = doc("mango", ["orange", "tropical"]);
    const candidates = [...docs, mango];

    expect(search("orange", searchEngine, candidates)).toEqual([]);
    expect(search("trop*", searchEngine, candidates)).toEqual([]);

    searchEngine.add(mango);

    expect(search("orange", searchEngine, candidates)).toEqual(["mango"]);
    expect(search("trop*", searchEngine, candidates)).toEqual(["mango"]);
  });

  test("remove drops a doc's unique terms from the wildcard resolver", () => {
    const searchEngine = engine();

    expect(search("tar*", searchEngine)).toEqual(["cherry"]);

    searchEngine.remove(cherry);

    expect(search("tar*", searchEngine, [apple, banana])).toEqual([]);
  });

  test("index rebuilds the corpus from a fresh set of docs", () => {
    const searchEngine = new SetSearchEngine<Doc>(item => item.tags, (item, metric) => item.getMetric(metric));
    const kiwi = doc("kiwi", ["green", "fuzzy"]);

    expect(search("green", searchEngine, [kiwi])).toEqual([]);

    searchEngine.index([kiwi]);

    expect(search("green", searchEngine, [kiwi])).toEqual(["kiwi"]);
    expect(search("fuz*", searchEngine, [kiwi])).toEqual(["kiwi"]);
  });
});

describe("SearchEngine matches the shared metric cases", () => {
  const metricEngine = new SetSearchEngine<MetricDoc>(item => item.tags, (item, metric) => item.getMetric(metric), metricDocs);

  function assertMatches(query: string, expectedNames: string[]): void {
    const expected = expectedNames.slice().sort();
    const actual = metricEngine.search(query, metricDocs).map(item => item.name).sort();

    expect(actual, query).toEqual(expected);
  }

  for (const group of metricSearchCases) {
    test(group.name, () => {
      group.run(assertMatches);
    });
  }
});
