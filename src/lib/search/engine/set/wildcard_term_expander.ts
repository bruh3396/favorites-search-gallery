import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { ExactSearchTerm } from "@/lib/search/terms/exact_search_term";
import { SearchQuery } from "@/lib/search/engine/search_query";
import { Searchable } from "@/types/search";
import { WildcardResolver } from "@/lib/search/engine/set/wildcard_resolver";
import { normalizeSearchQuery } from "@/lib/search/parsers/search_term_group_parser";

export interface ExpandedQuery<Doc extends Searchable> {
  searchQuery: SearchQuery<Doc>;
  isUnmatchable: boolean;
}

export class WildcardTermExpander<Doc extends Searchable> {
  constructor(private readonly resolver: WildcardResolver) { }

  public expand(searchQuery: SearchQuery<Doc>): ExpandedQuery<Doc> {
    const andTerms: AbstractSearchTerm[] = [];
    const orGroups: AbstractSearchTerm[][] = [];

    for (const term of searchQuery.andTerms) {
      if (!(term instanceof WildcardSearchTerm)) {
        andTerms.push(term);
        continue;
      }
      const resolved = this.resolve(term);

      if (term.isNegated) {
        andTerms.push(...resolved.map(value => new ExactSearchTerm(value, true)));
      } else if (resolved.length === 0) {
        return { searchQuery, isUnmatchable: true };
      } else {
        orGroups.push(resolved.map(value => new ExactSearchTerm(value, false)));
      }
    }

    for (const orGroup of searchQuery.orGroups) {
      const expanded = this.expandOrGroup(orGroup);

      if (expanded.length === 0) {
        return { searchQuery, isUnmatchable: true };
      }
      orGroups.push(expanded);
    }
    return { searchQuery: normalizeSearchQuery<Doc>(andTerms, orGroups), isUnmatchable: false };
  }

  private expandOrGroup(orGroup: AbstractSearchTerm[]): AbstractSearchTerm[] {
    const expanded: AbstractSearchTerm[] = [];

    for (const term of orGroup) {
      if (!(term instanceof WildcardSearchTerm)) {
        expanded.push(term);
      } else if (!term.isNegated) {
        expanded.push(...this.resolve(term).map(value => new ExactSearchTerm(value, false)));
      }
    }
    return expanded;
  }

  private resolve(term: WildcardSearchTerm): string[] {
    const inputs = term.resolutionInputs;

    switch (inputs.matchType) {
      case WildcardMatchType.Prefix: return this.resolver.termsStartingWith(inputs.fragment);
      case WildcardMatchType.Suffix: return this.resolver.termsEndingWith(inputs.fragment);
      case WildcardMatchType.Substring: return this.resolver.termsContaining(inputs.fragment);
      default: return this.resolver.termsMatching(inputs.fragments, t => inputs.regex.test(t), inputs.regex.source);
    }
  }
}
