import * as API from "../../../lib/api/api";
import * as Extensions from "../../../lib/global/extensions";
import { convertToTagSet, convertToTagString } from "../../../utils/primitive/string";
import { getAllThumbs, getImageFromThumb, waitForAllThumbnailsToLoad, waitForDOMToLoad } from "../../../utils/dom/dom";
import { Events } from "../../../lib/global/events/events";
import { ON_SEARCH_PAGE } from "../../../lib/global/flags/intrinsic_flags";
import { Post } from "../../../types/common_types";
import { prepareSearchPageThumbs } from "../types/search_page";

export async function prepareAllThumbsOnSearchPage(): Promise<void> {
  await waitForDOMToLoad();
  await waitForAllThumbnailsToLoad();
  const thumbs = getAllThumbs();

  prepareSearchPageThumbs(thumbs);
  findImageExtensions(thumbs);
  Events.searchPage.searchPageReady.emit();
}

async function findImageExtensions(thumbs: HTMLElement[]): Promise<void> {
  const posts = await API.fetchMultiplePostsFromAPI(thumbs.map(thumb => thumb.id));

  for (const post of Object.values(posts)) {
    if (post.width > 0) {
      Extensions.setExtensionFromPost(post);
      correctMediaTags(post);
    }
  }
}

function correctMediaTags(post: Post): void {
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
