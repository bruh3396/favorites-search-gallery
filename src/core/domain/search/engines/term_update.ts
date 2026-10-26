export type TermUpdate<Doc> = { readonly doc: Doc; readonly oldTerms: ReadonlySet<string>; readonly newTerms: ReadonlySet<string> };
