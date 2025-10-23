import { insertHTMLAndExtractStyle, insertStyleHTML } from "../../../utils/dom/style";
import { CONTENT_CONTAINER } from "../../../lib/global/content/content_container";
import { ON_MOBILE_DEVICE } from "../../../lib/global/flags/intrinsic_flags";
import { SEARCH_PAGE_HTML } from "../../../assets/html";
import { createDynamicSearchPageMenuElements } from "./search_page_dynamic_elements";
import { waitForDOMToLoad } from "../../../utils/dom/dom";

function hideNativeSearchPageThumbs(): void {
  const thumbContainer = document.querySelector(".image-list");

  if (thumbContainer !== null) {
    thumbContainer.innerHTML = "";
  }
}

function insertContentContainer(): void {
  // hazardous: depends on site HTML
  const content = document.querySelector(".content");

  if (content !== null) {
    content.insertAdjacentElement("afterbegin", CONTENT_CONTAINER);
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
  insertSearchPageHTML();
  hideNativeSearchPageThumbs();
  insertContentContainer();
  createDynamicSearchPageMenuElements();
}
