import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesSearchFlow from "./favorites_search_flow";
import * as FavoritesView from "../../../view/favorites_view";
import { Layout, Rating, SortingMethod } from "../../../../../types/common_types";
import { FavoritesInfiniteScrollFlow } from "../presentation/favorites_infinite_scroll_flow";

export function changeLayout(layout: Layout): void {
  FavoritesView.changeLayout(layout);
}

export function toggleInfiniteScroll(value: boolean): void {
  FavoritesInfiniteScrollFlow.reset();
  FavoritesView.togglePaginationMenu(!value);
  FavoritesSearchFlow.showLatestSearchResults();
}

export function useBlacklist(value: boolean): void {
  FavoritesModel.useBlacklist(value);
  FavoritesSearchFlow.searchFavorites();
}

export function setSortingMethod(sortingMethod: SortingMethod): void {
  FavoritesModel.setSortingMethod(sortingMethod);
  FavoritesSearchFlow.searchFavorites();
}

export function setSortAscending(value: boolean): void {
  FavoritesModel.setSortAscending(value);
  FavoritesSearchFlow.searchFavorites();
}

export function setAllowedRatings(ratings: Rating): void {
  FavoritesModel.setAllowedRatings(ratings);
  FavoritesSearchFlow.searchFavorites();
}

export function setResultsPerPage(resultsPerPage: number): void {
  FavoritesView.setResultsPerPage(resultsPerPage);
  FavoritesSearchFlow.showLatestSearchResults();
}
