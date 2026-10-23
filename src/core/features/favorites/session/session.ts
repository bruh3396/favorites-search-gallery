import { FavoritesPagination, FavoritesPaginationSettings } from "@/core/features/favorites/session/pagination";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { SearchSettings, isFiltered } from "@/core/features/favorites/search/inputs";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesSearch } from "@/core/features/favorites/session/search";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { Preference } from "@/core/utils/reactive/preference";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";

export interface FavoritesSessionConfiguration {
  readonly settings: SearchSettings;
}

export interface FavoritesSessionDependencies {
  searchIndex: FavoritesSearchIndex;
  blacklist: FavoritesBlacklist;
  randomSource: RandomSource;
  paginationSettings: Preference<FavoritesPaginationSettings>;
}

export class FavoritesSession {
  private readonly search: FavoritesSearch;
  private readonly pagination: FavoritesPagination;
  private readonly currentQuery: Readable<string>;
  private readonly currentlyFiltered: Readable<boolean>;

  constructor(configuration: FavoritesSessionConfiguration, dependencies: FavoritesSessionDependencies) {
    this.search = new FavoritesSearch(configuration, dependencies);
    this.pagination = new FavoritesPagination({ search: this.search, paginationSettings: dependencies.paginationSettings });
    this.currentQuery = computed(() => this.search.settings.value.query);
    this.currentlyFiltered = computed(() => isFiltered(this.search.settings.value));
  }

  public get settings(): Readable<SearchSettings> {
    return this.search.settings;
  }

  public get query(): Readable<string> {
    return this.currentQuery;
  }

  public get isFiltered(): Readable<boolean> {
    return this.currentlyFiltered;
  }

  public get results(): Readable<readonly Favorite[]> {
    return this.search.results;
  }

  public get pageItems(): Readable<readonly Favorite[]> {
    return this.pagination.items;
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

  public goToPageContaining(item: { id: string }): void {
    this.pagination.goToContaining(item);
  }

  public dispose(): void {
    this.pagination.dispose();
    this.search.dispose();
  }
}
