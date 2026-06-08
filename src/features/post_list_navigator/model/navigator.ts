import * as PostListNavigatorLoader from "@/features/post_list_navigator/model/page_loader";
import * as PostListNavigatorUrlContext from "@/features/post_list_navigator/model/url_context";
import { Boundary } from "@/types/boundary";
import { NavigationKey } from "@/types/input";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigationResult } from "@/features/post_list_navigator/types/navigation";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { getAllPageThumbs } from "@/app/layout/content_thumbs";
import { navigationDelta } from "@/utils/navigation";
import { sleep } from "@/lib/async/timing";

let initialPageNumber: number;
let currentPageNumber: number;
let baseUrl: string;
let initialPostList: PostList;

export function setup(): void {
  initialPageNumber = PostListNavigatorUrlContext.initialPageNumber();
  baseUrl = PostListNavigatorUrlContext.baseUrl();
  currentPageNumber = initialPageNumber;
  initialPostList = new PostList(initialPageNumber, Array.from(getAllPageThumbs()), document.getElementById("paginator"));
  PostListNavigatorLoader.markLoaded(initialPageNumber, initialPostList);
  PostListNavigatorLoader.preloadAround(baseUrl, currentPageNumber);
}

export function navigate(direction: NavigationKey): PostListNavigationResult {
  const nextPageNumber = currentPageNumber + navigationDelta(direction);

  if (nextPageNumber < 0) {
    return { postList: null, boundary: Boundary.Start };
  }
  const postList = PostListNavigatorLoader.get(nextPageNumber);

  if (postList === undefined || postList.isEmpty) {
    PostListNavigatorLoader.reload(baseUrl, nextPageNumber);
    return { postList: null, boundary: Boundary.End };
  }
  currentPageNumber = nextPageNumber;
  PostListNavigatorLoader.preloadAround(baseUrl, currentPageNumber);
  return { postList, boundary: Boundary.None };
}

export async function getMoreResults(): Promise<HTMLElement[]> {
  const currentPostList = PostListNavigatorLoader.get(currentPageNumber);

  if (currentPostList === undefined || currentPostList.isLast) {
    return [];
  }
  currentPageNumber += 1;
  let nextPostList: PostList | undefined;

  for (let attempts = 0; attempts < Rule34NetworkConfig.postListFetchRetries; attempts += 1) {
    await PostListNavigatorLoader.load(baseUrl, currentPageNumber);
    nextPostList = PostListNavigatorLoader.get(currentPageNumber);

    if (nextPostList !== undefined) {
      break;
    }
    await sleep(Rule34NetworkConfig.postListFetchRetryDelay);
  }

  if (nextPostList === undefined) {
    console.error(`Could not load next search page ${currentPageNumber}`);
    return [];
  }
  PostListNavigatorLoader.load(baseUrl, currentPageNumber + 1);
  return nextPostList.thumbs;
}

export function getInitialPostList(): PostList {
  return initialPostList;
}

export function resetCurrentPageNumber(): void {
  currentPageNumber = initialPageNumber;
}

export { allThumbs } from "@/features/post_list_navigator/model/page_loader";
