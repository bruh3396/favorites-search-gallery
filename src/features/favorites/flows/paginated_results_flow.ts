import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { preloadImages, revealItem } from "@/app/layout/content_thumbs";
import { Events } from "@/app/channels/events";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesResultsView } from "@/features/favorites/types/types";
import { NavigationKey } from "@/types/input";

let appendedFirstResults = false;

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

  if (FavoritesConfig.preloadThumbs) {
    preloadImages(FavoritesModel.adjacentPageFavorites().map(favorite => favorite.thumbUrl));
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
}

function appendMissingThumbsOnCurrentPage(): void {
  if (appendedFirstResults && !FavoritesModel.onFinalPage()) {
    return;
  }
  const missing = FavoritesModel.currentPageFavorites().filter(favorite => document.getElementById(favorite.id) === null);

  if (missing.length === 0) {
    return;
  }
  appendedFirstResults = true;
  FavoritesView.addToBottom(missing);
  Events.favorites.favoritesAddedToCurrentPage.emit(missing);
}

function stepPage(direction: NavigationKey): boolean {
  if (Events.favorites.favoritesLoaded.fired) {
    if (FavoritesModel.selectWrappedAdjacentPage(direction)) {
      renderCurrentPage();
      return true;
    }
    return FavoritesModel.onlyOnePage();
  }

  if (FavoritesModel.selectAdjacentPage(direction)) {
    renderCurrentPage();
    return true;
  }
  return false;
}
