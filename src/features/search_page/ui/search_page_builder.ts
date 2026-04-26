import { insertHTMLAndExtractStyle, insertStyleHTML } from "../../../utils/dom/style";
import { CONTENT } from "../../../lib/shell";
import { ON_MOBILE_DEVICE } from "../../../lib/environment/environment";
import { Preferences } from "../../../lib/preferences";
import { SEARCH_PAGE_HTML } from "../../../assets/html";
import { createDynamicSearchPageMenuElements } from "./search_page_dynamic_elements";
import { prepareAllThumbsOnSearchPage } from "./search_page_preparer";
import { styleSearchPageMenu } from "./search_page_menu_styler";
import { toggleAddOrRemoveButtons } from "../../../utils/dom/ui_element";
import { waitForDOMToLoad } from "../../../utils/dom/dom";

function removeOriginalSearchPageThumbs(): void {
  const thumbContainer = document.querySelector(".image-list");

  if (thumbContainer !== null) {
    thumbContainer.innerHTML = "";
  }
}

function insertContentContainer(): void {
  const content = document.querySelector(".content");

  if (content !== null) {
    content.insertAdjacentElement("afterbegin", CONTENT);
  }
}

function insertSearchPageHTML(): void {
  const displayOptions = document.getElementById("displayOptions");

  if (displayOptions === null) {
    return;
  }
  const listItem = document.createElement("li");

  displayOptions.appendChild(listItem);
  insertHTMLAndExtractStyle(listItem, "beforeend", SEARCH_PAGE_HTML);

  if (ON_MOBILE_DEVICE) {
    insertStyleHTML(`#search-page-upscale-thumbs {
      display: none;
    }`);
  }
}

export async function buildSearchPage(): Promise<void> {
  await waitForDOMToLoad();
  removeOriginalSearchPageThumbs();
  insertSearchPageHTML();
  insertContentContainer();
  createDynamicSearchPageMenuElements();
  prepareAllThumbsOnSearchPage();
  styleSearchPageMenu();
  toggleAddOrRemoveButtons(Preferences.searchPageAddButtonsVisible.value);
}
