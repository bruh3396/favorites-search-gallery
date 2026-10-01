import { ALL_RATINGS, Rating, SearchableMetric, SortKey } from "@/types/search";
import { SearchEngine, TermUpdate } from "@/lib/search/engines/search_engine";
import { BitSearchEngine } from "@/lib/search/engines/bit/bit_search_engine";
import { Environment } from "@/core/boundary/environment";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { ObservableList } from "@/lib/collection/observable_list";
import { Preference } from "@/lib/storage/preference";
import { Preferences } from "@/app/context/preferences";
import { Random } from "@/core/boundary/ports/random";
import { Searcher } from "@/features/favorites/types/types";
import { SetSearchEngine } from "@/lib/search/engines/set/set_search_engine";
import { chain } from "@/utils/pure/function";
import { isEmptyString } from "@/utils/pure/string";
import { negateTags } from "@/utils/pure/tag";
import { shuffleInPlace } from "@/utils/pure/array";

export class FavoritesSearcher implements Searcher {
  private readonly engine: SearchEngine<Favorite>;
  private readonly results: ObservableList<Favorite>;
  private readonly excludeBlacklist: Preference<boolean>;
  private readonly allowedRatings: Preference<Rating>;
  private readonly sortKey: Preference<SortKey>;
  private readonly sortAscending: Preference<boolean>;
  private readonly userIsOnTheirOwnFavoritesPage: boolean;
  private readonly negatedBlacklistedTags: string;
  private readonly random: Random;
  private currentSearchQuery: string;

  constructor(preferences: Preferences, environment: Environment, random: Random, onSearchResultsChanged: (results: Favorite[]) => void) {
    const termsFor = (favorite: Favorite): Set<string> => favorite.consumeTags();
    const metricFor = (favorite: Favorite, metric: SearchableMetric): number => favorite.getMetric(metric);

    this.engine = FavoritesConfig.useBitSearchEngine ? new BitSearchEngine<Favorite>(termsFor, metricFor) : new SetSearchEngine<Favorite>(termsFor, metricFor);
    this.results = new ObservableList<Favorite>(onSearchResultsChanged);
    this.excludeBlacklist = preferences.favorites.excludeBlacklist;
    this.allowedRatings = preferences.favorites.allowedRatings;
    this.sortKey = preferences.favorites.sortKey;
    this.sortAscending = preferences.favorites.sortAscending;
    this.userIsOnTheirOwnFavoritesPage = environment.ownsFavorites;
    this.negatedBlacklistedTags = negateTags(environment.blacklistedTags);
    this.random = random;
    this.currentSearchQuery = "";
  }

  public search(favorites: Favorite[], searchQuery: string): Favorite[] {
    this.currentSearchQuery = searchQuery;
    return this.updateSearchResults(favorites);
  }

  public searchPure(favorites: Favorite[], searchQuery: string): Favorite[] {
    const query = this.usingBlacklist() ? `${searchQuery} ${this.negatedBlacklistedTags}` : searchQuery;
    const matches = isEmptyString(query) ? favorites : this.engine.search(query, favorites);
    return this.filterByRating(matches);
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
    return this.results.shuffle(this.random);
  }

  private updateSearchResults(favorites: Favorite[]): Favorite[] {
    return this.results.set(this.sort(this.findMatches(favorites)));
  }

  private usingBlacklist(): boolean {
    return !this.userIsOnTheirOwnFavoritesPage || this.excludeBlacklist.value;
  }

  private enforcingBlacklist(): boolean {
    return !this.userIsOnTheirOwnFavoritesPage;
  }

  private finalSearchQuery(): string {
    return this.usingBlacklist() ? `${this.currentSearchQuery} ${this.negatedBlacklistedTags}` : this.currentSearchQuery;
  }

  private findMatches(favorites: Favorite[]): Favorite[] {
    const query = this.finalSearchQuery();
    const result = isEmptyString(query) ? favorites : this.engine.search(query, favorites);
    return this.filterByRating(result);
  }

  private blacklistQuery(): string | undefined {
    return this.enforcingBlacklist() && !isEmptyString(this.negatedBlacklistedTags) ? this.negatedBlacklistedTags : undefined;
  }

  private filterByRating(favorites: Favorite[]): Favorite[] {
    const allowedRatings = this.allowedRatings.value;
    return allowedRatings === ALL_RATINGS ? favorites : favorites.filter(favorite => (favorite.rating & allowedRatings) > 0);
  }

  private sort(favorites: Favorite[]): Favorite[] {
    const sortKey = this.sortKey.value;

    if (sortKey === "random") {
      return shuffleInPlace(this.random, [...favorites]);
    }
    const isAscending = this.sortAscending.value;

    if (sortKey === "default") {
      return isAscending ? [...favorites].reverse() : favorites;
    }
    const sorted = [...favorites].sort((a, b) => b.getMetric(sortKey) - a.getMetric(sortKey));
    return isAscending ? sorted.reverse() : sorted;
  }
}
