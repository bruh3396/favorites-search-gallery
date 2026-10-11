import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { ALL_RATINGS_MASK } from "@/core/domain/post/post";
import { BitSearchEngine } from "@/core/search/engines/bit/bit_search_engine";
import { Favorite } from "@/core/features/favorites/favorite";
import { SearchRequest } from "@/core/features/favorites/search/inputs";
import { TermUpdate } from "@/core/search/engines/search_engine";
import { shuffleDeterministically } from "@/core/utils/collection/array";

export class FavoritesSearchIndex {
  private readonly engine = new BitSearchEngine<Favorite>(favorite => favorite.tags, (favorite, metric) => favorite.getMetric(metric));
  private readonly indexes = new Emitter<readonly Favorite[]>();
  private readonly rebuilds = new Emitter<void>();

  public get indexed(): Occurrence<readonly Favorite[]> {
    return this.indexes;
  }

  public get rebuilt(): Occurrence<void> {
    return this.rebuilds;
  }

  public add(favorites: readonly Favorite[]): void {
    this.engine.add(favorites);
    this.indexes.emit(favorites);
  }

  public update(updates: readonly TermUpdate<Favorite>[]): void {
    this.engine.update(updates);
  }

  public rebuild(favorites: readonly Favorite[]): void {
    this.engine.rebuild(favorites);
    this.rebuilds.emit();
  }

  public search(request: SearchRequest): readonly Favorite[] {
    return this.order(this.match(request), request);
  }

  public match({ expression, allowedRatings }: SearchRequest, candidates?: readonly Favorite[]): readonly Favorite[] {
    return expression === undefined ? [] : this.filterByRating(this.engine.search(expression, candidates), allowedRatings);
  }

  private filterByRating(favorites: readonly Favorite[], allowedRatings: number): readonly Favorite[] {
    return allowedRatings === ALL_RATINGS_MASK ? favorites : favorites.filter(favorite => isRatingAllowed(favorite, allowedRatings));
  }

  private shuffle(favorites: readonly Favorite[], seed: number): readonly Favorite[] {
    return shuffleDeterministically(favorites, seed, favorite => favorite.numericId);
  }

  private order(favorites: readonly Favorite[], request: SearchRequest): readonly Favorite[] {
    return request.isShuffled ? this.shuffle(favorites, request.shuffleSeed) : this.sort(favorites, request);
  }

  private sort(favorites: readonly Favorite[], { sortKey, isSortAscending, shuffleSeed }: SearchRequest): readonly Favorite[] {
    switch (sortKey) {
      case "random": {
        return this.shuffle(favorites, shuffleSeed);
      }
      case "favorited": {
        return isSortAscending ? favorites.toReversed() : favorites;
      }
      default: {
        if (isSortAscending) {
          return favorites.toSorted((a, b) => a.getMetric(sortKey) - b.getMetric(sortKey));
        }
        return favorites.toSorted((a, b) => b.getMetric(sortKey) - a.getMetric(sortKey));
      }
    }
  }
}

function isRatingAllowed(favorite: Favorite, mask: number): boolean {
  return (favorite.ratingBit & mask) !== 0;
}
