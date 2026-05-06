import { POSTS_PER_SEARCH_PAGE } from "../../../lib/environment/constants";
import { domParser } from "../../../lib/dom/dom_parser";
import { prepareSearchPageThumbs } from "../model/thumb_preparer";

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
