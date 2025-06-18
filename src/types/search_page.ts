import * as Extensions from "../store/indexed_db/extensions";
import { convertToTagSet, convertToTagString, getContentType, removeNonNumericCharacters } from "../utils/primitive/string";
import { getAllThumbs, getIdFromThumb, getImageFromThumb } from "../utils/dom/dom";
import { ON_SEARCH_PAGE } from "../lib/globals/flags";
import { Post } from "./api/api_types";
import { fetchPostFromAPI } from "../lib/api/api";
import { moveTagsFromTitleToTagsAttribute } from "../utils/dom/tags";

const PARSER = new DOMParser();

export function prepareThumbsOnSearchPage(thumbs: HTMLElement[]): void {
  for (const thumb of thumbs) {
    prepareThumb(thumb);
  }
}

export function prepareAllThumbsOnSearchPage(): void {
  prepareThumbsOnSearchPage(getAllThumbs());
}

function prepareThumb(thumb: HTMLElement): void {
  moveTagsFromTitleToTagsAttribute(thumb);
  assignContentType(thumb);
  // findImageExtension(thumb);
  thumb.id = removeNonNumericCharacters(getIdFromThumb(thumb));
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

export class SearchPage {
  public html: string;
  public thumbs: HTMLElement[];
  public paginator: HTMLElement | null;
  public ids: Set<string>;
  public pageNumber: number;

  constructor(pageNumber: number, html: string) {
    const dom = PARSER.parseFromString(html, "text/html");

    this.html = html;
    this.thumbs = Array.from(dom.querySelectorAll(".thumb"));
    prepareThumbsOnSearchPage(this.thumbs);
    this.pageNumber = pageNumber;
    this.paginator = dom.getElementById("paginator");
    this.ids = new Set(this.thumbs.map(thumb => thumb.id));

    // if (GeneralSettings.preloadThumbnails) {
    //   preloadThumbs(this.thumbs);
    // }
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
