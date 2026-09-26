import * as TagCategoryStore from "@/lib/domain/tag/category_store";
import { FavoritesFeatures, FavoritesFeaturesDependencies } from "@/features/favorites/features/features";
import { AppContext } from "@/app/context/context";
import { FavoritesControl } from "@/features/favorites/control/control";
import { FavoritesFlows } from "@/features/favorites/flows/flows";
import { FavoritesModel } from "@/features/favorites/model/model";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { FavoritesView } from "@/features/favorites/view/view";
import { createElement } from "@/utils/browser/element";
import { deferPostPageFetchesUntil } from "@/lib/remote/fetchers/html";
import { setFavoriteTagsLookup } from "@/lib/ui/thumb/tag";
import { setTooltipsEnabled } from "@/lib/ui/tooltip/tooltip";

interface FavoritesComponents {
  context: AppContext;
  shell: FavoritesShell;
  model: FavoritesModel;
  view: FavoritesView;
  flows: FavoritesFlows;
  control: FavoritesControl;
  features: FavoritesFeatures;
}

export function startFavorites(context: AppContext): void {
  if (context.environment.onFavoritesPage) {
    const shell = new FavoritesShell(context.shell, context.environment);
    const model = new FavoritesModel(context, context.events.favorites.searchResultsUpdated.emit);
    const view = new FavoritesView(context, shell);
    const control = new FavoritesControl(context, shell);
    const features = new FavoritesFeatures(context, featureDependencies(context, model, control));
    const flows = new FavoritesFlows(context, model, view, control);
    const components: FavoritesComponents = { context, shell, model, view, flows, control, features };

    setup(components);
    start(components);
  } else if (context.environment.onPostListPage) {
    servePostListRequests(context, new FavoritesModel(context, context.events.favorites.searchResultsUpdated.emit));
  }
}

function setup(components: FavoritesComponents): void {
  setupSubFeatures(components);
  setupView(components);
  mountDrawerViews(components);
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

function featureDependencies(context: AppContext, model: FavoritesModel, control: FavoritesControl): FavoritesFeaturesDependencies {
  return {
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
  };
}

function setupSubFeatures({ features }: FavoritesComponents): void {
  features.setup();
}

function setupView({ context, view }: FavoritesComponents): void {
  const { events } = context;

  view.setup({
    onContentReplaced: events.favorites.contentReplaced.emit,
    onContentAdded: events.favorites.contentAdded.emit
  });
}

function mountDrawerViews({ control, features }: FavoritesComponents): void {
  control.mountDrawerViews({
    download: features.mountDownloader(),
    snippets: features.mountSnippets(),
    tags: { mount: panel => panel.appendChild(createElement("div", { className: "favorites-drawer-placeholder", textContent: "Work in progress" })) }
  });
}

function subscribeToEvents({ context, view, flows, control }: FavoritesComponents): void {
  const { events } = context;

  events.favorites.searchButtonClicked.on((event) => control.handleSearchButtonClicked(event));
  events.favorites.clearButtonClicked.on(() => control.clearSearch());
  events.favorites.shuffleButtonClicked.on(() => flows.search.shuffleSearchResults());
  events.favorites.invertButtonClicked.on(() => flows.search.invertSearchResults());
  events.favorites.scratchButtonClicked.on(() => flows.scratch.excludeMostFrequentTags());
  events.favorites.resetButtonClicked.on(() => flows.reset.reset());
  events.favorites.searchRequested.on((query) => flows.search.searchFavorites(query));
  events.favorites.pageSelected.on((pageNumber) => flows.display.goToPage(pageNumber));
  events.favorites.pageStepped.on((direction) => flows.display.advance(direction));
  events.favorites.gotoPageToggled.on(() => flows.input.toggleGotoPage());
  events.favorites.gotoPageSubmitted.on((pageNumber) => flows.input.submitGotoPage(pageNumber));
  events.postOverlay.searchForTag.on((tag) => control.runSearch(tag));
  events.postOverlay.addTagToSearch.on((tag) => control.appendToSearch(tag));
  events.postOverlay.excludeTagFromSearch.on((tag) => control.excludeFromSearch(tag));
  events.app.favoriteAdded.on((id) => view.setFavorited(id, true));
  events.app.favoriteRemoved.on((id) => flows.favoriter.handleFavoriteRemoved(id));
  events.favorites.favoritesLoaded.on(() => view.collectAspectRatios(), { once: true });
}

function subscribeToPreferences({ context, view, flows }: FavoritesComponents): void {
  const { preferences } = context;

  preferences.favorites.drawerOpen.on((open) => view.toggleDrawer(open));
  preferences.favorites.drawerActiveView.on((drawerView) => view.showDrawerView(drawerView));
  preferences.favorites.hintsEnabled.on(setTooltipsEnabled);
  preferences.favorites.layout.on((layout) => view.changeLayout(layout));
  preferences.favorites.sortKey.on(() => flows.search.reSearchFavorites());
  preferences.favorites.sortAscending.on(() => flows.search.reSearchFavorites());
  preferences.favorites.infiniteScroll.on(() => flows.display.toggleInfiniteScroll());
  preferences.favorites.resultsPerPage.on(() => flows.display.redisplayLatestResults());
  preferences.favorites.allowedRatings.on(() => flows.search.reSearchFavorites());
  preferences.favorites.excludeBlacklist.on(() => flows.search.reSearchFavorites());
}

function subscribeToDomEvents(components: FavoritesComponents): void {
  const { environment } = components.context;

  if (environment.onDesktopDevice) {
    subscribeToDesktopInput(components);
  } else {
    subscribeToMobileInput(components);
  }
}

function subscribeToDesktopInput({ context, view, flows }: FavoritesComponents): void {
  const { domEvents, flags } = context;

  if (flags.imagusSupportEnabled) {
    domEvents.document.mouseover.on((event) => view.suppressLinkOnHoveredThumb(event));
  }
  domEvents.document.click.on((event) => flows.input.handleClick(event));
  domEvents.document.mousedown.on((event) => flows.input.handleMouseDown(event));
}

function subscribeToMobileInput({ context, flows }: FavoritesComponents): void {
  context.domEvents.document.click.on((event) => flows.input.triggerPostAction(event));
}

function serveFavoritesPageRequests({ context, shell, model, view, flows }: FavoritesComponents): void {
  const { featureBridge, preferences } = context;

  featureBridge.favorites.advance.serve((direction) => flows.display.advance(direction));
  featureBridge.favorites.searchResults.serve(() => model.getCurrentSearchResults());
  featureBridge.favorites.searchQuery.serve(() => model.getCurrentSearchQuery());
  featureBridge.favorites.toolbar.serve(() => shell.toolbar);
  featureBridge.favorites.usingInfiniteScroll.serve(() => preferences.favorites.infiniteScroll.value);
  featureBridge.favorites.layout.serve(() => view.getLayout());
  featureBridge.favorites.favorite.serve((id) => model.getFavorite(id));
}

function servePostListRequests(context: AppContext, model: FavoritesModel): void {
  context.featureBridge.favorites.favoriteIds.serve(() => model.loadFavoriteIds());
}
