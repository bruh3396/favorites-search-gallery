import { insertHtmlWithStyles, insertStyle } from "../../../utils/dom/injector";
import { Content } from "../../../lib/shell";
import { ON_MOBILE_DEVICE } from "../../../lib/environment/environment";
import { Preferences } from "../../../lib/preferences/preferences";
import { SEARCH_PAGE_HTML } from "../../../assets/html";
import { createDynamicSearchPageMenuElements } from "./search_page_dynamic_elements";
import { prepareAllThumbsOnSearchPage as prepareNativeSearchPageThumbs } from "./search_page_preparer";
import { styleSearchPageMenu } from "./search_page_menu_styler";
import { toggleAddOrRemoveButtons } from "../../../lib/ui/toggles";

function removeNativeSearchPageThumbs(): void {
  const thumbContainer = document.querySelector(".image-list");

  if (thumbContainer !== null) {
    thumbContainer.innerHTML = "";
  }
}

function insertContentContainer(): void {
  const nativeContent = document.querySelector(".content");

  if (nativeContent !== null) {
    nativeContent.insertAdjacentElement("afterbegin", Content);
  }
}

function insertSearchPageHTML(): void {
  const displayOptions = document.getElementById("displayOptions");

  if (displayOptions === null) {
    return;
  }
  const listItem = document.createElement("li");

  displayOptions.appendChild(listItem);
  insertHtmlWithStyles(listItem, "beforeend", SEARCH_PAGE_HTML);

  if (ON_MOBILE_DEVICE) {
    insertStyle(`#search-page-upscale-thumbs {
      display: none;
    }`);
  }
}

export function buildSearchPage(): void {
  removeNativeSearchPageThumbs();
  prepareNativeSearchPageThumbs();
  insertSearchPageHTML();
  insertContentContainer();
  createDynamicSearchPageMenuElements();
  styleSearchPageMenu();
  toggleAddOrRemoveButtons(Preferences.searchPageAddButtonsVisible.value);
}
