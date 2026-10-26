import { Emitter } from "@/core/utils/reactive/emitter";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { Fact } from "@/core/utils/reactive/fact";
import { Milestone } from "@/core/utils/reactive/milestone";
import { ALL_RATINGS_MASK } from "@/core/domain/post/rating_mask";
import { BitSearchEngine } from "@/core/domain/search/engines/bit/bit_search_engine";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSearchRequest } from "@/core/features/favorites/search/input";
import { TermUpdate } from "@/core/domain/search/engines/term_update";
import { StringInterner } from "@/core/utils/string/string_interner";
import { shuffleDeterministically } from "@/core/utils/collection/array_utilities";

export class FavoritesSearchIndex {
  private readonly engine: BitSearchEngine<Favorite>;
  private readonly indexes = new Emitter<readonly Favorite[]>();
  private readonly rebuilds = new Emitter<void>();
  private readonly populatedMilestone = new Milestone();

  constructor(stringInterner: StringInterner) {
    this.engine = new BitSearchEngine<Favorite>({
      getTerms: favorite => favorite.tags,
      getMetric: (favorite, metric) => favorite.getMetric(metric),
      stringInterner
    });
  }

  public get indexed(): Occurrence<readonly Favorite[]> {
    return this.indexes;
  }

  public get rebuilt(): Occurrence<void> {
    return this.rebuilds;
  }

  public get populated(): Fact {
    return this.populatedMilestone;
  }

  public add(favorites: readonly Favorite[]): void {
    this.engine.add(favorites);

    if (favorites.length > 0) {
      this.markPopulated();
    }
    this.indexes.emit(favorites);
  }

  public update(updates: readonly TermUpdate<Favorite>[]): void {
    this.engine.update(updates);
  }

  public rebuild(favorites: readonly Favorite[]): void {
    this.engine.rebuild(favorites);

    if (favorites.length > 0) {
      this.markPopulated();
    }
    this.rebuilds.emit();
  }

  public search(request: FavoritesSearchRequest): readonly Favorite[] {
    return this.order(this.match(request), request);
  }

  public countFavoritesWithTag(tag: string): number {
    return this.engine.countDocsWithTerm(tag);
  }

  public match({ expression, allowedRatings }: FavoritesSearchRequest, candidates?: readonly Favorite[]): readonly Favorite[] {
    return expression === undefined ? [] : this.filterByRating(this.engine.search(expression, candidates), allowedRatings);
  }

  private markPopulated(): void {
    if (!this.populatedMilestone.peek()) {
      this.populatedMilestone.reach();
    }
  }

  private filterByRating(favorites: readonly Favorite[], allowedRatings: number): readonly Favorite[] {
    return allowedRatings === ALL_RATINGS_MASK ? favorites : favorites.filter(favorite => isRatingAllowed(favorite, allowedRatings));
  }

  private shuffle(favorites: readonly Favorite[], seed: number): readonly Favorite[] {
    return shuffleDeterministically(favorites, seed, favorite => favorite.numericId);
  }

  private order(favorites: readonly Favorite[], request: FavoritesSearchRequest): readonly Favorite[] {
    return request.isShuffled ? this.shuffle(favorites, request.shuffleSeed) : this.sort(favorites, request);
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
