import { Readable, Signal, batch } from "@/core/utils/reactive/signal";
import { SearchRequest, SearchSettings } from "@/core/features/favorites/types/search";
import { parseExclusions, tryParseSearchExpression } from "@/core/search/parsers/search_expression_parser";
import { FavoritesConfiguration } from "@/core/features/favorites/types/favorites";
import { Preference } from "@/core/utils/reactive/preference";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { SearchExpression } from "@/core/search/expressions/search_expression";

export interface FavoritesSearchFlowDependencies {
  searchSettings: Preference<SearchSettings>;
  randomSource: RandomSource;
  search: () => void;
  goToFirstPage: () => void;
}

const SEED_RANGE = 2 ** 32;

export class FavoritesSearchFlow {
  private readonly currentRequest: Signal<SearchRequest>;
  private readonly blacklist: SearchExpression | undefined;
  private readonly isBlacklistForced: boolean;
  private query = "";
  private isInverted = false;
  private isShuffled = false;
  private shuffleSeed: number;

  constructor(configuration: FavoritesConfiguration, private readonly dependencies: FavoritesSearchFlowDependencies) {
    this.blacklist = parseExclusions(configuration.blacklistedTags);
    this.isBlacklistForced = !configuration.userOwnsFavorites;
    this.shuffleSeed = this.drawSeed();
    this.currentRequest = new Signal(this.buildRequest());
  }

  public get request(): Readable<SearchRequest> {
    return this.currentRequest;
  }

  public search(query: string): void {
    this.query = query;
    this.isShuffled = false;
    this.run();
  }

  public invert(): void {
    this.isInverted = !this.isInverted;
    this.run();
  }

  public shuffle(): void {
    this.isShuffled = true;
    this.shuffleSeed = this.drawSeed();
    this.run();
  }

  public updateSettings(change: Partial<SearchSettings>): void {
    const { searchSettings } = this.dependencies;

    this.isShuffled = this.isShuffled && change.sortKey === undefined && change.isSortAscending === undefined;
    searchSettings.set({ ...searchSettings.peek(), ...change });
    this.run();
  }

  private run(): void {
    const { search, goToFirstPage } = this.dependencies;

    batch(() => {
      this.currentRequest.value = this.buildRequest();
      search();
      goToFirstPage();
    });
  }

  private buildRequest(): SearchRequest {
    const { sortKey, isSortAscending, allowedRatings, isBlacklistEnabled } = this.dependencies.searchSettings.peek();
    return {
      expression: this.buildExpression(isBlacklistEnabled),
      sortKey,
      isSortAscending,
      allowedRatings,
      isShuffled: this.isShuffled,
      shuffleSeed: this.shuffleSeed
    };
  }

  private buildExpression(isBlacklistEnabled: boolean): SearchExpression | undefined {
    const search = tryParseSearchExpression(this.query);

    if (search === undefined) {
      return undefined;
    }
    const matches = this.isInverted ? SearchExpression.not(search) : search;
    const isBlacklistApplied = this.isBlacklistForced || isBlacklistEnabled;
    return isBlacklistApplied && this.blacklist !== undefined ? SearchExpression.and([this.blacklist, matches]) : matches;
  }

  private drawSeed(): number {
    return Math.floor(this.dependencies.randomSource.next() * SEED_RANGE);
  }
}
