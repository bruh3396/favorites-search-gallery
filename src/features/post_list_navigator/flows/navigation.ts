import { NavigationKey } from "@/types/input";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigatorFlow } from "@/features/post_list_navigator/flows/flow";

export class PostListNavigatorNavigationFlow extends PostListNavigatorFlow {

  public navigatePostLists(direction: NavigationKey): PostList | null {
    if (this.context.preferences.postList.infiniteScroll.value) {
      this.flows.infiniteScroll.showMoreResults();
      return null;
    }
    const result = this.model.navigate(direction);

    if (result.postList !== null) {
      this.view.renderPostList(result.postList);
      this.context.events.postList.pageChanged.emit(result.postList.thumbs);
    }
    return result.postList;
  }
}
