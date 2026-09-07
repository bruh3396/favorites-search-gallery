import { describe, expect, test } from "vitest";
import { MetricIndex } from "@/lib/search/index/metric_index";

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

function scores(operator: ":" | ":<" | ":>", value: number): number[] {
  return [...index.docsMatching({ metric: "score", operator, value })].map(doc => doc.score).sort();
}

describe("MetricIndex", () => {
  test(":< returns docs below the value", () => {
    expect(scores(":<", 5)).toEqual([3]);
  });

  test(":> returns docs above the value", () => {
    expect(scores(":>", 5)).toEqual([8]);
  });

  test(": returns docs equal to the value", () => {
    expect(scores(":", 5)).toEqual([5, 5]);
  });

  test(": returns nothing when no doc has the value", () => {
    expect(scores(":", 4)).toEqual([]);
  });

  test(":< of the minimum returns nothing", () => {
    expect(scores(":<", 3)).toEqual([]);
  });

  test(":> of the maximum returns nothing", () => {
    expect(scores(":>", 8)).toEqual([]);
  });

  test(":< above the maximum returns every doc", () => {
    expect(scores(":<", 100)).toEqual([3, 5, 5, 8]);
  });

  test(":> below the minimum returns every doc", () => {
    expect(scores(":>", 0)).toEqual([3, 5, 5, 8]);
  });

  test("each metric is indexed independently", () => {
    expect([...index.docsMatching({ metric: "width", operator: ":>", value: 250 })].map(doc => doc.width).sort()).toEqual([300, 400]);
  });

  test("an unindexed metric returns nothing", () => {
    expect([...index.docsMatching({ metric: "height", operator: ":>", value: 0 })]).toEqual([]);
  });

  test("querying before build returns nothing", () => {
    expect([...new MetricIndex<Doc>(["score"], doc => doc.score).docsMatching({ metric: "score", operator: ":>", value: 0 })]).toEqual([]);
  });
});

describe("MetricIndex mutation", () => {
  function freshIndex(): MetricIndex<Doc> {
    const mutable = new MetricIndex<Doc>(["score", "width"], (doc, metric) => doc[metric as "score" | "width"]);

    mutable.build(new Set(docs.map(doc => ({ ...doc }))));
    return mutable;
  }

  test("add makes a new doc findable in every metric", () => {
    const mutable = freshIndex();

    mutable.add({ score: 6, width: 500 });
    expect([...mutable.docsMatching({ metric: "score", operator: ":", value: 6 })].map(doc => doc.score)).toEqual([6]);
    expect([...mutable.docsMatching({ metric: "width", operator: ":", value: 500 })].map(doc => doc.width)).toEqual([500]);
  });

  test("add keeps entries sorted so ranges stay correct", () => {
    const mutable = freshIndex();

    mutable.add({ score: 4, width: 250 });
    expect([...mutable.docsMatching({ metric: "score", operator: ":<", value: 5 })].map(doc => doc.score).sort()).toEqual([3, 4]);
  });

  test("remove drops a doc from every metric", () => {
    const mutable = freshIndex();
    const [target] = [...mutable.docsMatching({ metric: "score", operator: ":", value: 8 })];

    mutable.remove(target);
    expect([...mutable.docsMatching({ metric: "score", operator: ":", value: 8 })]).toEqual([]);
    expect([...mutable.docsMatching({ metric: "width", operator: ":", value: 300 })]).toEqual([]);
  });

  test("remove drops only the matching doc among equal values", () => {
    const mutable = freshIndex();
    const [first] = [...mutable.docsMatching({ metric: "score", operator: ":", value: 5 })];

    mutable.remove(first);
    expect(mutable.docsMatching({ metric: "score", operator: ":", value: 5 }).size).toBe(1);
  });

  test("remove of an absent doc is a no-op", () => {
    const mutable = freshIndex();

    mutable.remove({ score: 999, width: 999 });
    expect(mutable.docsMatching({ metric: "score", operator: ":<", value: 100 }).size).toBe(4);
  });
});
