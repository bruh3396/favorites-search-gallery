import { PARSER, extractSearchPageThumbs } from "../utils/dom/search_page_utils";

export class SearchPage {
  public thumbs: HTMLElement[];
  public paginator: HTMLElement | null;
  public ids: Set<string>;
  public pageNumber: number;

  constructor(pageNumber: number, content: string | HTMLElement[]) {

    if (typeof content === "string") {
      const dom = PARSER.parseFromString(content, "text/html");

      this.thumbs = extractSearchPageThumbs(dom);
      this.paginator = dom.getElementById("paginator");
    } else {
      this.thumbs = content;
      this.paginator = null;
    }
    this.pageNumber = pageNumber;
    this.ids = new Set(this.thumbs.map(thumb => thumb.id));
  }

  public get isEmpty(): boolean {
    return this.thumbs.length === 0;
  }

  public get isLastPage(): boolean {
    return this.thumbs.length < 42;
  }

  public get isFirstPage(): boolean {
    return this.pageNumber === 0;
  }
}
