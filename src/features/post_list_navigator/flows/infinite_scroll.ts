import { PostListNavigatorFlow, PostListNavigatorFlowDependencies } from "@/features/post_list_navigator/flows/flow";
import { PostListNavigatorPageBottomObserver } from "@/features/post_list_navigator/flows/page_bottom_observer";

export class PostListNavigatorInfiniteScrollFlow extends PostListNavigatorFlow {
  private readonly pageBottomObserver: PostListNavigatorPageBottomObserver;

  constructor(dependencies: PostListNavigatorFlowDependencies) {
    super(dependencies);
    this.pageBottomObserver = new PostListNavigatorPageBottomObserver(() => this.showMoreResults());
  }

  public disableInfiniteScroll(): void {
    this.pageBottomObserver.disconnect();
  }

  public enableInfiniteScroll(): void {
    this.pageBottomObserver.refresh();
  }

  public async showMoreResults(): Promise<boolean> {
    if (!this.context.preferences.postList.infiniteScroll.value) {
      return false;
    }
    const moreResults = await this.model.getMoreResults();

    if (moreResults.length > 0 && this.context.preferences.postList.infiniteScroll.value) {
      this.view.insertNewSearchResults(moreResults);
      this.context.events.postList.moreResultsAdded.emit(moreResults);
      this.pageBottomObserver.refresh();
      return true;
    }
    return false;
  }
}
