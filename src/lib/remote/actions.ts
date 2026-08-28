import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";
import { addFavoriteUrl, postListUrlFromQuery, postPageUrl, postVoteUrl, removeFavoriteUrl } from "@/lib/remote/url";
import { ON_POST_LIST_PAGE } from "@/lib/environment";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { ThrottleQueue } from "@/lib/async/rate_limiting";
import { fetchHtml } from "@/utils/browser/http";
import { resolveMediaUrl } from "@/lib/media/resolver";
import { toMediaItem } from "@/lib/thumb/media_item";
import { withExponentialBackoff } from "@/lib/async/scheduling";

const favoriteAddThrottle = new ThrottleQueue(Rule34NetworkConfig.favoriteAddThrottle);
const favoriteRemoveThrottle = new ThrottleQueue(Rule34NetworkConfig.favoriteRemoveThrottle);

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
    fetch(postVoteUrl(id));
  }
  const status = await fetchHtml(addFavoriteUrl(id));
  return SERVER_ADD_STATUS[parseInt(status, 10)] ?? "error";
}

export async function removeFavorite(id: string): Promise<RemoveFavoriteStatus> {
  favoriteAddThrottle.cancel(id);

  if (await favoriteRemoveThrottle.wait(id)) {
    await withExponentialBackoff(
      () => fetch(removeFavoriteUrl(id), { method: "GET", redirect: "manual" }),
      Rule34NetworkConfig.favoriteRemoveRetries,
      Rule34NetworkConfig.favoriteRemoveRetryDelay
    );
    return "success";
  }
  return "error";
}

export function openPost(id: string): void {
  window.open(postPageUrl(id), "_blank");
}

export function openPostList(searchQuery: string): void {
  window.open(postListUrlFromQuery(searchQuery));
}

export async function openMedia(thumb: HTMLElement): Promise<void> {
  window.open(await resolveMediaUrl(toMediaItem(thumb)), "_blank");
}
