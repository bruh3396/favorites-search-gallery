import { CoalescingResolver } from "@/core/utils/async/coalescing";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { RateLimiterConfig } from "@/types/async";

export interface Scheduler {
  schedule: (task: () => void, delay: number) => () => void;
}

const BATCH_SIZE = 50;
const FLUSH_TIMEOUT = 2000;

export class RateLimitedResolver<V> extends CoalescingResolver<string, V> {
  constructor(rateLimit: RateLimiterConfig, resolve: (keys: string[]) => Promise<Map<string, V>>, scheduler: Scheduler) {
    const limiter = new RateLimiter(rateLimit);

    super(BATCH_SIZE, FLUSH_TIMEOUT, keys => limiter.run(() => resolve(keys)).then(answers => requireEveryKey(keys, answers)), scheduler);
  }
}

function requireEveryKey<V>(keys: string[], answers: Map<string, V>): Map<string, V> {
  const missing = keys.filter(key => !answers.has(key));

  if (missing.length > 0) {
    throw new Error(`Unanswered keys: ${missing.join(", ")}`);
  }
  return answers;
}
