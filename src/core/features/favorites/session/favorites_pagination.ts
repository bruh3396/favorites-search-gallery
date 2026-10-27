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
  search: FavoritesSearch;
  preferences: FavoritesPaginationPreferences;
}

const INFINITE_SCROLL_PAGE_SIZE = 25;

export class FavoritesPagination {
  private readonly requestedPageNumber: Signal<number>;
  private readonly currentPageCount: Readable<number>;
  private readonly currentPageNumber: Readable<number>;
  private readonly currentItems: Readable<readonly Favorite[]>;
  private readonly stopListening: Array<() => void>;

  constructor(private readonly dependencies: FavoritesPaginationDependencies) {
    const { search, preferences } = dependencies;

    this.requestedPageNumber = new Signal(1);
    this.currentPageCount = computed(() => Math.max(1, Math.ceil(search.results.value.length / this.getPageSize())));
    this.currentPageNumber = computed(() => clamp(this.requestedPageNumber.value, 1, this.currentPageCount.value));
    this.currentItems = computed(() => this.sliceItems(), { equals: haveSameItems });
    this.stopListening = [
      search.searched.on(() => this.goToFirst()),
      preferences.pageSize.changed.on(() => this.goToFirst()),
      preferences.infiniteScroll.changed.on(() => this.goToFirst())
    ];
  }

  public get items(): Readable<readonly Favorite[]> {
    return this.currentItems;
  }

  public get pageNumber(): Readable<number> {
    return this.currentPageNumber;
  }

  public get pageCount(): Readable<number> {
    return this.currentPageCount;
  }

  public goTo(pageNumber: number): void {
    this.requestedPageNumber.value = clamp(pageNumber, 1, this.currentPageCount.peek());
  }

  public goToContaining(item: Favorite): void {
    const index = this.dependencies.search.results.peek().indexOf(item);

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
    const pageNumber = this.currentPageNumber.value;
    const start = this.dependencies.preferences.infiniteScroll.value ? 0 : (pageNumber - 1) * pageSize;
    return this.dependencies.search.results.value.slice(start, pageNumber * pageSize);
  }

  private getPageSize(): number {
    const { pageSize, infiniteScroll } = this.dependencies.preferences;
    return infiniteScroll.value ? INFINITE_SCROLL_PAGE_SIZE : Math.max(1, pageSize.value);
  }
}
