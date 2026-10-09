import { PaginationResult, PaginationSettings, paginate } from "@/core/features/favorites/search/pagination";
import { Readable, Signal, batch, computed } from "@/core/utils/reactive/signal";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { Preference } from "@/core/utils/reactive/preference";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { SearchExpression } from "@/core/search/expressions/search_expression";
import { SearchRequest } from "./inputs";
import { SearchSettings } from "@/core/features/favorites/search/inputs";
import { clamp } from "@/core/utils/number/number";
import { haveSameItems } from "@/core/utils/collection/array";
import { tryParseSearchExpression } from "@/core/search/parsers/search_expression_parser";

export interface FavoritesSearchSessionDependencies {
  index: FavoritesSearchIndex;
  blacklist: FavoritesBlacklist;
  searchSettings: Preference<SearchSettings>;
  paginationSettings: Pick<Preference<PaginationSettings>, "value" | "changed">;
  randomSource: RandomSource;
}

export type FavoritesSearchSessionSettings = Pick<FavoritesSearchSessionDependencies, "searchSettings" | "paginationSettings">;

const SEED_RANGE = 2 ** 32;

export class FavoritesSearchSession {
  private readonly request: Readable<SearchRequest>;
  private readonly currentResults: Signal<Favorite[]>;
  private readonly pageNumber = new Signal(1);
  private readonly currentPagination: Readable<PaginationResult>;
  private readonly stopListening: Array<() => void>;

  constructor(private readonly dependencies: FavoritesSearchSessionDependencies) {
    const { index, searchSettings, paginationSettings } = dependencies;

    this.request = computed(() => this.buildRequest(searchSettings.value));
    this.currentResults = new Signal(index.search(this.request.peek()));
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
    return this.dependencies.searchSettings;
  }

  public get results(): Readable<readonly Favorite[]> {
    return this.currentResults;
  }

  public get paginationResult(): Readable<PaginationResult> {
    return this.currentPagination;
  }

  public submit(query: string): void {
    this.run({ query, isShuffled: false });
  }

  public invert(): void {
    this.run({ isInverted: !this.dependencies.searchSettings.peek().isInverted });
  }

  public shuffle(): void {
    this.run({ isShuffled: true, shuffleSeed: this.drawSeed() });
  }

  public updateSettings(change: Partial<SearchSettings>): void {
    const sortWasChanged = change.sortKey !== undefined || change.isSortAscending !== undefined;
    const isShuffled = this.dependencies.searchSettings.peek().isShuffled && !sortWasChanged;

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

  private run(change: Partial<SearchSettings>): void {
    const { searchSettings } = this.dependencies;

    batch(() => {
      searchSettings.set({ ...searchSettings.peek(), ...change });
      this.refresh();
      this.pageNumber.value = 1;
    });
  }

  private refresh(): void {
    this.currentResults.value = this.dependencies.index.search(this.request.peek());
  }

  private append(favorites: Favorite[]): void {
    const matched = this.dependencies.index.match(this.request.peek(), favorites);

    if (matched.length > 0) {
      // eslint-disable-next-line unicorn/prefer-spread
      this.currentResults.value = this.currentResults.peek().concat(matched);
    }
  }

  private buildRequest(settings: SearchSettings): SearchRequest {
    const { sortKey, isSortAscending, allowedRatings, isShuffled, shuffleSeed } = settings;
    return { expression: this.buildExpression(settings), sortKey, isSortAscending, allowedRatings, isShuffled, shuffleSeed };
  }

  private buildExpression(settings: SearchSettings): SearchExpression | undefined {
    const search = tryParseSearchExpression(settings.query);

    if (search === undefined) {
      return undefined;
    }
    const matches = settings.isInverted ? SearchExpression.not(search) : search;
    return this.dependencies.blacklist.apply(matches, settings);
  }

  private drawSeed(): number {
    return Math.floor(this.dependencies.randomSource.next() * SEED_RANGE);
  }
}
