import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { StringInterner } from "@/core/utils/string/string_interner";

export function buildFavoritesSearchIndex(): FavoritesSearchIndex {
  return new FavoritesSearchIndex(new StringInterner());
}
