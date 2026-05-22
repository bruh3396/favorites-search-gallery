import { insertHtml, insertStyle } from "../../../lib/dom/injector";
import { Content } from "../../../app/shell/shell";
import { ON_MOBILE_DEVICE } from "../../../lib/environment/environment";
import { Preferences } from "../../../app/state/preferences";
import SEARCH_PAGE_CSS from "../../../assets/css/search_page.css";
import SEARCH_PAGE_HTML from "../../../assets/html/search_page.html";
import { createDynamicSearchPageMenuElements } from "./elements";
import { prepareAllThumbsOnSearchPage as prepareNativeSearchPageThumbs } from "./preparer";
import { styleSearchPageMenu } from "./menu_styler";
import { toggleAddOrRemoveButtons } from "../../../lib/ui/toggles";

export function buildSearchPage(): void {
  removeNativeSearchPageThumbs();
  prepareNativeSearchPageThumbs();
  insertSearchPageHtml();
  insertContentContainer();
  createDynamicSearchPageMenuElements();
  styleSearchPageMenu();
  toggleAddOrRemoveButtons(Preferences.searchPageAddButtonsVisible.value);
}

function removeNativeSearchPageThumbs(): void {
  const thumbContainer = document.querySelector(".image-list");

  if (thumbContainer !== null) {
    thumbContainer.innerHTML = "";
  }
}

function insertSearchPageHtml(): void {
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
