import { BASE_INDEX_URL } from "@/adapters/rule34/client/site/index_url";
import { ORIGIN } from "@/adapters/rule34/client/hosts";
import { ThrottleQueue } from "@/lib/async/rate_limiting";
import { fetchHtml } from "@/utils/browser/http";
import { withExponentialBackoff } from "@/lib/async/scheduling";

const ADD_THROTTLE = 200;
const REMOVE_THROTTLE = 1_000;
const REMOVE_ATTEMPTS = 3;
const REMOVE_RETRY_DELAY = 500;

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
  private readonly addThrottle = new ThrottleQueue(ADD_THROTTLE);
  private readonly removeThrottle = new ThrottleQueue(REMOVE_THROTTLE);

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
      REMOVE_ATTEMPTS,
      REMOVE_RETRY_DELAY
    );
    return true;
  }
}
