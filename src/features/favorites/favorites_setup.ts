import * as FavoritesGalleryFlow from "./flow/favorites_gallery_flow";
import * as FavoritesLoadFlow from "./flow/favorites_load_flow";
import * as FavoritesModel from "./model/favorites_model";
import * as FavoritesOptionsFlow from "./flow/favorites_option_flow";
import * as FavoritesPaginationFlow from "./flow/favorites_pagination_flow";
import * as FavoritesPresentationFlow from "./flow/favorites_presentation_flow";
import * as FavoritesResetFlow from "./flow/favorites_reset_flow";
import * as FavoritesSearchFlow from "./flow/favorites_search_flow";
import * as FavoritesView from "./view/favorites_view";
import { Events } from "../../lib/communication/events";
import { FeatureBridge } from "../../lib/communication/feature_bridge";
import { ON_FAVORITES_PAGE } from "../../lib/environment/environment";

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
  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.pageSelected.on(FavoritesPaginationFlow.gotoPage);
  Events.favorites.relativePageSelected.on(FavoritesPaginationFlow.gotoRelativePage);
  Events.favorites.setActiveFavoritesClicked.on(FavoritesModel.setActiveFavorites);
  Events.favorites.resetActiveFavoritesClicked.on(FavoritesModel.resetActiveFavorites);
  Events.favorites.findFavoriteStarted.on(FavoritesPresentationFlow.reveal);
  Events.favorites.findFavoriteInAllStarted.on(FavoritesSearchFlow.revealFavoriteInAll);

  Events.favorites.infiniteScrollToggled.on(FavoritesOptionsFlow.toggleInfiniteScroll);
  Events.favorites.blacklistToggled.on(FavoritesOptionsFlow.onBlacklistChanged);
  Events.favorites.layoutChanged.on(FavoritesView.changeLayout);
  Events.favorites.sortAscendingToggled.on(FavoritesOptionsFlow.researchFavorites);
  Events.favorites.sortingMethodChanged.on(FavoritesOptionsFlow.researchFavorites);
  Events.favorites.allowedRatingsChanged.on(FavoritesOptionsFlow.researchFavorites);
  Events.favorites.resultsPerPageChanged.on(FavoritesOptionsFlow.setResultsPerPage);

  Events.favorites.resetButtonClicked.on(FavoritesView.tryResetting);
  Events.favorites.resetConfirmed.on(FavoritesResetFlow.resetFavorites);
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteFavorite);

  Events.gallery.showOnHoverOverridden.on(FavoritesView.syncShowOnHoverFromGallery);
  Events.gallery.favoriteToggled.on(FavoritesGalleryFlow.swapFavoriteButton);
  Events.tagModifier.resetConfirmed.on(FavoritesModel.resetTagModifications);

  FeatureBridge.moreFavoritesPagesExist.register(FavoritesPresentationFlow.presentWhileNavigatingGallery);
  FeatureBridge.favoritesSearchResults.register(FavoritesModel.getLatestSearchResults);
  FeatureBridge.allFavorites.register(FavoritesModel.getFavorite);
  FeatureBridge.setCustomTags.register(FavoritesModel.setCustomTags);
}
