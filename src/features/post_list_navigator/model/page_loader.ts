import * as PostListNavigatorPageCache from "@/features/post_list_navigator/model/page_cache";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { RAW_THUMB_CLASS_NAME } from "@/lib/thumb/selectors";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { fetchPostList } from "@/lib/remote/pages";
import { numbersAround } from "@/utils/pure/number";
import { preparePostListThumbs } from "@/features/post_list_navigator/dom_tweaks/thumb_preparer";
import { withExponentialBackoff } from "@/lib/async/scheduling";

export function load(baseUrl: string, pageNumber: number): Promise<void> {
  if (pageNumber < 0 || PostListNavigatorPageCache.isLoaded(pageNumber)) {
    return Promise.resolve();
  }
  const pending = PostListNavigatorPageCache.pendingLoad(pageNumber);

  if (pending !== undefined) {
    return pending;
  }
  const loaded = withExponentialBackoff(() => fetchPostList(baseUrl, pageNumber), Rule34NetworkConfig.postListFetchRetries, Rule34NetworkConfig.postListFetchRetryDelay)
    .then((html: string) => {
      PostListNavigatorPageCache.markLoaded(pageNumber, createPostListFromHtml(pageNumber, html));
    }).catch(() => {
      PostListNavigatorPageCache.remove(pageNumber);
    });

  PostListNavigatorPageCache.markLoading(pageNumber, loaded);
  return loaded;
}

export function preloadAround(baseUrl: string, currentPageNumber: number): void {
  numbersAround(currentPageNumber, Rule34NetworkConfig.postListPrefetchLength).forEach(n => load(baseUrl, n));
}

export function createPostListFromHtml(pageNumber: number, html: string): PostList {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const thumbs = preparePostListThumbs(Array.from(dom.querySelectorAll(`.${RAW_THUMB_CLASS_NAME}`)));
  const paginator = dom.getElementById("paginator");
  return new PostList(pageNumber, thumbs, paginator);
}

export function reload(baseUrl: string, pageNumber: number): Promise<void> {
  PostListNavigatorPageCache.remove(pageNumber);
  return load(baseUrl, pageNumber);
}

export { get, allThumbs, markLoaded } from "@/features/post_list_navigator/model/page_cache";
