import { RULE34_URLS } from "@/adapters/rule34/client/rule34_urls";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { RemoteFavoriteAddResult } from "@/core/boundary/ports/remote_favorites/remote_favorite_add_result";
import { Retry } from "@/core/utils/async/retry";
import { Rule34Fetch } from "@/adapters/rule34/client/rule34_fetch";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { createExponentialBackoff } from "@/core/utils/async/exponential_backoff";
import { isRetryableRule34Error } from "@/adapters/rule34/client/rule34_error";
import { sendRule34Request } from "@/adapters/rule34/client/rule34_request_sender";

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
const ADD_ANSWERS: Record<number, RemoteFavoriteAddResult> = {
  0: "failed",
  1: "added",
  2: "loggedOut",
  3: "added"
};

export class Rule34FavoriteActions {
  private readonly addRateLimiter: RateLimiter;
  private readonly removeRateLimiter: RateLimiter;
  private readonly removeRetry: Retry;
  private readonly intents = new Map<string, Intent>();

  constructor(private readonly dependencies: Rule34FavoriteActionsDependencies) {
    this.addRateLimiter = new RateLimiter(ADD_RATE_LIMIT, dependencies.scheduler);
    this.removeRateLimiter = new RateLimiter(REMOVE_RATE_LIMIT, dependencies.scheduler);
    this.removeRetry = new Retry({ attempts: REMOVE_ATTEMPTS }, {
      scheduler: dependencies.scheduler,
      computeDelay: createExponentialBackoff({ baseDelay: REMOVE_RETRY_DELAY }, dependencies.randomSource),
      isRetryable: isRetryableRule34Error
    });
  }

  public add(postId: string): Promise<RemoteFavoriteAddResult> {
    this.intents.set(postId, "add");
    return this.addRateLimiter.run(async() => {
      if (!this.claimIntent(postId, "add")) {
        return "failed";
      }
      sendRule34Request(this.dependencies.fetch, RULE34_URLS.postVote(postId)).catch(() => { });
      const answer = await (await sendRule34Request(this.dependencies.fetch, RULE34_URLS.addFavorite(postId))).text();
      return ADD_ANSWERS[parseInt(answer, 10)] ?? "failed";
    });
  }

  public remove(postId: string): Promise<boolean> {
    this.intents.set(postId, "remove");
    return this.removeRateLimiter.run(async() => {
      if (!this.claimIntent(postId, "remove")) {
        return false;
      }
      await this.removeRetry.retry(() => sendRule34Request(this.dependencies.fetch, RULE34_URLS.removeFavorite(postId), { redirect: "manual", throwsHttpErrors: false }));
      return true;
    });
  }

  private claimIntent(postId: string, intent: Intent): boolean {
    if (this.intents.get(postId) !== intent) {
      return false;
    }
    this.intents.delete(postId);
    return true;
  }
}
