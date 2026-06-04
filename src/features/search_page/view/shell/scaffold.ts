import { insertHtml, insertStyle } from "@/utils/dom/injector";
import { Content } from "@/app/layout/shell";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import SEARCH_PAGE_CSS from "@/assets/css/search_page.css";
import SEARCH_PAGE_HTML from "@/assets/html/search_page.html";

export function setup(): void {
  removeNativeSearchPageThumbs();
  insertSearchPageMenu();
  insertContentContainer();
}

function removeNativeSearchPageThumbs(): void {
  const thumbContainer = document.querySelector(".image-list");

  if (thumbContainer !== null) {
    thumbContainer.innerHTML = "";
  }
}

function insertSearchPageMenu(): void {
  const displayOptions = document.getElementById("displayOptions");

  if (displayOptions === null) {
    return;
  }
  const listItem = document.createElement("li");

  displayOptions.appendChild(listItem);
  insertStyle(SEARCH_PAGE_CSS);
  insertHtml(listItem, "beforeend", SEARCH_PAGE_HTML);

  if (ON_MOBILE_DEVICE) {
    insertStyle(`#search-page-upscale-thumbs {
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
