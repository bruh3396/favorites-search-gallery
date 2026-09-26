import { Searchable, SearchableMetric } from "@/types/search";
import { beforeEach, describe, expect, test } from "vitest";
import { parseMetricSearchTerm, parseSearchTerm, parseWildcardSearchTerm } from "@/lib/search/parsers/search_term_parser";
import { DocResolver } from "@/lib/search/engines/set/resolution/doc_resolver";
import { InvertedIndex } from "@/lib/search/engines/set/indexes/inverted_index";
import { MetricIndex } from "@/lib/search/engines/set/indexes/metric_index";
import { PositionIndex } from "@/lib/search/engines/set/indexes/position_index";
import { RelativeMetricIndex } from "@/lib/search/engines/set/indexes/relative_metric_index";
import { WildcardDocResolver } from "@/lib/search/engines/set/resolution/wildcard_doc_resolver";
import { searchableMetrics } from "@/types/guards";

type Doc = Searchable & { name: string; metrics: Partial<Record<SearchableMetric, number>> };

function createDoc(name: string, tags: string[], metrics: Partial<Record<SearchableMetric, number>>): Doc {
  return { name, tags: new Set(tags), metrics };
}

const hd = createDoc("hd", ["video", "red"], { width: 1920, height: 1080, score: 50, id: 1000, duration: 120 });
const sd = createDoc("sd", ["video", "blue"], { width: 1280, height: 720, score: 25, id: 500, duration: 60 });
const square = createDoc("square", ["image", "red"], { width: 1080, height: 1080, score: 100, id: 2000, duration: 0 });
const docs = [hd, sd, square];

const metricFor = (item: Doc, metric: SearchableMetric): number => item.metrics[metric] ?? 0;

function namesOf(set: ReadonlySet<Doc>): string[] {
  return [...set].map(item => item.name).sort();
}

describe("DocResolver", () => {
  let termIndex: InvertedIndex<Doc>;
  let resolver: DocResolver<Doc>;

  beforeEach(() => {
    termIndex = new InvertedIndex<Doc>(item => item.tags);
    docs.forEach(item => termIndex.addDoc(item));
    const metricIndex = new MetricIndex<Doc>([...searchableMetrics], metricFor);
    const relativeMetricIndex = new RelativeMetricIndex<Doc>([...searchableMetrics], metricFor);
    const positionIndex = new PositionIndex<Doc>();

    positionIndex.build(docs);
    const wildcardResolver = new WildcardDocResolver<Doc>(termIndex);

    wildcardResolver.index(termIndex.indexedTerms());
    resolver = new DocResolver<Doc>(termIndex, metricIndex, relativeMetricIndex, positionIndex, wildcardResolver);
  });

  describe("docsFor", () => {
    test("routes a wildcard term to the union of matching terms' docs", () => {
      expect(namesOf(resolver.resolve(parseWildcardSearchTerm("re*")))).toEqual(["hd", "square"]);
    });

    test("routes a non-metric term to the term index", () => {
      expect(namesOf(resolver.resolve(parseSearchTerm("video")))).toEqual(["hd", "sd"]);
      expect(namesOf(resolver.resolve(parseSearchTerm("red")))).toEqual(["hd", "square"]);
    });

    test("an unknown term resolves to nothing", () => {
      expect(namesOf(resolver.resolve(parseSearchTerm("missing")))).toEqual([]);
    });

    test("routes a constant metric term to the metric index", () => {
      expect(namesOf(resolver.resolve(parseMetricSearchTerm("score:>40")))).toEqual(["hd", "square"]);
      expect(namesOf(resolver.resolve(parseMetricSearchTerm("width:1080")))).toEqual(["square"]);
      expect(namesOf(resolver.resolve(parseMetricSearchTerm("duration:<100")))).toEqual(["sd", "square"]);
    });

    test("resolves a relative metric term against the corpus", () => {
      expect(namesOf(resolver.resolve(parseMetricSearchTerm("width:>height")))).toEqual(["hd", "sd"]);
    });

    test("resolves an equal relative metric term", () => {
      expect(namesOf(resolver.resolve(parseMetricSearchTerm("width:height")))).toEqual(["square"]);
    });

    test("resolves each relative term consistently", () => {
      expect(namesOf(resolver.resolve(parseMetricSearchTerm("width:>height")))).toEqual(["hd", "sd"]);
      expect(namesOf(resolver.resolve(parseMetricSearchTerm("height:<width")))).toEqual(["hd", "sd"]);
    });

    test("a tautological equality relative term matches every doc", () => {
      expect(namesOf(resolver.resolve(parseMetricSearchTerm("width:width")))).toEqual(["hd", "sd", "square"]);
    });

    test("a tautological inequality relative term matches nothing", () => {
      expect(namesOf(resolver.resolve(parseMetricSearchTerm("width:>width")))).toEqual([]);
      expect(namesOf(resolver.resolve(parseMetricSearchTerm("width:<width")))).toEqual([]);
    });
  });
});
