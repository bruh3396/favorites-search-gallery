import { FavoriteItem } from "../../types/favorite/favorite_item";
import { FavoritesSettings } from "../../../../config/favorites_settings";

export function getMoreResults(favorites: FavoriteItem[]): HTMLElement[] {
  const result = [];

  for (const favorite of favorites) {
    if (document.getElementById(favorite.id) === null) {
      result.push(favorite.root);
    }

    if (result.length >= FavoritesSettings.infiniteScrollBatchSize) {
      break;
    }
  }
  return result;
}

export function hasMoreResults(favorites: FavoriteItem[]): boolean {
  return getMoreResults(favorites).length > 0;
}

export function getFirstResults(favorites: FavoriteItem[]): FavoriteItem[] {
  return favorites.slice(0, FavoritesSettings.infiniteScrollBatchSize);
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
