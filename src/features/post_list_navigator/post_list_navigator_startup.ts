import * as ContentTiler from "@/app/layout/content_tiler";
import * as PostListNavigatorFavoritesMarkerFlow from "@/features/post_list_navigator/flows/favorites_marker_flow";
import * as PostListNavigatorModel from "@/features/post_list_navigator/model/post_list_navigator_model";
import * as PostListNavigatorNavigationFlow from "@/features/post_list_navigator/flows/navigation_flow";
import * as PostListNavigatorOptionFlow from "@/features/post_list_navigator/flows/option_flow";
import * as PostListNavigatorView from "@/features/post_list_navigator/view/post_list_navigator_view";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { POST_LIST_PAGE_ENABLED } from "@/app/context/flags";
import { Preferences } from "@/app/context/preferences";

export function startPostListNavigator(): void {
  if (POST_LIST_PAGE_ENABLED) {
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

  if (Preferences.postListFavoriteIndicator.value) {
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
  Events.app.favoriteAdded.on(PostListNavigatorFavoritesMarkerFlow.onFavoriteAdded);
  Events.postList.favoriteIndicatorToggled.on(PostListNavigatorOptionFlow.toggleFavoriteIndicator);
  Events.postList.favoriteIndicatorStyleChanged.on(PostListNavigatorView.applyCurrentFavoriteStyle);
  Events.gallery.displayedThumb.on(PostListNavigatorView.applyGalleryFavoriteStyle);
}

function subscribeToEvents(): void {
  Events.postList.layoutChanged.on(ContentTiler.changeLayout);
  Events.postList.infiniteScrollToggled.on(PostListNavigatorOptionFlow.toggleInfiniteScroll);
}

function serveExternalRequests(): void {
  FeatureBridge.currentSearchQuery.register(PostListNavigatorView.currentSearch);
  FeatureBridge.navigateToAdjacentPostList.register(PostListNavigatorNavigationFlow.navigatePostLists);
  FeatureBridge.postListThumbs.register(PostListNavigatorModel.allThumbs);
  FeatureBridge.usingInfiniteScroll.register(() => Preferences.postListInfiniteScroll.value);
}
