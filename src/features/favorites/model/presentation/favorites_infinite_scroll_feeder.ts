import { FavoriteItem } from "../../types/favorite/favorite_item";
import { FavoritesSettings } from "../../../../config/favorites_settings";

export function getMoreResults(allFavorites: FavoriteItem[]): HTMLElement[] {
  const batch = [];

  for (const favorite of allFavorites) {
    if (document.getElementById(favorite.id) === null) {
      batch.push(favorite.root);
    }

    if (batch.length >= FavoritesSettings.infiniteScrollBatchCount) {
      break;
    }
  }
  return batch;
}

export function getFirstResults(allFavorites: FavoriteItem[]): FavoriteItem[] {
  return allFavorites.slice(0, FavoritesSettings.infiniteScrollBatchCount);
}
