import * as PostListNavigatorUrlContext from "@/features/post_list_navigator/model/url_context";
import { AppContext } from "@/app/context/context";
import { NavigationKey } from "@/types/input";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigationResult } from "@/features/post_list_navigator/types/navigation";
import { PostListNavigatorPageLoader } from "@/features/post_list_navigator/model/page_loader";
import { navigationDelta } from "@/utils/pure/number";

export class PostListNavigatorNavigator {
  private readonly pageLoader: PostListNavigatorPageLoader;
  private readonly initialPageNumber: number;
  private currentPageNumber: number;
  private readonly baseUrl: string;
  private readonly initialPostList: PostList;

  constructor(context: AppContext) {
    this.pageLoader = new PostListNavigatorPageLoader(context);
    this.initialPageNumber = PostListNavigatorUrlContext.initialPageNumber();
    this.baseUrl = PostListNavigatorUrlContext.baseUrl();
    this.currentPageNumber = this.initialPageNumber;
    this.initialPostList = new PostList(this.initialPageNumber, Array.from(context.shell.getPageThumbs()), document.getElementById("paginator"));
    this.pageLoader.markLoaded(this.initialPageNumber, this.initialPostList);
  }

  public preloadAroundInitialPage(): void {
    this.pageLoader.preloadAround(this.baseUrl, this.initialPageNumber);
  }

  public navigate(direction: NavigationKey): PostListNavigationResult {
    const nextPageNumber = this.currentPageNumber + navigationDelta(direction);

    if (nextPageNumber < 0) {
      return { postList: null, boundary: "start" };
    }
    const postList = this.pageLoader.get(nextPageNumber);

    if (postList === undefined || postList.isEmpty) {
      this.pageLoader.reload(this.baseUrl, nextPageNumber);
      return { postList: null, boundary: "end" };
    }
    this.currentPageNumber = nextPageNumber;
    this.pageLoader.preloadAround(this.baseUrl, this.currentPageNumber);
    return { postList, boundary: "none" };
  }

  public async getMoreResults(): Promise<HTMLElement[]> {
    const currentPostList = this.pageLoader.get(this.currentPageNumber);

    if (currentPostList === undefined || currentPostList.isLast) {
      return [];
    }
    this.currentPageNumber += 1;
    await this.pageLoader.load(this.baseUrl, this.currentPageNumber);
    const nextPostList = this.pageLoader.get(this.currentPageNumber);

    if (nextPostList === undefined) {
      console.error(`Could not load next search page ${this.currentPageNumber}`);
      return [];
    }
    this.pageLoader.load(this.baseUrl, this.currentPageNumber + 1);
    return nextPostList.thumbs;
  }

  public getInitialPostList(): PostList {
    return this.initialPostList;
  }

  public resetCurrentPageNumber(): void {
    this.currentPageNumber = this.initialPageNumber;
  }

  public allThumbs(): HTMLElement[] {
    return this.pageLoader.allThumbs();
  }
}
