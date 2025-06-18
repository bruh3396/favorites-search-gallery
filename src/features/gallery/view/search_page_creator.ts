import { SearchPage } from "../../../types/search_page";
import { waitForDOMToLoad } from "../../../utils/dom/dom";

let thumbContainer: HTMLElement | null = null;

function getMainThumbnailContainer(): HTMLElement | null {
  const thumb = document.querySelector(".thumb");

  if (thumb !== null) {
    return thumb.parentElement;
  }
  return document.querySelector(".image-list");
}

function insertNewThumbs(searchPage: SearchPage): void {
  if (thumbContainer === null) {
    return;
  }
  thumbContainer.innerHTML = "";

  for (const thumb of searchPage.thumbs) {
    thumbContainer.appendChild(thumb);
  }
}

function updatePaginator(searchPage: SearchPage): void {
  if (searchPage.paginator === null) {
    return;
  }
  const currentPaginator = document.getElementById("paginator");
  const placeToInsert = currentPaginator || thumbContainer;

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
  const searchFragment = `${location.search.replace(/&pid=\d+/g, "")}&pid=${searchPage.pageNumber * 42}`;

  window.history.replaceState(null, "", baseURL + searchFragment);
}

export async function setupSearchPageCreator(): Promise<void> {
  await waitForDOMToLoad();
  thumbContainer = getMainThumbnailContainer();
}

export function createSearchPage(searchPage: SearchPage): void {
  insertNewThumbs(searchPage);
  updatePaginator(searchPage);
  updateAddressBar(searchPage);
}
