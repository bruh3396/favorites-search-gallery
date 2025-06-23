import { FavoriteItem } from "../../types/favorite/favorite_item";
import { FavoritesSettings } from "../../../../config/favorites_settings";

export function getMoreResults(favorites: FavoriteItem[]): HTMLElement[] {
  const result = [];

  for (const favorite of favorites) {
    if (document.getElementById(favorite.id) === null) {
      result.push(favorite.root);
    }

    if (result.length >= FavoritesSettings.infiniteScrollBatchCount) {
      break;
    }
  }
  return result;
}

export function getFirstResults(favorites: FavoriteItem[]): FavoriteItem[] {
  return favorites.slice(0, FavoritesSettings.infiniteScrollBatchCount);
}

export function getThumbURLsToPreload(favorites: FavoriteItem[]): string[] {
  const result = [];

  for (const favorite of favorites) {
    if (document.getElementById(favorite.id) === null) {
      result.push(favorite.thumbURL);
    }

    if (result.length >= FavoritesSettings.infiniteScrollPreloadCount) {
      break;
    }
  }
  return result;
}
