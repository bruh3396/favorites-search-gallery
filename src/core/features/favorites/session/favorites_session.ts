import { FavoritesPagination, FavoritesPaginationDependencies } from "@/core/features/favorites/session/favorites_pagination";
import { FavoritesSearchOptions, countChangedFavoritesSearchOptions, isFilteringFavoritesSearchOptions } from "@/core/features/favorites/search/favorites_search_options";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesSearch } from "@/core/features/favorites/session/favorites_search";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";

export interface FavoritesSessionConfiguration {
  readonly favoritesSearchOptions: FavoritesSearchOptions;
}

export interface FavoritesSessionDependencies {
  favoritesSearchIndex: FavoritesSearchIndex;
  favoritesBlacklist: FavoritesBlacklist;
  randomSource: RandomSource;
  favoritesPaginationPreferences: FavoritesPaginationDependencies["preferences"];
}

export class FavoritesSession {
  public readonly query: Readable<string>;
  public readonly isFiltered: Readable<boolean>;
  public readonly changedSearchOptionCount: Readable<number>;
  private readonly search: FavoritesSearch;
  private readonly pagination: FavoritesPagination;

  constructor(configuration: FavoritesSessionConfiguration, dependencies: FavoritesSessionDependencies) {
    const { favoritesSearchIndex, favoritesBlacklist, randomSource, favoritesPaginationPreferences } = dependencies;

    this.search = new FavoritesSearch(
      { favoritesSearchOptions: configuration.favoritesSearchOptions },
      { favoritesSearchIndex, favoritesBlacklist, randomSource }
    );
    this.pagination = new FavoritesPagination({ favoritesSearch: this.search, preferences: favoritesPaginationPreferences });
    this.query = computed(() => this.search.options.value.query);
    this.isFiltered = computed(() => isFilteringFavoritesSearchOptions(this.search.options.value));
    this.changedSearchOptionCount = computed(() => countChangedFavoritesSearchOptions(this.search.options.value));
  }

  public get searchOptions(): Readable<FavoritesSearchOptions> {
    return this.search.options;
  }

  public get matchedFavorites(): Readable<readonly Favorite[]> {
    return this.search.matchedFavorites;
  }

  public get searched(): Occurrence<void> {
    return this.search.searched;
  }

  public get pageFavorites(): Readable<readonly Favorite[]> {
    return this.pagination.pageFavorites;
  }

  public get pageNumber(): Readable<number> {
    return this.pagination.pageNumber;
  }

  public get pageCount(): Readable<number> {
    return this.pagination.pageCount;
  }

  public start(): void {
    this.search.start();
  }

  public submit(query: string): void {
    this.search.submit(query);
  }

  public invert(): void {
    this.search.invert();
  }

  public toggleBlacklist(): void {
    this.search.toggleBlacklist();
  }

  public shuffle(): void {
    this.search.shuffle();
  }

  public updateSearchOptions(partialFavoritesSearchOptions: Partial<FavoritesSearchOptions>): void {
    this.search.updateOptions(partialFavoritesSearchOptions);
  }

  public resetSearchOptions(): void {
    this.search.resetOptions();
  }

  public clearSearch(): void {
    this.search.clearSearch();
  }

  public goTo(pageNumber: number): void {
    this.pagination.goTo(pageNumber);
  }

  public goToPageContaining(favorite: Favorite): void {
    this.pagination.goToContaining(favorite);
  }

  public dispose(): void {
    this.pagination.dispose();
    this.search.dispose();
  }
}
