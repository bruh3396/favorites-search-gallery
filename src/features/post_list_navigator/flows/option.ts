import { PostListNavigatorFlow } from "@/features/post_list_navigator/flows/flow";

export class PostListNavigatorOptionFlow extends PostListNavigatorFlow {

  public startInfiniteScroll(): void {
    if (this.context.preferences.postList.infiniteScroll.value) {
      this.toggleInfiniteScroll(true);
    }
  }

  public toggleInfiniteScroll(value: boolean): void {
    if (value) {
      this.flows.infiniteScroll.enableInfiniteScroll();
      this.flows.infiniteScroll.showMoreResults();
    } else {
      this.flows.infiniteScroll.disableInfiniteScroll();
      this.model.resetCurrentPageNumber();
      this.view.renderPostList(this.model.getInitialPostList());
    }
    this.view.setInfiniteScrollStyle(value);
  }

  public toggleFavoriteIndicator(enabled: boolean): Promise<void> {
    return this.flows.favoritesMarker.toggleIndicator(enabled);
  }
}
