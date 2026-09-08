import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/query/terms/wildcard_search_term";
import { PrefixIndex } from "@/lib/search/indexes/prefix_index";
import { TrigramIndex } from "@/lib/search/indexes/trigram_index";
import { identity } from "@/utils/pure/function";

export class WildcardMatcher<T = string> {
  private prefixes: PrefixIndex<T>;
  private trigrams: TrigramIndex<T>;
  private readonly cache = new Map<string, T[]>();

  constructor(private readonly keyOf: (item: T) => string = identity as (item: T) => string, items: T[] = []) {
    this.prefixes = new PrefixIndex<T>(items, keyOf);
    this.trigrams = new TrigramIndex<T>(items, keyOf);
  }

  public index(items: T[]): void {
    this.prefixes = new PrefixIndex<T>(items, this.keyOf);
    this.trigrams = new TrigramIndex<T>(items, this.keyOf);
    this.cache.clear();
  }

  public match(term: WildcardSearchTerm): T[] {
    const inputs = term.resolutionInputs;

    switch (inputs.matchType) {
      case WildcardMatchType.Prefix:
        return this.cached(`^${inputs.fragment}`, () => this.prefixes.matchingPrefix(inputs.fragment));
      case WildcardMatchType.Suffix:
        return this.cached(`${inputs.fragment}$`, () => this.filtered(inputs.fragment, key => key.endsWith(inputs.fragment)));
      case WildcardMatchType.Substring:
        return this.cached(`*${inputs.fragment}*`, () => this.filtered(inputs.fragment, key => key.includes(inputs.fragment)));
      default:
        return this.cached(`~${inputs.regex.source}`, () => this.filteredAll(inputs.fragments, key => inputs.regex.test(key)));
    }
  }

  public add(item: T): void {
    this.prefixes.add(item);
    this.trigrams.add(item);
    this.cache.clear();
  }

  public remove(item: T): void {
    this.prefixes.remove(item);
    this.trigrams.remove(item);
    this.cache.clear();
  }

  private filtered(fragment: string, matches: (key: string) => boolean): T[] {
    return this.trigrams.matching(fragment, this.prefixes.all()).filter(item => matches(this.keyOf(item)));
  }

  private filteredAll(fragments: string[], matches: (key: string) => boolean): T[] {
    return this.trigrams.matchingAll(fragments, this.prefixes.all()).filter(item => matches(this.keyOf(item)));
  }

  private cached(key: string, resolve: () => T[]): T[] {
    const hit = this.cache.get(key);

    if (hit !== undefined) {
      return hit;
    }
    const resolved = resolve();

    this.cache.set(key, resolved);
    return resolved;
  }
}
