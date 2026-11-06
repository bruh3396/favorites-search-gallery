import { DEFAULT_FAVORITES_SEARCH_SETTINGS, FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { Readable, Signal, batch, computed } from "@/core/utils/reactive/signal";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSearchRequest } from "@/core/features/favorites/search/favorites_search_request";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { compileFavoritesSearchRequest } from "@/core/features/favorites/search/favorites_search_request_compiler";

export interface FavoritesSearchConfiguration {
  readonly favoritesSearchSettings: FavoritesSearchSettings;
}

export interface FavoritesSearchDependencies {
  favoritesSearchIndex: FavoritesSearchIndex;
  favoritesBlacklist: FavoritesBlacklist;
  randomSource: RandomSource;
}

const SEED_RANGE = 2 ** 32;

export class FavoritesSearch {
  private readonly request: Readable<FavoritesSearchRequest>;
  private readonly stopListening: Array<() => void>;
  private hasStarted: boolean;
  readonly #settings: Signal<FavoritesSearchSettings>;
  readonly #matchedFavorites: Signal<readonly Favorite[]>;
  readonly #searched: Emitter<void>;

  constructor(configuration: FavoritesSearchConfiguration, private readonly dependencies: FavoritesSearchDependencies) {
    this.hasStarted = false;
    this.#settings = new Signal(configuration.favoritesSearchSettings);
    this.#matchedFavorites = new Signal<readonly Favorite[]>([]);
    this.#searched = new Emitter<void>();
    this.request = computed(() => compileFavoritesSearchRequest(this.#settings.value, dependencies.favoritesBlacklist));
    this.stopListening = [
      dependencies.favoritesSearchIndex.indexed.on(favorites => this.appendMatches(favorites)),
      dependencies.favoritesSearchIndex.rebuilt.on(() => this.searchAll())
    ];
  }

  public get settings(): Readable<FavoritesSearchSettings> {
    return this.#settings;
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
    this.applySettings({ query, isShuffled: false });
  }

  public invert(): void {
    this.applySettings({ isInverted: !this.#settings.peek().isInverted });
  }

  public shuffle(): void {
    this.applySettings({ isShuffled: true, shuffleSeed: this.drawSeed() });
  }

  public clearFilters(): void {
    this.applySettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: this.#settings.peek().query });
  }

  public clearSearch(): void {
    this.applySettings(DEFAULT_FAVORITES_SEARCH_SETTINGS);
  }

  public updateSettings(partialFavoritesSearchSettings: Partial<FavoritesSearchSettings>): void {
    const sortWasChanged = partialFavoritesSearchSettings.sortKey !== undefined || partialFavoritesSearchSettings.isSortAscending !== undefined;
    const isShuffled = this.#settings.peek().isShuffled && !sortWasChanged;
    const shuffleSeed = partialFavoritesSearchSettings.sortKey === "random" ? this.drawSeed() : this.#settings.peek().shuffleSeed;

    this.applySettings({ ...partialFavoritesSearchSettings, isShuffled, shuffleSeed });
  }

  public dispose(): void {
    for (const stop of this.stopListening) {
      stop();
    }
  }

  private applySettings(partialFavoritesSearchSettings: Partial<FavoritesSearchSettings>): void {
    batch(() => {
      this.#settings.value = { ...this.#settings.peek(), ...partialFavoritesSearchSettings };
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

  private drawSeed(): number {
    return Math.floor(this.dependencies.randomSource.next() * SEED_RANGE);
  }
}
