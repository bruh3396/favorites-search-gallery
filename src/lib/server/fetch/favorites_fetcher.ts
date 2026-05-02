import { FavoriteRemoveQueue, favoriteAddQueue, favoritesPageLimiter } from "./rate_limiter";
import { buildAddFavoriteURL, buildPostVoteURL, buildRemoveFavoriteURL } from "../url/action_url_builder";
import { buildFavoritesPageURL, buildProfilePageURL } from "../url/page_url_builder";
import { fetch429, fetch429NTimes, fetchHtml } from "../http/http_client";
import { AddFavoriteStatus } from "../../../types/favorite";
import { ON_SEARCH_PAGE } from "../../environment/environment";
import { extractFavoritesCount } from "../parse/profile_page_parser";
import { extractFavoritesPageCount } from "../parse/favorites_page_parser";

export function fetchFavoritesPage(pageNumber: number): Promise<string> {
  return fetchHtml(buildFavoritesPageURL(pageNumber));
}

export function fetchFavoritesPageSafe(pageNumber: number): Promise<string> {
  return favoritesPageLimiter.run(() => {
    return fetchFavoritesPage(pageNumber);
  });
}

export async function addFavorite(id: string): Promise<AddFavoriteStatus> {
  FavoriteRemoveQueue.cancel(id);

  if (!await favoriteAddQueue.wait(id)) {
    return AddFavoriteStatus.ERROR;
  }

  if (ON_SEARCH_PAGE) {
    fetch429(buildPostVoteURL(id));
  }
  const status = await fetchHtml(buildAddFavoriteURL(id));
  return parseInt(status);
}

export async function removeFavorite(id: string): Promise<void> {
  favoriteAddQueue.cancel(id);

  if (await FavoriteRemoveQueue.wait(id)) {
    fetch429NTimes(buildRemoveFavoriteURL(id), { method: "GET", redirect: "manual" }, 3);
  }
}

export function fetchFavoritesCount(id: string): Promise<number | null> {
  return fetchHtml(buildProfilePageURL(id)).then(extractFavoritesCount).catch(null);
}

export function fetchFavoritesPageCount(): Promise<number | null> {
  return fetchHtml(buildFavoritesPageURL(0)).then(extractFavoritesPageCount);
}
