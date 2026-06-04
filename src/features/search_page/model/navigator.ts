import * as SearchPageLoader from "@/features/search_page/model/page_loader";
import * as SearchPageUrlContext from "@/features/search_page/model/url_context";
import { Boundary } from "@/types/boundary";
import { NavigationKey } from "@/types/input";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { SearchPage } from "@/features/search_page/types/search_page";
import { SearchPageNavigationResult } from "@/features/search_page/types/search_page_types";
import { getAllPageThumbs } from "@/app/layout/content_thumbs";
import { navigationDelta } from "@/utils/navigation";
import { sleep } from "@/lib/async/timing";

let initialPageNumber: number;
let currentPageNumber: number;
let baseUrl: string;
let initialSearchPage: SearchPage;

export function setup(): void {
  initialPageNumber = SearchPageUrlContext.initialPageNumber();
  baseUrl = SearchPageUrlContext.baseUrl();
  currentPageNumber = initialPageNumber;
  initialSearchPage = new SearchPage(initialPageNumber, Array.from(getAllPageThumbs()), document.getElementById("paginator"));
  SearchPageLoader.markLoaded(initialPageNumber, initialSearchPage);
  SearchPageLoader.preloadAround(baseUrl, currentPageNumber);
}

export function navigate(direction: NavigationKey): SearchPageNavigationResult {
  const nextPageNumber = currentPageNumber + navigationDelta(direction);

  if (nextPageNumber < 0) {
    return { searchPage: null, boundary: Boundary.Start };
  }
  const searchPage = SearchPageLoader.get(nextPageNumber);

  if (searchPage === undefined || searchPage.isEmpty) {
    SearchPageLoader.reload(baseUrl, nextPageNumber);
    return { searchPage: null, boundary: Boundary.End };
  }
  currentPageNumber = nextPageNumber;
  SearchPageLoader.preloadAround(baseUrl, currentPageNumber);
  return { searchPage, boundary: Boundary.None };
}

export async function getMoreResults(): Promise<HTMLElement[]> {
  const currentSearchPage = SearchPageLoader.get(currentPageNumber);

  if (currentSearchPage === undefined || currentSearchPage.isLast) {
    return [];
  }
  currentPageNumber += 1;
  let nextSearchPage: SearchPage | undefined;

  for (let attempts = 0; attempts < Rule34NetworkConfig.searchPageFetchRetries; attempts += 1) {
    await SearchPageLoader.load(baseUrl, currentPageNumber);
    nextSearchPage = SearchPageLoader.get(currentPageNumber);

    if (nextSearchPage !== undefined) {
      break;
    }
    await sleep(Rule34NetworkConfig.searchPageFetchRetryDelay);
  }

  if (nextSearchPage === undefined) {
    console.error(`Could not load next search page ${currentPageNumber}`);
    return [];
  }
  SearchPageLoader.load(baseUrl, currentPageNumber + 1);
  return nextSearchPage.thumbs;
}

export function getInitialSearchPage(): SearchPage {
  return initialSearchPage;
}

export function resetCurrentPageNumber(): void {
  currentPageNumber = initialPageNumber;
}

export { allThumbs } from "@/features/search_page/model/page_loader";
