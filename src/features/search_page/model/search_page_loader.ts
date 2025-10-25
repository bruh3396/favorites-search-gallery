import { ConcurrencyLimiter } from "../../../lib/components/concurrency_limiter";
import { Events } from "../../../lib/global/events/events";
import { NavigationKey } from "../../../types/common_types";
import { POSTS_PER_SEARCH_PAGE } from "../../../lib/global/constants";
import { SearchPage } from "../types/search_page";
import { getAllThumbs } from "../../../utils/dom/dom";
import { isForwardNavigationKey } from "../../../types/equivalence";
import { sleep } from "../../../utils/misc/async";

const SEARCH_PAGE_FETCH_LIMITER = new ConcurrencyLimiter(2);
const SEARCH_PAGE_PREFETCH_LENGTH = 6;
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
  const searchPage = new SearchPage(initialPageNumber, allThumbs);

  searchPages.set(initialPageNumber, searchPage);
  preloadSearchPages();
  Events.searchPage.searchPageCreated.emit(searchPage);
}

export function navigateSearchPages(direction: NavigationKey): SearchPage | null {
  const nextPageNumber = getAdjacentSearchPageNumber(direction);
  const searchPage = searchPages.get(nextPageNumber);

  if (nextPageNumber < 0) {
    return null;
  }

  if (searchPage === undefined || searchPage.isEmpty) {
    fetchedPageNumbers.delete(nextPageNumber);
    searchPages.delete(nextPageNumber);
    loadSearchPage(nextPageNumber);
    return null;
  }
  currentPageNumber = nextPageNumber;
  preloadSearchPages();
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
  return -1;
}

export function preloadSearchPages(): void {
  loadSearchPage(currentPageNumber);

  for (let i = 1; i < SEARCH_PAGE_PREFETCH_LENGTH; i += 1) {
    loadSearchPage(currentPageNumber - i);
    loadSearchPage(currentPageNumber + i);
  }
}

function loadSearchPage(pageNumber: number): Promise<void> {
  if (pageHasAlreadyBeenFetched(pageNumber) || pageNumber < 0) {
    return Promise.resolve();
  }
  fetchedPageNumbers.add(pageNumber);
  return SEARCH_PAGE_FETCH_LIMITER.run(() => {
    return fetchSearchPage(pageNumber)
      .then((html: string) => {
        registerNewPage(pageNumber, html);
      }).catch(() => {
        fetchedPageNumbers.delete(pageNumber);
        searchPages.delete(pageNumber);
      });
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
  return `${initialURL}&pid=${POSTS_PER_SEARCH_PAGE * pageNumber}`;
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
  return match === null ? 0 : Math.round(parseInt(match[1]) / POSTS_PER_SEARCH_PAGE);
}

function getInitialURL(): string {
  return location.href.replace(/&pid=(\d+)/, "");
}

function setAllThumbs(thumbs: HTMLElement[]): void {
  allThumbs = thumbs;
  Events.searchPage.allThumbsUpdated.emit(thumbs);
}

export async function getMoreResults(): Promise<HTMLElement[]> {
  const currentSearchPage = searchPages.get(currentPageNumber);

  if (currentSearchPage === undefined) {
    console.error(`Current search page undefined ${currentPageNumber}`);
    return [];
  }

  if (currentSearchPage.isFinalPage) {
    return [];
  }
  currentPageNumber += 1;
  let nextSearchPage = searchPages.get(currentPageNumber);

  if (nextSearchPage === undefined) {
    await loadSearchPage(currentPageNumber);
  }

  for (let attempts = 1; attempts < 8; attempts += 1) {
    if (nextSearchPage === undefined) {
      loadSearchPage(currentPageNumber);
      await sleep(500);
    } else {
      break;
    }
    nextSearchPage = searchPages.get(currentPageNumber);
  }

  if (nextSearchPage === undefined) {
    console.error(`Could not load next search page ${currentPageNumber}`);
    return [];
  }
  loadSearchPage(currentPageNumber + 1);
  return nextSearchPage.thumbs;
}

export function getInitialPageThumbs(): HTMLElement[] {
  const searchPage = getInitialSearchPage() ?? undefined;
  return searchPage === undefined ? [] : searchPage.thumbs;
}

export function getInitialSearchPage(): SearchPage | null {
  return searchPages.get(initialPageNumber) ?? null;
}

export function resetCurrentPageNumber(): void {
  currentPageNumber = initialPageNumber;
}
