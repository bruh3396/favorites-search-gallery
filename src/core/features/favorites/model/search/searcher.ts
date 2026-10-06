import { RATINGS, Rating } from "@/core/domain/post/post";
import { BitSearchEngine } from "@/core/search/engines/bit/bit_search_engine";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { SearchCriteria } from "@/core/features/favorites/types/search";
import { TermUpdate } from "@/core/search/engines/search_engine";
import { hashInt } from "@/core/utils/number/bit";
import { isEmptyString } from "@/core/utils/string/string";

export interface FavoritesSearcherDependencies {
  getRating: (favorite: Favorite) => Rating;
}

export class FavoritesSearcher {
  private readonly engine = new BitSearchEngine<Favorite>(favorite => favorite.tags, (favorite, metric) => favorite.getMetric(metric));
  private readonly getRating: (favorite: Favorite) => Rating;

  constructor({ getRating }: FavoritesSearcherDependencies) {
    this.getRating = getRating;
  }

  public indexAll(favorites: Favorite[]): void {
    this.engine.index(favorites);
  }

  public addToIndex(favorites: Favorite[]): void {
    this.engine.add(favorites);
  }

  public updateIndex(updates: readonly TermUpdate<Favorite>[]): void {
    this.engine.update(updates);
  }

  public search(favorites: Favorite[], criteria: SearchCriteria): Favorite[] {
    return this.sort(this.match(favorites, criteria), criteria);
  }

  public match(favorites: Favorite[], criteria: SearchCriteria): Favorite[] {
    const query = `${criteria.blacklistQuery} ${criteria.query}`;
    const matches = isEmptyString(query) ? favorites : this.engine.search(query, favorites);
    return this.filterByRating(matches, criteria.allowedRatings);
  }

  public invert(matches: Favorite[], criteria: SearchCriteria): Favorite[] {
    const blacklistQuery = isEmptyString(criteria.blacklistQuery) ? undefined : criteria.blacklistQuery;
    const complement = this.engine.complementOf(matches, blacklistQuery);
    return this.sort(this.filterByRating(complement, criteria.allowedRatings), criteria);
  }

  public shuffle(favorites: Favorite[], seed: number): Favorite[] {
    return favorites
      .map(favorite => ({ favorite, rank: hashInt(Number(favorite.id), seed) }))
      .sort((a, b) => a.rank - b.rank)
      .map(({ favorite }) => favorite);
  }

  private filterByRating(favorites: Favorite[], allowedRatings: ReadonlySet<Rating>): Favorite[] {
    return allowedRatings.size === RATINGS.length ? favorites : favorites.filter(favorite => allowedRatings.has(this.getRating(favorite)));
  }

  private sort(favorites: Favorite[], { sort: { key, isAscending }, shuffleSeed }: SearchCriteria): Favorite[] {
    if (key === "random") {
      return this.shuffle(favorites, shuffleSeed);
    }

    if (key === "favorited") {
      return isAscending ? favorites.toReversed() : [...favorites];
    }
    const direction = isAscending ? 1 : -1;
    return favorites.toSorted((a, b) => direction * (a.getMetric(key) - b.getMetric(key)));
  }
}
