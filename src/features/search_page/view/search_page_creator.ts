import * as Layout from "../../../lib/layout/layout";
import { POSTS_PER_SEARCH_PAGE } from "../../../lib/environment/constants";
import { SEARCH_PAGE_INFINITE_SCROLL_HTML } from "../../../assets/html";
import { SearchPage } from "../model/search_page";
import { insertStyle } from "../../../utils/dom/injector";

function updatePaginator(searchPage: SearchPage): void {
  if (searchPage.paginator === null) {
    return;
  }
  const currentPaginator = document.getElementById("paginator");
  const placeToInsert = currentPaginator;

  if (placeToInsert === null) {
    return;
  }
  placeToInsert.insertAdjacentElement("afterend", searchPage.paginator);

  if (currentPaginator !== null) {
    currentPaginator.remove();
  }
}

function updateAddressBar(searchPage: SearchPage): void {
  const baseUrl = location.origin + location.pathname;
  const searchFragment = `${location.search.replace(/&pid=\d+/g, "")}&pid=${searchPage.pageNumber * POSTS_PER_SEARCH_PAGE}`;

  window.history.replaceState(null, "", baseUrl + searchFragment);
}

export function createSearchPage(searchPage: SearchPage): void {
  Layout.tile(searchPage.thumbs);
  updatePaginator(searchPage);
  updateAddressBar(searchPage);
}

export function toggleInfiniteScroll(value: boolean): void {
  insertStyle(value ? SEARCH_PAGE_INFINITE_SCROLL_HTML : "", "search-page-infinite-scroll");
}
