import { describe, expect, test } from "vitest";
import { MetricComparison } from "@/lib/search/parsers/metric_comparison";
import { RelativeMetricIndex } from "@/lib/search/engines/set/indexes/relative_metric_index";
import { SearchableMetric } from "@/types/search";

type Doc = { name: string; metrics: Partial<Record<SearchableMetric, number>> };

function doc(name: string, metrics: Partial<Record<SearchableMetric, number>>): Doc {
  return { name, metrics };
}

const wide = doc("wide", { width: 1920, height: 1080 });
const tall = doc("tall", { width: 720, height: 1280 });
const square = doc("square", { width: 1080, height: 1080 });
const docs = [wide, tall, square];

const metrics: SearchableMetric[] = ["width", "height"];
const metricFor = (item: Doc, metric: SearchableMetric): number => item.metrics[metric] ?? 0;

function comparison(metric: SearchableMetric, operator: MetricComparison["operator"], rightHandMetric: SearchableMetric): MetricComparison {
  return { metric, operator, value: 0, rightHandMetric, isRelative: true, isTautological: false } as MetricComparison;
}

function names(set: ReadonlySet<Doc>): string[] {
  return [...set].map(item => item.name).sort();
}

function buildIndex(): RelativeMetricIndex<Doc> {
  const index = new RelativeMetricIndex<Doc>(metrics, metricFor);

  index.build(new Set(docs));
  return index;
}

describe("RelativeMetricIndex", () => {
  test("resolves greater-than across a pair", () => {
    expect(names(buildIndex().docsFor(comparison("width", ":>", "height")))).toEqual(["wide"]);
  });

  test("resolves less-than across a pair", () => {
    expect(names(buildIndex().docsFor(comparison("width", ":<", "height")))).toEqual(["tall"]);
  });

  test("resolves equality across a pair", () => {
    expect(names(buildIndex().docsFor(comparison("width", ":", "height")))).toEqual(["square"]);
  });

  test("reverse-ordered inequality resolves to the same docs (aliasing)", () => {
    const index = buildIndex();

    expect(names(index.docsFor(comparison("height", ":<", "width")))).toEqual(["wide"]);
    expect(names(index.docsFor(comparison("height", ":>", "width")))).toEqual(["tall"]);
  });

  test("reverse-ordered equality resolves to the same docs (aliasing)", () => {
    expect(names(buildIndex().docsFor(comparison("height", ":", "width")))).toEqual(["square"]);
  });

  test("reverse-ordered keys share one Set object rather than duplicate it", () => {
    const index = buildIndex();

    expect(index.docsFor(comparison("width", ":>", "height"))).toBe(index.docsFor(comparison("height", ":<", "width")));
    expect(index.docsFor(comparison("width", ":<", "height"))).toBe(index.docsFor(comparison("height", ":>", "width")));
    expect(index.docsFor(comparison("width", ":", "height"))).toBe(index.docsFor(comparison("height", ":", "width")));
  });

  test("the three sets of a pair partition the collection (trichotomy)", () => {
    const index = buildIndex();
    const greater = index.docsFor(comparison("width", ":>", "height"));
    const less = index.docsFor(comparison("width", ":<", "height"));
    const equal = index.docsFor(comparison("width", ":", "height"));

    expect(greater.size + less.size + equal.size).toBe(docs.length);
  });

  test("an unbuilt index resolves to nothing", () => {
    const index = new RelativeMetricIndex<Doc>(metrics, metricFor);

    expect(names(index.docsFor(comparison("width", ":>", "height")))).toEqual([]);
  });

  test("ensureBuilt builds once and is idempotent", () => {
    const index = new RelativeMetricIndex<Doc>(metrics, metricFor);

    index.ensureBuilt(new Set(docs));
    index.ensureBuilt(new Set());
    expect(names(index.docsFor(comparison("width", ":>", "height")))).toEqual(["wide"]);
  });

  test("add before build is a no-op that later build absorbs", () => {
    const index = new RelativeMetricIndex<Doc>(metrics, metricFor);
    const extra = doc("extra", { width: 4000, height: 100 });

    index.add(extra);
    index.build(new Set([...docs, extra]));
    expect(names(index.docsFor(comparison("width", ":>", "height")))).toEqual(["extra", "wide"]);
  });

  test("add after build places the doc into the right partition", () => {
    const index = buildIndex();
    const extra = doc("extra", { width: 100, height: 4000 });

    index.add(extra);
    expect(names(index.docsFor(comparison("width", ":<", "height")))).toEqual(["extra", "tall"]);
  });

  test("remove drops the doc from every partition", () => {
    const index = buildIndex();

    index.remove(wide);
    expect(names(index.docsFor(comparison("width", ":>", "height")))).toEqual([]);
  });
});
