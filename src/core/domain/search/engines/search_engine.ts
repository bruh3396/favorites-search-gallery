import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { Metric } from "@/core/domain/post/metric";
import { StringInterner } from "@/core/utils/string/string_interner";
import { TermUpdate } from "@/core/domain/search/engines/term_update";

export interface SearchEngineDependencies<Doc> {
  getTerms: (doc: Doc) => Iterable<string>;
  getMetric: (doc: Doc, metric: Metric) => number;
  stringInterner: StringInterner;
}

export interface SearchEngine<Doc> {
  search(expression: SearchExpression, candidates?: readonly Doc[]): readonly Doc[];
  countDocsWithTerm(term: string): number;
  rebuild(docs: readonly Doc[]): void;
  add(docs: readonly Doc[]): void;
  update(updates: readonly TermUpdate<Doc>[]): void;
}
