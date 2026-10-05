import { AppMode, Pointer } from "@/core/boundary/environment";
import { FavoritesFeatures, FavoritesFeaturesDependencies } from "@/features/favorites/features/features";
import { AppContext } from "@/app/context/context";
import { Favorite } from "@/types/favorite";
import { FavoritesControl } from "@/features/favorites/control/control";
import { FavoritesFlows } from "@/features/favorites/flows/flows";
import { FavoritesModel } from "@/features/favorites/model/model";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { FavoritesView } from "@/features/favorites/view/view";
import { createElement } from "@/utils/browser/element";
import { doNothing } from "@/core/utils/function/function";
import { effect } from "@/core/utils/reactive/signal";

interface FavoritesComponents {
  context: AppContext;
  shell: FavoritesShell;
  model: FavoritesModel;
  view: FavoritesView;
  flows: FavoritesFlows;
  control: FavoritesControl;
  features: FavoritesFeatures;
}

const START: Record<AppMode, (context: AppContext) => void> = {
  favorites: startOnFavoritesPage,
  postList: startOnPostListPage
};

const SUBSCRIBE_TO_INPUT: Record<Pointer, (components: FavoritesComponents) => void> = {
  hover: subscribeToHoverInput,
  touch: subscribeToTouchInput
};

export function startFavorites(context: AppContext): void {
  START[context.environment.mode](context);
}

function startOnFavoritesPage(context: AppContext): void {
  const linksToPostPage = context.environment.pointer === "touch" || !context.features.has("gallery");
  const shell = new FavoritesShell({ version: context.environment.version }, context.shell);
  const view = new FavoritesView({ linksToPostPage }, { context, shell });
  const model = new FavoritesModel(context, {
    onSearchResultsChanged: context.events.favorites.searchResultsUpdated.emit,
    onPlaceholderFilled: (favorite: Favorite): void => view.redrawThumb(favorite)
  });
  const offersTutorial = context.environment.pointer === "touch";
  const control = new FavoritesControl({ offersTutorial }, { context, shell });
  const features = new FavoritesFeatures(context, featureDependencies(context, model, control));
  const flows = new FavoritesFlows({ context, model, view, control });
  const components: FavoritesComponents = { context, shell, model, view, flows, control, features };

  setup(components);
  start(components);
}

function startOnPostListPage(context: AppContext): void {
  servePostListRequests(context, new FavoritesModel(context, {
    onSearchResultsChanged: context.events.favorites.searchResultsUpdated.emit,
    onPlaceholderFilled: doNothing
  }));
}

function setup(components: FavoritesComponents): void {
  setupSubFeatures(components);
  setupView(components);
  mountDrawerSections(components);
  subscribeToEvents(components);
  bindPreferences(components);
  subscribeToPreferences(components);
  subscribeToDomEvents(components);
  serveFavoritesPageRequests(components);
}

function start({ context, model, view, flows }: FavoritesComponents): void {
  view.togglePaginator(!context.preferences.favorites.infiniteScroll.value);
  view.showSkeleton(model.getRecordedThumbSizes());
  flows.load.loadAllFavorites();
}

