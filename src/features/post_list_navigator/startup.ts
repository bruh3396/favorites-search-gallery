import * as ContentTiler from "@/app/layout/content_tiler";
import * as PostListNavigatorFlows from "@/features/post_list_navigator/flows/flows";
import * as PostListNavigatorModel from "@/features/post_list_navigator/model/model";
import * as PostListNavigatorView from "@/features/post_list_navigator/view/view";
import { markActionBarFavorited, markActionBarUnfavorited } from "@/lib/thumb/action_bar";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { ON_POST_LIST_PAGE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";

export function startPostListNavigator(): void {
  if (ON_POST_LIST_PAGE) {
    setup();
    start();
  }
}

function setup(): void {
  setupModel();
  setupView();
  setupFavoriteIndicator();
  subscribeToEvents();
  serveExternalRequests();
}

async function start(): Promise<void> {
  PostListNavigatorModel.preloadAroundInitialPage();
  PostListNavigatorView.tileNativePostListThumbs();
  PostListNavigatorView.removeNativeImageList();
  PostListNavigatorView.prepareNativePostListThumbs();
  PostListNavigatorFlows.Option.startInfiniteScroll();

  if (Preferences.postList.favoriteIndicator.value) {
    await PostListNavigatorFlows.FavoritesMarker.toggleIndicator(true);
  }
  Events.postList.initialPostListCreated.emit(PostListNavigatorModel.getInitialPostList());
  Events.postList.postListInitialized.emit();
}

function setupModel(): void {
  PostListNavigatorModel.setup();
}

function setupView(): void {
  PostListNavigatorView.setup();
}

function setupFavoriteIndicator(): void {
  Events.postList.pageChanged.on(PostListNavigatorFlows.FavoritesMarker.markExistingFavoritesIfEnabled);
  Events.postList.moreResultsAdded.on(PostListNavigatorFlows.FavoritesMarker.markExistingFavoritesIfEnabled);
  Events.app.favoriteAdded.on(PostListNavigatorFlows.FavoritesMarker.registerFavorite);
  Preferences.postList.favoriteIndicator.on(PostListNavigatorFlows.Option.toggleFavoriteIndicator);
}

function subscribeToEvents(): void {
  Preferences.postList.layout.on(ContentTiler.changeLayout);
  Preferences.postList.infiniteScroll.on(PostListNavigatorFlows.Option.toggleInfiniteScroll);
  DomEvents.document.click.on(PostListNavigatorFlows.PostAction.triggerPostAction);
  Events.app.favoriteAdded.on(markActionBarFavorited);
  Events.app.favoriteRemoved.on(markActionBarUnfavorited);
}

function serveExternalRequests(): void {
  FeatureBridge.postList.searchQuery.serve(PostListNavigatorView.currentSearch);
  FeatureBridge.postList.navigateToAdjacent.serve(PostListNavigatorFlows.Navigation.navigatePostLists);
  FeatureBridge.postList.thumbs.serve(PostListNavigatorModel.allThumbs);
  FeatureBridge.postList.usingInfiniteScroll.serve(() => Preferences.postList.infiniteScroll.value);
}
