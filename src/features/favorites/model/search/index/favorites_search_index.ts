import { DO_NOTHING } from "../../../../../config/constants";
import { FavoriteItem } from "../../../types/favorite/favorite_item";
import { FavoritesSettings } from "../../../../../config/favorites_settings";
import { InvertedSearchIndex } from "./inverted_search_index";

class FavoritesSearchIndex extends InvertedSearchIndex<FavoriteItem> {
  constructor() {
    super();

    if (!FavoritesSettings.useSearchIndex) {
      this.add = DO_NOTHING;
    }
  }
}

export const FAVORITES_SEARCH_INDEX: FavoritesSearchIndex = new FavoritesSearchIndex();
