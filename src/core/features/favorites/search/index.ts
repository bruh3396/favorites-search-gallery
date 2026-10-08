import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { SearchEngine, TermUpdate } from "@/core/search/engines/search_engine";
import { ALL_RATINGS_MASK } from "@/core/domain/post/post";
import { Favorite } from "@/core/features/favorites/favorite";
import { SearchExpression } from "@/core/search/expressions/search_expression";
import { SortKey } from "@/core/features/favorites/search/settings";
import { hashInt } from "@/core/utils/number/bit";

export interface SearchRequest {
  expression: SearchExpression | undefined;
  sortKey: SortKey;
  isSortAscending: boolean;
  allowedRatings: number;
  isShuffled: boolean;
  shuffleSeed: number;
}

export class FavoritesSearchIndex {
  private readonly indexedFavorites = new Emitter<Favorite[]>();
  private readonly rebuilds = new Emitter<void>();

  constructor(private readonly engine: SearchEngine<Favorite>) { }

  public get indexed(): Occurrence<Favorite[]> {
    return this.indexedFavorites;
  }

  public get rebuilt(): Occurrence<void> {
    return this.rebuilds;
  }

  public add(favorites: Favorite[]): void {
    this.engine.add(favorites);
    this.indexedFavorites.emit(favorites);
  }

  public update(updates: readonly TermUpdate<Favorite>[]): void {
    this.engine.update(updates);
  }

  public rebuild(favorites: Favorite[]): void {
    this.engine.rebuild(favorites);
    this.rebuilds.emit();
  }

  public search(request: SearchRequest): Favorite[] {
    const matched = this.match(request);
    return request.isShuffled ? this.shuffle(matched, request.shuffleSeed) : this.sort(matched, request);
  }

  public match({ expression, allowedRatings }: SearchRequest, candidates?: Favorite[]): Favorite[] {
    return expression === undefined ? [] : this.filterByRating(this.engine.search(expression, candidates), allowedRatings);
  }

  private filterByRating(favorites: Favorite[], allowedRatings: number): Favorite[] {
    return allowedRatings === ALL_RATINGS_MASK ? favorites : favorites.filter(favorite => (favorite.ratingBit & allowedRatings) !== 0);
  }

  private shuffle(favorites: Favorite[], seed: number): Favorite[] {
    return favorites
      .map(favorite => ({ favorite, rank: hashInt(Number(favorite.id), seed) }))
      .sort((a, b) => a.rank - b.rank)
      .map(({ favorite }) => favorite);
  }

  private sort(favorites: Favorite[], { sortKey, isSortAscending, shuffleSeed }: SearchRequest): Favorite[] {
    if (sortKey === "random") {
      return this.shuffle(favorites, shuffleSeed);
    }

    if (sortKey === "favorited") {
      return isSortAscending ? favorites.toReversed() : favorites;
    }
    const direction = isSortAscending ? 1 : -1;
    return favorites.toSorted((a, b) => direction * (a.getMetric(sortKey) - b.getMetric(sortKey)));
  }
}
