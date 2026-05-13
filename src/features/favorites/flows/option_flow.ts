import * as FavoritesInfiniteScrollFlow from "./infinite_scroll_results_flow";
import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesSearchFlow from "./search_flow";
import * as FavoritesView from "../view/favorites_view";

export function toggleInfiniteScroll(value: boolean): void {
  FavoritesInfiniteScrollFlow.disconnect();
  FavoritesView.toggleNavigator(!value);
  FavoritesSearchFlow.showLatestSearchResults();
}

export function setResultsPerPage(resultsPerPage: number): void {
  FavoritesModel.setResultsPerPage(resultsPerPage);
  FavoritesSearchFlow.showLatestSearchResults();
}

export function reSearchFavorites(): void {
  FavoritesSearchFlow.searchFavorites();
}
