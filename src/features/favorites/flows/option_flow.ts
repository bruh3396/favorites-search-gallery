import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesSearchFlow from "./search_flow";
import * as FavoritesView from "../view/favorites_view";
import { FavoritesInfiniteScrollFlow } from "./infinite_scroll_flow";

export function toggleInfiniteScroll(value: boolean): void {
  FavoritesInfiniteScrollFlow.reset();
  FavoritesView.togglePaginationMenu(!value);
  FavoritesSearchFlow.showLatestSearchResults();
}

export function onBlacklistChanged(): void {
  FavoritesModel.updateSearchQuery();
  researchFavorites();
}

export function setResultsPerPage(resultsPerPage: number): void {
  FavoritesView.setResultsPerPage(resultsPerPage);
  FavoritesSearchFlow.showLatestSearchResults();
}

export function researchFavorites(): void {
  FavoritesSearchFlow.searchFavorites();
}
