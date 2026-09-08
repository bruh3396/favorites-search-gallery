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
    return this.cached(`^${fragment}`, () => this.prefixes.matchingPrefix(fragment));
  }

  public termsContaining(fragment: string): string[] {
    return this.cached(`*${fragment}*`, () => this.trigrams.matching(fragment, this.prefixes.all()).filter(term => term.includes(fragment)));
  }

  public termsEndingWith(fragment: string): string[] {
    return this.cached(`${fragment}$`, () => this.trigrams.matching(fragment, this.prefixes.all()).filter(term => term.endsWith(fragment)));
  }

  public termsMatching(fragments: string[], matches: (term: string) => boolean, key: string): string[] {
    return this.cached(`~${key}`, () => this.trigrams.matchingAll(fragments, this.prefixes.all()).filter(matches));
  }

  public addTerm(term: string): void {
    this.prefixes.add(term);
    this.trigrams.add(term);
    this.cache.clear();
  }

  public removeTerm(term: string): void {
    this.prefixes.remove(term);
    this.trigrams.remove(term);
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
