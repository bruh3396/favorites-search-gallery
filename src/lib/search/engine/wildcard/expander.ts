import { multiStarWildcard, prefixWildcard, substringWildcard, suffixWildcard } from "@/lib/search/engine/wildcard/patterns";
import { WildcardResolver } from "@/lib/search/engine/wildcard/types";
import { chain } from "@/utils/pure/function";

export interface WildcardExpansion {
  query: string;
  isUnmatchable: boolean;
}

export class WildcardExpander {
  private readonly expanders: Array<(query: string) => string>;
  private isUnmatchable: boolean = false;

  constructor(private readonly resolver: WildcardResolver) {
    this.expanders = [
      (query): string => this.expandMultiStar(query),
      (query): string => this.expandPattern(query, substringWildcard, fragment => resolver.termsContaining(fragment)),
      (query): string => this.expandPattern(query, suffixWildcard, fragment => resolver.termsEndingWith(fragment)),
      (query): string => this.expandPattern(query, prefixWildcard, fragment => resolver.termsStartingWith(fragment))
    ];
  }

  public expand(query: string): WildcardExpansion {
    this.isUnmatchable = false;
    const expanded = chain(query, ...this.expanders);
    return { query: expanded, isUnmatchable: this.isUnmatchable };
  }

  private expandMultiStar(query: string): string {
    if (this.isUnmatchable) {
      return query;
    }
    return query.replace(multiStarWildcard, (fullMatch, negation: string, leadingStar: string, body: string, trailingStar: string, offset: number) => {
      const fragments = body.toLowerCase().split("*");
      const ordered = orderedFragmentRegex(fragments, leadingStar === "*", trailingStar === "*");
      const terms = this.resolver.termsMatching(fragments, term => ordered.test(term));
      return this.emit(fullMatch, terms, negation === "-", insideOrGroup(query, offset));
    });
  }

  private expandPattern(query: string, pattern: RegExp, findTerms: (fragment: string) => string[]): string {
    if (this.isUnmatchable) {
      return query;
    }
    return query.replace(pattern, (fullMatch, negation: string, fragment: string, offset: number) => {
      const terms = findTerms(fragment.toLowerCase());
      return this.emit(fullMatch, terms, negation === "-", insideOrGroup(query, offset));
    });
  }

  private emit(fullMatch: string, terms: string[], isNegated: boolean, isInsideOrGroup: boolean): string {
    if (terms.length === 0) {
      if (!isNegated && !isInsideOrGroup) {
        this.isUnmatchable = true;
      }
      return fullMatch;
    }
    return isNegated ? asNegatedTerms(terms) : isInsideOrGroup ? asOrTerms(terms) : asOrGroup(terms);
  }
}

function orderedFragmentRegex(fragments: string[], leadingStar: boolean, trailingStar: boolean): RegExp {
  const escaped = fragments.map(escapeRegex);
  const start = leadingStar ? ".*" : "^";
  const end = trailingStar ? ".*" : "$";
  return new RegExp(`${start}${escaped.join(".*")}${end}`);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function insideOrGroup(query: string, offset: number): boolean {
  return query.lastIndexOf("( ", offset) > query.lastIndexOf(" )", offset);
}

function asNegatedTerms(terms: string[]): string {
  return terms.map(term => `-${term}`).join(" ");
}

function asOrTerms(terms: string[]): string {
  return terms.join(" ~ ");
}

function asOrGroup(terms: string[]): string {
  return `( ${asOrTerms(terms)} )`;
}
