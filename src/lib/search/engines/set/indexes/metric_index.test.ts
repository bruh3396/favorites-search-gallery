import { describe, expect, test } from "vitest";
import { MetricIndex } from "@/lib/search/engines/set/indexes/metric_index";

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

const index = new MetricIndex<Doc>(["score", "width"], (doc, metric) => doc[metric as "score" | "width"]);

index.build(new Set(docs));

function findMatchingScores(operator: ":" | ":<" | ":>", value: number): number[] {
  return [...index.docsMatching({ metric: "score", operator, value })].map(doc => doc.score).sort();
}

// A built index of copies of the docs, which a test may change.
function createIndex(): MetricIndex<Doc> {
  const mutable = new MetricIndex<Doc>(["score", "width"], (doc, metric) => doc[metric as "score" | "width"]);

  mutable.build(new Set(docs.map(doc => ({ ...doc }))));
  return mutable;
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
      expect([...index.docsMatching({ metric: "width", operator: ":>", value: 250 })].map(doc => doc.width).sort()).toEqual([300, 400]);
    });

    test("returns nothing for an unindexed metric", () => {
      expect([...index.docsMatching({ metric: "height", operator: ":>", value: 0 })]).toEqual([]);
    });

    test("returns nothing before build", () => {
      expect([...new MetricIndex<Doc>(["score"], doc => doc.score).docsMatching({ metric: "score", operator: ":>", value: 0 })]).toEqual([]);
    });
  });

  describe("add", () => {
    test("does nothing before build, leaving the doc to a later build", () => {
      const unbuilt = new MetricIndex<Doc>(["score"], doc => doc.score);
      const extra = { score: 6, width: 500 };

      unbuilt.add(extra);
      expect(unbuilt.docsMatching({ metric: "score", operator: ":", value: 6 }).size).toBe(0);

      unbuilt.build(new Set([extra]));
      expect(unbuilt.docsMatching({ metric: "score", operator: ":", value: 6 }).size).toBe(1);
    });

    test("makes a new doc findable in every metric", () => {
      const mutable = createIndex();

      mutable.add({ score: 6, width: 500 });
      expect([...mutable.docsMatching({ metric: "score", operator: ":", value: 6 })].map(doc => doc.score)).toEqual([6]);
      expect([...mutable.docsMatching({ metric: "width", operator: ":", value: 500 })].map(doc => doc.width)).toEqual([500]);
    });

    test("keeps entries sorted so ranges stay correct", () => {
      const mutable = createIndex();

      mutable.add({ score: 4, width: 250 });
      expect([...mutable.docsMatching({ metric: "score", operator: ":<", value: 5 })].map(doc => doc.score).sort()).toEqual([3, 4]);
    });
  });

  describe("remove", () => {
    test("drops a doc from every metric", () => {
      const mutable = createIndex();
      const [target] = [...mutable.docsMatching({ metric: "score", operator: ":", value: 8 })];

      mutable.remove(target);
      expect([...mutable.docsMatching({ metric: "score", operator: ":", value: 8 })]).toEqual([]);
      expect([...mutable.docsMatching({ metric: "width", operator: ":", value: 300 })]).toEqual([]);
    });

    test("drops only the matching doc among equal values", () => {
      const mutable = createIndex();
      const [first] = [...mutable.docsMatching({ metric: "score", operator: ":", value: 5 })];

      mutable.remove(first);
      expect(mutable.docsMatching({ metric: "score", operator: ":", value: 5 }).size).toBe(1);
    });

    test("finds a doc past others sharing its value", () => {
      const mutable = createIndex();
      const [, second] = [...mutable.docsMatching({ metric: "score", operator: ":", value: 5 })];

      mutable.remove(second);
      expect([...mutable.docsMatching({ metric: "score", operator: ":", value: 5 })]).not.toContain(second);
      expect(mutable.docsMatching({ metric: "score", operator: ":", value: 5 }).size).toBe(1);
    });

    test("does nothing before build", () => {
      const unbuilt = new MetricIndex<Doc>(["score"], doc => doc.score);

      unbuilt.remove(docs[0]);
      unbuilt.build(new Set(docs));
      expect(unbuilt.docsMatching({ metric: "score", operator: ":", value: 3 }).size).toBe(1);
    });

    test("ignores an absent doc", () => {
      const mutable = createIndex();

      mutable.remove({ score: 999, width: 999 });
      expect(mutable.docsMatching({ metric: "score", operator: ":<", value: 100 }).size).toBe(4);
    });
  });

  describe("invalidate", () => {
    test("makes ensureBuilt rebuild from the given docs", () => {
      const rebuilt = new MetricIndex<Doc>(["score"], doc => doc.score);
      const extra = { score: 6, width: 500 };

      rebuilt.ensureBuilt(new Set(docs));
      rebuilt.invalidate();
      rebuilt.ensureBuilt(new Set([...docs, extra]));
      expect([...rebuilt.docsMatching({ metric: "score", operator: ":", value: 6 })]).toEqual([extra]);
    });
  });
});
