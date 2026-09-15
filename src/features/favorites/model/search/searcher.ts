import * as FavoritesRating from "@/features/favorites/model/search/rating";
import { NEGATED_BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/app/context/environment";
import { SearchEngine, TermUpdate } from "@/lib/search/engines/search_engine";
import { BitSearchEngine } from "@/lib/search/engines/bit/bit_search_engine";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { ObservableList } from "@/lib/collection/observable_list";
import { Preferences } from "@/app/context/preferences";
import { SearchableMetric } from "@/types/search";
import { SetSearchEngine } from "@/lib/search/engines/set/set_search_engine";
import { chain } from "@/utils/pure/function";
import { isEmptyString } from "@/utils/pure/string";
import { shuffleInPlace } from "@/utils/pure/array";

export class FavoritesSearcher {
  private readonly engine: SearchEngine<Favorite>;
  private readonly results = new ObservableList<Favorite>();
  private currentSearchQuery = "";

  constructor() {
    const termsFor = (favorite: Favorite): Set<string> => favorite.tags;
    const metricFor = (favorite: Favorite, metric: SearchableMetric): number => favorite.getMetric(metric);

    this.engine = FavoritesConfig.useBitSearchEngine ? new BitSearchEngine<Favorite>(termsFor, metricFor) : new SetSearchEngine<Favorite>(termsFor, metricFor);
  }

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
      this.engine.complementOf(this.results.get(), this.blacklistQuery()),
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

  private usingBlacklist(): boolean {
    return !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.favorites.excludeBlacklist.value;
  }

  private enforcingBlacklist(): boolean {
    return !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE;
  }

  private finalSearchQuery(): string {
    return this.usingBlacklist() ? `${this.currentSearchQuery} ${NEGATED_BLACKLISTED_TAGS}` : this.currentSearchQuery;
  }

  private findMatches(favorites: Favorite[]): Favorite[] {
    return this.filterByRating(this.searchOrPassThrough(this.finalSearchQuery(), favorites));
  }

  private blacklistQuery(): string | undefined {
    return this.enforcingBlacklist() && !isEmptyString(NEGATED_BLACKLISTED_TAGS) ? NEGATED_BLACKLISTED_TAGS : undefined;
  }

  private searchOrPassThrough(query: string, candidates: Favorite[]): Favorite[] {
    return isEmptyString(query) ? candidates : this.engine.search(query, candidates);
  }

  private filterByRating(favorites: Favorite[]): Favorite[] {
    return FavoritesRating.filterByRating(favorites, Preferences.favorites.allowedRatings.value);
  }

  private sort(favorites: Favorite[]): Favorite[] {
    const sortKey = Preferences.favorites.sortKey.value;

    if (sortKey === "random") {
      return shuffleInPlace([...favorites]);
    }

    if (sortKey === "default") {
      return favorites;
    }
    const sorted = [...favorites].sort((a, b) => b.getMetric(sortKey) - a.getMetric(sortKey));
    return Preferences.favorites.sortAscending.value ? sorted.reverse() : sorted;
  }
}
