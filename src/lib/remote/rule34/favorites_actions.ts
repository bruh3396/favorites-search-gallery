import { buildAddFavoriteURL, buildPostVoteURL, buildRemoveFavoriteURL } from "../url/action_url_builder";
import { favoriteAddQueue, favoriteRemoveQueue } from "../http/rate_limiter";
import { AddFavoriteStatus } from "../../../types/favorite";
import { ON_SEARCH_PAGE } from "../../environment/environment";
import { fetchHtml } from "../http/http_client";
import { withExponentialBackoff } from "../../core/scheduling/promise";

export async function addFavorite(id: string): Promise<AddFavoriteStatus> {
  favoriteRemoveQueue.cancel(id);

  if (!await favoriteAddQueue.wait(id)) {
    return AddFavoriteStatus.ERROR;
  }

  if (ON_SEARCH_PAGE) {
    fetch(buildPostVoteURL(id));
  }
  const status = await fetchHtml(buildAddFavoriteURL(id));
  return parseInt(status, 10);
}

export async function removeFavorite(id: string): Promise<void> {
  favoriteAddQueue.cancel(id);

  if (await favoriteRemoveQueue.wait(id)) {
    await withExponentialBackoff(() => fetch(buildRemoveFavoriteURL(id), { method: "GET", redirect: "manual" }), 3, 250);
  }
}
