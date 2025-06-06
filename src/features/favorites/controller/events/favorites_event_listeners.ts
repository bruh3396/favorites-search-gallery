import * as FavoritesModel from "../../model/favorites_model";
import * as FavoritesOptionsFlow from "../flows/runtime/favorites_option_flow";
import * as FavoritesSearchFlow from "../flows/runtime/favorites_search_flow";
import * as FavoritesView from "../../view/favorites_view";
import { Events } from "../../../../lib/globals/events";
import { FavoritesPaginationFlow } from "../flows/presentation/favorites_pagination_flow";
import { updateShowOnHoverOptionTriggeredFromGallery } from "../../ui/favorites_menu_event_handlers";

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
  Events.gallery.showOnHover.on(updateShowOnHoverOptionTriggeredFromGallery);

  Events.favorites.infiniteScrollToggled.on(FavoritesOptionsFlow.toggleInfiniteScroll);
  Events.favorites.blacklistToggled.on(FavoritesOptionsFlow.toggleBlacklist);
  Events.favorites.layoutChanged.on(FavoritesOptionsFlow.changeLayout);
  Events.favorites.columnCountChanged.on(FavoritesView.updateColumnCount);
  Events.favorites.sortAscendingToggled.on(FavoritesOptionsFlow.toggleSortAscending);
  Events.favorites.sortingMethodChanged.on(FavoritesOptionsFlow.changeSortingMethod);
  Events.favorites.allowedRatingsChanged.on(FavoritesOptionsFlow.changeAllowedRatings);
  Events.favorites.resultsPerPageChanged.on(FavoritesOptionsFlow.changeResultsPerPage);
  Events.document.wheel.on(FavoritesView.changeColumCountUsingWheel);
}
