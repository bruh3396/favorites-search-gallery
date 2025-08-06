import * as Extensions from "../lib/global/extensions";
import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../lib/global/flags/intrinsic_flags";
import { convertToTagSet, convertToTagString, getContentType, removeNonNumericCharacters } from "../utils/primitive/string";
import { getAllThumbs, getIdFromThumb, getImageFromThumb } from "../utils/dom/dom";
import { Post } from "./api/api_types";
import { fetchPostFromAPI } from "../lib/api/api";
import { moveTagsFromTitleToTagsAttribute } from "../utils/dom/tags";
import { sleep } from "../utils/misc/async";

const PARSER = new DOMParser();

export function prepareThumbsOnSearchPage(thumbs: HTMLElement[]): HTMLElement[] {
  for (const thumb of thumbs) {
    prepareThumb(thumb);
  }
  return thumbs;
}

export async function prepareAllThumbsOnSearchPage(): Promise<void> {
  await sleep(400);
  const thumbs = getAllThumbs();

  prepareThumbsOnSearchPage(thumbs);
  findImageExtensions(thumbs);
}

function prepareThumb(thumb: HTMLElement): void {
  moveTagsFromTitleToTagsAttribute(thumb);
  assignContentType(thumb);
  thumb.id = removeNonNumericCharacters(getIdFromThumb(thumb));

  if (ON_MOBILE_DEVICE) {
    prepareMobileThumb(thumb);
  }
}

function extractSearchPageThumbs(dom: Document): HTMLElement[] {
  const thumbs = Array.from(dom.querySelectorAll(".thumb")).filter(thumb => thumb instanceof HTMLElement);
  return prepareThumbsOnSearchPage(thumbs);
}

async function findImageExtensions(thumbs: HTMLElement[]): Promise<void> {
  for (const thumb of thumbs) {
    await sleep(5);
    findImageExtension(thumb);
  }
}

export async function findImageExtension(thumb: HTMLElement): Promise<void> {
  const post = await fetchPostFromAPI(thumb.id);

  Extensions.setExtensionFromPost(post);
  correctMediaTags(thumb, post);
}

function correctMediaTags(thumb: HTMLElement, post: Post): void {
  if (!ON_SEARCH_PAGE) {
    return;
  }
  const tagSet = convertToTagSet(post.tags);
  const isVideo = post.fileURL.endsWith("mp4");
  const isGif = post.fileURL.endsWith("gif");
  const isImage = !isVideo && !isGif;
  const documentThumb = document.getElementById(thumb.id);

  if (isImage) {
    removeAnimatedTags(tagSet);
    removeAnimatedAttributes(thumb);
    removeAnimatedAttributes(documentThumb);
  } else if (isVideo) {
    tagSet.add("video");
  } else if (isGif) {
    tagSet.add("gif");
  }
  setThumbTagsOnSearchPage(thumb, convertToTagString(tagSet));
  setThumbTagsOnSearchPage(documentThumb, convertToTagString(tagSet));
}

function setThumbTagsOnSearchPage(thumb: HTMLElement | null, tags: string): void {
  if (thumb === null) {
    return;
  }
  const image = getImageFromThumb(thumb);

  if (image === null) {
    return;
  }
  image.setAttribute("tags", tags);
}

function removeAnimatedTags(tagSet: Set<string>): void {
  tagSet.delete("animated");
  tagSet.delete("video");
  tagSet.delete("mp4");
  tagSet.delete("gif");
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

function removeAnimatedAttributes(thumb: HTMLElement | null): void {
  if (thumb === null) {
    return;
  }
  thumb.classList.remove("video");
  thumb.classList.remove("gif");

  const image = getImageFromThumb(thumb);

  if (image === null) {
    return;
  }
  image.classList.remove("video");
  image.classList.remove("gif");
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

export class SearchPage {
  public html: string;
  public thumbs: HTMLElement[];
  public paginator: HTMLElement | null;
  public ids: Set<string>;
  public pageNumber: number;

  constructor(pageNumber: number, html: string) {
    const dom = PARSER.parseFromString(html, "text/html");

    this.html = html;
    this.thumbs = extractSearchPageThumbs(dom);
    this.pageNumber = pageNumber;
    this.paginator = dom.getElementById("paginator");
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
