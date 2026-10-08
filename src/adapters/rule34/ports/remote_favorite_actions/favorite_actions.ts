import { BASE_INDEX_URL, ORIGIN } from "@/adapters/rule34/client/urls";
import { Rule34Fetch, request, send } from "@/adapters/rule34/client/request";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { isTransient } from "@/adapters/rule34/client/error";
import { retry } from "@/core/utils/async/retry";

export type Rule34AddFavoriteAnswer = "error" | "alreadyAdded" | "loggedOut" | "added";

export interface Rule34FavoriteActionsDependencies {
  fetch: Rule34Fetch;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

type Intent = "add" | "remove";

const ADD_RATE_LIMIT = { concurrency: 1, ratePerSecond: 5 };
const REMOVE_RATE_LIMIT = { concurrency: 1, ratePerSecond: 1 };
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
  private readonly addLimiter: RateLimiter;
  private readonly removeLimiter: RateLimiter;
  private readonly intents = new Map<string, Intent>();

  constructor(private readonly dependencies: Rule34FavoriteActionsDependencies) {
    this.addLimiter = new RateLimiter(ADD_RATE_LIMIT, dependencies.scheduler);
    this.removeLimiter = new RateLimiter(REMOVE_RATE_LIMIT, dependencies.scheduler);
  }

  public add(id: string): Promise<Rule34AddFavoriteAnswer | null> {
    this.intents.set(id, "add");
    return this.addLimiter.run(async() => {
      if (!this.claimIntent(id, "add")) {
        return null;
      }
      send(this.dependencies.fetch, postVoteUrl(id)).catch(() => { });
      const answer = await (await request(this.dependencies.fetch, addFavoriteUrl(id))).text();
      return ADD_ANSWERS[parseInt(answer, 10)] ?? "error";
    });
  }

  public remove(id: string): Promise<boolean> {
    this.intents.set(id, "remove");
    return this.removeLimiter.run(async() => {
      if (!this.claimIntent(id, "remove")) {
        return false;
      }
      await retry(() => send(this.dependencies.fetch, removeFavoriteUrl(id), { redirect: "manual" }), {
        attempts: REMOVE_ATTEMPTS,
        baseDelay: REMOVE_RETRY_DELAY,
        scheduler: this.dependencies.scheduler,
        randomSource: this.dependencies.randomSource,
        isRetryable: isTransient
      });
      return true;
    });
  }

  private claimIntent(id: string, intent: Intent): boolean {
    if (this.intents.get(id) !== intent) {
      return false;
    }
    this.intents.delete(id);
    return true;
  }
}
