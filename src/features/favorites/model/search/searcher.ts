import { ALL_RATINGS, RatingMask, SortKey } from "@/types/search";
import { SearchEngine, TermUpdate } from "@/core/search/engines/search_engine";
import { BitSearchEngine } from "@/core/search/engines/bit/bit_search_engine";
import { Searcher } from "@/features/favorites/types/types";
import { Favorite } from "@/types/favorite";
import { ObservableList } from "@/core/utils/collection/observable_list";
import { Preference } from "@/lib/storage/preference";
import { Preferences } from "@/app/context/preferences";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Metric } from "@/core/domain/post/post";
import { isEmptyString } from "@/core/utils/string/string";
import { shuffleInPlace } from "@/core/utils/collection/array";
import { tryParseSearchExpression } from "@/core/search/parsers/search_expression_parser";

export interface FavoritesSearcherConfiguration {
  userIsOnTheirOwnFavoritesPage: boolean;
  blacklistedTags: string;
}

export interface FavoritesSearcherDependencies {
  termsFor: (favorite: Favorite) => Set<string>;
  ratingFor: (favorite: Favorite) => RatingMask;
  preferences: Preferences;
  randomSource: RandomSource;
  onSearchResultsChanged: (results: Favorite[]) => void;
}

export class FavoritesSearcher implements Searcher {
  private readonly engine: SearchEngine<Favorite>;
  private readonly ratingFor: (favorite: Favorite) => RatingMask;
  private readonly results: ObservableList<Favorite>;
  private readonly excludeBlacklist: Preference<boolean>;
  private readonly allowedRatings: Preference<RatingMask>;
  private readonly sortKey: Preference<SortKey>;
  private readonly sortAscending: Preference<boolean>;
  private readonly userIsOnTheirOwnFavoritesPage: boolean;
  private readonly negatedBlacklistedTags: string;
  private readonly randomSource: RandomSource;
  private currentSearchQuery: string;

  constructor(configuration: FavoritesSearcherConfiguration, { termsFor, ratingFor, preferences, randomSource, onSearchResultsChanged }: FavoritesSearcherDependencies) {
    const metricFor = (favorite: Favorite, metric: Metric): number => favorite.getMetric(metric);

    this.engine = new BitSearchEngine<Favorite>(termsFor, metricFor);
    this.ratingFor = ratingFor;
    this.results = new ObservableList<Favorite>(onSearchResultsChanged);
    this.excludeBlacklist = preferences.favorites.excludeBlacklist;
    this.allowedRatings = preferences.favorites.allowedRatings;
    this.sortKey = preferences.favorites.sortKey;
    this.sortAscending = preferences.favorites.sortAscending;
    this.userIsOnTheirOwnFavoritesPage = configuration.userIsOnTheirOwnFavoritesPage;
    this.negatedBlacklistedTags = configuration.blacklistedTags.replace(/(\S+)/g, "-$1");
    this.randomSource = randomSource;
    this.currentSearchQuery = "";
  }

  public search(favorites: Favorite[], searchQuery: string): Favorite[] {
    this.currentSearchQuery = searchQuery;
    return this.updateSearchResults(favorites);
  }

  public searchPure(favorites: Favorite[], searchQuery: string): Favorite[] {
    const query = this.usingBlacklist() ? `${searchQuery} ${this.negatedBlacklistedTags}` : searchQuery;
    const matches = isEmptyString(query) ? favorites : this.searchEngine(query, favorites);
    return this.filterByRating(matches);
  }

  public reSearch(favorites: Favorite[]): Favorite[] {
    return this.updateSearchResults(favorites);
  }

  public invertResults(): Favorite[] {
    return [];
  }

  public appendResults(favorites: Favorite[]): Favorite[] {
    return this.results.append(this.findMatches(favorites));
  }

  public prependResults(favorites: Favorite[]): Favorite[] {
    return this.results.prepend(this.findMatches(favorites));
  }

  public index(favorites: Favorite[]): void {
    this.engine.rebuild(favorites);
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
    return this.results.shuffle(this.randomSource);
  }

  private updateSearchResults(favorites: Favorite[]): Favorite[] {
    return this.results.set(this.sort(this.findMatches(favorites)));
  }

  private usingBlacklist(): boolean {
    return !this.userIsOnTheirOwnFavoritesPage || this.excludeBlacklist.value;
  }

  private finalSearchQuery(): string {
    return this.usingBlacklist() ? `${this.currentSearchQuery} ${this.negatedBlacklistedTags}` : this.currentSearchQuery;
  }

  private findMatches(favorites: Favorite[]): Favorite[] {
    const query = this.finalSearchQuery();
    const result = isEmptyString(query) ? favorites : this.searchEngine(query, favorites);
    return this.filterByRating(result);
  }

  private searchEngine(query: string, favorites: Favorite[]): Favorite[] {
    const expression = tryParseSearchExpression(query);
    return expression === undefined ? [] : this.engine.search(expression, favorites);
  }

  private filterByRating(favorites: Favorite[]): Favorite[] {
    const allowedRatings = this.allowedRatings.value;
    return allowedRatings === ALL_RATINGS ? favorites : favorites.filter(favorite => (this.ratingFor(favorite) & allowedRatings) > 0);
  }

  private sort(favorites: Favorite[]): Favorite[] {
    const sortKey = this.sortKey.value;

    if (sortKey === "random") {
      return shuffleInPlace(this.randomSource, [...favorites]);
    }
    const isAscending = this.sortAscending.value;

    if (sortKey === "default") {
      return isAscending ? [...favorites].reverse() : favorites;
    }
    const sorted = [...favorites].sort((a, b) => b.getMetric(sortKey) - a.getMetric(sortKey));
    return isAscending ? sorted.reverse() : sorted;
  }
}
