import { Favorite } from "../../../../types/favorite";
import { FavoritesConfig } from "../../../../config/favorites_config";

export function getNextSlice(favorites: Favorite[]): HTMLElement[] {
  return collectUnrendered(favorites, FavoritesConfig.infiniteScrollBatchSize, f => f.root);
}

export function hasMoreSlices(favorites: Favorite[]): boolean {
  return getNextSlice(favorites).length > 0;
}

export function getInitialSlice(favorites: Favorite[]): Favorite[] {
  return favorites.slice(0, FavoritesConfig.infiniteScrollBatchSize);
}

export function getThumbUrlsToPreload(favorites: Favorite[]): string[] {
  return collectUnrendered(favorites, FavoritesConfig.infiniteScrollPreloadCount, f => f.thumbUrl);
}

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
