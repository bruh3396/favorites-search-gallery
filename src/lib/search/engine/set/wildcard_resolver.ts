export interface WildcardResolver {
  termsStartingWith(fragment: string): string[];
  termsContaining(fragment: string): string[];
  termsEndingWith(fragment: string): string[];
  termsMatching(fragments: string[], matches: (term: string) => boolean, key: string): string[];
  addTerm(term: string): void;
  removeTerm(term: string): void;
}
