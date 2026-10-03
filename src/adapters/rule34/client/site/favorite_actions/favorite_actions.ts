import { Rule34Fetch, request, send } from "@/adapters/rule34/client/request";
import { BASE_INDEX_URL } from "@/adapters/rule34/client/site/index_url";
import { ORIGIN } from "@/adapters/rule34/client/hosts";
import { Random } from "@/core/boundary/ports/random";
import { Scheduler } from "@/core/boundary/ports/scheduler";
import { ThrottleQueue } from "@/lib/async/rate_limiting";
import { isTransient } from "@/adapters/rule34/client/error";
import { retry } from "@/core/utils/async/retry";

export type Rule34AddFavoriteAnswer = "error" | "alreadyAdded" | "loggedOut" | "added";

export interface Rule34FavoriteActionsDependencies {
  fetch: Rule34Fetch;
  scheduler: Scheduler;
  random: Random;
}

const ADD_THROTTLE = 200;
const REMOVE_THROTTLE = 1_000;
const REMOVE_ATTEMPTS = 3;
const REMOVE_RETRY_DELAY = 500;
const ADD_ANSWERS: Record<number, Rule34AddFavoriteAnswer> = {
  0: "error",
  1: "alreadyAdded",
  2: "loggedOut",
  3: "added"
};

export function addFavoriteUrl(id: string): string {
  return `${ORIGIN}/public/addfav.php?id=${id}`;
}

export function postVoteUrl(id: string): string {
  return `${BASE_INDEX_URL}post&s=vote&type=up&id=${id}`;
}

export function removeFavoriteUrl(id: string): string {
  return `${BASE_INDEX_URL}favorites&s=delete&id=${id}`;
}

export class Rule34FavoriteActions {
  private readonly addThrottle = new ThrottleQueue(ADD_THROTTLE);
  private readonly removeThrottle = new ThrottleQueue(REMOVE_THROTTLE);

  constructor(private readonly dependencies: Rule34FavoriteActionsDependencies) { }

  public async add(id: string): Promise<Rule34AddFavoriteAnswer | null> {
    this.removeThrottle.cancel(id);

    if (!await this.addThrottle.wait(id)) {
      return null;
    }
    send(this.dependencies.fetch, postVoteUrl(id)).catch(() => { });
    const answer = await (await request(this.dependencies.fetch, addFavoriteUrl(id))).text();
    return ADD_ANSWERS[parseInt(answer, 10)] ?? "error";
  }

  public async remove(id: string): Promise<boolean> {
    this.addThrottle.cancel(id);

    if (!await this.removeThrottle.wait(id)) {
      return false;
    }
    await retry(() => send(this.dependencies.fetch, removeFavoriteUrl(id), { redirect: "manual" }), {
      attempts: REMOVE_ATTEMPTS,
      baseDelay: REMOVE_RETRY_DELAY,
      scheduler: this.dependencies.scheduler,
      random: this.dependencies.random,
      isRetryable: isTransient
    });
    return true;
  }
}
