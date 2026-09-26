import { Metric, Searchable } from "@/types/search";
import { describe, expect, test } from "vitest";
import { SetSearchEngine } from "@/lib/search/engines/set/set_search_engine";

type Doc = Searchable & { name: string; metrics: Partial<Record<Metric, number>>; getMetric: (metric: Metric) => number };

function createDoc(name: string, tags: string[], metrics: Partial<Record<Metric, number>> = {}): Doc {
  return {
    name,
    tags: new Set(tags),
    metrics,
    getMetric(metric: Metric): number {
      return this.metrics[metric] ?? 0;
    }
  };
}

const apple = createDoc("apple", ["red", "sweet", "fruit"], { score: 10 });
const banana = createDoc("banana", ["yellow", "sweet", "fruit"], { score: 20 });
const cherry = createDoc("cherry", ["red", "tart", "fruit"], { score: 30 });
const docs = [apple, banana, cherry];

function createEngine(seed: Doc[] = docs): SetSearchEngine<Doc> {
  return new SetSearchEngine<Doc>(item => item.tags, (item, metric) => item.getMetric(metric), seed);
}

function search(query: string, engineToSearch: SetSearchEngine<Doc> = createEngine(), candidates: Doc[] = docs): string[] {
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

describe("SearchEngine complementOf", () => {
  function namesOf(items: Doc[]): string[] {
    return items.map(item => item.name).sort();
  }

  test("returns every indexed doc not in the current set", () => {
    expect(namesOf(createEngine().complementOf([apple]))).toEqual(["banana", "cherry"]);
  });

  test("narrows the complement to docs matching the filter", () => {
    expect(namesOf(createEngine().complementOf([apple], "red"))).toEqual(["cherry"]);
  });
});

describe("SearchEngine mutation", () => {
  test("add makes a new doc and its terms searchable, including by wildcard", () => {
    const searchEngine = createEngine();
    const mango = createDoc("mango", ["orange", "tropical"]);
    const candidates = [...docs, mango];

    expect(search("orange", searchEngine, candidates)).toEqual([]);
    expect(search("trop*", searchEngine, candidates)).toEqual([]);

    searchEngine.add([mango]);

    expect(search("orange", searchEngine, candidates)).toEqual(["mango"]);
    expect(search("trop*", searchEngine, candidates)).toEqual(["mango"]);
  });

  test("update drops a doc's now-unreferenced terms from the wildcard resolver", () => {
    const plum = createDoc("plum", ["red", "tart", "fruit"], { score: 30 });
    const candidates = [apple, banana, plum];
    const searchEngine = createEngine(candidates);

    expect(search("tar*", searchEngine, candidates)).toEqual(["plum"]);

    const oldTerms = new Set(plum.tags);

    plum.tags.clear();
    ["red", "fruit"].forEach(tag => plum.tags.add(tag));
    searchEngine.update([{ doc: plum, oldTerms, newTerms: plum.tags }]);

    expect(search("tar*", searchEngine, candidates)).toEqual([]);
    expect(search("red", searchEngine, candidates)).toEqual(["apple", "plum"]);
  });

  test("update makes a doc's newly introduced terms searchable, including by wildcard", () => {
    const kiwi = createDoc("kiwi", ["green"]);
    const candidates = [apple, kiwi];
    const searchEngine = createEngine(candidates);
    const oldTerms = new Set(kiwi.tags);

    kiwi.tags.add("fuzzy");
    searchEngine.update([{ doc: kiwi, oldTerms, newTerms: kiwi.tags }]);

    expect(search("fuzzy", searchEngine, candidates)).toEqual(["kiwi"]);
    expect(search("fuz*", searchEngine, candidates)).toEqual(["kiwi"]);
  });

  test("add makes a new doc matchable by metric queries that already ran", () => {
    const searchEngine = createEngine();
    const durian = createDoc("durian", ["spiky"], { score: 40, width: 50, height: 10 });
    const candidates = [...docs, durian];

    expect(search("score:>25", searchEngine, candidates)).toEqual(["cherry"]);
    expect(search("width:>height", searchEngine, candidates)).toEqual([]);

    searchEngine.add([durian]);

    expect(search("score:>25", searchEngine, candidates)).toEqual(["cherry", "durian"]);
    expect(search("width:>height", searchEngine, candidates)).toEqual(["durian"]);
  });

  test("index makes new docs matchable by metric queries that already ran", () => {
    const searchEngine = createEngine();
    const durian = createDoc("durian", ["spiky"], { score: 40, width: 50, height: 10 });
    const candidates = [...docs, durian];

    expect(search("score:>25", searchEngine, candidates)).toEqual(["cherry"]);
    expect(search("width:>height", searchEngine, candidates)).toEqual([]);

    searchEngine.index([durian]);

    expect(search("score:>25", searchEngine, candidates)).toEqual(["cherry", "durian"]);
    expect(search("width:>height", searchEngine, candidates)).toEqual(["durian"]);
  });

  test("index rebuilds the corpus from a fresh set of docs", () => {
    const searchEngine = new SetSearchEngine<Doc>(item => item.tags, (item, metric) => item.getMetric(metric));
    const kiwi = createDoc("kiwi", ["green", "fuzzy"]);

    expect(search("green", searchEngine, [kiwi])).toEqual([]);

    searchEngine.index([kiwi]);

    expect(search("green", searchEngine, [kiwi])).toEqual(["kiwi"]);
    expect(search("fuz*", searchEngine, [kiwi])).toEqual(["kiwi"]);
  });
});
