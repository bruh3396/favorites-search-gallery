import { FavoriteItem } from "../../../types/favorite/favorite_item";
import { FavoritesInfiniteScrollFlow } from "./favorites_infinite_scroll_flow";
import { FavoritesPaginationFlow } from "./favorites_pagination_flow";
import { FavoritesPresentationFlow } from "../../../types/favorites_presentation_flow_interface";
import { NavigationKey } from "../../../../../types/common_types";
import { Preferences } from "../../../../../lib/global/preferences/preferences";

function getPresentationFlow(): FavoritesPresentationFlow {
  return Preferences.infiniteScrollEnabled.value ? FavoritesInfiniteScrollFlow : FavoritesPaginationFlow;
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
