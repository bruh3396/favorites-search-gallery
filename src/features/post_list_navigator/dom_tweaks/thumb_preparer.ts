import { ITEM_CLASS_NAME, RAW_THUMB_CLASS_NAME, getIdFromThumb, getImageFromThumb } from "@/lib/thumb/thumbs";
import { ADD_FAVORITE_IMAGE_HTML } from "@/assets/images";
import { GALLERY_DISABLED } from "@/app/context/flags";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { removeNonNumericCharacters } from "@/utils/string/format";
import { resolveMediaType } from "@/lib/media/media_type_resolver";

export function preparePostListThumbs(thumbs: HTMLElement[]): HTMLElement[] {
  thumbs.forEach(thumb => prepareThumb(thumb));
  return thumbs;
}

function prepareThumb(thumb: HTMLElement): void {
  moveTagsFromTitleToTagsAttribute(thumb);
  assignMediaType(thumb);
  addAddFavoriteButton(thumb);
  addCanvas(thumb);
  thumb.id = removeNonNumericCharacters(getIdFromThumb(thumb));
  thumb.classList.remove(RAW_THUMB_CLASS_NAME);
  thumb.classList.add(ITEM_CLASS_NAME);
  prepareMobileThumb(thumb);
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

function addAddFavoriteButton(thumb: HTMLElement): void {
  const anchor = thumb.querySelector("a");

  if (anchor === null) {
    return;
  }
  anchor.insertAdjacentHTML("beforeend", ADD_FAVORITE_IMAGE_HTML);
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

function prepareMobileThumb(thumb: HTMLElement): void {
  if (!ON_MOBILE_DEVICE) {
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
