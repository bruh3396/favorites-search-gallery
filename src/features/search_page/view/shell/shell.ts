import * as SearchPageDesktopMenu from "../../control/desktop_menu";
import { GALLERY_DISABLED, PERFORMANCE_PROFILE } from "../../../../app/context/flags";
import { insertHtml, insertStyle } from "../../../../utils/dom/injector";
import { Content } from "../../../../app/layout/shell";
import { ITEM_SELECTOR } from "../../../../lib/thumb/thumbs";
import { ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { PerformanceProfile } from "../../../../types/ui";
import SEARCH_PAGE_CSS from "../../../../assets/css/search_page.css";
import SEARCH_PAGE_HTML from "../../../../assets/html/search_page.html";
import { prepareSearchPageThumbs } from "../update/thumb_preparer";
import { waitForAllThumbnailsToLoad } from "../../../../app/layout/content_thumbs";
import { waitForDomToLoad } from "../../../../app/input/dom_events";

export function setup(): Promise<void> {
  removeNativeSearchPageThumbs();
  insertSearchPageMenu();
  insertContentContainer();
  hideUnusedOptions();
  SearchPageDesktopMenu.setup();
  return prepareNativeSearchPageThumbs();
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

export function hideUnusedOptions(): void {
  const hiddenSelectors = new Set<string>();

  if (GALLERY_DISABLED) {
    hiddenSelectors.add("#search-page-upscale-thumbs");
    hiddenSelectors.add("#search-page-autoplay");
  }

  if (ON_MOBILE_DEVICE) {
    hiddenSelectors.add("#search-page-upscale-thumbs");
    hiddenSelectors.add("#search-page-performance-profile");
    hiddenSelectors.add("#search-page-autoplay");
    hiddenSelectors.add(".post-action-btn");
    hiddenSelectors.add("#search-page-add-favorite-buttons");
    hiddenSelectors.add("#search-page-gallery-menu");
  }

  if (PERFORMANCE_PROFILE !== PerformanceProfile.Normal) {
    hiddenSelectors.add("#search-page-upscale-thumbs");
  }

  if (hiddenSelectors.size > 0) {
    insertStyle(`
      ${[...hiddenSelectors].join(",\n")} {
        display: none !important;
      }
    `);
  }
}

async function prepareNativeSearchPageThumbs(): Promise<void> {
  await waitForDomToLoad();
  await waitForAllThumbnailsToLoad();
  const thumbs = Array.from(document.querySelectorAll(ITEM_SELECTOR)) as HTMLElement[];

  prepareSearchPageThumbs(thumbs);
}
