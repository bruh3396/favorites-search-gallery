import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSearch } from "@/core/features/favorites/session/favorites_search";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { clamp } from "@/core/utils/number/number_utilities";
import { haveSameItems } from "@/core/utils/collection/array_utilities";

export interface FavoritesPaginationPreferences {
  readonly pageSize: StoredValue<number>;
  readonly infiniteScroll: StoredValue<boolean>;
}

export interface FavoritesPaginationDependencies {
  favoritesSearch: FavoritesSearch;
  preferences: FavoritesPaginationPreferences;
}

const INFINITE_SCROLL_PAGE_SIZE = 25;

export class FavoritesPagination {
  private readonly requestedPageNumber: Signal<number>;
  public readonly pageCount: Readable<number>;
  public readonly pageNumber: Readable<number>;
  public readonly pageFavorites: Readable<readonly Favorite[]>;
  private readonly stopListening: Array<() => void>;

  constructor(private readonly dependencies: FavoritesPaginationDependencies) {
    const { favoritesSearch, preferences: favoritesPaginationPreferences } = dependencies;

    this.requestedPageNumber = new Signal(1);
    this.pageCount = computed(() => Math.max(1, Math.ceil(favoritesSearch.matchedFavorites.value.length / this.getPageSize())));
    this.pageNumber = computed(() => clamp(this.requestedPageNumber.value, 1, this.pageCount.value));
    this.pageFavorites = computed(() => this.sliceItems(), { equals: haveSameItems });
    this.stopListening = [
      favoritesSearch.searched.on(() => this.goToFirst()),
      favoritesPaginationPreferences.pageSize.changed.on(() => this.goToFirst()),
      favoritesPaginationPreferences.infiniteScroll.changed.on(() => this.goToFirst())
    ];
  }

  public goTo(pageNumber: number): void {
    this.requestedPageNumber.value = clamp(pageNumber, 1, this.pageCount.peek());
  }

  public goToContaining(favorite: Favorite): void {
    const index = this.dependencies.favoritesSearch.matchedFavorites.peek().indexOf(favorite);

    if (index >= 0) {
      this.goTo(Math.floor(index / this.getPageSize()) + 1);
    }
  }

  public dispose(): void {
    for (const stop of this.stopListening) {
      stop();
    }
  }

  private goToFirst(): void {
    this.requestedPageNumber.value = 1;
  }

  private sliceItems(): readonly Favorite[] {
    const pageSize = this.getPageSize();
    const pageNumber = this.pageNumber.value;
    const start = this.dependencies.preferences.infiniteScroll.value ? 0 : (pageNumber - 1) * pageSize;
    return this.dependencies.favoritesSearch.matchedFavorites.value.slice(start, pageNumber * pageSize);
  }

  private getPageSize(): number {
    const { pageSize: favoritesPaginationPageSize, infiniteScroll: favoritesPaginationInfiniteScroll } = this.dependencies.preferences;
    return favoritesPaginationInfiniteScroll.value ? INFINITE_SCROLL_PAGE_SIZE : Math.max(1, favoritesPaginationPageSize.value);
  }
}
