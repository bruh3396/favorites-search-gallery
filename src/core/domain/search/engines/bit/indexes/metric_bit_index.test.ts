import { describe, expect, test, vi } from "vitest";
import { Metric } from "@/core/domain/search/metric";
import { MetricBitIndex } from "@/core/domain/search/engines/bit/indexes/metric_bit_index";
import { parseMetricComparison } from "@/core/domain/search/parsers/metric_comparison";

interface Doc {
  readonly name: string;
  readonly score: number;
  readonly width: number;
  readonly height: number;
}

const WIDTH = 64;
const square = { name: "square", score: 5, width: 100, height: 100 };
const tall = { name: "tall", score: 3, width: 100, height: 300 };
const wide = { name: "wide", score: 8, width: 400, height: 200 };
const peer = { name: "peer", score: 5, width: 50, height: 10 };

interface Setup {
  index: MetricBitIndex<Doc>;
  getMetric: ReturnType<typeof vi.fn<(doc: Doc, metric: Metric) => number>>;
  findNames: (term: string) => string[];
}

function setup(docsByPosition: (Doc | undefined)[] = [square, tall, wide, peer]): Setup {
  const getMetric = vi.fn((doc: Doc, metric: Metric): number => doc[metric as "score" | "width" | "height"]);
  const index = new MetricBitIndex<Doc>(getMetric);
  const docs = docsByPosition as readonly Doc[];

  index.build(WIDTH, docs);
  return {
    index,
    getMetric,
    findNames: (term: string): string[] => index.getPosting(parseMetricComparison(term)).toBitSet().gather(docs).map(doc => doc.name).sort()
  };
}

describe("MetricBitIndex", () => {
  describe("getPosting", () => {
    test("matches docs equal to a value", () => {
      expect(setup().findNames("score:5")).toEqual(["peer", "square"]);
    });

    test("matches docs below a value", () => {
      expect(setup().findNames("score:<5")).toEqual(["tall"]);
    });

    test("matches docs above a value", () => {
      expect(setup().findNames("score:>5")).toEqual(["wide"]);
    });

    test("matches nothing when no doc has the value", () => {
      expect(setup().findNames("score:4")).toEqual([]);
    });

    test("compares one metric against another", () => {
      const { findNames } = setup();

      expect(findNames("width:height")).toEqual(["square"]);
      expect(findNames("width:<height")).toEqual(["tall"]);
      expect(findNames("width:>height")).toEqual(["peer", "wide"]);
    });

    test("skips empty positions", () => {
      expect(setup([undefined, tall, undefined, wide]).findNames("score:>0")).toEqual(["tall", "wide"]);
    });

    test("reads each doc's metric once", () => {
      const { findNames, getMetric } = setup();

      findNames("score:5");
      findNames("score:>5");
      expect(getMetric).toHaveBeenCalledTimes(4);
    });
  });

  describe("build", () => {
    test("forgets the metrics read before", () => {
      const { index, findNames } = setup();

      findNames("score:5");
      findNames("width:height");
      index.build(WIDTH, [wide]);
      expect(index.getPosting(parseMetricComparison("score:>0")).cardinality).toBe(1);
      expect(index.getPosting(parseMetricComparison("width:height")).cardinality).toBe(0);
    });
  });
});
