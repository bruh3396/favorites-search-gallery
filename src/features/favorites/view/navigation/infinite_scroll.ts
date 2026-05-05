import { Favorite } from "../../../../types/favorite";
import { FavoritesSettings } from "../../../../config/favorites_settings";

function collectUnrendered<T>(favorites: Favorite[], limit: number, selector: (f: Favorite) => T): T[] {
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

export function getMoreResults(favorites: Favorite[]): HTMLElement[] {
  return collectUnrendered(favorites, FavoritesSettings.infiniteScrollBatchSize, f => f.root);
}

export function hasMoreResults(favorites: Favorite[]): boolean {
  return getMoreResults(favorites).length > 0;
}

export function getFirstResults(favorites: Favorite[]): Favorite[] {
  return favorites.slice(0, FavoritesSettings.infiniteScrollBatchSize);
}

export function getThumbURLsToPreload(favorites: Favorite[]): string[] {
  return collectUnrendered(favorites, FavoritesSettings.infiniteScrollPreloadCount, f => f.thumbUrl);
}
