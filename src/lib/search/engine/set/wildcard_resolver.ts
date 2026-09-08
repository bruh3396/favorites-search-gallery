import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

export interface WildcardResolver {
  termsStartingWith(fragment: string): string[];
  termsContaining(fragment: string): string[];
  termsEndingWith(fragment: string): string[];
  termsMatching(fragments: string[], matches: (term: string) => boolean, key: string): string[];
  addTerm(term: string): void;
  removeTerm(term: string): void;
}

export function resolveWildcardTerm(resolver: WildcardResolver, term: WildcardSearchTerm): string[] {
  const inputs = term.resolutionInputs;

  switch (inputs.matchType) {
    case WildcardMatchType.Prefix: return resolver.termsStartingWith(inputs.fragment);
    case WildcardMatchType.Suffix: return resolver.termsEndingWith(inputs.fragment);
    case WildcardMatchType.Substring: return resolver.termsContaining(inputs.fragment);
    default: return resolver.termsMatching(inputs.fragments, t => inputs.regex.test(t), inputs.regex.source);
  }
}
