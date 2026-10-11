import { SearchExpression } from "@/core/search/expressions/search_expression";

export type TermUpdate<Doc> = { readonly doc: Doc; readonly oldTerms: ReadonlySet<string>; readonly newTerms: ReadonlySet<string> };
export type TermDelta = { readonly added: readonly string[]; readonly removed: readonly string[] };

export interface SearchEngine<Doc> {
  search(expression: SearchExpression, candidates?: readonly Doc[]): readonly Doc[];
  rebuild(docs: readonly Doc[]): void;
  add(docs: readonly Doc[]): void;
  update(updates: readonly TermUpdate<Doc>[]): void;
}
