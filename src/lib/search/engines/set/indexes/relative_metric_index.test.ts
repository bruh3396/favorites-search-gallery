import { describe, expect, test } from "vitest";
import { MetricComparison } from "@/lib/search/parsers/metric_comparison";
import { RelativeMetricIndex } from "@/lib/search/engines/set/indexes/relative_metric_index";
import { SearchableMetric } from "@/types/search";

type Doc = { name: string; metrics: Partial<Record<SearchableMetric, number>> };

function createDoc(name: string, metrics: Partial<Record<SearchableMetric, number>>): Doc {
  return { name, metrics };
}

const wide = createDoc("wide", { width: 1_920, height: 1_080 });
const tall = createDoc("tall", { width: 720, height: 1_280 });
const square = createDoc("square", { width: 1_080, height: 1_080 });
const docs = [wide, tall, square];

const metrics: SearchableMetric[] = ["width", "height"];
const metricFor = (item: Doc, metric: SearchableMetric): number => item.metrics[metric] ?? 0;

function createComparison(metric: SearchableMetric, operator: MetricComparison["operator"], rightHandMetric: SearchableMetric): MetricComparison {
  return { metric, operator, value: 0, rightHandMetric, isRelative: true, isTautological: false } as MetricComparison;
}

function getSortedNames(set: ReadonlySet<Doc>): string[] {
  return [...set].map(item => item.name).sort();
}

function createIndex(): RelativeMetricIndex<Doc> {
  const index = new RelativeMetricIndex<Doc>(metrics, metricFor);

  index.build(new Set(docs));
  return index;
}

describe("RelativeMetricIndex", () => {
  describe("docsFor", () => {
    test("resolves greater-than across a pair", () => {
      expect(getSortedNames(createIndex().docsFor(createComparison("width", ":>", "height")))).toEqual(["wide"]);
    });

    test("resolves less-than across a pair", () => {
      expect(getSortedNames(createIndex().docsFor(createComparison("width", ":<", "height")))).toEqual(["tall"]);
    });

    test("resolves equality across a pair", () => {
      expect(getSortedNames(createIndex().docsFor(createComparison("width", ":", "height")))).toEqual(["square"]);
    });

    test("resolves reverse-ordered inequality to the same docs (aliasing)", () => {
      const index = createIndex();

      expect(getSortedNames(index.docsFor(createComparison("height", ":<", "width")))).toEqual(["wide"]);
      expect(getSortedNames(index.docsFor(createComparison("height", ":>", "width")))).toEqual(["tall"]);
    });

    test("resolves reverse-ordered equality to the same docs (aliasing)", () => {
      expect(getSortedNames(createIndex().docsFor(createComparison("height", ":", "width")))).toEqual(["square"]);
    });

    test("shares one Set object between reverse-ordered keys rather than duplicating it", () => {
      const index = createIndex();

      expect(index.docsFor(createComparison("width", ":>", "height"))).toBe(index.docsFor(createComparison("height", ":<", "width")));
      expect(index.docsFor(createComparison("width", ":<", "height"))).toBe(index.docsFor(createComparison("height", ":>", "width")));
      expect(index.docsFor(createComparison("width", ":", "height"))).toBe(index.docsFor(createComparison("height", ":", "width")));
    });

    test("partitions the collection between the three sets of a pair (trichotomy)", () => {
      const index = createIndex();
      const greater = index.docsFor(createComparison("width", ":>", "height"));
      const less = index.docsFor(createComparison("width", ":<", "height"));
      const equal = index.docsFor(createComparison("width", ":", "height"));

      expect(greater.size + less.size + equal.size).toBe(docs.length);
    });

    test("resolves to nothing before build", () => {
      const index = new RelativeMetricIndex<Doc>(metrics, metricFor);

      expect(getSortedNames(index.docsFor(createComparison("width", ":>", "height")))).toEqual([]);
    });
  });

  describe("ensureBuilt", () => {
    test("builds once and is idempotent", () => {
      const index = new RelativeMetricIndex<Doc>(metrics, metricFor);

      index.ensureBuilt(new Set(docs));
      index.ensureBuilt(new Set());
      expect(getSortedNames(index.docsFor(createComparison("width", ":>", "height")))).toEqual(["wide"]);
    });
  });

  describe("add", () => {
    test("does nothing before build, leaving the doc to a later build", () => {
      const index = new RelativeMetricIndex<Doc>(metrics, metricFor);
      const extra = createDoc("extra", { width: 4_000, height: 100 });

      index.add(extra);
      index.build(new Set([...docs, extra]));
      expect(getSortedNames(index.docsFor(createComparison("width", ":>", "height")))).toEqual(["extra", "wide"]);
    });

    test("places the doc into the right partition after build", () => {
      const index = createIndex();
      const extra = createDoc("extra", { width: 100, height: 4_000 });

      index.add(extra);
      expect(getSortedNames(index.docsFor(createComparison("width", ":<", "height")))).toEqual(["extra", "tall"]);
    });
  });

  describe("invalidate", () => {
    test("makes ensureBuilt rebuild from the given docs", () => {
      const index = new RelativeMetricIndex<Doc>(metrics, metricFor);
      const extra = createDoc("extra", { width: 4_000, height: 100 });

      index.ensureBuilt(new Set(docs));
      index.invalidate();
      index.ensureBuilt(new Set([...docs, extra]));
      expect(getSortedNames(index.docsFor(createComparison("width", ":>", "height")))).toEqual(["extra", "wide"]);
    });
  });

  describe("remove", () => {
    test("does nothing before build", () => {
      const index = new RelativeMetricIndex<Doc>(metrics, metricFor);

      index.remove(wide);
      index.build(new Set(docs));
      expect(getSortedNames(index.docsFor(createComparison("width", ":>", "height")))).toEqual(["wide"]);
    });

    test("drops the doc from every partition", () => {
      const index = createIndex();

      index.remove(wide);
      expect(getSortedNames(index.docsFor(createComparison("width", ":>", "height")))).toEqual([]);
    });
  });
});
