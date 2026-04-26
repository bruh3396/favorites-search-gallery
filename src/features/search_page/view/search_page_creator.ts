import * as Layout from "../../../lib/layout/layout";
import { POSTS_PER_SEARCH_PAGE } from "../../../lib/environment/constants";
import { SEARCH_PAGE_INFINITE_SCROLL_HTML } from "../../../assets/html";
import { SearchPage } from "../../../types/search_page";
import { insertStyleHTML } from "../../../utils/dom/style";

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
  const baseURL = location.origin + location.pathname;
  const searchFragment = `${location.search.replace(/&pid=\d+/g, "")}&pid=${searchPage.pageNumber * POSTS_PER_SEARCH_PAGE}`;

  window.history.replaceState(null, "", baseURL + searchFragment);
}

export function createSearchPage(searchPage: SearchPage): void {
  Layout.tile(searchPage.thumbs);
  updatePaginator(searchPage);
  updateAddressBar(searchPage);
}

export function toggleInfiniteScroll(value: boolean): void {
  insertStyleHTML(value ? SEARCH_PAGE_INFINITE_SCROLL_HTML : "", "search-page-infinite-scroll");
}
