import * as PostListNavigatorFlows from "@/features/post_list_navigator/flows/flows";
import * as PostListNavigatorModel from "@/features/post_list_navigator/model/model";
import * as PostListNavigatorView from "@/features/post_list_navigator/view/view";
import { Preferences } from "@/app/context/preferences";

export function startInfiniteScroll(): void {
  if (Preferences.postList.infiniteScroll.value) {
    toggleInfiniteScroll(true);
  }
}

export function toggleInfiniteScroll(value: boolean): void {
  if (value) {
    PostListNavigatorFlows.InfiniteScroll.enableInfiniteScroll();
    PostListNavigatorFlows.InfiniteScroll.showMoreResults();
  } else {
    PostListNavigatorFlows.InfiniteScroll.disableInfiniteScroll();
    PostListNavigatorModel.resetCurrentPageNumber();
    PostListNavigatorView.renderPostList(PostListNavigatorModel.getInitialPostList());
  }
  PostListNavigatorView.setInfiniteScrollStyle(value);
}

export function toggleFavoriteIndicator(enabled: boolean): Promise<void> {
  return PostListNavigatorFlows.FavoritesMarker.toggleIndicator(enabled);
}
