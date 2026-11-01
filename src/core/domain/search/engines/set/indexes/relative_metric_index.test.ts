import { describe, expect, test } from "vitest";
import { Metric } from "@/core/domain/search/metric";
import { MetricComparison } from "@/core/domain/search/parsers/metric_comparison";
import { RelativeMetricIndex } from "@/core/domain/search/engines/set/indexes/relative_metric_index";

type Doc = { name: string; metrics: Partial<Record<Metric, number>> };

function createDoc(name: string, metrics: Partial<Record<Metric, number>>): Doc {
  return { name, metrics };
}

const wideDoc = createDoc("wide", { width: 1_920, height: 1_080 });
const tallDoc = createDoc("tall", { width: 720, height: 1_280 });
const squareDoc = createDoc("square", { width: 1_080, height: 1_080 });
const docs = [wideDoc, tallDoc, squareDoc];

const metrics: Metric[] = ["width", "height"];
const getMetric = (doc: Doc, metric: Metric): number => doc.metrics[metric] ?? 0;

function createComparison(metric: Metric, metricComparator: MetricComparison["comparator"], rightHandMetric: Metric): MetricComparison {
  return { metric, comparator: metricComparator, value: 0, rightHandMetric, isRelative: true, isTautological: false } as MetricComparison;
}

function getSortedNames(set: ReadonlySet<Doc>): string[] {
  return [...set].map(doc => doc.name).sort();
}

function createIndex(): RelativeMetricIndex<Doc> {
  const relativeMetricIndex = new RelativeMetricIndex<Doc>(metrics, getMetric);

  relativeMetricIndex.build(new Set(docs));
  return relativeMetricIndex;
}

describe("RelativeMetricIndex", () => {
  describe("getDocs", () => {
    test("resolves greater-than across a pair", () => {
      expect(getSortedNames(createIndex().getDocs(createComparison("width", ":>", "height")))).toEqual(["wide"]);
    });

    test("resolves less-than across a pair", () => {
      expect(getSortedNames(createIndex().getDocs(createComparison("width", ":<", "height")))).toEqual(["tall"]);
    });

    test("resolves equality across a pair", () => {
      expect(getSortedNames(createIndex().getDocs(createComparison("width", ":", "height")))).toEqual(["square"]);
    });

    test("resolves reverse-ordered inequality to the same docs (aliasing)", () => {
      const relativeMetricIndex = createIndex();

      expect(getSortedNames(relativeMetricIndex.getDocs(createComparison("height", ":<", "width")))).toEqual(["wide"]);
      expect(getSortedNames(relativeMetricIndex.getDocs(createComparison("height", ":>", "width")))).toEqual(["tall"]);
    });

    test("resolves reverse-ordered equality to the same docs (aliasing)", () => {
      expect(getSortedNames(createIndex().getDocs(createComparison("height", ":", "width")))).toEqual(["square"]);
    });

    test("shares one Set object between reverse-ordered keys rather than duplicating it", () => {
      const relativeMetricIndex = createIndex();

      expect(relativeMetricIndex.getDocs(createComparison("width", ":>", "height")))
        .toBe(relativeMetricIndex.getDocs(createComparison("height", ":<", "width")));
      expect(relativeMetricIndex.getDocs(createComparison("width", ":<", "height")))
        .toBe(relativeMetricIndex.getDocs(createComparison("height", ":>", "width")));
      expect(relativeMetricIndex.getDocs(createComparison("width", ":", "height"))).toBe(relativeMetricIndex.getDocs(createComparison("height", ":", "width")));
    });

    test("partitions the collection between the three sets of a pair (trichotomy)", () => {
      const relativeMetricIndex = createIndex();
      const greater = relativeMetricIndex.getDocs(createComparison("width", ":>", "height"));
      const less = relativeMetricIndex.getDocs(createComparison("width", ":<", "height"));
      const equal = relativeMetricIndex.getDocs(createComparison("width", ":", "height"));

      expect(greater.size + less.size + equal.size).toBe(docs.length);
    });

    test("resolves to nothing before build", () => {
      const relativeMetricIndex = new RelativeMetricIndex<Doc>(metrics, getMetric);

      expect(getSortedNames(relativeMetricIndex.getDocs(createComparison("width", ":>", "height")))).toEqual([]);
    });
  });

  describe("ensureBuilt", () => {
    test("builds once and is idempotent", () => {
      const relativeMetricIndex = new RelativeMetricIndex<Doc>(metrics, getMetric);

      relativeMetricIndex.ensureBuilt(new Set(docs));
      relativeMetricIndex.ensureBuilt(new Set());
      expect(getSortedNames(relativeMetricIndex.getDocs(createComparison("width", ":>", "height")))).toEqual(["wide"]);
    });
  });

  describe("add", () => {
    test("does nothing before build, leaving the doc to a later build", () => {
      const relativeMetricIndex = new RelativeMetricIndex<Doc>(metrics, getMetric);
      const doc = createDoc("extra", { width: 4_000, height: 100 });

      relativeMetricIndex.add(doc);
      relativeMetricIndex.build(new Set([...docs, doc]));
      expect(getSortedNames(relativeMetricIndex.getDocs(createComparison("width", ":>", "height")))).toEqual(["extra", "wide"]);
    });

    test("places the doc into the right partition after build", () => {
      const relativeMetricIndex = createIndex();
      const doc = createDoc("extra", { width: 100, height: 4_000 });

      relativeMetricIndex.add(doc);
      expect(getSortedNames(relativeMetricIndex.getDocs(createComparison("width", ":<", "height")))).toEqual(["extra", "tall"]);
    });
  });

  describe("invalidate", () => {
    test("makes ensureBuilt rebuild from the given docs", () => {
      const relativeMetricIndex = new RelativeMetricIndex<Doc>(metrics, getMetric);
      const doc = createDoc("extra", { width: 4_000, height: 100 });

      relativeMetricIndex.ensureBuilt(new Set(docs));
      relativeMetricIndex.invalidate();
      relativeMetricIndex.ensureBuilt(new Set([...docs, doc]));
      expect(getSortedNames(relativeMetricIndex.getDocs(createComparison("width", ":>", "height")))).toEqual(["extra", "wide"]);
    });
  });

  describe("remove", () => {
    test("does nothing before build", () => {
      const relativeMetricIndex = new RelativeMetricIndex<Doc>(metrics, getMetric);

      relativeMetricIndex.remove(wideDoc);
      relativeMetricIndex.build(new Set(docs));
      expect(getSortedNames(relativeMetricIndex.getDocs(createComparison("width", ":>", "height")))).toEqual(["wide"]);
    });

    test("drops the doc from every partition", () => {
      const relativeMetricIndex = createIndex();

      relativeMetricIndex.remove(wideDoc);
      expect(getSortedNames(relativeMetricIndex.getDocs(createComparison("width", ":>", "height")))).toEqual([]);
    });
  });
});
