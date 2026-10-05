import { FruitName, fruitDocs } from "@/core/search/testing/fruit_corpus";
import { QueryAssertion, searchCases } from "@/core/search/testing/search_cases";
import { Searchable } from "@/core/search/searchable";
import { Metric } from "@/core/domain/post/post";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/core/search/engines/bit/bit_search_engine";
import { SetSearchEngine } from "@/core/search/engines/set/set_search_engine";
import { parseSearchQuery } from "@/core/search/parsers/search_term_group_parser";

type Doc = Searchable & { name: string; getMetric?: (metric: Metric) => number };
type Searcher = (query: string, docs: Doc[]) => string[];

const metricFor = (doc: Doc, metric: Metric): number => doc.getMetric?.(metric) ?? 0;
const termsFor = (doc: Doc): Iterable<string> => doc.tags;
const getName = (doc: Doc): string => doc.name;

const implementations: { name: string; implementation: Searcher; supportsAST: boolean }[] = [
  {
    name: "SetSearchEngine",
    implementation: (query, docs) => new SetSearchEngine<Doc>(termsFor, metricFor, docs).search(query, docs).map(getName),
    supportsAST: true
  },
  {
    name: "BitSearchEngine",
    implementation: (query, docs) => new BitSearchEngine<Doc>(termsFor, metricFor, docs).search(query, docs).map(getName),
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
