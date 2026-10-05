import { Searchable } from "@/core/search/searchable";
import { METRICS, Metric } from "@/core/domain/post/post";
import { describe, expect, test } from "vitest";
import { parseMetricSearchTerm, parseSearchTerm, parseWildcardSearchTerm } from "@/core/search/parsers/search_term_parser";
import { DocResolver } from "@/core/search/engines/set/resolution/doc_resolver";
import { InvertedIndex } from "@/core/search/engines/set/indexes/inverted_index";
import { MetricIndex } from "@/core/search/engines/set/indexes/metric_index";
import { PositionIndex } from "@/core/search/engines/set/indexes/position_index";
import { RelativeMetricIndex } from "@/core/search/engines/set/indexes/relative_metric_index";
import { WildcardDocResolver } from "@/core/search/engines/set/resolution/wildcard_doc_resolver";

type Doc = Searchable & { name: string; metrics: Partial<Record<Metric, number>> };

function createDoc(name: string, tags: string[], metrics: Partial<Record<Metric, number>>): Doc {
  return { name, tags: new Set(tags), metrics };
}

const hd = createDoc("hd", ["video", "red"], { width: 1_920, height: 1_080, score: 50, id: 1_000, duration: 120 });
const sd = createDoc("sd", ["video", "blue"], { width: 1_280, height: 720, score: 25, id: 500, duration: 60 });
const square = createDoc("square", ["image", "red"], { width: 1_080, height: 1_080, score: 100, id: 2_000, duration: 0 });
const docs = [hd, sd, square];

const metricFor = (item: Doc, metric: Metric): number => item.metrics[metric] ?? 0;

function getSortedNames(set: ReadonlySet<Doc>): string[] {
  return [...set].map(item => item.name).sort();
}

function createResolver(): DocResolver<Doc> {
  const termIndex = new InvertedIndex<Doc>(item => item.tags);
  const metricIndex = new MetricIndex<Doc>([...METRICS], metricFor);
  const relativeMetricIndex = new RelativeMetricIndex<Doc>([...METRICS], metricFor);
  const positionIndex = new PositionIndex<Doc>();

  docs.forEach(item => termIndex.addDoc(item));
  positionIndex.build(docs);
  const wildcardResolver = new WildcardDocResolver<Doc>(termIndex);

  wildcardResolver.index(termIndex.indexedTerms());
  return new DocResolver<Doc>({ termIndex, metricIndex, relativeMetricIndex, positionIndex, wildcardResolver });
}

describe("DocResolver", () => {
  describe("resolve", () => {
    test("routes a wildcard term to the union of matching terms' docs", () => {
      const resolver = createResolver();

      expect(getSortedNames(resolver.resolve(parseWildcardSearchTerm("re*")))).toEqual(["hd", "square"]);
    });

    test("routes a non-metric term to the term index", () => {
      const resolver = createResolver();

      expect(getSortedNames(resolver.resolve(parseSearchTerm("video")))).toEqual(["hd", "sd"]);
      expect(getSortedNames(resolver.resolve(parseSearchTerm("red")))).toEqual(["hd", "square"]);
    });

    test("resolves an unknown term to nothing", () => {
      const resolver = createResolver();

      expect(getSortedNames(resolver.resolve(parseSearchTerm("missing")))).toEqual([]);
    });

    test("routes a constant metric term to the metric index", () => {
      const resolver = createResolver();

      expect(getSortedNames(resolver.resolve(parseMetricSearchTerm("score:>40")))).toEqual(["hd", "square"]);
      expect(getSortedNames(resolver.resolve(parseMetricSearchTerm("width:1080")))).toEqual(["square"]);
      expect(getSortedNames(resolver.resolve(parseMetricSearchTerm("duration:<100")))).toEqual(["sd", "square"]);
    });

    test("resolves a relative metric term against the corpus", () => {
      const resolver = createResolver();

      expect(getSortedNames(resolver.resolve(parseMetricSearchTerm("width:>height")))).toEqual(["hd", "sd"]);
    });

    test("resolves an equal relative metric term", () => {
      const resolver = createResolver();

      expect(getSortedNames(resolver.resolve(parseMetricSearchTerm("width:height")))).toEqual(["square"]);
    });

    test("resolves each relative term consistently", () => {
      const resolver = createResolver();

      expect(getSortedNames(resolver.resolve(parseMetricSearchTerm("width:>height")))).toEqual(["hd", "sd"]);
      expect(getSortedNames(resolver.resolve(parseMetricSearchTerm("height:<width")))).toEqual(["hd", "sd"]);
    });

    test("matches every doc for a tautological equality relative term", () => {
      const resolver = createResolver();

      expect(getSortedNames(resolver.resolve(parseMetricSearchTerm("width:width")))).toEqual(["hd", "sd", "square"]);
    });

    test("matches nothing for a tautological inequality relative term", () => {
      const resolver = createResolver();

      expect(getSortedNames(resolver.resolve(parseMetricSearchTerm("width:>width")))).toEqual([]);
      expect(getSortedNames(resolver.resolve(parseMetricSearchTerm("width:<width")))).toEqual([]);
    });
  });
});
