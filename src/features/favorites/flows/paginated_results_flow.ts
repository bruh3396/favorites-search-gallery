import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { preloadImages, revealItem } from "@/app/layout/content_thumbs";
import { Events } from "@/app/channels/events";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesResultsView } from "@/features/favorites/types/interfaces";
import { NavigationKey } from "@/types/input";

let hasAppendedFirstResults = false;

export const FavoritesPaginatedView = {
  initialize,
  sync: reconcilePagination,
  reveal,
  loadMore: (direction: NavigationKey): boolean => stepPage(direction)
} satisfies FavoritesResultsView;

export { goToPage, stepPage };

function initialize(results: Favorite[]): void {
  FavoritesModel.paginate(results);
  FavoritesModel.selectPage(1);
  renderCurrentPage();
}

function goToPage(pageNumber: number): void {
  FavoritesModel.selectPage(pageNumber);
  renderCurrentPage();
}

function renderCurrentPage(): void {
  FavoritesView.showSearchResults(FavoritesModel.currentPageFavorites());
  FavoritesView.buildPaginator(FavoritesModel.paginationContext());

  if (FavoritesConfig.preloadThumbnails) {
    preloadImages(FavoritesModel.adjacentPageFavorites().map(favorite => favorite.thumbnailUrl));
  }
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
  FavoritesView.updatePaginator(FavoritesModel.paginationContext());
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

function stepPage(direction: NavigationKey): boolean {
  if (Events.favorites.favoritesLoaded.fired) {
    if (FavoritesModel.selectWrappedAdjacentPage(direction)) {
      renderCurrentPage();
      return true;
    }
  } else if (FavoritesModel.selectAdjacentPage(direction)) {
    renderCurrentPage();
    return true;
  }
  return false;
}
