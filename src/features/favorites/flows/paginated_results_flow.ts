import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesView from "../view/favorites_view";
import { Favorite, PageRelation } from "../../../types/favorite";
import { Events } from "../../../app/messaging/events";
import { FavoritesResultsView } from "../types/favorite_types";
import { NavigationKey } from "../../../types/input";
import { revealItem } from "../../../app/shell/content_thumbs";

let hasAppendedFirstResults = false;

export const FavoritesPaginatedView = {
  initialize,
  sync: reconcilePagination,
  reveal,
  loadMore: (direction: NavigationKey): void => navigateToAdjacentPage(direction),
  hasMore: (): boolean => true
} satisfies FavoritesResultsView;

export { goToPage, goToRelativePage };

function initialize(results: Favorite[]): void {
  FavoritesModel.paginate(results);
  FavoritesModel.selectPage(1);
  renderCurrentPage();
}

function goToPage(pageNumber: number): void {
  FavoritesModel.selectPage(pageNumber);
  renderCurrentPage();
}

function goToRelativePage(relativePage: PageRelation): void {
  if (FavoritesModel.selectRelativePage(relativePage)) {
    renderCurrentPage();
  }
}

function renderCurrentPage(): void {
  FavoritesView.showSearchResults(FavoritesModel.currentPageFavorites());
  FavoritesView.buildNavigationMenu(FavoritesModel.getPaginationParameters());
  FavoritesView.preloadThumbs(FavoritesModel.adjacentPageFavorites());
  Events.favorites.pageChanged.emit();
}

function reveal(id: string): void {
  if (FavoritesModel.selectPageContaining(id)) {
    renderCurrentPage();
  }
  revealItem(id);
}

function reconcilePagination(): void {
  FavoritesModel.paginate(FavoritesModel.getCurrentSearchResults());
  FavoritesView.updateNavigationMenu(FavoritesModel.getPaginationParameters());
  appendMissingThumbsOnCurrentPage();
  Events.favorites.searchResultsUpdated.emit();
}

function appendMissingThumbsOnCurrentPage(): void {
  if (!FavoritesModel.onFinalPage() && hasAppendedFirstResults) {
    return;
  }
  const favorites = FavoritesModel.currentPageFavorites().filter(favorite => document.getElementById(favorite.id) === null);

  if (favorites.length > 0) {
    hasAppendedFirstResults = true;
  }
  const thumbs = favorites.map(favorite => favorite.root);

  FavoritesView.addToBottom(favorites);
  Events.favorites.favoritesAddedToCurrentPage.emit(thumbs);
}

function navigateToAdjacentPage(direction: NavigationKey): void {
  if (FavoritesModel.selectAdjacentPage(direction)) {
    renderCurrentPage();
  }
}
