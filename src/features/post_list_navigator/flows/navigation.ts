import * as PostListNavigatorFlows from "@/features/post_list_navigator/flows/flows";
import * as PostListNavigatorModel from "@/features/post_list_navigator/model/model";
import * as PostListNavigatorView from "@/features/post_list_navigator/view/view";
import { Events } from "@/app/channels/events";
import { NavigationKey } from "@/types/input";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { Preferences } from "@/app/context/preferences";

export function navigatePostLists(direction: NavigationKey): PostList | null {
  if (Preferences.postList.infiniteScroll.value) {
    PostListNavigatorFlows.InfiniteScroll.showMoreResults();
    return null;
  }
  const result = PostListNavigatorModel.navigate(direction);

  if (result.postList !== null) {
    PostListNavigatorView.renderPostList(result.postList);
    Events.postList.pageChanged.emit(result.postList.thumbs);
  }
  return result.postList;
}
