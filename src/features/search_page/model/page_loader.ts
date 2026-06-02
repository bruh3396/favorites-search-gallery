import * as SearchPageCache from "./page_cache";
import { RAW_THUMB_CLASS_NAME } from "../../../lib/thumb/thumbs";
import { Rule34NetworkConfig } from "../../../config/rule34_network_config";
import { SearchPage } from "../types/search_page";
import { fetchSearchPage } from "../../../lib/remote/rule34/search_page_fetcher";
import { numbersAroundInRange } from "../../../utils/number";
import { parseHtml } from "../../../utils/dom/html_parser";
import { prepareSearchPageThumbs } from "../dom_tweaks/thumb_preparer";

export function load(baseUrl: string, pageNumber: number): Promise<void> {
  if (SearchPageCache.has(pageNumber) || pageNumber < 0) {
    return Promise.resolve();
  }
  SearchPageCache.markLoading(pageNumber);
  return fetchSearchPage(baseUrl, pageNumber)
    .then((html: string) => {
      SearchPageCache.markLoaded(pageNumber, createSearchPageFromHtml(pageNumber, html));
    }).catch(() => {
      SearchPageCache.remove(pageNumber);
    });
}

export function preloadAround(baseUrl: string, currentPageNumber: number): void {
  numbersAroundInRange(currentPageNumber, Rule34NetworkConfig.searchPagePrefetchLength).forEach(n => load(baseUrl, n));
}

export function createSearchPageFromHtml(pageNumber: number, html: string): SearchPage {
  const dom = parseHtml(html);
  const thumbs = prepareSearchPageThumbs(Array.from(dom.querySelectorAll(`.${RAW_THUMB_CLASS_NAME}`)));
  const paginator = dom.getElementById("paginator");
  return new SearchPage(pageNumber, thumbs, paginator);
}

export function reload(baseUrl: string, pageNumber: number): Promise<void> {
  SearchPageCache.remove(pageNumber);
  return load(baseUrl, pageNumber);
}

export { get, allThumbs, markLoaded } from "./page_cache";
