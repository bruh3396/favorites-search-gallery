import * as FavoritesControl from "./control/favorites_control";
import * as FavoritesDownloadController from "./features/downloader/menu";
import * as FavoritesInterFeatureFlow from "./flows/inter_feature_flow";
import * as FavoritesLoadFlow from "./flows/load_flow";
import * as FavoritesModel from "./model/favorites_model";
import * as FavoritesOptionsFlow from "./flows/option_flow";
import * as FavoritesPaginationFlow from "./flows/pagination_flow";
import * as FavoritesPresentationFlow from "./flows/presentation_flow";
import * as FavoritesResetFlow from "./flows/reset_flow";
import * as FavoritesSearchFlow from "./flows/search_flow";
import * as FavoritesTagModifier from "./features/tag_modifier/tag_modifier";
import * as FavoritesView from "./view/favorites_view";
import { DomEvents } from "../../lib/communication/dom_events";
import { Events } from "../../lib/communication/events";
import { FeatureBridge } from "../../lib/communication/feature_bridge";
import { ON_FAVORITES_PAGE } from "../../lib/environment/environment";

export async function setupFavorites(): Promise<void> {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  FavoritesModel.setupFavoritesModel(FavoritesTagModifier.getAdditionalTags);
  FavoritesView.setupFavoritesView();
  FavoritesControl.setupFavoritesControl();
  await setupSubFeatures();
  addEventListeners();
  FavoritesLoadFlow.loadAllFavorites();
}

async function setupSubFeatures(): Promise<void> {
  FavoritesDownloadController.setupDownloadMenu({
    getSearchResults: () => FavoritesModel.getLatestSearchResults()
  });
  Events.favorites.downloadButtonClicked.on(FavoritesDownloadController.openDownloadMenu);
  Events.favorites.favoritesLoaded.on(FavoritesDownloadController.enableDownloadMenu);

  await FavoritesTagModifier.setupFavoritesTagModifier({
    getSearchResults: () => FavoritesModel.getLatestSearchResults(),
    getAllFavorites: () => FavoritesModel.getAllFavorites(),
    deIndex: (favorite) => FavoritesModel.removeFromIndex([favorite]),
    reIndex: (favorite) => FavoritesModel.addToIndex([favorite])
  });
  Events.favorites.searchResultsUpdated.on(FavoritesTagModifier.unselectAll);
  Events.favorites.pageChanged.on(FavoritesTagModifier.highlightSelectedThumbsOnPageChange);
  DomEvents.document.click.on(FavoritesTagModifier.handleDocumentClick);
}

function addEventListeners(): void {
  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.findFavoriteStarted.on(FavoritesPresentationFlow.reveal);
  Events.favorites.findFavoriteInAllStarted.on(FavoritesSearchFlow.revealFavoriteInAll);

  Events.favorites.pageSelected.on(FavoritesPaginationFlow.goToPage);
  Events.favorites.relativePageSelected.on(FavoritesPaginationFlow.goToRelativePage);

  Events.favorites.infiniteScrollToggled.on(FavoritesOptionsFlow.toggleInfiniteScroll);
  Events.favorites.blacklistToggled.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.layoutChanged.on(FavoritesView.changeLayout);
  Events.favorites.sortAscendingToggled.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.sortingMethodChanged.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.allowedRatingsChanged.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.resultsPerPageChanged.on(FavoritesOptionsFlow.setResultsPerPage);

  Events.favorites.setActiveFavoritesClicked.on(FavoritesModel.setActiveFavorites);
  Events.favorites.resetActiveFavoritesClicked.on(FavoritesModel.resetActiveFavorites);
  Events.favorites.resetButtonClicked.on(FavoritesResetFlow.attemptReset);
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteFavorite);

  Events.gallery.showOnHoverOverridden.on(FavoritesView.syncShowOnHoverFromGallery);
  Events.gallery.favoriteToggled.on(FavoritesInterFeatureFlow.swapFavoriteButton);

  FeatureBridge.navigateToAdjacentFavoritesPage.register(FavoritesPresentationFlow.presentWhileNavigatingGallery);
  FeatureBridge.favoritesSearchResults.register(FavoritesModel.getLatestSearchResults);
  FeatureBridge.getFavorite.register(FavoritesModel.getFavorite);
  FeatureBridge.allFavorites.register(FavoritesModel.getAllFavorites);
}
