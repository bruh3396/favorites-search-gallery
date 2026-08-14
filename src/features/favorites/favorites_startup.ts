import * as FavoritesDisplayFlow from "@/features/favorites/flows/display_flow";
import * as FavoritesDownloader from "@/features/favorites/features/downloader/downloader";
import * as FavoritesKeyFlow from "@/features/favorites/flows/key_flow";
import * as FavoritesLoadFlow from "@/features/favorites/flows/load_flow";
import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesMouseFlow from "@/features/favorites/flows/mouse_flow";
import * as FavoritesResetFlow from "@/features/favorites/flows/reset_flow";
import * as FavoritesSearchBox from "@/features/favorites/control/favorites_search_box";
import * as FavoritesSearchFlow from "@/features/favorites/flows/search_flow";
import * as FavoritesSettings from "@/features/favorites/control/desktop/settings/settings";
import * as FavoritesSnippets from "@/features/favorites/features/snippets/snippets";
import * as FavoritesToolbar from "@/features/favorites/control/desktop/toolbar";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { Preferences } from "@/app/context/preferences";
import { deferPostPageFetchesUntil } from "@/lib/remote/rule34/posts/page";
import { setFavoriteTagsLookup } from "@/lib/thumb/tag";
import { setTooltipsEnabled } from "@/lib/ui/tooltip/tooltip";

export function startFavorites(): void {
  if (ON_FAVORITES_PAGE) {
    setup();
    start();
  } else if (ON_POST_LIST_PAGE) {
    servePostListRequests();
  }
}

function setup(): void {
  setupSubFeatures();
  setupModel();
  setupView();
  setupControl();
  subscribeToEvents();
  subscribeToPreferences();
  subscribeToDomEvents();
  serveFavoritesPageRequests();
  setFavoriteTagsLookup(FavoritesModel.getFavoriteTags);
}

function start(): void {
  FavoritesView.removeOriginalUnusedScripts();
  deferPostPageFetchesUntil(Events.favorites.favoritesLoaded.wait());
  FavoritesView.showSkeleton();
  FavoritesLoadFlow.loadAllFavorites(FavoritesView.firstPageFavorites());
}

function setupModel(): void {
  FavoritesModel.setup({
    getAddedTags: () => undefined,
    waitForAddedTags: () => Promise.resolve(),
    onTagCategoriesResolved: Events.favorites.tagCategoriesResolved.emit,
    onSearchResultsChanged: Events.favorites.searchResultsUpdated.emit
  });
}

function setupView(): void {
  FavoritesView.setup({
    onPageSelected: FavoritesDisplayFlow.goToPage,
    onPageStepped: FavoritesDisplayFlow.advance,
    onContentReplaced: Events.favorites.contentReplaced.emit,
    onContentAdded: Events.favorites.contentAdded.emit,
    onDrawerOpen: () => Preferences.favorites.drawerOpen.set(true),
    onDrawerViewSelected: Preferences.favorites.drawerActiveView.set,
    drawerViews: {
      settings: FavoritesSettings.mount(),
      download: FavoritesDownloader.mount(),
      snippets: FavoritesSnippets.mount()
    }
  });
}

function setupControl(): void {
  FavoritesSearchBox.setup();

  if (ON_DESKTOP_DEVICE) {
    FavoritesToolbar.setup();
  }
}

function setupSubFeatures(): void {
  setupDownloader();
  setupSnippets();
}

function setupSnippets(): void {
  FavoritesSnippets.setup({
    appendToSearch: FavoritesSearchBox.append,
    getSearchResults: FavoritesModel.getCurrentSearchResults
  });
}

function setupDownloader(): void {
  FavoritesDownloader.setup({
    getSearchResults: FavoritesModel.getCurrentSearchResults,
    getTagCategory: tagName => FeatureBridge.postOverlay.tagCategory.call(tagName)
  });
  Events.favorites.favoritesLoaded.on(FavoritesDownloader.enable);
  Events.favorites.searchResultsUpdated.on(FavoritesDownloader.reRender);
  Preferences.favorites.downloadBatchSize.on(FavoritesDownloader.reRender);
  Preferences.favorites.downloadFilenameFormat.on(FavoritesDownloader.reRender);
}

function subscribeToEvents(): void {
  Events.favorites.searchButtonClicked.on(FavoritesSearchBox.handleSearchButtonClicked);
  Events.favorites.clearButtonClicked.on(FavoritesSearchBox.clear);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.resetButtonClicked.on(FavoritesResetFlow.reset);
  Events.favorites.setSearchScopeButtonClicked.on(FavoritesModel.setSearchScopeToCurrentResults);
  Events.favorites.clearSearchScopeButtonClicked.on(FavoritesModel.clearSearchScope);
  Events.favorites.searchRequested.on(FavoritesSearchFlow.searchFavorites);
  Events.postOverlay.searchForTag.on(FavoritesSearchBox.search);
  Events.postOverlay.addTagToSearch.on(FavoritesSearchBox.append);
  Events.postOverlay.excludeTagFromSearch.on(FavoritesSearchBox.exclude);
  Events.app.favoriteRemoved.on(FavoritesModel.deleteStoredFavorite);
  Events.app.hotkeyPressed.on(FavoritesKeyFlow.handleHotkey);
}

function subscribeToPreferences(): void {
  Preferences.favorites.drawerOpen.on(FavoritesView.toggleDrawer);
  Preferences.favorites.hintsEnabled.on(setTooltipsEnabled);
  Preferences.favorites.layout.on(FavoritesView.changeLayout);
  Preferences.favorites.sortKey.on(FavoritesSearchFlow.reSearchFavorites);
  Preferences.favorites.sortAscending.on(FavoritesSearchFlow.reSearchFavorites);
  Preferences.favorites.infiniteScroll.on(FavoritesDisplayFlow.toggleInfiniteScroll);
  Preferences.favorites.resultsPerPage.on(FavoritesDisplayFlow.redisplayLatestResults);
  Preferences.favorites.allowedRatings.on(FavoritesSearchFlow.reSearchFavorites);
  Preferences.favorites.excludeBlacklist.on(FavoritesSearchFlow.reSearchFavorites);
}

function subscribeToDomEvents(): void {
  if (ON_DESKTOP_DEVICE) {
    DomEvents.document.mouseover.on(FavoritesMouseFlow.suppressLinkOnHoveredThumb);
    DomEvents.document.click.on(FavoritesMouseFlow.handleClick);
    DomEvents.document.mousedown.on(FavoritesMouseFlow.handleMouseDown);
  }
}

function serveFavoritesPageRequests(): void {
  FeatureBridge.favorites.advance.register(FavoritesDisplayFlow.advance);
  FeatureBridge.favorites.searchResults.register(FavoritesModel.getCurrentSearchResults);
  FeatureBridge.favorites.getFavorite.register(FavoritesModel.getFavorite);
  FeatureBridge.favorites.allFavorites.register(FavoritesModel.getAllFavorites);
  FeatureBridge.favorites.searchQuery.register(FavoritesModel.getCurrentSearchQuery);
  FeatureBridge.favorites.usingInfiniteScroll.register(() => Preferences.favorites.infiniteScroll.value);
}

function servePostListRequests(): void {
  FeatureBridge.favorites.favoriteIds.register(FavoritesModel.loadFavoriteIds);
}
