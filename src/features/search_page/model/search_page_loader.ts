import { Events } from "../../../lib/global/events/events";
import { NavigationKey } from "../../../types/common_types";
import { SearchPage } from "../types/search_page";
import { getAllThumbs } from "../../../utils/dom/dom";
import { isForwardNavigationKey } from "../../../types/equivalence";

let searchPages: Map<number, SearchPage>;
let fetchedPageNumbers: Set<number>;
let initialPageNumber: number;
let currentPageNumber: number;
let initialURL = getInitialURL();
let allThumbs: HTMLElement[] = [];

export function setupSearchPageLoader(): void {
  searchPages = new Map();
  fetchedPageNumbers = new Set();
  initialPageNumber = getInitialPageNumber();
  currentPageNumber = initialPageNumber;
  initialURL = getInitialURL();
  setAllThumbs(Array.from(getAllThumbs()));
  searchPages.set(initialPageNumber, new SearchPage(initialPageNumber, allThumbs));
  preloadSearchPages();
}

export function navigateSearchPages(direction: NavigationKey): SearchPage | null {
  const nextSearchPageNumber = getAdjacentSearchPageNumber(direction);
  const searchPage = searchPages.get(nextSearchPageNumber);

  if (searchPage === undefined || searchPage.isEmpty) {
    Events.searchPage.returnSearchPage.emit(null);
    return null;
  }
  currentPageNumber = nextSearchPageNumber;
  preloadSearchPages();
  Events.searchPage.returnSearchPage.emit(searchPage);
  return searchPage;
}

function getAdjacentSearchPageNumber(direction: NavigationKey): number {
  const forward = isForwardNavigationKey(direction);
  return forward ? currentPageNumber + 1 : currentPageNumber - 1;
}

export function getPageNumberFromThumb(thumb: HTMLElement): number {
  for (const [pageNumber, searchPage] of searchPages.entries()) {
    if (searchPage.ids.has(thumb.id)) {
      return pageNumber;
    }
  }
  return 0;
}

export async function preloadSearchPages(): Promise<void> {
  const previousPageNumber = Math.max(0, currentPageNumber - 1);
  const nextPageNumber = currentPageNumber + 1;

  await loadSearchPage(currentPageNumber);
  await loadSearchPage(previousPageNumber);
  await loadSearchPage(nextPageNumber);
}

function loadSearchPage(pageNumber: number): Promise<void> {
  if (pageHasAlreadyBeenFetched(pageNumber)) {
    return Promise.resolve();
  }
  fetchedPageNumbers.add(pageNumber);
  return fetchSearchPage(pageNumber)
    .then((html: string) => {
      registerNewPage(pageNumber, html);
    }).catch(() => {
      fetchedPageNumbers.delete(pageNumber);
      searchPages.delete(pageNumber);
    });
}

function pageHasAlreadyBeenFetched(pageNumber: number): boolean {
  return searchPages.has(pageNumber) || fetchedPageNumbers.has(pageNumber);
}

function registerNewPage(pageNumber: number, html: string): void {
  searchPages.set(pageNumber, new SearchPage(pageNumber, html));
  updateAllThumbs();
}

function fetchSearchPage(pageNumber: number): Promise<string> {
  return fetch(getSearchPageURL(pageNumber))
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error(String(response.status));
    });
}

function getSearchPageURL(pageNumber: number): string {
  return `${initialURL}&pid=${42 * pageNumber}`;
}

function updateAllThumbs(): void {
  const sortedPageNumbers = Array.from(searchPages.keys()).sort();
  let thumbs: HTMLElement[] = [];

  for (const pageNumber of sortedPageNumbers) {
    const page = searchPages.get(pageNumber);

    if (page !== undefined) {
      thumbs = thumbs.concat(page.thumbs);
    }
  }
  setAllThumbs(thumbs);
}

function getInitialPageNumber(): number {
  const match = (/&pid=(\d+)/).exec(location.href);
  return match === null ? 0 : Math.round(parseInt(match[1]) / 42);
}

function getInitialURL(): string {
  return location.href.replace(/&pid=(\d+)/, "");
}

function setAllThumbs(thumbs: HTMLElement[]): void {
  allThumbs = thumbs;
  Events.searchPage.allThumbsUpdated.emit(thumbs);
}
