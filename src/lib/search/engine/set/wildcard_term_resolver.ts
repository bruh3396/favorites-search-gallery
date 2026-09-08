import { PrefixIndex } from "@/lib/search/index/prefix_index";
import { TrigramIndex } from "@/lib/search/index/trigram_index";
import { WildcardResolver } from "@/lib/search/engine/set/wildcard_resolver";

export class WildcardTermResolver implements WildcardResolver {
  private prefixes: PrefixIndex;
  private trigrams: TrigramIndex;
  private readonly cache = new Map<string, string[]>();

  constructor(sortedTerms: string[] = []) {
    this.prefixes = new PrefixIndex(sortedTerms);
    this.trigrams = new TrigramIndex(sortedTerms);
  }

  public index(sortedTerms: string[]): void {
    this.prefixes = new PrefixIndex(sortedTerms);
    this.trigrams = new TrigramIndex(sortedTerms);
    this.cache.clear();
  }

  public termsStartingWith(fragment: string): string[] {
    return this.cached(`^${fragment}`, () => this.prefixes.termsStartingWith(fragment));
  }

  public termsContaining(fragment: string): string[] {
    return this.cached(`*${fragment}*`, () => this.trigrams.termsMatching(fragment, this.prefixes.allTerms()).filter(term => term.includes(fragment)));
  }

  public termsEndingWith(fragment: string): string[] {
    return this.cached(`${fragment}$`, () => this.trigrams.termsMatching(fragment, this.prefixes.allTerms()).filter(term => term.endsWith(fragment)));
  }

  public termsMatching(fragments: string[], matches: (term: string) => boolean, key: string): string[] {
    return this.cached(`~${key}`, () => this.trigrams.termsMatchingAll(fragments, this.prefixes.allTerms()).filter(matches));
  }

  public addTerm(term: string): void {
    this.prefixes.addTerm(term);
    this.trigrams.addTerm(term);
    this.cache.clear();
  }

  public removeTerm(term: string): void {
    this.prefixes.removeTerm(term);
    this.trigrams.removeTerm(term);
    this.cache.clear();
  }

  private cached(key: string, resolve: () => string[]): string[] {
    const hit = this.cache.get(key);

    if (hit !== undefined) {
      return hit;
    }
    const resolved = resolve();

    this.cache.set(key, resolved);
    return resolved;
  }
}
