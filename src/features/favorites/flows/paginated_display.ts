import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { ContentDisplayOptions } from "@/types/ui";
import { Events } from "@/app/channels/events";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesDisplay } from "@/features/favorites/types/types";
import { NavigationKey } from "@/types/input";
import { preloadImages } from "@/app/layout/content_thumbs";

let appendedFirstResults = false;

export const FavoritesPaginatedDisplay = {
  initialize,
  sync: reconcilePagination,
  advance: stepPage,
  goToPage,
  teardown: (): void => FavoritesView.togglePaginator(false)
} satisfies FavoritesDisplay;

function initialize(results: Favorite[], options?: ContentDisplayOptions): void {
  FavoritesView.togglePaginator(true);
  FavoritesModel.paginate(results);
  FavoritesModel.selectPage(1);
  renderCurrentPage(options);
}

function goToPage(pageNumber: number): void {
  FavoritesModel.selectPage(pageNumber);
  renderCurrentPage();
}

function renderCurrentPage(options?: ContentDisplayOptions): void {
  FavoritesView.showSearchResults(FavoritesModel.currentPageFavorites(), options);
  FavoritesView.buildPaginator(FavoritesModel.paginationContext());

  if (FavoritesConfig.preloadThumbs) {
    preloadImages(FavoritesModel.adjacentPageFavorites().map(favorite => favorite.thumbUrl));
  }
}

function reconcilePagination(): void {
  FavoritesModel.paginate(FavoritesModel.getCurrentSearchResults());
  FavoritesView.updatePaginator(FavoritesModel.paginationContext());
  appendMissingThumbsOnCurrentPage();
}

function appendMissingThumbsOnCurrentPage(): void {
  if (appendedFirstResults && !FavoritesModel.atFinalPage()) {
    return;
  }
  const missing = FavoritesModel.currentPageFavorites().filter(favorite => document.getElementById(favorite.id) === null);

  if (missing.length === 0) {
    return;
  }
  appendedFirstResults = true;
  FavoritesView.addToBottom(missing);
}

function stepPage(direction: NavigationKey): boolean {
  if (Events.favorites.favoritesLoaded.fired) {
    if (FavoritesModel.selectWrappedAdjacentPage(direction)) {
      renderCurrentPage();
      return true;
    }
    return FavoritesModel.hasOnlyOnePage();
  }

  if (FavoritesModel.selectAdjacentPage(direction)) {
    renderCurrentPage();
    return true;
  }
  return false;
}
