import { ALL_RATINGS_MASK } from "@/core/domain/post/post";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { SearchEngine } from "@/core/search/engines/search_engine";
import { SearchRequest } from "@/core/features/favorites/types/search";
import { hashInt } from "@/core/utils/number/bit";

export interface FavoritesSearcherDependencies {
  engine: Pick<SearchEngine<Favorite>, "search">;
  getRatingBit: (favorite: Favorite) => number;
}

export class FavoritesSearcher {
  constructor(private readonly dependencies: FavoritesSearcherDependencies) { }

  public search(request: SearchRequest): Favorite[] {
    const matched = this.match(request);
    return request.isShuffled ? this.shuffle(matched, request.shuffleSeed) : this.sort(matched, request);
  }

  public match({ expression, allowedRatings }: SearchRequest, candidates?: Favorite[]): Favorite[] {
    return expression === undefined ? [] : this.filterByRating(this.dependencies.engine.search(expression, candidates), allowedRatings);
  }

  private filterByRating(favorites: Favorite[], allowedRatings: number): Favorite[] {
    return allowedRatings === ALL_RATINGS_MASK ? favorites : favorites.filter(favorite => (this.dependencies.getRatingBit(favorite) & allowedRatings) !== 0);
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
