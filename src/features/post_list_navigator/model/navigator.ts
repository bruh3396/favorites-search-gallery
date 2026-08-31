import * as PostListNavigatorPageLoader from "@/features/post_list_navigator/model/page_loader";
import * as PostListNavigatorUrlContext from "@/features/post_list_navigator/model/url_context";
import { NavigationKey } from "@/types/input";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigationResult } from "@/features/post_list_navigator/types/navigation";
import { getAllPageThumbs } from "@/app/layout/content_thumbs";
import { navigationDelta } from "@/utils/pure/number";

let initialPageNumber: number;
let currentPageNumber: number;
let baseUrl: string;
let initialPostList: PostList;

export function setup(): void {
  initialPageNumber = PostListNavigatorUrlContext.initialPageNumber();
  baseUrl = PostListNavigatorUrlContext.baseUrl();
  currentPageNumber = initialPageNumber;
  initialPostList = new PostList(initialPageNumber, Array.from(getAllPageThumbs()), document.getElementById("paginator"));
  PostListNavigatorPageLoader.markLoaded(initialPageNumber, initialPostList);
}

export function preloadAroundInitialPage(): void {
  PostListNavigatorPageLoader.preloadAround(baseUrl, initialPageNumber);
}

export function navigate(direction: NavigationKey): PostListNavigationResult {
  const nextPageNumber = currentPageNumber + navigationDelta(direction);

  if (nextPageNumber < 0) {
    return { postList: null, boundary: "start" };
  }
  const postList = PostListNavigatorPageLoader.get(nextPageNumber);

  if (postList === undefined || postList.isEmpty) {
    PostListNavigatorPageLoader.reload(baseUrl, nextPageNumber);
    return { postList: null, boundary: "end" };
  }
  currentPageNumber = nextPageNumber;
  PostListNavigatorPageLoader.preloadAround(baseUrl, currentPageNumber);
  return { postList, boundary: "none" };
}

export async function getMoreResults(): Promise<HTMLElement[]> {
  const currentPostList = PostListNavigatorPageLoader.get(currentPageNumber);

  if (currentPostList === undefined || currentPostList.isLast) {
    return [];
  }
  currentPageNumber += 1;
  await PostListNavigatorPageLoader.load(baseUrl, currentPageNumber);
  const nextPostList = PostListNavigatorPageLoader.get(currentPageNumber);

  if (nextPostList === undefined) {
    console.error(`Could not load next search page ${currentPageNumber}`);
    return [];
  }
  PostListNavigatorPageLoader.load(baseUrl, currentPageNumber + 1);
  return nextPostList.thumbs;
}

export function getInitialPostList(): PostList {
  return initialPostList;
}

export function resetCurrentPageNumber(): void {
  currentPageNumber = initialPageNumber;
}

export { allThumbs } from "@/features/post_list_navigator/model/page_loader";
