import { METRICS, Metric } from "@/core/domain/search/metric";
import { describe, expect, test } from "vitest";
import { parseMetricSearchTerm, parseSearchTerm, parseWildcardSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { DocResolver } from "@/core/domain/search/engines/set/resolution/doc_resolver";
import { InvertedIndex } from "@/core/domain/search/engines/set/indexes/inverted_index";
import { MetricIndex } from "@/core/domain/search/engines/set/indexes/metric_index";
import { PositionIndex } from "@/core/domain/search/engines/set/indexes/position_index";
import { RelativeMetricIndex } from "@/core/domain/search/engines/set/indexes/relative_metric_index";
import { Searchable } from "@/core/domain/search/searchable";
import { StringInterner } from "@/core/utils/string/string_interner";
import { WildcardDocResolver } from "@/core/domain/search/engines/set/resolution/wildcard_doc_resolver";

type Doc = Searchable & { name: string; metrics: Partial<Record<Metric, number>> };

function createDoc(name: string, tags: string[], metrics: Partial<Record<Metric, number>>): Doc {
  return { name, tags: new Set(tags), metrics };
}

const hdDoc = createDoc("hd", ["video", "red"], { width: 1_920, height: 1_080, score: 50, id: 1_000, duration: 120 });
const sdDoc = createDoc("sd", ["video", "blue"], { width: 1_280, height: 720, score: 25, id: 500, duration: 60 });
const squareDoc = createDoc("square", ["image", "red"], { width: 1_080, height: 1_080, score: 100, id: 2_000, duration: 0 });
const docs = [hdDoc, sdDoc, squareDoc];

const getMetric = (doc: Doc, metric: Metric): number => doc.metrics[metric] ?? 0;

function getSortedNames(set: ReadonlySet<Doc>): string[] {
  return [...set].map(doc => doc.name).sort();
}

function createResolver(): DocResolver<Doc> {
  const invertedIndex = new InvertedIndex<Doc>(doc => doc.tags);
  const metricIndex = new MetricIndex<Doc>([...METRICS], getMetric);
  const relativeMetricIndex = new RelativeMetricIndex<Doc>([...METRICS], getMetric);
  const positionIndex = new PositionIndex<Doc>();

  docs.forEach(doc => invertedIndex.addDoc(doc));
  positionIndex.build(docs);
  const wildcardDocResolver = new WildcardDocResolver<Doc>({ invertedIndex, stringInterner: new StringInterner() });

  wildcardDocResolver.index(invertedIndex.indexedTerms());
  return new DocResolver<Doc>({ invertedIndex, metricIndex, relativeMetricIndex, positionIndex, wildcardDocResolver });
}

describe("DocResolver", () => {
  describe("resolve", () => {
    test("routes a wildcard term to the union of matching terms' docs", () => {
      const docResolver = createResolver();

      expect(getSortedNames(docResolver.resolve(parseWildcardSearchTerm("re*")))).toEqual(["hd", "square"]);
    });

    test("routes a non-metric term to the term index", () => {
      const docResolver = createResolver();

      expect(getSortedNames(docResolver.resolve(parseSearchTerm("video")))).toEqual(["hd", "sd"]);
      expect(getSortedNames(docResolver.resolve(parseSearchTerm("red")))).toEqual(["hd", "square"]);
    });

    test("resolves an unknown term to nothing", () => {
      const docResolver = createResolver();

      expect(getSortedNames(docResolver.resolve(parseSearchTerm("missing")))).toEqual([]);
    });

    test("routes a constant metric term to the metric index", () => {
      const docResolver = createResolver();

      expect(getSortedNames(docResolver.resolve(parseMetricSearchTerm("score:>40")))).toEqual(["hd", "square"]);
      expect(getSortedNames(docResolver.resolve(parseMetricSearchTerm("width:1080")))).toEqual(["square"]);
      expect(getSortedNames(docResolver.resolve(parseMetricSearchTerm("duration:<100")))).toEqual(["sd", "square"]);
    });

    test("resolves a relative metric term against the corpus", () => {
      const docResolver = createResolver();

      expect(getSortedNames(docResolver.resolve(parseMetricSearchTerm("width:>height")))).toEqual(["hd", "sd"]);
    });

    test("resolves an equal relative metric term", () => {
      const docResolver = createResolver();

      expect(getSortedNames(docResolver.resolve(parseMetricSearchTerm("width:height")))).toEqual(["square"]);
    });

    test("resolves each relative term consistently", () => {
      const docResolver = createResolver();

      expect(getSortedNames(docResolver.resolve(parseMetricSearchTerm("width:>height")))).toEqual(["hd", "sd"]);
      expect(getSortedNames(docResolver.resolve(parseMetricSearchTerm("height:<width")))).toEqual(["hd", "sd"]);
    });

    test("matches every doc for a tautological equality relative term", () => {
      const docResolver = createResolver();

      expect(getSortedNames(docResolver.resolve(parseMetricSearchTerm("width:width")))).toEqual(["hd", "sd", "square"]);
    });

    test("matches nothing for a tautological inequality relative term", () => {
      const docResolver = createResolver();

      expect(getSortedNames(docResolver.resolve(parseMetricSearchTerm("width:>width")))).toEqual([]);
      expect(getSortedNames(docResolver.resolve(parseMetricSearchTerm("width:<width")))).toEqual([]);
    });
  });
});
