import { FavoriteItem } from "../type/favorite_item";
import { FavoritesInfiniteScrollFlow } from "./favorites_infinite_scroll_flow";
import { FavoritesPaginationFlow } from "./favorites_pagination_flow";
import { FavoritesPresentationFlow } from "../type/favorite_types";
import { NavigationKey } from "../../../types/input";
import { Preferences } from "../../../lib/preferences/preferences";

function getPresentationFlow(): FavoritesPresentationFlow {
  return Preferences.infiniteScroll.value ? FavoritesInfiniteScrollFlow : FavoritesPaginationFlow;
}

export function present(favorites: FavoriteItem[]): void {
  getPresentationFlow().present(favorites);
}

export function clear(): void {
  getPresentationFlow().present([]);
}

export function revealFavorite(id: string): void {
  getPresentationFlow().revealFavorite(id);
}

export function handleNewSearchResults(): void {
  getPresentationFlow().handleNewSearchResults();
}

export function loadNewFavoritesInGallery(direction: NavigationKey): boolean {
  return getPresentationFlow().loadNewFavoritesInGallery(direction);
}
