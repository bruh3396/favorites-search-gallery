import * as FavoritesModel from "../../model/favorites_model";
import * as FavoritesOptionsFlow from "../flows/runtime/favorites_option_flow";
import * as FavoritesSearchFlow from "../flows/runtime/favorites_search_flow";
import * as FavoritesView from "../../view/favorites_view";
import { Events } from "../../../../lib/globals/events";
import { FavoritesPaginationFlow } from "../flows/runtime/presentation/pagination/favorites_pagination_flow";

export function addEventListenersToFavoritesPage(): void {
  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);

  Events.favorites.startedFetchingFavorites.on(FavoritesModel.keepIndexedTagsSorted);
  Events.favorites.reset.on(FavoritesModel.deleteDatabase);
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteFavorite);
  Events.favorites.missingMetadataFound.on(FavoritesModel.updateMetadata);
  Events.favorites.favoritesLoadedFromDatabase.on(FavoritesModel.keepIndexedTagsSorted);

  Events.favorites.pageSelected.on(FavoritesPaginationFlow.gotoPage.bind(FavoritesPaginationFlow));
  Events.favorites.relativePageSelected.on(FavoritesPaginationFlow.gotoRelativePage.bind(FavoritesPaginationFlow));
  Events.gallery.requestPageChange.on(FavoritesPaginationFlow.handlePageChangeRequest.bind(FavoritesPaginationFlow));

  Events.favorites.infiniteScrollToggled.on(FavoritesOptionsFlow.toggleInfiniteScroll);
  Events.favorites.blacklistToggled.on(FavoritesOptionsFlow.toggleBlacklist);
  Events.favorites.layoutChanged.on(FavoritesView.changeLayout);
  Events.favorites.columnCountChanged.on(FavoritesView.updateColumnCount);
  Events.favorites.sortAscendingToggled.on(FavoritesOptionsFlow.toggleSortAscending);
  Events.favorites.sortingMethodChanged.on(FavoritesOptionsFlow.changeSortingMethod);
  Events.favorites.allowedRatingsChanged.on(FavoritesOptionsFlow.changeAllowedRatings);
  addKeyDownEventListeners();
}

function addKeyDownEventListeners(): void {
  // Events.global.keydown.on(async (event) => {
  //   if (!event.isHotkey) {
  //     return;
  //   }

  //   if (event.originalEvent.key !== "ArrowRight" && event.originalEvent.key !== "ArrowLeft") {
  //     return;
  //   }
  //   const inGallery = await Utils.inGallery();

  //   if (inGallery) {
  //     return;
  //   }
  //   this.displayController.gotoAdjacentPageDebounced(event.originalEvent.key);
  // });
}
