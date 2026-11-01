import { ALL_RATINGS_MASK } from "@/core/domain/post/rating_mask";
import { BitSearchEngine } from "@/core/domain/search/engines/bit/bit_search_engine";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Fact } from "@/core/utils/reactive/fact";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSearchRequest } from "@/core/features/favorites/search/favorites_search_request";
import { Milestone } from "@/core/utils/reactive/milestone";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { StringInterner } from "@/core/utils/string/string_interner";
import { TermUpdate } from "@/core/domain/search/engines/term_update";
import { shuffleDeterministically } from "@/core/utils/collection/array_utilities";

export class FavoritesSearchIndex {
  private readonly bitSearchEngine: BitSearchEngine<Favorite>;
  readonly #indexed = new Emitter<readonly Favorite[]>();
  readonly #rebuilt = new Emitter<void>();
  readonly #populated = new Milestone();

  constructor(stringInterner: StringInterner) {
    this.bitSearchEngine = new BitSearchEngine<Favorite>({
      getTerms: (favorite): Iterable<string> => favorite.tags,
      getMetric: (favorite, metric): number => favorite.getMetric(metric),
      stringInterner
    });
  }

  public get indexed(): Occurrence<readonly Favorite[]> {
    return this.#indexed;
  }

  public get rebuilt(): Occurrence<void> {
    return this.#rebuilt;
  }

  public get populated(): Fact {
    return this.#populated;
  }

  public add(favorites: readonly Favorite[]): void {
    this.bitSearchEngine.add(favorites);

    if (favorites.length > 0) {
      this.markPopulated();
    }
    this.#indexed.emit(favorites);
  }

  public update(termUpdates: readonly TermUpdate<Favorite>[]): void {
    this.bitSearchEngine.update(termUpdates);
  }

  public rebuild(favorites: readonly Favorite[]): void {
    this.bitSearchEngine.rebuild(favorites);

    if (favorites.length > 0) {
      this.markPopulated();
    }
    this.#rebuilt.emit();
  }

  public search(favoritesSearchRequest: FavoritesSearchRequest): readonly Favorite[] {
    return this.order(this.match(favoritesSearchRequest), favoritesSearchRequest);
  }

  public countFavoritesWithTag(tag: string): number {
    return this.bitSearchEngine.countDocsWithTerm(tag);
  }

  public match({ searchExpression, allowedRatings }: FavoritesSearchRequest, candidateFavorites?: readonly Favorite[]): readonly Favorite[] {
    return searchExpression === undefined ? [] : this.filterByRating(this.bitSearchEngine.search(searchExpression, candidateFavorites), allowedRatings);
  }

  private markPopulated(): void {
    if (!this.#populated.peek()) {
      this.#populated.reach();
    }
  }

  private filterByRating(favorites: readonly Favorite[], allowedRatings: number): readonly Favorite[] {
    return allowedRatings === ALL_RATINGS_MASK ? favorites : favorites.filter(favorite => isRatingAllowed(favorite, allowedRatings));
  }

  private shuffle(favorites: readonly Favorite[], seed: number): readonly Favorite[] {
    return shuffleDeterministically(favorites, seed, favorite => favorite.numericId);
  }

  private order(favorites: readonly Favorite[], favoritesSearchRequest: FavoritesSearchRequest): readonly Favorite[] {
    return favoritesSearchRequest.isShuffled ? this.shuffle(favorites, favoritesSearchRequest.shuffleSeed) : this.sort(favorites, favoritesSearchRequest);
  }

  private sort(favorites: readonly Favorite[], { sortKey, isSortAscending, shuffleSeed }: FavoritesSearchRequest): readonly Favorite[] {
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
