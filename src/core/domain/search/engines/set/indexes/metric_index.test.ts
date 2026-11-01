import { describe, expect, test } from "vitest";
import { MetricIndex } from "@/core/domain/search/engines/set/indexes/metric_index";

interface Doc {
  score: number;
  width: number;
}

const docs: Doc[] = [
  { score: 3, width: 100 },
  { score: 5, width: 400 },
  { score: 5, width: 200 },
  { score: 8, width: 300 }
];

const metricIndex = new MetricIndex<Doc>(["score", "width"], (doc, metric) => doc[metric as "score" | "width"]);

metricIndex.build(new Set(docs));

function findMatchingScores(operator: ":" | ":<" | ":>", value: number): number[] {
  return [...metricIndex.docsMatching({ metric: "score", comparator: operator, value })].map(doc => doc.score).sort();
}

function createIndex(): MetricIndex<Doc> {
  const mutableMetricIndex = new MetricIndex<Doc>(["score", "width"], (doc, metric) => doc[metric as "score" | "width"]);

  mutableMetricIndex.build(new Set(docs.map(doc => ({ ...doc }))));
  return mutableMetricIndex;
}

describe("MetricIndex", () => {
  describe("docsMatching", () => {
    test("returns docs below the value for :<", () => {
      expect(findMatchingScores(":<", 5)).toEqual([3]);
    });

    test("returns docs above the value for :>", () => {
      expect(findMatchingScores(":>", 5)).toEqual([8]);
    });

    test("returns docs equal to the value for :", () => {
      expect(findMatchingScores(":", 5)).toEqual([5, 5]);
    });

    test("returns nothing for : when no doc has the value", () => {
      expect(findMatchingScores(":", 4)).toEqual([]);
    });

    test("returns nothing for :< of the minimum", () => {
      expect(findMatchingScores(":<", 3)).toEqual([]);
    });

    test("returns nothing for :> of the maximum", () => {
      expect(findMatchingScores(":>", 8)).toEqual([]);
    });

    test("returns every doc for :< above the maximum", () => {
      expect(findMatchingScores(":<", 100)).toEqual([3, 5, 5, 8]);
    });

    test("returns every doc for :> below the minimum", () => {
      expect(findMatchingScores(":>", 0)).toEqual([3, 5, 5, 8]);
    });

    test("indexes each metric independently", () => {
      expect([...metricIndex.docsMatching({ metric: "width", comparator: ":>", value: 250 })].map(doc => doc.width).sort()).toEqual([300, 400]);
    });

    test("returns nothing for an unindexed metric", () => {
      expect([...metricIndex.docsMatching({ metric: "height", comparator: ":>", value: 0 })]).toEqual([]);
    });

    test("returns nothing before build", () => {
      expect([...new MetricIndex<Doc>(["score"], doc => doc.score).docsMatching({ metric: "score", comparator: ":>", value: 0 })]).toEqual([]);
    });
  });

  describe("add", () => {
    test("does nothing before build, leaving the doc to a later build", () => {
      const unbuiltMetricIndex = new MetricIndex<Doc>(["score"], doc => doc.score);
      const extra = { score: 6, width: 500 };

      unbuiltMetricIndex.add(extra);
      expect(unbuiltMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 6 }).size).toBe(0);

      unbuiltMetricIndex.build(new Set([extra]));
      expect(unbuiltMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 6 }).size).toBe(1);
    });

    test("makes a new doc findable in every metric", () => {
      const mutableMetricIndex = createIndex();

      mutableMetricIndex.add({ score: 6, width: 500 });
      expect([...mutableMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 6 })].map(doc => doc.score)).toEqual([6]);
      expect([...mutableMetricIndex.docsMatching({ metric: "width", comparator: ":", value: 500 })].map(doc => doc.width)).toEqual([500]);
    });

    test("keeps entries sorted so ranges stay correct", () => {
      const mutableMetricIndex = createIndex();

      mutableMetricIndex.add({ score: 4, width: 250 });
      expect([...mutableMetricIndex.docsMatching({ metric: "score", comparator: ":<", value: 5 })].map(doc => doc.score).sort()).toEqual([3, 4]);
    });
  });

  describe("remove", () => {
    test("drops a doc from every metric", () => {
      const mutableMetricIndex = createIndex();
      const [doc] = [...mutableMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 8 })];

      mutableMetricIndex.remove(doc);
      expect([...mutableMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 8 })]).toEqual([]);
      expect([...mutableMetricIndex.docsMatching({ metric: "width", comparator: ":", value: 300 })]).toEqual([]);
    });

    test("drops only the matching doc among equal values", () => {
      const mutableMetricIndex = createIndex();
      const [firstDoc] = [...mutableMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 5 })];

      mutableMetricIndex.remove(firstDoc);
      expect(mutableMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 5 }).size).toBe(1);
    });

    test("finds a doc past others sharing its value", () => {
      const mutableMetricIndex = createIndex();
      const [, secondDoc] = [...mutableMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 5 })];

      mutableMetricIndex.remove(secondDoc);
      expect([...mutableMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 5 })]).not.toContain(secondDoc);
      expect(mutableMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 5 }).size).toBe(1);
    });

    test("does nothing before build", () => {
      const unbuiltMetricIndex = new MetricIndex<Doc>(["score"], doc => doc.score);

      unbuiltMetricIndex.remove(docs[0]);
      unbuiltMetricIndex.build(new Set(docs));
      expect(unbuiltMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 3 }).size).toBe(1);
    });

    test("ignores an absent doc", () => {
      const mutableMetricIndex = createIndex();

      mutableMetricIndex.remove({ score: 999, width: 999 });
      expect(mutableMetricIndex.docsMatching({ metric: "score", comparator: ":<", value: 100 }).size).toBe(4);
    });
  });

  describe("invalidate", () => {
    test("makes ensureBuilt rebuild from the given docs", () => {
      const rebuiltMetricIndex = new MetricIndex<Doc>(["score"], doc => doc.score);
      const extra = { score: 6, width: 500 };

      rebuiltMetricIndex.ensureBuilt(new Set(docs));
      rebuiltMetricIndex.invalidate();
      rebuiltMetricIndex.ensureBuilt(new Set([...docs, extra]));
      expect([...rebuiltMetricIndex.docsMatching({ metric: "score", comparator: ":", value: 6 })]).toEqual([extra]);
    });
  });
});
