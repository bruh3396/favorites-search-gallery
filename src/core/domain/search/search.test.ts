import { FruitName, fruitDocs } from "@/core/domain/search/testing/fruit_corpus";
import { QueryAssertion, searchCases } from "@/core/domain/search/testing/search_cases";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/core/domain/search/engines/bit/bit_search_engine";
import { Metric } from "@/core/domain/post/metric";
import { SearchEngine } from "@/core/domain/search/engines/search_engine";
import { Searchable } from "@/core/domain/search/searchable";
import { SetSearchEngine } from "@/core/domain/search/engines/set/set_search_engine";
import { parseSearchQuery } from "@/core/domain/search/parsers/search_query_parser";
import { tryParseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";
import { StringInterner } from "@/core/utils/string/string_interner";

type Doc = Searchable & { name: string; getMetric?: (metric: Metric) => number };
type Searcher = (query: string, docs: Doc[]) => string[];

const getMetric = (doc: Doc, metric: Metric): number => doc.getMetric?.(metric) ?? 0;
const getTerms = (doc: Doc): Iterable<string> => doc.tags;
const getName = (doc: Doc): string => doc.name;

function searchWithEngine(engine: SearchEngine<Doc>, query: string, docs: Doc[]): string[] {
  const expression = tryParseSearchExpression(query);
  return expression === undefined ? [] : engine.search(expression, docs).map(getName);
}

function createDoc(name: string, ...tags: string[]): Doc {
  return { name, tags: new Set(tags) };
}

const engines: { name: string; createEngine: (docs: Doc[]) => SearchEngine<Doc> }[] = [
  { name: "SetSearchEngine", createEngine: docs => new SetSearchEngine<Doc>({ getTerms: getTerms, getMetric: getMetric, stringInterner: new StringInterner() }, docs) },
  { name: "BitSearchEngine", createEngine: docs => new BitSearchEngine<Doc>({ getTerms: getTerms, getMetric: getMetric, stringInterner: new StringInterner() }, docs) }
];

for (const { name, createEngine } of engines) {
  describe(name, () => {
    describe("countDocsWithTerm", () => {
      test("counts the docs carrying a term", () => {
        const engine = createEngine([createDoc("a", "apple"), createDoc("b", "apple", "banana")]);

        expect(["apple", "banana", "ghost"].map(term => engine.countDocsWithTerm(term))).toEqual([2, 1, 0]);
      });

      test("follows added and corrected docs", () => {
        const target = createDoc("a", "apple");
        const engine = createEngine([target]);

        engine.add([createDoc("b", "apple")]);
        engine.update([{ doc: target, oldTerms: new Set(["apple"]), newTerms: new Set(["banana"]) }]);
        expect([engine.countDocsWithTerm("apple"), engine.countDocsWithTerm("banana")]).toEqual([1, 1]);
      });
    });
  });
}

const implementations:{ name: string; implementation: Searcher; supportsAST: boolean }[] = [
  {
    name: "SetSearchEngine",
    implementation: (query, docs) => searchWithEngine(new SetSearchEngine<Doc>({ getTerms: getTerms, getMetric: getMetric, stringInterner: new StringInterner() }, docs), query, docs),
    supportsAST: true
  },
  {
    name: "BitSearchEngine",
    implementation: (query, docs) => searchWithEngine(new BitSearchEngine<Doc>({ getTerms: getTerms, getMetric: getMetric, stringInterner: new StringInterner() }, docs), query, docs),
    supportsAST: true
  },
  {
    name: "SearchQuery",
    implementation: (query, docs) => parseSearchQuery<Doc>(query).filter(docs).map(getName),
    supportsAST: false
  }
];

for (const { name, implementation, supportsAST } of implementations) {
  describe(name, () => {
    const assertMatches: QueryAssertion = (query: string, expectedNames: FruitName[]): void => {
      expect(implementation(query, fruitDocs).sort(), query).toEqual([...expectedNames].sort());
    };

    for (const group of searchCases) {
      if (group.isAST && !supportsAST) {
        continue;
      }

      test(group.name, () => {
        group.cases?.forEach(({ query, expected }) => assertMatches(query, expected));
        group.run?.(assertMatches);
      });
    }
  });
}
