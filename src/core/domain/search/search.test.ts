import { FruitName } from "@/core/domain/search/testing/fruit";
import { FRUIT_CORPUS } from "@/core/domain/search/testing/fruit_corpus";
import { SearchCaseAssertion } from "@/core/domain/search/testing/search_case";
import { SEARCH_CASES } from "@/core/domain/search/testing/search_cases";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/core/domain/search/engines/bit/bit_search_engine";
import { Metric } from "@/core/domain/search/metric";
import { SearchEngine } from "@/core/domain/search/engines/search_engine";
import { Searchable } from "@/core/domain/search/searchable";
import { SetSearchEngine } from "@/core/domain/search/engines/set/set_search_engine";
import { parseSearchQuery } from "@/core/domain/search/parsers/search_query_parser";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";
import { StringInterner } from "@/core/utils/string/string_interner";

type Doc = Searchable & { name: string; getMetric?: (metric: Metric) => number };
type Searcher = (query: string, docs: Doc[]) => string[];

const getMetric = (doc: Doc, metric: Metric): number => doc.getMetric?.(metric) ?? 0;
const getTerms = (doc: Doc): Iterable<string> => doc.tags;
const getName = (doc: Doc): string => doc.name;

function searchWithEngine(searchEngine: SearchEngine<Doc>, query: string, docs: Doc[]): string[] {
  let searchExpression: SearchExpression;

  try {
    searchExpression = parseSearchExpression(query);
  } catch {
    return [];
  }
  return searchEngine.search(searchExpression, docs).map(getName);
}

function createDoc(name: string, ...tags: string[]): Doc {
  return { name, tags: new Set(tags) };
}

const engines: { name: string; createEngine: (docs: Doc[]) => SearchEngine<Doc> }[] = [
  { name: "SetSearchEngine", createEngine: docs => new SetSearchEngine<Doc>({ getTerms, getMetric, stringInterner: new StringInterner() }, docs) },
  { name: "BitSearchEngine", createEngine: docs => new BitSearchEngine<Doc>({ getTerms, getMetric, stringInterner: new StringInterner() }, docs) }
];

for (const { name, createEngine } of engines) {
  describe(name, () => {
    describe("countDocsWithTerm", () => {
      test("counts the docs carrying a term", () => {
        const searchEngine = createEngine([createDoc("a", "apple"), createDoc("b", "apple", "banana")]);

        expect(["apple", "banana", "ghost"].map(term => searchEngine.countDocsWithTerm(term))).toEqual([2, 1, 0]);
      });

      test("follows added and corrected docs", () => {
        const doc = createDoc("a", "apple");
        const searchEngine = createEngine([doc]);

        searchEngine.add([createDoc("b", "apple")]);
        searchEngine.update([{ doc, oldTerms: new Set(["apple"]), newTerms: new Set(["banana"]) }]);
        expect([searchEngine.countDocsWithTerm("apple"), searchEngine.countDocsWithTerm("banana")]).toEqual([1, 1]);
      });
    });
  });
}

const implementations:{ name: string; implementation: Searcher; supportsAST: boolean }[] = [
  {
    name: "SetSearchEngine",
    implementation: (query, docs) => searchWithEngine(new SetSearchEngine<Doc>({ getTerms, getMetric, stringInterner: new StringInterner() }, docs), query, docs),
    supportsAST: true
  },
  {
    name: "BitSearchEngine",
    implementation: (query, docs) => searchWithEngine(new BitSearchEngine<Doc>({ getTerms, getMetric, stringInterner: new StringInterner() }, docs), query, docs),
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
    const assertMatches: SearchCaseAssertion = (query: string, expectedFruitNames: FruitName[]): void => {
      expect(implementation(query, FRUIT_CORPUS.fruits).sort(), query).toEqual([...expectedFruitNames].sort());
    };

    for (const searchCaseGroup of SEARCH_CASES) {
      if (searchCaseGroup.isAST && !supportsAST) {
        continue;
      }

      test(searchCaseGroup.name, () => {
        searchCaseGroup.cases?.forEach(({ query, expectedFruitNames }) => assertMatches(query, expectedFruitNames));
        searchCaseGroup.run?.(assertMatches);
      });
    }
  });
}
