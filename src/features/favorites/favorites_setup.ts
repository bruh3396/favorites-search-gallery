import * as FavoritesBottomNavigationButtons from "./control/components/favorites_bottom_navigation_buttons";
import * as FavoritesDesktopDynamicElements from "./control/components/favorites_desktop_dynamic_elements";
import * as FavoritesFinder from "./control/components/favorites_finder";
import * as FavoritesInterFeatureFlow from "./flow/favorites_inter_feature_flow";
import * as FavoritesLoadFlow from "./flow/favorites_load_flow";
import * as FavoritesMobileDynamicElements from "./control/components/favorites_mobile_dynamic_elements";
import * as FavoritesModel from "./model/favorites_model";
import * as FavoritesOptionsFlow from "./flow/favorites_option_flow";
import * as FavoritesPaginationFlow from "./flow/favorites_pagination_flow";
import * as FavoritesPresentationFlow from "./flow/favorites_presentation_flow";
import * as FavoritesRatingFilter from "./control/components/favorites_rating_filter";
import * as FavoritesResetFlow from "./flow/favorites_reset_flow";
import * as FavoritesSearchBox from "./control/search_box/favorites_search_box";
import * as FavoritesSearchFlow from "./flow/favorites_search_flow";
import * as FavoritesView from "./view/favorites_view";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE } from "../../lib/environment/environment";
import { Events } from "../../lib/communication/events";
import { FeatureQueries } from "../../lib/communication/feature_queries";

export function setupFavorites(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  addEventListeners();
  FavoritesModel.setupFavoritesModel();
  FavoritesView.setupFavoritesView();
  setupControls();
  FavoritesLoadFlow.loadAllFavorites();
}

function setupControls(): void {
  FavoritesBottomNavigationButtons.setupFavoritesBottomNavigationButtons();
  FavoritesFinder.setupFavoritesFinder();
  FavoritesRatingFilter.setupFavoritesRatingFilter();
  FavoritesSearchBox.setupFavoritesSearchBox();

  if (ON_DESKTOP_DEVICE) {
    FavoritesDesktopDynamicElements.buildFavoritesDesktopMenuElements();
  } else {
    FavoritesMobileDynamicElements.buildFavoritesMobileMenuElements();
  }
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
  Events.favorites.blacklistToggled.on(FavoritesOptionsFlow.onBlacklistChanged);
  Events.favorites.layoutChanged.on(FavoritesView.changeLayout);
  Events.favorites.sortAscendingToggled.on(FavoritesOptionsFlow.researchFavorites);
  Events.favorites.sortingMethodChanged.on(FavoritesOptionsFlow.researchFavorites);
  Events.favorites.allowedRatingsChanged.on(FavoritesOptionsFlow.researchFavorites);
  Events.favorites.resultsPerPageChanged.on(FavoritesOptionsFlow.setResultsPerPage);
  Events.favorites.setActiveFavoritesClicked.on(FavoritesModel.setActiveFavorites);
  Events.favorites.resetActiveFavoritesClicked.on(FavoritesModel.resetActiveFavorites);

  Events.favorites.resetButtonClicked.on(FavoritesView.tryResetting);
  Events.favorites.resetConfirmed.on(FavoritesResetFlow.resetFavorites);
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteFavorite);

  Events.gallery.showOnHoverOverridden.on(FavoritesView.syncShowOnHoverFromGallery);
  Events.gallery.favoriteToggled.on(FavoritesInterFeatureFlow.swapFavoriteButton);
  Events.tagModifier.needsReIndex.on(FavoritesInterFeatureFlow.addToIndex);
  Events.tagModifier.needsDeIndex.on(FavoritesInterFeatureFlow.removeFromIndex);

  FeatureQueries.moreFavoritesPagesExist.register(FavoritesPresentationFlow.presentWhileNavigatingGallery);
  FeatureQueries.favoritesSearchResults.register(FavoritesModel.getLatestSearchResults);
  FeatureQueries.getFavorite.register(FavoritesModel.getFavorite);
  FeatureQueries.allFavorites.register(FavoritesModel.getAllFavorites);
}
