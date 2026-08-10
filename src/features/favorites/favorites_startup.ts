import * as FavoritesDownloader from "@/features/favorites/features/downloader/downloader";
import * as FavoritesFinder from "@/features/favorites/control/desktop/finder";
import * as FavoritesKeyFlow from "@/features/favorites/flows/key_flow";
import * as FavoritesLoadFlow from "@/features/favorites/flows/load_flow";
import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesMouseFlow from "@/features/favorites/flows/mouse_flow";
import * as FavoritesOptionsFlow from "@/features/favorites/flows/option_flow";
import * as FavoritesPaginationFlow from "@/features/favorites/flows/paginated_results_flow";
import * as FavoritesResetFlow from "@/features/favorites/flows/reset_flow";
import * as FavoritesResultsFlow from "@/features/favorites/flows/results_flow";
import * as FavoritesSearchBox from "@/features/favorites/control/favorites_search_box";
import * as FavoritesSearchFlow from "@/features/favorites/flows/search_flow";
import * as FavoritesSettings from "@/features/favorites/control/desktop/settings/settings";
import * as FavoritesSnippets from "@/features/favorites/features/snippets/snippets";
import * as FavoritesTagEditor from "@/features/favorites/features/tag_editor/tag_editor";
import * as FavoritesToolbar from "@/features/favorites/control/desktop/toolbar";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE } from "@/lib/environment";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { POST_LIST_PAGE_ENABLED } from "@/app/context/flags";
import { Preferences } from "@/app/context/preferences";
import { deferPostPageFetchesUntil } from "@/lib/remote/rule34/posts/page";
import { setFavoriteTagsLookup } from "@/lib/thumb/tag";
import { setTooltipsEnabled } from "@/lib/ui/tooltip/tooltip";

export function startFavorites(): void {
  if (POST_LIST_PAGE_ENABLED) {
    servePostListRequests();
    return;
  }

  if (ON_FAVORITES_PAGE) {
    setup();
    start();
  }
}

function setup(): void {
  setupSubFeatures();
  setupModel();
  setupView();
  setupControl();
  subscribeToEvents();
  serveExternalRequests();
}

function start(): void {
  FavoritesView.removeUnusedScripts();
  deferPostPageFetchesUntil(Events.favorites.favoritesLoaded.wait());
  FavoritesView.showSkeleton();
  FavoritesLoadFlow.loadAllFavorites(FavoritesView.extractNativeFavorites());
}

function setupModel(): void {
  FavoritesModel.setup({
    getAdditionalTags: FavoritesTagEditor.getAdditionalTags,
    waitForAdditionalTags: FavoritesTagEditor.ensureTagEditsLoaded,
    onTagCategoriesResolved: Events.favorites.tagCategoriesResolved.emit
  });
}

function setupView(): void {
  FavoritesView.setup({
    onPageSelected: FavoritesPaginationFlow.goToPage,
    onPageStepped: FavoritesPaginationFlow.stepPage,
    drawerViews: {
      settings: FavoritesSettings.mount(),
      download: FavoritesDownloader.mount(),
      snippets: FavoritesSnippets.mount()
    }
  });
}

function setupControl(): void {
  FavoritesFinder.setup();
  FavoritesSearchBox.setup();

  if (ON_DESKTOP_DEVICE) {
    FavoritesToolbar.setup();
  }
}

function setupSubFeatures(): void {
  setupTagEditor();
  setupDownloader();
  setupSnippets();
}

function setupSnippets(): void {
  FavoritesSnippets.setup(FavoritesSearchBox.append);
}

function setupDownloader(): void {
  FavoritesDownloader.setup({
    getItems: FavoritesModel.getCurrentSearchResults,
    getTagCategory: (tagName: string) => FeatureBridge.postOverlay.tagCategory.call(tagName)
  });
  Events.favorites.favoritesLoaded.on(FavoritesDownloader.unlock);
  Events.favorites.searchResultsUpdated.on(FavoritesDownloader.refreshCount);
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
  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchFavorites);
  Events.favorites.searchButtonClicked.on(FavoritesSearchBox.handleSearchButtonClicked);
  Events.favorites.clearButtonClicked.on(FavoritesSearchBox.clear);
  Events.postOverlay.searchForTag.on(FavoritesSearchBox.search);
  Events.postOverlay.addTagToSearch.on(FavoritesSearchBox.append);
  Events.postOverlay.excludeTagFromSearch.on(FavoritesSearchBox.exclude);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.findFavorite.on(FavoritesResultsFlow.reveal);
  Events.favorites.findFavoriteInAll.on(FavoritesSearchFlow.revealFavoriteInAll);
  Preferences.favorites.infiniteScroll.on(FavoritesOptionsFlow.toggleInfiniteScroll);
  Preferences.favorites.excludeBlacklist.on(FavoritesOptionsFlow.reSearchFavorites);
  Preferences.favorites.layout.on(FavoritesView.changeLayout);
  Preferences.favorites.sortAscending.on(FavoritesOptionsFlow.reSearchFavorites);
  Preferences.favorites.sortKey.on(FavoritesOptionsFlow.reSearchFavorites);
  Preferences.favorites.allowedRatings.on(FavoritesOptionsFlow.reSearchFavorites);
  Preferences.favorites.resultsPerPage.on(FavoritesOptionsFlow.setResultsPerPage);
  Preferences.favorites.hintsEnabled.on(setTooltipsEnabled);

  Events.favorites.setSearchScopeButtonClicked.on(FavoritesModel.setSearchScopeToCurrentResults);
  Events.favorites.clearSearchScopeButtonClicked.on(FavoritesModel.clearSearchScope);
  Events.favorites.resetButtonClicked.on(FavoritesResetFlow.attemptReset);
  Events.favorites.panelButtonClicked.on(FavoritesView.toggleDrawer);

  Events.app.favoriteRemoved.on(FavoritesModel.deleteId);
  DomEvents.document.keydown.on(FavoritesKeyFlow.onKeyDown);

  if (ON_DESKTOP_DEVICE) {
    DomEvents.document.mouseover.on(FavoritesMouseFlow.onMouseOver);
    DomEvents.document.click.on(FavoritesMouseFlow.onClick);
    DomEvents.document.mousedown.on(FavoritesMouseFlow.onMouseDown);
  }
}

function servePostListRequests(): void {
  FeatureBridge.favorites.favoriteIds.register(FavoritesModel.loadFavoriteIds);
}

function serveExternalRequests(): void {
  FeatureBridge.favorites.loadMore.register(FavoritesResultsFlow.loadMoreResults);
  FeatureBridge.favorites.searchResults.register(FavoritesModel.getCurrentSearchResults);
  FeatureBridge.favorites.getFavorite.register(FavoritesModel.getFavorite);
  setFavoriteTagsLookup(id => FavoritesModel.getFavorite(id)?.tags);
  FeatureBridge.favorites.allFavorites.register(FavoritesModel.getAllFavorites);
  FeatureBridge.favorites.searchQuery.register(FavoritesModel.getCurrentSearchQuery);
  FeatureBridge.favorites.usingInfiniteScroll.register(() => Preferences.favorites.infiniteScroll.value);
}
