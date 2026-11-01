import { describe, expect, test } from "vitest";
import { Metric } from "@/core/domain/search/metric";
import { Searchable } from "@/core/domain/search/searchable";
import { SetSearchEngine } from "@/core/domain/search/engines/set/set_search_engine";
import { StringInterner } from "@/core/utils/string/string_interner";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";

type Doc = Searchable & { name: string; tags: Set<string>; metrics: Partial<Record<Metric, number>>; getMetric: (metric: Metric) => number };

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

const appleDoc = createDoc("apple", ["red", "sweet", "fruit"], { score: 10 });
const bananaDoc = createDoc("banana", ["yellow", "sweet", "fruit"], { score: 20 });
const cherryDoc = createDoc("cherry", ["red", "tart", "fruit"], { score: 30 });
const docs = [appleDoc, bananaDoc, cherryDoc];

function createEngine(seedDocs: Doc[] = docs): SetSearchEngine<Doc> {
  return new SetSearchEngine<Doc>({
    getTerms: doc => doc.tags,
    getMetric: (doc, metric) => doc.getMetric(metric),
    stringInterner: new StringInterner()
  }, seedDocs);
}

function search(query: string, setSearchEngine: SetSearchEngine<Doc> = createEngine(), candidateDocs: Doc[] = docs): string[] {
  return setSearchEngine.search(parseSearchExpression(query), candidateDocs).map(doc => doc.name).sort();
}

describe("SetSearchEngine", () => {
  describe("search", () => {
    test("returns every candidate for an empty query", () => {
      expect(search("")).toEqual(["apple", "banana", "cherry"]);
    });

    test("matches an exact term", () => {
      expect(search("red")).toEqual(["apple", "cherry"]);
    });

    test("excludes a negated exact term", () => {
      expect(search("fruit -red")).toEqual(["banana"]);
    });

    test("intersects and terms", () => {
      expect(search("red sweet")).toEqual(["apple"]);
    });

    test("unions an or group", () => {
      expect(search("( red ~ yellow )")).toEqual(["apple", "banana", "cherry"]);
    });

    test("matches a prefix wildcard", () => {
      expect(search("swe*")).toEqual(["apple", "banana"]);
    });

    test("matches a suffix wildcard", () => {
      expect(search("*eet")).toEqual(["apple", "banana"]);
    });

    test("matches nothing for a positive wildcard that matches no term", () => {
      expect(search("zzz*")).toEqual([]);
    });
  });

  describe("add", () => {
    test("makes a new doc and its terms searchable, including by wildcard", () => {
      const setSearchEngine = createEngine();
      const mangoDoc = createDoc("mango", ["orange", "tropical"]);
      const candidateDocs = [...docs, mangoDoc];

      expect(search("orange", setSearchEngine, candidateDocs)).toEqual([]);
      expect(search("trop*", setSearchEngine, candidateDocs)).toEqual([]);

      setSearchEngine.add([mangoDoc]);

      expect(search("orange", setSearchEngine, candidateDocs)).toEqual(["mango"]);
      expect(search("trop*", setSearchEngine, candidateDocs)).toEqual(["mango"]);
    });

    test("makes a new doc matchable by metric queries that already ran", () => {
      const setSearchEngine = createEngine();
      const durianDoc = createDoc("durian", ["spiky"], { score: 40, width: 50, height: 10 });
      const candidateDocs = [...docs, durianDoc];

      expect(search("score:>25", setSearchEngine, candidateDocs)).toEqual(["cherry"]);
      expect(search("width:>height", setSearchEngine, candidateDocs)).toEqual([]);

      setSearchEngine.add([durianDoc]);

      expect(search("score:>25", setSearchEngine, candidateDocs)).toEqual(["cherry", "durian"]);
      expect(search("width:>height", setSearchEngine, candidateDocs)).toEqual(["durian"]);
    });
  });

  describe("update", () => {
    test("drops a doc's now-unreferenced terms from the wildcard resolver", () => {
      const plumDoc = createDoc("plum", ["red", "tart", "fruit"], { score: 30 });
      const candidateDocs = [appleDoc, bananaDoc, plumDoc];
      const setSearchEngine = createEngine(candidateDocs);

      expect(search("tar*", setSearchEngine, candidateDocs)).toEqual(["plum"]);

      const oldTerms = new Set(plumDoc.tags);

      plumDoc.tags.clear();
      ["red", "fruit"].forEach(tag => plumDoc.tags.add(tag));
      setSearchEngine.update([{ doc: plumDoc, oldTerms, newTerms: plumDoc.tags }]);

      expect(search("tar*", setSearchEngine, candidateDocs)).toEqual([]);
      expect(search("red", setSearchEngine, candidateDocs)).toEqual(["apple", "plum"]);
    });

    test("makes a doc's newly introduced terms searchable, including by wildcard", () => {
      const kiwiDoc = createDoc("kiwi", ["green"]);
      const candidateDocs = [appleDoc, kiwiDoc];
      const setSearchEngine = createEngine(candidateDocs);
      const oldTerms = new Set(kiwiDoc.tags);

      kiwiDoc.tags.add("fuzzy");
      setSearchEngine.update([{ doc: kiwiDoc, oldTerms, newTerms: kiwiDoc.tags }]);

      expect(search("fuzzy", setSearchEngine, candidateDocs)).toEqual(["kiwi"]);
      expect(search("fuz*", setSearchEngine, candidateDocs)).toEqual(["kiwi"]);
    });
  });

  describe("index", () => {
    test("makes new docs matchable by metric queries that already ran", () => {
      const setSearchEngine = createEngine();
      const durianDoc = createDoc("durian", ["spiky"], { score: 40, width: 50, height: 10 });
      const candidateDocs = [...docs, durianDoc];

      expect(search("score:>25", setSearchEngine, candidateDocs)).toEqual(["cherry"]);
      expect(search("width:>height", setSearchEngine, candidateDocs)).toEqual([]);

      setSearchEngine.rebuild([durianDoc]);

      expect(search("score:>25", setSearchEngine, candidateDocs)).toEqual(["cherry", "durian"]);
      expect(search("width:>height", setSearchEngine, candidateDocs)).toEqual(["durian"]);
    });

    test("rebuilds the corpus from a fresh set of docs", () => {
      const setSearchEngine = new SetSearchEngine<Doc>({
        getTerms: (doc): Iterable<string> => doc.tags,
        getMetric: (doc, metric): number => doc.getMetric(metric),
        stringInterner: new StringInterner()
      });
      const kiwiDoc = createDoc("kiwi", ["green", "fuzzy"]);

      expect(search("green", setSearchEngine, [kiwiDoc])).toEqual([]);

      setSearchEngine.rebuild([kiwiDoc]);

      expect(search("green", setSearchEngine, [kiwiDoc])).toEqual(["kiwi"]);
      expect(search("fuz*", setSearchEngine, [kiwiDoc])).toEqual(["kiwi"]);
    });
  });
});
