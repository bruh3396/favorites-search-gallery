import { NavigationKey } from "@/types/input";
import { Post } from "@/core/domain/post/post";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigationResult } from "@/features/post_list_navigator/types/navigation";
import { PostListNavigatorPageLoader } from "@/features/post_list_navigator/model/page_loader";
import { RemoteSearchResults } from "@/core/boundary/ports/remote_search_results/remote_search_results";
import { navigationDelta } from "@/lib/event/keys";

export class PostListNavigatorNavigator {
  private readonly pageLoader: PostListNavigatorPageLoader;
  private readonly initialPageNumber: number;
  private currentPageNumber: number;

  constructor(searchResults: RemoteSearchResults) {
    this.pageLoader = new PostListNavigatorPageLoader(searchResults);
    this.initialPageNumber = searchResults.initialPageIndex;
    this.currentPageNumber = this.initialPageNumber;
  }

  public async loadInitialPage(): Promise<PostList> {
    await this.pageLoader.load(this.initialPageNumber);
    return this.getInitialPostList();
  }

  public preloadAroundInitialPage(): void {
    this.pageLoader.preloadAround(this.initialPageNumber);
  }

  public navigate(direction: NavigationKey): PostListNavigationResult {
    const nextPageNumber = this.currentPageNumber + navigationDelta(direction);

    if (nextPageNumber < 0) {
      return { postList: null, boundary: "start" };
    }
    const postList = this.pageLoader.get(nextPageNumber);

    if (postList === undefined || postList.posts.length === 0) {
      this.pageLoader.reload(nextPageNumber);
      return { postList: null, boundary: "end" };
    }
    this.currentPageNumber = nextPageNumber;
    this.pageLoader.preloadAround(this.currentPageNumber);
    return { postList, boundary: "none" };
  }

  public async getMoreResults(): Promise<Post[]> {
    const currentPostList = this.pageLoader.get(this.currentPageNumber);

    if (currentPostList === undefined || currentPostList.isLast) {
      return [];
    }
    this.currentPageNumber += 1;
    await this.pageLoader.load(this.currentPageNumber);
    const nextPostList = this.pageLoader.get(this.currentPageNumber);

    if (nextPostList === undefined) {
      console.error(`Could not load next search page ${this.currentPageNumber}`);
      return [];
    }
    this.pageLoader.load(this.currentPageNumber + 1);
    return nextPostList.posts;
  }

  public getInitialPostList(): PostList {
    return this.pageLoader.get(this.initialPageNumber) ?? { pageIndex: this.initialPageNumber, posts: [], isLast: true };
  }

  public resetCurrentPageNumber(): void {
    this.currentPageNumber = this.initialPageNumber;
  }

  public allPosts(): Post[] {
    return this.pageLoader.allPosts();
  }

  public getPost(id: string): Post | undefined {
    return this.pageLoader.getPost(id);
  }
}
