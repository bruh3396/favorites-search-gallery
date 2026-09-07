import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { ExactSearchTerm } from "@/lib/search/terms/exact_search_term";
import { SearchQuery } from "@/lib/search/engine/search_query";
import { Searchable } from "@/types/search";
import { WildcardResolver } from "@/lib/search/engine/wildcard_resolver";
import { normalizeSearchQuery } from "@/lib/search/parsers/search_term_group_parser";

export function expandWildcardTerms<T extends Searchable>(
  searchQuery: SearchQuery<T>,
  resolver: WildcardResolver
): {
  searchQuery: SearchQuery<T>;
  isUnmatchable: boolean;
} {
  const andTerms: AbstractSearchTerm[] = [];
  const orGroups: AbstractSearchTerm[][] = [];

  for (const term of searchQuery.andTerms) {
    if (!(term instanceof WildcardSearchTerm)) {
      andTerms.push(term);
      continue;
    }
    const resolved = resolve(term, resolver);

    if (term.isNegated) {
      andTerms.push(...resolved.map(value => new ExactSearchTerm(value, true)));
    } else if (resolved.length === 0) {
      return { searchQuery, isUnmatchable: true };
    } else {
      orGroups.push(resolved.map(value => new ExactSearchTerm(value, false)));
    }
  }

  for (const orGroup of searchQuery.orGroups) {
    const expanded = expandOrGroup(orGroup, resolver);

    if (expanded.length === 0) {
      return { searchQuery, isUnmatchable: true };
    }
    orGroups.push(expanded);
  }
  return { searchQuery: normalizeSearchQuery<T>(andTerms, orGroups), isUnmatchable: false };
}

function expandOrGroup(orGroup: AbstractSearchTerm[], resolver: WildcardResolver): AbstractSearchTerm[] {
  const expanded: AbstractSearchTerm[] = [];

  for (const term of orGroup) {
    if (!(term instanceof WildcardSearchTerm)) {
      expanded.push(term);
    } else if (!term.isNegated) {
      expanded.push(...resolve(term, resolver).map(value => new ExactSearchTerm(value, false)));
    }
  }
  return expanded;
}

function resolve(term: WildcardSearchTerm, resolver: WildcardResolver): string[] {
  const inputs = term.resolutionInputs;

  switch (inputs.matchType) {
    case WildcardMatchType.Prefix: return resolver.termsStartingWith(inputs.fragment);
    case WildcardMatchType.Suffix: return resolver.termsEndingWith(inputs.fragment);
    case WildcardMatchType.Substring: return resolver.termsContaining(inputs.fragment);
    default: return resolver.termsMatching(inputs.fragments, t => inputs.regex.test(t));
  }
}
