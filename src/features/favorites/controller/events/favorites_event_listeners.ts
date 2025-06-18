import * as Extensions from "../../../../store/indexed_db/extensions";
import * as FavoritesModel from "../../model/favorites_model";
import * as FavoritesOptionsFlow from "../flows/runtime/favorites_option_flow";
import * as FavoritesPostLoadFlow from "../flows/setup/favorites_post_load_flow";
import * as FavoritesSearchFlow from "../flows/runtime/favorites_search_flow";
import * as FavoritesView from "../../view/favorites_view";
import { Events } from "../../../../lib/globals/events";
import { FavoritesPaginationFlow } from "../flows/presentation/favorites_pagination_flow";
import { updateShowOnHoverOptionTriggeredFromGallery } from "../../ui/favorites_menu_event_handlers";

export function addFavoritesEventsListeners(): void {
  Events.favorites.favoritesLoadedFromDatabase.on(FavoritesModel.keepIndexedTagsSorted, {once: true});
  Events.favorites.startedFetchingFavorites.on(FavoritesPostLoadFlow.onStartedFetchingFavorites, {once: true});
  Events.favorites.favoritesLoaded.on(FavoritesPostLoadFlow.onFavoritesLoaded, {once: true});

  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.pageSelected.on(FavoritesPaginationFlow.gotoPage.bind(FavoritesPaginationFlow));
  Events.favorites.relativePageSelected.on(FavoritesPaginationFlow.gotoRelativePage.bind(FavoritesPaginationFlow));

  Events.favorites.reset.on(FavoritesModel.deleteDatabase);
  Events.favorites.reset.on(Extensions.deleteExtensionsDatabase);
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteFavorite);
  Events.favorites.missingMetadataFound.on(FavoritesModel.updateMetadata);

  Events.gallery.requestPageChange.on(FavoritesPaginationFlow.handlePageChangeRequest.bind(FavoritesPaginationFlow));
  Events.gallery.showOnHover.on(updateShowOnHoverOptionTriggeredFromGallery);
  Events.gallery.favoriteToggled.on(FavoritesModel.swapFavoriteButton);

  Events.favorites.infiniteScrollToggled.on(FavoritesOptionsFlow.toggleInfiniteScroll);
  Events.favorites.blacklistToggled.on(FavoritesOptionsFlow.toggleBlacklist);
  Events.favorites.layoutChanged.on(FavoritesOptionsFlow.changeLayout);
  Events.favorites.columnCountChanged.on(FavoritesView.updateColumnCount);
  Events.favorites.rowSizeChanged.on(FavoritesView.updateRowSize);
  Events.favorites.sortAscendingToggled.on(FavoritesOptionsFlow.toggleSortAscending);
  Events.favorites.sortingMethodChanged.on(FavoritesOptionsFlow.changeSortingMethod);
  Events.favorites.allowedRatingsChanged.on(FavoritesOptionsFlow.changeAllowedRatings);
  Events.favorites.resultsPerPageChanged.on(FavoritesOptionsFlow.changeResultsPerPage);
  Events.document.wheel.on(FavoritesView.changeColumCountUsingWheel);
}
