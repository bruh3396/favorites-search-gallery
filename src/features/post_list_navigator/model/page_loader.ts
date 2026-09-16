import { AppContext } from "@/app/context/context";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigatorPageCache } from "@/features/post_list_navigator/model/page_cache";
import { RAW_THUMB_CLASS_NAME } from "@/lib/ui/thumb/selectors";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { fetchPostList } from "@/lib/remote/fetchers/html";
import { numbersAround } from "@/utils/pure/number";
import { preparePostListThumbs } from "@/features/post_list_navigator/dom_tweaks/thumb_preparer";
import { withExponentialBackoff } from "@/lib/async/scheduling";

export class PostListNavigatorPageLoader {
  private readonly cache: PostListNavigatorPageCache = new PostListNavigatorPageCache();
  private readonly onMobileDevice: boolean;
  private readonly galleryDisabled: boolean;

  constructor(context: AppContext) {
    this.onMobileDevice = context.environment.onMobileDevice;
    this.galleryDisabled = context.flags.galleryDisabled;
  }

  public load(baseUrl: string, pageNumber: number): Promise<void> {
    if (pageNumber < 0 || this.cache.isLoaded(pageNumber)) {
      return Promise.resolve();
    }
    const pending = this.cache.pendingLoad(pageNumber);

    if (pending !== undefined) {
      return pending;
    }
    const loaded = withExponentialBackoff(() => fetchPostList(baseUrl, pageNumber), Rule34NetworkConfig.postListFetchRetries, Rule34NetworkConfig.postListFetchRetryDelay)
      .then((html: string) => {
        this.cache.markLoaded(pageNumber, this.createPostListFromHtml(pageNumber, html));
      }).catch(() => {
        this.cache.remove(pageNumber);
      });

    this.cache.markLoading(pageNumber, loaded);
    return loaded;
  }

  public preloadAround(baseUrl: string, currentPageNumber: number): void {
    numbersAround(currentPageNumber, Rule34NetworkConfig.postListPrefetchLength).forEach(n => this.load(baseUrl, n));
  }

  public createPostListFromHtml(pageNumber: number, html: string): PostList {
    const dom = new DOMParser().parseFromString(html, "text/html");
    const thumbs = preparePostListThumbs(Array.from(dom.querySelectorAll(`.${RAW_THUMB_CLASS_NAME}`)), this.onMobileDevice, this.galleryDisabled);
    const paginator = dom.getElementById("paginator");
    return new PostList(pageNumber, thumbs, paginator);
  }

  public reload(baseUrl: string, pageNumber: number): Promise<void> {
    this.cache.remove(pageNumber);
    return this.load(baseUrl, pageNumber);
  }

  public get(pageNumber: number): PostList | undefined {
    return this.cache.get(pageNumber);
  }

  public allThumbs(): HTMLElement[] {
    return this.cache.allThumbs();
  }

  public markLoaded(pageNumber: number, page: PostList): void {
    this.cache.markLoaded(pageNumber, page);
  }
}
