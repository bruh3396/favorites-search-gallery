import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesSearchFlow from "./favorites_search_flow";
import * as FavoritesView from "../../../view/favorites_view";
import { FavoriteLayout, Rating, SortingMethod } from "../../../../../types/common_types";
import { FavoritesInfiniteScrollFlow } from "../presentation/favorites_infinite_scroll_flow";

export function changeLayout(layout: FavoriteLayout): void {
  FavoritesView.changeLayout(layout);
}

export function toggleInfiniteScroll(value: boolean): void {
  FavoritesInfiniteScrollFlow.reset();
  FavoritesView.togglePaginationMenu(!value);
  FavoritesModel.toggleInfiniteScroll(value);
  FavoritesSearchFlow.showLatestSearchResults();
}

export function toggleBlacklist(value: boolean): void {
  FavoritesModel.toggleBlacklist(value);
  FavoritesSearchFlow.searchFavoritesUsingLatestQuery();
}

export function changeSortingMethod(sortingMethod: SortingMethod): void {
  FavoritesModel.setSortingMethod(sortingMethod);
  FavoritesSearchFlow.searchFavoritesUsingLatestQuery();
}

export function toggleSortAscending(value: boolean): void {
  FavoritesModel.toggleSortAscending(value);
  FavoritesSearchFlow.searchFavoritesUsingLatestQuery();
}

export function changeAllowedRatings(ratings: Rating): void {
  FavoritesModel.changeAllowedRatings(ratings);
  FavoritesSearchFlow.searchFavoritesUsingLatestQuery();
}

export function changeResultsPerPage(resultsPerPage: number): void {
  FavoritesModel.changeResultsPerPage(resultsPerPage);
  FavoritesSearchFlow.showLatestSearchResults();
}
