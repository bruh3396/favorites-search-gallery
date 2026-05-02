import * as ExtensionCache from "../../../lib/media/extension_cache";
import { correctMediaTags, prepareSearchPageThumbs } from "./search_page_thumb_preparer";
import { POSTS_PER_SEARCH_PAGE } from "../../../lib/environment/constants";
import { domParser } from "../../../utils/dom/dom_parser";
import { fetchMultiplePostsFromAPI } from "../../../lib/server/fetch/post_fetcher";

export async function cacheSearchPageExtensions(ids: Iterable<string>): Promise<void> {
  const posts = await fetchMultiplePostsFromAPI(Array.from(ids));

  for (const post of Object.values(posts)) {
    if (post.width > 0) {
      ExtensionCache.setExtensionFromPost(post);
      correctMediaTags(post);
    }
  }
}

export class SearchPage {
  public thumbs: HTMLElement[];
  public paginator: HTMLElement | null;
  public ids: Set<string>;
  public pageNumber: number;
  public isFinalPage: boolean;

  constructor(pageNumber: number, nativeContent: string | HTMLElement[]) {
    if (typeof nativeContent === "string") {
      const dom = domParser.parseFromString(nativeContent, "text/html");

      this.thumbs = prepareSearchPageThumbs(Array.from(dom.querySelectorAll(".thumb")));
      this.paginator = dom.getElementById("paginator");
    } else {
      this.thumbs = nativeContent;
      this.paginator = document.getElementById("paginator");
    }
    this.pageNumber = pageNumber;
    this.ids = new Set(this.thumbs.map(thumb => thumb.id));
    this.isFinalPage = this.thumbs.length < POSTS_PER_SEARCH_PAGE;
    cacheSearchPageExtensions(this.ids);
  }

  public get isEmpty(): boolean {
    return this.thumbs.length === 0;
  }

  public get isLast(): boolean {
    return this.thumbs.length < POSTS_PER_SEARCH_PAGE;
  }

  public get isFirst(): boolean {
    return this.pageNumber === 0;
  }
}
