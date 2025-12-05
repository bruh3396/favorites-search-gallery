import * as FavoritesAfterLoadFlow from "../flows/setup/favorites_after_load_flow";
import * as FavoritesModel from "../../model/favorites_model";
import * as FavoritesOptionsFlow from "../flows/runtime/favorites_option_flow";
import * as FavoritesPresentationFlow from "../flows/presentation/favorites_presentation_flow";
import * as FavoritesResetFlow from "../flows/runtime/favorites_reset_flow";
import * as FavoritesSearchFlow from "../flows/runtime/favorites_search_flow";
import { CrossFeatureRequests } from "../../../../utils/cross_feature/cross_feature_requests";
import { Events } from "../../../../lib/global/events/events";
import { FavoritesPaginationFlow } from "../flows/presentation/favorites_pagination_flow";
import { updateShowOnHoverOptionTriggeredFromGallery } from "../../ui/favorites_menu_event_handlers";

export function addFavoritesEventsListeners(): void {
  Events.favorites.favoritesLoadedFromDatabase.on(FavoritesAfterLoadFlow.onFavoritesLoadedFromDatabase, {once: true});
  Events.favorites.startedFetchingFavorites.on(FavoritesAfterLoadFlow.onStartedFetchingFavorites, {once: true});
  Events.favorites.startedStoringAllFavorites.on(FavoritesAfterLoadFlow.onStartedStoringAllFavorites, {once: true});
  Events.favorites.favoritesLoaded.on(FavoritesAfterLoadFlow.onFavoritesLoaded, {once: true});

  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.pageSelected.on(FavoritesPaginationFlow.gotoPage.bind(FavoritesPaginationFlow));
  Events.favorites.relativePageSelected.on(FavoritesPaginationFlow.gotoRelativePage.bind(FavoritesPaginationFlow));
  Events.favorites.searchSubsetClicked.on(FavoritesModel.setSearchSubset);
  Events.favorites.stopSearchSubsetClicked.on(FavoritesModel.stopSearchSubset);

  Events.favorites.resetConfirmed.on(FavoritesResetFlow.resetFavorites);
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteFavorite);
  Events.favorites.missingMetadataFound.on(FavoritesModel.updateMetadata);
  Events.favorites.findFavoriteStarted.on(FavoritesPresentationFlow.revealFavorite);
  Events.favorites.findFavoriteInAllStarted.on(FavoritesSearchFlow.findFavoriteInAll);

  Events.gallery.showOnHoverToggled.on(updateShowOnHoverOptionTriggeredFromGallery);
  Events.gallery.favoriteToggled.on(FavoritesModel.swapFavoriteButton);
  Events.tagModifier.resetConfirmed.on(FavoritesModel.resetTagModifications);

  Events.favorites.infiniteScrollToggled.on(FavoritesOptionsFlow.toggleInfiniteScroll);
  Events.favorites.blacklistToggled.on(FavoritesOptionsFlow.toggleBlacklist);
  Events.favorites.layoutChanged.on(FavoritesOptionsFlow.changeLayout);
  Events.favorites.sortAscendingToggled.on(FavoritesOptionsFlow.toggleSortAscending);
  Events.favorites.sortingMethodChanged.on(FavoritesOptionsFlow.changeSortingMethod);
  Events.favorites.allowedRatingsChanged.on(FavoritesOptionsFlow.changeAllowedRatings);
  Events.favorites.resultsPerPageChanged.on(FavoritesOptionsFlow.changeResultsPerPage);

  CrossFeatureRequests.loadNewFavoritesInGallery.setResponse(FavoritesPresentationFlow.loadNewFavoritesInGallery);
  CrossFeatureRequests.infiniteScroll.setResponse(FavoritesModel.usingInfiniteScroll);
}
