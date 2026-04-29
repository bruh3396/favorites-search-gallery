import { FavoriteItem } from "../../types/favorite_item";
import { FavoritesSettings } from "../../../../config/favorites_settings";

function collectUnrendered<T>(favorites: FavoriteItem[], limit: number, selector: (f: FavoriteItem) => T): T[] {
  const result: T[] = [];

  for (const favorite of favorites) {
    if (document.getElementById(favorite.id) === null) {
      result.push(selector(favorite));
    }

    if (result.length >= limit) {
      break;
    }
  }
  return result;
}

export function getMoreResults(favorites: FavoriteItem[]): HTMLElement[] {
  return collectUnrendered(favorites, FavoritesSettings.infiniteScrollBatchSize, f => f.root);
}

export function hasMoreResults(favorites: FavoriteItem[]): boolean {
  return getMoreResults(favorites).length > 0;
}

export function getFirstResults(favorites: FavoriteItem[]): FavoriteItem[] {
  return favorites.slice(0, FavoritesSettings.infiniteScrollBatchSize);
}

export function getThumbURLsToPreload(favorites: FavoriteItem[]): string[] {
  return collectUnrendered(favorites, FavoritesSettings.infiniteScrollPreloadCount, f => f.thumbUrl);
}
