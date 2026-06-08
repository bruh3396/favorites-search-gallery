import * as PostListNavigatorPageCache from "@/features/post_list_navigator/model/page_cache";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { RAW_THUMB_CLASS_NAME } from "@/lib/thumb/thumbs";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { fetchPostList } from "@/lib/remote/rule34/post_list_fetcher";
import { numbersAroundInRange } from "@/utils/number";
import { parseHtml } from "@/utils/dom/html_parser";
import { preparePostListThumbs } from "@/features/post_list_navigator/dom_tweaks/thumb_preparer";

export function load(baseUrl: string, pageNumber: number): Promise<void> {
  if (PostListNavigatorPageCache.has(pageNumber) || pageNumber < 0) {
    return Promise.resolve();
  }
  PostListNavigatorPageCache.markLoading(pageNumber);
  return fetchPostList(baseUrl, pageNumber)
    .then((html: string) => {
      PostListNavigatorPageCache.markLoaded(pageNumber, createPostListFromHtml(pageNumber, html));
    }).catch(() => {
      PostListNavigatorPageCache.remove(pageNumber);
    });
}

export function preloadAround(baseUrl: string, currentPageNumber: number): void {
  numbersAroundInRange(currentPageNumber, Rule34NetworkConfig.postListPrefetchLength).forEach(n => load(baseUrl, n));
}

export function createPostListFromHtml(pageNumber: number, html: string): PostList {
  const dom = parseHtml(html);
  const thumbs = preparePostListThumbs(Array.from(dom.querySelectorAll(`.${RAW_THUMB_CLASS_NAME}`)));
  const paginator = dom.getElementById("paginator");
  return new PostList(pageNumber, thumbs, paginator);
}

export function reload(baseUrl: string, pageNumber: number): Promise<void> {
  PostListNavigatorPageCache.remove(pageNumber);
  return load(baseUrl, pageNumber);
}

export { get, allThumbs, markLoaded } from "@/features/post_list_navigator/model/page_cache";
