import * as ContentTiler from "../../../app/layout/content_tiler";
import { POSTS_PER_SEARCH_PAGE } from "../../../lib/environment/rule34_constants";
import { SearchPage } from "../types/search_page";

export function render(searchPage: SearchPage): void {
  ContentTiler.tile(searchPage.thumbs);
  updatePaginator(searchPage);
  updateAddressBar(searchPage);
}

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
