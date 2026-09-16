import * as TagCategoryStore from "@/lib/domain/tag/category_store";
import { markActionBarFavorited, markActionBarUnfavorited } from "@/lib/ui/thumb/action_bar";
import { AppContext } from "@/app/context/context";
import { FavoritesComponents } from "@/features/favorites/types/types";
import { FavoritesControl } from "@/features/favorites/control/control";
import { FavoritesFeatures } from "@/features/favorites/features/features";
import { FavoritesFlows } from "@/features/favorites/flows/flows";
import { FavoritesModel } from "@/features/favorites/model/model";
import { FavoritesView } from "@/features/favorites/view/view";
import { createElement } from "@/utils/browser/element";
import { deferPostPageFetchesUntil } from "@/lib/remote/fetchers/html";
import { setFavoriteTagsLookup } from "@/lib/ui/thumb/tag";
import { setTooltipsEnabled } from "@/lib/ui/tooltip/tooltip";

export function startFavorites(context: AppContext): void {
  if (context.environment.onFavoritesPage) {
    const model = new FavoritesModel(context);
    const view = new FavoritesView(context);
    const flows = new FavoritesFlows(context, model, view);
    const control = new FavoritesControl(context);
    const features = new FavoritesFeatures(context);
    const components: FavoritesComponents = { context, model, view, flows, control, features };

    setup(components);
    start(components);
  } else if (context.environment.onPostListPage) {
    servePostListRequests(context, new FavoritesModel(context));
  }
}

function setup(components: FavoritesComponents): void {
  setupSubFeatures(components);
  setupView(components);
  setupControl(components);
  subscribeToEvents(components);
  subscribeToPreferences(components);
  subscribeToDomEvents(components);
  serveFavoritesPageRequests(components);
}

function start(components: FavoritesComponents): void {
  const { context, model, view, flows } = components;

  view.removeOriginalUnusedScripts();
  deferPostPageFetchesUntil(context.events.favorites.favoritesLoaded.wait());
  setFavoriteTagsLookup((id: string) => model.getFavorite(id)?.tags);
  view.showSkeleton();
  const nativeFavorites = view.takeNativeFavorites();

  flows.load.loadAllFavorites(context.environment.onFirstFavoritesPage ? nativeFavorites : undefined);
}

function setupSubFeatures({ context, model, control, features }: FavoritesComponents): void {
  features.setup({
    downloader: {
      batchSize: context.preferences.favorites.downloadBatchSize,
      filenameFormat: context.preferences.favorites.downloadFilenameFormat,
      getSearchResults: () => model.getCurrentSearchResults(),
      getTagCategory: TagCategoryStore.get,
      getTagsForIds: (ids) => model.getTagsForIds(ids)
    },
    snippets: {
      appendToSearch: (text) => control.appendToSearch(text),
      getSearchResults: () => model.getCurrentSearchResults()
    }
  });
}

function setupView({ context, view, flows, control, features }: FavoritesComponents): void {
  const { preferences, events } = context;

  view.setup({
    onPageSelected: (pageNumber) => flows.display.goToPage(pageNumber),
    onPageStepped: (direction) => flows.display.advance(direction),
    onContentReplaced: events.favorites.contentReplaced.emit,
    onContentAdded: events.favorites.contentAdded.emit,
    onDrawerOpen: () => preferences.favorites.drawerOpen.set(true),
    onDrawerViewSelected: preferences.favorites.drawerActiveView.set,
    onShowControls: events.gallery.showControlsRequested.emit,
    drawerViews: {
      settings: control.mountSettings(),
      download: features.mountDownloader(),
      snippets: features.mountSnippets(),
      tags: { mount: panel => panel.appendChild(createElement("div", { className: "favorites-drawer-placeholder", textContent: "Work in progress" })) }
    }
  });
}

function setupControl({ control }: FavoritesComponents): void {
  control.setup();
}

function subscribeToEvents({ context, model, view, flows, control }: FavoritesComponents): void {
  const { events } = context;

  events.favorites.searchButtonClicked.on((event) => control.handleSearchButtonClicked(event));
  events.favorites.clearButtonClicked.on(() => control.clearSearch());
  events.favorites.shuffleButtonClicked.on(() => flows.search.shuffleSearchResults());
  events.favorites.invertButtonClicked.on(() => flows.search.invertSearchResults());
  events.favorites.resetButtonClicked.on(() => flows.reset.reset());
  events.favorites.searchRequested.on((query) => flows.search.searchFavorites(query));
  events.postOverlay.searchForTag.on((tag) => control.runSearch(tag));
  events.postOverlay.addTagToSearch.on((tag) => control.appendToSearch(tag));
  events.postOverlay.excludeTagFromSearch.on((tag) => control.excludeFromSearch(tag));
  events.app.favoriteRemoved.on((id) => model.deleteStoredFavorite(id));
  events.app.favoriteAdded.on(markActionBarFavorited);
  events.app.favoriteRemoved.on(markActionBarUnfavorited);
  events.favorites.favoritesLoaded.on(() => view.collectAspectRatios(), { once: true });
}

function subscribeToPreferences({ context, view, flows }: FavoritesComponents): void {
  const { preferences } = context;

  preferences.favorites.drawerOpen.on((open) => view.toggleDrawer(open));
  preferences.favorites.hintsEnabled.on(setTooltipsEnabled);
  preferences.favorites.layout.on((layout) => view.changeLayout(layout));
  preferences.favorites.sortKey.on(() => flows.search.reSearchFavorites());
  preferences.favorites.sortAscending.on(() => flows.search.reSearchFavorites());
  preferences.favorites.infiniteScroll.on(() => flows.display.toggleInfiniteScroll());
  preferences.favorites.resultsPerPage.on(() => flows.display.redisplayLatestResults());
  preferences.favorites.allowedRatings.on(() => flows.search.reSearchFavorites());
  preferences.favorites.excludeBlacklist.on(() => flows.search.reSearchFavorites());
}

function subscribeToDomEvents({ context, view, flows }: FavoritesComponents): void {
  const { domEvents, environment, flags } = context;

  if (environment.onDesktopDevice) {
    if (flags.imagusSupportEnabled) {
      domEvents.document.mouseover.on((event) => view.suppressLinkOnHoveredThumb(event));
    }
    domEvents.document.click.on((event) => flows.input.handleClick(event));
    domEvents.document.mousedown.on((event) => flows.input.handleMouseDown(event));
  } else {
    domEvents.document.click.on((event) => flows.input.triggerPostAction(event));
  }
}

function serveFavoritesPageRequests({ context, model, view, flows }: FavoritesComponents): void {
  const { featureBridge, preferences } = context;

  featureBridge.favorites.advance.serve((direction) => flows.display.advance(direction));
  featureBridge.favorites.searchResults.serve(() => model.getCurrentSearchResults());
  featureBridge.favorites.getFavorite.serve((id) => model.getFavorite(id));
  featureBridge.favorites.allFavorites.serve(() => model.getAllFavorites());
  featureBridge.favorites.searchQuery.serve(() => model.getCurrentSearchQuery());
  featureBridge.favorites.usingInfiniteScroll.serve(() => preferences.favorites.infiniteScroll.value);
  featureBridge.favorites.layout.serve(() => view.getLayout());
}

function servePostListRequests(context: AppContext, model: FavoritesModel): void {
  context.featureBridge.favorites.favoriteIds.serve(() => model.loadFavoriteIds());
}
