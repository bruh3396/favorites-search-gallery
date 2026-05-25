import * as SearchPageFavoriteIds from "./favorite_ids";
import * as SearchPageNavigator from "./navigator";

export function setup(): void {
  SearchPageNavigator.setup();
}

export * from "./navigator";
export { ensureLoaded as ensureFavoriteIdsLoaded, has as isFavorite, add as addFavoriteId, remove as removeFavoriteId } from "./favorite_ids";

export function filterFavorites(thumbs: HTMLElement[]): HTMLElement[] {
  return thumbs.filter(thumb => SearchPageFavoriteIds.has(thumb.id));
}
