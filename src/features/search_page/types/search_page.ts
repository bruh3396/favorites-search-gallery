import { getContentType, removeNonNumericCharacters } from "../../../utils/primitive/string";
import { getIdFromThumb, getImageFromThumb } from "../../../utils/dom/dom";
import { GALLERY_DISABLED } from "../../../lib/global/flags/derived_flags";
import { MAX_RESULTS_PER_SEARCH_PAGE } from "../../../lib/global/preferences/constants";
import { ON_MOBILE_DEVICE } from "../../../lib/global/flags/intrinsic_flags";
import { moveTagsFromTitleToTagsAttribute } from "../../../utils/dom/tags";

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
      this.paginator = null;
    }
    this.pageNumber = pageNumber;
    this.ids = new Set(this.thumbs.map(thumb => thumb.id));
    this.isFinalPage = this.thumbs.length < MAX_RESULTS_PER_SEARCH_PAGE;
  }

  public get isEmpty(): boolean {
    return this.thumbs.length === 0;
  }

  public get isLast(): boolean {
    return this.thumbs.length < 42;
  }

  public get isFirst(): boolean {
    return this.pageNumber === 0;
  }
}

export const PARSER = new DOMParser();

function extractSearchPageThumbs(dom: Document): HTMLElement[] {
  return Array.from(dom.querySelectorAll(".thumb")).filter(thumb => thumb instanceof HTMLElement);
}

export function prepareSearchPageThumbs(thumbs: HTMLElement[]): HTMLElement[] {
  thumbs.forEach(thumb => prepareThumb(thumb));
  return thumbs;
}

function prepareThumb(thumb: HTMLElement): void {
  moveTagsFromTitleToTagsAttribute(thumb);
  assignContentType(thumb);
  addCanvas(thumb);
  thumb.id = removeNonNumericCharacters(getIdFromThumb(thumb));
  thumb.classList.remove("thumb");
  thumb.classList.add("favorite");

  if (ON_MOBILE_DEVICE) {
    prepareMobileThumb(thumb);
  }
}

function addCanvas(thumb: HTMLElement): void {
  if (GALLERY_DISABLED || thumb.querySelector("canvas") !== null) {
    return;
  }
  const anchor = thumb.querySelector("a");

  if (anchor !== null) {
    anchor.appendChild(document.createElement("canvas"));
  }
}

function assignContentType(thumb: HTMLElement): void {
  thumb.classList.remove("image");
  thumb.classList.remove("video");
  thumb.classList.remove("gif");

  const image = getImageFromThumb(thumb);

  if (image === null) {
    return;
  }
  const tags = image.getAttribute("tags") ?? "";

  image.classList.add(getContentType(tags));
}

function prepareMobileThumb(thumb: HTMLElement): void {
  for (const script of thumb.querySelectorAll("script")) {
    script.remove();
  }
  const image = getImageFromThumb(thumb);

  if (image === null) {
    return;
  }
  image.removeAttribute("style");
  const altSource = image.getAttribute("data-cfsrc");

  if (altSource !== null) {
    image.setAttribute("src", altSource);
    image.removeAttribute("data-cfsrc");
  }
}
