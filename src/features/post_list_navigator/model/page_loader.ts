import { AppContext } from "@/app/context/context";
import { Post } from "@/core/domain/post/post";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigatorPageCache } from "@/features/post_list_navigator/model/page_cache";
import { RAW_THUMB_CLASS_NAME } from "@/lib/ui/thumb/selectors";
import { fetchPostList } from "@/adapters/rule34/client/site/post_list_page/fetcher";
import { numbersAround } from "@/utils/pure/number";
import { parseThumb } from "@/adapters/rule34/client/site/thumb/parser";
import { preparePostListThumbs } from "@/lib/ui/thumb/post_list_element";

const PREFETCH_LENGTH = 3;

export class PostListNavigatorPageLoader {
  private readonly cache: PostListNavigatorPageCache = new PostListNavigatorPageCache();
  private readonly onMobileDevice: boolean;
  private readonly galleryDisabled: boolean;

  constructor(context: AppContext) {
    this.onMobileDevice = context.environment.device === "mobile";
    this.galleryDisabled = !context.features.has("gallery");
  }

  public load(baseUrl: string, pageNumber: number): Promise<void> {
    if (pageNumber < 0 || this.cache.isLoaded(pageNumber)) {
      return Promise.resolve();
    }
    const pending = this.cache.pendingLoad(pageNumber);

    if (pending !== undefined) {
      return pending;
    }
    const loaded = fetchPostList(baseUrl, pageNumber)
      .then((html: string) => {
        this.cache.markLoaded(pageNumber, this.createPostListFromHtml(pageNumber, html));
      }).catch(() => {
        this.cache.remove(pageNumber);
      });

    this.cache.markLoading(pageNumber, loaded);
    return loaded;
  }

  public preloadAround(baseUrl: string, currentPageNumber: number): void {
    numbersAround(currentPageNumber, PREFETCH_LENGTH).forEach(n => this.load(baseUrl, n));
  }

  public createPostListFromHtml(pageNumber: number, html: string): PostList {
    const dom = new DOMParser().parseFromString(html, "text/html");
    const rawThumbs = Array.from(dom.querySelectorAll<HTMLElement>(`.${RAW_THUMB_CLASS_NAME}`));
    const posts = rawThumbs.map(parseThumb);
    const thumbs = preparePostListThumbs(rawThumbs, this.onMobileDevice, this.galleryDisabled);
    const paginator = dom.getElementById("paginator");
    return new PostList(pageNumber, thumbs, posts, paginator);
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

  public allPosts(): Post[] {
    return this.cache.allPosts();
  }

  public getPost(id: string): Post | undefined {
    return this.cache.getPost(id);
  }

  public markLoaded(pageNumber: number, page: PostList): void {
    this.cache.markLoaded(pageNumber, page);
  }
}
