import * as PostListNavigatorFavoritesMarkerFlow from "@/features/post_list_navigator/flows/favorites_marker_flow";
import * as PostListNavigatorInfiniteScrollFlow from "@/features/post_list_navigator/flows/infinite_scroll_flow";
import * as PostListNavigatorModel from "@/features/post_list_navigator/model/post_list_navigator_model";
import * as PostListNavigatorView from "@/features/post_list_navigator/view/post_list_navigator_view";
import { Preferences } from "@/app/context/preferences";

export function startInfiniteScroll(): void {
  if (Preferences.postList.infiniteScroll.value) {
    toggleInfiniteScroll(true);
  }
}

export function toggleInfiniteScroll(value: boolean): void {
  if (value) {
    PostListNavigatorInfiniteScrollFlow.enableInfiniteScroll();
    PostListNavigatorInfiniteScrollFlow.showMoreResults();
  } else {
    PostListNavigatorInfiniteScrollFlow.disableInfiniteScroll();
    PostListNavigatorModel.resetCurrentPageNumber();
    PostListNavigatorView.renderPostList(PostListNavigatorModel.getInitialPostList());
  }
  PostListNavigatorView.setInfiniteScrollStyle(value);
}

export function toggleFavoriteIndicator(enabled: boolean): Promise<void> {
  PostListNavigatorView.setFavoriteIndicatorSubOptionsVisible(enabled);
  return PostListNavigatorFavoritesMarkerFlow.toggleIndicator(enabled);
}
