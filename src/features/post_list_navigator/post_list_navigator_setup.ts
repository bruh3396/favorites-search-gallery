import * as ContentTiler from "@/app/layout/content_tiler";
import * as PostListNavigatorFavoritesMarkerFlow from "@/features/post_list_navigator/flows/favorites_marker_flow";
import * as PostListNavigatorModel from "@/features/post_list_navigator/model/post_list_navigator_model";
import * as PostListNavigatorNavigationFlow from "@/features/post_list_navigator/flows/navigation_flow";
import * as PostListNavigatorOptionFlow from "@/features/post_list_navigator/flows/option_flow";
import * as PostListNavigatorView from "@/features/post_list_navigator/view/post_list_navigator_view";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { POST_LIST_PAGE_DISABLED } from "@/app/context/flags";
import { Preferences } from "@/app/context/preferences";

export async function setupPostList(): Promise<void> {
  if (POST_LIST_PAGE_DISABLED) {
    return;
  }
  setupModel();
  await setupView();
  await setupFavoriteIndicator();
  subscribeToEvents();
  registerBridgeHandlers();
  Events.postList.initialPostListCreated.emit(PostListNavigatorModel.getInitialPostList());
  Events.postList.postListInitialized.emit();
}

function setupModel(): void {
  PostListNavigatorModel.setup();
}

function setupView(): Promise<void> {
  return PostListNavigatorView.setup();
}

async function setupFavoriteIndicator(): Promise<void> {
  Events.postList.pageChanged.on(PostListNavigatorFavoritesMarkerFlow.markExistingFavoritesIfEnabled);
  Events.postList.moreResultsAdded.on(PostListNavigatorFavoritesMarkerFlow.markExistingFavoritesIfEnabled);
  Events.app.favoriteAdded.on(PostListNavigatorFavoritesMarkerFlow.onFavoriteAdded);
  Events.postList.favoriteIndicatorToggled.on(PostListNavigatorOptionFlow.toggleFavoriteIndicator);
  Events.postList.favoriteIndicatorStyleChanged.on(PostListNavigatorView.applyCurrentFavoriteStyle);
  Events.gallery.displayedThumb.on(PostListNavigatorView.applyGalleryFavoriteStyle);

  if (Preferences.postListFavoriteIndicator.value) {
    await PostListNavigatorFavoritesMarkerFlow.toggleIndicator(true);
  }
}

function subscribeToEvents(): void {
  Events.postList.layoutChanged.on(ContentTiler.changeLayout);
  Events.postList.infiniteScrollToggled.on(PostListNavigatorOptionFlow.toggleInfiniteScroll);
}

function registerBridgeHandlers(): void {
  FeatureBridge.currentSearchQuery.register(PostListNavigatorView.currentSearch);
  FeatureBridge.navigateToAdjacentPostList.register(PostListNavigatorNavigationFlow.navigatePostLists);
  FeatureBridge.postListThumbs.register(PostListNavigatorModel.allThumbs);
  FeatureBridge.usingInfiniteScroll.register(() => Preferences.postListInfiniteScroll.value);
}
