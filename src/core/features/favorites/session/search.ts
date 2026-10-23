import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { Readable, Signal, batch, computed } from "@/core/utils/reactive/signal";
import { SearchRequest, SearchSettings, UNFILTERED_SEARCH_SETTINGS } from "@/core/features/favorites/search/input";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { buildSearchRequest } from "@/core/features/favorites/search/request";

export interface FavoritesSearchConfiguration {
  readonly settings: SearchSettings;
}

export interface FavoritesSearchDependencies {
  searchIndex: FavoritesSearchIndex;
  blacklist: FavoritesBlacklist;
  randomSource: RandomSource;
}

const SEED_RANGE = 2 ** 32;

export class FavoritesSearch {
  private readonly currentSettings: Signal<SearchSettings>;
  private readonly currentResults: Signal<readonly Favorite[]>;
  private readonly request: Readable<SearchRequest>;
  private readonly searchedEmitter: Emitter<void>;
  private readonly stopListening: Array<() => void>;
  private hasStarted: boolean;

  constructor(configuration: FavoritesSearchConfiguration, private readonly dependencies: FavoritesSearchDependencies) {
    this.hasStarted = false;
    this.currentSettings = new Signal(configuration.settings);
    this.currentResults = new Signal<readonly Favorite[]>([]);
    this.searchedEmitter = new Emitter<void>();
    this.request = computed(() => buildSearchRequest(this.currentSettings.value, dependencies.blacklist));
    this.stopListening = [
      dependencies.searchIndex.indexed.on(favorites => this.appendMatches(favorites)),
      dependencies.searchIndex.rebuilt.on(() => this.searchAll())
    ];
  }

  public get settings(): Readable<SearchSettings> {
    return this.currentSettings;
  }

  public get results(): Readable<readonly Favorite[]> {
    return this.currentResults;
  }

  public get searched(): Occurrence<void> {
    return this.searchedEmitter;
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
    this.applySettings({ isInverted: !this.currentSettings.peek().isInverted });
  }

  public shuffle(): void {
    this.applySettings({ isShuffled: true, shuffleSeed: this.drawSeed() });
  }

  public clearFilters(): void {
    this.applySettings(UNFILTERED_SEARCH_SETTINGS);
  }

  public updateSettings(change: Partial<SearchSettings>): void {
    const sortWasChanged = change.sortKey !== undefined || change.isSortAscending !== undefined;
    const isShuffled = this.currentSettings.peek().isShuffled && !sortWasChanged;

    this.applySettings({ ...change, isShuffled });
  }

  public dispose(): void {
    for (const stop of this.stopListening) {
      stop();
    }
  }

  private applySettings(change: Partial<SearchSettings>): void {
    batch(() => {
      this.currentSettings.value = { ...this.currentSettings.peek(), ...change };
      this.searchAll();
      this.searchedEmitter.emit();
    });
  }

  private searchAll(): void {
    if (this.hasStarted) {
      this.currentResults.value = this.dependencies.searchIndex.search(this.request.peek());
    }
  }

  private appendMatches(favorites: readonly Favorite[]): void {
    if (!this.hasStarted) {
      return;
    }
    const matched = this.dependencies.searchIndex.match(this.request.peek(), favorites);

    if (matched.length > 0) {
      // eslint-disable-next-line unicorn/prefer-spread
      this.currentResults.value = this.currentResults.peek().concat(matched);
    }
  }

  private drawSeed(): number {
    return Math.floor(this.dependencies.randomSource.next() * SEED_RANGE);
  }
}
