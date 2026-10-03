import * as PostListNavigatorUrlContext from "@/features/post_list_navigator/model/url_context";
import { AppContext } from "@/app/context/context";
import { NavigationKey } from "@/types/input";
import { Post } from "@/core/domain/post/post";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigationResult } from "@/features/post_list_navigator/types/navigation";
import { PostListNavigatorPageLoader } from "@/features/post_list_navigator/model/page_loader";
import { mintMedia } from "@/adapters/rule34_cdn/client/locator";
import { navigationDelta } from "@/lib/event/keys";
import { parseThumb } from "@/adapters/rule34/client/thumb";

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
    const thumbs = Array.from(context.shell.getPageThumbs());

    const posts = thumbs.map(thumb => parseThumb(thumb, mintMedia));

    this.initialPostList = new PostList(this.initialPageNumber, thumbs, posts, context.shell.getPaginator());
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

  public allPosts(): Post[] {
    return this.pageLoader.allPosts();
  }

  public getPost(id: string): Post | undefined {
    return this.pageLoader.getPost(id);
  }
}
