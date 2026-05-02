import * as FavoritesAPI from "../../../../lib/server/fetch/favorites_fetcher";
import { FAVORITES_PER_PAGE } from "../../../../lib/environment/constants";
import { FavoritesPageRequest } from "./favorites_page_request";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { extractFavoriteElements } from "../../../../lib/server/parse/favorites_page_parser";
import { getIdFromThumb } from "../../../../lib/dom/thumb";
import { sleep } from "../../../../lib/core/scheduling/promise";

const isEmptyPage = (elements: HTMLElement[]): boolean => elements.length === 0;
const isLastPage = (elements: HTMLElement[]): boolean => elements.length < FAVORITES_PER_PAGE;

async function fetchNewFavoritesFromPage(storedIds: Set<string>, pageNumber: number, allNewElements: HTMLElement[]): Promise<boolean> {
  const html = await FavoritesAPI.fetchFavoritesPage(new FavoritesPageRequest(pageNumber).realPageNumber);
  const newElements = extractFavoriteElements(html).filter(element => !storedIds.has(getIdFromThumb(element)));

  if (isEmptyPage(newElements)) {
    return false;
  }
  allNewElements.push(...newElements);
  return !isLastPage(newElements);
}

export async function fetchNewFavorites(storedIds: Set<string>): Promise<HTMLElement[]> {
  await sleep(FavoritesSettings.reloadFetchDelay);
  const allNewElements: HTMLElement[] = [];
  let pageNumber = 0;

  while (await fetchNewFavoritesFromPage(storedIds, pageNumber, allNewElements)) {
    pageNumber += 1;
    await sleep(FavoritesSettings.favoritesPageFetchDelay);
  }
  return allNewElements;
}
