import { Searchable, SearchableMetric } from "@/types/search";
import { beforeEach, describe, expect, test } from "vitest";
import { DocsResolver } from "@/lib/search/engine/docs_resolver";
import { InvertedIndex } from "@/lib/collection/inverted_index";
import { MetricIndex } from "@/lib/collection/metric_index";
import { parseMetricSearchTerm, parseSearchTerm } from "@/lib/search/parsers/search_term_parser";
import { parseSearchQuery } from "@/lib/search/parsers/search_term_group_parser";
import { searchableMetrics } from "@/types/guards";

type Doc = Searchable & { name: string; metrics: Partial<Record<SearchableMetric, number>> };

function doc(name: string, tags: string[], metrics: Partial<Record<SearchableMetric, number>>): Doc {
  return { name, tags: new Set(tags), metrics };
}

const hd = doc("hd", ["video", "red"], { width: 1920, height: 1080, score: 50, id: 1000, duration: 120 });
const sd = doc("sd", ["video", "blue"], { width: 1280, height: 720, score: 25, id: 500, duration: 60 });
const square = doc("square", ["image", "red"], { width: 1080, height: 1080, score: 100, id: 2000, duration: 0 });
const docs = [hd, sd, square];

const metricFor = (item: Doc, metric: SearchableMetric): number => item.metrics[metric] ?? 0;

function names(set: ReadonlySet<Doc>): string[] {
  return [...set].map(item => item.name).sort();
}

describe("DocsResolver", () => {
  let termIndex: InvertedIndex<Doc>;
  let metricIndex: MetricIndex<Doc>;
  let resolver: DocsResolver<Doc>;

  beforeEach(() => {
    termIndex = new InvertedIndex<Doc>(item => item.tags);
    docs.forEach(item => termIndex.addDoc(item));
    metricIndex = new MetricIndex<Doc>([...searchableMetrics], metricFor);
    metricIndex.build(termIndex.allDocs());
    resolver = new DocsResolver<Doc>(termIndex, metricIndex, metricFor);
  });

  describe("docsFor", () => {
    test("routes a non-metric term to the term index", () => {
      expect(names(resolver.docsFor(parseSearchTerm("video")))).toEqual(["hd", "sd"]);
      expect(names(resolver.docsFor(parseSearchTerm("red")))).toEqual(["hd", "square"]);
    });

    test("an unknown term resolves to nothing", () => {
      expect(names(resolver.docsFor(parseSearchTerm("missing")))).toEqual([]);
    });

    test("routes a constant metric term to the metric index", () => {
      expect(names(resolver.docsFor(parseMetricSearchTerm("score:>40")))).toEqual(["hd", "square"]);
      expect(names(resolver.docsFor(parseMetricSearchTerm("width:1080")))).toEqual(["square"]);
      expect(names(resolver.docsFor(parseMetricSearchTerm("duration:<100")))).toEqual(["sd", "square"]);
    });

    test("a relative metric term resolves to nothing before priming", () => {
      expect(names(resolver.docsFor(parseMetricSearchTerm("width:>height")))).toEqual([]);
    });
  });

  describe("prime", () => {
    test("resolves a relative metric term against the corpus", () => {
      const query = parseSearchQuery<Doc>("width:>height");

      resolver.prime(query);
      expect(names(resolver.docsFor(query.allTerms()[0]))).toEqual(["hd", "sd"]);
    });

    test("resolves an equal relative metric term", () => {
      const query = parseSearchQuery<Doc>("width:height");

      resolver.prime(query);
      expect(names(resolver.docsFor(query.allTerms()[0]))).toEqual(["square"]);
    });

    test("primes each relative term in the query independently", () => {
      const query = parseSearchQuery<Doc>("width:>height height:<width");

      resolver.prime(query);
      const [first, second] = query.allTerms();

      expect(names(resolver.docsFor(first))).toEqual(["hd", "sd"]);
      expect(names(resolver.docsFor(second))).toEqual(["hd", "sd"]);
    });

    test("a later prime clears relative results from an earlier query", () => {
      const firstQuery = parseSearchQuery<Doc>("width:>height");
      const firstTerm = firstQuery.allTerms()[0];

      resolver.prime(firstQuery);
      expect(names(resolver.docsFor(firstTerm))).toEqual(["hd", "sd"]);

      resolver.prime(parseSearchQuery<Doc>("score:>0"));
      expect(names(resolver.docsFor(firstTerm))).toEqual([]);
    });

    test("evaluates relative terms through the injected accessor, not doc.getMetric", () => {
      const query = parseSearchQuery<Doc>("width:>height");

      resolver.prime(query);
      expect("getMetric" in hd).toBe(false);
      expect(names(resolver.docsFor(query.allTerms()[0]))).toEqual(["hd", "sd"]);
    });
  });

  describe("allDocs", () => {
    test("returns every indexed doc", () => {
      expect(names(resolver.allDocs())).toEqual(["hd", "sd", "square"]);
    });
  });
});
