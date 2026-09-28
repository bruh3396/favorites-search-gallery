import { BASE_INDEX_URL, ORIGIN } from "@/adapters/rule34/client/site";
import { Rule34NetworkConfig } from "@/adapters/rule34/client/network_config";
import { ThrottleQueue } from "@/lib/async/rate_limiting";
import { fetchHtml } from "@/utils/browser/http";
import { withExponentialBackoff } from "@/lib/async/scheduling";

export function addFavoriteUrl(id: string): string {
  return `${ORIGIN}/public/addfav.php?id=${id}`;
}

export function postVoteUrl(id: string): string {
  return `${BASE_INDEX_URL}post&s=vote&type=up&id=${id}`;
}

export function removeFavoriteUrl(id: string): string {
  return `${BASE_INDEX_URL}favorites&s=delete&id=${id}`;
}

export class FavoriteActions {
  private readonly addThrottle = new ThrottleQueue(Rule34NetworkConfig.favoriteAddThrottle);
  private readonly removeThrottle = new ThrottleQueue(Rule34NetworkConfig.favoriteRemoveThrottle);

  public async add(id: string): Promise<string | null> {
    this.removeThrottle.cancel(id);

    if (!await this.addThrottle.wait(id)) {
      return null;
    }
    fetch(postVoteUrl(id));
    return fetchHtml(addFavoriteUrl(id));
  }

  public async remove(id: string): Promise<boolean> {
    this.addThrottle.cancel(id);

    if (!await this.removeThrottle.wait(id)) {
      return false;
    }
    await withExponentialBackoff(
      () => fetch(removeFavoriteUrl(id), { method: "GET", redirect: "manual" }),
      Rule34NetworkConfig.favoriteRemoveRetries,
      Rule34NetworkConfig.favoriteRemoveRetryDelay
    );
    return true;
  }
}
