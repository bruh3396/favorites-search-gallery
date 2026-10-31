import { FavoritesSortKey } from "@/core/features/favorites/search/favorites_sort_key";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";

export interface FavoritesSearchRequest {
  readonly searchExpression: SearchExpression | undefined;
  readonly sortKey: FavoritesSortKey;
  readonly isSortAscending: boolean;
  readonly allowedRatings: number;
  readonly isShuffled: boolean;
  readonly shuffleSeed: number;
}
