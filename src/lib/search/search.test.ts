import { FruitName, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { MetricSearchable, Searchable, SearchableMetric } from "@/types/search";
import { QueryAssertion, searchCases } from "@/lib/search/testing/search_cases";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/lib/search/engines/bit/bit_search_engine";
import { SetSearchEngine } from "@/lib/search/engines/set/set_search_engine";
import { parseSearchQuery } from "@/lib/search/parsers/search_term_group_parser";

export type MetricDoc = MetricSearchable & { name: string };
type Doc = Searchable & { name: string; getMetric?: (metric: SearchableMetric) => number };
type Searcher = (query: string, docs: Doc[]) => string[];

const metricOf = (doc: Doc, metric: SearchableMetric): number => doc.getMetric?.(metric) ?? 0;
const termsOf = (doc: Doc): Iterable<string> => doc.tags;
const nameOf = (doc: Doc): string => doc.name;

const implementations: { name: string; implementation: Searcher }[] = [
  { name: "SetSearchEngine", implementation: (query, docs) => new SetSearchEngine<Doc>(termsOf, metricOf, docs).search(query, docs).map(nameOf) },
  { name: "BitSearchEngine", implementation: (query, docs) => new BitSearchEngine<Doc>(termsOf, metricOf, docs).search(query, docs).map(nameOf) },
  { name: "SearchQuery", implementation: (query, docs) => parseSearchQuery<Doc>(query).filter(docs).map(nameOf) }
];

for (const { name, implementation } of implementations) {
  describe(`${name} end to end search cases`, () => {
    const assertMatches: QueryAssertion = (query: string, expectedNames: FruitName[]): void => {
      expect(implementation(query, fruitDocs).sort(), query).toEqual(expectedNames.slice().sort());
    };

    for (const group of searchCases) {
      test(group.name, () => {
        group.cases?.forEach(({ query, expected }) => assertMatches(query, expected));
        group.run?.(assertMatches);
      });
    }
  });
}
