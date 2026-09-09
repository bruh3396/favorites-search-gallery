export type TermUpdate<Doc> = { doc: Doc; oldTerms: ReadonlySet<string>; newTerms: ReadonlySet<string> };
export type TermDelta = { added: string[]; removed: string[] };

export interface SearchEngine<Doc> {
  search(query: string, candidates: Doc[]): Doc[];
  invert(current: Doc[], retain?: string): Doc[];
  index(docs: Doc[]): void;
  add(docs: Doc[]): void;
  update(updates: readonly TermUpdate<Doc>[]): void;
}
