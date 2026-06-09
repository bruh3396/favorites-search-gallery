import * as FavoritesDesktop from "@/features/favorites/control/menu/desktop";
import * as FavoritesFinder from "@/features/favorites/control/menu/finder";
import * as FavoritesKeyFlow from "@/features/favorites/flows/key_flow";
import * as FavoritesLoadFlow from "@/features/favorites/flows/load_flow";
import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesNavigationButtons from "@/features/favorites/control/navigation_buttons";
import * as FavoritesOptionsFlow from "@/features/favorites/flows/option_flow";
import * as FavoritesPaginationFlow from "@/features/favorites/flows/paginated_results_flow";
import * as FavoritesRatingFilter from "@/features/favorites/control/menu/rating_filter";
import * as FavoritesResetFlow from "@/features/favorites/flows/reset_flow";
import * as FavoritesResultsFlow from "@/features/favorites/flows/results_flow";
import * as FavoritesSearchBox from "@/features/favorites/control/search_box/search_box";
import * as FavoritesSearchFlow from "@/features/favorites/flows/search_flow";
import * as FavoritesTagEditor from "@/features/favorites/features/tag_editor/tag_editor";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE } from "@/lib/environment";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { POST_LIST_PAGE_ENABLED } from "@/app/context/flags";
import { Preferences } from "@/app/context/preferences";
import { deferPostPageFetchesUntil } from "@/lib/remote/rule34/posts/page";
import { setFavoriteTagsLookup } from "@/lib/thumb/thumb_tags";

export function setupFavorites(): void {
  if (POST_LIST_PAGE_ENABLED) {
    registerPostListBridgeHandlers();
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
  deferPostPageFetchesUntil(Events.favorites.favoritesLoaded.wait());
  FavoritesView.showSkeleton();
  FavoritesLoadFlow.loadAllFavorites();
}

function setupModel(): void {
  FavoritesModel.setup({
    getAdditionalTags: FavoritesTagEditor.getAdditionalTags,
    waitForAdditionalTags: FavoritesTagEditor.ensureTagModificationsLoaded,
    onTagCategoriesResolved: Events.favorites.tagCategoriesResolved.emit
  });
}

function setupView(): void {
  FavoritesView.setup({
    onPageSelected: Events.favorites.pageSelected.emit,
    onPageStepped: Events.favorites.pageStepped.emit,
    onFirstPageFavoritesExtracted: Events.favorites.firstPageFavorites.emit,
    onFavoriteAdded: Events.favorites.favoriteAdded.emit,
    onFavoriteRemoved: Events.favorites.favoriteRemoved.emit
  });
}

function setupControl(): void {
  FavoritesNavigationButtons.setup();
  FavoritesFinder.setup();
  FavoritesRatingFilter.setup();
  FavoritesSearchBox.setup();

  if (ON_DESKTOP_DEVICE) {
    FavoritesDesktop.setup();
  }
}

function setupSubFeatures(): void {
  setupTagEditor();
}

function setupTagEditor(): void {
  // FavoritesTagEditor.setup({
  //   getSearchResults: () => FavoritesModel.getCurrentSearchResults(),
  //   getAllFavorites: () => FavoritesModel.getAllFavorites(),
  //   deIndex: (favorite) => FavoritesModel.deIndex([favorite]),
  //   reIndex: (favorite) => FavoritesModel.reIndex([favorite])
  // });
  Events.favorites.searchResultsUpdated.on(FavoritesTagEditor.onResultsUpdated);
  Events.favorites.pageChanged.on(FavoritesTagEditor.onPageChanged);
  DomEvents.document.click.on(FavoritesTagEditor.onDocumentClick);
}

function subscribeToEvents(): void {
  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchActiveFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.findFavorite.on(FavoritesResultsFlow.reveal);
  Events.favorites.findFavoriteInAll.on(FavoritesSearchFlow.revealFavoriteInAll);

  Events.favorites.pageSelected.on(FavoritesPaginationFlow.goToPage);
  Events.favorites.pageStepped.on(FavoritesPaginationFlow.stepPage);

  Events.favorites.infiniteScrollToggled.on(FavoritesOptionsFlow.toggleInfiniteScroll);
  Events.favorites.blacklistToggled.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.layoutChanged.on(FavoritesView.changeLayout);
  Events.favorites.sortAscendingToggled.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.sortMethodChanged.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.allowedRatingsChanged.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.resultsPerPageChanged.on(FavoritesSearchFlow.showLatestSearchResults);

  Events.favorites.setActiveFavoritesClicked.on(FavoritesModel.setActiveFavorites);
  Events.favorites.resetActiveFavoritesClicked.on(FavoritesModel.resetActiveFavorites);
  Events.favorites.resetButtonClicked.on(FavoritesResetFlow.attemptReset);
  Events.favorites.panelButtonClicked.on(FavoritesView.toggleDrawer);
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteId);

  Events.gallery.previewOverridden.on(FavoritesView.syncShowOnHoverFromGallery);
  DomEvents.document.keydown.on(FavoritesKeyFlow.onKeyDown);
}

function registerPostListBridgeHandlers(): void {
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
  FeatureBridge.usingInfiniteScroll.register(() => Preferences.favoritesInfiniteScroll.value);
}
