import { insertHtml, insertStyle } from "@/utils/dom/injector";
import { Content } from "@/app/layout/shell";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import POST_LIST_CSS from "@/assets/css/post_list/post_list.css";
import POST_LIST_HTML from "@/assets/html/post_list.html";

export function setup(): void {
  removeNativePostListThumbs();
  insertPostListMenu();
  insertContentContainer();
}

function removeNativePostListThumbs(): void {
  const thumbContainer = document.querySelector(".image-list");

  if (thumbContainer !== null) {
    thumbContainer.innerHTML = "";
  }
}

function insertPostListMenu(): void {
  const displayOptions = document.getElementById("displayOptions");

  if (displayOptions === null) {
    return;
  }
  const listItem = document.createElement("li");

  displayOptions.appendChild(listItem);
  insertStyle(POST_LIST_CSS);
  insertHtml(listItem, "beforeend", POST_LIST_HTML);

  if (ON_MOBILE_DEVICE) {
    insertStyle(`#post-list-upscale-thumbs {
      display: none;
    }`);
  }
}

function insertContentContainer(): void {
  const nativeContent = document.querySelector(".content");

  if (nativeContent !== null) {
    nativeContent.insertAdjacentElement("afterbegin", Content);
  }
}
