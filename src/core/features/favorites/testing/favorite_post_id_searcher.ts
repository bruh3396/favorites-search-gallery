import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { buildFavoritesSearchRequest } from "@/core/features/favorites/testing/favorites_search_request_builder";

export function searchFavoritePostIds(favoritesSearchIndex: FavoritesSearchIndex, query = ""): string[] {
  return favoritesSearchIndex.search(buildFavoritesSearchRequest({ query })).map(favorite => favorite.id);
}
