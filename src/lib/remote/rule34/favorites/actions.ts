import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";
import { buildAddFavoriteUrl, buildPostVoteUrl, buildRemoveFavoriteUrl } from "@/lib/remote/url/action_url_builder";
import { favoriteAddThrottle, favoriteRemoveThrottle } from "@/lib/remote/http/rate_limiters";
import { ON_POST_LIST_PAGE } from "@/lib/environment";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { fetchHtml } from "@/lib/remote/http/client";
import { withExponentialBackoff } from "@/lib/async/async";

const SERVER_ADD_STATUS: Record<number, AddFavoriteStatus> = {
  0: "error",
  1: "alreadyAdded",
  2: "loggedOut",
  3: "success"
};

export async function addFavorite(id: string): Promise<AddFavoriteStatus> {
  favoriteRemoveThrottle.cancel(id);

  if (!await favoriteAddThrottle.wait(id)) {
    return "error";
  }

  if (ON_POST_LIST_PAGE) {
    fetch(buildPostVoteUrl(id));
  }
  const status = await fetchHtml(buildAddFavoriteUrl(id));
  return SERVER_ADD_STATUS[parseInt(status, 10)] ?? "error";
}

export async function removeFavorite(id: string): Promise<RemoveFavoriteStatus> {
  favoriteAddThrottle.cancel(id);

  if (await favoriteRemoveThrottle.wait(id)) {
    await withExponentialBackoff(
      () => fetch(buildRemoveFavoriteUrl(id), { method: "GET", redirect: "manual" }),
      Rule34NetworkConfig.favoriteRemoveRetries,
      Rule34NetworkConfig.favoriteRemoveRetryDelay
    );
    return "success";
  }
  return "error";
}
