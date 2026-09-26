import { ITEM_CLASS_NAME, RAW_THUMB_CLASS_NAME, TILE_CLASS_NAME } from "@/lib/ui/thumb/selectors";
import { actionBarHtml, stampActionBarId } from "@/lib/ui/thumb/action_bar";
import { getImageFromThumb } from "@/lib/ui/thumb/query";
import { parseIdFromThumb } from "@/lib/ui/thumb/post_id";
import { removeNonNumericCharacters } from "@/utils/pure/string";
import { resolveMediaType } from "@/lib/media/media_type";
import { setDataset } from "@/utils/browser/dataset";

export function preparePostListThumbs(thumbs: HTMLElement[], onMobileDevice: boolean, galleryDisabled: boolean): HTMLElement[] {
  thumbs.forEach(thumb => prepareThumb(thumb, onMobileDevice, galleryDisabled));
  return thumbs;
}

function prepareThumb(thumb: HTMLElement, onMobileDevice: boolean, galleryDisabled: boolean): void {
  moveTagsFromTitleToTagsAttribute(thumb);
  assignMediaType(thumb);
  addCanvas(thumb, galleryDisabled);
  addActionBar(thumb);
  thumb.id = removeNonNumericCharacters(parseIdFromThumb(thumb));
  stampActionBarId(thumb);
  thumb.classList.remove(RAW_THUMB_CLASS_NAME);
  thumb.classList.add(ITEM_CLASS_NAME, TILE_CLASS_NAME);
  prepareMobileThumb(thumb, onMobileDevice);
}

function moveTagsFromTitleToTagsAttribute(thumb: HTMLElement): void {
  const image = getImageFromThumb(thumb);

  if (image === null || !image.hasAttribute("title")) {
    return;
  }
  image.setAttribute("tags", image.title);
  image.removeAttribute("title");
}

function assignMediaType(thumb: HTMLElement): void {
  const image = getImageFromThumb(thumb);

  if (image === null) {
    return;
  }
  const tags = image.getAttribute("tags") ?? "";

  setDataset(thumb, "mediaType", resolveMediaType(tags));
}

function addCanvas(thumb: HTMLElement, galleryDisabled: boolean): void {
  if (galleryDisabled || thumb.querySelector("canvas") !== null) {
    return;
  }
  const anchor = thumb.querySelector("a");

  if (anchor !== null) {
    anchor.appendChild(document.createElement("canvas"));
  }
}

function addActionBar(thumb: HTMLElement): void {
  const anchor = thumb.querySelector("a");

  if (anchor !== null) {
    anchor.insertAdjacentHTML("beforeend", actionBarHtml(false));
  }
}

function prepareMobileThumb(thumb: HTMLElement, onMobileDevice: boolean): void {
  if (!onMobileDevice) {
    return;
  }

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
