import { markActionBarFavorited, markActionBarUnfavorited } from "@/lib/ui/thumb/action_bar";
import { AppContext } from "@/app/context/context";
import { PostListNavigatorControl } from "@/features/post_list_navigator/control/control";
import { PostListNavigatorFlows } from "@/features/post_list_navigator/flows/flows";
import { PostListNavigatorModel } from "@/features/post_list_navigator/model/model";
import { PostListNavigatorView } from "@/features/post_list_navigator/view/view";

interface PostListNavigatorComponents {
  context: AppContext;
  model: PostListNavigatorModel;
  view: PostListNavigatorView;
  flows: PostListNavigatorFlows;
  control: PostListNavigatorControl;
}

export function startPostListNavigator(context: AppContext): void {
  if (context.environment.onPostListPage) {
    const model = new PostListNavigatorModel(context);
    const view = new PostListNavigatorView(context);
    const flows = new PostListNavigatorFlows(context, model, view);
    const control = new PostListNavigatorControl(context);
    const components: PostListNavigatorComponents = { context, model, view, flows, control };

    setup(components);
    start(components);
  }
}

function setup(components: PostListNavigatorComponents): void {
  components.control.buildShell();
  setupFavoriteIndicator(components);
  subscribeToEvents(components);
  serveExternalRequests(components);
}

async function start(components: PostListNavigatorComponents): Promise<void> {
  const { context, model, view, flows } = components;

  model.preloadAroundInitialPage();
  view.tileNativePostListThumbs();
  view.removeNativeImageList();
  view.prepareNativePostListThumbs();
  flows.option.startInfiniteScroll();

  if (context.preferences.postList.favoriteIndicator.value) {
    await flows.favoritesMarker.toggleIndicator(true);
  }
  context.events.postList.initialPostListCreated.emit(model.getInitialPostList());
  context.events.postList.postListInitialized.emit();
}

function setupFavoriteIndicator({ context, flows }: PostListNavigatorComponents): void {
  const { events, preferences } = context;

  events.postList.pageChanged.on((thumbs) => flows.favoritesMarker.markExistingFavoritesIfEnabled(thumbs));
  events.postList.moreResultsAdded.on((thumbs) => flows.favoritesMarker.markExistingFavoritesIfEnabled(thumbs));
  events.app.favoriteAdded.on((id) => flows.favoritesMarker.registerFavorite(id));
  preferences.postList.favoriteIndicator.on((enabled) => flows.option.toggleFavoriteIndicator(enabled));
}

function subscribeToEvents({ context, view, flows }: PostListNavigatorComponents): void {
  const { events, preferences, domEvents } = context;

  preferences.postList.layout.on((layout) => view.changeLayout(layout));
  preferences.postList.infiniteScroll.on((value) => flows.option.toggleInfiniteScroll(value));
  domEvents.document.click.on((event) => flows.postAction.triggerPostAction(event));
  events.app.favoriteAdded.on(markActionBarFavorited);
  events.app.favoriteRemoved.on(markActionBarUnfavorited);
}

function serveExternalRequests({ context, model, view, flows }: PostListNavigatorComponents): void {
  const { featureBridge, preferences } = context;

  featureBridge.postList.searchQuery.serve(() => view.currentSearch());
  featureBridge.postList.navigateToAdjacent.serve((direction) => flows.navigation.navigatePostLists(direction));
  featureBridge.postList.thumbs.serve(() => model.allThumbs());
  featureBridge.postList.usingInfiniteScroll.serve(() => preferences.postList.infiniteScroll.value);
  featureBridge.postList.layout.serve(() => view.getLayout());
}
