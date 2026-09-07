import { PrefixIndex } from "@/lib/collection/prefix_index";
import { TrigramIndex } from "@/lib/collection/trigram_index";
import { WildcardResolver } from "@/lib/search/engine/wildcard_resolver";

export class WildcardTermResolver implements WildcardResolver {
  private prefixes: PrefixIndex;
  private trigrams: TrigramIndex;

  constructor(sortedTerms: string[] = []) {
    this.prefixes = new PrefixIndex(sortedTerms);
    this.trigrams = new TrigramIndex(sortedTerms);
  }

  public index(sortedTerms: string[]): void {
    this.prefixes = new PrefixIndex(sortedTerms);
    this.trigrams = new TrigramIndex(sortedTerms);
  }

  public termsStartingWith(fragment: string): string[] {
    return this.prefixes.termsStartingWith(fragment);
  }

  public termsContaining(fragment: string): string[] {
    return this.trigrams.termsMatching(fragment, this.prefixes.allTerms()).filter(term => term.includes(fragment));
  }

  public termsEndingWith(fragment: string): string[] {
    return this.trigrams.termsMatching(fragment, this.prefixes.allTerms()).filter(term => term.endsWith(fragment));
  }

  public termsMatching(fragments: string[], matches: (term: string) => boolean): string[] {
    return this.trigrams.termsMatchingAll(fragments, this.prefixes.allTerms()).filter(matches);
  }

  public addTerm(term: string): void {
    this.prefixes.addTerm(term);
    this.trigrams.addTerm(term);
  }

  public removeTerm(term: string): void {
    this.prefixes.removeTerm(term);
    this.trigrams.removeTerm(term);
  }
}
