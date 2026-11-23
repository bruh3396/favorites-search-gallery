import { DEFAULT_FAVORITES_SEARCH_OPTIONS, FavoritesSearchOptions } from "@/core/features/favorites/search/favorites_search_options";
import { Readable, Signal, batch, computed } from "@/core/utils/reactive/signal";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSearchRequest } from "@/core/features/favorites/search/favorites_search_request";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { compileFavoritesSearchRequest } from "@/core/features/favorites/search/favorites_search_request_compiler";
import { randomUint32 } from "@/core/utils/random/random_utilities";

export interface FavoritesSearchConfiguration {
  readonly favoritesSearchOptions: FavoritesSearchOptions;
}

export interface FavoritesSearchDependencies {
  favoritesSearchIndex: FavoritesSearchIndex;
  favoritesBlacklist: FavoritesBlacklist;
  randomSource: RandomSource;
}

export class FavoritesSearch {
  private readonly request: Readable<FavoritesSearchRequest>;
  private readonly stopListening: Array<() => void>;
  private hasStarted: boolean;
  readonly #options: Signal<FavoritesSearchOptions>;
  readonly #matchedFavorites: Signal<readonly Favorite[]>;
  readonly #searched: Emitter<void>;

  constructor(configuration: FavoritesSearchConfiguration, private readonly dependencies: FavoritesSearchDependencies) {
    this.hasStarted = false;
    this.#options = new Signal(configuration.favoritesSearchOptions);
    this.#matchedFavorites = new Signal<readonly Favorite[]>([]);
    this.#searched = new Emitter<void>();
    this.request = computed(() => compileFavoritesSearchRequest(this.#options.value, dependencies.favoritesBlacklist));
    this.stopListening = [
      dependencies.favoritesSearchIndex.indexed.on(favorites => this.appendMatches(favorites)),
      dependencies.favoritesSearchIndex.rebuilt.on(() => this.searchAll())
    ];
  }

  public get options(): Readable<FavoritesSearchOptions> {
    return this.#options;
  }

  public get matchedFavorites(): Readable<readonly Favorite[]> {
    return this.#matchedFavorites;
  }

  public get searched(): Occurrence<void> {
    return this.#searched;
  }

  public start(): void {
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.searchAll();
    }
  }

  public submit(query: string): void {
    this.applyOptions({ query, isShuffled: false });
  }

  public invert(): void {
    this.applyOptions({ isInverted: !this.#options.peek().isInverted });
  }

  public toggleBlacklist(): void {
    this.applyOptions({ isBlacklistEnabled: !this.#options.peek().isBlacklistEnabled });
  }

  public shuffle(): void {
    this.applyOptions({ isShuffled: this.#options.peek().sortKey !== "random", shuffleSeed: randomUint32(this.dependencies.randomSource) });
  }

  public resetOptions(): void {
    const { query, shuffleSeed } = this.#options.peek();

    this.applyOptions({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, query, shuffleSeed });
  }

  public clearSearch(): void {
    this.applyOptions({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, shuffleSeed: this.#options.peek().shuffleSeed });
  }

  public updateOptions(partialFavoritesSearchOptions: Partial<FavoritesSearchOptions>): void {
    const sortWasChanged = partialFavoritesSearchOptions.sortKey !== undefined || partialFavoritesSearchOptions.isSortAscending !== undefined;
    const isShuffled = this.#options.peek().isShuffled && !sortWasChanged;

    this.applyOptions({ ...partialFavoritesSearchOptions, isShuffled });
  }

  public dispose(): void {
    for (const stop of this.stopListening) {
      stop();
    }
  }

  private applyOptions(partialFavoritesSearchOptions: Partial<FavoritesSearchOptions>): void {
    batch(() => {
      this.#options.value = { ...this.#options.peek(), ...partialFavoritesSearchOptions };
      this.searchAll();
      this.#searched.emit();
    });
  }

  private searchAll(): void {
    if (this.hasStarted) {
      this.#matchedFavorites.value = this.dependencies.favoritesSearchIndex.search(this.request.peek());
    }
  }

  private appendMatches(favorites: readonly Favorite[]): void {
    if (!this.hasStarted) {
      return;
    }
    const matchedFavorites = this.dependencies.favoritesSearchIndex.match(this.request.peek(), favorites);

    if (matchedFavorites.length > 0) {
      // eslint-disable-next-line unicorn/prefer-spread
      this.#matchedFavorites.value = this.#matchedFavorites.peek().concat(matchedFavorites);
    }
  }
}
