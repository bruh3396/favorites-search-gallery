import * as FavoritesAfterLoadFlow from "./flows/setup/favorites_after_load_flow";
import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesOptionsFlow from "./flows/runtime/favorites_option_flow";
import * as FavoritesPresentationFlow from "./flows/presentation/favorites_presentation_flow";
import * as FavoritesResetFlow from "./flows/runtime/favorites_reset_flow";
import * as FavoritesSearchFlow from "./flows/runtime/favorites_search_flow";
import * as FavoritesView from "../view/favorites_view";
import { CrossFeatureRequests } from "../../../lib/global/cross_feature_requests";
import { Events } from "../../../lib/global/events/events";
import { FavoritesPaginationFlow } from "./flows/presentation/favorites_pagination_flow";
import { updateShowOnHoverOptionTriggeredFromGallery } from "../ui/favorites_menu_event_handlers";

export function setupFavoritesController(): void {
  addInitialLoadEventListeners();
  addButtonEventListeners();
  addSettingsEventListeners();
  addMetaEventListeners();
  addCrossFeatureEventListeners();
  addCrossFeatureRequestHandlers();
}

function addInitialLoadEventListeners(): void {
  Events.favorites.favoritesLoadedFromDatabase.on(FavoritesAfterLoadFlow.onFavoritesLoadedFromDatabase, { once: true });
  Events.favorites.startedFetchingFavorites.on(FavoritesAfterLoadFlow.onStartedFetchingFavorites, { once: true });
  Events.favorites.startedStoringAllFavorites.on(FavoritesAfterLoadFlow.onStartedStoringAllFavorites, { once: true });
  Events.favorites.favoritesLoaded.on(FavoritesAfterLoadFlow.onFavoritesLoaded, { once: true });
}

function addButtonEventListeners(): void {
  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.pageSelected.on(FavoritesPaginationFlow.gotoPage.bind(FavoritesPaginationFlow));
  Events.favorites.relativePageSelected.on(FavoritesPaginationFlow.gotoRelativePage.bind(FavoritesPaginationFlow));
  Events.favorites.searchSubsetClicked.on(FavoritesModel.setSearchSubset);
  Events.favorites.stopSearchSubsetClicked.on(FavoritesModel.stopSubset);
  Events.favorites.findFavoriteStarted.on(FavoritesPresentationFlow.revealFavorite);
  Events.favorites.findFavoriteInAllStarted.on(FavoritesSearchFlow.findFavoriteInAll);
}

function addSettingsEventListeners(): void {
  Events.favorites.infiniteScrollToggled.on(FavoritesOptionsFlow.toggleInfiniteScroll);
  Events.favorites.blacklistToggled.on(FavoritesOptionsFlow.useBlacklist);
  Events.favorites.layoutChanged.on(FavoritesOptionsFlow.changeLayout);
  Events.favorites.sortAscendingChanged.on(FavoritesOptionsFlow.setSortAscending);
  Events.favorites.sortingMethodChanged.on(FavoritesOptionsFlow.setSortingMethod);
  Events.favorites.allowedRatingsChanged.on(FavoritesOptionsFlow.setAllowedRatings);
  Events.favorites.resultsPerPageChanged.on(FavoritesOptionsFlow.setResultsPerPage);
}

function addMetaEventListeners(): void {
  Events.favorites.resetConfirmed.on(FavoritesResetFlow.resetFavorites);
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteFavorite);
  Events.favorites.missingMetadataFound.on(FavoritesModel.updateMetadata);
}

function addCrossFeatureEventListeners(): void {
  Events.gallery.showOnHoverToggled.on(updateShowOnHoverOptionTriggeredFromGallery);
  Events.gallery.favoriteToggled.on(FavoritesView.swapFavoriteButton);
  Events.tagModifier.resetConfirmed.on(FavoritesModel.resetTagModifications);
}

function addCrossFeatureRequestHandlers(): void {
  CrossFeatureRequests.loadNewFavoritesInGallery.setHandler(FavoritesPresentationFlow.loadNewFavoritesInGallery);
  CrossFeatureRequests.latestFavoritesSearchResults.setHandler(FavoritesModel.getLatestSearchResults);
}
