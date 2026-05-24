import * as SearchPageNavigator from "./navigator";

export function setup(): void {
  SearchPageNavigator.setup();
}

export * from "./navigator";
export { populate as populateFavoriteIds, has as isFavorite, add as addFavoriteId, remove as removeFavoriteId } from "./favorite_ids";
