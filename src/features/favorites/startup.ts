import * as FavoritesControl from "@/features/favorites/control/control";
import * as FavoritesFeatures from "@/features/favorites/features/features";
import * as FavoritesFlows from "@/features/favorites/flows/flows";
import * as FavoritesModel from "@/features/favorites/model/model";
import * as FavoritesView from "@/features/favorites/view/view";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE, ON_FIRST_FAVORITES_PAGE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { markActionBarFavorited, markActionBarUnfavorited } from "@/lib/thumb/action_bar";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { Preferences } from "@/app/context/preferences";
import { createElement } from "@/utils/browser/element";
import { deferPostPageFetchesUntil } from "@/lib/remote/pages";
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
  const nativeFavorites = FavoritesView.takeNativeFavorites();

  FavoritesFlows.Load.loadAllFavorites(ON_FIRST_FAVORITES_PAGE ? nativeFavorites : undefined);
}

function setupSubFeatures(): void {
  FavoritesFeatures.setup({
    downloader: {
      getSearchResults: FavoritesModel.getCurrentSearchResults,
      getTagCategory: tagName => FeatureBridge.postOverlay.tagCategory.call(tagName)
    },
    snippets: {
      appendToSearch: FavoritesControl.appendToSearch,
      getSearchResults: FavoritesModel.getCurrentSearchResults
    }
  });
}

function setupModel(): void {
  FavoritesModel.setup({
    onTagCategoriesResolved: Events.favorites.tagCategoriesResolved.emit,
    onSearchResultsChanged: Events.favorites.searchResultsUpdated.emit
  });
}

function setupView(): void {
  FavoritesView.setup({
    onPageSelected: FavoritesFlows.Display.goToPage,
    onPageStepped: FavoritesFlows.Display.advance,
    onContentReplaced: Events.favorites.contentReplaced.emit,
    onContentAdded: Events.favorites.contentAdded.emit,
    onDrawerOpen: () => Preferences.favorites.drawerOpen.set(true),
    onDrawerViewSelected: Preferences.favorites.drawerActiveView.set,
    onShowControls: Events.gallery.showControlsRequested.emit,
    drawerViews: {
      settings: FavoritesControl.mountSettings(),
      download: FavoritesFeatures.mountDownloader(),
      snippets: FavoritesFeatures.mountSnippets(),
      tags: { mount: panel => panel.appendChild(createElement("div", { className: "favorites-drawer-placeholder", textContent: "Work in progress" })) }
    }
  });
}

function setupControl(): void {
  FavoritesControl.setup();
}

function subscribeToEvents(): void {
  Events.favorites.searchButtonClicked.on(FavoritesControl.handleSearchButtonClicked);
  Events.favorites.clearButtonClicked.on(FavoritesControl.clearSearch);
  Events.favorites.shuffleButtonClicked.on(FavoritesFlows.Search.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesFlows.Search.invertSearchResults);
  Events.favorites.resetButtonClicked.on(FavoritesFlows.Reset.reset);
  Events.favorites.searchRequested.on(FavoritesFlows.Search.searchFavorites);
  Events.postOverlay.searchForTag.on(FavoritesControl.runSearch);
  Events.postOverlay.addTagToSearch.on(FavoritesControl.appendToSearch);
  Events.postOverlay.excludeTagFromSearch.on(FavoritesControl.excludeFromSearch);
  Events.app.favoriteRemoved.on(FavoritesModel.deleteStoredFavorite);
  Events.app.favoriteAdded.on(markActionBarFavorited);
  Events.app.favoriteRemoved.on(markActionBarUnfavorited);
  Events.favorites.favoritesLoaded.on(FavoritesView.collectAspectRatios, { once: true });
}

function subscribeToPreferences(): void {
  Preferences.favorites.drawerOpen.on(FavoritesView.toggleDrawer);
  Preferences.favorites.hintsEnabled.on(setTooltipsEnabled);
  Preferences.favorites.layout.on(FavoritesView.changeLayout);
  Preferences.favorites.sortKey.on(FavoritesFlows.Search.reSearchFavorites);
  Preferences.favorites.sortAscending.on(FavoritesFlows.Search.reSearchFavorites);
  Preferences.favorites.infiniteScroll.on(FavoritesFlows.Display.toggleInfiniteScroll);
  Preferences.favorites.resultsPerPage.on(FavoritesFlows.Display.redisplayLatestResults);
  Preferences.favorites.allowedRatings.on(FavoritesFlows.Search.reSearchFavorites);
  Preferences.favorites.excludeBlacklist.on(FavoritesFlows.Search.reSearchFavorites);
}

function subscribeToDomEvents(): void {
  if (ON_DESKTOP_DEVICE) {
    DomEvents.document.mouseover.on(FavoritesView.suppressLinkOnHoveredThumb);
    DomEvents.document.click.on(FavoritesFlows.Input.handleClick);
    DomEvents.document.mousedown.on(FavoritesFlows.Input.handleMouseDown);
  } else {
    DomEvents.document.click.on(FavoritesFlows.Input.triggerPostAction);
  }
}

function serveFavoritesPageRequests(): void {
  FeatureBridge.favorites.advance.serve(FavoritesFlows.Display.advance);
  FeatureBridge.favorites.searchResults.serve(FavoritesModel.getCurrentSearchResults);
  FeatureBridge.favorites.getFavorite.serve(FavoritesModel.getFavorite);
  FeatureBridge.favorites.allFavorites.serve(FavoritesModel.getAllFavorites);
  FeatureBridge.favorites.searchQuery.serve(FavoritesModel.getCurrentSearchQuery);
  FeatureBridge.favorites.usingInfiniteScroll.serve(() => Preferences.favorites.infiniteScroll.value);
}

function servePostListRequests(): void {
  FeatureBridge.favorites.favoriteIds.serve(FavoritesModel.loadFavoriteIds);
}
