import { FruitName, fruitDocs } from "@/core/search/testing/fruit_corpus";
import { QueryAssertion, searchCases } from "@/core/search/testing/search_cases";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/core/search/engines/bit/bit_search_engine";
import { Metric } from "@/core/domain/post/post";
import { SearchEngine } from "@/core/search/engines/search_engine";
import { Searchable } from "@/core/search/searchable";
import { SetSearchEngine } from "@/core/search/engines/set/set_search_engine";
import { parseSearchQuery } from "@/core/search/parsers/search_term_group_parser";
import { tryParseSearchExpression } from "@/core/search/parsers/search_expression_parser";

type Doc = Searchable & { name: string; getMetric?: (metric: Metric) => number };
type Searcher = (query: string, docs: Doc[]) => string[];

const getMetric = (doc: Doc, metric: Metric): number => doc.getMetric?.(metric) ?? 0;
const getTerms = (doc: Doc): Iterable<string> => doc.tags;
const getName = (doc: Doc): string => doc.name;

function searchWithEngine(engine: SearchEngine<Doc>, query: string, docs: Doc[]): string[] {
  const expression = tryParseSearchExpression(query);
  return expression === undefined ? [] : engine.search(expression, docs).map(getName);
}

const implementations: { name: string; implementation: Searcher; supportsAST: boolean }[] = [
  {
    name: "SetSearchEngine",
    implementation: (query, docs) => searchWithEngine(new SetSearchEngine<Doc>(getTerms, getMetric, docs), query, docs),
    supportsAST: true
  },
  {
    name: "BitSearchEngine",
    implementation: (query, docs) => searchWithEngine(new BitSearchEngine<Doc>(getTerms, getMetric, docs), query, docs),
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
