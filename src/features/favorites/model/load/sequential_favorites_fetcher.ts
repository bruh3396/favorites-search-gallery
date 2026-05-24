import * as FavoritesApi from "../../../../lib/remote/rule34/favorites_fetcher";
import { sleep, withExponentialBackoff } from "../../../../lib/async/timing";
import { FavoritesConfig } from "../../../../config/favorites_config";
import { FavoritesPageRequest } from "../../types/favorites_page_request";
import { Rule34NetworkConfig } from "../../../../config/rule34_network_config";
import { extractFavoriteElements } from "../../../../lib/remote/parse/favorites_page_parser";
import { getIdFromThumb } from "../../../../lib/thumb/thumbs";

export async function fetchNewFavorites(storedIds: Set<string>): Promise<HTMLElement[]> {
  await sleep(FavoritesConfig.reloadFetchDelay);
  const allNewElements: HTMLElement[] = [];
  let pageNumber = 0;

  while (await fetchNewFavoritesFromPage(storedIds, pageNumber, allNewElements)) {
    pageNumber += 1;
    await sleep(Rule34NetworkConfig.favoritesPageFetchDelay);
  }
  return allNewElements;
}

async function fetchNewFavoritesFromPage(storedIds: Set<string>, pageNumber: number, allNewElements: HTMLElement[]): Promise<boolean> {
  const html = await withExponentialBackoff(() => fetchFavoritesPageHtml(pageNumber), Rule34NetworkConfig.favoritesPageFetchRetries);
  const newElements = extractFavoriteElements(html).filter(element => !storedIds.has(getIdFromThumb(element)));

  if (newElements.length === 0) {
    return false;
  }
  allNewElements.push(...newElements);
  return true;
}

function fetchFavoritesPageHtml(pageNumber: number): Promise<string> {
  return FavoritesApi.fetchFavoritesPage(new FavoritesPageRequest(pageNumber).realPageNumber);
}
