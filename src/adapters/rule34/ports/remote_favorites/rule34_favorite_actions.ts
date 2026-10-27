import { buildRule34AddFavoriteUrl, buildRule34PostVoteUrl, buildRule34RemoveFavoriteUrl } from "@/adapters/rule34/client/rule34_url_builder";
import { Rule34Fetch, sendOkRule34Request, sendRule34Request } from "@/adapters/rule34/client/rule34_fetch";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Retry } from "@/core/utils/async/retry";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { isRetryableRule34Error } from "@/adapters/rule34/client/rule34_error";

type Rule34AddFavoriteAnswer = "error" | "alreadyAdded" | "loggedOut" | "added";

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

export class Rule34FavoriteActions {
  private readonly addLimiter: RateLimiter;
  private readonly removeLimiter: RateLimiter;
  private readonly removeRetry: Retry;
  private readonly intents = new Map<string, Intent>();

  constructor(private readonly dependencies: Rule34FavoriteActionsDependencies) {
    this.addLimiter = new RateLimiter(ADD_RATE_LIMIT, dependencies.scheduler);
    this.removeLimiter = new RateLimiter(REMOVE_RATE_LIMIT, dependencies.scheduler);
    this.removeRetry = new Retry({ attempts: REMOVE_ATTEMPTS, baseDelay: REMOVE_RETRY_DELAY }, {
      scheduler: dependencies.scheduler,
      randomSource: dependencies.randomSource,
      isRetryable: isRetryableRule34Error
    });
  }

  public add(id: string): Promise<Rule34AddFavoriteAnswer | null> {
    this.intents.set(id, "add");
    return this.addLimiter.run(async() => {
      if (!this.claimIntent(id, "add")) {
        return null;
      }
      sendRule34Request(this.dependencies.fetch, buildRule34PostVoteUrl(id)).catch(() => { });
      const answer = await (await sendOkRule34Request(this.dependencies.fetch, buildRule34AddFavoriteUrl(id))).text();
      return ADD_ANSWERS[parseInt(answer, 10)] ?? "error";
    });
  }

  public remove(id: string): Promise<boolean> {
    this.intents.set(id, "remove");
    return this.removeLimiter.run(async() => {
      if (!this.claimIntent(id, "remove")) {
        return false;
      }
      await this.removeRetry.retry(() => sendRule34Request(this.dependencies.fetch, buildRule34RemoveFavoriteUrl(id), { redirect: "manual" }));
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
