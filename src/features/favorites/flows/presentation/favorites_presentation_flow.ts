import * as FavoritesModel from "../../model/favorites_model";
import {FavoriteItem} from "../../types/favorite/favorite_item";
import {FavoritesInfiniteScrollFlow} from "./favorites_infinite_scroll_flow";
import {FavoritesPaginationFlow} from "./favorites_pagination_flow";
import {FavoritesPresentationFlow} from "./favorites_presentation_flow_interface";

function getPresentationController(): FavoritesPresentationFlow {
  return FavoritesModel.usingInfiniteScroll() ? FavoritesInfiniteScrollFlow : FavoritesPaginationFlow;
}

export function present(favorites: FavoriteItem[]): void {
  getPresentationController().present(favorites);
}

export function clear(): void {
  getPresentationController().present([]);
}

export function revealFavorite(id: string): void {
  getPresentationController().revealFavorite(id);
}

export function handleNewSearchResults(): void {
  getPresentationController().handleNewSearchResults();
}
