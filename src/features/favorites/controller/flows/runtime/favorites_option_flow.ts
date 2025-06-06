import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesSearchFlow from "./favorites_search_flow";
import * as FavoritesView from "../../../view/favorites_view";
import { FavoriteLayout, Rating, SortingMethod } from "../../../../../types/primitives/primitives";
import { FavoritesInfiniteScrollFlow } from "../presentation/favorites_infinite_scroll_flow";
import { Preferences } from "../../../../../store/local_storage/preferences";

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
  FavoritesSearchFlow.searchFavoritesWithPreviousQuery();
}

export function changeSortingMethod(sortingMethod: SortingMethod): void {
  FavoritesModel.setSortingMethod(sortingMethod);
  FavoritesSearchFlow.searchFavoritesWithPreviousQuery();
}

export function toggleSortAscending(value: boolean): void {
  FavoritesModel.toggleSortAscending(value);
  FavoritesSearchFlow.searchFavoritesWithPreviousQuery();
}

export function changeAllowedRatings(ratings: Rating): void {
  FavoritesModel.changeAllowedRatings(ratings);
  FavoritesSearchFlow.searchFavoritesWithPreviousQuery();
}

export function changeResultsPerPage(resultsPerPage: number): void {
  FavoritesModel.changeResultsPerPage(resultsPerPage);
  FavoritesSearchFlow.showLatestSearchResults();
}