function featureDependencies(context: AppContext, model: FavoritesModel, control: FavoritesControl): FavoritesFeaturesDependencies {
  return {
    downloader: {
      batchSize: context.preferences.favorites.downloadBatchSize,
      filenameFormat: context.preferences.favorites.downloadFilenameFormat,
      getSearchResults: () => model.getCurrentSearchResults(),
      getTagCategories: tagNames => context.ports.localTagCategories.getMany(tagNames),
      getTagsForIds: ids => model.getTagsForIds(ids),
      fetchOriginal: (media, signal) => context.ports.remoteMedia.fetchOriginal(media, signal)
    },
    snippets: {
      appendToSearch: text => control.appendToSearch(text),
      getSearchResults: () => model.getCurrentSearchResults(),
      localSnippets: context.ports.localSnippets,
      localKeyedValues: context.ports.localKeyedValues,
      scheduler: context.ports.scheduler
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

function mountDrawerSections({ control, features }: FavoritesComponents): void {
  control.mountDrawerSections({
    download: features.buildDownloaderSection(),
    snippets: features.buildSnippetsSection(),
    tags: { mount: container => container.appendChild(createElement("div", { className: "favorites-drawer-placeholder", textContent: "Work in progress" })) }
  });
}

function subscribeToEvents({ context, view, flows, control }: FavoritesComponents): void {
  const { events, milestones } = context;

  events.favorites.searchButtonClicked.on(event => control.handleSearchButtonClicked(event));
  events.favorites.clearButtonClicked.on(() => control.clearSearch());
  events.favorites.shuffleButtonClicked.on(() => flows.search.shuffleSearchResults());
  events.favorites.invertButtonClicked.on(() => flows.search.invertSearchResults());
  events.favorites.settingsResetRequested.on(() => flows.action.resetSettings());
  events.favorites.searchRequested.on(query => flows.search.searchFavorites(query));
  events.favorites.postListRequested.on(query => flows.search.openPostList(query));
  events.favorites.pageSelected.on(pageNumber => flows.display.goToPage(pageNumber));
  events.favorites.pageStepped.on(direction => flows.display.advance(direction));
  events.favorites.gotoPageToggled.on(() => flows.input.toggleGotoPage());
  events.favorites.gotoPageSubmitted.on(pageNumber => flows.input.submitGotoPage(pageNumber));
  events.postOverlay.searchForTagRequested.on(tag => control.runSearch(tag));
  events.postOverlay.addTagToSearchRequested.on(tag => control.appendToSearch(tag));
  events.postOverlay.excludeTagFromSearchRequested.on(tag => control.excludeFromSearch(tag));
  events.app.favoriteAdded.on(id => view.setFavorited(id, true));
  events.app.favoriteRemoved.on(id => flows.action.removeFavorite(id));
}

function bindPreferences({ context, view }: FavoritesComponents): void {
  const { preferences, ports } = context;

  effect(() => view.toggleDrawer(preferences.favorites.drawerOpen.value));
  effect(() => view.showDrawerSection(preferences.favorites.drawerActiveSection.value));
  effect(() => view.showDrawerLabels(preferences.favorites.drawerLabelsEnabled.value));
  effect(() => ports.hostPage.setHeaderVisible(preferences.favorites.headerEnabled.value));
}

function subscribeToPreferences({ context, view, flows }: FavoritesComponents): void {
  const { preferences } = context;

  preferences.favorites.layout.on(layout => view.changeLayout(layout));
  preferences.favorites.sortKey.on(() => flows.search.reSearchFavorites());
  preferences.favorites.sortAscending.on(() => flows.search.reSearchFavorites());
  preferences.favorites.infiniteScroll.on(() => flows.display.toggleInfiniteScroll());
  preferences.favorites.resultsPerPage.on(() => flows.display.redisplayLatestResults());
  preferences.favorites.allowedRatings.on(() => flows.search.reSearchFavorites());
  preferences.favorites.excludeBlacklist.on(() => flows.search.reSearchFavorites());
}

function subscribeToDomEvents(components: FavoritesComponents): void {
  SUBSCRIBE_TO_INPUT[components.context.environment.pointer](components);
}

function subscribeToHoverInput({ context, view, flows }: FavoritesComponents): void {
  const { domEvents, features } = context;

  if (!features.has("gallery")) {
    domEvents.document.mouseover.on(event => view.suppressLinkOnHoveredThumb(event));
  }
  domEvents.document.click.on(event => flows.input.handleClick(event));
  domEvents.document.mousedown.on(event => flows.input.handleMouseDown(event));
}

function subscribeToTouchInput({ context, flows }: FavoritesComponents): void {
  context.domEvents.document.click.on(event => flows.input.triggerPostAction(event));
}

function serveFavoritesPageRequests({ context, shell, model, view, flows }: FavoritesComponents): void {
  const { featureBridge, preferences } = context;

  featureBridge.favorites.advance.serve(direction => flows.display.advance(direction));
  featureBridge.favorites.searchResults.serve(() => model.getCurrentSearchResults());
  featureBridge.favorites.searchQuery.serve(() => model.getCurrentSearchQuery());
  featureBridge.favorites.toolbar.serve(() => shell.toolbarRoot);
  featureBridge.favorites.usingInfiniteScroll.serve(() => preferences.favorites.infiniteScroll.value);
  featureBridge.favorites.layout.serve(() => view.getLayout());
  featureBridge.favorites.favorite.serve(id => model.getFavorite(id));
}

function servePostListRequests(context: AppContext, model: FavoritesModel): void {
  context.featureBridge.favorites.favoriteIds.serve(() => model.loadFavoriteIds());
}
