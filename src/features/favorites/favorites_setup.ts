import * as FavoritesAfterLoadFlow from "./flow/favorites_after_load_flow";
import * as FavoritesLoadFlow from "./flow/favorites_load_flow";
import * as FavoritesModel from "./model/favorites_model";
import * as FavoritesOptionsFlow from "./flow/favorites_option_flow";
import * as FavoritesPresentationFlow from "./flow/favorites_presentation_flow";
import * as FavoritesResetFlow from "./flow/favorites_reset_flow";
import * as FavoritesSearchFlow from "./flow/favorites_search_flow";
import * as FavoritesView from "./view/favorites_view";
import { Events } from "../../lib/communication/events";
import { FavoritesPaginationFlow } from "./flow/favorites_pagination_flow";
import { FeatureBridge } from "../../lib/communication/feature_bridge";
import { ON_FAVORITES_PAGE } from "../../lib/environment/environment";
import { getFavorite } from "./type/favorite_item";
import { updateShowOnHoverOptionTriggeredFromGallery } from "./view/update/favorites_menu_event_handlers";

export function setupFavorites(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  addEventListeners();
  FavoritesModel.setupFavoritesModel();
  FavoritesView.setupFavoritesView();
  FavoritesLoadFlow.loadAllFavorites();
}

function addEventListeners(): void {
  Events.favorites.startedFetchingFavorites.on(FavoritesModel.buildSearchIndexSync, { once: true });
  Events.favorites.startedStoringAllFavorites.on(FavoritesAfterLoadFlow.onStartedStoringAllFavorites, { once: true });
  Events.favorites.favoritesLoaded.on(FavoritesAfterLoadFlow.onFavoritesLoaded, { once: true });

  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.pageSelected.on(FavoritesPaginationFlow.gotoPage.bind(FavoritesPaginationFlow));
  Events.favorites.relativePageSelected.on(FavoritesPaginationFlow.gotoRelativePage.bind(FavoritesPaginationFlow));
  Events.favorites.searchSubsetClicked.on(FavoritesModel.setSearchSubset);
  Events.favorites.stopSearchSubsetClicked.on(FavoritesModel.stopSubset);
  Events.favorites.findFavoriteStarted.on(FavoritesPresentationFlow.revealFavorite);
  Events.favorites.findFavoriteInAllStarted.on(FavoritesSearchFlow.findFavoriteInAll);

  Events.favorites.infiniteScrollToggled.on(FavoritesOptionsFlow.toggleInfiniteScroll);
  Events.favorites.blacklistToggled.on(FavoritesOptionsFlow.onBlacklistChanged);
  Events.favorites.layoutChanged.on(FavoritesView.changeLayout);
  Events.favorites.sortAscendingToggled.on(FavoritesOptionsFlow.searchFavoritesWithNewOptions);
  Events.favorites.sortingMethodChanged.on(FavoritesOptionsFlow.searchFavoritesWithNewOptions);
  Events.favorites.allowedRatingsChanged.on(FavoritesOptionsFlow.searchFavoritesWithNewOptions);
  Events.favorites.resultsPerPageChanged.on(FavoritesOptionsFlow.setResultsPerPage);

  Events.favorites.resetConfirmed.on(FavoritesResetFlow.resetFavorites);
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteFavorite);
  Events.favorites.missingMetadataFound.on(FavoritesModel.updateMetadata);

  Events.gallery.showOnHoverOverridden.on(updateShowOnHoverOptionTriggeredFromGallery);
  Events.gallery.favoriteToggled.on(FavoritesView.swapFavoriteButton);
  Events.tagModifier.resetConfirmed.on(FavoritesModel.resetTagModifications);

  FeatureBridge.moreFavoritesPagesExist.register(FavoritesPresentationFlow.loadNewFavoritesInGallery);
  FeatureBridge.favoritesSearchResults.register(FavoritesModel.getLatestSearchResults);
  FeatureBridge.allFavorites.register(getFavorite);
}
