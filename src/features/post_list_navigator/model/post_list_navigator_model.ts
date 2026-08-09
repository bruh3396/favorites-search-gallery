import * as PostListNavigatorFavoriteIds from "@/features/post_list_navigator/model/favorite_ids";
import * as PostListNavigatorNavigator from "@/features/post_list_navigator/model/navigator";

export function setup(): void {
  PostListNavigatorNavigator.setup();
}

export * from "@/features/post_list_navigator/model/navigator";
export { ensureLoaded as ensureFavoriteIdsLoaded, has as isFavorite, add as addFavoriteId, remove as removeFavoriteId } from "@/features/post_list_navigator/model/favorite_ids";

export function filterFavorites(thumbs: HTMLElement[]): HTMLElement[] {
  return thumbs.filter(thumb => PostListNavigatorFavoriteIds.has(thumb.id));
}
