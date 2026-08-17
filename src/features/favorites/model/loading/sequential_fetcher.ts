import { sleep, withExponentialBackoff } from "@/lib/async/async";
import { FAVORITES_PER_PAGE } from "@/lib/rule34_constants";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesPageRequest } from "@/features/favorites/types/favorites_page_request";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { extractFavoriteElements } from "@/lib/remote/parsers/favorites_page";
import { fetchFavoritesPage } from "@/lib/remote/rule34/favorites/page";
import { parseIdFromThumb } from "@/lib/thumb/thumbs";

export async function fetchNewFavorites(storedIds: Set<string>, firstPageFavorites?: HTMLElement[]): Promise<HTMLElement[]> {
  const allNewFavorites: HTMLElement[] = [];
  let pageNumber = 0;

  if (FavoritesConfig.skipFirstPageFetch && firstPageFavorites !== undefined) {
    const newFavorites = firstPageFavorites.filter(element => !storedIds.has(parseIdFromThumb(element)));

    allNewFavorites.push(...newFavorites);

    if (newFavorites.length < FAVORITES_PER_PAGE) {
      return allNewFavorites;
    }
    pageNumber = 1;
  }

  while (await fetchNewFavoritesFromPage(storedIds, pageNumber, allNewFavorites)) {
    pageNumber += 1;
    await sleep(Rule34NetworkConfig.favoritesPageFetchDelay);
  }
  return allNewFavorites;
}

async function fetchNewFavoritesFromPage(storedIds: Set<string>, pageNumber: number, allNewFavorites: HTMLElement[]): Promise<boolean> {
  const html = await withExponentialBackoff(() => fetchFavoritesPageHtml(pageNumber), Rule34NetworkConfig.favoritesPageFetchRetries);
  const newFavorites = extractFavoriteElements(html).filter(element => !storedIds.has(parseIdFromThumb(element)));

  allNewFavorites.push(...newFavorites);
  return newFavorites.length === FAVORITES_PER_PAGE;
}

function fetchFavoritesPageHtml(pageNumber: number): Promise<string> {
  return fetchFavoritesPage(new FavoritesPageRequest(pageNumber).realPageNumber);
}
