import * as FavoritesModel from "../../../../model/favorites_model";
import { FavoriteItem } from "../../../../types/favorite/favorite_item";
import { FavoritesInfiniteScrollFlow } from "./infinite_scroll/favorites_infinite_scroll_flow";
import { FavoritesPaginationFlow } from "./pagination/favorites_pagination_flow";
import { FavoritesPresentationFlow } from "./favorites_presentation_flow_interface";

function getPresentationFlow(): FavoritesPresentationFlow {
  return FavoritesModel.usingInfiniteScroll() ? FavoritesInfiniteScrollFlow : FavoritesPaginationFlow;
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
