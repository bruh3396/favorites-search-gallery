import { PaginationResult, PaginationSettings, getPageSize, paginate } from "@/core/features/favorites/search/pagination";
import { Readable, Signal, batch, computed } from "@/core/utils/reactive/signal";
import { SearchRequest, SearchSettings } from "@/core/features/favorites/search/inputs";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { ListSequence } from "@/core/features/favorites/search/list_sequence";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { Preference } from "@/core/utils/reactive/preference";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { buildSearchRequest } from "@/core/features/favorites/search/request";
import { clamp } from "@/core/utils/number/number";
import { haveSameItems } from "@/core/utils/collection/array";

export interface FavoritesSearchSessionConfiguration {
  readonly searchSettings: SearchSettings;
}

export interface FavoritesSearchSessionDependencies {
  index: FavoritesSearchIndex;
  blacklist: FavoritesBlacklist;
  paginationSettings: Pick<Preference<PaginationSettings>, "value" | "changed">;
  randomSource: RandomSource;
}

export type FavoritesSearchSessionSettingDependencies = Pick<FavoritesSearchSessionDependencies, "paginationSettings">;

const SEED_RANGE = 2 ** 32;

export class FavoritesSearchSession {
  private readonly currentSettings: Signal<SearchSettings>;
  private readonly request: Readable<SearchRequest>;
  private readonly currentResults = new Signal<readonly Favorite[]>([]);
  private readonly pageNumber = new Signal(1);
  private readonly currentPagination: Readable<PaginationResult>;
  private readonly stopListening: Array<() => void>;
  private hasStarted = false;

  constructor(configuration: FavoritesSearchSessionConfiguration, private readonly dependencies: FavoritesSearchSessionDependencies) {
    const { index, paginationSettings } = dependencies;

    this.currentSettings = new Signal(configuration.searchSettings);
    this.request = computed(() => buildSearchRequest(this.currentSettings.value, dependencies.blacklist));
    const pagination = computed(() => paginate(paginationSettings.value, this.currentResults.value, this.pageNumber.value));
    const pageFavorites = computed(() => pagination.value.favorites, { equals: haveSameItems });

    this.currentPagination = computed(() => ({ ...pagination.value, favorites: pageFavorites.value }));
    this.stopListening = [
      index.indexed.on(favorites => this.append(favorites)),
      index.rebuilt.on(() => this.refresh()),
      paginationSettings.changed.on(() => {
        this.pageNumber.value = 1;
      })
    ];
  }

  public get settings(): Readable<SearchSettings> {
    return this.currentSettings;
  }

  public get results(): Readable<readonly Favorite[]> {
    return this.currentResults;
  }

  public get paginationResult(): Readable<PaginationResult> {
    return this.currentPagination;
  }

  public createMediaSequence(): MediaSequence<Favorite> {
    return new ListSequence<Favorite>({ wraps: !this.dependencies.paginationSettings.value.infiniteScroll }, this.results);
  }

  public start(): void {
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.refresh();
    }
  }

  public submit(query: string): void {
    this.run({ query, isShuffled: false });
  }

  public invert(): void {
    this.run({ isInverted: !this.currentSettings.peek().isInverted });
  }

  public shuffle(): void {
    this.run({ isShuffled: true, shuffleSeed: this.drawSeed() });
  }

  public updateSettings(change: Partial<SearchSettings>): void {
    const sortWasChanged = change.sortKey !== undefined || change.isSortAscending !== undefined;
    const isShuffled = this.currentSettings.peek().isShuffled && !sortWasChanged;

    this.run({ ...change, isShuffled });
  }

  public goToPage(pageNumber: number): void {
    this.pageNumber.value = clamp(pageNumber, 1, this.currentPagination.peek().totalPages);
  }

  public dispose(): void {
    for (const stop of this.stopListening) {
      stop();
    }
  }

  public reveal<T extends { id: string }>(item: T): void {
    const index = this.currentResults.peek().findIndex(favorite => favorite.id === item.id);

    if (index >= 0) {
      this.goToPage(Math.floor(index / getPageSize(this.dependencies.paginationSettings.value)) + 1);
    }
  }

  private run(change: Partial<SearchSettings>): void {
    batch(() => {
      this.currentSettings.value = { ...this.currentSettings.peek(), ...change };
      this.refresh();
      this.pageNumber.value = 1;
    });
  }

  private refresh(): void {
    if (this.hasStarted) {
      this.currentResults.value = this.dependencies.index.search(this.request.peek());
    }
  }

  private append(favorites: readonly Favorite[]): void {
    if (!this.hasStarted) {
      return;
    }
    const matched = this.dependencies.index.match(this.request.peek(), favorites);

    if (matched.length > 0) {
      // eslint-disable-next-line unicorn/prefer-spread
      this.currentResults.value = this.currentResults.peek().concat(matched);
    }
  }

  private drawSeed(): number {
    return Math.floor(this.dependencies.randomSource.next() * SEED_RANGE);
  }
}
