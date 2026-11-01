import { Metric } from "@/core/domain/search/metric";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { StringInterner } from "@/core/utils/string/string_interner";
import { TermUpdate } from "@/core/domain/search/engines/term_update";

export interface SearchEngineDependencies<Doc> {
  getTerms: (doc: Doc) => Iterable<string>;
  getMetric: (doc: Doc, metric: Metric) => number;
  stringInterner: StringInterner;
}

export interface SearchEngine<Doc> {
  search(searchExpression: SearchExpression, candidateDocs?: readonly Doc[]): readonly Doc[];
  countDocsWithTerm(term: string): number;
  rebuild(docs: readonly Doc[]): void;
  add(docs: readonly Doc[]): void;
  update(termUpdates: readonly TermUpdate<Doc>[]): void;
}
