import * as FavoritesModel from "../../model/model";
import * as FavoritesView from "../../view/view";
import {Events} from "../../../../lib/functional/events";
import {FavoriteItem} from "../../types/favorite/favorite";
import {FavoritesInfiniteScrollPresenter} from "../presentation/infinite_scroll_presenter";
import {FavoritesPaginationPresenter} from "../presentation/pagination_presenter";
import {FavoritesPresenter} from "../presentation/presenter";

export function getPresenter(): FavoritesPresenter {
  return FavoritesModel.usingInfiniteScroll() ? FavoritesInfiniteScrollPresenter : FavoritesPaginationPresenter;
}

export function searchFavorites(searchQuery: string): void {
  showSearchResults(FavoritesModel.getSearchResults(searchQuery));
}

export function showSearchResults(searchResults: FavoriteItem[]): void {
  Events.favorites.searchResultsUpdated.emit(searchResults);
  FavoritesView.setMatchCount(searchResults.length);
  getPresenter().present(searchResults);
}

export function findFavorite(id: string): void {
  getPresenter().revealFavorite(id);
}

export function toggleInfiniteScroll(value: boolean): void {
  FavoritesInfiniteScrollPresenter.reset();
  FavoritesModel.toggleInfiniteScroll(value);
  FavoritesView.togglePaginationMenu(!value);
  showSearchResults(FavoritesModel.getLatestSearchResults());
}

export function shuffleSearchResults(): void {
  showSearchResults(FavoritesModel.getShuffledSearchResults());
}
