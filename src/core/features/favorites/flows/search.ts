import { FavoritesConfiguration, FavoritesDependencies, FavoritesIntents } from "@/core/features/favorites/types/favorites";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import { SearchCriteria, Sort } from "@/core/features/favorites/types/search";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { Rating } from "@/core/domain/post/post";
import { randomInt } from "@/core/utils/number/number";

const SEED_RANGE = 2 ** 32;

function negateTags(tags: string): string {
  return tags.replace(/(\S+)/g, "-$1");
}

type SearchIntents = Pick<FavoritesIntents, "search" | "shuffle" | "invert" | "sortBy" | "allowRatings" | "setBlacklistEnabled">;

export interface FavoritesSearchFlowDependencies extends Pick<FavoritesDependencies, "preferences" | "randomSource"> {
  model: FavoritesModel;
}

export class FavoritesSearchFlow implements SearchIntents {
  private readonly currentQuery = new Signal("");
  private readonly configuration: FavoritesConfiguration;
  private readonly dependencies: FavoritesSearchFlowDependencies;
  private readonly blacklistQuery: string;
  private shuffleSeed: number;

  constructor(configuration: FavoritesConfiguration, dependencies: FavoritesSearchFlowDependencies) {
    this.configuration = configuration;
    this.blacklistQuery = negateTags(configuration.blacklistedTags);
    this.dependencies = dependencies;
    this.shuffleSeed = this.drawSeed();
  }

  public get query(): Readable<string> {
    return this.currentQuery;
  }

  public getSearchCriteria(): SearchCriteria {
    const { sort, allowedRatings } = this.dependencies.preferences;
    return {
      query: this.currentQuery.peek(),
      sort: sort.peek(),
      allowedRatings: allowedRatings.peek(),
      blacklistQuery: this.getBlacklistQuery(),
      shuffleSeed: this.shuffleSeed
    };
  }

  public search(query: string): void {
    this.currentQuery.value = query;
    this.searchAgain();
  }

  public shuffle(): void {
    this.shuffleSeed = this.drawSeed();
    this.dependencies.model.shuffle(this.shuffleSeed);
  }

  public invert(): void {
    this.dependencies.model.invert(this.getSearchCriteria());
  }

  public sortBy(sort: Sort): void {
    this.dependencies.preferences.sort.set(sort);
    this.searchAgain();
  }

  public allowRatings(ratings: ReadonlySet<Rating>): void {
    this.dependencies.preferences.allowedRatings.set(ratings);
    this.searchAgain();
  }

  public setBlacklistEnabled(enabled: boolean): void {
    this.dependencies.preferences.isBlacklistEnabled.set(enabled);
    this.searchAgain();
  }

  private searchAgain(): void {
    this.dependencies.model.search(this.getSearchCriteria());
  }

  private getBlacklistQuery(): string {
    const isBlacklistApplied = !this.configuration.userOwnsFavorites || this.dependencies.preferences.isBlacklistEnabled.peek();
    return isBlacklistApplied ? this.blacklistQuery : "";
  }

  private drawSeed(): number {
    return randomInt(this.dependencies.randomSource, SEED_RANGE);
  }
}
