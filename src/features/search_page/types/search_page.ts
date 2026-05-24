import { POSTS_PER_SEARCH_PAGE } from "../../../lib/environment/rule34_constants";

export class SearchPage {
  public thumbs: HTMLElement[];
  public paginator: HTMLElement | null;
  public ids: Set<string>;
  public pageNumber: number;

  constructor(pageNumber: number, thumbs: HTMLElement[], paginator: HTMLElement | null) {
    this.thumbs = thumbs;
    this.paginator = paginator;
    this.pageNumber = pageNumber;
    this.ids = new Set(this.thumbs.map(thumb => thumb.id));
  }

  public get isEmpty(): boolean {
    return this.thumbs.length === 0;
  }

  public get isFirst(): boolean {
    return this.pageNumber === 0;
  }

  public get isLast(): boolean {
    return this.thumbs.length < POSTS_PER_SEARCH_PAGE;
  }
}
