import * as FavoritesAPI from "../../../../lib/server/fetch/favorites_fetcher";
import { FAVORITES_PER_PAGE } from "../../../../lib/environment/constants";
import { FavoriteItem } from "../../type/favorite_item";
import { FavoritesPageRequest } from "./favorites_page_request";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { extractFavoriteElements } from "../../../../lib/server/parse/favorites_page_parser";
import { populateFavoritesMetadata } from "../../type/favorite_metadata";
import { sleep } from "../../../../lib/core/scheduling/promise";

const isEmptyPage = (favorites: FavoriteItem[]): boolean => favorites.length === 0;
const isLastPage = (favorites: FavoriteItem[]): boolean => favorites.length < FAVORITES_PER_PAGE;

async function fetchNewFavoritesFromPage(storedIds: Set<string>, pageNumber: number, allNewFavorites: FavoriteItem[]): Promise<boolean> {
  const html = await FavoritesAPI.fetchFavoritesPage(new FavoritesPageRequest(pageNumber).realPageNumber);
  const newFavorites = extractFavoriteElements(html)
    .map(element => new FavoriteItem(element))
    .filter(favorite => !storedIds.has(favorite.id));

  if (isEmptyPage(newFavorites)) {
    return false;
  }
  populateFavoritesMetadata(newFavorites);
  allNewFavorites.push(...newFavorites);
  return !isLastPage(newFavorites);
}

export async function fetchNewFavoritesOnReload(storedIds: Set<string>): Promise<FavoriteItem[]> {
  await sleep(FavoritesSettings.reloadFetchDelay);
  const allNewFavorites: FavoriteItem[] = [];
  let pageNumber = 0;

  while (await fetchNewFavoritesFromPage(storedIds, pageNumber, allNewFavorites)) {
    pageNumber += 1;
    await sleep(FavoritesSettings.favoritesPageFetchDelay);
  }
  return allNewFavorites;
}
