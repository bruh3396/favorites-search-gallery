import { BoundedCache } from "@/lib/collections/bounded_cache";
import { WildcardIndex } from "@/lib/search/indexes/wildcard_index";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

export abstract class WildcardResolver<V> {
  private wildcardIndex = new WildcardIndex();
  private readonly cache = new BoundedCache<string, V>(100);

  public index(terms: string[]): void {
    this.wildcardIndex = new WildcardIndex(terms);
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

    if (cached !== undefined || this.cache.has(key)) {
      return cached as V;
    }
    const union = this.combine(this.wildcardIndex.matchingTerms(term));

    this.cache.set(key, union);
    return union;
  }

  protected abstract combine(resolvedTerms: string[]): V;
}
