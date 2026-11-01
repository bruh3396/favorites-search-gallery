import { FavoritesPagination, FavoritesPaginationPreferences } from "@/core/features/favorites/session/favorites_pagination";
import { FavoritesSearchSettings, isFilteringFavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesSearch } from "@/core/features/favorites/session/favorites_search";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";

export interface FavoritesSessionConfiguration {
  readonly favoritesSearchSettings: FavoritesSearchSettings;
}

export interface FavoritesSessionDependencies {
  favoritesSearchIndex: FavoritesSearchIndex;
  favoritesBlacklist: FavoritesBlacklist;
  randomSource: RandomSource;
  favoritesPaginationPreferences: FavoritesPaginationPreferences;
}

export class FavoritesSession {
  public readonly query: Readable<string>;
  public readonly isFiltered: Readable<boolean>;
  private readonly search: FavoritesSearch;
  private readonly pagination: FavoritesPagination;

  constructor(configuration: FavoritesSessionConfiguration, dependencies: FavoritesSessionDependencies) {
    this.search = new FavoritesSearch(configuration, dependencies);
    this.pagination = new FavoritesPagination({ favoritesSearch: this.search, preferences: dependencies.favoritesPaginationPreferences });
    this.query = computed(() => this.search.settings.value.query);
    this.isFiltered = computed(() => isFilteringFavoritesSearchSettings(this.search.settings.value));
  }

  public get searchSettings(): Readable<FavoritesSearchSettings> {
    return this.search.settings;
  }

  public get matchedFavorites(): Readable<readonly Favorite[]> {
    return this.search.matchedFavorites;
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

  public clearFilters(): void {
    this.search.clearFilters();
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
