import { NavigationKey } from "../../../types/input";
import { POSTS_PER_SEARCH_PAGE } from "../../../lib/environment/constants";
import { SearchPage } from "./search_page";
import { ThrottledQueue } from "../../../lib/core/concurrency/throttled_queue";
import { fetchSearchPage } from "../../../lib/server/fetch/search_page_fetcher";
import { getAllPageThumbs } from "../../../lib/dom/content_thumb";
import { isForwardNavigationKey } from "../../../types/guards";
import { sleep } from "../../../lib/core/scheduling/promise";

const SEARCH_PAGE_FETCH_LIMITER = new ThrottledQueue(1250);
const SEARCH_PAGE_PREFETCH_LENGTH = 6;
let searchPages: Map<number, SearchPage>;
let fetchedPageNumbers: Set<number>;
let initialPageNumber: number;
let currentPageNumber: number;
let baseUrl = getBaseUrl();
let allThumbs: HTMLElement[] = [];
let initialSearchPage: SearchPage;

export function setupSearchPageLoader(): void {
  searchPages = new Map();
  fetchedPageNumbers = new Set();
  initialPageNumber = getInitialPageNumber();
  currentPageNumber = initialPageNumber;
  baseUrl = getBaseUrl();
  setAllThumbs(Array.from(getAllPageThumbs()));
  initialSearchPage = new SearchPage(initialPageNumber, allThumbs);

  searchPages.set(initialPageNumber, initialSearchPage);
  preloadSearchPages();
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

export function preloadSearchPages(): void {
  loadSearchPage(currentPageNumber);

  for (let i = 1; i < SEARCH_PAGE_PREFETCH_LENGTH; i += 1) {
    loadSearchPage(currentPageNumber - i);
    loadSearchPage(currentPageNumber + i);
  }
}

async function loadSearchPage(pageNumber: number): Promise<void> {
  if (pageHasAlreadyBeenFetched(pageNumber) || pageNumber < 0) {
    return Promise.resolve();
  }
  fetchedPageNumbers.add(pageNumber);
  await SEARCH_PAGE_FETCH_LIMITER.wait();
  return fetchSearchPage(baseUrl, pageNumber)
    .then((html: string) => {
      registerNewPage(pageNumber, html);
      updateAllThumbs();
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

function getBaseUrl(): string {
  return location.href.replace(/&pid=(\d+)/, "");
}

function setAllThumbs(thumbs: HTMLElement[]): void {
  allThumbs = thumbs;
}

export function getAllSearchPageThumbs(): HTMLElement[] {
  return allThumbs;
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

export function getInitialSearchPage(): SearchPage {
  return initialSearchPage;
}

export function resetCurrentPageNumber(): void {
  currentPageNumber = initialPageNumber;
}
