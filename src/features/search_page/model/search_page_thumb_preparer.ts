import * as FavoritesAPI from "../../../lib/server/fetch/favorites_fetcher";
import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../../../lib/environment/environment";
import { convertToTagSet, convertToTagString } from "../../../utils/string/tags";
import { getIdFromThumb, getImageFromThumb } from "../../../lib/dom/thumb";
import { ADD_FAVORITE_IMAGE_HTML } from "../../../assets/images";
import { ClickCode } from "../../../types/input";
import { GALLERY_DISABLED } from "../../../lib/environment/derived_environment";
import { Post } from "../../../types/post";
import { removeNonNumericCharacters } from "../../../utils/string/format";
import { resolveMediaType } from "../../../lib/media/media_type_resolver";

function moveTagsFromTitleToTagsAttribute(thumb: HTMLElement): void {
  const image = getImageFromThumb(thumb);

  if (image === null || !image.hasAttribute("title")) {
    return;
  }
  image.setAttribute("tags", image.title);
  image.removeAttribute("title");
}

function prepareThumb(thumb: HTMLElement): void {
  moveTagsFromTitleToTagsAttribute(thumb);
  assignMediaType(thumb);
  addAddFavoriteButton(thumb);
  addCanvas(thumb);
  thumb.id = removeNonNumericCharacters(getIdFromThumb(thumb));
  thumb.classList.remove("thumb");
  thumb.classList.add("favorite");

  if (ON_MOBILE_DEVICE) {
    prepareMobileThumb(thumb);
  }
}

function addAddFavoriteButton(thumb: HTMLElement): void {
  const anchor = thumb.querySelector("a");

  if (anchor === null) {
    return;
  }
  anchor.insertAdjacentHTML("beforeend", ADD_FAVORITE_IMAGE_HTML);
  const button = anchor.querySelector(".add-favorite-button");

  if (!(button instanceof HTMLElement)) {
    return;
  }

  button.onmousedown = (event): void => {
    event.stopPropagation();

    if (event.button === ClickCode.LEFT) {
      FavoritesAPI.addFavorite(thumb.id);
      button.remove();
    }
  };
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

function assignMediaType(thumb: HTMLElement): void {
  thumb.classList.remove("image");
  thumb.classList.remove("video");
  thumb.classList.remove("gif");

  const image = getImageFromThumb(thumb);

  if (image === null) {
    return;
  }
  const tags = image.getAttribute("tags") ?? "";

  image.classList.add(resolveMediaType(tags));
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

export function correctMediaTags(post: Post): void {
  if (!ON_SEARCH_PAGE) {
    return;
  }
  const thumb = document.getElementById(post.id);

  if (thumb === null) {
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
  const tagString = convertToTagString(tagSet);

  setThumbTagsOnSearchPage(thumb, tagString);
  setThumbTagsOnSearchPage(documentThumb, tagString);
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

export function prepareSearchPageThumbs(thumbs: HTMLElement[]): HTMLElement[] {
  thumbs.forEach(thumb => prepareThumb(thumb));
  return thumbs;
}
