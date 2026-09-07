import { Fruit, FruitName, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { Metric, Searchable } from "@/types/search";
import { describe, expect, test } from "vitest";
import { SearchEngine } from "@/lib/search/engine/search_engine";
import { searchCases } from "@/lib/search/testing/search_cases";

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

function engine(seed: Doc[] = docs): SearchEngine<Doc> {
  return new SearchEngine<Doc>(item => item.tags, (item, metric) => item.getMetric(metric), seed);
}

function search(query: string, engineToSearch: SearchEngine<Doc> = engine(), candidates: Doc[] = docs): string[] {
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
  const fruitEngine = new SearchEngine<Fruit>(fruit => fruit.tags, () => 0, fruitDocs);

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
    const searchEngine = new SearchEngine<Doc>(item => item.tags, (item, metric) => item.getMetric(metric));
    const kiwi = doc("kiwi", ["green", "fuzzy"]);

    expect(search("green", searchEngine, [kiwi])).toEqual([]);

    searchEngine.index([kiwi]);

    expect(search("green", searchEngine, [kiwi])).toEqual(["kiwi"]);
    expect(search("fuz*", searchEngine, [kiwi])).toEqual(["kiwi"]);
  });
});

describe("SearchEngine metric", () => {
  const scored = [doc("apple", ["red"], { score: 10 }), doc("banana", ["yellow"], { score: 20 }), doc("cherry", ["red"], { score: 30 })];
  const metricEngine = new SearchEngine<Doc>(item => item.tags, (item, metric) => item.getMetric(metric), scored);

  function searchScored(query: string): string[] {
    return metricEngine.search(query, scored).map(item => item.name).sort();
  }

  test("constant comparison", () => {
    expect(searchScored("score:>15")).toEqual(["banana", "cherry"]);
  });

  test("negated comparison", () => {
    expect(searchScored("-score:>15")).toEqual(["apple"]);
  });

  test("metric combined with a tag", () => {
    expect(searchScored("red score:>15")).toEqual(["cherry"]);
  });

  test("metric inside an or group", () => {
    expect(searchScored("( score:>25 ~ yellow )")).toEqual(["banana", "cherry"]);
  });
});

describe("SearchEngine relative metric", () => {
  const shaped = [
    doc("wide", ["a"], { width: 400, height: 100, score: 5 }),
    doc("tall", ["b"], { width: 100, height: 400, score: 9 }),
    doc("square", ["c"], { width: 200, height: 200, score: 5 })
  ];
  const shapedEngine = new SearchEngine<Doc>(item => item.tags, (item, metric) => item.getMetric(metric), shaped);

  function searchShaped(query: string): string[] {
    return shapedEngine.search(query, shaped).map(item => item.name).sort();
  }

  test("metric compared to another metric", () => {
    expect(searchShaped("width:>height")).toEqual(["wide"]);
  });

  test("negated relative comparison", () => {
    expect(searchShaped("-width:>height")).toEqual(["square", "tall"]);
  });

  test("relative comparison combined with a tag", () => {
    expect(searchShaped("width:height a")).toEqual([]);
    expect(searchShaped("width:height c")).toEqual(["square"]);
  });

  test("two relative comparisons resolve in one query", () => {
    expect(searchShaped("width:>height score:<9")).toEqual(["wide"]);
  });

  test("relative comparison inside an or group", () => {
    expect(searchShaped("( width:>height ~ b )")).toEqual(["tall", "wide"]);
  });

  test("a metric compared to itself", () => {
    expect(searchShaped("width:width")).toEqual(["square", "tall", "wide"]);
    expect(searchShaped("width:>width")).toEqual([]);
    expect(searchShaped("width:<width")).toEqual([]);
  });

  test("a negated metric compared to itself", () => {
    expect(searchShaped("-width:width")).toEqual([]);
    expect(searchShaped("-width:>width")).toEqual(["square", "tall", "wide"]);
    expect(searchShaped("-width:<width")).toEqual(["square", "tall", "wide"]);
  });
});
