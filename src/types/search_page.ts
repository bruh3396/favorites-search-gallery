import { extractSearchPageThumbs, findSearchPageExtensions, prepareSearchPageThumbs } from "../utils/misc/search_page_utils";
import { POSTS_PER_SEARCH_PAGE } from "../lib/global/constants";

const PARSER = new DOMParser();

export class SearchPage {
  public thumbs: HTMLElement[];
  public paginator: HTMLElement | null;
  public ids: Set<string>;
  public pageNumber: number;
  public isFinalPage: boolean;

  constructor(pageNumber: number, content: string | HTMLElement[]) {
    if (typeof content === "string") {
      const dom = PARSER.parseFromString(content, "text/html");

      this.thumbs = prepareSearchPageThumbs(extractSearchPageThumbs(dom));
      this.paginator = dom.getElementById("paginator");
    } else {
      this.thumbs = content;
      this.paginator = document.getElementById("paginator");
    }
    this.pageNumber = pageNumber;
    this.ids = new Set(this.thumbs.map(thumb => thumb.id));
    this.isFinalPage = this.thumbs.length < POSTS_PER_SEARCH_PAGE;
    findSearchPageExtensions(this.ids);
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
