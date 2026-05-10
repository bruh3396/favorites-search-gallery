import { Favorite } from "../../../../types/favorite";
import { FavoritesConfig } from "../../../../config/favorites_config";

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
  return collectUnrendered(favorites, FavoritesConfig.infiniteScrollBatchSize, f => f.root);
}

export function hasMoreResults(favorites: Favorite[]): boolean {
  return getMoreResults(favorites).length > 0;
}

export function getFirstResults(favorites: Favorite[]): Favorite[] {
  return favorites.slice(0, FavoritesConfig.infiniteScrollBatchSize);
}

export function getThumbUrlsToPreload(favorites: Favorite[]): string[] {
  return collectUnrendered(favorites, FavoritesConfig.infiniteScrollPreloadCount, f => f.thumbUrl);
}
