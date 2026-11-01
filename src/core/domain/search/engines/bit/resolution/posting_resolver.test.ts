import { describe, expect, test } from "vitest";
import { BitIndex } from "@/core/domain/search/engines/bit/indexes/bit_index";
import { Metric } from "@/core/domain/search/metric";
import { MetricBitIndex } from "@/core/domain/search/engines/bit/indexes/metric_bit_index";
import { PostingResolver } from "@/core/domain/search/engines/bit/resolution/posting_resolver";
import { WildcardPostingResolver } from "@/core/domain/search/engines/bit/resolution/wildcard_posting_resolver";
import { parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { StringInterner } from "@/core/utils/string/string_interner";

interface Doc {
  readonly id: number;
  readonly tags: string[];
  readonly score: number;
}

const apple = { id: 1, tags: ["red", "fruit"], score: 5 };
const cherry = { id: 2, tags: ["red", "1"], score: 3 };
const lemon = { id: 3, tags: ["yellow", "fruit"], score: 8 };

function getMetric(doc: Doc, metric: Metric): number {
  return metric === "id" ? doc.id : doc.score;
}

function setup(): (term: string) => number[] {
  const bitIndex = new BitIndex<Doc>({ getTerms: doc => doc.tags, stringInterner: new StringInterner() });
  const metricBitIndex = new MetricBitIndex<Doc>(getMetric);
  const wildcardPostingResolver = new WildcardPostingResolver({ bitIndex, stringInterner: new StringInterner() });
  const postingResolver = new PostingResolver(bitIndex, metricBitIndex, wildcardPostingResolver);

  bitIndex.build([apple, cherry, lemon]);
  metricBitIndex.build(bitIndex.width, bitIndex.allDocs());
  wildcardPostingResolver.index(bitIndex.indexedTerms());
  return term => bitIndex.docsFrom(bitIndex.bitSetFrom(postingResolver.resolve(parseSearchTerm(term)))).map(doc => doc.id);
}

describe("PostingResolver", () => {
  describe("resolve", () => {
    test("resolves a tag to the docs carrying it", () => {
      expect(setup()("red")).toEqual([1, 2]);
    });

    test("resolves an unknown tag to nothing", () => {
      expect(setup()("purple")).toEqual([]);
    });

    test("resolves a wildcard through its matching tags", () => {
      expect(setup()("*ell*")).toEqual([3]);
    });

    test("resolves a wildcard matching nothing to nothing", () => {
      expect(setup()("zzz*")).toEqual([]);
    });

    test("resolves a metric comparison", () => {
      expect(setup()("score:>4")).toEqual([1, 3]);
    });

    test("resolves a number to the docs tagged with it or bearing it as their id", () => {
      expect(setup()("1")).toEqual([1, 2]);
      expect(setup()("3")).toEqual([3]);
    });
  });
});
