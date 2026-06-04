import * as FavoritesDesktop from "@/features/favorites/control/menu/desktop";
import * as FavoritesDownloadMenu from "@/features/favorites/features/downloader/menu";
import * as FavoritesFinder from "@/features/favorites/control/menu/finder";
import * as FavoritesInterFeatureFlow from "@/features/favorites/flows/inter_feature_flow";
import * as FavoritesLoadFlow from "@/features/favorites/flows/load_flow";
import * as FavoritesMobile from "@/features/favorites/control/menu/mobile";
import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesNavigationButtons from "@/features/favorites/control/navigation_buttons";
import * as FavoritesOptionsFlow from "@/features/favorites/flows/option_flow";
import * as FavoritesPaginationFlow from "@/features/favorites/flows/paginated_results_flow";
import * as FavoritesRatingFilter from "@/features/favorites/control/menu/rating_filter";
import * as FavoritesResetFlow from "@/features/favorites/flows/reset_flow";
import * as FavoritesResultsFlow from "@/features/favorites/flows/results_flow";
import * as FavoritesSearchBox from "@/features/favorites/control/search_box/search_box";
import * as FavoritesSearchFlow from "@/features/favorites/flows/search_flow";
import * as FavoritesTagModifier from "@/features/favorites/features/tag_modifier/tag_modifier";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import * as PostApi from "@/lib/remote/api/post_fetcher";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE } from "@/lib/environment";
import { DomEvents } from "@/app/input/dom_events";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { Preferences } from "@/app/context/preferences";
import { SEARCH_PAGE_ENABLED } from "@/app/context/flags";
import { setFavoriteTagsLookup } from "@/lib/thumb/thumb_tags";

export function setupFavorites(): void {
  if (SEARCH_PAGE_ENABLED) {
    registerSearchPageBridgeHandlers();
    return;
  }

  if (!ON_FAVORITES_PAGE) {
    return;
  }
  setupModel();
  setupView();
  setupControl();
  setupSubFeatures();
  subscribeToEvents();
  registerBridgeHandlers();
  PostApi.deferPostPageFetchesUntil(Events.favorites.favoritesLoaded.wait());
  FavoritesLoadFlow.loadAllFavorites();
}

function setupModel(): void {
  FavoritesModel.setup(FavoritesTagModifier.getAdditionalTags, FavoritesTagModifier.ensureTagModificationsLoaded);
}

function setupView(): void {
  FavoritesView.setup({
    onPageSelected: Events.favorites.pageSelected.emit,
    onRelativePageSelected: Events.favorites.relativePageSelected.emit,
    onFirstPageFavoritesExtracted: Events.favorites.firstPageFavorites.emit
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
    deIndex: (favorite) => FavoritesModel.deIndex([favorite]),
    reIndex: (favorite) => FavoritesModel.reIndex([favorite])
  });
  Events.favorites.searchResultsUpdated.on(FavoritesTagModifier.onResultsUpdated);
  Events.favorites.pageChanged.on(FavoritesTagModifier.onPageChanged);
  DomEvents.document.click.on(FavoritesTagModifier.onDocumentClick);
}

function subscribeToEvents(): void {
  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchActiveFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.findFavorite.on(FavoritesResultsFlow.reveal);
  Events.favorites.findFavoriteInAll.on(FavoritesSearchFlow.revealFavoriteInAll);

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
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteId);
  Events.favorites.favoriteAdded.on(FavoritesInterFeatureFlow.swapFavoriteButton);
  Events.favorites.favoriteRemoved.on(FavoritesInterFeatureFlow.swapFavoriteButton);

  Events.gallery.showOnHoverOverridden.on(FavoritesView.syncShowOnHoverFromGallery);
}

function registerSearchPageBridgeHandlers(): void {
  FeatureBridge.favoriteIds.register(FavoritesModel.loadFavoriteIds);
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
