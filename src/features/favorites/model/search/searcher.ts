import * as FavoritesRating from "@/features/favorites/model/search/rating";
import { Rating, SortKey } from "@/types/search";
import { Favorite } from "@/types/favorite";
import { ObservableList } from "@/lib/collection/observable_list";
import { SearchEngine } from "@/lib/search/engine/search_engine";
import { chain } from "@/utils/pure/function";
import { shuffleInPlace } from "@/utils/pure/array";

export type SearcherConfig = {
  usingBlacklist: () => boolean;
  enforcingBlacklist: () => boolean;
  blacklistTags: string;
  allowedRatings: () => Rating;
  sortKey: () => SortKey;
  sortAscending: () => boolean;
};

export class FavoritesSearcher {
  private readonly engine = new SearchEngine<Favorite>(favorite => favorite.tags, (favorite, metric) => favorite.getMetric(metric));
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

  public invertResults(allFavorites: Favorite[]): Favorite[] {
    return chain(
      this.results.invert(allFavorites),
      matches => this.filterByRating(matches),
      matches => (this.config.enforcingBlacklist() ? this.engine.search(this.config.blacklistTags, matches) : matches),
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

  public reIndex(favorites: Favorite[]): void {
    favorites.forEach(f => this.engine.add(f));
  }

  public deIndex(favorites: Favorite[]): void {
    favorites.forEach(f => this.engine.remove(f));
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
    return this.filterByRating(this.engine.search(this.finalSearchQuery(), favorites));
  }

  private filterByRating(favorites: Favorite[]): Favorite[] {
    return FavoritesRating.filterByRating(favorites, this.config.allowedRatings());
  }

  private sort(favorites: Favorite[]): Favorite[] {
    const sortKey = this.config.sortKey();

    if (sortKey === "random") {
      return shuffleInPlace([...favorites]);
    }
    const sorted = [...favorites].sort((a, b) => b.getMetric(sortKey) - a.getMetric(sortKey));
    return this.config.sortAscending() ? sorted.reverse() : sorted;
  }
}
