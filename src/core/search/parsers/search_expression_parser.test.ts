import { describe, expect, test } from "vitest";
import { parseExclusions, parseSearchExpression, tryParseSearchExpression } from "@/core/search/parsers/search_expression_parser";
import { BitEvaluator } from "@/core/search/engines/bit/logic/bit_evaluator";
import { BitIndex } from "@/core/search/engines/bit/indexes/bit_index";
import { MetricBitIndex } from "@/core/search/engines/bit/indexes/metric_index";
import { PostingResolver } from "@/core/search/engines/bit/resolution/posting_resolver";
import { Searchable } from "@/core/search/searchable";
import { WildcardPostingResolver } from "@/core/search/engines/bit/resolution/wildcard_posting_resolver";

interface Item extends Searchable { id: string }

function createItem(id: string, ...tags: string[]): Item {
  return { id, tags: new Set(tags) };
}

function createEvaluator(items: Item[]): BitEvaluator<Item> {
  const bitIndex = new BitIndex<Item>(doc => doc.tags);

  bitIndex.build(items);
  const metricIndex = new MetricBitIndex<Item>(doc => doc.id.length);

  metricIndex.build(bitIndex.width, bitIndex.allDocs());
  const wildcardResolver = new WildcardPostingResolver(bitIndex);

  wildcardResolver.index(bitIndex.indexedTerms());
  const resolver = new PostingResolver(bitIndex, metricIndex, wildcardResolver);
  return new BitEvaluator(bitIndex, resolver);
}

const corpus: Item[] = [
  createItem("1", "red", "sweet", "small"),
  createItem("2", "red", "sour", "big"),
  createItem("3", "green", "sweet", "big"),
  createItem("4", "green", "sour", "small"),
  createItem("5", "blue", "sweet", "small")
];

function evaluateIds(query: string): string[] {
  return createEvaluator(corpus).evaluate(parseSearchExpression(query)).map(doc => doc.id).sort();
}

describe("parseSearchExpression", () => {
  test("matches the whole corpus for an empty query", () => {
    expect(evaluateIds("")).toEqual(["1", "2", "3", "4", "5"]);
    expect(evaluateIds("   ")).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("matches a single term", () => {
    expect(evaluateIds("sweet")).toEqual(["1", "3", "5"]);
  });

  test("intersects space-separated terms", () => {
    expect(evaluateIds("red sweet")).toEqual(["1"]);
  });

  test("subtracts a negated top-level term", () => {
    expect(evaluateIds("sweet -small")).toEqual(["3"]);
  });

  test("preserves a literal glued-parenthesis term", () => {
    const items = [createItem("a", "apple_(red)"), createItem("b", "banana")];
    const evaluator = createEvaluator(items);

    expect(evaluator.evaluate(parseSearchExpression("apple_(red)")).map(d => d.id)).toEqual(["a"]);
  });

  test("parses a ~ group as an OR", () => {
    expect(evaluateIds("small ( red ~ blue )")).toEqual(["1", "5"]);
  });

  test("parses a space group as an AND", () => {
    expect(evaluateIds("( red small )")).toEqual(["1"]);
  });

  test("intersects multiple top-level groups", () => {
    expect(evaluateIds("( red ~ green ) ( sweet ~ sour )")).toEqual(["1", "2", "3", "4"]);
  });

  test("parses a negated term inside an OR group", () => {
    expect(evaluateIds("small ( -red ~ sweet )")).toEqual(["1", "4", "5"]);
  });

  test("excludes anything matching either alternative of a negated OR group", () => {
    expect(evaluateIds("-( red ~ blue )")).toEqual(["3", "4"]);
  });

  test("excludes only docs matching every member of a negated AND group", () => {
    expect(evaluateIds("-( red sweet )")).toEqual(["2", "3", "4", "5"]);
  });

  test("intersects a negated group with surrounding terms", () => {
    expect(evaluateIds("sweet -( red ~ blue )")).toEqual(["3"]);
  });

  test("parses a negated group nested inside another group", () => {
    expect(evaluateIds("( sweet ~ -( green ~ blue ) )")).toEqual(["1", "2", "3", "5"]);
  });

  test("parses a negated single-member group like a negated term", () => {
    expect(evaluateIds("-( red )")).toEqual(["3", "4", "5"]);
  });

  test("parses an OR group nesting an AND group", () => {
    expect(evaluateIds("( sweet ~ ( green big ) )")).toEqual(["1", "3", "5"]);
  });

  test("parses the deeply nested example", () => {
    expect(evaluateIds("small ( sweet ~ ( big ( red ~ green ) ) )")).toEqual(["1", "5"]);
  });

  test("parses an AND group nesting an OR group", () => {
    expect(evaluateIds("( small ( red ~ green ) )")).toEqual(["1", "4"]);
  });

  test("rejects a naked top-level ~", () => {
    expect(() => parseSearchExpression("red ~ blue")).toThrow(/'~' outside a group/);
  });

  test("rejects an unclosed group", () => {
    expect(() => parseSearchExpression("( red")).toThrow(/unclosed '\('/);
    expect(() => parseSearchExpression("( red ~ ( blue )")).toThrow(/unclosed '\('/);
  });

  test("rejects an unmatched close paren", () => {
    expect(() => parseSearchExpression("red )")).toThrow(/unmatched '\)'/);
  });

  test("rejects an empty group", () => {
    expect(() => parseSearchExpression("( )")).toThrow(/empty group/);
  });

  test("rejects mixing ~ and AND in one group", () => {
    expect(() => parseSearchExpression("( a ~ b c )")).toThrow(/mixed '~' and AND/);
    expect(() => parseSearchExpression("( a b ~ c )")).toThrow(/mixed '~' and AND/);
  });

  test("rejects a leading ~ inside a group", () => {
    expect(() => parseSearchExpression("( ~ red )")).toThrow(/no left-hand alternative/);
  });
});

describe("parseExclusions", () => {
  function evaluateExclusionIds(items: Item[], tags: string): string[] {
    const exclusions = parseExclusions(tags);
    return exclusions === undefined ? [] : createEvaluator(items).evaluate(exclusions).map(doc => doc.id).sort();
  }

  test("excludes docs with any of the tags", () => {
    expect(evaluateExclusionIds(corpus, "red  blue")).toEqual(["3", "4"]);
  });

  test("excludes a tag literally instead of parsing it as syntax", () => {
    const items = [createItem("a", "apple*"), createItem("b", "apple_pie")];

    expect(evaluateExclusionIds(items, "apple*")).toEqual(["b"]);
  });

  test("returns undefined for no tags", () => {
    expect(parseExclusions("   ")).toBeUndefined();
  });
});

describe("tryParseSearchExpression", () => {
  test("returns an expression for valid input", () => {
    expect(tryParseSearchExpression("red ( sweet ~ juicy )")).not.toBeUndefined();
  });

  test("returns undefined for malformed input instead of throwing", () => {
    expect(tryParseSearchExpression("( red")).toBeUndefined();
    expect(tryParseSearchExpression("red ~ blue")).toBeUndefined();
    expect(tryParseSearchExpression("( )")).toBeUndefined();
  });
});
