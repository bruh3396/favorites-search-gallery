import * as SearchPageFavoriteIds from "@/features/search_page/model/favorite_ids";
import * as SearchPageNavigator from "@/features/search_page/model/navigator";

export function setup(): void {
  SearchPageNavigator.setup();
}

export * from "@/features/search_page/model/navigator";
export { ensureLoaded as ensureFavoriteIdsLoaded, has as isFavorite, add as addFavoriteId, remove as removeFavoriteId } from "@/features/search_page/model/favorite_ids";

export function filterFavorites(thumbs: HTMLElement[]): HTMLElement[] {
  return thumbs.filter(thumb => SearchPageFavoriteIds.has(thumb.id));
}
