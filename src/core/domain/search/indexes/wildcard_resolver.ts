import { BoundedCache } from "@/core/utils/collection/bounded_cache";
import { StringInterner } from "@/core/utils/string/string_interner";
import { WildcardIndex } from "@/core/domain/search/indexes/wildcard_index";
import { WildcardSearchTerm } from "@/core/domain/search/terms/wildcard_search_term";

export abstract class WildcardResolver<V> {
  private wildcardIndex: WildcardIndex;
  private readonly cache = new BoundedCache<string, V>(100);

  constructor(private readonly stringInterner: StringInterner) {
    this.wildcardIndex = new WildcardIndex(stringInterner);
  }

  public index(terms: string[]): void {
    this.wildcardIndex = new WildcardIndex(this.stringInterner, terms);
    this.cache.clear();
  }

  public add(term: string): void {
    this.wildcardIndex.add(term);
    this.cache.clear();
  }

  public remove(term: string): void {
    this.wildcardIndex.remove(term);
    this.cache.clear();
  }

  public resolve(term: WildcardSearchTerm): V {
    const key = term.resolutionInputs.regex.source;
    const cached = this.cache.get(key);

    if (cached !== undefined) {
      return cached;
    }
    const union = this.combine(this.wildcardIndex.matchingTerms(term));

    this.cache.set(key, union);
    return union;
  }

  protected abstract combine(resolvedTerms: string[]): V;
}
