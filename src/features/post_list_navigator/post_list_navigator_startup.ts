import * as ContentTiler from "@/app/layout/content_tiler";
import * as PostListNavigatorFavoritesMarkerFlow from "@/features/post_list_navigator/flows/favorites_marker_flow";
import * as PostListNavigatorModel from "@/features/post_list_navigator/model/post_list_navigator_model";
import * as PostListNavigatorNavigationFlow from "@/features/post_list_navigator/flows/navigation_flow";
import * as PostListNavigatorOptionFlow from "@/features/post_list_navigator/flows/option_flow";
import * as PostListNavigatorPostActionFlow from "@/features/post_list_navigator/flows/post_action_flow";
import * as PostListNavigatorView from "@/features/post_list_navigator/view/post_list_navigator_view";
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
  PostListNavigatorOptionFlow.startInfiniteScroll();

  if (Preferences.postList.favoriteIndicator.value) {
    await PostListNavigatorFavoritesMarkerFlow.toggleIndicator(true);
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
  Events.postList.pageChanged.on(PostListNavigatorFavoritesMarkerFlow.markExistingFavoritesIfEnabled);
  Events.postList.moreResultsAdded.on(PostListNavigatorFavoritesMarkerFlow.markExistingFavoritesIfEnabled);
  Events.app.favoriteAdded.on(PostListNavigatorFavoritesMarkerFlow.registerFavorite);
  Preferences.postList.favoriteIndicator.on(PostListNavigatorOptionFlow.toggleFavoriteIndicator);
  Preferences.postList.favoriteIndicatorStyle.on(PostListNavigatorView.applyCurrentFavoriteStyle);
  Events.gallery.displayedThumb.on(PostListNavigatorView.applyGalleryFavoriteStyle);
}

function subscribeToEvents(): void {
  Preferences.postList.layout.on(ContentTiler.changeLayout);
  Preferences.postList.infiniteScroll.on(PostListNavigatorOptionFlow.toggleInfiniteScroll);
  DomEvents.document.click.on(PostListNavigatorPostActionFlow.triggerPostAction);
}

function serveExternalRequests(): void {
  FeatureBridge.postList.searchQuery.register(PostListNavigatorView.currentSearch);
  FeatureBridge.postList.navigateToAdjacent.register(PostListNavigatorNavigationFlow.navigatePostLists);
  FeatureBridge.postList.thumbs.register(PostListNavigatorModel.allThumbs);
  FeatureBridge.postList.usingInfiniteScroll.register(() => Preferences.postList.infiniteScroll.value);
}
