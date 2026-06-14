import * as PostListNavigatorInfiniteScrollFlow from "@/features/post_list_navigator/flows/infinite_scroll_flow";
import * as PostListNavigatorModel from "@/features/post_list_navigator/model/post_list_navigator_model";
import * as PostListNavigatorView from "@/features/post_list_navigator/view/post_list_navigator_view";
import { Events } from "@/app/channels/events";
import { NavigationKey } from "@/types/input";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { Preferences } from "@/app/context/preferences";

export function navigatePostLists(direction: NavigationKey): PostList | null {
  if (Preferences.postList.infiniteScroll.value) {
    PostListNavigatorInfiniteScrollFlow.showMoreResults();
    return null;
  }
  const result = PostListNavigatorModel.navigate(direction);

  if (result.postList !== null) {
    PostListNavigatorView.renderPostList(result.postList);
    Events.postList.pageChanged.emit(result.postList.thumbs);
  }
  return result.postList;
}
