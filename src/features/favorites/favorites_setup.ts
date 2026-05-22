import * as FavoritesDesktop from "./control/menu/desktop";
import * as FavoritesDownloadMenu from "./features/downloader/menu";
import * as FavoritesFinder from "./control/menu/finder";
import * as FavoritesInterFeatureFlow from "./flows/inter_feature_flow";
import * as FavoritesLoadFlow from "./flows/load_flow";
import * as FavoritesMobile from "./control/menu/mobile";
import * as FavoritesModel from "./model/favorites_model";
import * as FavoritesNavigationButtons from "./control/navigation_buttons";
import * as FavoritesOptionsFlow from "./flows/option_flow";
import * as FavoritesPaginationFlow from "./flows/paginated_results_flow";
import * as FavoritesRatingFilter from "./control/menu/rating_filter";
import * as FavoritesResetFlow from "./flows/reset_flow";
import * as FavoritesResultsFlow from "./flows/results_flow";
import * as FavoritesSearchBox from "./control/search_box/search_box";
import * as FavoritesSearchFlow from "./flows/search_flow";
import * as FavoritesTagModifier from "./features/tag_modifier/tag_modifier";
import * as FavoritesView from "./view/favorites_view";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE } from "../../lib/environment/environment";
import { DomEvents } from "../../app/input/dom_events";
import { Events } from "../../app/messaging/events";
import { FeatureBridge } from "../../app/messaging/feature_bridge";
import { Preferences } from "../../app/state/preferences";
import { deferPostPageFetchesUntil } from "../../lib/remote/api/post_fetcher";
import { setFavoriteTagsLookup } from "../../lib/thumb/thumb_tags";

export function setupFavorites(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  setupModel();
  setupView();
  setupControl();
  setupSubFeatures();
  subscribeToEvents();
  registerBridgeHandlers();
  deferPostPageFetchesUntil(Events.favorites.favoritesLoaded.wait());
  FavoritesLoadFlow.loadAllFavorites();
}

function setupModel(): void {
  FavoritesModel.setup(FavoritesTagModifier.getAdditionalTags, FavoritesTagModifier.ensureTagModificationsLoaded);
}

function setupView(): void {
  FavoritesView.setup({
    onPageSelected: Events.favorites.pageSelected.emit,
    onRelativePageSelected: Events.favorites.relativePageSelected.emit
  });
}

function setupControl(): void {
  FavoritesNavigationButtons.setup();
  FavoritesFinder.setup();
  FavoritesRatingFilter.setup();
  FavoritesSearchBox.setup();

  if (ON_DESKTOP_DEVICE) {
    FavoritesDesktop.setup();
  } else {
    FavoritesMobile.setup();
  }
}

function setupSubFeatures(): void {
  setupDownloader();
  setupTagModifier();
}

function setupDownloader(): void {
  FavoritesDownloadMenu.setup({
    getSearchResults: () => FavoritesModel.getCurrentSearchResults()
  });
  Events.favorites.downloadButtonClicked.on(FavoritesDownloadMenu.openDownloadMenu);
  Events.favorites.favoritesLoaded.on(FavoritesDownloadMenu.enableDownloadMenu);
}

function setupTagModifier(): void {
  FavoritesTagModifier.setup({
    getSearchResults: () => FavoritesModel.getCurrentSearchResults(),
    getAllFavorites: () => FavoritesModel.getAllFavorites(),
    deIndex: (favorite) => FavoritesModel.removeFromIndex([favorite]),
    reIndex: (favorite) => FavoritesModel.addToIndex([favorite])
  });
  Events.favorites.searchResultsUpdated.on(FavoritesTagModifier.onResultsUpdated);
  Events.favorites.pageChanged.on(FavoritesTagModifier.onPageChanged);
  DomEvents.document.click.on(FavoritesTagModifier.onDocumentClick);
}

function subscribeToEvents(): void {
  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.findFavorite.on(FavoritesResultsFlow.reveal);
  Events.favorites.findFavoriteInAll.on(FavoritesSearchFlow.revealFavoriteInAll);
  Events.favorites.favoritesLoaded.on(FavoritesView.collectAspectRatios, { once: true });

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
}

function registerBridgeHandlers(): void {
  FeatureBridge.loadMoreFavorites.register(FavoritesResultsFlow.loadMoreResults);
  FeatureBridge.favoritesCanExtend.register(FavoritesResultsFlow.hasMoreResults);
  FeatureBridge.favoritesSearchResults.register(FavoritesModel.getCurrentSearchResults);
  FeatureBridge.getFavorite.register(FavoritesModel.getFavorite);
  setFavoriteTagsLookup(id => FavoritesModel.getFavorite(id)?.tags);
  FeatureBridge.allFavorites.register(FavoritesModel.getAllFavorites);
  FeatureBridge.currentSearchQuery.register(FavoritesModel.getCurrentSearchQuery);
  FeatureBridge.usingInfiniteScroll.register(() => Preferences.infiniteScroll.value);
}
