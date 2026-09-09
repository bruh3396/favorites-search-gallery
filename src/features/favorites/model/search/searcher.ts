import * as FavoritesRating from "@/features/favorites/model/search/rating";
import { Rating, SearchableMetric, SortKey } from "@/types/search";
import { SearchEngine, TermUpdate } from "@/lib/search/search_engine";
import { BitmapSearchEngine } from "@/lib/search/bitmap/bitmap_search_engine";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { ObservableList } from "@/lib/collections/observable_list";
import { SetSearchEngine } from "@/lib/search/set/set_search_engine";
import { chain } from "@/utils/pure/function";
import { isEmptyString } from "@/utils/pure/string";
import { shuffleInPlace } from "@/utils/pure/array";

export type SearcherConfig = {
  usingBlacklist: () => boolean;
  enforcingBlacklist: () => boolean;
  blacklistTags: string;
  allowedRatings: () => Rating;
  sortKey: () => SortKey;
  sortAscending: () => boolean;
};

function createEngine(): SearchEngine<Favorite> {
  const termsFor = (favorite: Favorite): Set<string> => favorite.tags;
  const metricFor = (favorite: Favorite, metric: SearchableMetric): number => favorite.getMetric(metric);
  return FavoritesConfig.useBitmapSearchEngine ? new BitmapSearchEngine<Favorite>(termsFor, metricFor) : new SetSearchEngine<Favorite>(termsFor, metricFor);
}

export class FavoritesSearcher {
  private readonly engine: SearchEngine<Favorite> = createEngine();
  private readonly results = new ObservableList<Favorite>();
  private currentSearchQuery = "";

  constructor(private readonly config: SearcherConfig) { }

  public setup(onSearchResultsChanged: (results: Favorite[]) => void): void {
    this.results.setup(onSearchResultsChanged);
  }

  public search(favorites: Favorite[], searchQuery: string): Favorite[] {
    this.currentSearchQuery = searchQuery;
    return this.updateSearchResults(favorites);
  }

  public reSearch(favorites: Favorite[]): Favorite[] {
    return this.updateSearchResults(favorites);
  }

  public invertResults(): Favorite[] {
    return chain(
      this.engine.invert(this.results.get(), this.blacklistQuery()),
      matches => this.filterByRating(matches),
      matches => this.sort(matches),
      matches => this.results.set(matches)
    );
  }

  public appendResults(favorites: Favorite[]): Favorite[] {
    return this.results.append(this.findMatches(favorites));
  }

  public prependResults(favorites: Favorite[]): Favorite[] {
    return this.results.prepend(this.findMatches(favorites));
  }

  public index(favorites: Favorite[]): void {
    this.engine.index(favorites);
  }

  public add(favorites: Favorite[]): void {
    this.engine.add(favorites);
  }

  public update(updates: readonly TermUpdate<Favorite>[]): void {
    this.engine.update(updates);
  }

  public getCurrentSearchQuery(): string {
    return this.currentSearchQuery;
  }

  public getCurrentSearchResults(): Favorite[] {
    return this.results.get();
  }

  public shuffleSearchResults(): Favorite[] {
    return this.results.shuffle();
  }

  private updateSearchResults(favorites: Favorite[]): Favorite[] {
    return this.results.set(this.sort(this.findMatches(favorites)));
  }

  private finalSearchQuery(): string {
    return this.config.usingBlacklist() ? `${this.currentSearchQuery} ${this.config.blacklistTags}` : this.currentSearchQuery;
  }

  private findMatches(favorites: Favorite[]): Favorite[] {
    return this.filterByRating(this.searchOrPassThrough(this.finalSearchQuery(), favorites));
  }

  private blacklistQuery(): string | undefined {
    return this.config.enforcingBlacklist() && !isEmptyString(this.config.blacklistTags) ? this.config.blacklistTags : undefined;
  }

  private searchOrPassThrough(query: string, candidates: Favorite[]): Favorite[] {
    return isEmptyString(query) ? candidates : this.engine.search(query, candidates);
  }

  private filterByRating(favorites: Favorite[]): Favorite[] {
    return FavoritesRating.filterByRating(favorites, this.config.allowedRatings());
  }

  private sort(favorites: Favorite[]): Favorite[] {
    const sortKey = this.config.sortKey();

    if (sortKey === "random") {
      return shuffleInPlace([...favorites]);
    }

    if (sortKey === "default") {
      return favorites;
    }
    const sorted = [...favorites].sort((a, b) => b.getMetric(sortKey) - a.getMetric(sortKey));
    return this.config.sortAscending() ? sorted.reverse() : sorted;
  }
}
