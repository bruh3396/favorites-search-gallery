import { describe, expect, test } from "vitest";
import { parseSearchExpression, tryParseSearchExpression } from "@/lib/search/parsers/search_expression_parser";
import { BitEvaluator } from "@/lib/search/engines/bit/logic/bit_evaluator";
import { BitIndex } from "@/lib/search/engines/bit/indexes/bit_index";
import { MetricBitIndex } from "@/lib/search/engines/bit/indexes/metric_index";
import { PostingResolver } from "@/lib/search/engines/bit/resolution/posting_resolver";
import { Searchable } from "@/types/search";
import { WildcardPostingResolver } from "@/lib/search/engines/bit/resolution/wildcard_posting_resolver";

interface Item extends Searchable { id: string }

function item(id: string, ...tags: string[]): Item {
  return { id, tags: new Set(tags) };
}

function evaluatorFor(items: Item[]): BitEvaluator<Item> {
  const bitIndex = new BitIndex<Item>(doc => doc.tags);

  bitIndex.build(items);
  const metricIndex = new MetricBitIndex<Item>(doc => doc.id.length);

  metricIndex.build(bitIndex.width, bitIndex.positionalDocs());
  const wildcardResolver = new WildcardPostingResolver(bitIndex);

  wildcardResolver.index(bitIndex.indexedTerms());
  const resolver = new PostingResolver(bitIndex, metricIndex, wildcardResolver);
  return new BitEvaluator(bitIndex, resolver);
}

const corpus: Item[] = [
  item("1", "red", "sweet", "small"),
  item("2", "red", "sour", "big"),
  item("3", "green", "sweet", "big"),
  item("4", "green", "sour", "small"),
  item("5", "blue", "sweet", "small")
];

function idsFor(query: string): string[] {
  return evaluatorFor(corpus).evaluate(parseSearchExpression(query)).map(doc => doc.id).sort();
}

describe("parseSearchExpression top-level AND", () => {
  test("an empty query matches the whole corpus", () => {
    expect(idsFor("")).toEqual(["1", "2", "3", "4", "5"]);
    expect(idsFor("   ")).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("a single term", () => {
    expect(idsFor("sweet")).toEqual(["1", "3", "5"]);
  });

  test("space-separated terms intersect", () => {
    expect(idsFor("red sweet")).toEqual(["1"]);
  });

  test("a negated top-level term subtracts", () => {
    expect(idsFor("sweet -small")).toEqual(["3"]);
  });

  test("preserves a literal glued-parenthesis term", () => {
    const items = [item("a", "apple_(red)"), item("b", "banana")];
    const evaluator = evaluatorFor(items);

    expect(evaluator.evaluate(parseSearchExpression("apple_(red)")).map(d => d.id)).toEqual(["a"]);
  });
});

describe("parseSearchExpression groups", () => {
  test("a ~ group is an OR", () => {
    expect(idsFor("small ( red ~ blue )")).toEqual(["1", "5"]);
  });

  test("a space group is an AND", () => {
    expect(idsFor("( red small )")).toEqual(["1"]);
  });

  test("multiple top-level groups intersect", () => {
    expect(idsFor("( red ~ green ) ( sweet ~ sour )")).toEqual(["1", "2", "3", "4"]);
  });

  test("a negated term inside an OR group", () => {
    expect(idsFor("small ( -red ~ sweet )")).toEqual(["1", "4", "5"]);
  });
});

describe("parseSearchExpression arbitrary nesting", () => {
  test("an OR group nesting an AND group", () => {
    expect(idsFor("( sweet ~ ( green big ) )")).toEqual(["1", "3", "5"]);
  });

  test("the deeply nested example", () => {
    expect(idsFor("small ( sweet ~ ( big ( red ~ green ) ) )")).toEqual(["1", "5"]);
  });

  test("an AND group nesting an OR group", () => {
    expect(idsFor("( small ( red ~ green ) )")).toEqual(["1", "4"]);
  });
});

describe("parseSearchExpression rejects malformed input", () => {
  test("a naked top-level ~", () => {
    expect(() => parseSearchExpression("red ~ blue")).toThrow(/'~' outside a group/);
  });

  test("an unclosed group", () => {
    expect(() => parseSearchExpression("( red")).toThrow(/unclosed '\('/);
    expect(() => parseSearchExpression("( red ~ ( blue )")).toThrow(/unclosed '\('/);
  });

  test("an unmatched close paren", () => {
    expect(() => parseSearchExpression("red )")).toThrow(/unmatched '\)'/);
  });

  test("an empty group", () => {
    expect(() => parseSearchExpression("( )")).toThrow(/empty group/);
  });

  test("mixing ~ and AND in one group", () => {
    expect(() => parseSearchExpression("( a ~ b c )")).toThrow(/mixed '~' and AND/);
    expect(() => parseSearchExpression("( a b ~ c )")).toThrow(/mixed '~' and AND/);
  });

  test("a leading ~ inside a group", () => {
    expect(() => parseSearchExpression("( ~ red )")).toThrow(/no left-hand alternative/);
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
